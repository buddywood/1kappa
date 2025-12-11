#!/bin/bash

# Script to fix IAM permissions for Cognito email configuration diagnostic
# This script adds the necessary Cognito permissions to the 1kappa_user IAM user

set -e

USER_NAME="1kappa_user"
ACCOUNT_ID="891376939781"
REGION="us-east-1"

echo "🔧 Fixing IAM permissions for user: $USER_NAME"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Not authenticated with AWS. Please run 'aws configure' or set AWS credentials."
    exit 1
fi

echo "✅ AWS CLI is installed and authenticated"
echo ""

# Create a policy document for Cognito permissions
POLICY_DOCUMENT=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:DescribeUserPool",
        "cognito-idp:DescribeUserPoolClient",
        "cognito-idp:ListUsers",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminListGroupsForUser",
        "cognito-idp:GetUserPoolMfaConfig"
      ],
      "Resource": "arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:ListUserPools"
      ],
      "Resource": "*"
    }
  ]
}
EOF
)

POLICY_NAME="CognitoReadOnlyAccess-1kappa"

echo "📝 Creating/updating IAM policy: $POLICY_NAME"
echo ""

# Check if policy already exists
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

if aws iam get-policy --policy-arn "$POLICY_ARN" &> /dev/null; then
    echo "⚠️  Policy already exists. Creating new version..."
    
    # Create a new policy version
    aws iam create-policy-version \
        --policy-arn "$POLICY_ARN" \
        --policy-document "$POLICY_DOCUMENT" \
        --set-as-default \
        > /dev/null
    
    echo "✅ Policy version updated successfully"
else
    echo "📄 Creating new policy..."
    
    # Create the policy
    aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document "$POLICY_DOCUMENT" \
        --description "Allows read-only access to Cognito User Pools for 1kappa diagnostic scripts" \
        > /dev/null
    
    echo "✅ Policy created successfully"
fi

echo ""
echo "🔗 Attaching policy to user: $USER_NAME"
echo ""

# Attach the policy to the user
aws iam attach-user-policy \
    --user-name "$USER_NAME" \
    --policy-arn "$POLICY_ARN" \
    || echo "⚠️  Policy may already be attached (this is okay)"

echo ""
echo "✅ IAM permissions updated successfully!"
echo ""
echo "📋 Summary:"
echo "   User: $USER_NAME"
echo "   Policy: $POLICY_NAME"
echo "   Policy ARN: $POLICY_ARN"
echo ""
echo "🔍 Permissions granted:"
echo "   - cognito-idp:DescribeUserPool"
echo "   - cognito-idp:DescribeUserPoolClient"
echo "   - cognito-idp:ListUsers"
echo "   - cognito-idp:AdminGetUser"
echo "   - cognito-idp:AdminListGroupsForUser"
echo "   - cognito-idp:GetUserPoolMfaConfig"
echo "   - cognito-idp:ListUserPools"
echo ""
echo "💡 Note: It may take a few seconds for permissions to propagate."
echo "   Try running the diagnostic script again:"
echo "   npm run check-cognito-email-config"
echo ""
