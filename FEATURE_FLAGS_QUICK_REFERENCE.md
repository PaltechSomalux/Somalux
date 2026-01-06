# Feature Flags - Quick Reference Card

## Setup (Copy & Paste)

### 1️⃣ Database Migration
```sql
-- File: migrations/001_feature_flags_schema.sql
-- Run in Supabase SQL editor
```

### 2️⃣ Backend (backend/index.js)
```javascript
import featureFlagsRouter from './routes/featureFlags.js';
app.use(featureFlagsRouter);
global.wss = wss;
```

### 3️⃣ Service Worker (App.jsx)
```javascript
import { registerServiceWorker } from './utils/serviceWorkerManager';
useEffect(() => { registerServiceWorker(); }, []);
```

### 4️⃣ Provider (App.jsx)
```javascript
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';

export default function App() {
  return (
    <FeatureFlagsProvider>
      {children}
    </FeatureFlagsProvider>
  );
}
```

### 5️⃣ Use in Component
```javascript
import { useFeatureFlag } from '../hooks/useFeatureFlags';

function MyComponent() {
  const { enabled } = useFeatureFlag('dark_mode');
  return enabled ? <DarkUI /> : <LightUI />;
}
```

---

## Hooks Reference

### Check Single Feature
```javascript
const { enabled, config, version } = useFeatureFlag('dark_mode');
```

### Simple Boolean
```javascript
const enabled = useFeatureGate('dark_mode');
```

### Access All Features
```javascript
const { features, loading, error } = useFeatureFlags();
```

### Manual Refresh
```javascript
const { refreshFeatures } = useFeatureFlags();
refreshFeatures(); // Fetch latest
```

---

## API Endpoints

### GET - Check Features
```bash
GET /api/features?user_id=123&user_tier=pro
# Returns: { features: { dark_mode: {...}, ... } }

GET /api/features/check/dark_mode?user_id=123&user_tier=pro
# Returns: { enabled: true, config: {}, version: "1.0.0" }
```

### POST - Create/Update
```bash
POST /api/features
{
  "feature_key": "dark_mode",
  "name": "Dark Mode",
  "description": "Enable dark theme",
  "enabled": true,
  "rollout_percentage": 100,
  "min_tier": null,
  "config": {},
  "version": "1.0.0"
}
```

### POST - Update Rollout
```bash
POST /api/features/dark_mode/rollout
{ "rollout_percentage": 50 }
```

### DELETE - Disable
```bash
DELETE /api/features/dark_mode
```

---

## Feature Object Structure

```javascript
{
  feature_key: "dark_mode",
  name: "Dark Mode",
  description: "Enable dark theme",
  enabled: true,
  rollout_percentage: 100,      // 0-100
  min_tier: null,               // null | 'free' | 'pro' | 'premium'
  config: {},                   // Custom config
  version: "1.0.0"
}
```

---

## Common Patterns

### Conditional Rendering
```javascript
if (enabled) {
  return <FeatureUI />;
}
return <LegacyUI />;
```

### With Configuration
```javascript
const { config } = useFeatureFlag('columns');
const cols = config.columns || 2;
```

### Feature + Fallback
```javascript
const { enabled, loading, error } = useFeatureFlags();
if (loading || error) return <DefaultUI />;
if (enabled) return <NewUI />;
return <OldUI />;
```

### Lazy Load
```javascript
const BetaFeature = lazy(() => import('./Beta'));
{enabled && <Suspense><BetaFeature /></Suspense>}
```

### Multiple Features
```javascript
const darkMode = useFeatureGate('dark_mode');
const newUI = useFeatureGate('new_ui');
const analytics = useFeatureGate('advanced_analytics');

return (
  <div theme={darkMode ? 'dark' : 'light'}>
    {newUI ? <NewUI /> : <OldUI />}
    {analytics && <Analytics />}
  </div>
);
```

---

## Admin Commands

### Create Feature (via API)
```bash
curl -X POST http://localhost:5000/api/features \
  -H "Content-Type: application/json" \
  -d '{
    "feature_key": "dark_mode",
    "name": "Dark Mode",
    "enabled": true,
    "rollout_percentage": 100
  }'
```

### Update Rollout
```bash
curl -X POST http://localhost:5000/api/features/dark_mode/rollout \
  -H "Content-Type: application/json" \
  -d '{ "rollout_percentage": 50 }'
```

### Disable Feature
```bash
curl -X DELETE http://localhost:5000/api/features/dark_mode
```

### Check All Features
```bash
curl http://localhost:5000/api/features
```

---

## Gradual Rollout Timeline

```
Day 1:  10%  → POST /api/features/dark_mode/rollout { "rollout_percentage": 10 }
Day 2:  25%  → POST /api/features/dark_mode/rollout { "rollout_percentage": 25 }
Day 3:  50%  → POST /api/features/dark_mode/rollout { "rollout_percentage": 50 }
Day 4:  100% → POST /api/features/dark_mode/rollout { "rollout_percentage": 100 }
```

---

## Feature Tiers

### Free User
```javascript
// Only sees features with min_tier: null or min_tier: 'free'
const { enabled } = useFeatureFlag('basic_search');  // ✅ visible
const { enabled } = useFeatureFlag('advanced_search'); // ❌ min_tier: 'pro'
```

