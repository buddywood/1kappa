import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SES_FROM_EMAIL || 'noreply@northstarnupes.com';

/**
 * Send a welcome email to a newly registered member
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const subject = 'Welcome to North Star Nupes!';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to North Star Nupes</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">Welcome to North Star Nupes!</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${name},</p>
          
          <p style="font-size: 16px;">
            We're thrilled to welcome you to the North Star Nupes community! Your registration has been successfully completed.
          </p>
          
          <p style="font-size: 16px;">
            As a member, you now have access to:
          </p>
          
          <ul style="font-size: 16px; padding-left: 20px;">
            <li>Connect with brothers from across all chapters</li>
            <li>Discover and support member-owned businesses</li>
            <li>Attend exclusive events and gatherings</li>
            <li>Shop for authentic fraternity merchandise</li>
            <li>Stay updated on chapter news and activities</li>
          </ul>
          
          <p style="font-size: 16px;">
            We're excited to have you join our community. If you have any questions or need assistance, please don't hesitate to reach out.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The North Star Nupes Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} North Star Nupes. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;
  
  const textBody = `
Welcome to North Star Nupes!

Hello ${name},

We're thrilled to welcome you to the North Star Nupes community! Your registration has been successfully completed.

As a member, you now have access to:
- Connect with brothers from across all chapters
- Discover and support member-owned businesses
- Attend exclusive events and gatherings
- Shop for authentic fraternity merchandise
- Stay updated on chapter news and activities

We're excited to have you join our community. If you have any questions or need assistance, please don't hesitate to reach out.

Best regards,
The North Star Nupes Team

© ${new Date().getFullYear()} North Star Nupes. All rights reserved.
  `;

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
    console.log(`✅ Welcome email sent successfully to ${email}`);
  } catch (error) {
    console.error(`❌ Error sending welcome email to ${email}:`, error);
    // Re-throw so caller can handle it appropriately
    throw error;
  }
}

