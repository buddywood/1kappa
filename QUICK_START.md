# Quick Start - Local Development

## Database is Running! ✅

The PostgreSQL database container is now running. Here's what to do next:

## 1. Set Up Environment Variables

### Backend (`backend/.env.local`)
Create this file with:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://northstar:northstar123@localhost:5432/northstar_nupes
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

## Database Commands

- **View database logs:** `npm run db:logs`
- **Stop database:** `npm run db:down`
- **Restart database:** `npm run db:up`
- **Reset database (deletes all data):** `npm run db:reset`

## Database Connection Info

- **Host:** localhost
- **Port:** 5432
- **Database:** northstar_nupes
- **User:** northstar
- **Password:** northstar123

You can connect with any PostgreSQL client using:
```
postgresql://northstar:northstar123@localhost:5432/northstar_nupes
```

## Troubleshooting

**Database not responding?**
```bash
docker ps  # Check if container is running
npm run db:logs  # View database logs
```

**Port already in use?**
- Check if something else is using port 5432: `lsof -i :5432`
- Or change the port in `docker-compose.yml`

**Backend can't connect to database?**
- Make sure database container is running: `docker ps`
- Check DATABASE_URL in `backend/.env.local`
- Wait a few seconds after starting the container for it to be ready

## Next Steps

Once everything is running:
1. Visit http://localhost:3000
2. Try submitting a seller application at `/apply`
3. Login to admin dashboard at `/admin/login` (use the ADMIN_KEY from your .env.local)
4. Test the full flow!

