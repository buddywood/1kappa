import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  SESClient,
  GetIdentityVerificationAttributesCommand,
  GetAccountSendingEnabledCommand,
} from "@aws-sdk/client-ses";
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

const sesClient = new SESClient({
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
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SES_FROM_EMAIL || "";

interface DiagnosticResult {
  category: string;
  status: "✅" | "⚠️" | "❌";
  message: string;
  fix?: string;
}

async function checkCognitoEmailConfig(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Check environment variables
  console.log("🔍 Checking Environment Variables...\n");

  if (!COGNITO_USER_POOL_ID) {
    results.push({
      category: "Environment Variables",
      status: "❌",
      message: "COGNITO_USER_POOL_ID is not set",
      fix: "Set COGNITO_USER_POOL_ID in your .env.local or environment variables",
    });
    return results;
  }

  if (!FROM_EMAIL) {
    results.push({
      category: "Environment Variables",
      status: "⚠️",
      message: "FROM_EMAIL is not set",
      fix: "Set FROM_EMAIL in your .env.local or environment variables",
    });
  } else {
    results.push({
      category: "Environment Variables",
      status: "✅",
      message: `FROM_EMAIL is set: ${FROM_EMAIL}`,
    });
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    results.push({
      category: "Environment Variables",
      status: "❌",
      message: "AWS credentials are not set",
      fix: "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment variables",
    });
    return results;
  }

  results.push({
    category: "Environment Variables",
    status: "✅",
    message: `AWS Region: ${AWS_REGION}`,
  });

  // Check Cognito User Pool configuration
  console.log("🔍 Checking Cognito User Pool Configuration...\n");

  try {
    const describeCommand = new DescribeUserPoolCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
    });

    const userPoolResponse = await cognitoClient.send(describeCommand);
    const userPool = userPoolResponse.UserPool;

    if (!userPool) {
      results.push({
        category: "Cognito User Pool",
        status: "❌",
        message: "User Pool not found",
        fix: "Verify COGNITO_USER_POOL_ID is correct",
      });
      return results;
    }

    results.push({
      category: "Cognito User Pool",
      status: "✅",
      message: `User Pool found: ${userPool.Name || COGNITO_USER_POOL_ID}`,
    });

    // Check auto-verification settings
    const autoVerifiedAttributes = userPool.AutoVerifiedAttributes || [];
    if (autoVerifiedAttributes.includes("email")) {
      results.push({
        category: "Auto-Verification",
        status: "✅",
        message: "Email auto-verification is ENABLED",
      });
    } else {
      results.push({
        category: "Auto-Verification",
        status: "❌",
        message: "Email auto-verification is DISABLED",
        fix: "Go to Cognito Console → Sign-in experience → User attributes → Enable Auto-verification for Email",
      });
    }

    // Check email configuration
    const emailConfiguration = userPool.EmailConfiguration;
    if (emailConfiguration) {
      const emailSendingAccount = emailConfiguration.EmailSendingAccount;
      const sourceArn = emailConfiguration.SourceArn;
      const fromEmail = emailConfiguration.From;
      const replyToEmail = emailConfiguration.ReplyToEmailAddress;

      if (emailSendingAccount === "COGNITO_DEFAULT") {
        results.push({
          category: "Email Sending",
          status: "❌",
          message:
            "Using Cognito default email sending (limited functionality)",
          fix: 'Go to Cognito Console → Messaging → Email → Change Email sending account to "Developers" (uses SES)',
        });
      } else if (emailSendingAccount === "DEVELOPER") {
        results.push({
          category: "Email Sending",
          status: "✅",
          message: "Using SES for email sending (DEVELOPER mode)",
        });
      } else {
        results.push({
          category: "Email Sending",
          status: "✅",
          message: `Using custom email sending account: ${emailSendingAccount}`,
        });
      }

      if (fromEmail) {
        results.push({
          category: "Email Sending",
          status: "✅",
          message: `From email configured: ${fromEmail}`,
        });
      } else {
        results.push({
          category: "Email Sending",
          status: "⚠️",
          message: "From email not configured in User Pool",
          fix: "Configure FROM_EMAIL in Cognito Console → Messaging → Email",
        });
      }

      if (sourceArn) {
        results.push({
          category: "Email Sending",
          status: "✅",
          message: `SES Source ARN configured: ${sourceArn}`,
        });
      }
    } else {
      results.push({
        category: "Email Sending",
        status: "❌",
        message: "Email configuration not found",
        fix: "Configure email settings in Cognito Console → Messaging → Email",
      });
    }

    // Check verification message template
    const verificationMessageTemplate = userPool.VerificationMessageTemplate;
    if (verificationMessageTemplate) {
      if (
        verificationMessageTemplate.EmailMessage ||
        verificationMessageTemplate.EmailSubject
      ) {
        results.push({
          category: "Email Templates",
          status: "✅",
          message: "Verification email template is configured",
        });
      } else {
        results.push({
          category: "Email Templates",
          status: "⚠️",
          message: "Verification email template is partially configured",
        });
      }
    } else {
      results.push({
        category: "Email Templates",
        status: "⚠️",
        message: "Verification email template not configured",
        fix: "Configure email templates in Cognito Console → Messaging → Email",
      });
    }

    // Check user attributes
    const schemaAttributes = userPool.SchemaAttributes || [];
    const emailAttribute = schemaAttributes.find(
      (attr) => attr.Name === "email"
    );
    if (emailAttribute) {
      const isRequired = emailAttribute.Required;
      const isMutable = emailAttribute.Mutable;

      results.push({
        category: "User Attributes",
        status: "✅",
        message: `Email attribute: Required=${isRequired}, Mutable=${isMutable}`,
      });
    }
  } catch (error: any) {
    results.push({
      category: "Cognito User Pool",
      status: "❌",
      message: `Error checking User Pool: ${error.message}`,
      fix: "Check AWS credentials and COGNITO_USER_POOL_ID",
    });
    return results;
  }

  // Check SES configuration
  console.log("🔍 Checking SES Configuration...\n");

  try {
    if (FROM_EMAIL) {
      const getIdentityCommand = new GetIdentityVerificationAttributesCommand({
        Identities: [FROM_EMAIL],
      });

      const sesResponse = await sesClient.send(getIdentityCommand);
      const verificationAttributes =
        sesResponse.VerificationAttributes?.[FROM_EMAIL];

      if (verificationAttributes) {
        const verificationStatus = verificationAttributes.VerificationStatus;
        if (verificationStatus === "Success") {
          results.push({
            category: "SES Verification",
            status: "✅",
            message: `FROM_EMAIL (${FROM_EMAIL}) is verified in SES`,
          });
        } else {
          results.push({
            category: "SES Verification",
            status: "❌",
            message: `FROM_EMAIL (${FROM_EMAIL}) verification status: ${verificationStatus}`,
            fix: `Verify ${FROM_EMAIL} in SES Console → Verified identities`,
          });
        }
      } else {
        results.push({
          category: "SES Verification",
          status: "❌",
          message: `FROM_EMAIL (${FROM_EMAIL}) is not verified in SES`,
          fix: `Verify ${FROM_EMAIL} in SES Console → Verified identities`,
        });
      }
    }

    // Check SES account sending status
    try {
      const accountSendingEnabledCommand = new GetAccountSendingEnabledCommand(
        {}
      );
      const accountStatus = await sesClient.send(accountSendingEnabledCommand);

      if (accountStatus.Enabled) {
        results.push({
          category: "SES Account",
          status: "✅",
          message: "SES account sending is enabled",
        });
      } else {
        results.push({
          category: "SES Account",
          status: "⚠️",
          message: "SES account sending is disabled",
          fix: "Enable sending in SES Console → Account dashboard",
        });
      }
    } catch (error: any) {
      // This might fail if we don't have permissions, that's okay
      results.push({
        category: "SES Account",
        status: "⚠️",
        message:
          "Could not check SES account status (may need additional permissions)",
      });
    }
  } catch (error: any) {
    results.push({
      category: "SES Configuration",
      status: "⚠️",
      message: `Error checking SES: ${error.message}`,
      fix: "Check AWS credentials and SES permissions",
    });
  }

  return results;
}

