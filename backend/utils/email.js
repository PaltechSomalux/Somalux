import nodemailer from 'nodemailer';

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_LOGO_URL,
  EMAIL_RATE_LIMIT = '30', // emails per hour (default: 30/hour = 1 every 2 minutes)
  EMAIL_USER_2,
  EMAIL_PASS_2,
} = process.env;

// ============================================================
// MULTI-ACCOUNT EMAIL SUPPORT - Load balance across accounts
// ============================================================
let emailAccounts = [];
let currentAccountIndex = 0;

// Initialize email accounts
if (EMAIL_USER && EMAIL_PASS) {
  emailAccounts.push({
    user: EMAIL_USER,
    pass: EMAIL_PASS,
    from: EMAIL_FROM || EMAIL_USER,
    name: 'Account 1',
  });
}

if (EMAIL_USER_2 && EMAIL_PASS_2) {
  emailAccounts.push({
    user: EMAIL_USER_2,
    pass: EMAIL_PASS_2,
    from: `Paltech Support Team <${EMAIL_USER_2}>`,
    name: 'Account 2',
  });
}

// Get next available email account (considers 24h batch limits and Gmail rate limits)
function getNextEmailAccount(skipAccountIndex = -1) {
  if (emailAccounts.length === 0) {
    throw new Error('No email accounts configured');
  }
  
  // Find account with most capacity (fewest emails in 24h window) that isn't rate-limited
  let bestAccountIndex = -1;
  let minEmails = Infinity;
  
  for (let i = 0; i < emailAccounts.length; i++) {
    // Skip if Gmail rate-limited
    const limitState = accountGmailLimitState[i];
    if (limitState.isRateLimited) {
      console.log(`⏭️  [EMAIL ROTATION] Skipping Account ${i + 1} - Gmail rate limited`);
      continue;
    }
    
    // Skip if explicitly requested
    if (i === skipAccountIndex) {
      console.log(`⏭️  [EMAIL ROTATION] Skipping Account ${i + 1} - on failover list`);
      continue;
    }
    
    const count = getEmailsInLast24h(i).length;
    if (count < minEmails) {
      minEmails = count;
      bestAccountIndex = i;
    }
  }
  
  if (bestAccountIndex === -1) {
    // All accounts are either rate-limited or skipped
    // Try to find ANY available account
    for (let i = 0; i < emailAccounts.length; i++) {
      if (!accountGmailLimitState[i].isRateLimited && i !== skipAccountIndex) {
        bestAccountIndex = i;
        break;
      }
    }
  }
  
  if (bestAccountIndex === -1) {
    // All accounts are rate-limited - return the least limited one
    bestAccountIndex = accountGmailLimitState.reduce((best, curr, i) => {
      return curr.consecutiveErrors < accountGmailLimitState[best].consecutiveErrors ? i : best;
    }, 0);
    console.warn(`⚠️  [EMAIL ROTATION] All accounts rate-limited! Using Account ${bestAccountIndex + 1}`);
  }
  
  const account = emailAccounts[bestAccountIndex];
  const count = getEmailsInLast24h(bestAccountIndex).length;
  console.log(`🔄 [EMAIL ROTATION] Selected Account ${bestAccountIndex + 1}: ${account.user} (${count}/${EMAILS_PER_ACCOUNT_PER_24H} in 24h)`);
  return { account, accountIndex: bestAccountIndex };
}

// Get current account without rotating
function getCurrentEmailAccount() {
  if (emailAccounts.length === 0) {
    throw new Error('No email accounts configured');
  }
  return emailAccounts[currentAccountIndex];
}

// Create transporters for each account
const transporters = emailAccounts.map(account =>
  nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: EMAIL_PORT ? Number(EMAIL_PORT) : 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  })
);

// ============================================================
// 24-HOUR BATCH RATE LIMITING - Fair distribution system
// ============================================================
const EMAILS_PER_HOUR = parseInt(EMAIL_RATE_LIMIT, 10); // Per-account rate
const DELAY_BETWEEN_EMAILS = (60 * 60 * 1000) / EMAILS_PER_HOUR; // milliseconds
const EMAILS_PER_ACCOUNT_PER_24H = 250; // Gmail free limit per account
const EMAILS_BATCH_LIMIT = 500; // Total across both accounts per 24h

const emailQueue = [];
let isProcessingQueue = false;
let lastEmailTime = 0;

// Track send history for each account (timestamps of sent emails)
const accountSendHistory = emailAccounts.map(() => []);

// Track Gmail rate limit state for each account (550-5.4.5 errors)
const accountGmailLimitState = emailAccounts.map(() => ({
  isRateLimited: false,
  resetTime: null,
  consecutiveErrors: 0,
}));

