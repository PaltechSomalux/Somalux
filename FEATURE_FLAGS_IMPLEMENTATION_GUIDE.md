# Dynamic Feature Flags System - WhatsApp Style Updates

## Overview

This system implements WhatsApp-style feature deployment where new features are pushed to users **without requiring app reinstalls** or clearing browser data. Features can be:

- **Toggled on/off instantly** across all users
- **Gradually rolled out** to a percentage of users
- **Targeted by user tier** (free, pro, premium)
- **Updated in real-time** via WebSocket
- **Cached intelligently** with auto-invalidation

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Admin Dashboard                       │
│  (Edit features, set rollout %, toggle on/off)  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│        Backend Feature Flag API                 │
│  /api/features (GET, POST, DELETE)              │
│  /api/features/:key/rollout (POST)              │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   ┌─────────────┐      ┌──────────────────┐
   │  Database   │      │  WebSocket       │
   │  (Supabase) │      │  Real-time sync  │
   └─────────────┘      └──────────────────┘
        │                     │
        └──────────┬──────────┘
                   ▼
   ┌─────────────────────────────────┐
   │  React Frontend                 │
   │  FeatureFlagsProvider (Context) │
   │  useFeatureFlags Hook           │
   │  Service Worker (Smart Cache)   │
   └─────────────────────────────────┘
```

## Files Created

### Backend
1. **backend/routes/featureFlags.js** - Feature flags API endpoints
2. **migrations/001_feature_flags_schema.sql** - Database schema

### Frontend
1. **src/context/FeatureFlagsContext.jsx** - React context & provider
2. **src/hooks/useFeatureFlags.js** - Custom hooks for features
3. **src/components/FeatureManagement.jsx** - Admin dashboard
4. **src/utils/serviceWorkerManager.js** - Service worker management
5. **public/service-worker.js** - Service worker implementation

## Setup Instructions

### Step 1: Database Setup

Run the migration to create the feature flags table:

```sql
-- In Supabase SQL Editor, run:
-- migrations/001_feature_flags_schema.sql
```

Or use the CLI:
```bash
npm run db:migrate -- migrations/001_feature_flags_schema.sql
```

### Step 2: Backend Integration

Add the feature flags route to your backend (backend/index.js):

```javascript
import featureFlagsRouter from './routes/featureFlags.js';

// Add this after your other app.use() calls
app.use(featureFlagsRouter);

// Store WebSocket server reference for broadcasting
app.set('wss', wss);
global.wss = wss;
```

### Step 3: Frontend Integration

#### 3a. Register Service Worker (in your App.jsx or main entry point)

```javascript
import { registerServiceWorker, listenForServiceWorkerMessages } from './utils/serviceWorkerManager';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';

useEffect(() => {
  // Register service worker for smart caching
  registerServiceWorker();

  // Listen for real-time feature updates from service worker
  listenForServiceWorkerMessages((event) => {
    if (event.type === 'FEATURE_UPDATE') {
      console.log('Feature updated:', event.data);
      // Optionally refresh features or notify user
    }
  });
}, []);
```

#### 3b. Wrap App with FeatureFlagsProvider

```javascript
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';

function App() {
  return (
    <FeatureFlagsProvider>
      {/* Your app content */}
    </FeatureFlagsProvider>
  );
}
```

#### 3c. Use Features in Components

```javascript
import { useFeatureFlag, useFeatureGate } from '../hooks/useFeatureFlags';

