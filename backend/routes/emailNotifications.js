import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, buildBrandedEmailHtml } from '../utils/email.js';
import { recordEmailOpen, recordEmailClick, getNotificationAnalytics, getDetailedTrackingInfo } from '../utils/emailTracking.js';
import { processBounce, getBounceStats, shouldSkipSending } from '../utils/bounceHandler.js';
import { scheduleEmail, cancelScheduledEmail, getScheduledEmails } from '../utils/scheduledSendQueue.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Lazy-initialize Supabase clients (only when needed)
let supabase = null;
let supabaseAdmin = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ [EMAIL NOTIFICATIONS] Supabase credentials not configured');
      return null;
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn('⚠️ [EMAIL NOTIFICATIONS] Supabase service role not configured - RLS policies will be enforced');
      return null;
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return supabaseAdmin;
}

/**
 * GET /api/admin/notifications - Fetch all notifications with optional filters
 */
router.get('/notifications', async (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    console.log(`📧 [NOTIFICATIONS] Fetching notifications - status: ${status || 'all'}, type: ${type || 'all'}, limit: ${limit}, offset: ${offset}`);

    const client = getSupabaseAdminClient();
    if (!client) return res.status(500).json({ success: false, error: 'Database not configured' });

    let query = client
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('notification_type', type);

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    
    console.log(`📧 [NOTIFICATIONS] Fetched ${data?.length || 0} notifications (total in DB: ${count})`);

    return res.json({
      success: true,
      data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch notifications',
    });
  }
});

/**
 * GET /api/admin/notifications/:id - Fetch single notification with delivery logs
 */
