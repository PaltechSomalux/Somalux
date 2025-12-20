#!/bin/bash
# SomaLux Quick Deployment Script
# This script helps deploy the backend to Render

echo "🚀 SomaLux Backend Deployment to Render"
echo "========================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo ""
fi

# Check if remote exists
if ! git config --get remote.origin.url > /dev/null; then
    echo "⚠️  Git remote not configured"
    echo "Run this command to add your GitHub repo:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/SomaLux.git"
    echo ""
fi

# Add files
echo "📝 Staging files..."
git add .

# Create commit
echo "📦 Creating commit..."
git commit -m "Deploy SomaLux full-stack: Firebase frontend + Render backend + Supabase DB"

# Push to GitHub
echo "🔄 Pushing to GitHub..."
echo "Make sure you've configured git remote:"
echo "  git remote add origin https://github.com/YOUR_USERNAME/SomaLux.git"
echo ""
echo "Then run:"
echo "  git push -u origin main"
echo ""

echo "✅ Local setup complete!"
echo ""
echo "🌐 Next Steps:"
echo "1. Go to https://render.com and sign up"
echo "2. Connect your GitHub account"
echo "3. Create a new Web Service"
echo "4. Select this repository"
echo "5. Configure:"
echo "   - Build: cd backend && npm install"
echo "   - Start: cd backend && npm start"
echo "6. Add environment variables from CONFIGURATION.md"
echo "7. Deploy!"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"
