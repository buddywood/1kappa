# Deployment Guide

## Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `frontend/`

2. **Configure Environment Variables**
   - `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://your-api.herokuapp.com`)
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your frontend URL (e.g., `https://northstarnupes.com`)
   - `ADMIN_KEY` - Your admin authentication key

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Or manually trigger deployment from dashboard

## Backend Deployment (Heroku)

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set DATABASE_URL=postgresql://...
   heroku config:set STRIPE_SECRET_KEY=sk_live_...
   heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
   heroku config:set AWS_ACCESS_KEY_ID=...
   heroku config:set AWS_SECRET_ACCESS_KEY=...
   heroku config:set AWS_S3_BUCKET_NAME=...
   heroku config:set AWS_REGION=us-east-1
   heroku config:set FRONTEND_URL=https://northstarnupes.com
   heroku config:set ADMIN_KEY=...
   ```

4. **Deploy**
   ```bash
   cd backend
   git subtree push --prefix backend heroku main
   # Or use Heroku Git:
   heroku git:remote -a your-app-name
   git push heroku main
   ```

5. **Run Database Migrations**
   ```bash
   heroku run npm run migrate
   ```

6. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-api.herokuapp.com/api/webhook/stripe`
   - Select events: `checkout.session.completed`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Database Setup (Neon)

1. Create a new Neon project
2. Copy the connection string
3. Set as `DATABASE_URL` in backend environment variables
4. The schema will be created automatically on first backend startup

## S3 Setup

1. Create an S3 bucket
2. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
3. Set bucket policy for public read access (if needed)
4. Configure environment variables with AWS credentials

## Post-Deployment Checklist

- [ ] Frontend accessible at production URL
- [ ] Backend API responding to health check
- [ ] Database migrations completed
- [ ] Stripe webhook configured and tested
- [ ] S3 bucket accessible and CORS configured
- [ ] Admin dashboard accessible with admin key
- [ ] Test seller application flow
- [ ] Test checkout flow with test card
- [ ] Verify webhook updates order status

## Testing

1. **Seller Application**
   - Submit application at `/apply`
   - Verify appears in admin dashboard

2. **Admin Approval**
   - Login to admin dashboard
   - Approve a seller
   - Verify Stripe Connect account created

3. **Product Creation**
   - Create product (via API or add UI)
   - Verify appears on homepage

4. **Checkout Flow**
   - Go to product page
   - Enter email and checkout
   - Complete payment with test card: `4242 4242 4242 4242`
   - Verify order status updates to PAID

5. **Webhook Testing**
   - Use Stripe CLI: `stripe listen --forward-to localhost:3001/api/webhook/stripe`
   - Trigger test event: `stripe trigger checkout.session.completed`