router.get('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📧 [NOTIFICATIONS] Fetching single notification: ${id}`);

    const client = getSupabaseAdminClient();
    if (!client) return res.status(500).json({ success: false, error: 'Database not configured' });

    const { data: notification, error: notifError } = await client
      .from('admin_notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (notifError) throw notifError;
    if (!notification) {
      console.log(`⚠️  [NOTIFICATIONS] Notification not found: ${id}`);
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`✅ [NOTIFICATIONS] Found notification: ${notification.title}`);

    // Fetch delivery logs
    const { data: logs, error: logsError } = await client
      .from('admin_notification_logs')
      .select('*')
      .eq('notification_id', id)
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;

    return res.json({
      success: true,
      notification,
      logs,
    });
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error fetching notification details:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/notifications/send - Send email notifications to users
 * Body: {
 *   title, message, htmlContent?, notificationType, 
 *   recipientType ('all_users', 'specific_users', 'by_role', 'by_tier'),
 *   recipientFilter?, recipientsList?, adminName, adminEmail
 * }
 */
router.post('/notifications/send', async (req, res) => {
  try {
    const {
      title,
      message,
      htmlContent,
      notificationType,
      recipientType,
      recipientFilter = {},
      recipientsList = [],
      adminName,
      adminEmail,
      tags = [],
      isUrgent = false,
    } = req.body;

    // Validation
    if (!title || !message || !notificationType || !recipientType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, message, notificationType, recipientType',
      });
    }

    console.log('📧 [NOTIFICATIONS] Processing send request...');
    console.log('  - Title:', title);
    console.log('  - Type:', notificationType);
    console.log('  - Recipient Type:', recipientType);

    const client = getSupabaseClient();
    if (!client) return res.status(500).json({ success: false, error: 'Database not configured' });

    // Use admin client to bypass RLS for recipient queries
    const adminClient = getSupabaseAdminClient() || client;

    // Fetch recipient list based on recipientType
    let recipients = [];

    if (recipientType === 'all_users') {
      // Fetch all users without limit - handle pagination for large datasets
      let allUsers = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await adminClient
          .from('profiles')
          .select('id, email')
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allUsers = allUsers.concat(data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      recipients = allUsers;
    } else if (recipientType === 'specific_users' && recipientsList.length > 0) {
      recipients = recipientsList.map((item) => ({
        email: item.email || item,
        id: item.id || null,
      }));
    } else if (recipientType === 'by_role' && recipientFilter.role) {
      // Fetch all users by role without limit - handle pagination
      let allUsers = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await adminClient
          .from('profiles')
          .select('id, email')
          .eq('role', recipientFilter.role)
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allUsers = allUsers.concat(data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      recipients = allUsers;
    } else if (recipientType === 'by_tier' && recipientFilter.tier) {
      // Fetch all users by tier without limit - handle pagination
      let allUsers = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await adminClient
          .from('profiles')
          .select('id, email')
          .eq('subscription_tier', recipientFilter.tier)
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allUsers = allUsers.concat(data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      recipients = allUsers;
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No recipients found matching the criteria',
      });
    }

    console.log(`📧 [NOTIFICATIONS] Found ${recipients.length} recipients`);

    // Create notification record using admin client (bypasses RLS)
    const notificationId = uuidv4();
    console.log(`📧 [NOTIFICATIONS] Creating notification record with ID: ${notificationId}`);
    
    const { error: createError } = await adminClient
      .from('admin_notifications')
      .insert([
        {
          id: notificationId,
          admin_name: adminName,
          admin_email: adminEmail,
          notification_type: notificationType,
          title,
          message,
          html_content: htmlContent,
          recipient_type: recipientType,
          recipient_filter: recipientFilter,
          recipients_list: recipientsList.length > 0 ? JSON.stringify(recipientsList) : null,
          recipient_count: recipients.length,
          status: 'sending',
          sent_count: 0,
          failed_count: 0,
          tags,
          is_urgent: isUrgent,
        },
      ]);

    if (createError) {
      console.error(`❌ [NOTIFICATIONS] Failed to create notification record:`, createError);
      throw createError;
    }
    console.log(`✅ [NOTIFICATIONS] Notification record created successfully`);
    console.log(`📊 [NOTIFICATIONS] Notification ID: ${notificationId}, Title: "${title}", Recipients: ${recipients.length}`);

    // Build email HTML
    const emailHtml = htmlContent || buildBrandedEmailHtml({
      title,
      body: message,
    });

    // Send emails (in background, don't wait)
    sendEmailsInBackground(notificationId, title, emailHtml, recipients).catch((err) => {
      console.error('❌ [NOTIFICATIONS] Background email sending failed:', err);
    });

    return res.json({
      success: true,
      message: `Email sending initiated. Notification ID: ${notificationId}`,
      notificationId,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error sending notifications:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Background function to send emails and track delivery
 */
async function sendEmailsInBackground(notificationId, subject, htmlContent, recipients) {
  let sentCount = 0;
  let failedCount = 0;
  let pendingRetryCount = 0;

  const client = getSupabaseClient();
  const adminClient = getSupabaseAdminClient() || client;
  if (!client) {
    console.error('❌ [NOTIFICATIONS] Database not configured for background send');
    return;
  }

  console.log(`📧 [NOTIFICATIONS] Starting background send for ${recipients.length} recipients...`);

  for (const recipient of recipients) {
    try {
      // Fetch user details for personalization
      const { data: userData, error: userError } = await adminClient
        .from('profiles')
        .select('display_name, email')
        .eq('email', recipient.email)
        .single();

      let personalizedHtml = htmlContent;
      let userName = userData?.display_name || recipient.email.split('@')[0] || 'User';

      // Replace placeholders with actual user name
      personalizedHtml = personalizedHtml.replace(/Dear User/gi, `Dear ${userName}`);
      personalizedHtml = personalizedHtml.replace(/{{username}}/gi, userName);
      personalizedHtml = personalizedHtml.replace(/{{user_name}}/gi, userName);
      personalizedHtml = personalizedHtml.replace(/{{display_name}}/gi, userName);

      // Send email with personalized content
      const result = await sendEmail({
        to: recipient.email,
        subject,
        html: personalizedHtml,
      });

      // Check if email was queued for retry due to rate limit
      if (result?.queued && result?.status === 'pending_retry') {
        const retryDateTime = result.retryTime ? new Date(result.retryTime).toLocaleString() : 'tomorrow';
        console.warn(`⏳ [NOTIFICATIONS] Email QUEUED FOR RETRY on ${retryDateTime} for ${recipient.email}`);
        pendingRetryCount++;
        
        // Log as pending (will retry automatically)
        try {
          const { error: logError } = await adminClient.from('admin_notification_logs').insert([
            {
              notification_id: notificationId,
              user_id: recipient.id || null,
              user_email: recipient.email,
              status: 'pending',
              sent_at: new Date().toISOString(),
              error_message: 'Gmail daily limit reached - will retry tomorrow',
            },
          ]);
          if (logError) {
            console.error('❌ [NOTIFICATIONS] Failed to log pending status:', logError);
          }
        } catch (logErr) {
          console.error('❌ [NOTIFICATIONS] Exception logging pending status:', logErr.message);
        }
      } else if (result?.queued) {
        const retryDateTime = result.retryTime ? new Date(result.retryTime).toLocaleString() : 'tomorrow';
        console.warn(`⏳ [NOTIFICATIONS] Email queued for retry on ${retryDateTime} for ${recipient.email}`);
        pendingRetryCount++;
        
        // Log as pending (will retry automatically)
        try {
          const { error: logError } = await adminClient.from('admin_notification_logs').insert([
            {
              notification_id: notificationId,
              user_id: recipient.id || null,
              user_email: recipient.email,
              status: 'pending',
              sent_at: new Date().toISOString(),
              error_message: 'Email queued for retry',
            },
          ]);
          if (logError) {
            console.error('❌ [NOTIFICATIONS] Failed to log pending status:', logError);
          }
        } catch (logErr) {
          console.error('❌ [NOTIFICATIONS] Exception logging pending status:', logErr.message);
        }
      } else {
        // Log success
        await adminClient.from('admin_notification_logs').insert([
          {
            notification_id: notificationId,
            user_id: recipient.id || null,
            user_email: recipient.email,
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_from: result.sendingAccount || 'unknown',
          },
        ]);

        sentCount++;
        console.log(`✅ [NOTIFICATIONS] Sent to ${recipient.email} via ${result.sendingAccountName || 'email'}`);
      }
    } catch (error) {
      failedCount++;
      console.error(`❌ [NOTIFICATIONS] Failed to send to ${recipient.email}:`, error.message);

      // Log failure
      try {
        const { error: logError } = await adminClient.from('admin_notification_logs').insert([
          {
            notification_id: notificationId,
            user_id: recipient.id || null,
            user_email: recipient.email,
            status: 'failed',
            error_message: error.message,
          },
        ]);
        if (logError) {
          console.error('❌ [NOTIFICATIONS] Failed to log error:', logError);
        }
      } catch (logErr) {
        console.error('❌ [NOTIFICATIONS] Exception logging failure:', logErr.message);
      }
    }

    // Minimal delay - main rate limiting is handled in email.js
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Update notification record with final counts
  const finalStatus = failedCount === 0 && pendingRetryCount === 0 ? 'sent' : (failedCount > 0 ? 'partial' : 'pending');
  const { error: updateError } = await adminClient
    .from('admin_notifications')
    .update({
      status: finalStatus,
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (updateError) {
    console.error('❌ [NOTIFICATIONS] Failed to update notification status:', updateError);
  }

  const summary = `${sentCount} sent${pendingRetryCount > 0 ? `, ${pendingRetryCount} pending retry` : ''}${failedCount > 0 ? `, ${failedCount} failed` : ''}`;
  console.log(`✅ [NOTIFICATIONS] Background send complete: ${summary}`);
}

/**
 * GET /api/admin/templates - Fetch email templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('❌ [TEMPLATES] Error fetching templates:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/templates - Create new email template
 */
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      subject,
      body,
      htmlBody,
      variables = {},
      isPublic = true,
      adminId,
    } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, subject, body',
      });
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert([
        {
          name,
          category,
          description,
          subject,
          body,
          html_body: htmlBody,
          variables,
          is_public: isPublic,
          created_by: adminId || null,
        },
      ])
      .select();

    if (error) throw error;

    return res.json({
      success: true,
      data: data?.[0],
    });
  } catch (error) {
    console.error('❌ [TEMPLATES] Error creating template:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/notification-stats - Get notification stats
 */
router.get('/notification-stats', async (req, res) => {
  try {
    const client = getSupabaseAdminClient();
    if (!client) return res.status(500).json({ success: false, error: 'Database not configured' });

    // Fetch all notifications
    const { error, data } = await client
      .from('admin_notifications')
      .select('status');

    if (error) throw error;
    
    console.log(`📊 [STATS] Query returned ${data?.length || 0} notification records`);

    const stats = {
      total: 0,
      sent: 0,
      failed: 0,
      scheduled: 0,
      draft: 0,
      sending: 0,
      pending: 0,
      partial: 0,
    };

    // Count statuses manually
    if (data && Array.isArray(data)) {
      stats.total = data.length;
      data.forEach((item) => {
        if (item.status) {
          switch (item.status) {
            case 'sent':
              stats.sent += 1;
              break;
            case 'failed':
              stats.failed += 1;
              break;
            case 'scheduled':
              stats.scheduled += 1;
              break;
            case 'draft':
              stats.draft += 1;
              break;
            case 'sending':
              stats.sending += 1;
              break;
            case 'pending':
              stats.pending += 1;
              break;
            case 'partial':
              stats.partial += 1;
              break;
            default:
              break;
          }
        }
      });
    }

    console.log('📊 [STATS] Notification stats:', stats);

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ [STATS] Error fetching notification stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/users - Get all users for selection
 */
router.get('/users', async (req, res) => {
  try {
    // Use admin client to bypass RLS policies
    const adminClient = getSupabaseAdminClient() || getSupabaseClient();
    if (!adminClient) {
      console.error('❌ [USERS] Supabase not configured');
      return res.status(500).json({ success: false, error: 'Database not configured' });
    }

    // Fetch all users with id, email, display_name, and avatar_url from profiles table
    // Handle pagination for large user bases
    let allUsers = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let lastError = null;
    
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { error, data } = await adminClient
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .order('email', { ascending: true })
        .range(from, to);
      
      if (error) {
        lastError = error;
        hasMore = false;
      } else if (data && data.length > 0) {
        allUsers = allUsers.concat(data);
        page++;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    const data = allUsers;
    const error = lastError;

    if (error) {
      console.error('❌ [USERS] Database query error:', error);
      throw error;
    }

    console.log('📊 [USERS] Fetched users count:', data?.length || 0);

    // Transform data to match frontend expectations
    const transformedUsers = (data || []).map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.display_name || '',
      avatar_url: user.avatar_url || ''
    }));

    return res.json({
      success: true,
      users: transformedUsers,
    });
  } catch (error) {
    console.error('❌ [USERS] Error fetching users:', error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users',
    });
  }
});

/**
 * POST /api/admin/notifications/schedule - Schedule an email for later sending
 */
router.post('/notifications/schedule', async (req, res) => {
  try {
    const { notificationId, scheduledTime, timezone = 'UTC' } = req.body;

    if (!notificationId || !scheduledTime) {
      return res.status(400).json({
        success: false,
        error: 'notificationId and scheduledTime are required',
      });
    }

    const result = await scheduleEmail(notificationId, new Date(scheduledTime), timezone);

    return res.json({
      success: result,
      message: result ? 'Email scheduled successfully' : 'Failed to schedule email',
    });
  } catch (error) {
    console.error('❌ [SCHEDULE] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to schedule email',
    });
  }
});

/**
 * GET /api/admin/notifications/scheduled - Get all scheduled emails
 */
router.get('/notifications/scheduled', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const schedules = await getScheduledEmails(status);

    return res.json({
      success: true,
      scheduled: schedules,
    });
  } catch (error) {
    console.error('❌ [SCHEDULED] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch schedules',
    });
  }
});

/**
 * DELETE /api/admin/notifications/scheduled/:scheduleId - Cancel a scheduled email
 */
router.delete('/notifications/scheduled/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const result = await cancelScheduledEmail(scheduleId);

    return res.json({
      success: result,
      message: result ? 'Schedule cancelled' : 'Failed to cancel schedule',
    });
  } catch (error) {
    console.error('❌ [CANCEL SCHEDULE] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel schedule',
    });
  }
});

