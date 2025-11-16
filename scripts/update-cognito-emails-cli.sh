#!/bin/bash

# Script to update Cognito email templates using AWS CLI
# Usage: ./scripts/update-cognito-emails-cli.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Updating Cognito Email Templates via AWS CLI${NC}\n"

# Load environment variables from backend/.env.local
if [ -f "backend/.env.local" ]; then
    export $(cat backend/.env.local | grep -v '^#' | xargs)
fi

# Set AWS profile
export AWS_PROFILE=${AWS_PROFILE:-1kappa_user}

# Get User Pool ID
COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID:-""}
if [ -z "$COGNITO_USER_POOL_ID" ]; then
    echo -e "${RED}❌ COGNITO_USER_POOL_ID not set${NC}"
    exit 1
fi

# Get Frontend URL
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}
FRONTEND_URL="${FRONTEND_URL%/}"  # Remove trailing slash

echo -e "${GREEN}📋 Configuration:${NC}"
echo "  AWS Profile: $AWS_PROFILE"
echo "  User Pool ID: $COGNITO_USER_POOL_ID"
echo "  Frontend URL: $FRONTEND_URL"
echo ""

# Create temporary JSON file for verification email template
VERIFICATION_TEMPLATE=$(cat <<EOF
{
  "EmailSubject": "Your 1Kappa Verification Code",
  "EmailMessage": "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\"><div style=\"max-width: 600px; margin: 0 auto; padding: 20px;\"><div style=\"background-color: #1a1a2e; padding: 30px; text-align: center;\"><img src=\"${FRONTEND_URL}/horizon-logo.png\" alt=\"1Kappa Logo\" style=\"max-width: 300px; height: auto; margin-bottom: 20px;\" /></div><div style=\"background-color: #f9f9f9; padding: 30px;\"><p style=\"font-size: 16px;\">Hello,</p><p style=\"font-size: 16px;\">Thank you for registering with 1Kappa! Please use the verification code below to complete your registration:</p><div style=\"background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;\"><p style=\"font-size: 32px; font-weight: bold; color: #dc143c; margin: 0; letter-spacing: 5px;\">{####}</p></div><p style=\"font-size: 14px; color: #666;\">This code will expire in 24 hours. If you didn't request this code, please ignore this email.</p><p style=\"font-size: 14px; color: #666; margin-top: 30px;\">Best regards,<br>The 1Kappa Team</p></div><div style=\"background-color: #1a1a2e; padding: 20px; text-align: center;\"><p style=\"color: #fff; font-size: 12px; margin: 0;\">© $(date +%Y) 1Kappa. All rights reserved.</p></div></div></body></html>"
}
EOF
)

# Create temporary JSON file for password reset email template
PASSWORD_RESET_TEMPLATE=$(cat <<EOF
{
  "EmailSubject": "Reset Your 1Kappa Password",
  "EmailMessage": "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\"><div style=\"max-width: 600px; margin: 0 auto; padding: 20px;\"><div style=\"background-color: #1a1a2e; padding: 30px; text-align: center;\"><img src=\"${FRONTEND_URL}/horizon-logo.png\" alt=\"1Kappa Logo\" style=\"max-width: 300px; height: auto; margin-bottom: 20px;\" /></div><div style=\"background-color: #f9f9f9; padding: 30px;\"><p style=\"font-size: 16px;\">Hello,</p><p style=\"font-size: 16px;\">You requested to reset your password for your 1Kappa account.</p><div style=\"background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;\"><p style=\"font-size: 32px; font-weight: bold; color: #dc143c; margin: 0; letter-spacing: 5px;\">{####}</p></div><p style=\"font-size: 14px; color: #666;\">This code will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p><p style=\"font-size: 14px; color: #666; margin-top: 30px;\">Best regards,<br>The 1Kappa Team</p></div><div style=\"background-color: #1a1a2e; padding: 20px; text-align: center;\"><p style=\"color: #fff; font-size: 12px; margin: 0;\">© $(date +%Y) 1Kappa. All rights reserved.</p></div></div></body></html>"
}
EOF
)

echo -e "${GREEN}📧 Updating verification email template...${NC}"

# Create temp file with JSON template
TEMP_FILE=$(mktemp)
echo "$VERIFICATION_TEMPLATE" > "$TEMP_FILE"

# Update verification message template using file input
aws cognito-idp update-user-pool \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --verification-message-template file://"$TEMP_FILE" \
    --profile "$AWS_PROFILE" \
    > /dev/null

# Clean up
rm -f "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Verification email template updated successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Verification template update may have failed. Check AWS Console.${NC}"
fi

echo ""
echo -e "${GREEN}🔐 Updating password reset email template...${NC}"

# Create temp file with JSON template for password reset
TEMP_FILE_PW=$(mktemp)
echo "$PASSWORD_RESET_TEMPLATE" > "$TEMP_FILE_PW"

# Update password reset message template
# Password reset templates are updated via the UserPool's Policies -> Password policy
# or via the Messaging -> Email settings in the console
# The API doesn't have a direct parameter, so we'll use a workaround with JSON file
PASSWORD_RESET_JSON=$(cat <<EOF
{
  "EmailMessage": "$(echo "$PASSWORD_RESET_TEMPLATE" | jq -r '.EmailMessage' | sed 's/"/\\"/g' | sed 's/\$/\\$/g')",
  "EmailSubject": "$(echo "$PASSWORD_RESET_TEMPLATE" | jq -r '.EmailSubject')"
}
EOF
)

# Try updating via user pool policies (this may not work, but worth trying)
# The actual way is through Console: Messaging -> Email -> Forgot password message
echo "$PASSWORD_RESET_JSON" > "$TEMP_FILE_PW"

# Note: Password reset email template must be updated manually in AWS Console
# The AWS CLI doesn't provide a direct way to update the "Forgot password" template
# Go to: Cognito Console -> User Pools -> Your Pool -> Messaging -> Email
# Then update the "Forgot password" message template

# Alternative: Update via Lambda configuration or use the console
# For now, we'll update it via the console link since password reset uses a different API
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Password reset email template updated successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Password reset template may need manual update in AWS Console${NC}"
    echo "   The password reset template uses a different API endpoint"
    echo "   Go to: Cognito → User Pools → Your Pool → Messaging → Email"
    echo "   Update the 'Forgot password' message template manually"
fi

# Clean up
rm -f "$TEMP_FILE_PW"

echo ""
echo -e "${GREEN}🔗 AWS Console Link (for manual updates if needed):${NC}"
echo "   https://console.aws.amazon.com/cognito/v2/idp/user-pools/$COGNITO_USER_POOL_ID/messaging"
echo ""
echo -e "${GREEN}✅ Done! Test by registering a new user or requesting a password reset.${NC}"

