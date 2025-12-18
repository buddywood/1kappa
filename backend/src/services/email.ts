import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";

dotenv.config();

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  process.env.SES_FROM_EMAIL ||
  "no-reply@one-kappa.com";

/**
 * Get the logo URL for email templates
 * Uses FRONTEND_URL to reference the logo from the public directory
 */
function getLogoUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${frontendUrl}/horizon-logo.png`;
}

/**
 * Send a welcome email to a newly registered member
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const subject = "Welcome to 1Kappa!";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to 1Kappa</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">Welcome to 1Kappa!</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${name},</p>
          
          <p style="font-size: 16px;">
            We're thrilled to welcome you to the 1Kappa community! Your registration has been successfully completed.
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
              The 1Kappa Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Welcome to 1Kappa!

Hello ${name},

We're thrilled to welcome you to the 1Kappa community! Your registration has been successfully completed.

As a member, you now have access to:
- Connect with brothers from across all chapters
- Discover and support member-owned businesses
- Attend exclusive events and gatherings
- Shop for authentic fraternity merchandise
- Stay updated on chapter news and activities

We're excited to have you join our community. If you have any questions or need assistance, please don't hesitate to reach out.

Best regards,
The 1Kappa Team

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
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
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
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

/**
 * Send an email notification when a seller application is submitted
 */
export async function sendSellerApplicationSubmittedEmail(
  email: string,
  name: string
): Promise<void> {
  const subject = "Seller Application Received - 1Kappa";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seller Application Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">Application Received</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${name},</p>
          
          <p style="font-size: 16px;">
            Thank you for your interest in becoming a seller on 1Kappa! We have successfully received your seller application.
          </p>
          
          <p style="font-size: 16px;">
            <strong>Your application is now under review.</strong> Our team will carefully review your submission and verify your information. This process typically takes 1-3 business days.
          </p>
          
          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #1565c0;">
              <strong>What happens next?</strong><br>
              • We'll review your application and verify your vendor license<br>
              • You'll receive an email notification once a decision has been made<br>
              • Once approved, you can start listing products in our shop
            </p>
          </div>
          
          <p style="font-size: 16px;">
            If you have any questions about your application, please don't hesitate to contact us.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The 1Kappa Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Seller Application Received - 1Kappa

Hello ${name},

Thank you for your interest in becoming a seller on 1Kappa! We have successfully received your seller application.

Your application is now under review. Our team will carefully review your submission and verify your information. This process typically takes 1-3 business days.

What happens next?
• We'll review your application and verify your vendor license
• You'll receive an email notification once a decision has been made
• Once approved, you can start listing products in our shop

If you have any questions about your application, please don't hesitate to contact us.

Best regards,
The 1Kappa Team

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
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
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(
      `✅ Seller application submitted email sent successfully to ${email}`
    );
  } catch (error) {
    console.error(
      `❌ Error sending seller application submitted email to ${email}:`,
      error
    );
    // Don't throw - email failure shouldn't break the application submission
  }
}

/**
 * Send an email notification when a seller application is approved
 */
export async function sendSellerApprovedEmail(
  email: string,
  name: string,
  invitationToken?: string
): Promise<void> {
  const subject =
    "Congratulations! Your Seller Application Has Been Approved - 1Kappa";

  // Build invitation link if token is provided
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const invitationLink = invitationToken
    ? `${frontendUrl}/seller-setup?token=${invitationToken}`
    : `${frontendUrl}/login`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seller Application Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">🎉 Application Approved!</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${name},</p>
          
          <p style="font-size: 16px;">
            Great news! Your seller application has been <strong style="color: #4caf50;">approved</strong> by our team. You can now start listing products in the 1Kappa shop!
          </p>
          
          ${
            invitationToken
              ? `
          <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #2e7d32;">
              <strong>Next Steps:</strong><br>
              • Click the link below to set up your seller account<br>
              • Create a secure password for your account<br>
              • Start adding products to your store<br>
              • Your products will be visible to all members once published
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #dc143c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Set Up Your Seller Account
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">
            Or copy and paste this link into your browser:<br>
            <a href="${invitationLink}" style="color: #dc143c; word-break: break-all;">${invitationLink}</a>
          </p>
          `
              : `
          <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #2e7d32;">
              <strong>Next Steps:</strong><br>
              • Log in to your existing account<br>
              • Navigate to your seller dashboard<br>
              • Start adding products to your store<br>
              • Your products will be visible to all members once published
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/login" 
               style="background-color: #dc143c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Log In to Your Account
            </a>
          </div>
          `
          }
          
          <p style="font-size: 16px;">
            We're excited to have you as part of our seller community. If you need any assistance getting started or have questions about listing products, please don't hesitate to reach out.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The 1Kappa Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Congratulations! Your Seller Application Has Been Approved - 1Kappa

Hello ${name},

Great news! Your seller application has been approved by our team. You can now start listing products in the 1Kappa shop!

${
  invitationToken
    ? `