/**
 * GET /api/admin/notifications/:notificationId/analytics - Get analytics for a notification
 */
router.get('/notifications/:notificationId/analytics', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const analytics = await getNotificationAnalytics(notificationId);
    const detailed = await getDetailedTrackingInfo(notificationId);

    return res.json({
      success: true,
      analytics: analytics,
      detailed: detailed,
    });
  } catch (error) {
    console.error('❌ [ANALYTICS] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics',
    });
  }
});

/**
 * GET /api/email/track/open/:token - Track email opens (1x1 pixel)
 */
router.get('/track/open/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await recordEmailOpen(token, ipAddress, userAgent);

    // Return 1x1 transparent GIF
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
      0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
      0xf9, 0x04, 0x01, 0x0a, 0x00, 0x01, 0x00, 0x2c, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x4c,
      0x01, 0x00, 0x3b
    ]);

    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return res.send(gif);
  } catch (error) {
    console.error('❌ [TRACK OPEN] Error:', error);
    // Still return GIF on error to not break tracking
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
      0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
      0xf9, 0x04, 0x01, 0x0a, 0x00, 0x01, 0x00, 0x2c, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x4c,
      0x01, 0x00, 0x3b
    ]);
    res.set('Content-Type', 'image/gif');
    return res.send(gif);
  }
});

