/**
 * AWS Lambda function for Cognito Custom Message Trigger
 *
 * This function customizes email messages for:
 * - Sign-up verification (CustomMessage_SignUp)
 * - Password reset (CustomMessage_ForgotPassword)
 *
 * Environment Variables Required:
 * - FRONTEND_URL: Your frontend domain (e.g., https://one-kappa.com)
 * - FROM_EMAIL: Verified SES email address (optional, set in Cognito User Pool)
 *
 * IAM Permissions Required:
 * - None! This trigger only modifies the message, Cognito still sends it.
 *   (Unlike CustomEmailSender which requires SES and KMS permissions)
 */

exports.handler = async (event) => {
  console.log("Custom message trigger event:", JSON.stringify(event, null, 2));

  const { triggerSource, request } = event;
  const { codeParameter, userAttributes } = request;
  const email = userAttributes.email;
  const verificationCode = codeParameter; // Already decrypted by Cognito

  // Get frontend URL from environment
  const frontendUrl = process.env.FRONTEND_URL || "https://one-kappa.com";
  const currentYear = new Date().getFullYear();

  let subject, emailMessage;

  if (triggerSource === "CustomMessage_SignUp") {
    // Sign-up verification email
    subject = "Your 1Kappa Verification Code";
    emailMessage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #F7F4E9; padding: 30px; text-align: center;">
      <img src="${frontendUrl}/horizon-logo.png" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px;">
      <p style="font-size: 16px;">Hello,</p>
      
      <p style="font-size: 16px;">
        Thank you for registering with 1Kappa! Please use the verification code below to complete your registration:
      </p>
      
      <div style="background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #dc143c; margin: 0; letter-spacing: 5px;">
          ${verificationCode}
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        This code will expire in 24 hours. If you didn't request this code, please ignore this email.
      </p>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Best regards,<br>
        The 1Kappa Team
      </p>
    </div>
    
    <div style="background-color: #F7F4E9; padding: 20px; text-align: center;">
      <p style="color: #333; font-size: 12px; margin: 0;">
        © ${currentYear} 1Kappa. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
  } else if (triggerSource === "CustomMessage_ForgotPassword") {
    // Password reset email
    subject = "Reset Your 1Kappa Password";
    emailMessage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #F7F4E9; padding: 30px; text-align: center;">
      <img src="${frontendUrl}/horizon-logo.png" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px;">
      <p style="font-size: 16px;">Hello,</p>
      
      <p style="font-size: 16px;">
        You requested to reset your password for your 1Kappa account. Please use the verification code below:
      </p>
      
      <div style="background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #dc143c; margin: 0; letter-spacing: 5px;">
          ${verificationCode}
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
    
    <div style="background-color: #F7F4E9; padding: 20px; text-align: center;">
      <p style="color: #333; font-size: 12px; margin: 0;">
        © ${currentYear} 1Kappa. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
  } else {
    // For other trigger sources, return event unchanged
    console.log(`Unhandled trigger source: ${triggerSource}`);
    return event;
  }

  // Update the response with custom subject and message
  event.response.emailSubject = subject;
  event.response.emailMessage = emailMessage;

  console.log(`Customized ${triggerSource} email for ${email}`);
  return event;
};
