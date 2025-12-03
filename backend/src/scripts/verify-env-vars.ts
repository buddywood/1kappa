#!/usr/bin/env tsx
/**
 * Environment Variables Verification Script
 * 
 * This script verifies that all required environment variables are set
 * for production deployment across GitHub Actions, Vercel, and Heroku.
 * 
 * Usage:
 *   tsx src/scripts/verify-env-vars.ts [--platform=all|github|vercel|heroku]
 */

interface EnvVarCheck {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean | string;
  example?: string;
}

interface PlatformConfig {
  name: string;
  description: string;
  vars: EnvVarCheck[];
}

const platforms: PlatformConfig[] = [
  {
    name: 'heroku',
    description: 'Backend (Heroku) Environment Variables',
    vars: [
      {
        name: 'PORT',
        required: false,
        description: 'Server port (Heroku sets automatically)',
        example: '3001'
      },
      {
        name: 'FRONTEND_URL',
        required: true,
        description: 'Production frontend URL',
        validator: (v) => v.startsWith('https://') || 'Must start with https://',
        example: 'https://1kappa.com'
      },
      {
        name: 'DATABASE_URL',
        required: true,
        description: 'Neon PostgreSQL connection string',
        validator: (v) => v.startsWith('postgresql://') || 'Must be a PostgreSQL connection string',
        example: 'postgresql://user:pass@host:5432/dbname'
      },
      {
        name: 'STRIPE_SECRET_KEY',
        required: true,
        description: 'Stripe secret key (production)',
        validator: (v) => v.startsWith('sk_live_') || 'Must start with sk_live_ for production',
        example: 'sk_live_...'
      },
      {
        name: 'STRIPE_WEBHOOK_SECRET',
        required: true,
        description: 'Stripe webhook signing secret',
        validator: (v) => v.startsWith('whsec_') || 'Must start with whsec_',
        example: 'whsec_...'
      },
      {
        name: 'AWS_ACCESS_KEY_ID',
        required: true,
        description: 'AWS access key for S3/SES',
        validator: (v) => v.length >= 16 || 'Invalid AWS access key format',
        example: 'AKIA...'
      },
      {
        name: 'AWS_SECRET_ACCESS_KEY',
        required: true,
        description: 'AWS secret access key',
        validator: (v) => v.length >= 32 || 'Invalid AWS secret key format',
        example: '...'
      },
      {
        name: 'AWS_S3_BUCKET_NAME',
        required: true,
        description: 'S3 bucket name',
        example: '1kappa-uploads'
      },
      {
        name: 'AWS_REGION',
        required: true,
        description: 'AWS region',
        validator: (v) => /^[a-z0-9-]+$/.test(v) || 'Invalid AWS region format',
        example: 'us-east-1'
      },
      {
        name: 'FROM_EMAIL',
        required: true,
        description: 'Verified SES email address',
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Must be a valid email address',
        example: 'noreply@1kappa.com'
      },
      {
        name: 'COGNITO_USER_POOL_ID',
        required: true,
        description: 'AWS Cognito User Pool ID',
        validator: (v) => /^[a-zA-Z0-9-_]+$/.test(v) || 'Invalid Cognito User Pool ID format',
        example: 'us-east-1_xxxxxxxxx'
      },
      {
        name: 'COGNITO_CLIENT_ID',
        required: true,
        description: 'AWS Cognito App Client ID',
        validator: (v) => v.length >= 20 || 'Invalid Cognito Client ID format',
        example: 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
      },
      {
        name: 'COGNITO_REGION',
        required: false,
        description: 'AWS Cognito region (falls back to AWS_REGION)',
        example: 'us-east-1'
      },
      {
        name: 'COGNITO_CLIENT_SECRET',
        required: false,
        description: 'Cognito client secret (only if using secret)',
        example: '...'
      },
      {
        name: 'NODE_ENV',
        required: false,
        description: 'Node environment (Heroku may set automatically)',
        example: 'production'
      }
    ]
  },
  {
    name: 'vercel',
    description: 'Frontend (Vercel) Environment Variables',
    vars: [
      {
        name: 'NEXT_PUBLIC_API_URL',
        required: true,
        description: 'Backend API URL',
        validator: (v) => (v.startsWith('https://') || v.startsWith('http://')) || 'Must be a valid URL',
        example: 'https://your-app.herokuapp.com'
      },
      {
        name: 'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
        required: true,
        description: 'AWS Cognito User Pool ID',
        validator: (v) => /^[a-z0-9-_]+$/.test(v) || 'Invalid Cognito User Pool ID format',
        example: 'us-east-1_xxxxxxxxx'
      },
      {
        name: 'NEXT_PUBLIC_COGNITO_CLIENT_ID',
        required: true,
        description: 'AWS Cognito App Client ID',
        validator: (v) => v.length >= 20 || 'Invalid Cognito Client ID format',
        example: 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
      },
      {
        name: 'NEXT_PUBLIC_COGNITO_REGION',
        required: true,
        description: 'AWS Cognito region',
        validator: (v) => /^[a-z0-9-]+$/.test(v) || 'Invalid AWS region format',
        example: 'us-east-1'
      },
      {
        name: 'NEXTAUTH_SECRET',
        required: true,
        description: 'NextAuth secret key',
        validator: (v) => v.length >= 32 || 'Secret should be at least 32 characters',
        example: '(generate with: openssl rand -base64 32)'
      },
      {
        name: 'NEXTAUTH_URL',
        required: true,
        description: 'Production frontend URL',
        validator: (v) => v.startsWith('https://') || 'Must start with https://',
        example: 'https://1kappa.com'
      },
      {
        name: 'NEXT_PUBLIC_SUPPORT_URL',
        required: false,
        description: 'Support page URL (optional)',
        example: '/support'
      }
    ]
  },
  {
    name: 'github',
    description: 'GitHub Actions Secrets',
    vars: [
      {
        name: 'VERCEL_TOKEN',
        required: true,
        description: 'Vercel API token',
        validator: (v) => v.length >= 20 || 'Invalid token format',
        example: '...'
      },
      {
        name: 'HEROKU_API_KEY',
        required: true,
        description: 'Heroku API key (production)',
        validator: (v) => v.length >= 20 || 'Invalid API key format',
        example: '...'
      },
      {
        name: 'HEROKU_STAGING_API_KEY',
        required: true,
        description: 'Heroku API key (staging/preview)',
        validator: (v) => v.length >= 20 || 'Invalid API key format',
        example: '...'
      },
      {
        name: 'HEROKU_APP_NAME',
        required: true,
        description: 'Heroku production app name',
        example: '1kappa-api'
      },
      {
        name: 'HEROKU_STAGING_APP_NAME',
        required: true,
        description: 'Heroku staging app name',
        example: '1kappa-api-staging'
      },
      {
        name: 'HEROKU_EMAIL',
        required: true,
        description: 'Heroku account email',
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Must be a valid email address',
        example: 'your-email@example.com'
      },
      {
        name: 'DATABASE_HOST',
        required: true,
        description: 'Production database host',
        example: 'ep-xxx.us-east-1.aws.neon.tech'
      },
      {
        name: 'DATABASE_USERNAME',
        required: true,
        description: 'Production database username',
        example: 'neondb'
      },
      {
        name: 'DATABASE_PASSWORD',
        required: true,
        description: 'Production database password',
        validator: (v) => v.length >= 8 || 'Password should be at least 8 characters',
        example: '...'
      },
      {
        name: 'DATABASE_NAME',
        required: true,
        description: 'Production database name',
        example: 'neondb'
      },
      {
        name: 'STAGING_DATABASE_HOST',
        required: true,
        description: 'Staging database host',
        example: 'ep-xxx.us-east-1.aws.neon.tech'
      },
      {
        name: 'STAGING_DATABASE_USERNAME',
        required: true,
        description: 'Staging database username',
        example: 'neondb'
      },
      {
        name: 'STAGING_DATABASE_PASSWORD',
        required: true,
        description: 'Staging database password',
        validator: (v) => v.length >= 8 || 'Password should be at least 8 characters',
        example: '...'
      },
      {
        name: 'STAGING_DATABASE_NAME',
        required: true,
        description: 'Staging database name',
        example: 'neondb'
      },
      {
        name: 'NEXT_PUBLIC_API_URL',
        required: false,
        description: 'Production API URL (optional, has fallback)',
        example: 'https://your-app.herokuapp.com'
      },
      {
        name: 'NEXTAUTH_URL',
        required: false,
        description: 'Production frontend URL (optional, has fallback)',
        example: 'https://1kappa.com'
      },
      {
        name: 'NEXTAUTH_SECRET',
        required: false,
        description: 'NextAuth secret (optional, has fallback)',
        example: '(generate with: openssl rand -base64 32)'
      }
    ]
  }
];