/**
 * GET /api/email/track/click/:token - Track email link clicks
 */
router.get('/track/click/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    const decodedUrl = Buffer.from(url, 'base64').toString('utf-8');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await recordEmailClick(token, decodedUrl, ipAddress, userAgent);

    // Redirect to original URL
    return res.redirect(decodedUrl);
  } catch (error) {
    console.error('❌ [TRACK CLICK] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track click',
    });
  }
});

/**
 * POST /api/admin/notifications/bounce - Record a bounce
 */
router.post('/bounce', async (req, res) => {
  try {
    const { emailAddress, userId, errorMessage, errorCode, notificationId } = req.body;

    if (!emailAddress) {
      return res.status(400).json({
        success: false,
        error: 'emailAddress is required',
      });
    }

    const result = await processBounce(emailAddress, userId, errorMessage, errorCode, notificationId);

    return res.json({
      success: true,
      action: result,
      message: `Email ${result}`,
    });
  } catch (error) {
    console.error('❌ [BOUNCE] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process bounce',
    });
  }
});

/**
 * GET /api/admin/bounces/stats - Get bounce statistics
 */
router.get('/bounces/stats', async (req, res) => {
  try {
    const stats = await getBounceStats();

    return res.json({
      success: true,
      bounceStats: stats,
    });
  } catch (error) {
    console.error('❌ [BOUNCE STATS] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch bounce stats',
    });
  }
});

export default router;
