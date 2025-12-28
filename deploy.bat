@echo off
REM SomaLux Quick Deployment Script for Windows
REM This script helps deploy the backend to Render

echo.
echo 🚀 SomaLux Backend Deployment to Render
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    echo.
)

REM Check git remote
for /f %%i in ('git config --get remote.origin.url') do set REMOTE=%%i
if "%REMOTE%"=="" (
    echo ⚠️  Git remote not configured
    echo Run this command to add your GitHub repo:
    echo   git remote add origin https://github.com/YOUR_USERNAME/SomaLux.git
    echo.
)

echo 📝 Staging files...
git add .

echo 📦 Creating commit...
git commit -m "Deploy SomaLux: Render backend with Supabase DB"

echo 🔄 Ready to push to GitHub!
echo.
echo ✅ Local setup complete!
echo.
echo 🌐 Next Steps:
echo 1. Configure git remote (if not already done):
echo    git remote add origin https://github.com/YOUR_USERNAME/SomaLux.git
echo.
echo 2. Push to GitHub:
echo    git push -u origin main
echo.
echo 3. Go to https://render.com and sign up
echo 4. Connect your GitHub account
echo 5. Create a new Web Service
echo 6. Select this repository
echo 7. Configure:
echo    - Build: cd backend ^&^& npm install
echo    - Start: cd backend ^&^& npm start
echo 8. Add environment variables from CONFIGURATION.md
echo 9. Deploy!
echo.
echo 📚 See DEPLOYMENT_GUIDE.md for detailed instructions
echo.
pause
