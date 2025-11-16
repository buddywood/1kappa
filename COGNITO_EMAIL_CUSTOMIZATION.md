# Customizing Cognito Verification Email Templates

This guide explains how to customize the verification code/PIN emails sent by AWS Cognito.

## Option 1: Message Templates (Simpler - Recommended)

This is the easiest way to customize Cognito emails without writing code.

### Steps:

1. **Go to AWS Cognito Console**
   - Navigate to: https://console.aws.amazon.com/cognito/
   - Select your User Pool

2. **Navigate to Message Customization**
   - Go to **Sign-in experience** → **Message customization**
   - Or go to **Messaging** → **Email**

3. **Customize Email Templates**
   - **Verification code email** (for signup verification)
   - **Password reset email** (for forgot password)

4. **Available Variables**
   You can use these variables in your templates:
   - `{####}` - The verification code/PIN
   - `{username}` - The user's email/username
   - `{####}` - For password reset codes

### Example Custom Email Template:

**Important:** Replace `https://yourdomain.com` with your actual frontend domain (e.g., `https://1kappa.com` or `https://app.1kappa.com`). The logo must be publicly accessible via HTTPS.

**Subject:**
```
Your 1Kappa Verification Code
```

**Message Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
      <img src="https://yourdomain.com/horizon-logo.png" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px;">
      <p style="font-size: 16px;">Hello,</p>
      
      <p style="font-size: 16px;">
        Thank you for registering with 1Kappa! Please use the verification code below to complete your registration:
      </p>
      
      <div style="background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #dc143c; margin: 0; letter-spacing: 5px;">
          {####}
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
    
    <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
      <p style="color: #fff; font-size: 12px; margin: 0;">
        © 2024 1Kappa. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
```

**Message Body (Plain Text):**
```
Hello,

Thank you for registering with 1Kappa! Please use the verification code below to complete your registration:

{####}

This code will expire in 24 hours. If you didn't request this code, please ignore this email.

Best regards,
The 1Kappa Team

© 2024 1Kappa. All rights reserved.
```

### Password Reset Template Example:

**Subject:**
```
Reset Your 1Kappa Password
```

**Message Body:**
```
Hello,

You requested to reset your password for your 1Kappa account.

Your verification code is: {####}

This code will expire in 1 hour. If you didn't request a password reset, please ignore this email.

Best regards,
The 1Kappa Team
```

### Notes:
- Cognito supports HTML emails, but keep them simple
- Test your templates after saving
- The `{####}` placeholder is automatically replaced with the actual code
- You can customize the "from" email address in User Pool settings

---

## Option 2: Custom Email Sender Lambda Trigger (Advanced)

For full control over email content and delivery, you can use a Lambda function.

### Steps:

1. **Create a Lambda Function**
   - Go to AWS Lambda Console
   - Create a new function
   - Use Node.js runtime

2. **Lambda Function Code:**

```javascript
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const crypto = require('crypto');

const sesClient = new SESClient({ region: process.env.AWS_REGION });
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@1kappa.com';

exports.handler = async (event) => {
  console.log('Custom email sender event:', JSON.stringify(event, null, 2));
  
  const { codeParameter, userAttributes } = event.request;
  const email = userAttributes.email;
  const verificationCode = codeParameter;
  
  // Determine email type
  let subject, htmlBody, textBody;
  
  if (event.triggerSource === 'CustomEmailSender_SignUp') {
    subject = 'Your 1Kappa Verification Code';
    const frontendUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
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
        </div>
      </body>
      </html>
    `;
    textBody = `Thank you for registering with 1Kappa!\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 24 hours.`;
  } else if (event.triggerSource === 'CustomEmailSender_ForgotPassword') {
    subject = 'Reset Your 1Kappa Password';
    const frontendUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
            <img src="${frontendUrl}/horizon-logo.png" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px;">
            <p style="font-size: 16px;">Hello,</p>
            
            <p style="font-size: 16px;">
              You requested to reset your password for your 1Kappa account.
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
        </div>
      </body>
      </html>
    `;
    textBody = `You requested to reset your password.\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 1 hour.`;
  }
  
  // Send email via SES
  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });
    
    await sesClient.send(command);
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
  
  return event;
};
```

3. **Configure Lambda Permissions**
   - Add IAM role with SES permissions
   - Add KMS permissions for Cognito encryption

4. **Configure Cognito User Pool**
   - Go to User Pool → **Sign-in experience** → **Lambda triggers**
   - Select **Custom email sender**
   - Choose your Lambda function
   - Configure KMS key for encryption

### Lambda Function Requirements:

- **IAM Permissions:**
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "kms:Decrypt"
        ],
        "Resource": "arn:aws:kms:REGION:ACCOUNT:key/KEY_ID"
      }
    ]
  }
  ```

- **Environment Variables:**
  - `AWS_REGION` - Your AWS region
  - `FROM_EMAIL` - Verified SES email address

### Important Notes:

1. **KMS Encryption**: Cognito encrypts the verification code before passing it to Lambda. You must decrypt it using KMS.

2. **Event Structure**: The Lambda receives an event with:
   - `triggerSource`: `CustomEmailSender_SignUp` or `CustomEmailSender_ForgotPassword`
   - `request.codeParameter`: Encrypted verification code (needs KMS decryption)
   - `request.userAttributes`: User information including email

3. **Decryption Example:**
   ```javascript
   const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');
   const kmsClient = new KMSClient({ region: process.env.AWS_REGION });
   
   // Decrypt the code
   const decryptCommand = new DecryptCommand({
     CiphertextBlob: Buffer.from(event.request.codeParameter, 'base64'),
   });
   const decryptResponse = await kmsClient.send(decryptCommand);
   const verificationCode = decryptResponse.Plaintext.toString();
   ```

---

## Recommendation

**Start with Option 1 (Message Templates)** - it's simpler and sufficient for most use cases. Only use Option 2 (Lambda) if you need:
- Complex email logic
- Integration with external services
- Dynamic content based on user data
- Custom email delivery methods

---

## Testing

After customizing your templates:

1. **Test Signup Verification:**
   - Register a new user
   - Check email for custom template

2. **Test Password Reset:**
   - Use "Forgot Password" flow
   - Check email for custom template

3. **Verify Branding:**
   - Check colors match 1Kappa brand (#dc143c crimson, #1a1a2e dark)
   - Verify logo/branding is correct
   - Test on multiple email clients

---

## Resources

- [Cognito Message Customization Docs](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-email-phone-verification.html)
- [Custom Email Sender Lambda Trigger](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-email-sender.html)
- [SES Email Templates](https://docs.aws.amazon.com/ses/latest/dg/send-personalized-email-api.html)

