#!/bin/bash

echo "🚀 DealMachine Scraper Extension Setup"
echo "======================================"

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "⚠️  PostgreSQL is not running. Please start PostgreSQL first."
    echo "   sudo systemctl start postgresql"
    exit 1
fi

# Navigate to backend directory
cd backend

echo "📦 Installing dependencies..."
npm install

echo "🗄️  Setting up database..."
npx prisma generate
npx prisma migrate dev --name init

echo "👤 Creating admin user..."
node prisma/seed.js

echo "✅ Setup complete!"
echo ""
echo "🔐 Admin Credentials:"
echo "   Email: admin@dealmachine.com"
echo "   Password: admin123"
echo ""
echo "🚀 To start the server:"
echo "   cd backend && npm run dev"
echo ""
echo "🌐 Admin Panel: http://localhost:3000/admin/login"
echo "📱 Load chrome-extension folder in Chrome Extensions (Developer Mode)"
echo ""
echo "⚠️  Remember to change admin password in production!"

