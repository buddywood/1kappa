import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  UpdateUserPoolCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const AWS_REGION =
  process.env.COGNITO_REGION || process.env.AWS_REGION || "us-east-1";

const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";

async function enableAutoVerification() {
  try {
    if (!COGNITO_USER_POOL_ID) {
      console.error("❌ COGNITO_USER_POOL_ID is not set");
      console.log("\nPlease set it in your .env.local file:");
      console.log("  COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx");
      process.exit(1);
    }

    console.log(
      "🚀 Enabling Auto-Verification for Email in Cognito User Pool\n"
    );
    console.log(`📋 Configuration:`);
    console.log(`   User Pool ID: ${COGNITO_USER_POOL_ID}`);
    console.log(`   AWS Region: ${AWS_REGION}\n`);

    // First, get the current user pool configuration
    console.log("📥 Fetching current User Pool configuration...");
    const describeCommand = new DescribeUserPoolCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
    });

    const userPoolResponse = await cognitoClient.send(describeCommand);
    const userPool = userPoolResponse.UserPool;

    if (!userPool) {
      throw new Error("User Pool not found");
    }

    console.log(
      `✅ User Pool found: ${userPool.Name || COGNITO_USER_POOL_ID}\n`
    );

    // Check current auto-verification status
    const currentAutoVerifiedAttributes = userPool.AutoVerifiedAttributes || [];
    const isEmailAutoVerified = currentAutoVerifiedAttributes.includes("email");

    if (isEmailAutoVerified) {
      console.log("✅ Email auto-verification is already ENABLED");
      console.log(
        "\nNo changes needed. Your User Pool is already configured correctly."
      );
      return;
    }

    console.log("⚠️  Email auto-verification is currently DISABLED");
    console.log("📝 Enabling email auto-verification...\n");

    // Update the user pool to enable auto-verification for email
    // We need to preserve all existing settings, so we'll include them in the update
    const updateCommand = new UpdateUserPoolCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      AutoVerifiedAttributes: ["email"],
      // Preserve other settings by including them
      Policies: userPool.Policies,
      LambdaConfig: userPool.LambdaConfig,
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

    console.log("✅ Email auto-verification enabled successfully!\n");

    console.log("📋 What changed:");
    console.log("   - Email auto-verification: DISABLED → ENABLED");
    console.log("\n💡 This means:");
    console.log(
      "   - Users will automatically receive verification codes via email"
    );
    console.log('   - The "Cannot resend codes" error should now be resolved');
    console.log("   - Users can request new verification codes if needed\n");

    console.log("🔗 Verify in AWS Console:");
    console.log(
      `   https://console.aws.amazon.com/cognito/v2/idp/user-pools/${COGNITO_USER_POOL_ID}/sign-in-experience`
    );
    console.log(
      "\n✅ Done! Test by registering a new user or requesting a password reset."
    );
  } catch (error: any) {
    console.error("\n❌ Error enabling auto-verification:", error.message);

    if (error.name === "NotAuthorizedException") {
      console.error(
        "\n💡 Make sure your AWS credentials have the following permissions:"
      );
      console.error("   - cognito-idp:DescribeUserPool");
      console.error("   - cognito-idp:UpdateUserPool");
    } else if (error.name === "ResourceNotFoundException") {
      console.error("\n💡 Make sure COGNITO_USER_POOL_ID is correct");
    }

    process.exit(1);
  } finally {
    await cognitoClient.destroy();
  }
}

enableAutoVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
