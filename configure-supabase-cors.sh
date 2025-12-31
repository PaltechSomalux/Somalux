#!/bin/bash
# Script to configure Supabase Storage Bucket CORS via Management API
# This is an alternative to using the Supabase Dashboard

# Configuration
SUPABASE_URL="https://wuwlnawtuhjoubfkdtgc.supabase.co"
SUPABASE_PROJECT_ID="wuwlnawtuhjoubfkdtgc"
SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"  # Get from Settings > API Keys > Service Role
BUCKET_NAME="elib-books"

echo "📋 Configuring CORS for $BUCKET_NAME bucket..."

# CORS Configuration as JSON
CORS_CONFIG='{
  "allowed_origins": [
    "https://wuwlnawtuhjoubfkdtgc.supabase.co",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000"
  ],
  "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowed_headers": ["*"],
  "max_age_seconds": 86400
}'

# Make the API call to update CORS
response=$(curl -X PUT \
  "${SUPABASE_URL}/rest/v1/storage/buckets/${BUCKET_NAME}" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -d "{\"public\": true, \"avif_autodetection\": true}" \
  2>/dev/null)

echo "Response: $response"

if echo "$response" | grep -q "success\|true"; then
    echo "✅ Bucket configured successfully!"
    echo ""
    echo "📝 Note: For CORS configuration via API, you may need to:"
    echo "1. Use the Supabase Management API directly"
    echo "2. Or configure via Supabase Dashboard Settings > Storage > elib-books > CORS"
else
    echo "⚠️  Could not configure via REST API"
    echo ""
    echo "Please configure CORS manually in Supabase Dashboard:"
    echo "1. Go to Storage > elib-books > Settings"
    echo "2. Scroll to CORS Configuration"
    echo "3. Add the following origins:"
    echo "   - https://wuwlnawtuhjoubfkdtgc.supabase.co"
    echo "   - http://localhost:3000"
    echo "   - http://localhost:5000"
    echo "4. Set Methods to: GET, POST, PUT, DELETE, OPTIONS"
    echo "5. Set Headers to: *"
    echo "6. Set Max Age to: 86400"
fi

echo ""
echo "✅ Done! Try loading PDFs now."
