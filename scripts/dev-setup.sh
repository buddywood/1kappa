#!/bin/bash

echo "🚀 Setting up 1Kappa for local development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
docker compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is ready
until docker exec 1kappa-db pg_isready -U 1kappa > /dev/null 2>&1; do
    echo "⏳ Still waiting for database..."
    sleep 2
done

echo "✅ Database is ready!"

# Install dependencies
echo "📥 Installing dependencies..."
npm run install:all

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env.local with your Stripe and AWS credentials"
echo "2. Update frontend/.env.local if needed"
echo "3. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "Database connection:"
echo "  Host: localhost"
echo "  Port: 5434"
echo "  Database: one_kappa"
echo "  User: 1kappa"
echo "  Password: 1kappa123"
echo ""

