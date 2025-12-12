import {
  CognitoIdentityProviderClient,
  UpdateUserPoolCommand,
  DescribeUserPoolCommand,
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
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@one-kappa.com";

async function configureSESEmail() {
  try {
    if (!COGNITO_USER_POOL_ID) {
      console.error("❌ COGNITO_USER_POOL_ID is not set");
      console.log("\nPlease set it in your .env.local file:");
      console.log("  COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx");
      process.exit(1);
    }

    console.log("🚀 Configuring Cognito to use SES for email sending\n");
    console.log(`📋 Configuration:`);
    console.log(`   User Pool ID: ${COGNITO_USER_POOL_ID}`);
    console.log(`   AWS Region: ${AWS_REGION}`);
    console.log(`   FROM_EMAIL: ${FROM_EMAIL}\n`);

    // Get current user pool configuration
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

    // Check current email configuration
    const currentEmailConfig = userPool.EmailConfiguration;
    const currentSendingAccount = currentEmailConfig?.EmailSendingAccount;

    if (currentSendingAccount === "DEVELOPER") {
      console.log("✅ Already using SES for email sending (DEVELOPER mode)");
      return;
    }

    console.log(
      `⚠️  Current email sending: ${currentSendingAccount || "COGNITO_DEFAULT"}`
    );
    console.log("📝 Configuring to use SES...\n");

    // Construct SES Source ARN for the verified domain
    // Format: arn:aws:ses:REGION:ACCOUNT:identity/DOMAIN
    const accountId = process.env.AWS_ACCOUNT_ID || "891376939781";
    const domain = FROM_EMAIL.split("@")[1] || "one-kappa.com";
    const sesSourceArn = `arn:aws:ses:${AWS_REGION}:${accountId}:identity/${domain}`;

    console.log(`📧 Using SES Source ARN: ${sesSourceArn}\n`);

    // Update to use SES (DEVELOPER mode uses SES)
    const updateCommand = new UpdateUserPoolCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      EmailConfiguration: {
        EmailSendingAccount: "DEVELOPER",
        From: FROM_EMAIL,
        SourceArn: sesSourceArn,
        ReplyToEmailAddress: currentEmailConfig?.ReplyToEmailAddress, // Preserve if exists
      },
      // Preserve all other settings
      AutoVerifiedAttributes: userPool.AutoVerifiedAttributes,
      Policies: userPool.Policies,
      LambdaConfig: userPool.LambdaConfig,
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

    console.log("✅ SES email configuration updated successfully!\n");
    console.log("📋 What changed:");
    console.log(
      `   - Email sending: ${
        currentSendingAccount || "COGNITO_DEFAULT"
      } → DEVELOPER (SES)`
    );
    console.log(`   - From email: ${FROM_EMAIL}\n`);

    console.log("💡 This means:");
    console.log("   - Cognito will now use SES to send emails");
    console.log("   - Better deliverability and reliability");
    console.log("   - Full control over email content\n");

    console.log("🔗 Verify in AWS Console:");
    console.log(
      `   https://console.aws.amazon.com/cognito/v2/idp/user-pools/${COGNITO_USER_POOL_ID}/messaging\n`
    );

    console.log(
      "✅ Done! Your Cognito User Pool is now configured to use SES."
    );
  } catch (error: any) {
    console.error("\n❌ Error configuring SES email:", error.message);

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

configureSESEmail()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });


