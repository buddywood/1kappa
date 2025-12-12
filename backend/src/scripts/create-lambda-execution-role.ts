import {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
  GetRoleCommand,
  PutRolePolicyCommand,
} from "@aws-sdk/client-iam";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const AWS_REGION =
  process.env.COGNITO_REGION || process.env.AWS_REGION || "us-east-1";

const iamClient = new IAMClient({
  region: AWS_REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const ROLE_NAME =
  process.env.LAMBDA_EXECUTION_ROLE_NAME || "1kappa-cognito-lambda-role";

async function createLambdaExecutionRole() {
  try {
    console.log("🚀 Creating IAM Role for Lambda Execution\n");
    console.log("📋 Configuration:");
    console.log(`  Role Name: ${ROLE_NAME}`);
    console.log(`  AWS Region: ${AWS_REGION}\n`);

    // Check if role already exists
    try {
      const getRoleCommand = new GetRoleCommand({ RoleName: ROLE_NAME });
      const existingRole = await iamClient.send(getRoleCommand);
      console.log("✅ IAM Role already exists!");
      console.log(`   Role ARN: ${existingRole.Role?.Arn}\n`);
      console.log("💡 To use this role, add to your .env.local:");
      console.log(`   LAMBDA_EXECUTION_ROLE_ARN=${existingRole.Role?.Arn}\n`);
      return existingRole.Role?.Arn || "";
    } catch (error: any) {
      if (error.name !== "NoSuchEntity") {
        throw error;
      }
      // Role doesn't exist, continue to create it
    }

    console.log("📝 Creating new IAM role...\n");

    // Trust policy that allows Lambda service to assume this role
    const trustPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
          Action: "sts:AssumeRole",
        },
      ],
    };

    // Create the role
    const createRoleCommand = new CreateRoleCommand({
      RoleName: ROLE_NAME,
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: "Execution role for Cognito Custom Message Lambda function",
      Tags: [
        {
          Key: "Purpose",
          Value: "CognitoCustomMessage",
        },
        {
          Key: "ManagedBy",
          Value: "1kappa-automation",
        },
      ],
    });

    const roleResponse = await iamClient.send(createRoleCommand);
    const roleArn = roleResponse.Role?.Arn;

    if (!roleArn) {
      throw new Error("Failed to get role ARN after creation");
    }

    console.log("✅ IAM Role created successfully!");
    console.log(`   Role ARN: ${roleArn}\n`);

    // Attach the basic Lambda execution policy
    console.log(
      "📎 Attaching AWS managed policy: AWSLambdaBasicExecutionRole..."
    );
    const attachPolicyCommand = new AttachRolePolicyCommand({
      RoleName: ROLE_NAME,
      PolicyArn:
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    await iamClient.send(attachPolicyCommand);
    console.log("✅ Policy attached successfully!\n");

    console.log("📋 Summary:");
    console.log(`   ✅ Role Name: ${ROLE_NAME}`);
    console.log(`   ✅ Role ARN: ${roleArn}`);
    console.log(`   ✅ Policy: AWSLambdaBasicExecutionRole\n`);

    console.log("💡 Next Steps:");
    console.log("   1. Add this to your .env.local file:");
    console.log(`      LAMBDA_EXECUTION_ROLE_ARN=${roleArn}`);
    console.log("   2. Run: npm run setup-cognito-custom-message\n");

    console.log("🔗 AWS Console Links:");
    console.log(
      `   IAM Role: https://console.aws.amazon.com/iam/home#/roles/${ROLE_NAME}`
    );
    console.log(
      `   Lambda: https://console.aws.amazon.com/lambda/home?region=${AWS_REGION}\n`
    );

    return roleArn;
  } catch (error: any) {
    console.error("\n❌ Error creating IAM role:", error.message);

    if (error.name === "EntityAlreadyExists") {
      console.error("\n💡 Role already exists with a different configuration");
      console.error(
        "   You may need to delete it first or use a different name"
      );
    } else if (
      error.name === "AccessDenied" ||
      error.message?.includes("not authorized")
    ) {
      console.error(
        "\n💡 Your AWS credentials don't have IAM permissions to create roles."
      );
      console.error("\n📝 Please create the role manually:");
      console.error("   1. Go to: https://console.aws.amazon.com/iam/");
      console.error("   2. Click 'Roles' → 'Create role'");
      console.error("   3. Select 'AWS service' → 'Lambda'");
      console.error("   4. Attach policy: AWSLambdaBasicExecutionRole");
      console.error(`   5. Name: ${ROLE_NAME}`);
      console.error("   6. Create role and copy the ARN");
      console.error(
        "\n   Or see: docs/LAMBDA_ROLE_SETUP.md for detailed instructions"
      );
      console.error("\n   Once created, add to .env.local:");
      console.error(
        `      LAMBDA_EXECUTION_ROLE_ARN=arn:aws:iam::ACCOUNT:role/${ROLE_NAME}`
      );
    } else if (error.name === "MalformedPolicyDocument") {
      console.error("\n💡 There was an issue with the trust policy");
    }

    process.exit(1);
  } finally {
    await iamClient.destroy();
  }
}

createLambdaExecutionRole()
  .then((roleArn) => {
    if (roleArn) {
      console.log(`\n✅ Role ARN: ${roleArn}`);
      console.log(
        "\n💡 Copy the ARN above and add it to your .env.local as LAMBDA_EXECUTION_ROLE_ARN\n"
      );
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
