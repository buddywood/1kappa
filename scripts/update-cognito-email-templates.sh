#!/bin/bash

# Script to update Cognito email templates via AWS CLI
# Usage: ./scripts/update-cognito-email-templates.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Updating Cognito Email Templates${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get Cognito User Pool ID from environment or prompt
if [ -z "$COGNITO_USER_POOL_ID" ]; then
    echo -e "${YELLOW}⚠️  COGNITO_USER_POOL_ID not set in environment${NC}"
    read -p "Enter your Cognito User Pool ID (e.g., us-east-1_xxxxxxxxx): " COGNITO_USER_POOL_ID
fi

if [ -z "$COGNITO_USER_POOL_ID" ]; then
    echo -e "${RED}❌ Cognito User Pool ID is required${NC}"
    exit 1
fi

# Get frontend URL from environment or prompt
if [ -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}⚠️  FRONTEND_URL not set in environment${NC}"
    read -p "Enter your frontend URL (e.g., https://1kappa.com): " FRONTEND_URL
fi

if [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}❌ Frontend URL is required for logo image${NC}"
    exit 1
fi

# Remove trailing slash from FRONTEND_URL
FRONTEND_URL="${FRONTEND_URL%/}"

echo -e "\n${GREEN}📋 Configuration:${NC}"
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

# Update verification email template
echo -e "${GREEN}📧 Updating verification email template...${NC}"
echo "$VERIFICATION_TEMPLATE" > /tmp/cognito-verification-template.json

aws cognito-idp update-user-pool \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --verification-message-template "$(cat /tmp/cognito-verification-template.json)" \
    --email-verification-message "$(echo "$VERIFICATION_TEMPLATE" | jq -r '.EmailMessage')" \
    --email-verification-subject "$(echo "$VERIFICATION_TEMPLATE" | jq -r '.EmailSubject')" \
    > /dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  Using alternative method for verification template...${NC}"
    # Alternative: Update via message template API
    aws cognito-idp update-user-pool \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --verification-message-template "EmailMessage=$(echo "$VERIFICATION_TEMPLATE" | jq -r '.EmailMessage'),EmailSubject=$(echo "$VERIFICATION_TEMPLATE" | jq -r '.EmailSubject')" \
        > /dev/null 2>&1 || {
        echo -e "${RED}❌ Failed to update verification template. You may need to update it manually in the AWS Console.${NC}"
        echo -e "${YELLOW}   Go to: Cognito → User Pools → Your Pool → Messaging → Email${NC}"
    }
}

# Update password reset email template
echo -e "${GREEN}🔐 Updating password reset email template...${NC}"
echo "$PASSWORD_RESET_TEMPLATE" > /tmp/cognito-password-reset-template.json

# Note: Password reset templates are updated via the User Pool's message customization settings
# This requires updating the "Forgot password" message template
aws cognito-idp update-user-pool \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --admin-create-user-config "InviteMessageTemplate={EmailMessage=$(echo "$PASSWORD_RESET_TEMPLATE" | jq -r '.EmailMessage' | sed 's/"/\\"/g'),EmailSubject=$(echo "$PASSWORD_RESET_TEMPLATE" | jq -r '.EmailSubject')}" \
    > /dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  Password reset template update may require manual configuration.${NC}"
    echo -e "${YELLOW}   Go to: Cognito → User Pools → Your Pool → Messaging → Email${NC}"
    echo -e "${YELLOW}   Update the 'Forgot password' message template manually.${NC}"
}

# Clean up temp files
rm -f /tmp/cognito-verification-template.json /tmp/cognito-password-reset-template.json

echo -e "\n${GREEN}✅ Email templates update process completed!${NC}"
echo -e "\n${YELLOW}📝 Note:${NC}"
echo "  1. Verification email template should be updated"
echo "  2. Password reset template may need manual update in AWS Console"
echo "  3. Test by registering a new user or requesting a password reset"
echo ""
echo -e "${GREEN}🔗 AWS Console Link:${NC}"
echo "  https://console.aws.amazon.com/cognito/v2/idp/user-pools/$COGNITO_USER_POOL_ID/messaging"
echo ""

