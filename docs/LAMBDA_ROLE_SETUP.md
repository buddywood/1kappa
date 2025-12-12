# Setting Up Lambda Execution Role for Cognito Custom Message

This guide explains how to create the IAM role needed for the Cognito Custom Message Lambda function.

## Option 1: Create Role via AWS Console (Recommended)

1. **Go to IAM Console**

   - Navigate to: https://console.aws.amazon.com/iam/
   - Click "Roles" in the left sidebar
   - Click "Create role"

2. **Select Trusted Entity**

   - Select "AWS service"
   - Choose "Lambda" from the service list
   - Click "Next"

3. **Add Permissions**

   - Search for and select: `AWSLambdaBasicExecutionRole`
   - Click "Next"

4. **Name the Role**

   - Role name: `1kappa-cognito-lambda-role`
   - Description: "Execution role for Cognito Custom Message Lambda function"
   - Click "Create role"

5. **Copy the Role ARN**

   - After creation, click on the role name
   - Copy the "ARN" (starts with `arn:aws:iam::`)
   - Example: `arn:aws:iam::891376939781:role/1kappa-cognito-lambda-role`

6. **Add to Environment Variables**
   - Add to your `backend/.env.local`:
   ```
   LAMBDA_EXECUTION_ROLE_ARN=arn:aws:iam::891376939781:role/1kappa-cognito-lambda-role
   ```

## Option 2: Create Role via AWS CLI (Requires Admin Credentials)

If you have admin AWS credentials, you can run:

```bash
# Set variables
ROLE_NAME="1kappa-cognito-lambda-role"
ACCOUNT_ID="891376939781"  # Your AWS account ID

# Create trust policy file
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --description "Execution role for Cognito Custom Message Lambda function"

# Attach the basic execution policy
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# Get the role ARN
aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text

# Clean up
rm /tmp/trust-policy.json
```

## Verify Role Creation

After creating the role, verify it exists:

```bash
aws iam get-role --role-name 1kappa-cognito-lambda-role
```

## Next Steps

Once the role is created:

1. Add the role ARN to `backend/.env.local`:

   ```
   LAMBDA_EXECUTION_ROLE_ARN=arn:aws:iam::891376939781:role/1kappa-cognito-lambda-role
   ```

2. Run the Lambda setup script:
   ```bash
   cd backend && npm run setup-cognito-custom-message
   ```

## Required Permissions

The role needs:

- `AWSLambdaBasicExecutionRole` - Allows Lambda to write CloudWatch logs

That's it! The Custom Message trigger doesn't need SES or KMS permissions because Cognito still handles the actual email sending.