function MyComponent() {
  // Check if feature is enabled with config
  const { enabled, config } = useFeatureFlag('dark_mode');

  // Or simple boolean check for conditional rendering
  const isDarkModeEnabled = useFeatureGate('dark_mode');

  if (isDarkModeEnabled) {
    return <DarkModeComponent />;
  }

  return <LightModeComponent />;
}
```

## How It Works

### 1. Initial Load (No App Reinstall Needed)
- User loads app in browser
- React context fetches features from `/api/features`
- Features are cached in localStorage (5 minute TTL)
- Service worker caches responses for offline access

### 2. New Feature Deployment
- Admin creates/enables feature in dashboard
- Changes saved to database
- WebSocket broadcasts update to all connected clients
- Service worker clears features cache automatically
- Components re-render with new features

### 3. Gradual Rollout
- Admin sets rollout_percentage to gradual value (e.g., 10%)
- System uses consistent hashing to determine user eligibility
- Same user always gets same result (not random per refresh)
- Can increase percentage as confidence grows

### 4. Tier-based Features
- Features can require minimum tier (free, pro, premium)
- System checks user tier automatically
- Pro features automatically unavailable for free users

### 5. Real-time Updates via WebSocket
- Backend broadcasts feature changes to all clients
- Clients receive instant notifications
- Cache is automatically invalidated
- Components automatically re-render

## Admin Dashboard Usage

### Access the Dashboard
Navigate to `/admin/features` (you'll need to add this route):

```javascript
import FeatureManagement from './components/FeatureManagement';

// In your router:
<Route path="/admin/features" element={<FeatureManagement />} />
```

### Creating a Feature
1. Click "Add New Feature"
2. Fill in details:
   - **Feature Key**: Unique identifier (e.g., `dark_mode`)
   - **Name**: Display name
   - **Description**: What it does
   - **Enabled**: Toggle on/off
   - **Rollout %**: Percentage of users (0-100)
   - **Version**: Semantic version
3. Click Save

### Gradual Rollout
1. Create feature with rollout_percentage = 0 (off)
2. Incrementally increase: 10% → 25% → 50% → 100%
3. Monitor for issues at each stage
4. Full rollout when stable

### A/B Testing
1. Create feature with rollout_percentage = 50
2. Measure engagement/performance
3. Increase or disable based on results

## API Endpoints

### GET /api/features
Get all enabled features for a user.

**Query Parameters:**
- `user_id`: User's ID (for rollout calculation)
- `user_tier`: User's tier (free/pro/premium)

**Response:**
```json
{
  "features": {
    "dark_mode": {
      "enabled": true,
      "config": {},
      "version": "1.0.0"
    },
    "new_search_ui": {
      "enabled": true,
      "config": { "columns": 3 },
      "version": "1.0.0"
    }
  },
  "timestamp": "2026-01-06T10:00:00Z",
  "version": 1
}
```

### GET /api/features/check/:feature_key
Check if specific feature is enabled.

### POST /api/features
Create or update a feature flag.

**Body:**
```json
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

### POST /api/features/:feature_key/rollout
Update rollout percentage.

**Body:**
```json
{
  "rollout_percentage": 50
}
```

### DELETE /api/features/:feature_key
Disable/delete a feature.

## Service Worker Features

### Smart Caching Strategy
- **Network-first for APIs**: Always fetch fresh feature flags
- **Cache-first for static assets**: Use cache if available
- **Automatic cache invalidation**: Old caches removed on update

### No Browser Cache Clearing Required
- Users never need to clear "browsing data"
- Service worker handles cache management automatically
- Old versions cleaned up transparently

### Offline Support
- Cached features available when offline
- App continues to work with last known features
- Automatically syncs when connection restored

## Advanced Usage

### Feature Configuration
Pass config to features for advanced scenarios:

```javascript
// Creating feature with config
{
  feature_key: "search_columns",
  config: { columns: 3, resultsPerPage: 20 }
}

// Using in component
const { config } = useFeatureFlag('search_columns');
const columns = config.columns || 2;
```

### Feature-dependent Components
```javascript
function SearchUI() {
  const { enabled: hasNewUI } = useFeatureFlag('new_search_ui');

  return (
    <>
      {hasNewUI ? <NewSearchUI /> : <OldSearchUI />}
    </>
  );
}
```

### Event Tracking
Track which features users have enabled:

```javascript
useEffect(() => {
  const { enabled } = useFeatureFlag('dark_mode');
  analytics.trackFeature('dark_mode', { enabled });
}, []);
```

## Security Considerations

