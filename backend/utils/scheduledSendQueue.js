// Scheduled Send Queue Processor
// Processes scheduled emails and sends them at the scheduled time

import { getSupabaseAdminClient } from './supabaseAdmin.js';
import { queueEmail } from './email.js';

// Start the scheduled send processor (runs every minute)
function startScheduledSendProcessor(interval = 60000) {
  console.log('⏲️ [SCHEDULED SEND] Processor started, checking every', interval / 1000, 'seconds');

  setInterval(async () => {
    await processScheduledEmails();
  }, interval);
}

// Process all pending scheduled emails
async function processScheduledEmails() {
  try {
    const supabase = getSupabaseAdminClient();

    // Get all pending scheduled sends that are due
    const { data: pendingSchedules, error } = await supabase
      .from('scheduled_send_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('[SCHEDULED SEND PROCESSOR] Error fetching pending:', error);
      return;
    }

    if (!pendingSchedules || pendingSchedules.length === 0) {
      return; // Nothing to process
    }

    console.log(`📅 [SCHEDULED SEND] Found ${pendingSchedules.length} emails due for sending`);

    for (const schedule of pendingSchedules) {
      await processScheduledEmail(schedule);
    }
  } catch (error) {
    console.error('[SCHEDULED SEND PROCESSOR] Error:', error);
  }
}

// Process a single scheduled email
async function processScheduledEmail(schedule) {
  try {
    const supabase = getSupabaseAdminClient();

    // Mark as processing
    await supabase
      .from('scheduled_send_queue')
      .update({ status: 'processing' })
      .eq('id', schedule.id);

    // Get the notification
    const { data: notification, error: notifError } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', schedule.notification_id)
      .single();

    if (notifError || !notification) {
      // Mark as failed
      await supabase
        .from('scheduled_send_queue')
        .update({
          status: 'failed',
          error_message: 'Notification not found',
          processed_at: new Date().toISOString(),
        })
        .eq('id', schedule.id);

      console.error('[SCHEDULED SEND] Notification not found:', schedule.notification_id);
      return;
    }

    // Check if notification is already sending/sent
    if (['sending', 'sent'].includes(notification.status)) {
      await supabase
        .from('scheduled_send_queue')
        .update({
          status: 'cancelled',
          cancelled_reason: 'Notification already sent',
          processed_at: new Date().toISOString(),
        })
        .eq('id', schedule.id);

      console.log('[SCHEDULED SEND] Skipped - notification already sent:', schedule.notification_id);
      return;
    }

    // Get all pending logs for this notification
    const { data: logs, error: logsError } = await supabase
      .from('admin_notification_logs')
      .select('*')
      .eq('notification_id', schedule.notification_id)
      .eq('status', 'pending');

    if (logsError) {
      throw logsError;
    }

    // Queue each email
    let successCount = 0;
    for (const log of logs || []) {
      try {
        // Build email params
        const emailParams = {
          to: log.user_email,
          subject: notification.title,
          html: notification.html_content || notification.message,
          notificationId: notification.id,
          logId: log.id,
          trackingToken: null, // Will be generated if tracking enabled
        };

        // Queue the email
        await queueEmail(emailParams);
        successCount++;
      } catch (err) {
        console.error('[SCHEDULED SEND] Failed to queue email:', err.message);
      }
    }

    // Mark schedule as sent
    await supabase
      .from('scheduled_send_queue')
      .update({
        status: 'sent',
        processed_at: new Date().toISOString(),
        attempt_count: schedule.attempt_count + 1,
      })
      .eq('id', schedule.id);

    // Update notification status
    await supabase
      .from('admin_notifications')
      .update({
        status: 'sending',
        scheduled_status: 'sent_to_queue',
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule.notification_id);

    console.log(`✅ [SCHEDULED SEND] Processed ${successCount} emails for notification: ${schedule.notification_id}`);
  } catch (error) {
    console.error('[SCHEDULED SEND] Error processing scheduled email:', error);

    // Mark as failed and schedule retry
    const supabase = getSupabaseAdminClient();
    const nextRetry = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes

    await supabase
      .from('scheduled_send_queue')
      .update({
        status: 'pending',
        attempt_count: schedule.attempt_count + 1,
        error_message: error.message,
        next_retry_at: nextRetry,
      })
      .eq('id', schedule.id);
  }
}

// Schedule an email to be sent later
async function scheduleEmail(notificationId, scheduledTime, timezone = 'UTC') {
  try {
    const supabase = getSupabaseAdminClient();

    // Create schedule entry
    const { error } = await supabase.from('scheduled_send_queue').insert({
      notification_id: notificationId,
      scheduled_time: scheduledTime,
      scheduled_timezone: timezone,
      status: 'pending',
    });

    if (error) {
      console.error('[SCHEDULED SEND] Failed to schedule:', error);
      return false;
    }

    // Update notification with scheduled status
    await supabase
      .from('admin_notifications')
      .update({
        status: 'scheduled',
        scheduled_for: scheduledTime,
        scheduled_status: 'scheduled',
        schedule_timezone: timezone,
      })
      .eq('id', notificationId);

    console.log(`⏲️ [SCHEDULED SEND] Email scheduled for: ${scheduledTime}`);
    return true;
  } catch (error) {
    console.error('[SCHEDULED SEND] Error scheduling email:', error);
    return false;
  }
}

// Cancel a scheduled email
async function cancelScheduledEmail(scheduleId, reason = 'User cancelled') {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('scheduled_send_queue')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_reason: reason,
      })
      .eq('id', scheduleId);

    if (error) {
      console.error('[SCHEDULED SEND] Failed to cancel:', error);
      return false;
    }

    console.log(`❌ [SCHEDULED SEND] Cancelled schedule: ${scheduleId}`);
    return true;
  } catch (error) {
    console.error('[SCHEDULED SEND] Error cancelling:', error);
    return false;
  }
}

// Get scheduled emails
async function getScheduledEmails(filter = 'pending') {
  try {
    const supabase = getSupabaseAdminClient();

    let query = supabase.from('scheduled_send_queue').select('*');

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query.order('scheduled_time', { ascending: true });

    if (error) {
      console.error('[SCHEDULED SEND] Error fetching schedules:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[SCHEDULED SEND] Error:', error);
    return [];
  }
}

// Reschedule an email
async function rescheduleEmail(scheduleId, newScheduledTime) {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('scheduled_send_queue')
      .update({
        scheduled_time: newScheduledTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId);

    if (error) {
      console.error('[SCHEDULED SEND] Failed to reschedule:', error);
      return false;
    }

    console.log(`📅 [SCHEDULED SEND] Rescheduled to: ${newScheduledTime}`);
    return true;
  } catch (error) {
    console.error('[SCHEDULED SEND] Error rescheduling:', error);
    return false;
  }
}

// Get schedule stats
async function getScheduleStats() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: all } = await supabase
      .from('scheduled_send_queue')
      .select('status', { count: 'exact' });

    const stats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
      total: all?.length || 0,
    };

    all?.forEach(item => {
      stats[item.status]++;
    });

    return stats;
  } catch (error) {
    console.error('[SCHEDULED SEND] Error getting stats:', error);
    return null;
  }
}

export {
  startScheduledSendProcessor,
  processScheduledEmails,
  processScheduledEmail,
  scheduleEmail,
  cancelScheduledEmail,
  getScheduledEmails,
  rescheduleEmail,
  getScheduleStats,
};
