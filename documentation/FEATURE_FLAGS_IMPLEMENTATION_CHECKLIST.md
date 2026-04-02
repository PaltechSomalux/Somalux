# Feature Flags Implementation Checklist

## Phase 1: Database & Backend Setup

- [ ] **Run SQL Migration**
  - [ ] Copy `migrations/001_feature_flags_schema.sql`
  - [ ] Execute in Supabase SQL editor
  - [ ] Verify tables created: `feature_flags`, `feature_flag_events`
  - [ ] Verify indexes created
  - [ ] Verify seed data inserted (5 sample features)

- [ ] **Add Backend Routes**
  - [ ] Import `featureFlagsRouter` in `backend/index.js`
  - [ ] Add `app.use(featureFlagsRouter);`
  - [ ] Set `global.wss = wss;` for WebSocket broadcasting
  - [ ] Test `/api/features` endpoint: `curl http://localhost:5000/api/features`
  - [ ] Verify response includes features object

- [ ] **Test Backend Endpoints**
  - [ ] GET `/api/features` - returns features
  - [ ] GET `/api/features/check/dark_mode` - checks single feature
  - [ ] POST `/api/features` - create new feature (need auth)
  - [ ] POST `/api/features/dark_mode/rollout` - update rollout
  - [ ] DELETE `/api/features/dark_mode` - disable feature

## Phase 2: Frontend Setup

- [ ] **Register Service Worker**
  - [ ] Create `public/service-worker.js` ✓
  - [ ] Import `registerServiceWorker` in App.jsx
  - [ ] Call in useEffect on app load
  - [ ] Open DevTools > Application > Service Workers
  - [ ] Verify service worker shows "activated and running"

- [ ] **Add Feature Flags Context**
  - [ ] Create `src/context/FeatureFlagsContext.jsx` ✓
  - [ ] Create `src/hooks/useFeatureFlags.js` ✓
  - [ ] Wrap App with `<FeatureFlagsProvider>`
  - [ ] Test in browser console: `useFeatureFlags()` returns object

- [ ] **Test Hook Usage**
  - [ ] Create test component with `useFeatureFlag('dark_mode')`
  - [ ] Verify `enabled` property works
  - [ ] Verify `config` property works
  - [ ] Verify component re-renders when feature changes

- [ ] **Verify Caching**
  - [ ] Open DevTools > Application > Local Storage
  - [ ] Verify `app_features_cache` key exists
  - [ ] Verify `app_features_timestamp` key exists
  - [ ] Check Service Worker cache storage
  - [ ] Verify features available when offline

## Phase 3: Admin Dashboard

- [ ] **Create Admin Routes**
  - [ ] Add route `/admin/features` pointing to `FeatureManagement`
  - [ ] Verify page loads without errors
  - [ ] Test admin can see all features in table

- [ ] **Test Admin Functions**
  - [ ] Create new feature from dashboard
  - [ ] Edit existing feature
  - [ ] Toggle feature enabled/disabled
  - [ ] Update rollout percentage with slider
  - [ ] Delete feature

- [ ] **Verify Real-time Updates**
  - [ ] Open app in two browser windows
  - [ ] Change feature in admin dashboard
  - [ ] Observe immediate update in other window (via WebSocket)
  - [ ] Refresh one window, verify features still show

## Phase 4: Integration Testing

- [ ] **Test Feature Gates in Components**
  - [ ] Replace hardcoded features with `useFeatureFlag()`
  - [ ] Test conditional rendering works
  - [ ] Verify fallbacks work if no features loaded

- [ ] **Test Gradual Rollout**
  - [ ] Set feature to 50% rollout
  - [ ] Check as different users
  - [ ] Verify consistent: same user always gets same result
  - [ ] Increase to 100%
  - [ ] Verify all users see feature

- [ ] **Test Tier-based Features**
  - [ ] Create feature with `min_tier: 'pro'`
  - [ ] Test as free user - feature disabled
  - [ ] Test as pro user - feature enabled
  - [ ] Test as premium user - feature enabled

- [ ] **Test Offline Functionality**
  - [ ] Load app, go offline
  - [ ] Verify cached features still available
  - [ ] Turn feature on/off while offline
  - [ ] Go back online, verify sync

## Phase 5: Performance & Optimization

- [ ] **Check Bundle Size Impact**
  - [ ] Run `npm run build`
  - [ ] Check build size increased by ~5KB (gzipped)
  - [ ] Verify no major dependencies added

