@echo off
echo 🚀 Kanban App Deployment Helper
echo ================================

REM Check if we're in the right directory
if not exist "frontend" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

echo 📦 Installing dependencies...

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo 🔧 Building frontend for production...
cd frontend
call npm run build
cd ..

echo ✅ Build completed!
echo.
echo 📋 Next steps:
echo 1. Push your code to GitHub: git add . ^&^& git commit -m "Deploy" ^&^& git push
echo 2. Deploy backend to Render using the GitHub repository
echo 3. Deploy frontend to Vercel using the GitHub repository
echo 4. Update environment variables as per DEPLOYMENT.md
echo.
echo 📖 See DEPLOYMENT.md for detailed instructions
pause