/**
 * Feature Flags API - WhatsApp-style Feature Updates
 * Allows dynamic feature deployment without app reinstalls
 */

import express from 'express';

const router = express.Router();

// Get supabaseAdmin from global scope (set in index.js)
function getSupabaseAdmin() {
  return global.supabaseAdmin;
}

/**
 * Initialize feature flags table (run once)
 */
export async function initFeatureFlagsTable() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return;

  try {
    // Check if table exists
    const { data, error } = await supabaseAdmin
      .from('feature_flags')
      .select('id')
      .limit(1);

    if (error?.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating feature_flags table...');
      // In production, use Supabase migrations or direct SQL
    }
  } catch (err) {
    console.error('Feature flags table init error:', err);
  }
}

/**
 * GET /api/features - Get all enabled features for user
 * Returns which features are available for the user based on:
 * - Global feature status
 * - User tier
 * - Gradual rollout percentage
 */
router.get('/api/features', async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Backend not configured' });
  }

  try {
    const { user_id, user_tier } = req.query;

    // Get all active features
    const { data: features, error } = await supabaseAdmin
      .from('feature_flags')
      .select('*')
      .eq('enabled', true);

    if (error) throw error;

    // Filter features based on user eligibility
    const availableFeatures = features.reduce((acc, feature) => {
      // Check if user meets tier requirement
      const tierAllowed =
        !feature.min_tier || 
        (user_tier && compareUserTiers(user_tier, feature.min_tier));

      if (!tierAllowed) return acc;

      // Check gradual rollout (percentage-based)
      let isInRollout = true;
      if (feature.rollout_percentage < 100 && user_id) {
        isInRollout = isUserInRollout(user_id, feature.id, feature.rollout_percentage);
      }

      if (isInRollout) {
        acc[feature.feature_key] = {
          enabled: true,
          config: feature.config || {},
          version: feature.version,
        };
      }

      return acc;
    }, {});

    res.json({
      features: availableFeatures,
      timestamp: new Date().toISOString(),
      version: 1,
    });
  } catch (err) {
    console.error('Error fetching features:', err);
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

/**
 * GET /api/features/check/:feature_key - Check if specific feature is enabled
 */
router.get('/api/features/check/:feature_key', async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Backend not configured' });
  }

  try {
    const { feature_key } = req.params;
    const { user_id, user_tier } = req.query;

    const { data: feature, error } = await supabaseAdmin
      .from('feature_flags')
      .select('*')
      .eq('feature_key', feature_key)
      .eq('enabled', true)
      .single();

    if (error || !feature) {
      return res.json({ enabled: false });
    }

    // Check tier
    const tierAllowed =
      !feature.min_tier || 
      (user_tier && compareUserTiers(user_tier, feature.min_tier));

    if (!tierAllowed) {
      return res.json({ enabled: false });
    }

    // Check rollout
    let isInRollout = true;
    if (feature.rollout_percentage < 100 && user_id) {
      isInRollout = isUserInRollout(user_id, feature.id, feature.rollout_percentage);
    }

    res.json({
      enabled: isInRollout,
      config: feature.config || {},
      version: feature.version,
    });
  } catch (err) {
    console.error('Error checking feature:', err);
    res.status(500).json({ error: 'Failed to check feature' });
  }
});

/**
 * POST /api/features - Create or update feature flag (ADMIN ONLY)
 */
router.post('/api/features', async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Backend not configured' });
  }

  // TODO: Add admin auth check
  // const { user } = req;
  // if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const {
      feature_key,
      name,
      description,
      enabled,
      rollout_percentage = 100,
      min_tier = null,
      config = {},
      version = '1.0.0',
    } = req.body;

    if (!feature_key || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate rollout percentage
    if (rollout_percentage < 0 || rollout_percentage > 100) {
      return res.status(400).json({ error: 'rollout_percentage must be 0-100' });
    }

    // Check if feature exists
    const { data: existing } = await supabaseAdmin
      .from('feature_flags')
      .select('id')
      .eq('feature_key', feature_key)
      .single();

    let result;
    if (existing) {
      // Update
      result = await supabaseAdmin
        .from('feature_flags')
        .update({
          name,
          description,
          enabled,
          rollout_percentage,
          min_tier,
          config,
          version,
          updated_at: new Date().toISOString(),
        })
        .eq('feature_key', feature_key)
        .select()
        .single();
    } else {
      // Create
      result = await supabaseAdmin
        .from('feature_flags')
        .insert({
          feature_key,
          name,
          description,
          enabled,
          rollout_percentage,
          min_tier,
          config,
          version,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Broadcast feature update to all clients via WebSocket
    broadcastFeatureUpdate(result.data);

    res.json(result.data);
  } catch (err) {
    console.error('Error creating/updating feature:', err);
    res.status(500).json({ error: 'Failed to save feature' });
  }
});

/**
 * POST /api/features/:feature_key/rollout - Update rollout percentage
 */
router.post('/api/features/:feature_key/rollout', async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Backend not configured' });
  }

  try {
    const { feature_key } = req.params;
    const { rollout_percentage } = req.body;

    if (rollout_percentage < 0 || rollout_percentage > 100) {
      return res.status(400).json({ error: 'rollout_percentage must be 0-100' });
    }

    const result = await supabaseAdmin
      .from('feature_flags')
      .update({
        rollout_percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('feature_key', feature_key)
      .select()
      .single();

    if (result.error) throw result.error;

    broadcastFeatureUpdate(result.data);

    res.json(result.data);
  } catch (err) {
    console.error('Error updating rollout:', err);
    res.status(500).json({ error: 'Failed to update rollout' });
  }
});

/**
 * DELETE /api/features/:feature_key - Disable/delete feature
 */
router.delete('/api/features/:feature_key', async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Backend not configured' });
  }

  try {
    const { feature_key } = req.params;

    const result = await supabaseAdmin
      .from('feature_flags')
      .delete()
      .eq('feature_key', feature_key)
      .select();

    if (result.error) throw result.error;

    broadcastFeatureUpdate({ feature_key, enabled: false });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting feature:', err);
    res.status(500).json({ error: 'Failed to delete feature' });
  }
});

/**
 * Helper: Determine if user is in rollout percentage
 * Uses consistent hashing so same user always gets same result
 */
function isUserInRollout(userId, featureId, percentage) {
  const hash = require('crypto')
    .createHash('md5')
    .update(`${userId}-${featureId}`)
    .digest('hex');
  const hashValue = parseInt(hash.substring(0, 8), 16);
  return (hashValue % 100) < percentage;
}

/**
 * Helper: Compare user tiers (free < pro < premium)
 */
function compareUserTiers(userTier, minTier) {
  const tierOrder = { free: 0, pro: 1, premium: 2 };
  return (tierOrder[userTier] || 0) >= (tierOrder[minTier] || 0);
}

/**
 * Broadcast feature update via WebSocket
 */
function broadcastFeatureUpdate(feature) {
  if (global.wss) {
    const message = JSON.stringify({
      type: 'feature_update',
      feature,
    });
    global.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  }
}

export default router;
