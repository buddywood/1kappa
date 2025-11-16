#!/bin/bash

# Script to display the password reset email template for manual copy-paste into AWS Console
# Usage: ./scripts/get-password-reset-template.sh

# Load environment variables
if [ -f "backend/.env.local" ]; then
    export $(cat backend/.env.local | grep -v '^#' | xargs)
fi

FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}
FRONTEND_URL="${FRONTEND_URL%/}"

echo "=========================================="
echo "Password Reset Email Template"
echo "=========================================="
echo ""
echo "Copy the following content into AWS Cognito Console:"
echo "Cognito → User Pools → Your Pool → Messaging → Email → Forgot password"
echo ""
echo "------------------------------------------"
echo "SUBJECT:"
echo "------------------------------------------"
echo "Reset Your 1Kappa Password"
echo ""
echo "------------------------------------------"
echo "MESSAGE (HTML):"
echo "------------------------------------------"
cat <<EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
      <img src="${FRONTEND_URL}/horizon-logo.png" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px;">
      <p style="font-size: 16px;">Hello,</p>
      
      <p style="font-size: 16px;">
        You requested to reset your password for your 1Kappa account.
      </p>
      
      <div style="background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #dc143c; margin: 0; letter-spacing: 5px;">
          {####}
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        This code will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      </p>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Best regards,<br>
        The 1Kappa Team
      </p>
    </div>
    
    <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
      <p style="color: #fff; font-size: 12px; margin: 0;">
        © $(date +%Y) 1Kappa. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
EOF
echo ""
echo "------------------------------------------"
echo ""
echo "🔗 AWS Console Link:"
echo "https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_zUtF081P3/messaging"
echo ""
echo "Steps:"
echo "1. Click the link above (or navigate manually)"
echo "2. Scroll to 'Forgot password' section"
echo "3. Click 'Edit' on the Forgot password message"
echo "4. Paste the HTML above into the message field"
echo "5. Set the subject to: Reset Your 1Kappa Password"
echo "6. Save changes"
echo ""