Next Steps:
• Click this link to set up your seller account: ${invitationLink}
• Create a secure password for your account
• Start adding products to your store
• Your products will be visible to all members once published
`
    : `
Next Steps:
• Log in to your existing account
• Navigate to your seller dashboard
• Start adding products to your store
• Your products will be visible to all members once published
`
}

We're excited to have you as part of our seller community. If you need any assistance getting started or have questions about listing products, please don't hesitate to reach out.

Best regards,
The 1Kappa Team

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
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
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Seller approved email sent successfully to ${email}`);
  } catch (error) {
    console.error(`❌ Error sending seller approved email to ${email}:`, error);
    // Don't throw - email failure shouldn't break the approval process
  }
}

/**
 * Send an email notification to seller when a purchase is attempted but Stripe is not connected
 */
export async function sendSellerStripeSetupRequiredEmail(
  email: string,
  sellerName: string,
  productName: string,
  productId: number
): Promise<void> {
  const subject = "Action Required: Connect Stripe to Activate Your Listings";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const sellerSetupUrl = `${frontendUrl}/seller-setup`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Stripe Setup Required</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">Action Required</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${sellerName},</p>
          
          <p style="font-size: 16px;">
            <strong>A Brother attempted to purchase your item!</strong>
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #856404;">
              <strong>Product:</strong> ${productName}<br>
              <strong>Product ID:</strong> #${productId}
            </p>
          </div>
          
          <p style="font-size: 16px;">
            To activate your listings and start receiving payments, you need to connect your Stripe account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${sellerSetupUrl}" style="display: inline-block; background-color: #dc143c; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Connect Stripe Now
            </a>
          </div>
          
          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #1565c0;">
              <strong>What happens when you connect Stripe?</strong><br>
              • Your listings will become available for purchase<br>
              • You'll receive payments directly to your account<br>
              • The setup process takes just a few minutes
            </p>
          </div>
          
          <p style="font-size: 16px;">
            Don't miss out on sales! Connect your Stripe account today.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The 1Kappa Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Action Required: Connect Stripe to Activate Your Listings - 1Kappa

Hello ${sellerName},

A Brother attempted to purchase your item!

Product: ${productName}
Product ID: #${productId}

To activate your listings and start receiving payments, you need to connect your Stripe account.

Connect Stripe Now: ${sellerSetupUrl}

What happens when you connect Stripe?
• Your listings will become available for purchase
• You'll receive payments directly to your account
• The setup process takes just a few minutes

Don't miss out on sales! Connect your Stripe account today.

Best regards,
The 1Kappa Team

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
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
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Stripe setup required email sent successfully to ${email}`);
  } catch (error) {
    console.error(
      `❌ Error sending Stripe setup required email to ${email}:`,
      error
    );
    // Don't throw - email failure shouldn't break the checkout process
  }
}

/**
 * Send email notification to all admins when a new seller application is submitted
 */
export async function sendAdminSellerApplicationNotification(
  sellerName: string,
  sellerEmail: string,
  sellerId: number
): Promise<void> {
  const subject = "New Seller Application Submitted - 1Kappa";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const adminDashboardUrl = `${frontendUrl}/admin`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Seller Application</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">New Seller Application</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello Admin,</p>
          
          <p style="font-size: 16px;">
            A new seller application has been submitted and is awaiting your review.
          </p>
          
          <div style="background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <p style="font-size: 16px; margin: 0 0 10px 0;">
              <strong>Seller Name:</strong> ${sellerName}
            </p>
            <p style="font-size: 16px; margin: 0 0 10px 0;">
              <strong>Email:</strong> ${sellerEmail}
            </p>
            <p style="font-size: 16px; margin: 0;">
              <strong>Application ID:</strong> #${sellerId}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminDashboardUrl}" 
               style="background-color: #dc143c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Review Application
            </a>
          </div>
          
          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #1565c0;">
              <strong>Next Steps:</strong><br>
              • Review the seller's application details in the admin dashboard<br>
              • Verify vendor license and business information<br>
              • Approve or reject the application
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This is an automated notification. Please log in to the admin dashboard to review the application.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The 1Kappa System
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
New Seller Application Submitted - 1Kappa

Hello Admin,

A new seller application has been submitted and is awaiting your review.

Seller Name: ${sellerName}
Email: ${sellerEmail}
Application ID: #${sellerId}

Review Application: ${adminDashboardUrl}

Next Steps:
• Review the seller's application details in the admin dashboard
• Verify vendor license and business information
• Approve or reject the application

This is an automated notification. Please log in to the admin dashboard to review the application.

Best regards,
The 1Kappa System

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
  `;

  try {
    // Get all admin users
    const { getAllAdminUsers } = await import("../db/queries-sequelize");
    const admins = await getAllAdminUsers();

    if (admins.length === 0) {
      console.log(
        "⚠️  No admin users found to notify about seller application"
      );
      return;
    }

    // Send email to all admins
    const emailPromises = admins.map(async (admin) => {
      try {
        const command = new SendEmailCommand({
          Source: FROM_EMAIL,
          Destination: {
            ToAddresses: [admin.email],
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: htmlBody,
                Charset: "UTF-8",
              },
              Text: {
                Data: textBody,
                Charset: "UTF-8",
              },
            },
          },
        });

        await sesClient.send(command);
        console.log(
          `✅ Admin notification email sent successfully to ${admin.email}`
        );
      } catch (error) {
        console.error(
          `❌ Error sending admin notification email to ${admin.email}:`,
          error
        );
        // Don't throw - continue sending to other admins even if one fails
      }
    });

    await Promise.allSettled(emailPromises);
    console.log(
      `✅ Admin notification emails sent to ${admins.length} admin(s) for seller application #${sellerId}`
    );
  } catch (error) {
    console.error(
      `❌ Error sending admin notification emails for seller application #${sellerId}:`,
      error
    );
    // Don't throw - email failure shouldn't break the application submission
  }
}