async function printResults(results: DiagnosticResult[]) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 COGNITO EMAIL CONFIGURATION DIAGNOSTIC RESULTS");
  console.log("=".repeat(80) + "\n");

  const categories = [...new Set(results.map((r) => r.category))];

  for (const category of categories) {
    const categoryResults = results.filter((r) => r.category === category);
    console.log(`\n📁 ${category}:`);
    console.log("-".repeat(80));

    for (const result of categoryResults) {
      console.log(`${result.status} ${result.message}`);
      if (result.fix) {
        console.log(`   💡 Fix: ${result.fix}`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));

  const errorCount = results.filter((r) => r.status === "❌").length;
  const warningCount = results.filter((r) => r.status === "⚠️").length;
  const successCount = results.filter((r) => r.status === "✅").length;

  console.log("\n📈 Summary:");
  console.log(`   ✅ Passed: ${successCount}`);
  console.log(`   ⚠️  Warnings: ${warningCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log("\n❌ Issues found that need to be fixed:");
    results
      .filter((r) => r.status === "❌")
      .forEach((r) => {
        console.log(`   - ${r.message}`);
        if (r.fix) {
          console.log(`     → ${r.fix}`);
        }
      });
  }

  if (warningCount > 0) {
    console.log("\n⚠️  Warnings (recommended to fix):");
    results
      .filter((r) => r.status === "⚠️")
      .forEach((r) => {
        console.log(`   - ${r.message}`);
        if (r.fix) {
          console.log(`     → ${r.fix}`);
        }
      });
  }

  if (errorCount === 0 && warningCount === 0) {
    console.log(
      "\n✅ All checks passed! Your Cognito email configuration looks good."
    );
  } else {
    console.log("\n🔗 Quick Links:");
    console.log(
      `   Cognito Console: https://console.aws.amazon.com/cognito/v2/idp/user-pools/${COGNITO_USER_POOL_ID}`
    );
    console.log(`   SES Console: https://console.aws.amazon.com/ses/`);
    console.log(
      `   User Pool Email Settings: https://console.aws.amazon.com/cognito/v2/idp/user-pools/${COGNITO_USER_POOL_ID}/messaging`
    );
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

async function main() {
  try {
    if (!COGNITO_USER_POOL_ID) {
      console.error("❌ COGNITO_USER_POOL_ID is not set");
      console.log("\nPlease set it in your .env.local file:");
      console.log("  COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx");
      process.exit(1);
    }

    console.log("🚀 Starting Cognito Email Configuration Diagnostic...\n");
    console.log(`📋 Configuration:`);
    console.log(`   User Pool ID: ${COGNITO_USER_POOL_ID}`);
    console.log(`   AWS Region: ${AWS_REGION}`);
    console.log(`   FROM_EMAIL: ${FROM_EMAIL || "Not set"}\n`);

    const results = await checkCognitoEmailConfig();
    await printResults(results);

    const hasErrors = results.some((r) => r.status === "❌");
    process.exit(hasErrors ? 1 : 0);
  } catch (error: any) {
    console.error("\n❌ Fatal error:", error.message);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  } finally {
    await cognitoClient.destroy();
    await sesClient.destroy();
  }
}

main();
