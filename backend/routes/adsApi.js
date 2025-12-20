import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADS_UPLOAD_DIR = path.join(__dirname, '../public/ads');

// Ensure ads directory exists
if (!existsSync(ADS_UPLOAD_DIR)) {
  mkdirSync(ADS_UPLOAD_DIR, { recursive: true });
}

// Initialize Supabase
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'your-supabase-url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

// Get ads for a specific placement
router.get('/ads/:placement', async (req, res) => {
  try {
    const { placement } = req.params;
    const { limit = 5 } = req.query;

    console.log(`🔍 [GET /api/ads/${placement}] Fetching ads - limit: ${limit}`);

    const { data, error } = await supabaseAdmin
      .from('ads')
      .select('*')
      .eq('placement', placement)
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;
    
    console.log(`✅ [GET /api/ads/${placement}] Found ${data?.length || 0} ads`);
    if (data?.length > 0) {
      console.log(`   - First ad: "${data[0].title}" (ID: ${data[0].id})`);
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error(`❌ [GET /api/ads/${placement}] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Log ad impression with analytics
router.post('/ad-impression', async (req, res) => {
  try {
    const { adId, userId, placement, viewDuration, deviceType, userAgent } = req.body;

    if (!adId || !placement) {
      return res.status(400).json({ error: 'adId and placement are required' });
    }

    console.log('📊 [IMPRESSION] Ad ID:', adId, 'Placement:', placement, 'Device:', deviceType);

    // Log to ad_analytics
    const { error: analyticsError } = await supabaseAdmin
      .from('ad_analytics')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        placement,
        event_type: 'impression',
        view_duration: viewDuration || 0,
        device_type: deviceType || 'unknown',
        user_agent: userAgent || null,
        created_at: new Date().toISOString()
      });

    if (analyticsError) throw analyticsError;

    // Update ad impressions count in ads table
    const { data: adData } = await supabaseAdmin
      .from('ads')
      .select('total_impressions')
      .eq('id', adId)
      .single();
    
    if (adData) {
      const newCount = (adData.total_impressions || 0) + 1;
      await supabaseAdmin
        .from('ads')
        .update({ total_impressions: newCount })
        .eq('id', adId);
      console.log('✅ [IMPRESSION] Updated count to:', newCount);
    }

    res.json({ success: true, message: 'Impression logged' });
  } catch (error) {
    console.error('Ad impression error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log ad click with analytics
router.post('/ad-click', async (req, res) => {
  try {
    const { adId, userId, placement, viewDuration, deviceType } = req.body;

    if (!adId || !placement) {
      return res.status(400).json({ error: 'adId and placement are required' });
    }

    // Log to ad_analytics
    const { error: analyticsError } = await supabaseAdmin
      .from('ad_analytics')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        placement,
        event_type: 'click',
        view_duration: viewDuration || 0,
        device_type: deviceType || 'unknown',
        created_at: new Date().toISOString()
      });

    if (analyticsError) throw analyticsError;

    console.log('🖱️ [CLICK] Ad ID:', adId, 'Placement:', placement, 'Device:', deviceType, 'Duration:', viewDuration + 's');

    // Update ad clicks count in ads table
    const { data: adData } = await supabaseAdmin
      .from('ads')
      .select('total_clicks')
      .eq('id', adId)
      .single();
    
    if (adData) {
      const newCount = (adData.total_clicks || 0) + 1;
      await supabaseAdmin
        .from('ads')
        .update({ total_clicks: newCount })
        .eq('id', adId);
      console.log('✅ [CLICK] Updated count to:', newCount);
    }

    res.json({ success: true, message: 'Click logged' });
  } catch (error) {
    console.error('Ad click error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log ad dismiss
router.post('/ad-dismiss', async (req, res) => {
  try {
    const { adId, userId, placement, viewDuration, deviceType } = req.body;

    if (!adId || !placement) {
      return res.status(400).json({ error: 'adId and placement are required' });
    }

    // Log to ad_analytics
    const { error: analyticsError } = await supabaseAdmin
      .from('ad_analytics')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        placement,
        event_type: 'dismiss',
        view_duration: viewDuration || 0,
        device_type: deviceType || 'unknown',
        created_at: new Date().toISOString()
      });

    if (analyticsError) throw analyticsError;

    // Log to dismissals table
    await supabaseAdmin
      .from('ad_dismissals')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        placement,
        view_duration: viewDuration || 0,
        device_type: deviceType || 'unknown'
      });

    // Update ad dismisses count in ads table
    const { data: adData } = await supabaseAdmin
      .from('ads')
      .select('total_dismisses')
      .eq('id', adId)
      .single();
    
    if (adData) {
      const newCount = (adData.total_dismisses || 0) + 1;
      await supabaseAdmin
        .from('ads')
        .update({ total_dismisses: newCount })
        .eq('id', adId);
      console.log('❌ [DISMISS] Updated count to:', newCount);
    }

    console.log('📊 [DISMISS] Ad ID:', adId, 'Placement:', placement, 'Device:', deviceType, 'Duration:', viewDuration + 's');

    res.json({ success: true, message: 'Dismiss logged' });
  } catch (error) {
    console.error('Ad dismiss error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get ads by placement
router.get('/ads/all', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get all ads error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all ads for management
router.get('/admin/ads/all', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get all ads error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create new ad
router.post('/admin/ads', async (req, res) => {
  try {
    const { title, imageUrl, clickUrl, placement, startDate, endDate, countdownSeconds, isSkippable } = req.body;

    if (!title || !imageUrl || !placement) {
      return res.status(400).json({ error: 'title, imageUrl, and placement are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('ads')
      .insert({
        title,
        image_url: imageUrl,
        click_url: clickUrl || null,
        placement,
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || null,
        countdown_seconds: countdownSeconds || 10,
        is_skippable: isSkippable !== undefined ? isSkippable : true,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update ad
router.put('/admin/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, clickUrl, placement, startDate, endDate, countdownSeconds, isSkippable } = req.body;

    if (!title || !imageUrl || !placement) {
      return res.status(400).json({ error: 'title, imageUrl, and placement are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('ads')
      .update({
        title,
        image_url: imageUrl,
        click_url: clickUrl || null,
        placement,
        start_date: startDate,
        end_date: endDate || null,
        countdown_seconds: countdownSeconds || 10,
        is_skippable: isSkippable !== undefined ? isSkippable : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete ad
router.delete('/admin/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Get all ads performance (MUST be before :adId route)
router.get('/admin/analytics/all', async (req, res) => {
  try {
    console.log('📊 [GET /admin/analytics/all] Fetching all ads with metrics...');
    const { data, error } = await supabaseAdmin
      .from('ads')
      .select('id, title, placement, total_impressions, total_clicks, total_dismisses');

    if (error) throw error;

    console.log(`✅ [GET /admin/analytics/all] Found ${data?.length || 0} ads`);
    
    const enrichedData = data.map(ad => ({
      ...ad,
      ctr: ad.total_impressions > 0 
        ? ((ad.total_clicks / ad.total_impressions) * 100).toFixed(2)
        : 0,
      dismissRate: ad.total_impressions > 0
        ? ((ad.total_dismisses / ad.total_impressions) * 100).toFixed(2)
        : 0
    }));

    res.json({ success: true, data: enrichedData });
  } catch (error) {
    console.error('Get all analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Get ad performance metrics
router.get('/admin/analytics/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    console.log(`📈 [GET /admin/analytics/${adId}] Fetching metrics...`);

    // Get summary data
    const { data: summaryData, error: summaryError } = await supabaseAdmin
      .from('ad_performance_summary')
      .select('*')
      .eq('ad_id', adId)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') throw summaryError;

    // Get analytics by event type
    const { data: analyticsData, error: analyticsError } = await supabaseAdmin
      .from('ad_analytics')
      .select('event_type, device_type, view_duration')
      .eq('ad_id', adId);

    if (analyticsError) throw analyticsError;

    console.log(`✅ [GET /admin/analytics/${adId}] Found ${analyticsData?.length || 0} events`);

    // Calculate metrics
    const impressions = analyticsData.filter(a => a.event_type === 'impression').length;
    const clicks = analyticsData.filter(a => a.event_type === 'click').length;
    const dismisses = analyticsData.filter(a => a.event_type === 'dismiss').length;
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0;
    const avgViewDuration = impressions > 0 
      ? (analyticsData.reduce((sum, a) => sum + (a.view_duration || 0), 0) / impressions).toFixed(2)
      : 0;

    // Device breakdown
    const deviceBreakdown = {
      mobile: analyticsData.filter(a => a.device_type === 'mobile').length,
      tablet: analyticsData.filter(a => a.device_type === 'tablet').length,
      desktop: analyticsData.filter(a => a.device_type === 'desktop').length
    };

    res.json({
      success: true,
      data: {
        summary: summaryData,
        metrics: {
          impressions,
          clicks,
          dismisses,
          ctr: parseFloat(ctr),
          avgViewDuration: parseFloat(avgViewDuration),
          deviceBreakdown
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Get engagement data for date range
router.get('/admin/analytics/:adId/engagement', async (req, res) => {
  try {
    const { adId } = req.params;
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from('ad_analytics')
      .select('event_type, device_type, view_duration, created_at')
      .eq('ad_id', adId);

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by date
    const groupedByDate = {};
    data.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!groupedByDate[date]) {
        groupedByDate[date] = { impressions: 0, clicks: 0, dismisses: 0, totalViewTime: 0 };
      }
      if (item.event_type === 'impression') groupedByDate[date].impressions++;
      if (item.event_type === 'click') groupedByDate[date].clicks++;
      if (item.event_type === 'dismiss') groupedByDate[date].dismisses++;
      groupedByDate[date].totalViewTime += item.view_duration || 0;
    });

    res.json({ success: true, data: groupedByDate });
  } catch (error) {
    console.error('Get engagement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload ad image
router.post('/upload/image', async (req, res) => {
  try {
    // Handle base64 or buffer data
    const { fileName, fileData, mimeType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'fileName and fileData are required' });
    }

    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const fileExt = path.extname(fileName).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, SVG' });
    }

    // Create safe filename (remove special characters)
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(ADS_UPLOAD_DIR, safeFileName);

    // Convert base64 to buffer if needed
    let buffer;
    if (typeof fileData === 'string') {
      // Assume it's base64
      buffer = Buffer.from(fileData, 'base64');
    } else {
      buffer = Buffer.from(fileData);
    }

    // Write file to disk
    writeFileSync(filePath, buffer);

    // Return the path that can be used in ads
    const imagePath = `/ads/${safeFileName}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imagePath,
      fileName: safeFileName,
      fileSize: buffer.length
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