/**
 * Send email notification when admin modifies a product
 */
export async function sendProductModifiedEmail(
  ownerEmail: string,
  ownerName: string,
  productName: string,
  adminReason: string
): Promise<void> {
  const subject = "Your Product Has Been Modified - 1Kappa";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Modified</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">Product Modified</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${ownerName},</p>
          
          <p style="font-size: 16px;">
            An administrator has made changes to your product listing: <strong>"${productName}"</strong>
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #856404;">
              <strong>Admin's Reason:</strong><br>
              ${adminReason}
            </p>
          </div>
          
          <p style="font-size: 16px;">
            Please review the changes to your product listing. If you have any questions or concerns, please contact our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/seller-dashboard" 
               style="background-color: #dc143c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Your Products
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The 1Kappa Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Product Modified - 1Kappa

Hello ${ownerName},

An administrator has made changes to your product listing: "${productName}"

Admin's Reason:
${adminReason}

Please review the changes to your product listing. If you have any questions or concerns, please contact our support team.

View Your Products: ${frontendUrl}/seller-dashboard

Best regards,
The 1Kappa Team

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
  `;

  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [ownerEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Product modified email sent successfully to ${ownerEmail}`);
  } catch (error) {
    console.error(
      `❌ Error sending product modified email to ${ownerEmail}:`,
      error
    );
    // Don't throw - email failure shouldn't break the modification process
  }
}

/**
 * Send email notification when admin deletes a product
 */
