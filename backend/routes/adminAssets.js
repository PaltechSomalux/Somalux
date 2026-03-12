import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Allowed superadmins - only these can access Assets
const SUPERADMIN_EMAILS = ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'];
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Get all admin assets
router.get('/admin/assets', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError || !profile || !['admin', 'super_admin', 'editor'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { data: assets, error } = await supabaseAdmin
      .from('admin_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(assets || []);
  } catch (err) {
    console.error('Error fetching assets:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new admin asset
router.post('/admin/assets', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user email is in superadmin list
    if (!userData.user?.email || !SUPERADMIN_EMAILS.includes(userData.user.email)) {
      return res.status(403).json({ error: 'Forbidden - Only superadmins can access assets' });
    }

    const { email, end_date } = req.body;

    if (!email || !end_date) {
      return res.status(400).json({ error: 'Email and end_date are required' });
    }

    const { data: asset, error } = await supabaseAdmin
      .from('admin_assets')
      .insert({
        email: email.trim(),
        end_date,
        created_by: userData.user.email,
      })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(asset[0]);
  } catch (err) {
    console.error('Error creating asset:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an admin asset
router.put('/admin/assets/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user email is in superadmin list
    if (!userData.user?.email || !SUPERADMIN_EMAILS.includes(userData.user.email)) {
      return res.status(403).json({ error: 'Forbidden - Only superadmins can access assets' });
    }

    const { id } = req.params;
    const { email, end_date } = req.body;

    if (!email || !end_date) {
      return res.status(400).json({ error: 'Email and end_date are required' });
    }

    const { data: asset, error } = await supabaseAdmin
      .from('admin_assets')
      .update({
        email: email.trim(),
        end_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!asset || asset.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.json(asset[0]);
  } catch (err) {
    console.error('Error updating asset:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an admin asset
router.delete('/admin/assets/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin or super_admin
    if (!userData.user?.email || !SUPERADMIN_EMAILS.includes(userData.user.email)) {
      return res.status(403).json({ error: 'Forbidden - Only superadmins can access assets' });
    }

    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('admin_assets')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, message: 'Asset deleted' });
  } catch (err) {
    console.error('Error deleting asset:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