/**
 * Get emails sent by account in last 24 hours
 */
function getEmailsInLast24h(accountIndex) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return accountSendHistory[accountIndex].filter(timestamp => (now - timestamp) < day);
}

/**
 * Calculate delay needed before we can send (based on 24h window usage)
 * Returns: { canSendNow: boolean, delayMs: number, reason: string }
 */
function calculateDelay(accountIndex) {
  const emails24h = getEmailsInLast24h(accountIndex);
  const limit = EMAILS_PER_ACCOUNT_PER_24H;
  
  if (emails24h.length < limit) {
    return { canSendNow: true, delayMs: 0, reason: 'Under 24h limit' };
  }
  
  // At or over limit - find when oldest email can be dropped (24h window)
  const oldestEmail = Math.min(...emails24h);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const delayUntilReset = (oldestEmail + day) - now;
  
  const hoursSinceOldest = (now - oldestEmail) / (60 * 60 * 1000);
  const reasonStr = `Account at ${emails24h.length}/${limit} sent in last 24h (oldest ${Math.round(hoursSinceOldest)}h ago)`;
  
  return {
    canSendNow: false,
    delayMs: Math.max(0, delayUntilReset),
    reason: reasonStr
  };
}

/**
 * Check if error is a rate limit error (Gmail blocking)
 */
function isRateLimitError(error) {
  const isLimit = error?.response?.includes('5.4.5') || error?.code === 'EENVELOPE';
  if (isLimit) {
    console.warn(`⚠️  [EMAIL SEND] Gmail rate limit detected: ${error?.message}`);
  }
  return isLimit;
}