export async function sendProductDeletedEmail(
  ownerEmail: string,
  ownerName: string,
  productName: string,
  adminReason: string
): Promise<void> {
  const subject = "Your Product Has Been Removed - 1Kappa";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Removed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">Product Removed</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${ownerName},</p>
          
          <p style="font-size: 16px;">
            An administrator has removed your product listing: <strong>"${productName}"</strong>
          </p>
          
          <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #721c24;">
              <strong>Admin's Reason:</strong><br>
              ${adminReason}
            </p>
          </div>
          
          <p style="font-size: 16px;">
            This product is no longer visible to buyers. If you believe this was done in error or have questions, please contact our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/contact" 
               style="background-color: #dc143c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The 1Kappa Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Product Removed - 1Kappa

Hello ${ownerName},

An administrator has removed your product listing: "${productName}"

Admin's Reason:
${adminReason}

This product is no longer visible to buyers. If you believe this was done in error or have questions, please contact our support team.

Contact Support: ${frontendUrl}/contact

Best regards,
The 1Kappa Team

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
  `;

  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [ownerEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Product deleted email sent successfully to ${ownerEmail}`);
  } catch (error) {
    console.error(
      `❌ Error sending product deleted email to ${ownerEmail}:`,
      error
    );
    // Don't throw - email failure shouldn't break the deletion process
  }
}

/**
 * Send email notification when admin modifies an event
 */
export async function sendEventModifiedEmail(
  ownerEmail: string,
  ownerName: string,
  eventTitle: string,
  adminReason: string
): Promise<void> {
  const subject = "Your Event Has Been Modified - 1Kappa";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Modified</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">Event Modified</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${ownerName},</p>
          
          <p style="font-size: 16px;">
            An administrator has made changes to your event: <strong>"${eventTitle}"</strong>
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #856404;">
              <strong>Admin's Reason:</strong><br>
              ${adminReason}
            </p>
          </div>
          
          <p style="font-size: 16px;">
            Please review the changes to your event. If you have any questions or concerns, please contact our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/promoter-dashboard/events" 
               style="background-color: #dc143c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Your Events
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The 1Kappa Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Event Modified - 1Kappa

Hello ${ownerName},

An administrator has made changes to your event: "${eventTitle}"

Admin's Reason:
${adminReason}

Please review the changes to your event. If you have any questions or concerns, please contact our support team.

View Your Events: ${frontendUrl}/promoter-dashboard/events

Best regards,
The 1Kappa Team

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
  `;

  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [ownerEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Event modified email sent successfully to ${ownerEmail}`);
  } catch (error) {
    console.error(
      `❌ Error sending event modified email to ${ownerEmail}:`,
      error
    );
    // Don't throw - email failure shouldn't break the modification process
  }
}

/**
 * Send email notification when admin cancels an event
 */
export async function sendEventDeletedEmail(
  ownerEmail: string,
  ownerName: string,
  eventTitle: string,
  adminReason: string
): Promise<void> {
  const subject = "Your Event Has Been Cancelled - 1Kappa";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
          <img src="${getLogoUrl()}" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
          <h1 style="color: #dc143c; margin: 0; font-size: 28px;">Event Cancelled</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${ownerName},</p>
          
          <p style="font-size: 16px;">
            An administrator has cancelled your event: <strong>"${eventTitle}"</strong>
          </p>
          
          <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0; color: #721c24;">
              <strong>Admin's Reason:</strong><br>
              ${adminReason}
            </p>
          </div>
          
          <p style="font-size: 16px;">
            This event is no longer visible to members. If you believe this was done in error or have questions, please contact our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/contact" 
               style="background-color: #dc143c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc143c;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Best regards,<br>
              The 1Kappa Team
            </p>
          </div>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <p style="color: #fff; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 1Kappa. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Event Cancelled - 1Kappa

Hello ${ownerName},

An administrator has cancelled your event: "${eventTitle}"

Admin's Reason:
${adminReason}

This event is no longer visible to members. If you believe this was done in error or have questions, please contact our support team.

Contact Support: ${frontendUrl}/contact

Best regards,
The 1Kappa Team

© ${new Date().getFullYear()} 1Kappa. All rights reserved.
  `;

  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [ownerEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Event deleted email sent successfully to ${ownerEmail}`);
  } catch (error) {
    console.error(
      `❌ Error sending event deleted email to ${ownerEmail}:`,
      error
    );
    // Don't throw - email failure shouldn't break the deletion process
  }
}

