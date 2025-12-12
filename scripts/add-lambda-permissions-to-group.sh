#!/bin/bash

# Script to add Lambda permissions to AppServiceAccounts IAM group
# This allows users in the group to create/manage Lambda functions for Cognito Custom Message
# 
# Usage: Run with admin credentials
# The script will add permissions to the AppServiceAccounts group

set -e

GROUP_NAME="${GROUP_NAME:-AppServiceAccounts}"
REGION="${AWS_REGION:-us-east-1}"
POLICY_NAME="LambdaCognitoCustomMessageAccess"

echo "🔐 Adding Lambda permissions to IAM group: $GROUP_NAME"
echo "📋 Region: $REGION"
echo "📋 Current AWS Identity:"
CALLER_IDENTITY=$(aws sts get-caller-identity --output json || exit 1)
ACCOUNT_ID=$(echo "$CALLER_IDENTITY" | jq -r '.Account')
echo "$CALLER_IDENTITY" | jq '.'
echo ""
echo "📋 Detected Account ID: $ACCOUNT_ID"
echo ""

# Check if group exists
if ! aws iam get-group --group-name "$GROUP_NAME" &> /dev/null; then
  echo "❌ Error: IAM group '$GROUP_NAME' not found!"
  echo ""
  echo "Available IAM groups:"
  aws iam list-groups --query 'Groups[].GroupName' --output table || echo "  (Could not list groups)"
  echo ""
  exit 1
fi
echo "✅ Group found: $GROUP_NAME"
echo ""

# Create policy document for Lambda and Cognito permissions
cat > /tmp/lambda-cognito-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction",
        "lambda:ListFunctions",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:GetPolicy",
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:1kappa-cognito-custom-message",
        "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:1kappa-cognito-custom-message:*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:DescribeUserPool",
        "cognito-idp:UpdateUserPool",
        "cognito-idp:GetUserPool"
      ],
      "Resource": "arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::${ACCOUNT_ID}:role/1kappa-cognito-lambda-role"
    }
  ]
}
EOF

echo "📝 Policy document created:"
cat /tmp/lambda-cognito-policy.json
echo ""

POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

# Check if policy already exists
if aws iam get-policy --policy-arn "$POLICY_ARN" &> /dev/null; then
  echo "⚠️  Policy $POLICY_NAME already exists. Updating..."
  POLICY_VERSION=$(aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document file:///tmp/lambda-cognito-policy.json \
    --set-as-default \
    --query 'PolicyVersion.VersionId' \
    --output text)
  echo "✅ Policy updated to version: $POLICY_VERSION"
else
  echo "📦 Creating new policy: $POLICY_NAME"
  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file:///tmp/lambda-cognito-policy.json \
    --description "Permissions for Lambda and Cognito operations for Custom Message trigger" \
    --query 'Policy.Arn' \
    --output text)
  echo "✅ Policy created: $POLICY_ARN"
fi

# Attach policy to group
echo ""
echo "🔗 Attaching policy to group: $GROUP_NAME"

# Check if policy is already attached
if aws iam list-attached-group-policies --group-name "$GROUP_NAME" --query "AttachedPolicies[?PolicyArn=='$POLICY_ARN']" --output text | grep -q "$POLICY_ARN"; then
  echo "✅ Policy already attached to group"
else
  aws iam attach-group-policy \
    --group-name "$GROUP_NAME" \
    --policy-arn "$POLICY_ARN"
  echo "✅ Policy attached successfully"
fi

# Clean up
rm -f /tmp/lambda-cognito-policy.json

echo ""
echo "✅ Done! The IAM group $GROUP_NAME now has Lambda and Cognito permissions."
echo ""
echo "📋 Summary:"
echo "   Group: $GROUP_NAME"
echo "   Policy: $POLICY_NAME"
echo "   Policy ARN: $POLICY_ARN"
echo ""
echo "🔍 Permissions granted:"
echo "   Lambda:"
echo "     - Create, update, get, invoke functions"
echo "     - Add/remove permissions"
echo "     - Specifically for: 1kappa-cognito-custom-message function"
echo "   Cognito:"
echo "     - Describe, update user pools"
echo ""
echo "💡 Note: It may take a few seconds for permissions to propagate."
echo "   Users in the group can now run:"
echo "   npm run setup-cognito-custom-message"
echo ""
