# Dynamic Feature Flags - Quick Start Guide

## What This Does

**Instant Feature Updates Without App Reinstall** - Like WhatsApp's feature deployment system.

Users get new features automatically:
- ✅ No app download required
- ✅ No browser cache clearing needed  
- ✅ Gradual rollout to percentage of users
- ✅ Real-time updates via WebSocket
- ✅ Tier-based feature restrictions
- ✅ Works offline with cached data

## 5-Minute Setup

### 1. Database (2 minutes)
Copy and run this in Supabase SQL editor:
```sql
-- Run: migrations/001_feature_flags_schema.sql
```

### 2. Backend (1 minute)
Edit `backend/index.js`, add after `const app = express();`:
```javascript
import featureFlagsRouter from './routes/featureFlags.js';
app.use(featureFlagsRouter);
global.wss = wss; // for WebSocket broadcasting
```

### 3. Frontend (2 minutes)

**A. Register Service Worker in App.jsx:**
```javascript
import { registerServiceWorker } from './utils/serviceWorkerManager';

useEffect(() => {
  registerServiceWorker();
}, []);
```

**B. Wrap app with provider:**
```javascript
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';

export default function App() {
  return (
    <FeatureFlagsProvider>
      {/* Your app */}
    </FeatureFlagsProvider>
  );
}
```

## Using Features in Code

### Check Feature Enabled
```javascript
import { useFeatureFlag } from '../hooks/useFeatureFlags';

function MyComponent() {
  const { enabled } = useFeatureFlag('dark_mode');
  
  if (enabled) {
    return <DarkModeUI />;
  }
  return <LightModeUI />;
}
```

### With Configuration
```javascript
const { enabled, config } = useFeatureFlag('search_options');
const searchColumns = config.columns || 2;
```

### Simple Boolean Check
```javascript
import { useFeatureGate } from '../hooks/useFeatureFlags';

function ExpensiveFeature() {
  const hasFeature = useFeatureGate('beta_analytics');
  
  return hasFeature ? <Analytics /> : null;
}
```

## Managing Features (Admin)

### Create Feature
POST to `/api/features`:
```json
{
  "feature_key": "dark_mode",
  "name": "Dark Mode",
  "enabled": true,
  "rollout_percentage": 100
}
```

### Update Rollout (Gradual)
POST to `/api/features/dark_mode/rollout`:
```json
{
  "rollout_percentage": 50
}
```

### Disable Feature
DELETE `/api/features/dark_mode`

### Check Status
GET `/api/features?user_id=123&user_tier=pro`

## Gradual Rollout Example

Deploy dark mode safely:

```
Day 1:  10% of users          ← Test for bugs
Day 2:  25% of users          ← Monitor metrics
Day 3:  50% of users          ← Check performance
Day 4:  100% of users         ← Full rollout
```

Each increase is instant, no reinstalls needed.

## Real-World Examples

### Dark Mode
```javascript
function App() {
  const { enabled: darkMode } = useFeatureFlag('dark_mode');
  
  return (
    <ThemeProvider theme={darkMode ? DARK : LIGHT}>
      {children}
    </ThemeProvider>
  );
}
```

### Beta Features
```javascript
function ExperimentalSearch() {
  const { enabled } = useFeatureFlag('new_search_ui');
  
  return enabled ? <NewSearch /> : <OldSearch />;
}
```

### Tier Gating
```javascript
// In admin:
{
  "feature_key": "premium_analytics",
  "min_tier": "pro"  // Only pro+ users see it
}

// In component - automatically respected:
const { enabled } = useFeatureFlag('premium_analytics');
```

### A/B Testing
```javascript
// Create feature with 50% rollout
{
  "feature_key": "button_color_blue",
  "rollout_percentage": 50
}

// Track which variant performs better
// Then increase to 100% or disable based on metrics
```

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/features` | Get all features for user |
| GET | `/api/features/check/:key` | Check single feature |
| POST | `/api/features` | Create/update feature |
| POST | `/api/features/:key/rollout` | Change rollout % |
| DELETE | `/api/features/:key` | Disable feature |

## Troubleshooting

### Feature not showing up
1. Check if enabled: `GET /api/features`
2. Check user tier meets requirement
3. Check if in rollout percentage
4. Clear cache: `clearFeaturesCache()` in browser console

### Users have different features
Normal! Features are:
- **User-specific**: Rollout uses consistent hashing per user
- **Tier-based**: Pro features only for pro users
- **Gradual**: Not everyone gets it at once

### Need to force update
```javascript
// In browser console:
import { clearFeaturesCache } from './utils/serviceWorkerManager';
clearFeaturesCache();
location.reload();
```

## Files Reference

| File | Purpose |
|------|---------|
| `backend/routes/featureFlags.js` | API endpoints |
| `src/context/FeatureFlagsContext.jsx` | React provider |
| `src/hooks/useFeatureFlags.js` | Hooks for components |
| `public/service-worker.js` | Smart caching |
| `migrations/001_feature_flags_schema.sql` | Database |

## What Happens When You Deploy

1. **Admin enables feature** → Saved to database
2. **WebSocket broadcasts update** → All connected users notified
3. **Service Worker clears cache** → Fresh data fetched
4. **Components re-render** → Users see new feature
5. **No page refresh needed** → Seamless update

All without requiring users to reinstall!

## Best Practices

✅ Use feature keys in snake_case: `dark_mode` not `darkMode`  
✅ Always start rollout at 0-10%, increase gradually  
✅ Use semantic versioning: `1.0.0`, `1.1.0`, `2.0.0`  
✅ Keep feature descriptions updated  
✅ Monitor metrics at each rollout stage  
✅ Delete old features when complete  

❌ Don't rollout to 100% immediately  
❌ Don't use random feature keys  
❌ Don't hardcode features in components  
❌ Don't use complex JSON in config  

## Next: Add Admin Dashboard

Create route to `/admin/features`:

```javascript
import FeatureManagement from './components/FeatureManagement';

<Route path="/admin/features" element={<FeatureManagement />} />
```

Then you can manage features from a nice UI instead of API calls!

---

**Status**: ✅ Ready to use  
**Impact**: No app reinstalls required  
**Setup Time**: ~5 minutes  
**Bundle Size**: ~5KB gzipped
