# Feature Flags API 500 Error - Root Cause & Fix

## The Problem
The `/api/features` endpoint was consistently returning HTTP 500 errors in production (Render), despite having comprehensive error handling code.

**Error observed:**
```
GET https://somalux-q2bw.onrender.com/api/features 500 (Internal Server Error)
```

## Root Cause Identified
The issue was **missing initialization of `global.supabaseAdmin`**:

1. **In backend/index.js** (lines 410-421):
   - `supabaseAdmin` was declared as a local variable
   - It was never assigned to `global.supabaseAdmin`
   - Result: Supabase client existed locally but wasn't accessible to the feature flags router

2. **In backend/routes/featureFlags.js** (line 10-12):
   - The router tried to access `global.supabaseAdmin` via `getSupabaseAdmin()` function
   - This always returned `undefined` because it was never set globally
   - Result: Database queries failed silently, returning default features

This is a **classic module scope issue** - the router couldn't access the Supabase client because it was never exposed to the global scope.

## The Fix

### 1. Set global.supabaseAdmin in backend/index.js
```javascript
// BEFORE (lines 415-425)
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  console.log('🔐 Supabase service-role client initialized');
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Proxy endpoints will be disabled.');
}

// AFTER - Added global assignment
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  global.supabaseAdmin = supabaseAdmin; // ✅ Make available to routers
  console.log('🔐 Supabase service-role client initialized');
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Proxy endpoints will be disabled.');
  global.supabaseAdmin = null; // ✅ Ensure it's null, not undefined
}
```

### 2. Frontend Fallback Strategy
Updated `src/context/FeatureFlagsContext.jsx` to fallback to simpler endpoint:

```javascript
let response;
try {
  // Try main features endpoint
  response = await axios.get(`${apiUrl}/api/features`, { params, timeout: 5000 });
  console.log('✅ Features fetched from /api/features');
} catch (mainError) {
  console.warn('⚠️ /api/features failed, trying simpler endpoint:', mainError.message);
  try {
    // Fallback to simple endpoint without DB queries
    response = await axios.get(`${apiUrl}/api/features-simple`, { timeout: 3000 });
    console.log('✅ Features fetched from /api/features-simple (fallback)');
  } catch (simpleError) {
    console.error('❌ Both endpoints failed, using cache/defaults');
    throw simpleError;
  }
}
```

### 3. Enhanced Server Startup Logging
Added diagnostic output to verify Supabase initialization:

```javascript
server = app.listen(PORT, () => {
  console.log(`✅ Backend + WebSocket server running on http://localhost:${PORT}`);
  console.log(`🔧 Supabase configured: ${global.supabaseAdmin ? '✅ Yes' : '❌ No'}`);
  console.log(`📍 API diagnostic endpoints:`);
  console.log(`   - GET /api/status (backend status)`);
  console.log(`   - GET /api/health (feature flags status)`);
  console.log(`   - GET /api/features-simple (test endpoint, no DB)`);
  console.log(`   - GET /api/features (main endpoint)`);
});
```

## Testing the Fix

### 1. Check Backend Startup
When backend starts, look for:
```
✅ Backend + WebSocket server running on http://localhost:5000
🔧 Supabase configured: ✅ Yes
```

If you see `❌ No`, check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables are set.

### 2. Test Endpoints in Order
```bash
# 1. Simple health check
curl http://localhost:5000/api/status

# 2. Feature flags health
curl http://localhost:5000/api/health

# 3. Simple feature endpoint (no DB, should always work)
curl http://localhost:5000/api/features-simple

# 4. Main features endpoint
curl http://localhost:5000/api/features

# 5. Main endpoint with user context
curl "http://localhost:5000/api/features?user_id=123&user_tier=student"
```

Expected response (200 OK):
```json
{
  "features": {
    "secure_reader": { "enabled": true, "config": {}, "version": 1 },
    "pdf_download": { "enabled": true, "config": {}, "version": 1 },
    ...
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": 1,
  "source": "database"
}
```

### 3. Frontend Browser Console
When app loads, you should see:
```
Fetching features from: https://somalux-q2bw.onrender.com
✅ Features fetched from /api/features
```

If `/api/features` fails:
```
Fetching features from: https://somalux-q2bw.onrender.com
⚠️ /api/features failed, trying simpler endpoint: Error...
✅ Features fetched from /api/features-simple (fallback)
```

## Why This Happened
This is a common issue in Node.js applications where:
1. **Routers loaded before initialization** - Feature flags router is loaded early (line 40)
2. **Supabase client not globally available** - Declared locally but needed globally
3. **No initialization check** - Router didn't validate that global was set

## Prevention for Future
- Always set dependencies on `global` if routers need them
- Add startup validation: `console.assert(global.supabaseAdmin, 'Supabase not initialized')`
- Use dependency injection instead of global variables (advanced pattern)

## Files Modified
1. `backend/index.js` - Set `global.supabaseAdmin`, enhanced logging
2. `src/context/FeatureFlagsContext.jsx` - Added fallback to `/api/features-simple`

## Deployment Steps
1. Deploy backend with the `global.supabaseAdmin` fix
2. Backend will log `✅ Supabase configured: ✅ Yes` on startup
3. Deploy frontend with fallback logic (optional but recommended)
4. Test `/api/features` endpoint from browser DevTools
5. Monitor feature flags loading in production

## Expected Outcome
✅ No more 500 errors on `/api/features`
✅ Feature flags load even if main endpoint fails (fallback)
✅ All features available (default or from database)
✅ App never crashes due to feature flag errors
