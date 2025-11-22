# AWS SES Setup Guide

This guide covers the setup required to use Amazon Simple Email Service (SES) for sending welcome emails.

## Prerequisites

- AWS Account
- AWS credentials with appropriate permissions
- Domain or email address to send from

## Step 1: Verify Your Email Address or Domain

### Option A: Verify a Single Email Address (Quick for Testing)

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to **Verified identities** → **Create identity**
3. Select **Email address**
4. Enter the email address you want to use (e.g., `noreply@yourdomain.com`)
5. Click **Create identity**
6. Check the email inbox and click the verification link
7. Once verified, you can send emails **only to verified email addresses** (sandbox mode)

### Option B: Verify Your Domain (Recommended for Production)

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to **Verified identities** → **Create identity**
3. Select **Domain**
4. Enter your domain name (e.g., `yourdomain.com`)
5. Choose verification method:
   - **Easy DKIM** (recommended): AWS automatically configures DKIM
   - **Provide DKIM tokens**: You manually add DNS records
6. Add the provided DNS records to your domain's DNS settings:
   - **CNAME records** for DKIM (3 records)
   - **TXT record** for domain verification
7. Wait for DNS propagation (can take up to 72 hours, usually much faster)
8. Once verified, you can send from any email address on that domain

## Step 2: Request Production Access (Required for Production)

By default, AWS SES accounts are in **sandbox mode**, which means:
- You can only send emails **to verified email addresses**
- You can send up to 200 emails per day
- Maximum sending rate: 1 email per second

To send to any email address:

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to **Account dashboard**
3. Click **Request production access**
4. Fill out the form:
   - **Mail Type**: Select "Transactional" (for welcome emails)
   - **Website URL**: Your application URL
   - **Use case description**: Describe your use case (e.g., "Sending welcome emails to newly registered members")
   - **Compliance**: Confirm you'll handle bounces and complaints
5. Submit the request
6. AWS typically approves within 24 hours

## Step 3: Configure IAM Permissions

Your AWS credentials need SES permissions. Create an IAM policy:

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
    }
  ]
}
```

Or use the AWS managed policy: `AmazonSESFullAccess` (for development) or create a custom policy with minimal permissions.

## Step 4: Configure Environment Variables

Add to your `backend/.env.local` (or production environment):

```env
# AWS SES Configuration
AWS_REGION=us-east-1  # Must match your SES region
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
FROM_EMAIL=noreply@yourdomain.com  # Must be verified in SES
```

**Important**: 
- `FROM_EMAIL` must match a verified email address or be from a verified domain
- `AWS_REGION` must match the region where you verified your identity

## Step 5: Test Email Sending

### Testing in Sandbox Mode

1. Verify a test recipient email address in SES console
2. Complete a registration in your app
3. Check the recipient's inbox for the welcome email
4. Check backend logs for email sending status

### Testing in Production Mode

1. Complete a registration with any email address
2. Verify the email is received
3. Monitor SES metrics in the console

## Troubleshooting

### Common Issues

1. **"Email address not verified"**
   - Ensure the `FROM_EMAIL` is verified in SES
   - Check that you're using the correct email address

2. **"Account is in sandbox mode"**
   - You can only send to verified recipients
   - Request production access to send to any email

3. **"Access Denied"**
   - Check IAM permissions
   - Ensure credentials have `ses:SendEmail` permission

4. **"Region mismatch"**
   - Ensure `AWS_REGION` matches your SES region
   - Verify identity in the same region you're sending from

### Monitoring

- **SES Console** → **Sending statistics**: View send rates, bounces, complaints
- **CloudWatch**: Monitor SES metrics and set up alarms
- **Backend logs**: Check for email sending errors

## Best Practices

1. **Use a verified domain** instead of individual email addresses
2. **Set up bounce/complaint handling** (SNS topics)
3. **Monitor your sending reputation** in the SES console
4. **Start with low volume** and gradually increase
5. **Use production access** only when ready to send to real users
6. **Keep bounce rate below 5%** to maintain good reputation

## Cost

- **Free Tier**: 62,000 emails/month (if sent from EC2)
- **Pay-as-you-go**: $0.10 per 1,000 emails after free tier
- **Very affordable** for most applications

## Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [SES Pricing](https://aws.amazon.com/ses/pricing/)

