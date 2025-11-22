# Quick Start - Local Development

## Quick Reference: Where to Run Commands

| Command Type | Directory | Example |
|-------------|-----------|---------|
| **Database commands** (`db:up`, `db:down`, etc.) | **Root** (where `docker-compose.yml` is) | `npm run db:up` |
| **Seed commands** (`seed`, `seed:test`, etc.) | **backend/** | `cd backend && npm run seed -- --test` |
| **Dev servers** (`dev`, `dev:frontend`, `dev:backend`) | **Root** | `npm run dev` |

## Prerequisites

Before you begin, make sure you have:
- **Node.js 18+** installed
- **Docker Desktop** installed and running
- **npm** installed

## 0. Install and Start the Database

### Install Docker Desktop

If you don't have Docker installed:

1. **macOS:**
   - Download from [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop
   - Make sure Docker Desktop is running (you'll see the Docker icon in your menu bar)

2. **Windows:**
   - Download from [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop

3. **Linux:**
   - Install Docker Engine: https://docs.docker.com/engine/install/
   - Install Docker Compose: https://docs.docker.com/compose/install/

### Start the Database Container

Once Docker is running, start the PostgreSQL database. **Run this from the root directory** (where `docker-compose.yml` is located):

```bash
# From the project root directory
npm run db:up
```

This command will:
- Pull the PostgreSQL 15 Alpine image (if not already downloaded)
- Create and start a container named `1kappa-db`
- Expose the database on port 5434
- Create a persistent volume for your data

**Verify the database is running:**
```bash
docker ps
```

You should see a container named `1kappa-db` with status "Up".

## Database is Running! ✅

The PostgreSQL database container is now running. Here's what to do next:

## 1. Set Up Environment Variables

### Backend (`backend/.env.local`)
Create this file with:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://1kappa:1kappa123@localhost:5434/one_kappa
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
ADMIN_KEY=dev-admin-key-123
```

### Frontend (`frontend/.env.local`)
Create this file with:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
ADMIN_KEY=dev-admin-key-123
```

**Note:** For local development, you can use placeholder values for Stripe and AWS if you're just testing the UI. The app will work but some features (checkout, image upload) won't function without real credentials.

## 2. Install Dependencies

```bash
npm run install:all
```

## 3. Start Development Servers

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 4. Verify Everything Works

1. **Check backend health:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Check database connection:**
   The backend will automatically create all tables on first startup. Check the backend logs to confirm.

3. **Visit frontend:**
   Open http://localhost:3000 in your browser

## 5. Seed Database (Optional)

For local development, you can seed the database with test data. Run these commands from the `backend` directory:

### Unified Seeder (Recommended)
```bash
cd backend
npm run seed -- --test        # Seed test data (products, sellers, promoters)
npm run seed -- --prod        # Seed production chapters (scrapes Wikipedia)
npm run seed -- --test --prod # Seed both chapters and test data
npm run seed -- --test --clear # Clear and re-seed test data
```

### Individual Seed Commands
```bash
# Seed chapters (scrapes Wikipedia)
npm run seed:chapters

# Seed alumni chapters (alternative method)
npm run seed:alumni

# Seed test data only
npm run seed:test

# Clear and re-seed test data
npm run seed:test:clear
```

**What gets seeded:**
- **Production chapters** (`--prod`): Scrapes Wikipedia for all Kappa Alpha Psi chapters (Collegiate and Alumni)
- **Test data** (`--test`): Creates test sellers, products, and promoters for local development

**Note:** Test data (sellers, products, promoters) should only be used in development. For production, use `--prod` to seed chapters from the official Wikipedia list.

## Database Commands (Local Test Database)

**📍 Where to run:** All database commands must be run from the **root directory** of the project (where `docker-compose.yml` and the root `package.json` are located).

```bash
# Make sure you're in the project root
cd /path/to/1kappa

# Then run database commands
npm run db:up
```

These commands manage the local PostgreSQL test database running in Docker:

### Start Local Test Database
```bash
npm run db:up
```
Starts the PostgreSQL container in detached mode. **Run this first** before starting the backend or seeding data. This sets up your local test database.

### Stop Local Test Database
```bash
npm run db:down
```
Stops the local test database container. Your data is preserved in the Docker volume.

### View Database Logs
```bash
npm run db:logs
```
Shows local test database logs in follow mode (press Ctrl+C to exit). Useful for debugging connection issues.

### Reset Local Test Database
```bash
npm run db:reset
```
**⚠️ Warning:** This deletes all data in your local test database! Stops the container, removes the volume (all data), and starts fresh. Useful for a clean slate during development.

### Check Database Status
```bash
docker ps
```
Shows running containers. Look for `1kappa-db` to confirm your local test database is running.

## Database Connection Info

- **Host:** localhost
- **Port:** 5434
- **Database:** one_kappa
- **User:** 1kappa
- **Password:** 1kappa123

You can connect with any PostgreSQL client using:
```
postgresql://1kappa:1kappa123@localhost:5434/one_kappa
```

## Troubleshooting

**Docker not running?**
- Make sure Docker Desktop is installed and running
- On macOS/Windows, check the Docker icon in your menu bar/system tray
- Try: `docker ps` - if this fails, Docker isn't running

**Database not responding?**
```bash
docker ps  # Check if container is running
npm run db:logs  # View database logs
```

**Port already in use?**
- Check if something else is using port 5432: `lsof -i :5432` (macOS/Linux) or `netstat -ano | findstr :5432` (Windows)
- Or change the port in `docker-compose.yml`

**Backend can't connect to database?**
- Make sure database container is running: `docker ps`
- Check DATABASE_URL in `backend/.env.local`
- Wait a few seconds after starting the container for it to be ready
- Check database logs: `npm run db:logs`

**Docker container won't start?**
- Check Docker Desktop logs
- Try: `docker-compose down` then `npm run db:up` again
- Make sure you have enough disk space (Docker images can be large)

## Next Steps

Once everything is running:
1. Visit http://localhost:3000
2. Try submitting a seller application at `/apply`
3. Login to admin dashboard at `/admin/login` (use the ADMIN_KEY from your .env.local)
4. Test the full flow!