### Pro User
```javascript
// Sees features with min_tier: null, 'free', or 'pro'
const { enabled } = useFeatureFlag('basic_search');     // ✅
const { enabled } = useFeatureFlag('advanced_search');  // ✅
const { enabled } = useFeatureFlag('premium_analytics'); // ❌ min_tier: 'premium'
```

### Premium User
```javascript
// Sees all features
const { enabled } = useFeatureFlag('basic_search');     // ✅
const { enabled } = useFeatureFlag('advanced_search');  // ✅
const { enabled } = useFeatureFlag('premium_analytics'); // ✅
```

---

## Caching & Updates

### Cache Status
```javascript
// Check localStorage
localStorage.getItem('app_features_cache')      // Features JSON
localStorage.getItem('app_features_timestamp')  // When cached

// Check Service Worker cache
Application > Cache Storage > features-cache
```

### Clear Cache Manually
```javascript
import { clearFeaturesCache } from './utils/serviceWorkerManager';
clearFeaturesCache(); // Clear Service Worker cache
```

### Check Cache Age
```javascript
const timestamp = localStorage.getItem('app_features_timestamp');
const age = Date.now() - parseInt(timestamp);
console.log('Cache age (ms):', age);
```

---

## Database Queries

### Get All Active Features
```sql
SELECT * FROM feature_flags WHERE enabled = true;
```

### Get Feature History
```sql
SELECT * FROM feature_flag_events 
WHERE feature_id = (SELECT id FROM feature_flags WHERE feature_key = 'dark_mode')
ORDER BY created_at DESC;
```

### Check Rollout Percentage
```sql
SELECT feature_key, rollout_percentage 
FROM feature_flags 
WHERE enabled = true;
```

### Tier-Specific Features
```sql
SELECT * FROM feature_flags 
WHERE enabled = true 
AND min_tier = 'pro';
```

---

## Troubleshooting Quick Fixes

### Feature not showing
1. Is enabled? `SELECT enabled FROM feature_flags WHERE feature_key = '...';`
2. Is in rollout? Check percentage
3. Does user meet tier? Check min_tier
4. Clear cache: `clearFeaturesCache()`

### WebSocket not working
1. Check HTTPS in production
2. Check browser console for errors
3. App works without WebSocket (falls back to polling)

### Service Worker issues
1. Check DevTools > Application > Service Workers
2. Should show "activated and running"
3. Check /public/service-worker.js exists
4. Hard refresh (Ctrl+Shift+R)

### Cache issues
1. Open DevTools > Application > Local Storage
2. Check `app_features_cache` exists
3. Clear if stale: `clearFeaturesCache()`

---

## File Locations

| What | Where |
|------|-------|
| Backend API | `backend/routes/featureFlags.js` |
| Database | `migrations/001_feature_flags_schema.sql` |
| Context | `src/context/FeatureFlagsContext.jsx` |
| Hooks | `src/hooks/useFeatureFlags.js` |
| Admin UI | `src/components/FeatureManagement.jsx` |
| Service Worker | `public/service-worker.js` |
| Manager | `src/utils/serviceWorkerManager.js` |

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [FEATURE_FLAGS_QUICKSTART.md](FEATURE_FLAGS_QUICKSTART.md) | 5-min setup |
| [FEATURE_FLAGS_INDEX.md](FEATURE_FLAGS_INDEX.md) | Documentation index |
| [FEATURE_FLAGS_EXAMPLES.js](FEATURE_FLAGS_EXAMPLES.js) | 15 code examples |
| [FEATURE_FLAGS_IMPLEMENTATION_GUIDE.md](FEATURE_FLAGS_IMPLEMENTATION_GUIDE.md) | Complete guide |
| [FEATURE_FLAGS_ARCHITECTURE.md](FEATURE_FLAGS_ARCHITECTURE.md) | How it works |
| [FEATURE_FLAGS_IMPLEMENTATION_CHECKLIST.md](FEATURE_FLAGS_IMPLEMENTATION_CHECKLIST.md) | Setup checklist |

---

## Status Check

```javascript
// In browser console:
import { useFeatureFlags } from './hooks/useFeatureFlags';
const { features, loading, error } = useFeatureFlags();

console.log('Features loaded:', !loading);
console.log('Error:', error);
console.log('Features:', Object.keys(features));
```

---

## Quick Deploy Checklist

- [ ] Database migration run
- [ ] Backend routes added
- [ ] Service worker registered
- [ ] Provider wraps app
- [ ] Can use useFeatureFlag() in components
- [ ] Admin dashboard accessible
- [ ] Features appear in table
- [ ] Can create/edit/delete features
- [ ] WebSocket updates working
- [ ] Offline mode works

---

**Need more help?**
- Examples: [FEATURE_FLAGS_EXAMPLES.js](FEATURE_FLAGS_EXAMPLES.js)
- Full guide: [FEATURE_FLAGS_IMPLEMENTATION_GUIDE.md](FEATURE_FLAGS_IMPLEMENTATION_GUIDE.md)
- Architecture: [FEATURE_FLAGS_ARCHITECTURE.md](FEATURE_FLAGS_ARCHITECTURE.md)