/**
 * Rate-limited email queue processor with fair 24-hour distribution and failover
 */
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (emailQueue.length > 0) {
    const emailTask = emailQueue[0]; // Peek at first email
    let sent = false;
    let skippedAccounts = [];
    
    // Try each account until one succeeds
    for (let attemptNum = 0; attemptNum < emailAccounts.length && !sent; attemptNum++) {
      // Get best account from remaining options
      const { account, accountIndex } = getNextEmailAccount(
        skippedAccounts.length > 0 ? skippedAccounts[skippedAccounts.length - 1] : -1
      );
      
      // Check if this account can send now (batch limit check)
      const delayInfo = calculateDelay(accountIndex);
      
      if (!delayInfo.canSendNow) {
        console.log(`⏳ [EMAIL BATCH LIMIT] ${delayInfo.reason}`);
        console.log(`⏳ [EMAIL BATCH LIMIT] Waiting ${Math.round(delayInfo.delayMs / 1000)}s before next send...`);
        
        // Wait until we can send again
        await new Promise((resolve) => setTimeout(resolve, Math.min(delayInfo.delayMs + 5000, 10000))); // Max 10s wait
        
        // Don't mark as skipped - try same account again after delay
        attemptNum = -1; // Reset to try again
        continue;
      }
      
      try {
        console.log(`📧 [EMAIL SEND] Attempting via Account ${accountIndex + 1}: ${account.user}`);
        const sendResult = await transporters[accountIndex].sendMail({
          ...emailTask.params,
          from: account.from,
        });
        
        // Success! Record this send
        accountSendHistory[accountIndex].push(Date.now());
        const emails24h = getEmailsInLast24h(accountIndex);
        
        // Remove from queue
        emailQueue.shift();
        
        const result = {
          ...sendResult,
          sendingAccount: account.user,
          sendingAccountName: account.name,
        };
        
        emailTask.resolve(result);
        lastEmailTime = Date.now();
        sent = true;
        
        console.log(`✅ [EMAIL SEND] Sent via Account ${accountIndex + 1} (${emails24h.length}/${EMAILS_PER_ACCOUNT_PER_24H} in 24h)`);
        
        // Brief delay between emails to spread load
        const minDelay = (60 * 60 * 1000) / EMAILS_PER_HOUR;
        await new Promise((resolve) => setTimeout(resolve, minDelay / 2)); // Half delay between emails of different accounts
        
      } catch (error) {
        console.error(`❌ [EMAIL SEND] Error: ${error.message.split('\n')[0]}`);
        
        if (isRateLimitError(error)) {
          // Gmail rejected this account
          const state = accountGmailLimitState[accountIndex];
          state.consecutiveErrors++;
          state.isRateLimited = true;
          state.resetTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
          
          console.warn(`⚠️  [EMAIL ROTATION] Account ${accountIndex + 1} hit Gmail rate limit! Will skip for 24h`);
          skippedAccounts.push(accountIndex);
          
          // Try next account
          console.log(`🔄 [EMAIL ROTATION] Trying next available account...`);
          continue;
        } else {
          // Non-rate-limit error - reject this email
          emailQueue.shift();
          emailTask.reject(error);
          sent = true;
          console.log(`❌ [EMAIL SEND] Non-recoverable error, rejecting email`);
        }
      }
    }
    
    // If we exhausted all accounts without sending
    if (!sent) {
      console.error(`❌ [EMAIL QUEUE] All accounts failed! Pausing queue...`);
      isProcessingQueue = false;
      
      // Wait 5 minutes before retrying
      await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
      isProcessingQueue = true;
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Queue an email for fair 24-hour distribution
 */
function queueEmail(emailParams) {
  return new Promise((resolve, reject) => {
    const emailTask = {
      params: emailParams,
      resolve,
      reject,
      queuedAt: Date.now(),
    };
    
    emailQueue.push(emailTask);
    
    // Calculate total emails queued (this batch + future batches)
    const totalQueued = emailQueue.length;
    const emailsInUse = accountSendHistory.reduce((sum, acc) => sum + getEmailsInLast24h(accountSendHistory.indexOf(acc)).length, 0);
    
    console.log(`📧 [EMAIL QUEUE] Email queued (${totalQueued} in queue, ${emailsInUse} sent in 24h)`);
    
    // Start processing queue immediately (non-blocking)
    processEmailQueue().catch((e) => {
      console.error('❌ [EMAIL QUEUE] Processing error:', e.message);
    });
  });
}

export { queueEmail };

// Check account rate limits every 5 minutes to see if they've reset
setInterval(() => {
  const now = Date.now();
  let anyReset = false;
  
  accountGmailLimitState.forEach((state, index) => {
    if (state.isRateLimited && state.resetTime && now >= state.resetTime) {
      state.isRateLimited = false;
      state.consecutiveErrors = 0;
      state.resetTime = null;
      anyReset = true;
      console.log(`✅ [EMAIL ROTATION] Account ${index + 1} Gmail rate limit has reset!`);
    }
  });
  
  if (anyReset && emailQueue.length > 0) {
    console.log(`🔄 [EMAIL ROTATION] Account(s) reset! Retrying queued emails...`);
    processEmailQueue().catch((e) => {
      console.error('❌ [EMAIL QUEUE] Error processing queue:', e.message);
    });
  }
}, 5 * 60 * 1000);

// Test email configuration on startup
(async () => {
  try {
    console.log('📧 [EMAIL CONFIG] Testing email configuration...');
    console.log('📧 [EMAIL CONFIG] Host:', EMAIL_HOST || 'smtp.gmail.com');
    console.log('📧 [EMAIL CONFIG] Port:', EMAIL_PORT ? Number(EMAIL_PORT) : 587);
    console.log(`📧 [EMAIL CONFIG] Total accounts configured: ${emailAccounts.length}`);
    
    if (emailAccounts.length === 0) {
      console.warn('⚠️ [EMAIL CONFIG] No email accounts configured. Email sending will fail.');
      console.warn('⚠️ [EMAIL CONFIG] Set EMAIL_USER and EMAIL_PASS in .env');
    } else {
      for (let i = 0; i < emailAccounts.length; i++) {
        const account = emailAccounts[i];
        try {
          console.log(`📧 [EMAIL CONFIG] Verifying ${account.name} (${account.user})...`);
          await transporters[i].verify();
          console.log(`✅ [EMAIL CONFIG] ${account.name} connection verified successfully!`);
        } catch (error) {
          console.error(`❌ [EMAIL CONFIG] ${account.name} connection failed:`, error.message);
        }
      }
      
      if (emailAccounts.length > 1) {
        console.log(`🔄 [EMAIL CONFIG] Load balancing enabled across ${emailAccounts.length} accounts`);
        console.log(`📊 [EMAIL CONFIG] Batch limit: ${EMAILS_BATCH_LIMIT} emails per 24h (${EMAILS_PER_ACCOUNT_PER_24H} per account)`);
        console.log(`📊 [EMAIL CONFIG] Emails fairly distributed throughout 24h window`);
      }
    }
  } catch (error) {
    console.error('❌ [EMAIL CONFIG] Configuration check failed:', error.message);
    console.error('❌ [EMAIL CONFIG] Please check your email configuration in .env file');
  }
})();

export function buildBrandedEmailHtml({ title, body }) {
  const safeTitle = title || 'Somalux';
  const safeBody = body || '';
  const logoUrl = EMAIL_LOGO_URL || '';

  // If caller passes a ready-made HTML block (starts with '<'), inject it
  // directly. Otherwise, convert plain text/newlines into paragraph tags.
  const isRawHtml = typeof safeBody === 'string' && safeBody.trim().startsWith('<');
  const bodyHtml = isRawHtml
    ? safeBody
    : safeBody
        .split('\n')
        .map((line) => `<p style="margin: 0 0 12px; color: #333333; font-size: 14px; line-height: 1.6;">${line}</p>`)
        .join('');

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${safeTitle}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f5fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f5fb; padding:24px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(15,23,42,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a,#1e293b); padding:20px 24px; text-align:left;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="vertical-align:middle;">
                        ${logoUrl
                          ? `<img src="${logoUrl}" alt="Paltech Somalux" style="max-height:40px; display:block;" />`
                          : `<span style="color:#e5e7eb; font-size:18px; font-weight:600;">Paltech Somalux</span>`}
                      </td>
                      <td style="vertical-align:middle; text-align:right;">
                        <span style="color:#9ca3af; font-size:11px; letter-spacing:0.12em; text-transform:uppercase;">Paltech Somalux Update</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 24px 8px;">
                  <h1 style="margin:0 0 12px; font-size:20px; line-height:1.3; color:#111827;">${safeTitle}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px;">
                  ${bodyHtml}
                  <p style="margin:24px 0 8px; color:#6b7280; font-size:13px;">Warm regards,</p>
                  <p style="margin:0 0 4px; color:#111827; font-size:14px; font-weight:600;">Somalux</p>
                  <p style="margin:0; color:#9ca3af; font-size:12px;">Your knowledge platform</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px 20px; border-top:1px solid #e5e7eb; background-color:#f9fafb;">
                  <p style="margin:0 0 4px; color:#9ca3af; font-size:11px;">You received this email because you are connected with Somalux.</p>
                  <p style="margin:0; color:#d1d5db; font-size:10px;">&copy; ${new Date().getFullYear()} Somalux. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export async function sendEmail({ to, subject, text, html }) {
  console.log('📧 [EMAIL UTILITY] sendEmail called');
  console.log('📧 [EMAIL UTILITY] To:', to);
  console.log('📧 [EMAIL UTILITY] Subject:', subject);
  
  if (emailAccounts.length === 0) {
    console.error('❌ [EMAIL UTILITY] No email accounts configured!');
    console.error('❌ [EMAIL UTILITY] Add EMAIL_USER and EMAIL_PASS to .env');
    throw new Error('Email is not configured on the server (missing EMAIL_USER/EMAIL_PASS).');
  }

  console.log(`📧 [EMAIL UTILITY] Using load-balanced rotation (${emailAccounts.length} account(s) available)`);
  console.log(`📧 [EMAIL UTILITY] Queueing email via rate-limited SMTP (${emailQueue.length + 1} in queue)...`);

  try {
    // Use rate-limited queue instead of sending directly
    const info = await queueEmail({
      to,
      subject,
      text,
      html,
    });

    console.log('✅ [EMAIL UTILITY] Email queued successfully!');
    return info;
  } catch (error) {
    if (error?.code === 'ALL_ACCOUNTS_RATE_LIMITED') {
      const retryTime = new Date(error.retryTime).toLocaleString();
      console.warn(`⏳ [EMAIL UTILITY] All accounts hit daily limit - queued for automatic retry on ${retryTime}`);
      // Return queued status - not an error
      return { queued: true, to, subject, retryTime: error.retryTime, status: 'pending_retry' };
    }
    
    console.error('❌ [EMAIL UTILITY] Failed to send email!');
    console.error('❌ [EMAIL UTILITY] Error:', error.message);
    throw error;
  }
}

/**
 * Send quota approval email to landlord
 * @deprecated - Rental features removed
 */
export async function sendQuotaApprovalEmail() {
  throw new Error('Rental features have been removed from the system');
}

/**
 * Send quota rejection email to landlord
 * @deprecated - Rental features removed
 */
export async function sendQuotaRejectionEmail() {
  throw new Error('Rental features have been removed from the system');
}

/**
 * Send listing approval email to landlord
 * @deprecated - Rental features removed
 */
export async function sendListingApprovalEmail() {
  throw new Error('Rental features have been removed from the system');
}

/**
 * Send listing rejection email to landlord
 * @deprecated - Rental features removed
 */
export async function sendListingRejectionEmail() {
  throw new Error('Rental features have been removed from the system');
}

/**
 * Send booking approval email to student
 * @deprecated - Rental features removed
 */
export async function sendBookingApprovalEmail() {
  throw new Error('Rental features have been removed from the system');
}

/**
 * Send booking rejection email to student
 * @deprecated - Rental features removed
 */
export async function sendBookingRejectionEmail() {
  throw new Error('Rental features have been removed from the system');
}

/**
 * Send new booking request email to landlord
 * @deprecated - Rental features removed
 */
export async function sendNewBookingRequestEmail() {
  throw new Error('Rental features have been removed from the system');
}