### Authentication
- Add admin auth check in POST/DELETE endpoints
- Verify user tier for tier-restricted features
- Rate limit feature checks to prevent abuse

### Data Validation
- Validate rollout_percentage (0-100)
- Validate feature_key format (alphanumeric + underscore)
- Validate min_tier values (free/pro/premium)

### Audit Trail
- feature_flag_events table logs all changes
- Track who made changes and when
- Enable rollback if needed

## Performance

### Caching Strategy
- Features cached in localStorage (5 min TTL)
- Service worker caches API responses
- Automatic cache busting on updates

### API Calls
- Single `/api/features` call on app load
- Periodic refresh every 10 minutes
- Real-time updates via WebSocket

### Bundle Size Impact
- featureFlags.js: ~8KB
- FeatureFlagsContext.jsx: ~6KB
- Service Worker: ~4KB
- **Total**: ~18KB (gzipped: ~5KB)

## Troubleshooting

### Features not updating
1. Check WebSocket connection (DevTools > Network > WS)
2. Verify browser supports Service Workers
3. Check localStorage isn't disabled
4. Clear cache: `clearFeaturesCache()` from serviceWorkerManager

### Some users don't see new feature
1. Check rollout percentage
2. Verify user tier meets min_tier requirement
3. Check if feature is enabled
4. User in rollout group? (hashing depends on user_id)

### Service Worker not registering
1. App must be served over HTTPS in production
2. Service Worker must be in `public/` folder
3. Check browser console for errors
4. Verify browser supports Service Workers (most modern browsers do)

## Migration from Static Features

If you have hardcoded features, migrate like this:

```javascript
// Before (hardcoded)
const isDarkModeAvailable = true;

// After (feature flag)
const { enabled: isDarkModeAvailable } = useFeatureFlag('dark_mode');
```

Then delete all the hardcoded constants and use feature flags instead.

## Best Practices

1. **Use consistent feature_key naming**: `snake_case` (dark_mode, not darkMode)
2. **Semantic versioning**: Follow SemVer for version field
3. **Gradual rollout**: Always start at 0-10% and increase
4. **Monitor metrics**: Track engagement per feature
5. **Keep config small**: Don't store large objects in config
6. **Document features**: Keep description updated
7. **Clean up old features**: Delete features after full rollout

## Example: Dark Mode Feature

```javascript
// 1. Create in dashboard
{
  feature_key: "dark_mode",
  name: "Dark Mode",
  description: "Dark theme option",
  enabled: false,
  rollout_percentage: 0,
  version: "1.0.0"
}

// 2. Increase rollout
0% → 10% (test) → 25% → 50% → 100%

// 3. Use in component
function App() {
  const { enabled: darkModeEnabled } = useFeatureFlag('dark_mode');

  return (
    <ThemeProvider theme={darkModeEnabled ? darkTheme : lightTheme}>
      {/* App */}
    </ThemeProvider>
  );
}

// 4. Remove hardcoded constant
// Delete: const DARK_MODE_ENABLED = process.env.REACT_APP_DARK_MODE
```

## Monitoring & Analytics

Log feature usage for insights:

```javascript
useEffect(() => {
  const { enabled, version } = useFeatureFlag('dark_mode');
  
  // Send to analytics
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      feature: 'dark_mode',
      enabled,
      version,
      timestamp: new Date()
    })
  });
}, []);
```

## Support for Dynamic Components

Load components conditionally based on features:

```javascript
// features/DarkModeUI.jsx
export const DarkModeUI = lazy(() => import('./DarkModeUI'));

// In main component
const { enabled } = useFeatureFlag('dark_mode');
if (enabled) {
  return <Suspense fallback={<Loading />}>
    <DarkModeUI />
  </Suspense>;
}
```

---

**Next Steps:**
1. Run database migration
2. Add routes to backend/index.js
3. Setup FeatureFlagsProvider in App.jsx
4. Register service worker
5. Add admin route for /admin/features
6. Start using feature flags in components!