- [ ] **Monitor API Calls**
  - [ ] Open DevTools > Network
  - [ ] Filter by XHR
  - [ ] Verify `/api/features` called once on load
  - [ ] Verify periodic refresh (10 min interval)
  - [ ] Verify WebSocket messages on changes

- [ ] **Test Cache Efficiency**
  - [ ] Verify 5-minute localStorage cache works
  - [ ] Reload page - should use cache (fast)
  - [ ] After 5 minutes - should refresh from API
  - [ ] Service Worker cache working (offline)

## Phase 6: Monitoring & Analytics

- [ ] **Add Analytics Tracking**
  - [ ] Track feature exposure per user
  - [ ] Track which features are enabled
  - [ ] Track A/B test variants
  - [ ] Log to analytics backend

- [ ] **Setup Monitoring**
  - [ ] Monitor API response times
  - [ ] Monitor feature adoption rates
  - [ ] Monitor error rates
  - [ ] Create dashboard for feature metrics

## Phase 7: Production Deployment

- [ ] **Pre-deployment Checks**
  - [ ] Run full test suite
  - [ ] Test on staging environment
  - [ ] Verify HTTPS works with Service Worker
  - [ ] Verify WebSocket connection in production
  - [ ] Test gradual rollout workflow

- [ ] **Deploy Database**
  - [ ] Backup production database
  - [ ] Run migration on production
  - [ ] Verify tables and indexes created
  - [ ] Verify seed data inserted

- [ ] **Deploy Backend**
  - [ ] Deploy new backend with feature flags routes
  - [ ] Verify `/api/features` endpoint works
  - [ ] Verify WebSocket broadcasting works
  - [ ] Monitor error logs

- [ ] **Deploy Frontend**
  - [ ] Deploy new frontend with context/hooks
  - [ ] Verify Service Worker registered
  - [ ] Verify features load correctly
  - [ ] Test real-time updates via WebSocket

- [ ] **Post-deployment**
  - [ ] Monitor error rates
  - [ ] Monitor API performance
  - [ ] Verify no client-side errors
  - [ ] Test with different user tiers

## Phase 8: Ongoing Maintenance

- [ ] **Feature Lifecycle**
  - [ ] Create new features regularly
  - [ ] Test with small rollout first (5-10%)
  - [ ] Gradually increase rollout
  - [ ] Monitor metrics at each stage
  - [ ] Rollback if issues detected

- [ ] **Cleanup**
  - [ ] Delete old/deprecated features
  - [ ] Archive feature_flag_events table periodically
  - [ ] Review and update feature configurations

- [ ] **Security**
  - [ ] Ensure admin auth on admin endpoints
  - [ ] Audit feature changes (feature_flag_events table)
  - [ ] Monitor for unauthorized access
  - [ ] Keep API rate-limited

## Phase 9: Documentation

- [ ] **Update Team Docs**
  - [ ] Document how to create features
  - [ ] Document rollout process
  - [ ] Document how to use in components
  - [ ] Create team runbook for common tasks

- [ ] **Example Features**
  - [ ] Implement 2-3 real features
  - [ ] Document process
  - [ ] Share learnings with team

## Quick Verification Checklist

**Before considering "Done":**

- [ ] `/api/features` endpoint returns features
- [ ] Service Worker installed and active
- [ ] `FeatureFlagsProvider` wraps entire app
- [ ] `useFeatureFlag()` works in components
- [ ] Feature changes via WebSocket in real-time
- [ ] Gradual rollout works (consistent per user)
- [ ] Admin dashboard fully functional
- [ ] Offline mode works with cached features
- [ ] No console errors in production

## Rollback Plan

If issues discovered:

1. **Immediate**: Disable feature via admin dashboard
   - Set `enabled: false` for problematic feature
   - Instant rollback, no code changes needed

2. **Minor Issues**: Reduce rollout percentage
   - Decrease `rollout_percentage` to 0-10%
   - Investigate issue
   - Fix and re-deploy

3. **Critical Issues**: Disable entire system
   ```javascript
   // In backend, temporarily disable features:
   // Export all features with enabled: false
   // Or return empty features object
   ```

## Success Metrics

✅ **System is working when:**
- New features deploy without app reinstall
- Users see updates automatically
- No "clear cache" needed
- Gradual rollout works smoothly
- Admin can manage features in real-time
- WebSocket updates instant
- Service Worker handles offline
- Bundle size impact minimal (<10KB)

---

**Status**: Implementation Checklist Ready  
**Estimated Setup Time**: 30-60 minutes  
**Deployment Time**: 15-30 minutes  
**Post-deployment Monitoring**: 1-2 hours
