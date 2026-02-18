// Bounce Detection and Invalid Email Management
// Handles bounce detection, tracking invalid emails, and automatic cleanup

import { getSupabaseAdminClient } from './supabaseAdmin.js';

// Check if email is already marked as invalid
async function isEmailInvalid(emailAddress) {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: result } = await supabase
      .from('invalid_email_addresses')
      .select('*')
      .eq('email_address', emailAddress)
      .eq('status', 'active')
      .single();

    return !!result;
  } catch (error) {
    // Not found is not an error
    if (error.code === 'PGRST116') {
      return false;
    }
    console.error('[BOUNCE CHECK] Error checking email:', error);
    return false;
  }
}

// Detect bounce type from SMTP error
function detectBounceType(errorMessage, errorCode) {
  const msg = (errorMessage || '').toLowerCase();
  const code = (errorCode || '').toLowerCase();

  // Hard bounces - permanent failures
  if (msg.includes('550') || msg.includes('invalid user') || msg.includes('user unknown')) {
    return 'hard_bounce';
  }
  if (msg.includes('invalid address') || msg.includes('no such user')) {
    return 'hard_bounce';
  }
  if (msg.includes('address rejected') || msg.includes('bad destination')) {
    return 'hard_bounce';
  }

  // Soft bounces - temporary failures
  if (msg.includes('421') || msg.includes('try again later')) {
    return 'soft_bounce';
  }
  if (msg.includes('452') || msg.includes('insufficient storage')) {
    return 'soft_bounce';
  }
  if (msg.includes('timeout')) {
    return 'soft_bounce';
  }

  // Complaints/abuse
  if (msg.includes('complaint') || msg.includes('abuse')) {
    return 'complaint';
  }

  // Default to soft bounce (might recover)
  return 'soft_bounce';
}

// Record bounce for an email
async function recordBounce(emailAddress, userId, bounceType, errorMessage, errorCode, notificationId) {
  try {
    const supabase = getSupabaseAdminClient();
    const reason = errorMessage || 'SMTP error';

    // Check if already exists
    const { data: existing } = await supabase
      .from('invalid_email_addresses')
      .select('*')
      .eq('email_address', emailAddress)
      .single()
      .catch(() => ({ data: null }));

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('invalid_email_addresses')
        .update({
          total_bounces: (existing.total_bounces || 0) + 1,
          last_bounce_at: new Date(),
          bounce_type: bounceType, // Update to latest bounce type
          smtp_error_code: errorCode,
          smtp_error_message: errorMessage,
          updated_at: new Date(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[BOUNCE HANDLER] Failed to update bounce record:', error);
        return false;
      }

      console.log(`⚠️  [BOUNCE HANDLER] Updated bounce for ${emailAddress} (${bounceType})`);
      return true;
    } else {
      // Create new record
      const { error } = await supabase
        .from('invalid_email_addresses')
        .insert({
          email_address: emailAddress,
          user_id: userId,
          bounce_type: bounceType,
          reason: reason,
          notification_id: notificationId,
          first_bounce_at: new Date(),
          last_bounce_at: new Date(),
          total_bounces: 1,
          smtp_error_code: errorCode,
          smtp_error_message: errorMessage,
          status: 'active',
        });

      if (error) {
        console.error('[BOUNCE HANDLER] Failed to create bounce record:', error);
        return false;
      }

      console.log(`❌ [BOUNCE HANDLER] Recorded ${bounceType} for: ${emailAddress}`);
      return true;
    }
  } catch (error) {
    console.error('[BOUNCE HANDLER] Error recording bounce:', error);
    return false;
  }
}

// Remove email from future sends (mark as invalid)
async function removeEmailFromSends(emailAddress, reason = 'hard bounce') {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('invalid_email_addresses')
      .update({
        status: 'archived',
        marked_for_removal_at: new Date(),
        marked_for_removal_reason: reason,
        updated_at: new Date(),
      })
      .eq('email_address', emailAddress)
      .eq('status', 'active');

    if (error) {
      console.error('[BOUNCE HANDLER] Failed to remove email:', error);
      return false;
    }

    console.log(`🚫 [BOUNCE HANDLER] Removed from sends: ${emailAddress}`);
    return true;
  } catch (error) {
    console.error('[BOUNCE HANDLER] Error removing email:', error);
    return false;
  }
}

