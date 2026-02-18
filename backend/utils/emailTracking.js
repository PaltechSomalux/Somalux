// Email Tracking Utilities
// Handles tracking pixels, click tracking, and analytics

import crypto from 'crypto';
import { getSupabaseAdminClient } from './supabaseAdmin.js';

// Generate unique tracking token
function generateTrackingToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Create tracking pixel HTML (1x1 transparent GIF)
function createTrackingPixelHTML(trackingToken) {
  return `<img width="1" height="1" alt="" src="http://localhost:5000/api/email/track/open/${trackingToken}" />`;
}

// Create tracked link (wrapped with tracking endpoint)
function createTrackedLink(originalURL, trackingToken, linkText) {
  const encodedURL = Buffer.from(originalURL).toString('base64');
  return `<a href="http://localhost:5000/api/email/track/click/${trackingToken}?url=${encodedURL}">${linkText}</a>`;
}

// Create tracking object for a log
async function createEmailTracking(notificationId, logId, userEmail, shouldTrackOpens = true) {
  try {
    const supabase = getSupabaseAdminClient();
    const token = generateTrackingToken();

    if (shouldTrackOpens) {
      const { error } = await supabase
        .from('email_open_tracking')
        .insert({
          notification_id: notificationId,
          log_id: logId,
          user_email: userEmail,
          tracking_token: token,
          opened_count: 0,
        });

      if (error) {
        console.error('[EMAIL TRACKING] Failed to create tracking record:', error);
        return null;
      }

      console.log('✅ [EMAIL TRACKING] Created tracking pixel for:', userEmail);
      return token;
    }

    return null;
  } catch (error) {
    console.error('[EMAIL TRACKING] Error creating tracking:', error);
    return null;
  }
}

// Record email open
async function recordEmailOpen(trackingToken, ipAddress = null, userAgent = null) {
  try {
    const supabase = getSupabaseAdminClient();

    // Parse user agent for device type
    const deviceType = parseDeviceType(userAgent);
    const emailClient = parseEmailClient(userAgent);

    const { data: trackingRecord, error: fetchError } = await supabase
      .from('email_open_tracking')
      .select('*')
      .eq('tracking_token', trackingToken)
      .single();

    if (fetchError) {
      console.error('[EMAIL TRACKING] Tracking token not found:', trackingToken);
      return false;
    }

    // Update tracking record
    const { error: updateError } = await supabase
      .from('email_open_tracking')
      .update({
        opened_count: (trackingRecord.opened_count || 0) + 1,
        first_opened_at: trackingRecord.first_opened_at || new Date(),
        last_opened_at: new Date(),
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        email_client: emailClient,
        updated_at: new Date(),
      })
      .eq('id', trackingRecord.id);

    if (updateError) {
      console.error('[EMAIL TRACKING] Failed to update open:', updateError);
      return false;
    }

    // Update log status
    await supabase
      .from('admin_notification_logs')
      .update({
        opened_at: new Date(),
        status: 'opened',
      })
      .eq('id', trackingRecord.log_id);

    // Trigger analytics calculation (async, non-blocking)
    calculateNotificationAnalytics(trackingRecord.notification_id);

    console.log('📧 [EMAIL OPEN] Recorded open for:', trackingRecord.user_email);
    return true;
  } catch (error) {
    console.error('[EMAIL TRACKING] Error recording open:', error);
    return false;
  }
}

