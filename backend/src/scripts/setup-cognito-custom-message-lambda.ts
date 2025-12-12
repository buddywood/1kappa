import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  UpdateUserPoolCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  LambdaClient,
  CreateFunctionCommand,
  GetFunctionCommand,
  UpdateFunctionCodeCommand,
  AddPermissionCommand,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const AWS_REGION =
  process.env.COGNITO_REGION || process.env.AWS_REGION || "us-east-1";

// Use AWS_PROFILE if set, otherwise use explicit credentials if available
// The AWS SDK will automatically use the profile from AWS_PROFILE environment variable
const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
  // Only use explicit credentials if AWS_PROFILE is not set
  credentials:
    !process.env.AWS_PROFILE &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const lambdaClient = new LambdaClient({
  region: AWS_REGION,
  // Only use explicit credentials if AWS_PROFILE is not set
  credentials:
    !process.env.AWS_PROFILE &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const stsClient = new STSClient({
  region: AWS_REGION,
  // Only use explicit credentials if AWS_PROFILE is not set
  credentials:
    !process.env.AWS_PROFILE &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
const LAMBDA_FUNCTION_NAME =
  process.env.COGNITO_CUSTOM_MESSAGE_LAMBDA_NAME ||
  "1kappa-cognito-custom-message";
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  "https://one-kappa.com";

async function setupCustomMessageLambda() {
  try {
    if (!COGNITO_USER_POOL_ID) {
      console.error("❌ COGNITO_USER_POOL_ID is not set");
      console.log("\nPlease set it in your .env.local file:");
      console.log("  COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx");
      process.exit(1);
    }

    console.log("🚀 Setting up Cognito Custom Message Lambda Trigger\n");
    console.log("📋 Configuration:");
    console.log(`  User Pool ID: ${COGNITO_USER_POOL_ID}`);
    console.log(`  Lambda Function Name: ${LAMBDA_FUNCTION_NAME}`);
    console.log(`  AWS Region: ${AWS_REGION}`);
    console.log(`  Frontend URL: ${FRONTEND_URL}\n`);

    // Read Lambda function code
    const lambdaCodePath = join(
      __dirname,
      "../lambda/cognito-custom-message/index.js"
    );
    let lambdaCode: string;
    try {
      lambdaCode = readFileSync(lambdaCodePath, "utf-8");
    } catch (error: any) {
      console.error(`❌ Error reading Lambda function code: ${error.message}`);
      console.log(`   Expected path: ${lambdaCodePath}`);
      process.exit(1);
    }

    // Create deployment package (zip file)
    console.log("📦 Creating Lambda deployment package...");
    const lambdaDir = join(__dirname, "../lambda/cognito-custom-message");
    const zipPath = join(lambdaDir, "function.zip");
    const indexPath = join(lambdaDir, "index.js");

    // Ensure the Lambda code file exists
    if (!existsSync(indexPath)) {
      throw new Error(`Lambda function code not found at ${indexPath}`);
    }

    // Create zip file using zip command (available on macOS/Linux)
    try {
      const zipCommand = `cd "${lambdaDir}" && zip -q function.zip index.js`;
      execSync(zipCommand);
      console.log("✅ Deployment package created\n");
    } catch (error: any) {
      console.error("❌ Error creating zip file:", error.message);
      console.log("\n💡 Alternative: Create the zip file manually:");
      console.log(`   1. cd ${lambdaDir}`);
      console.log("   2. zip function.zip index.js");
      console.log("   3. Then run this script again\n");
      throw error;
    }

    // Read the zip file
    const zipBuffer = readFileSync(zipPath);

    // Create or update Lambda function
    console.log("📦 Creating/updating Lambda function...");
    let lambdaArn: string;

    try {
      // Check if function exists
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
      });
      const existingFunction = await lambdaClient.send(getFunctionCommand);
      lambdaArn = existingFunction.Configuration?.FunctionArn || "";

      console.log("✅ Lambda function exists, updating code...");
      const updateCommand = new UpdateFunctionCodeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        ZipFile: zipBuffer,
      });
      await lambdaClient.send(updateCommand);
      console.log("✅ Lambda function code updated!\n");
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        console.log("📝 Lambda function doesn't exist, creating new one...");

        if (!process.env.LAMBDA_EXECUTION_ROLE_ARN) {
          console.error(
            "\n❌ LAMBDA_EXECUTION_ROLE_ARN is required to create a new Lambda function"
          );
          console.log(
            "\n💡 You need to create an IAM role for Lambda execution first:"
          );
          console.log(
            "   1. Go to IAM Console → Roles → Create role → AWS service → Lambda"
          );
          console.log("   2. Attach policy: AWSLambdaBasicExecutionRole");
          console.log("   3. Create role and copy the ARN");
          console.log(
            "   4. Set LAMBDA_EXECUTION_ROLE_ARN in your .env.local file\n"
          );
          throw new Error("LAMBDA_EXECUTION_ROLE_ARN not set");
        }

        // Create the function
        const createCommand = new CreateFunctionCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Runtime: "nodejs20.x",
          Role: process.env.LAMBDA_EXECUTION_ROLE_ARN,
          Handler: "index.handler",
          Code: {
            ZipFile: zipBuffer,
          },
          Description:
            "Custom message trigger for Cognito to customize email templates",
          Environment: {
            Variables: {
              FRONTEND_URL: FRONTEND_URL,
            },
          },
          Timeout: 10,
          MemorySize: 128,
        });

        const newFunction = await lambdaClient.send(createCommand);
        lambdaArn = newFunction.FunctionArn || "";

        console.log("✅ Lambda function created successfully!");
      } else {
        throw error;
      }
    }

    // Clean up zip file
    try {
      unlinkSync(zipPath);
    } catch (error) {
      // Ignore cleanup errors
    }

    if (!lambdaArn) {
      throw new Error("Failed to get Lambda function ARN");
    }

    console.log(`✅ Lambda ARN: ${lambdaArn}\n`);

    // Grant Cognito permission to invoke the Lambda
    console.log("🔐 Granting Cognito permission to invoke Lambda...");
    try {
      // Get AWS Account ID from STS
      const getCallerIdentityCommand = new GetCallerIdentityCommand({});
      const stsResponse = await stsClient.send(getCallerIdentityCommand);
      const accountId = stsResponse.Account;

      if (!accountId) {
        throw new Error("Could not determine AWS Account ID");
      }

      const addPermissionCommand = new AddPermissionCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        StatementId: `cognito-${COGNITO_USER_POOL_ID.replace(
          /[^a-zA-Z0-9]/g,
          "-"
        )}`,
        Action: "lambda:InvokeFunction",
        Principal: "cognito-idp.amazonaws.com",
        SourceArn: `arn:aws:cognito-idp:${AWS_REGION}:${accountId}:userpool/${COGNITO_USER_POOL_ID}`,
      });
      await lambdaClient.send(addPermissionCommand);
      console.log("✅ Permission granted!\n");
    } catch (error: any) {
      if (error.name === "ResourceConflictException") {
        console.log("✅ Permission already exists\n");
      } else {
        console.warn(
          `⚠️  Could not add permission automatically: ${error.message}`
        );
        console.log(
          "   You may need to add it manually in the Lambda console\n"
        );
      }
    }

    // Update Cognito User Pool to use the Lambda trigger
    console.log(
      "📧 Updating Cognito User Pool to use Custom Message trigger..."
    );

    const describeCommand = new DescribeUserPoolCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
    });
    const userPoolResponse = await cognitoClient.send(describeCommand);
    const userPool = userPoolResponse.UserPool;

    if (!userPool) {
      throw new Error("User Pool not found");
    }

    const updateCommand = new UpdateUserPoolCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      LambdaConfig: {
        ...userPool.LambdaConfig,
        CustomMessage: lambdaArn,
      },
      // Preserve all other settings
      AutoVerifiedAttributes: userPool.AutoVerifiedAttributes,
      Policies: userPool.Policies,
      EmailConfiguration: userPool.EmailConfiguration,
      SmsConfiguration: userPool.SmsConfiguration,
      UserPoolTags: userPool.UserPoolTags,
      AdminCreateUserConfig: userPool.AdminCreateUserConfig,
      UserPoolAddOns: userPool.UserPoolAddOns,
      VerificationMessageTemplate: userPool.VerificationMessageTemplate,
      MfaConfiguration: userPool.MfaConfiguration,
      DeviceConfiguration: userPool.DeviceConfiguration,
      EmailVerificationMessage: userPool.EmailVerificationMessage,
      EmailVerificationSubject: userPool.EmailVerificationSubject,
      SmsVerificationMessage: userPool.SmsVerificationMessage,
      SmsAuthenticationMessage: userPool.SmsAuthenticationMessage,
      UserAttributeUpdateSettings: userPool.UserAttributeUpdateSettings,
      DeletionProtection: userPool.DeletionProtection,
    });

    await cognitoClient.send(updateCommand);

    console.log("✅ Cognito User Pool updated successfully!\n");

    console.log("📋 Summary:");
    console.log(`   ✅ Lambda function: ${LAMBDA_FUNCTION_NAME}`);
    console.log(`   ✅ Lambda ARN: ${lambdaArn}`);
    console.log(`   ✅ Custom Message trigger configured`);
    console.log(`   ✅ Separate templates for sign-up and password reset\n`);

    console.log("💡 What this enables:");
    console.log("   - Sign-up emails: 'Your 1Kappa Verification Code'");
    console.log("   - Password reset emails: 'Reset Your 1Kappa Password'");
    console.log("   - Both use cream-colored banner/footer (#F7F4E9)");
    console.log("   - Full control over email content\n");

    console.log("🔗 AWS Console Links:");
    console.log(
      `   Lambda: https://console.aws.amazon.com/lambda/home?region=${AWS_REGION}#/functions/${LAMBDA_FUNCTION_NAME}`
    );
    console.log(
      `   Cognito: https://console.aws.amazon.com/cognito/v2/idp/user-pools/${COGNITO_USER_POOL_ID}/triggers\n`
    );

    console.log(
      "✅ Done! Test by registering a new user or requesting a password reset."
    );
  } catch (error: any) {
    console.error("\n❌ Error setting up Lambda trigger:", error.message);

    if (error.name === "NotAuthorizedException") {
      console.error(
        "\n💡 Make sure your AWS credentials have the following permissions:"
      );
      console.error("   - lambda:CreateFunction");
      console.error("   - lambda:UpdateFunctionCode");
      console.error("   - lambda:AddPermission");
      console.error("   - lambda:GetFunction");
      console.error("   - cognito-idp:DescribeUserPool");
      console.error("   - cognito-idp:UpdateUserPool");
    } else if (error.name === "ResourceNotFoundException") {
      console.error("\n💡 Make sure COGNITO_USER_POOL_ID is correct");
    }

    process.exit(1);
  } finally {
    await cognitoClient.destroy();
    await lambdaClient.destroy();
  }
}

setupCustomMessageLambda()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