// Process bounce - check if it's hard or soft, and handle accordingly
async function processBounce(emailAddress, userId, errorMessage, errorCode, notificationId) {
  try {
    // Detect bounce type
    const bounceType = detectBounceType(errorMessage, errorCode);

    // Record the bounce
    await recordBounce(emailAddress, userId, bounceType, errorMessage, errorCode, notificationId);

    // If hard bounce, immediately remove
    if (bounceType === 'hard_bounce') {
      await removeEmailFromSends(emailAddress, 'hard_bounce');
      return 'removed';
    }

    // If complaint, remove
    if (bounceType === 'complaint') {
      await removeEmailFromSends(emailAddress, 'complaint');
      return 'removed';
    }

    // If soft bounce, track but don't remove (might work later)
    return 'tracked';
  } catch (error) {
    console.error('[BOUNCE HANDLER] Error processing bounce:', error);
    return 'error';
  }
}

// Get bounce statistics
async function getBounceStats() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: bounces } = await supabase
      .from('invalid_email_addresses')
      .select('bounce_type, status', { count: 'exact' });

    const stats = {
      total: 0,
      hardBounces: 0,
      softBounces: 0,
      complaints: 0,
      active: 0,
      archived: 0,
    };

    bounces?.forEach(b => {
      stats.total++;
      if (b.bounce_type === 'hard_bounce') stats.hardBounces++;
      if (b.bounce_type === 'soft_bounce') stats.softBounces++;
      if (b.bounce_type === 'complaint') stats.complaints++;
      if (b.status === 'active') stats.active++;
      if (b.status === 'archived') stats.archived++;
    });

    return stats;
  } catch (error) {
    console.error('[BOUNCE HANDLER] Error getting stats:', error);
    return null;
  }
}

// Get all hard-bounced emails (ones that should be removed)
async function getHardBouncedEmails() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: hardBounces } = await supabase
      .from('invalid_email_addresses')
      .select('email_address, bounce_type, total_bounces')
      .eq('bounce_type', 'hard_bounce')
      .eq('status', 'active');

    return hardBounces || [];
  } catch (error) {
    console.error('[BOUNCE HANDLER] Error getting hard bounces:', error);
    return [];
  }
}

// Restore email (after manual verification)
async function restoreEmail(emailAddress) {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('invalid_email_addresses')
      .update({
        status: 'active',
        marked_for_removal_at: null,
        marked_for_removal_reason: null,
        total_bounces: 0,
        first_bounce_at: null,
        last_bounce_at: null,
        updated_at: new Date(),
      })
      .eq('email_address', emailAddress);

    if (error) {
      console.error('[BOUNCE HANDLER] Failed to restore email:', error);
      return false;
    }

    console.log(`✅ [BOUNCE HANDLER] Restored email: ${emailAddress}`);
    return true;
  } catch (error) {
    console.error('[BOUNCE HANDLER] Error restoring email:', error);
    return false;
  }
}

// Auto-cleanup hard bounces (mark as archived after 3 bounces)
async function autoCleanupHardBounces() {
  try {
    const supabase = getSupabaseAdminClient();

    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc('mark_hard_bounced_emails_invalid');

    if (error) {
      console.error('[BOUNCE HANDLER] Auto-cleanup failed:', error);
      return 0;
    }

    const markedCount = data[0]?.marked_count || 0;
    if (markedCount > 0) {
      console.log(`🧹 [BOUNCE HANDLER] Auto-cleanup marked ${markedCount} emails as invalid`);
    }

    return markedCount;
  } catch (error) {
    console.error('[BOUNCE HANDLER] Error in auto-cleanup:', error);
    return 0;
  }
}

// Check if should skip sending to this email
async function shouldSkipSending(emailAddress) {
  try {
    const supabase = getSupabaseAdminClient();

    const { data } = await supabase
      .from('invalid_email_addresses')
      .select('status')
      .eq('email_address', emailAddress)
      .eq('bounce_type', 'hard_bounce')
      .single()
      .catch(() => ({ data: null }));

    if (data && data.status === 'archived') {
      return true; // Skip this email
    }

    return false;
  } catch (error) {
    return false;
  }
}

export {
  isEmailInvalid,
  detectBounceType,
  recordBounce,
  removeEmailFromSends,
  processBounce,
  getBounceStats,
  getHardBouncedEmails,
  restoreEmail,
  autoCleanupHardBounces,
  shouldSkipSending,
};