// Record email click
async function recordEmailClick(trackingToken, targetURL, ipAddress = null, userAgent = null) {
  try {
    const supabase = getSupabaseAdminClient();
    const deviceType = parseDeviceType(userAgent);

    // Get tracking record
    const { data: trackingRecord, error: fetchError } = await supabase
      .from('email_open_tracking')
      .select('*')
      .eq('tracking_token', trackingToken)
      .single();

    if (fetchError) {
      console.error('[EMAIL TRACKING] Click token not found:', trackingToken);
      return false;
    }

    // Insert click record
    const { error: insertError } = await supabase
      .from('email_click_tracking')
      .insert({
        notification_id: trackingRecord.notification_id,
        log_id: trackingRecord.log_id,
        user_id: trackingRecord.user_id,
        user_email: trackingRecord.user_email,
        tracking_token: trackingToken,
        link_url: targetURL,
        click_count: 1,
        first_clicked_at: new Date(),
        last_clicked_at: new Date(),
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
      });

    if (insertError) {
      // If record exists, update it
      if (insertError.code === '23505') {
        await supabase
          .from('email_click_tracking')
          .update({
            click_count: (trackingRecord.click_count || 0) + 1,
            last_clicked_at: new Date(),
            updated_at: new Date(),
          })
          .eq('tracking_token', trackingToken)
          .eq('link_url', targetURL);
      } else {
        console.error('[EMAIL TRACKING] Failed to record click:', insertError);
        return false;
      }
    }

    // Update log status
    await supabase
      .from('admin_notification_logs')
      .update({
        clicked_at: new Date(),
        status: 'clicked',
      })
      .eq('id', trackingRecord.log_id);

    // Trigger analytics calculation
    calculateNotificationAnalytics(trackingRecord.notification_id);

    console.log('🔗 [EMAIL CLICK] Recorded click for:', trackingRecord.user_email, 'URL:', targetURL);
    return true;
  } catch (error) {
    console.error('[EMAIL TRACKING] Error recording click:', error);
    return false;
  }
}

// Calculate analytics for notification
async function calculateNotificationAnalytics(notificationId) {
  try {
    const supabase = getSupabaseAdminClient();

    // Call the stored procedure to calculate analytics
    const { error } = await supabase.rpc('calculate_email_analytics', {
      notification_uuid: notificationId,
    });

    if (error) {
      console.error('[EMAIL ANALYTICS] Failed to calculate:', error);
      return false;
    }

    console.log('📊 [EMAIL ANALYTICS] Calculated for notification:', notificationId);
    return true;
  } catch (error) {
    console.error('[EMAIL ANALYTICS] Error calculating:', error);
    return false;
  }
}

// Get analytics for notification
async function getNotificationAnalytics(notificationId) {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: analytics, error } = await supabase
      .from('email_analytics_snapshot')
      .select('*')
      .eq('notification_id', notificationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[EMAIL ANALYTICS] Fetch failed:', error);
      return null;
    }

    return analytics;
  } catch (error) {
    console.error('[EMAIL ANALYTICS] Error fetching:', error);
    return null;
  }
}

// Parse device type from user agent
function parseDeviceType(userAgent) {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
}

// Parse email client from user agent
function parseEmailClient(userAgent) {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (ua.includes('gmail')) return 'gmail';
  if (ua.includes('outlook')) return 'outlook';
  if (ua.includes('apple')) return 'apple_mail';
  if (ua.includes('thunderbird')) return 'thunderbird';
  if (ua.includes('yahoo')) return 'yahoo';
  if (ua.includes('aol')) return 'aol';
  return 'other';
}

// Get detailed tracking info for a notification
async function getDetailedTrackingInfo(notificationId) {
  try {
    const supabase = getSupabaseAdminClient();

    // Get opens
    const { data: opens } = await supabase
      .from('email_open_tracking')
      .select('*')
      .eq('notification_id', notificationId);

    // Get clicks
    const { data: clicks } = await supabase
      .from('email_click_tracking')
      .select('*')
      .eq('notification_id', notificationId);

    return {
      opens: opens || [],
      clicks: clicks || [],
      totalOpens: opens?.length || 0,
      totalClicks: clicks?.length || 0,
      uniqueOpeners: new Set(opens?.map(o => o.user_email)).size || 0,
      uniqueClickers: new Set(clicks?.map(c => c.user_email)).size || 0,
    };
  } catch (error) {
    console.error('[EMAIL TRACKING] Error getting detailed info:', error);
    return null;
  }
}

export {
  generateTrackingToken,
  createTrackingPixelHTML,
  createTrackedLink,
  createEmailTracking,
  recordEmailOpen,
  recordEmailClick,
  calculateNotificationAnalytics,
  getNotificationAnalytics,
  getDetailedTrackingInfo,
  parseDeviceType,
  parseEmailClient,
};
