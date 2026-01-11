@echo off
REM Fixed Port Development Setup Script for Windows
REM This script helps you easily start the dev server on port 3000

echo.
echo ========================================
echo   SomaLux Development Server (Port 3000)
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting development server on http://localhost:3000
echo.
echo Remember to add this URL to Supabase redirect URIs:
echo   - http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the dev server on port 3000
set PORT=3000
call npm start

pause
