# Secrets Management Guide

This document explains how to manage secrets and environment variables for the 1Kappa application.

## Overview

Different types of configuration require different approaches:

1. **Public Identifiers** (Mobile & Frontend) - Can be in environment variables
2. **Actual Secrets** (Backend) - Should use AWS Secrets Manager or secure environment variables

## Mobile App Configuration

### ✅ Safe to Store in .env (Public Identifiers)

These are **NOT secrets** and are safe to embed in the mobile app:

- `EXPO_PUBLIC_COGNITO_USER_POOL_ID` - Public identifier (like OAuth client ID)
- `EXPO_PUBLIC_COGNITO_CLIENT_ID` - Public identifier (like OAuth client ID)
- `EXPO_PUBLIC_API_URL` - Public API endpoint
- `EXPO_PUBLIC_WEB_URL` - Public web URL

**Why these are safe:**
- Cognito User Pool ID and Client ID are **public identifiers**, similar to OAuth client IDs
- Security comes from the authentication flow, not from hiding these IDs
- Anyone can extract them from the app bundle anyway
- They're designed to be public

### ❌ Never Store in Mobile App

- Database passwords
- AWS access keys
- Stripe secret keys
- JWT signing keys
- Any actual secrets

## Backend Configuration

### Current Approach: Environment Variables

The backend currently uses environment variables from `.env` files:

```env
# Public identifiers (safe in .env)
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Secrets (should use Secrets Manager in production)
DATABASE_URL=postgresql://user:password@host:5432/db
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
STRIPE_SECRET_KEY=sk_live_...
```

### Recommended: AWS Secrets Manager for Production

For production deployments, use AWS Secrets Manager for actual secrets:

#### 1. Store Secrets in AWS Secrets Manager

```bash
# Store database password
aws secretsmanager create-secret \
  --name 1kappa/production/database \
  --secret-string '{"password":"your-db-password"}'

# Store AWS credentials
aws secretsmanager create-secret \
  --name 1kappa/production/aws-credentials \
  --secret-string '{"accessKeyId":"AKIA...","secretAccessKey":"..."}'

# Store Stripe key
aws secretsmanager create-secret \
  --name 1kappa/production/stripe \
  --secret-string '{"secretKey":"sk_live_..."}'
```

#### 2. Update Backend to Use Secrets Manager

Install the AWS SDK (if not already installed):
```bash
cd backend
npm install @aws-sdk/client-secrets-manager
```

Create a secrets loader utility:

```typescript
// backend/src/utils/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function getSecret(secretName: string): Promise<any> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);
    
    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    
    throw new Error(`Secret ${secretName} not found or invalid`);
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    throw error;
  }
}

// Load secrets on startup
export async function loadSecrets() {
  if (process.env.NODE_ENV === 'production' && process.env.USE_SECRETS_MANAGER === 'true') {
    try {
      const dbSecret = await getSecret('1kappa/production/database');
      process.env.DATABASE_PASSWORD = dbSecret.password;
      
      const awsSecret = await getSecret('1kappa/production/aws-credentials');
      process.env.AWS_ACCESS_KEY_ID = awsSecret.accessKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = awsSecret.secretAccessKey;
      
      const stripeSecret = await getSecret('1kappa/production/stripe');
      process.env.STRIPE_SECRET_KEY = stripeSecret.secretKey;
    } catch (error) {
      console.error('Failed to load secrets from Secrets Manager:', error);
      // Fall back to environment variables
    }
  }
}
```

#### 3. Update Server Startup

```typescript
// backend/src/server.ts
import { loadSecrets } from './utils/secrets';

async function startServer() {
  // Load secrets from AWS Secrets Manager in production
  await loadSecrets();
  
  // Continue with server startup...
}
```

## IAM Permissions for Secrets Manager

Your backend needs IAM permissions to read secrets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:1kappa/*"
    }
  ]
}
```

## Environment-Specific Configuration

### Development
- Use `.env` files (already in `.gitignore`)
- All secrets in local `.env` file

### Staging
- Use `.env.staging` or AWS Secrets Manager
- Secrets Manager recommended for shared staging environments

### Production
- **Use AWS Secrets Manager** for all actual secrets
- Public identifiers (Cognito IDs) can remain in environment variables
- Never commit secrets to version control

## Best Practices

### ✅ DO:
- Use Secrets Manager for production secrets
- Keep public identifiers (Cognito IDs) in environment variables
- Use IAM roles for EC2/ECS/Lambda (no hardcoded credentials)
- Rotate secrets regularly
- Use different secrets for each environment

### ❌ DON'T:
- Store secrets in code or version control
- Use the same secrets across environments
- Embed actual secrets in mobile apps
- Share secrets via email or chat
- Use Secrets Manager for public identifiers (unnecessary cost)

## Cost Considerations

AWS Secrets Manager pricing:
- $0.40 per secret per month
- $0.05 per 10,000 API calls

For a typical application:
- 5-10 secrets = $2-4/month
- API calls = minimal cost

**Alternative for cost savings:**
- Use AWS Systems Manager Parameter Store (free tier: 10,000 parameters)
- Use environment variables with secure deployment practices

## Migration Path

1. **Phase 1 (Current)**: All secrets in `.env` files
2. **Phase 2**: Move production secrets to Secrets Manager
3. **Phase 3**: Use IAM roles instead of access keys where possible

## Summary

| Configuration Type | Mobile App | Backend Dev | Backend Prod |
|-------------------|------------|-------------|--------------|
| Cognito User Pool ID | ✅ .env | ✅ .env | ✅ .env |
| Cognito Client ID | ✅ .env | ✅ .env | ✅ .env |
| Database Password | ❌ N/A | ✅ .env | ✅ Secrets Manager |
| AWS Access Keys | ❌ N/A | ✅ .env | ✅ Secrets Manager or IAM Role |
| Stripe Secret Key | ❌ N/A | ✅ .env | ✅ Secrets Manager |

## References

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Cognito Security Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-security.html)

