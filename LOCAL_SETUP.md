# Local Development Setup

## Prerequisites

- Node.js 18+
- Docker Desktop installed and running
- npm or yarn

## Quick Start

1. **Start the database:**
   ```bash
   npm run db:up
   ```
   Or use the setup script:
   ```bash
   ./scripts/dev-setup.sh
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables:**

   **Backend** (`backend/.env.local`):
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   DATABASE_URL=postgresql://northstar:northstar123@localhost:5432/northstar_nupes
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_S3_BUCKET_NAME=your-bucket
   AWS_REGION=us-east-1
   ADMIN_KEY=dev-admin-key-123
   ```

   **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXTAUTH_SECRET=dev-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ADMIN_KEY=dev-admin-key-123
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Database Commands

- Start database: `npm run db:up`
- Stop database: `npm run db:down`
- View logs: `npm run db:logs`
- Reset database (removes all data): `npm run db:reset`

## Database Connection Details

- Host: `localhost`
- Port: `5432`
- Database: `northstar_nupes`
- User: `northstar`
- Password: `northstar123`

## First Run

On first startup, the backend will automatically:
1. Connect to the database
2. Run migrations to create all tables
3. Set up indexes and triggers

## Testing the Setup

1. **Check database connection:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Test frontend:**
   - Open http://localhost:3000
   - You should see the homepage

3. **Test API:**
   ```bash
   curl http://localhost:3001/api/chapters
   ```

## Troubleshooting

### Database not starting
- Make sure Docker Desktop is running
- Check if port 5432 is already in use: `lsof -i :5432`
- View logs: `npm run db:logs`

### Connection errors
- Verify DATABASE_URL in `backend/.env.local`
- Make sure database container is running: `docker ps`
- Check database logs for errors

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Make sure backend is running on port 3001
- Check CORS settings in backend

## Development Workflow

1. Start database: `npm run db:up`
2. Start dev servers: `npm run dev`
3. Make changes - both servers will auto-reload
4. Database schema updates automatically on backend restart

## Notes

- The database persists data in a Docker volume
- To completely reset: `npm run db:reset`
- Environment variables in `.env.local` are gitignored
- Use test Stripe keys for local development

