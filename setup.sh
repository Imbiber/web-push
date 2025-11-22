#!/bin/bash

echo "🚀 PushNotify Setup Script"
echo "=========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Ask user for setup method
echo "Choose setup method:"
echo "1) Docker (Recommended)"
echo "2) Manual"
read -p "Enter choice [1-2]: " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📦 Setting up with Docker..."
    echo ""

    # Start Docker services
    echo "Starting services..."
    docker-compose up -d

    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 10

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📍 Access your services:"
    echo "   - Admin Dashboard: http://localhost:3002"
    echo "   - Backend API: http://localhost:3001"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Open http://localhost:3002"
    echo "   2. Create an admin account"
    echo "   3. Create your first project"
    echo "   4. Integrate the SDK with your website"
    echo ""
    echo "📖 For more details, see README.md and QUICKSTART.md"

elif [ "$choice" = "2" ]; then
    echo ""
    echo "📦 Manual setup selected"
    echo ""
    echo "Installing dependencies..."
    echo ""

    # Backend
    echo "Setting up backend..."
    cd backend
    npm install
    cp .env.example .env
    echo "✅ Backend dependencies installed"
    echo "⚠️  Please edit backend/.env with your database credentials"
    echo ""

    # Client SDK
    echo "Setting up client SDK..."
    cd ../client-sdk
    npm install
    echo "✅ Client SDK dependencies installed"
    echo ""

    # Admin Dashboard
    echo "Setting up admin dashboard..."
    cd ../admin-dashboard
    npm install
    cp .env.local.example .env.local
    echo "✅ Admin dashboard dependencies installed"
    echo ""

    cd ..

    echo "✅ Manual setup complete!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Set up PostgreSQL and Redis"
    echo "   2. Edit backend/.env with your credentials"
    echo "   3. Run: cd backend && npx prisma migrate dev"
    echo "   4. Start backend: cd backend && npm run dev"
    echo "   5. Start worker: cd backend && npm run worker"
    echo "   6. Start admin: cd admin-dashboard && npm run dev"
    echo ""
    echo "📖 For detailed instructions, see QUICKSTART.md"

else
    echo "Invalid choice. Exiting."
    exit 1
fi
