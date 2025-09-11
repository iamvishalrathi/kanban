#!/bin/bash

# Deployment helper script
echo "🚀 Kanban App Deployment Helper"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
cd ..

echo "🔧 Building frontend for production..."
cd frontend && npm run build
cd ..

echo "✅ Build completed!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub: git add . && git commit -m 'Deploy' && git push"
echo "2. Deploy backend to Render using the GitHub repository"
echo "3. Deploy frontend to Vercel using the GitHub repository"
echo "4. Update environment variables as per DEPLOYMENT.md"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"