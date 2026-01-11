# Fixed Port Development Setup Script for Windows (PowerShell)
# Usage: .\start-dev-port3000.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SomaLux Development Server (Port 3000)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "Starting development server on http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Remember to add this URL to Supabase redirect URIs:" -ForegroundColor Yellow
Write-Host "  - http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the dev server on port 3000
$env:PORT = 3000
npm start

Read-Host "Press Enter to exit"
