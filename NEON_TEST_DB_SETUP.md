# Neon Test Database Setup for Preview Deployments

This guide will help you create a separate test database on Neon.tech for your Vercel preview deployments.

## Step 1: Create a New Neon Database

1. **Go to Neon Dashboard**
   - Visit https://console.neon.tech
   - Log in to your account

2. **Create a New Project**
   - Click "New Project" or "+" button
   - Name it something like: `1kappa-preview` or `1kappa-test`
   - Choose a region (same as your production database is recommended)
   - Click "Create Project"

3. **Get the Connection String**
   - Once created, you'll see the connection string on the project dashboard
   - It will look like: `postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`
   - **Copy this connection string** - you'll need it for the next steps

## Step 2: Set Up the Database Schema

The database schema will be automatically created when your backend connects, but you can also run migrations manually:

```bash
# Set the DATABASE_URL temporarily
export DATABASE_URL="your-neon-connection-string-here"

# Run migrations
cd backend
npm run migrate
```

## Step 3: Configure for Vercel Preview Deployments

### Option A: Single Test Database for All Previews (Simpler)

1. **Set in Vercel Dashboard:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add `DATABASE_URL` with your test database connection string
   - Set it for "Preview" environment (not Production)

### Option B: Different Database Per Preview Branch (More Isolated)

1. **Use Vercel Environment Variables with Branch-Specific Values:**
   - In Vercel, you can set environment variables per branch
   - Go to Environment Variables → Add New
   - Set `DATABASE_URL` for specific branches (e.g., `development`, `staging`)
   - Each preview will use the database configured for its branch

2. **Or Use Vercel CLI:**
   ```bash
   vercel env add DATABASE_URL preview
   # Paste your test database connection string
   ```

## Step 4: Configure Heroku Backend (if using)

If your backend is on Heroku and you want it to use the test database for preview deployments:

```bash
# For your dev/staging Heroku app
heroku config:set DATABASE_URL="your-neon-test-connection-string" --app onekappa-dev

# Or create a separate Heroku app for previews
heroku create onekappa-preview
heroku config:set DATABASE_URL="your-neon-test-connection-string" --app onekappa-preview
```

## Step 5: Seed Test Data

Once your test database is set up, you can seed it with test data:

```bash
# If using Heroku
heroku run npm run seed:test --app onekappa-dev

# Or if running locally with test DB
DATABASE_URL="your-neon-test-connection-string" npm run seed:test
```

## Step 6: Verify the Setup

1. **Check Database Connection:**
   - Your backend should automatically connect on startup
   - Check logs to confirm connection

2. **Verify Tables Created:**
   - You can use Neon's SQL Editor in the dashboard
   - Or connect with a PostgreSQL client
   - Run: `\dt` to list tables

## Best Practices

- **Keep Production and Test Separate:** Never use the same database for production and preview/test
- **Regular Cleanup:** Consider setting up a script to reset test data periodically
- **Branch-Specific DBs:** For critical features, consider separate databases per major branch
- **Monitor Usage:** Neon free tier has limits, monitor your usage

## Connection String Format

Your Neon connection string will look like:
```
postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require
```

Make sure to:
- Keep it secure (don't commit to git)
- Use environment variables
- Enable SSL (Neon requires it)

## Troubleshooting

- **Connection Issues:** Make sure SSL is enabled (`?sslmode=require`)
- **Schema Not Created:** Run migrations manually: `npm run migrate`
- **Can't Connect:** Check firewall settings in Neon dashboard
- **Timeout:** Neon has connection limits on free tier, consider upgrading if needed


