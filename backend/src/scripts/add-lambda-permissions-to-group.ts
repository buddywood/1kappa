import {
  IAMClient,
  GetGroupCommand,
  ListAttachedGroupPoliciesCommand,
  CreatePolicyCommand,
  AttachGroupPolicyCommand,
  GetPolicyCommand,
  CreatePolicyVersionCommand,
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

const GROUP_NAME = "AppServiceAccounts";
const POLICY_NAME = "LambdaCognitoCustomMessageAccess";

async function addLambdaPermissionsToGroup() {
  try {
    console.log("🚀 Adding Lambda permissions to AppServiceAccounts group\n");
    console.log("📋 Configuration:");
    console.log(`  Group Name: ${GROUP_NAME}`);
    console.log(`  AWS Region: ${AWS_REGION}\n`);

    // Check if group exists
    try {
      const getGroupCommand = new GetGroupCommand({ GroupName: GROUP_NAME });
      const groupResponse = await iamClient.send(getGroupCommand);
      console.log(`✅ Group found: ${GROUP_NAME}`);
      console.log(`   Users in group: ${groupResponse.Users?.length || 0}\n`);
    } catch (error: any) {
      if (error.name === "NoSuchEntity") {
        console.error(`❌ Group '${GROUP_NAME}' not found`);
        console.error(
          "\n💡 Please create the group first or check the group name"
        );
        process.exit(1);
      }
      throw error;
    }

    // Create or update policy for Lambda permissions
    console.log("📝 Creating/updating IAM policy for Lambda access...");

    const accountId = process.env.AWS_ACCOUNT_ID || "891376939781";
    const policyArn = `arn:aws:iam::${accountId}:policy/${POLICY_NAME}`;

    // Policy document for Lambda and Cognito permissions
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "lambda:CreateFunction",
            "lambda:UpdateFunctionCode",
            "lambda:UpdateFunctionConfiguration",
            "lambda:GetFunction",
            "lambda:ListFunctions",
            "lambda:AddPermission",
            "lambda:RemovePermission",
            "lambda:GetPolicy",
            "lambda:InvokeFunction",
          ],
          Resource: [
            `arn:aws:lambda:${AWS_REGION}:${accountId}:function:1kappa-cognito-custom-message`,
            `arn:aws:lambda:${AWS_REGION}:${accountId}:function:1kappa-cognito-custom-message:*`,
          ],
        },
        {
          Effect: "Allow",
          Action: [
            "cognito-idp:DescribeUserPool",
            "cognito-idp:UpdateUserPool",
            "cognito-idp:GetUserPool",
          ],
          Resource: `arn:aws:cognito-idp:${AWS_REGION}:${accountId}:userpool/*`,
        },
      ],
    };

    // Check if policy exists
    let policyExists = false;
    try {
      const getPolicyCommand = new GetPolicyCommand({ PolicyArn: policyArn });
      await iamClient.send(getPolicyCommand);
      policyExists = true;
      console.log("✅ Policy exists, updating...");

      // Create new policy version
      const createVersionCommand = new CreatePolicyVersionCommand({
        PolicyArn: policyArn,
        PolicyDocument: JSON.stringify(policyDocument),
        SetAsDefault: true,
      });
      await iamClient.send(createVersionCommand);
      console.log("✅ Policy updated successfully!\n");
    } catch (error: any) {
      if (error.name === "NoSuchEntity") {
        // Policy doesn't exist, create it
        console.log("📝 Creating new policy...");
        const createPolicyCommand = new CreatePolicyCommand({
          PolicyName: POLICY_NAME,
          PolicyDocument: JSON.stringify(policyDocument),
          Description:
            "Permissions for Lambda and Cognito operations for Custom Message trigger",
        });
        await iamClient.send(createPolicyCommand);
        console.log("✅ Policy created successfully!\n");
      } else {
        throw error;
      }
    }

    // Attach policy to group
    console.log(`📎 Attaching policy to group: ${GROUP_NAME}...`);

    // Check if policy is already attached
    const listPoliciesCommand = new ListAttachedGroupPoliciesCommand({
      GroupName: GROUP_NAME,
    });
    const attachedPolicies = await iamClient.send(listPoliciesCommand);
    const isAlreadyAttached = attachedPolicies.AttachedPolicies?.some(
      (p) => p.PolicyArn === policyArn
    );

    if (isAlreadyAttached) {
      console.log("✅ Policy already attached to group\n");
    } else {
      const attachPolicyCommand = new AttachGroupPolicyCommand({
        GroupName: GROUP_NAME,
        PolicyArn: policyArn,
      });
      await iamClient.send(attachPolicyCommand);
      console.log("✅ Policy attached to group successfully!\n");
    }

    console.log("📋 Summary:");
    console.log(`   ✅ Group: ${GROUP_NAME}`);
    console.log(`   ✅ Policy: ${POLICY_NAME}`);
    console.log(`   ✅ Policy ARN: ${policyArn}\n`);

    console.log("💡 Permissions granted:");
    console.log("   - Lambda: Create, update, get, invoke functions");
    console.log("   - Cognito: Describe, update user pools");
    console.log(
      "   - Specifically for: 1kappa-cognito-custom-message function\n"
    );

    console.log("🔗 AWS Console Links:");
    console.log(
      `   IAM Group: https://console.aws.amazon.com/iam/home#/groups/${GROUP_NAME}`
    );
    console.log(
      `   IAM Policy: https://console.aws.amazon.com/iam/home#/policies/${POLICY_NAME}`
    );
    console.log(
      `   Lambda: https://console.aws.amazon.com/lambda/home?region=${AWS_REGION}\n`
    );

    console.log(
      "✅ Done! Users in AppServiceAccounts group now have Lambda permissions."
    );
    console.log(
      "\n💡 Next step: Run 'npm run setup-cognito-custom-message' to deploy the Lambda function"
    );
  } catch (error: any) {
    console.error("\n❌ Error adding permissions:", error.message);

    if (error.name === "AccessDenied") {
      console.error("\n💡 Your AWS credentials don't have IAM permissions.");
      console.error("   You need permissions to:");
      console.error("   - iam:GetGroup");
      console.error("   - iam:CreatePolicy / iam:CreatePolicyVersion");
      console.error("   - iam:AttachGroupPolicy");
    } else if (error.name === "NoSuchEntity") {
      console.error("\n💡 Group or policy not found");
    }

    process.exit(1);
  } finally {
    await iamClient.destroy();
  }
}

addLambdaPermissionsToGroup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
