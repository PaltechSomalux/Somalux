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

// ============================================================
// 1. GET ADS BY TYPE AND PLACEMENT
// ============================================================

router.get('/ads/:placement', async (req, res) => {
  try {
    const { placement } = req.params;
    const { limit = 5, type = null } = req.query;

    console.log(`🔍 [GET /api/ads/${placement}] Fetching ads - type: ${type}, limit: ${limit}`);

    let query = supabaseAdmin
      .from('ads')
      .select('*')
      .eq('placement', placement);
      // Only filter by active status - don't enforce is_active column which may be null
      // .eq('is_active', true);

    if (type && type !== 'null') {
      query = query.eq('ad_type', type);
    }

    const { data, error } = await query
      .in('status', ['active', 'scheduled'])  // Only show active or scheduled ads
      .limit(limit);

    if (error) throw error;
    
    console.log(`✅ [GET /api/ads/${placement}] Found ${data?.length || 0} ads`);
    if (data?.length > 0) {
      console.log(`   - Ad type: ${data[0].ad_type}, Title: "${data[0].title}"`);
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error(`❌ [GET /api/ads/${placement}] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 2. LOG AD IMPRESSION
// ============================================================

router.post('/ad-impression', async (req, res) => {
  try {
    const { adId, userId, placement, viewDuration, deviceType, userAgent, videoAd } = req.body;

    if (!adId || !placement) {
      return res.status(400).json({ error: 'adId and placement are required' });
    }

    console.log('📊 [IMPRESSION]', {
      adId,
      placement,
      deviceType,
      videoAd: videoAd ? 'Yes' : 'No'
    });

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
        video_played: videoAd || false,
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
    console.error('❌ [IMPRESSION] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 3. LOG AD CLICK
// ============================================================

router.post('/ad-click', async (req, res) => {
  try {
    const { adId, userId, placement, viewDuration, deviceType, videoAd, watchedPercentage } = req.body;

    if (!adId || !placement) {
      return res.status(400).json({ error: 'adId and placement are required' });
    }

    console.log('🖱️ [CLICK]', {
      adId,
      placement,
      deviceType,
      videoAd: videoAd ? 'Yes' : 'No',
      watchedPercentage
    });

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
        video_completion_percent: watchedPercentage || 0,
        video_played: videoAd || false,
        created_at: new Date().toISOString()
      });

    if (analyticsError) throw analyticsError;

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
    console.error('❌ [CLICK] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 4. LOG VIDEO AD COMPLETION
// ============================================================

router.post('/ad-video-completion', async (req, res) => {
  try {
    const { 
      adId, 
      userId, 
      placement, 
      videoDuration, 
      playDuration, 
      percentageWatched,
      completed,
      pausedCount,
      deviceType 
    } = req.body;

    if (!adId) {
      return res.status(400).json({ error: 'adId is required' });
    }

    console.log('🎬 [VIDEO_COMPLETION]', {
      adId,
      percentageWatched,
      completed,
      playDuration,
      pausedCount
    });

    // Log to ad_video_playback
    const { error: playbackError, data: playbackData } = await supabaseAdmin
      .from('ad_video_playback')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        placement,
        device_type: deviceType || 'unknown',
        video_duration: videoDuration || 0,
        play_duration: playDuration || 0,
        percentage_watched: percentageWatched || 0,
        completed: completed || false,
        paused_count: pausedCount || 0,
        created_at: new Date().toISOString()
      })
      .select();

    if (playbackError) throw playbackError;

    // Log to analytics as video_play event
    const { error: analyticsError } = await supabaseAdmin
      .from('ad_analytics')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        placement,
        event_type: 'video_play',
        video_played: true,
        video_completion_percent: percentageWatched || 0,
        play_duration: playDuration || 0,
        device_type: deviceType || 'unknown',
        created_at: new Date().toISOString()
      });

    if (analyticsError) throw analyticsError;

    console.log('✅ [VIDEO_COMPLETION] Logged successfully');
    res.json({ success: true, data: playbackData, message: 'Video playback logged' });
  } catch (error) {
    console.error('❌ [VIDEO_COMPLETION] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 5. LOG AD DISMISS
// ============================================================

router.post('/ad-dismiss', async (req, res) => {
  try {
    const { 
      adId, 
      userId, 
      placement, 
      viewDuration, 
      deviceType,
      videoAd,
      watchedPercentage,
      videoDuration,
      playDuration
    } = req.body;

    if (!adId || !placement) {
      return res.status(400).json({ error: 'adId and placement are required' });
    }

    console.log('❌ [DISMISS]', {
      adId,
      placement,
      deviceType,
      videoAd: videoAd ? 'Yes' : 'No'
    });

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
        video_completion_percent: watchedPercentage || 0,
        video_played: videoAd || false,
        play_duration: playDuration || 0,
        created_at: new Date().toISOString()
      });

    if (analyticsError) throw analyticsError;

    // Log to ad_dismissals table
    const { error: dismissError } = await supabaseAdmin
      .from('ad_dismissals')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        placement,
        view_duration: viewDuration || 0,
        device_type: deviceType || 'unknown'
      });

    if (dismissError) throw dismissError;

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
      console.log('✅ [DISMISS] Updated count to:', newCount);
    }

    res.json({ success: true, message: 'Dismiss logged' });
  } catch (error) {
    console.error('❌ [DISMISS] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 6. LOG CONVERSION
// ============================================================

router.post('/ad-conversion', async (req, res) => {
  try {
    const { adId, userId, conversionType, conversionValue, pixelId, referralSource } = req.body;

    if (!adId || !conversionType) {
      return res.status(400).json({ error: 'adId and conversionType are required' });
    }

    console.log('💰 [CONVERSION]', {
      adId,
      conversionType,
      conversionValue,
      pixelId
    });

    // Log conversion
    const { error: conversionError, data: conversionData } = await supabaseAdmin
      .from('ad_conversions')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        conversion_type: conversionType,
        conversion_value: conversionValue || 0,
        pixel_id: pixelId || null,
        referral_source: referralSource || null,
        converted_at: new Date().toISOString()
      })
      .select();

    if (conversionError) throw conversionError;

    // Log to analytics with revenue
    const { error: analyticsError } = await supabaseAdmin
      .from('ad_analytics')
      .insert({
        ad_id: adId,
        user_id: userId || null,
        event_type: 'conversion',
        conversion_event: true,
        revenue: conversionValue || 0,
        created_at: new Date().toISOString()
      });

    if (analyticsError) throw analyticsError;

    console.log('✅ [CONVERSION] Logged successfully, Value:', conversionValue);
    res.json({ success: true, data: conversionData, message: 'Conversion logged' });
  } catch (error) {
    console.error('❌ [CONVERSION] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 7. ADMIN: GET ALL ADS
// ============================================================

router.get('/admin/ads/all', async (req, res) => {
  try {
    console.log('📝 [ADMIN_ADS_ALL] Fetching all ads from database...');
    const { data, error } = await supabaseAdmin
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log(`✅ [ADMIN_ADS_ALL] Retrieved ${data?.length || 0} ads`);
    if (data && data.length > 0) {
      console.log('📋 [ADMIN_ADS_ALL] First ad:', JSON.stringify(data[0], null, 2));
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ [ADMIN_ADS_ALL] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 8. ADMIN: CREATE AD
// ============================================================

router.post('/admin/ads', async (req, res) => {
  try {
    console.log('📝 [CREATE_AD] FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));

    const {
      title,
      adType,
      imageUrl,
      videoUrl,
      videoDuration,
      videoThumbnailUrl,
      clickUrl,
      ctaText,
      ctaButtonColor,
      placement,
      startDate,
      endDate,
      countdownSeconds,
      isSkippable,
      campaignId,
      campaignName,
      budget,
      dailyBudget,
      costPerClick,
      minAge,
      maxAge,
      targetGender,
      targetDevices,
      frequencyCap,
      conversionTracking,
      conversionUrl,
      status,
      priority,
      abTestGroup
    } = req.body;

    console.log('📝 [CREATE_AD] Extracted values:', { title, placement, adType, videoUrl });

    if (!title || !placement) {
      console.error('❌ Validation failed - Missing title or placement:', { title, placement });
      return res.status(400).json({ error: 'title and placement are required' });
    }

    if ((adType === 'image' && !imageUrl) || (adType === 'video' && !videoUrl)) {
      console.error('❌ Validation failed - Missing URL:', { adType, imageUrl, videoUrl });
      return res.status(400).json({ error: `${adType} URL is required` });
    }

    console.log(`📝 [CREATE_AD] Validation passed, creating ad - Title: "${title}", Type: ${adType}`);

    const { data, error } = await supabaseAdmin
      .from('ads')
      .insert({
        title,
        ad_type: adType || 'image',
        image_url: imageUrl || (adType === 'video' ? '/ads/video-placeholder.png' : '/ads/placeholder.png'),
        video_url: videoUrl || null,
        video_duration: videoDuration || 0,
        video_thumbnail_url: videoThumbnailUrl || null,
        click_url: clickUrl || null,
        cta_text: ctaText || 'Learn More',
        cta_button_color: ctaButtonColor || '#007bff',
        placement,
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || null,
        countdown_seconds: countdownSeconds || 10,
        is_skippable: isSkippable !== undefined ? isSkippable : true,
        is_active: status === 'active' || status === 'scheduled',
        campaign_id: campaignId || null,
        campaign_name: campaignName || null,
        budget: budget || 0,
        daily_budget: dailyBudget || 0,
        cost_per_click: costPerClick || 0.5,
        min_age: minAge || 0,
        max_age: maxAge || 100,
        target_gender: targetGender || 'all',
        target_devices: targetDevices || JSON.stringify(['mobile', 'tablet', 'desktop']),
        frequency_cap: frequencyCap || 0,
        conversion_tracking: conversionTracking || false,
        conversion_url: conversionUrl || null,
        status: status || 'draft',
        priority: priority || 0,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    console.log('✅ [CREATE_AD] Success, ID:', data[0].id);
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('❌ [CREATE_AD] Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      fullError: error
    });
    res.status(500).json({ error: error.message, details: error.code });
  }
});

// ============================================================
// 9. ADMIN: UPDATE AD
// ============================================================

router.put('/admin/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      adType,
      imageUrl,
      videoUrl,
      videoDuration,
      videoThumbnailUrl,
      clickUrl,
      ctaText,
      ctaButtonColor,
      placement,
      startDate,
      endDate,
      countdownSeconds,
      isSkippable,
      campaignId,
      campaignName,
      budget,
      dailyBudget,
      costPerClick,
      minAge,
      maxAge,
      targetGender,
      targetDevices,
      frequencyCap,
      conversionTracking,
      conversionUrl,
      status,
      priority,
      abTestGroup
    } = req.body;

    console.log(`✏️ [UPDATE_AD] ID: ${id}, Title: "${title}"`);

    const { data, error } = await supabaseAdmin
      .from('ads')
      .update({
        title,
        ad_type: adType || 'image',
        image_url: imageUrl || '/ads/video-placeholder.png',
        video_url: videoUrl || null,
        video_duration: videoDuration || 0,
        video_thumbnail_url: videoThumbnailUrl || null,
        click_url: clickUrl || null,
        cta_text: ctaText || 'Learn More',
        cta_button_color: ctaButtonColor || '#007bff',
        placement,
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || null,
        countdown_seconds: countdownSeconds || 10,
        is_skippable: isSkippable !== undefined ? isSkippable : true,
        is_active: status === 'active' || status === 'scheduled',
        campaign_id: campaignId || null,
        campaign_name: campaignName || null,
        budget: budget || 0,
        daily_budget: dailyBudget || 0,
        cost_per_click: costPerClick || 0.5,
        min_age: minAge || 0,
        max_age: maxAge || 100,
        target_gender: targetGender || 'all',
        target_devices: targetDevices || JSON.stringify(['mobile', 'tablet', 'desktop']),
        frequency_cap: frequencyCap || 0,
        conversion_tracking: conversionTracking || false,
        conversion_url: conversionUrl || null,
        status: status || 'draft',
        priority: priority || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    console.log('✅ [UPDATE_AD] Success');
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('❌ [UPDATE_AD] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 10. ADMIN: DELETE AD
// ============================================================

router.delete('/admin/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ [DELETE_AD] ID: ${id}`);

    const { error } = await supabaseAdmin
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    console.log('✅ [DELETE_AD] Success');
    res.json({ success: true, message: 'Ad deleted' });
  } catch (error) {
    console.error('❌ [DELETE_AD] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 11. ADMIN: GET ANALYTICS
// ============================================================

router.get('/admin/analytics/all', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('📊 [ANALYTICS_ALL] Fetching analytics');

    let query = supabaseAdmin
      .from('ads')
      .select('*, ad_analytics(count)');

    const { data, error } = await query.order('total_impressions', { ascending: false });

    if (error) throw error;
    console.log('✅ [ANALYTICS_ALL] Retrieved data for', data?.length || 0, 'ads');
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ [ANALYTICS_ALL] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 12. ADMIN: GET AD ANALYTICS
// ============================================================

router.get('/admin/analytics/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const { startDate, endDate } = req.query;

    console.log(`📈 [ANALYTICS_AD] ID: ${adId}`);

    // Get ad details
    const { data: adData, error: adError } = await supabaseAdmin
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (adError) throw adError;

    // Get analytics events
    let analyticsQuery = supabaseAdmin
      .from('ad_analytics')
      .select('*')
      .eq('ad_id', adId);

    if (startDate) analyticsQuery = analyticsQuery.gte('created_at', startDate);
    if (endDate) analyticsQuery = analyticsQuery.lte('created_at', endDate);

    const { data: analyticsData, error: analyticsError } = await analyticsQuery;

    if (analyticsError) throw analyticsError;

    // Calculate metrics
    const metrics = {
      ad: adData,
      totalEvents: analyticsData?.length || 0,
      impressions: analyticsData?.filter(e => e.event_type === 'impression').length || 0,
      clicks: analyticsData?.filter(e => e.event_type === 'click').length || 0,
      dismisses: analyticsData?.filter(e => e.event_type === 'dismiss').length || 0,
      videoPlays: analyticsData?.filter(e => e.video_played === true).length || 0,
      conversions: analyticsData?.filter(e => e.conversion_event === true).length || 0,
      avgViewDuration: 0,
      ctr: 0,
      conversionRate: 0
    };

    // Calculate CTR
    if (metrics.impressions > 0) {
      metrics.ctr = ((metrics.clicks / metrics.impressions) * 100).toFixed(2);
    }

    // Calculate conversion rate
    if (metrics.clicks > 0) {
      metrics.conversionRate = ((metrics.conversions / metrics.clicks) * 100).toFixed(2);
    }

    // Calculate average view duration
    const viewDurations = analyticsData
      ?.filter(e => e.view_duration > 0)
      .map(e => e.view_duration) || [];
    
    if (viewDurations.length > 0) {
      metrics.avgViewDuration = (viewDurations.reduce((a, b) => a + b, 0) / viewDurations.length).toFixed(2);
    }

    // Device breakdown
    const deviceBreakdown = {};
    analyticsData?.forEach(event => {
      if (event.device_type) {
        deviceBreakdown[event.device_type] = (deviceBreakdown[event.device_type] || 0) + 1;
      }
    });
    metrics.deviceBreakdown = deviceBreakdown;

    console.log('✅ [ANALYTICS_AD] Calculated metrics:', {
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      ctr: metrics.ctr,
      conversions: metrics.conversions
    });

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('❌ [ANALYTICS_AD] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 13. ADMIN: GET VIDEO ANALYTICS
// ============================================================

router.get('/admin/analytics/video/:adId', async (req, res) => {
  try {
    const { adId } = req.params;

    console.log(`🎬 [VIDEO_ANALYTICS] ID: ${adId}`);

    // Get video playback data
    const { data: videoData, error: videoError } = await supabaseAdmin
      .from('ad_video_playback')
      .select('*')
      .eq('ad_id', adId);

    if (videoError) throw videoError;

    // Calculate metrics
    const metrics = {
      totalPlays: videoData?.length || 0,
      completedPlays: videoData?.filter(v => v.completed === true).length || 0,
      avgWatchPercentage: 0,
      avgPlayDuration: 0,
      totalPauses: 0,
      completionRate: 0
    };

    if (videoData && videoData.length > 0) {
      // Average watch percentage
      const percentages = videoData.map(v => v.percentage_watched || 0);
      metrics.avgWatchPercentage = (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(2);

      // Average play duration
      const durations = videoData.map(v => v.play_duration || 0);
      metrics.avgPlayDuration = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2);

      // Total pauses
      metrics.totalPauses = videoData.reduce((sum, v) => sum + (v.paused_count || 0), 0);

      // Completion rate
      metrics.completionRate = ((metrics.completedPlays / metrics.totalPlays) * 100).toFixed(2);
    }

    console.log('✅ [VIDEO_ANALYTICS] Metrics calculated');
    res.json({ success: true, data: { ...metrics, detailedData: videoData } });
  } catch (error) {
    console.error('❌ [VIDEO_ANALYTICS] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 14. ADMIN: CAMPAIGNS
// ============================================================

router.get('/admin/campaigns/all', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/campaigns', async (req, res) => {
  try {
    const { name, description, objective, budget, dailyBudget, startDate, endDate, status } = req.body;

    if (!name || !objective) {
      return res.status(400).json({ error: 'name and objective are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('ad_campaigns')
      .insert({
        name,
        description: description || null,
        objective,
        budget: budget || 0,
        daily_budget: dailyBudget || 0,
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || null,
        status: status || 'draft',
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 15. FILE UPLOAD ENDPOINTS
// ============================================================

router.post('/upload/image', async (req, res) => {
  try {
    const { fileName, fileData, mimeType } = req.body;

    console.log('📸 [IMAGE_UPLOAD] Received:', { fileName, hasFileData: !!fileData, mimeType });

    if (!fileName || !fileData) {
      console.error('❌ [IMAGE_UPLOAD] Missing required fields:', { fileName, fileData: !!fileData });
      return res.status(400).json({ error: 'fileName and fileData are required' });
    }

    // Generate unique filename - sanitize by replacing spaces and special chars, but preserve extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    const sanitizedName = nameWithoutExt.replace(/[\s\W-]+/g, '_').toLowerCase() + ext.toLowerCase();
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(ADS_UPLOAD_DIR, uniqueName);

    // Write file
    const buffer = Buffer.from(fileData, 'base64');
    writeFileSync(filePath, buffer);

    console.log('✅ [IMAGE_UPLOAD] Saved:', uniqueName, 'Size:', buffer.length, 'bytes');

    res.json({
      success: true,
      fileName: uniqueName,
      filePath: `/ads/${uniqueName}`,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('❌ [IMAGE_UPLOAD] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload/video', async (req, res) => {
  try {
    const { fileName, fileData, mimeType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'fileName and fileData are required' });
    }

    // Generate unique filename - sanitize by replacing spaces and special chars, but preserve extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    const sanitizedName = nameWithoutExt.replace(/[\s\W-]+/g, '_').toLowerCase() + ext.toLowerCase();
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(ADS_UPLOAD_DIR, uniqueName);

    // Write file
    const buffer = Buffer.from(fileData, 'base64');
    writeFileSync(filePath, buffer);

    console.log('🎬 [VIDEO_UPLOAD] Saved:', uniqueName);

    res.json({
      success: true,
      fileName: uniqueName,
      filePath: `/ads/${uniqueName}`,
      duration: 0, // Can be calculated later
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('❌ [VIDEO_UPLOAD] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload/thumbnail', async (req, res) => {
  try {
    const { fileName, fileData, mimeType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'fileName and fileData are required' });
    }

    // Generate unique filename - sanitize by replacing spaces and special chars, but preserve extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    const sanitizedName = nameWithoutExt.replace(/[\s\W-]+/g, '_').toLowerCase() + ext.toLowerCase();
    const uniqueName = `thumbnail-${Date.now()}-${sanitizedName}`;
    const filePath = path.join(ADS_UPLOAD_DIR, uniqueName);

    // Write file
    const buffer = Buffer.from(fileData, 'base64');
    writeFileSync(filePath, buffer);

    console.log('📸 [THUMBNAIL_UPLOAD] Saved:', uniqueName);

    res.json({
      success: true,
      fileName: uniqueName,
      filePath: `/ads/${uniqueName}`,
      message: 'Thumbnail uploaded successfully'
    });
  } catch (error) {
    console.error('❌ [THUMBNAIL_UPLOAD] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 16. PERFORMANCE & TESTING
// ============================================================

router.get('/admin/performance/by-type', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_ad_performance_by_type');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/roi/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const { data, error } = await supabaseAdmin
      .rpc('calculate_ad_roi', { p_ad_id: adId });

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error calculating ROI:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