interface CheckResult {
  name: string;
  status: 'missing' | 'invalid' | 'valid' | 'optional-missing';
  value?: string;
  error?: string;
  example?: string;
}

function checkPlatform(platform: PlatformConfig, envVars: Record<string, string>): CheckResult[] {
  const results: CheckResult[] = [];

  for (const envVar of platform.vars) {
    const value = envVars[envVar.name];
    const result: CheckResult = {
      name: envVar.name,
      status: 'valid',
      value: value ? (value.length > 50 ? `${value.substring(0, 20)}...` : value) : undefined,
      example: envVar.example
    };

    if (!value) {
      if (envVar.required) {
        result.status = 'missing';
      } else {
        result.status = 'optional-missing';
      }
    } else if (value === '[SET]') {
      // Vercel variables are marked as [SET] since we can't read actual values
      result.status = 'valid';
      result.value = '[Encrypted]';
    } else if (envVar.validator) {
      const validation = envVar.validator(value);
      if (validation !== true) {
        result.status = 'invalid';
        result.error = typeof validation === 'string' ? validation : 'Validation failed';
      }
    }

    results.push(result);
  }

  return results;
}

function printResults(platform: PlatformConfig, results: CheckResult[]) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 ${platform.description}`);
  console.log('='.repeat(80));

  const missing = results.filter(r => r.status === 'missing');
  const invalid = results.filter(r => r.status === 'invalid');
  const valid = results.filter(r => r.status === 'valid');
  const optional = results.filter(r => r.status === 'optional-missing');

  if (missing.length > 0) {
    console.log(`\n❌ Missing Required Variables (${missing.length}):`);
    missing.forEach(r => {
      console.log(`   • ${r.name}`);
      if (r.example) console.log(`     Example: ${r.example}`);
    });
  }

  if (invalid.length > 0) {
    console.log(`\n⚠️  Invalid Variables (${invalid.length}):`);
    invalid.forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
      if (r.value) console.log(`     Current: ${r.value}`);
      if (r.example) console.log(`     Example: ${r.example}`);
    });
  }

  if (valid.length > 0) {
    console.log(`\n✅ Valid Variables (${valid.length}):`);
    valid.forEach(r => {
      console.log(`   • ${r.name}${r.value ? ` = ${r.value}` : ''}`);
    });
  }

  if (optional.length > 0) {
    console.log(`\nℹ️  Optional Variables Not Set (${optional.length}):`);
    optional.forEach(r => {
      console.log(`   • ${r.name}`);
      if (r.example) console.log(`     Example: ${r.example}`);
    });
  }

  const summary = [
    valid.length > 0 && `✅ ${valid.length} valid`,
    missing.length > 0 && `❌ ${missing.length} missing`,
    invalid.length > 0 && `⚠️  ${invalid.length} invalid`,
    optional.length > 0 && `ℹ️  ${optional.length} optional`
  ].filter(Boolean).join(', ');

  console.log(`\n📊 Summary: ${summary}`);
}

async function checkHerokuVars(): Promise<Record<string, string>> {
  console.log('\n🔍 Checking Heroku environment variables...');
  console.log('   (Note: This requires Heroku CLI and authentication)');
  
  const vars: Record<string, string> = {};

  try {
    // Try to get Heroku config vars
    // This will only work if you have Heroku CLI installed and are authenticated
    const appName = process.env.HEROKU_APP_NAME;
    if (appName) {
      try {
        const { execSync } = require('child_process');
        const output = execSync(`heroku config --app ${appName} --json`, { encoding: 'utf-8' });
        const config = JSON.parse(output);
        Object.assign(vars, config);
      } catch (error) {
        console.log('   ⚠️  Could not fetch Heroku config (CLI not available or not authenticated)');
        console.log('   💡 Set HEROKU_APP_NAME env var and ensure Heroku CLI is authenticated');
      }
    } else {
      console.log('   ⚠️  HEROKU_APP_NAME not set - cannot fetch Heroku config');
      console.log('   💡 Set HEROKU_APP_NAME to check Heroku variables');
    }
  } catch (error) {
    console.log('   ⚠️  Could not check Heroku variables');
  }

  return vars;
}

async function checkVercelVars(): Promise<Record<string, string>> {
  console.log('\n🔍 Checking Vercel environment variables...');
  console.log('   (Note: This requires Vercel CLI and authentication)');
  
  const vars: Record<string, string> = {};

  try {
    // Try to get Vercel env vars
    // This will only work if you have Vercel CLI installed and are authenticated
    const { execSync } = require('child_process');
    const path = require('path');
    const frontendPath = path.resolve(process.cwd(), '../frontend');
    
    try {
      // Vercel CLI doesn't support --json, so parse the table output
      const output = execSync('vercel env ls production', { encoding: 'utf-8', cwd: frontendPath, stdio: ['pipe', 'pipe', 'pipe'] });
      
      // Parse the table output - look for lines with variable names
      // Format: name                                value               environments        created
      const lines = output.split('\n');
      let foundHeader = false;
      
      for (const line of lines) {
        // Skip until we find the header line
        if (line.includes('name') && line.includes('value') && line.includes('environments')) {
          foundHeader = true;
          continue;
        }
        
        // Skip lines before header, empty lines, and info messages
        if (!foundHeader || line.trim() === '' || 
            line.includes('Environment Variables found') ||
            line.includes('Retrieving project') ||
            line.includes('Vercel CLI') ||
            line.includes('Common next commands')) {
          continue;
        }
        
        // Parse the table format - variable name is first column
        // Format: NEXT_PUBLIC_API_URL                 Encrypted           Production          ...
        // The variable name is the first word, followed by whitespace
        const trimmedLine = line.trim();
        if (trimmedLine) {
          const parts = trimmedLine.split(/\s+/);
          if (parts.length > 0 && parts[0].includes('_')) {
            // Likely an environment variable (contains underscore)
            const varName = parts[0];
            // Mark as present (we can't get the actual value, but we know it exists)
            vars[varName] = '[SET]';
          }
        }
      }
    } catch (error: any) {
      // If production filter fails, try without filter and check for Production
      try {
        const output = execSync('vercel env ls', { encoding: 'utf-8', cwd: frontendPath, stdio: ['pipe', 'pipe', 'pipe'] });
        const lines = output.split('\n');
        let foundHeader = false;
        
        for (const line of lines) {
          if (line.includes('name') && line.includes('value') && line.includes('environments')) {
            foundHeader = true;
            continue;
          }
          
          if (!foundHeader || line.trim() === '' || 
              line.includes('Environment Variables found') ||
              line.includes('Retrieving project') ||
              line.includes('Vercel CLI')) {
            continue;
          }
          
          const trimmedLine = line.trim();
          if (trimmedLine && trimmedLine.includes('Production')) {
            const parts = trimmedLine.split(/\s+/);
            if (parts.length > 0 && parts[0].includes('_')) {
              const varName = parts[0];
              vars[varName] = '[SET]';
            }
          }
        }
      } catch (error2) {
        console.log('   ⚠️  Could not fetch Vercel env vars (CLI not available or not authenticated)');
        console.log('   💡 Ensure Vercel CLI is installed and authenticated: vercel login');
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not check Vercel variables');
  }

  return vars;
}

async function checkGitHubSecrets(): Promise<Record<string, string>> {
  console.log('\n🔍 Checking GitHub Actions secrets...');
  console.log('   (Note: GitHub secrets cannot be read via API - manual check required)');
  console.log('   💡 Go to: GitHub → Settings → Secrets and variables → Actions');
  
  // GitHub secrets cannot be read programmatically for security reasons
  // Return empty object and rely on manual verification
  return {};
}

async function main() {
  const args = process.argv.slice(2);
  const platformArg = args.find(arg => arg.startsWith('--platform='));
  const platformFilter = platformArg ? platformArg.split('=')[1] : 'all';

  console.log('🔐 Environment Variables Verification');
  console.log('=====================================\n');

  if (platformFilter === 'all' || platformFilter === 'heroku') {
    const herokuVars = await checkHerokuVars();
    const herokuPlatform = platforms.find(p => p.name === 'heroku')!;
    const herokuResults = checkPlatform(herokuPlatform, herokuVars);
    printResults(herokuPlatform, herokuResults);
  }

  if (platformFilter === 'all' || platformFilter === 'vercel') {
    const vercelVars = await checkVercelVars();
    const vercelPlatform = platforms.find(p => p.name === 'vercel')!;
    const vercelResults = checkPlatform(vercelPlatform, vercelVars);
    printResults(vercelPlatform, vercelResults);
  }

  if (platformFilter === 'all' || platformFilter === 'github') {
    const githubVars = await checkGitHubSecrets();
    const githubPlatform = platforms.find(p => p.name === 'github')!;
    const githubResults = checkPlatform(githubPlatform, githubVars);
    printResults(githubPlatform, githubResults);
    
    console.log('\n📝 GitHub Secrets Checklist:');
    console.log('   Go to: https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions');
    console.log('   Verify all required secrets are set manually.');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✨ Verification complete!');
  console.log('\n💡 Tips:');
  console.log('   • For Heroku: Use `heroku config --app YOUR_APP` to view all vars');
  console.log('   • For Vercel: Use `vercel env ls` in the frontend directory');
  console.log('   • For GitHub: Check secrets in repository settings');
  console.log('   • Run with --platform=heroku|vercel|github to check specific platform');
  console.log('='.repeat(80) + '\n');
}

if (require.main === module) {
  main().catch(console.error);
}

