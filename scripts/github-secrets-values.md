# GitHub Actions Secrets - Values to Set

## Quick Reference for Setting GitHub Secrets

Go to: **https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions**

### Deployment Secrets

| Secret Name               | Value                                                   | Notes                                  |
| ------------------------- | ------------------------------------------------------- | -------------------------------------- |
| `VERCEL_TOKEN`            | [Get from Vercel](https://vercel.com/account/tokens)    | Create new token with full access      |
| `HEROKU_API_KEY`          | [Get from Heroku](https://dashboard.heroku.com/account) | Reveal API key from account settings   |
| `HEROKU_STAGING_API_KEY`  | Same as `HEROKU_API_KEY`                                | Usually same key for both environments |
| `HEROKU_APP_NAME`         | `onekappa`                                              | Production Heroku app name             |
| `HEROKU_STAGING_APP_NAME` | `onekappa-dev`                                          | Staging Heroku app name                |
| `HEROKU_EMAIL`            | `buddy.talton@outlook.com`                              | Your Heroku account email              |

### Production Database Credentials

Extracted from your production Heroku `DATABASE_URL`:

| Secret Name         | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| `DATABASE_HOST`     | `ep-raspy-term-ahecpsxb-pooler.c-3.us-east-1.aws.neon.tech` |
| `DATABASE_USERNAME` | `neondb_owner`                                              |
| `DATABASE_PASSWORD` | `npg_Bdh65FajoxkZ`                                          |
| `DATABASE_NAME`     | `1kappa_db`                                                 |

### Staging Database Credentials

Extracted from your staging Heroku `DATABASE_URL`:

| Secret Name                 | Value                                                |
| --------------------------- | ---------------------------------------------------- |
| `STAGING_DATABASE_HOST`     | `ep-icy-bar-a46bm73a-pooler.us-east-1.aws.neon.tech` |
| `STAGING_DATABASE_USERNAME` | `neondb_owner`                                       |
| `STAGING_DATABASE_PASSWORD` | `npg_nsqmiePG6w7Q`                                   |
| `STAGING_DATABASE_NAME`     | `neondb`                                             |

### Optional Secrets (Recommended)

| Secret Name           | Value                                     | Notes                     |
| --------------------- | ----------------------------------------- | ------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://onekappa.herokuapp.com`          | Production backend URL    |
| `NEXTAUTH_URL`        | `https://www.one-kappa.com`               | Production frontend URL   |
| `NEXTAUTH_SECRET`     | [Generate with `openssl rand -base64 32`] | Should match Vercel value |

## Steps to Set Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. For each secret above:
   - **Name**: Use the exact name from the table
   - **Value**: Copy the value from the table (or generate/retrieve as noted)
   - Click **Add secret**

## Important Notes

- **VERCEL_TOKEN**: You need to create this at https://vercel.com/account/tokens
- **HEROKU_API_KEY**: Get this from https://dashboard.heroku.com/account (click "Reveal")
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32` - should match the one in Vercel
- Database passwords are sensitive - keep them secure
- After setting secrets, test the GitHub Actions workflow

## Verification

After setting all secrets, you can verify by:

1. Pushing to `main` branch (triggers production deployment)
2. Pushing to `development` branch (triggers staging deployment)
3. Check GitHub Actions tab to see if workflows run successfully
