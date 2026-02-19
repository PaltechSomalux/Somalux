import 'dotenv/config';
import express from "express";
import fs from 'fs';
import crypto from 'crypto';
import cors from "cors";
import { sendEmail, buildBrandedEmailHtml } from './utils/email.js';
import { getAdminEmails } from './routes/adminNotifications.js';
import { WebSocketServer } from "ws";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import https from "https";
import http from "http";
import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import puppeteer from 'puppeteer';
import {
  getReadingStats,
  getReadingActivity,
  createReadingSession,
  getReadingGoals,
  createReadingGoal,
  updateReadingGoal,
  getAchievements,
  checkAchievements,
  getLeaderboard
} from './routes/readingAnalytics.js';
import { sendSignOutReasonEmail } from './routes/adminNotifications.js';
import adsApiV2 from './routes/adsApiV2.js';
import { createRankingRoutes } from './routes/rankings.js';
import featureFlagsRouter from './routes/featureFlags.js';
import pastPapersDownloaderRoutes from './routes/pastPapersDownloaderRoutes.js';
import pastPaperExtractRoute from './routes/pastPaperExtractRoute.js';
import firstPageExtractRoute from './routes/firstPageExtractRoute.js';
import emailNotificationsRouter from './routes/emailNotifications.js';
import { startScheduledSendProcessor } from './utils/scheduledSendQueue.js';
import { recordFirstLogin } from './utils/firstLoginTracking.js';
import { initializeChatMeFirebase, setupChatMeWebSocket, setupChatMeFCMRoutes } from './chatme-integration.js';
import chatmeMessagesRouter from './routes/chatmeMessages.js';


// Express Setup MUST be before any app.use/app.post calls
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public')); // Serve static files from public folder (for ads, etc)

// Feature Flags Routes
app.use(featureFlagsRouter);

// Email Notifications Routes (Admin sending emails to users)
app.use('/api/admin', emailNotificationsRouter);

// Past Papers Downloader Routes
app.use('/api/elib/pastpapers', pastPapersDownloaderRoutes);

// Past Papers Extraction Routes (OCR + Direct Text)
app.use('/api/past-papers', pastPaperExtractRoute);

// First Page Academic Header Extraction Routes (NEW - High Accuracy)
app.use('/api/past-papers', firstPageExtractRoute);

// ChatMe Messaging Routes
app.use('/api', chatmeMessagesRouter);

// FCM topic management - DISABLED (Firebase not used)
app.post('/subscribe-topic', async (req, res) => {
  return res.status(503).json({ error: "FCM not available" });
});

// Log search events from frontend (books, categories, authors, past_papers)
app.post('/api/elib/search-events', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase not configured on server' });
  }

  try {
    const body = req.body || {};
    const {
      scope,
      queryText,
      userId,
      categoryId,
      bookId,
      authorName,
      pastPaperId,
      resultsCount,
    } = body;

    if (!scope || !queryText || typeof queryText !== 'string' || queryText.trim().length < 1) {
      return res.status(400).json({ error: 'scope and non-empty queryText are required' });
    }

    const payload = {
      search_query: queryText.trim(),
      search_type: scope,
      results_count: typeof resultsCount === 'number' ? resultsCount : null,
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { error } = await supabaseAdmin.from('search_events').insert(payload);
    if (error) {
      console.warn('search_events insert error:', error);
      // Don't fail the request if search_events table doesn't exist (graceful degradation)
      // Just log a warning and return success
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('search_events table may not exist, but continuing...');
        return res.json({ ok: true, warning: 'search_events table not available' });
      }
      // For other errors, still return success but log the issue
      return res.json({ ok: true, warning: error.message });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('search_events insert exception:', e);
    res.status(500).json({ error: e.message || 'Failed to log search event' });
  }
});

app.post('/unsubscribe-topic', async (req, res) => {
  return res.status(503).json({ error: "FCM not available" });
});

// Manual test email endpoint (Gmail / SMTP via utils/email.js)
app.post('/api/utils/send-test-email', async (req, res) => {
  try {
    const { to, subject, message } = req.body || {};
    if (!to) {
      return res.status(400).json({ error: 'Missing "to" address' });
    }

    const emailSubject = subject || 'Campus Life | Paltech update';
    const bodyText = message || 'This is a styled test email from Campus Life | Paltech.';
    const html = buildBrandedEmailHtml({
      title: emailSubject,
      body: bodyText,
    });

    await sendEmail({
      to,
      subject: emailSubject,
      text: bodyText,
      html,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('Email send failed:', e);
    res.status(500).json({ error: e.message || 'Failed to send email' });
  }
});

// ============================================================
// USER SESSION TRACKING ENDPOINTS
// ============================================================

// Record user login - optimized for performance
app.post('/api/user/session/login', async (req, res) => {
  try {
    const { userId, ipAddress, userAgent, deviceType } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Fire-and-forget profile update (non-blocking)
    supabaseAdmin
      .from('profiles')
      .update({
        last_login: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .catch(e => console.warn('Failed to update profile on login:', e?.message));

    // Record session in user_sessions table (non-blocking)
    supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: userId,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        device_type: deviceType || 'unknown'
      })
      .catch(e => console.warn('Failed to record user session:', e?.message));

    // Record first login (non-blocking) - NEW FEATURE
    // This only creates a record on the very first login, subsequent logins are ignored
    recordFirstLogin(userId, supabaseAdmin, req)
      .catch(e => console.warn('Failed to record first login:', e?.message));

    // Return immediately without waiting
    res.json({ ok: true });
  } catch (e) {
    console.error('Error recording login:', e);
    res.status(500).json({ error: e.message || 'Failed to record login' });
  }
});

// Record user logout - optimized for performance
app.post('/api/user/session/logout', async (req, res) => {
  try {
    const { userId, sessionId } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update profiles table with last_active_at (non-blocking)
    supabaseAdmin
      .from('profiles')
      .update({
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId)
      .catch(e => console.warn('Failed to update profile on logout:', e?.message));

    // Update session record with logout time if sessionId provided (non-blocking)
    if (sessionId) {
      supabaseAdmin
        .from('user_sessions')
        .update({
          logout_time: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .catch(e => console.warn('Failed to record logout:', e?.message));
    }

    // Return immediately without waiting
    res.json({ ok: true });
  } catch (e) {
    console.error('Error recording logout:', e);
    res.status(500).json({ error: e.message || 'Failed to record logout' });
  }
});

// Track user activity - updates last_active_at when user interacts with app
app.post('/api/user/activity', async (req, res) => {
  try {
    const { userId } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update profiles table with current timestamp
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating activity:', error?.message);
      return res.status(500).json({ error: error?.message || 'Failed to update activity' });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Error in activity tracking:', e);
    res.status(500).json({ error: e.message || 'Failed to track activity' });
  }
});

// Get user's first login information
app.get('/api/user/first-login-info', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('first_login_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Not found is not an error in this case
      if (error.code === 'PGRST116') {
        return res.json({ data: null, message: 'No first login record found' });
      }
      console.error('Error fetching first login info:', error?.message);
      return res.status(500).json({ error: error?.message || 'Failed to fetch first login info' });
    }

    res.json({ data });
  } catch (e) {
    console.error('Error in first login info endpoint:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch first login info' });
  }
});

// Get first login statistics (admin only)
app.get('/api/admin/first-login-statistics', async (req, res) => {
  try {
    // Verify user is admin (optional - add proper auth check if needed)
    
    // Total first logins recorded
    const { count: totalRecords } = await supabaseAdmin
      .from('first_login_tracking')
      .select('*', { count: 'exact', head: true });

    // Device type breakdown
    const { data: allRecords } = await supabaseAdmin
      .from('first_login_tracking')
      .select('device_type, browser, operating_system, first_login_date')
      .order('first_login_date', { ascending: false })
      .limit(10000); // Get recent records

    const deviceBreakdown = {};
    const browserBreakdown = {};
    const osBreakdown = {};
    
    allRecords?.forEach(record => {
      if (record.device_type) {
        deviceBreakdown[record.device_type] = (deviceBreakdown[record.device_type] || 0) + 1;
      }
      if (record.browser) {
        browserBreakdown[record.browser] = (browserBreakdown[record.browser] || 0) + 1;
      }
      if (record.operating_system) {
        osBreakdown[record.operating_system] = (osBreakdown[record.operating_system] || 0) + 1;
      }
    });

    // First logins by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentLogins, error: dateError } = await supabaseAdmin
      .from('first_login_tracking')
      .select('first_login_date')
      .gte('first_login_date', thirtyDaysAgo.toISOString().split('T')[0]);

    const dateBreakdown = {};
    recentLogins?.forEach(record => {
      const date = record.first_login_date;
      dateBreakdown[date] = (dateBreakdown[date] || 0) + 1;
    });

    res.json({
      total_first_logins: totalRecords || 0,
      device_breakdown: deviceBreakdown,
      browser_breakdown: browserBreakdown,
      os_breakdown: osBreakdown,
      recent_logins_30_days: recentLogins?.length || 0,
      logins_by_date: dateBreakdown
    });
  } catch (e) {
    console.error('Error in first login statistics endpoint:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch statistics' });
  }
});

// Get all authenticated users with detailed status
app.get('/api/admin/authenticated-users', async (req, res) => {
  try {
    console.log('[authenticated-users] Endpoint called');

    // Fetch all profiles with pagination (handle 1000+ users)
    let allProfiles = [];
    let pageSize = 1000;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .range(from, to);

      if (profilesError) {
        console.error('[authenticated-users] Error fetching profiles on page', page, ':', profilesError);
        throw profilesError;
      }

      if (profiles && profiles.length > 0) {
        allProfiles = allProfiles.concat(profiles);
      }

      hasMore = profiles && profiles.length === pageSize;
      page++;
    }

    console.log('[authenticated-users] Total profiles fetched with pagination:', allProfiles.length);

    // Use profiles as the authoritative source of all users
    // The profiles table contains all registered users from auth
    let authUsers = [];
    try {
      // Map profiles to auth user format for consistency
      authUsers = (allProfiles || []).map(p => ({
        id: p.id,
        email: p.email,
        created_at: p.created_at,
        user_metadata: { 
          full_name: p.full_name, 
          avatar_url: p.avatar_url 
        }
      }));
      console.log('[authenticated-users] Using profiles as source, total auth users:', authUsers.length);
    } catch (err) {
      console.error('[authenticated-users] Error mapping profiles:', err?.message || err);
      authUsers = [];
    }

    // Get the latest session for each user
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('user_sessions')
      .select('user_id, login_time, logout_time, session_duration_minutes, device_type')
      .order('login_time', { ascending: false });

    if (sessionsError) console.warn('[authenticated-users] Failed to fetch sessions:', sessionsError);

    // Create a map of latest sessions per user
    const latestSessionMap = new Map();
    (sessions || []).forEach(session => {
      if (!latestSessionMap.has(session.user_id)) {
        latestSessionMap.set(session.user_id, session);
      }
    });

    // Create a map of existing profiles by user_id
    const profileMap = new Map((allProfiles || []).map(p => [p.id, p]));

    // Enrich auth users with profile and session data
    const enrichedUsers = (authUsers || []).map(authUser => {
      const profile = profileMap.get(authUser.id) || {};
      const latestSession = latestSessionMap.get(authUser.id);
      
      const now = Date.now();
      const lastActiveTime = profile.last_active_at 
        ? new Date(profile.last_active_at).getTime()
        : authUser.created_at ? new Date(authUser.created_at).getTime()
        : now;
      const minutesAgo = (now - lastActiveTime) / (1000 * 60);
      
      // Determine online/offline status (online if active in last 5 minutes)
      const isOnline = minutesAgo <= 5;
      const status = profile.deactivated_at ? 'signed_out' : (isOnline ? 'online' : 'offline');

      // Format last seen
      let lastSeen = null;
      if (minutesAgo < 1) {
        lastSeen = 'now';
      } else if (minutesAgo < 60) {
        lastSeen = `${Math.round(minutesAgo)}m ago`;
      } else if (minutesAgo < 1440) {
        lastSeen = `${Math.round(minutesAgo / 60)}h ago`;
      } else {
        lastSeen = `${Math.round(minutesAgo / 1440)}d ago`;
      }

      return {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || profile.full_name || authUser.email?.split('@')[0] || 'Unknown',
        display_name: authUser.user_metadata?.full_name || profile.full_name || authUser.email?.split('@')[0] || 'Unknown',
        avatar_url: authUser.user_metadata?.avatar_url || profile.avatar_url || null,
        role: profile.role || 'viewer',
        subscription_tier: profile.subscription_tier || 'basic',
        subscription_started_at: profile.subscription_started_at || null,
        subscription_expires_at: profile.subscription_expires_at || null,
        is_active: profile.is_active !== false,
        created_at: authUser.created_at,
        last_active_at: profile.last_active_at,
        last_login: profile.last_login,
        total_logins: profile.total_logins || 0,
        status,
        lastSeen,
        lastSession: latestSession ? {
          loginTime: latestSession.login_time,
          logoutTime: latestSession.logout_time,
          durationMinutes: latestSession.session_duration_minutes,
          deviceType: latestSession.device_type
        } : null
      };
    });

    console.log('[authenticated-users] Returning', enrichedUsers.length, 'enriched users');
    res.json({ ok: true, users: enrichedUsers });
  } catch (e) {
    console.error('[authenticated-users] Error:', e?.message || e);
    res.status(500).json({ error: e.message || 'Failed to fetch users' });
  }
});

// Sign-out reason notification endpoint - optimized (non-blocking)
app.post('/api/user/signout-feedback', async (req, res) => {
  try {
    const { userEmail, userName, signOutReason } = req.body || {};

    if (!signOutReason || !signOutReason.trim()) {
      // No reason provided, just return success immediately
      return res.json({ ok: true, sent: false, reason: 'No reason provided' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Missing user email' });
    }

    // Return success immediately (fire-and-forget pattern)
    res.json({ ok: true, sent: true });

    // Send email asynchronously in the background (non-blocking)
    (async () => {
      try {
        await sendSignOutReasonEmail({
          userEmail,
          userName,
          signOutReason
        });
      } catch (e) {
        console.warn('Failed to send sign-out feedback email (background):', e?.message);
      }
    })();
  } catch (e) {
    console.error('Failed to process sign-out feedback:', e);
    res.status(500).json({ error: e.message || 'Failed to process sign-out feedback' });
  }
});

// Agora token endpoint - server must generate tokens (do NOT embed App Certificate in client)
app.post('/api/agora/token', async (req, res) => {
  try {
    const { channel, uid } = req.body || {};
    if (!channel) return res.status(400).json({ error: 'channel required' });

    // Require a Supabase auth token unless explicitly allowed for development
    const allowPublic = String(process.env.ALLOW_PUBLIC_AGORA_TOKEN || '').toLowerCase() === 'true';
    let decoded = null;
    if (!allowPublic) {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.body.token || null);
      if (!token) return res.status(401).json({ error: 'token required in Authorization header or body' });
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData?.user) {
          return res.status(401).json({ error: 'invalid token' });
        }
        decoded = { uid: userData.user.id };
      } catch (ve) {
        console.error('Supabase token verification failed', ve);
        return res.status(401).json({ error: 'invalid token' });
      }
    }

    // At this point the requester is authenticated. You may inspect decoded.uid or other claims.
    // Use provided uid for Agora if present, otherwise default to 0 (App-assigned uid)
    const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERT = process.env.AGORA_APP_CERTIFICATE;
    if (!APP_ID || !APP_CERT) {
      console.error('Agora env missing APP_ID or APP_CERT');
      return res.status(500).json({ error: 'Agora not configured on server' });
    }

    const role = RtcRole.PUBLISHER;
    const privilegeExpireTimeInSeconds = 60 * 5; // 5 minutes
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTimestamp = currentTimestamp + privilegeExpireTimeInSeconds;

    const agoraUid = uid || 0;
    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERT, channel, agoraUid, role, privilegeExpireTimestamp);

    return res.json({ token, appId: APP_ID, expiresIn: privilegeExpireTimeInSeconds, requestedBy: decoded?.uid || 'public' });
  } catch (err) {
    console.error('Agora token generation error', err);
    return res.status(500).json({ error: 'token generation failed' });
  }
});

// --- Supabase (service role) for secure writes + audit logs ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  global.supabaseAdmin = supabaseAdmin; // Make available to routers (feature flags, etc.)
  console.log('🔐 Supabase service-role client initialized');
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Proxy endpoints will be disabled.');
  global.supabaseAdmin = null;
}

// --- ChatMe Firebase Initialization ---
let admin = null;
try {
  const chatMeFirebaseResult = await initializeChatMeFirebase();
  if (chatMeFirebaseResult && chatMeFirebaseResult.admin) {
    admin = chatMeFirebaseResult.admin;
    console.log('🔥 ChatMe Firebase initialized');
  }
} catch (error) {
  console.warn('⚠️ ChatMe Firebase initialization skipped:', error.message);
}

// Build a per-request Supabase client using the caller's JWT so that RLS policies
// (that depend on auth.uid()) evaluate correctly for user-scoped writes/reads.
function createClientFromRequest(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ SUPABASE_URL or SUPABASE_ANON_KEY missing; cannot create user client');
  }
  const token = req.headers?.authorization?.replace('Bearer ', '');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    },
    auth: { persistSession: false }
  });
}

async function logAudit({ actor = 'public', action, entity, record_id = null, details = {}, ip = null }) {
  try {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('audit_logs').insert({ actor, action, entity, record_id, details, ip });
  } catch (e) {
    console.warn('Audit log insert failed:', e?.message || e);
  }
}

// --- Middleware to check if user is suspended ---
async function checkSuspensionStatus(req, res, next) {
  try {
    // Extract user ID from JWT in Authorization header
    const token = req.headers?.authorization?.replace('Bearer ', '');
    if (!token || !supabaseAdmin) {
      return next(); // No token or Supabase not configured, skip check
    }

    // Decode JWT to get user_id (without verifying signature, we trust Supabase auth)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return next(); // Invalid JWT format, skip check
    }

    let decoded;
    try {
      // Decode the payload (second part)
      const payload = parts[1];
      const decodedString = Buffer.from(payload, 'base64').toString('utf-8');
      decoded = JSON.parse(decodedString);
    } catch (e) {
      return next(); // Failed to decode JWT, skip check
    }

    const userId = decoded.sub; // Supabase uses 'sub' for user ID
    if (!userId) {
      return next(); // No user ID in JWT, skip check
    }

    // Check if user is suspended
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('is_suspended, suspended_reason')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error checking suspension status:', error.message);
      return next(); // Error checking, allow request to proceed
    }

    // If user is suspended, return 403 Forbidden
    if (profile && profile.is_suspended) {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended and you do not have access to this resource.',
        suspended_reason: profile.suspended_reason || 'No reason provided',
        suspended: true
      });
    }

    next(); // User is not suspended, proceed
  } catch (err) {
    console.error('Unexpected error in checkSuspensionStatus:', err);
    next(); // Unexpected error, allow request to proceed for safety
  }
}

// Apply suspension check middleware to all API routes
app.use('/api/', checkSuspensionStatus);

// Minimal open proxy (no auth restriction yet) — use service role for DB writes
// Books: create
app.post('/api/elib/books', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { metadata } = req.body || {};
    if (!metadata || !metadata.title) return res.status(400).json({ error: 'metadata.title required' });
    const { data, error } = await supabaseAdmin.from('books').insert(metadata).select().maybeSingle();
    if (error) throw error;
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'create', entity: 'books', record_id: data.id, details: { metadata }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message || 'insert failed' });
  }
});

// Books: update + optional storage cleanup hint
app.patch('/api/elib/books/:id', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params;
    const { updates = {}, delete_paths = [] } = req.body || {};
    const { data, error } = await supabaseAdmin.from('books').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    // Best-effort storage delete for provided paths
    if (Array.isArray(delete_paths) && delete_paths.length > 0) {
      try { await supabaseAdmin.storage.from('elib-books').remove(delete_paths); } catch (_) { }
    }
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'update', entity: 'books', record_id: id, details: { updates, delete_paths }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message || 'update failed' });
  }
});

// Books: delete (+ optional storage remove)
app.delete('/api/elib/books/:id', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params;
    const { file_path } = req.body || {};
    const { error } = await supabaseAdmin.from('books').delete().eq('id', id);
    if (error) throw error;
    if (file_path) { try { await supabaseAdmin.storage.from('elib-books').remove([file_path]); } catch (_) { } }
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'delete', entity: 'books', record_id: id, details: { file_path }, ip: req.ip });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'delete failed' });
  }
});

// Universities: delete (service-role, relies on ON DELETE CASCADE for related tables)
app.delete('/api/elib/universities/:id', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('universities')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAudit({
      actor: req.headers['x-actor-email'] || 'public',
      action: 'delete',
      entity: 'universities',
      record_id: id,
      details: {},
      ip: req.ip,
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'delete failed' });
  }
});

// Categories: create/update/delete
app.post('/api/elib/categories', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { name, description } = req.body || {};
    const { data, error } = await supabaseAdmin.from('categories').insert({ name, description }).select().maybeSingle();
    if (error) throw error;
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'create', entity: 'categories', record_id: data.id, details: { name, description }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ error: e.message || 'insert failed' }); }
});

app.patch('/api/elib/categories/:id', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params; const { name, description } = req.body || {};
    const { data, error } = await supabaseAdmin.from('categories').update({ name, description }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'update', entity: 'categories', record_id: id, details: { name, description }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ error: e.message || 'update failed' }); }
});

app.delete('/api/elib/categories/:id', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
    if (error) throw error;
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'delete', entity: 'categories', record_id: id, details: {}, ip: req.ip });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message || 'delete failed' }); }
});

// Users: role change
app.patch('/api/elib/users/:id/role', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params; 
    const { role } = req.body || {};
    console.log(`[PATCH /api/elib/users/:id/role] Updating role for user ${id} to ${role}`);
    
    const { data, error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', id).select().maybeSingle();
    
    if (error) {
      console.error(`[PATCH /api/elib/users/:id/role] Supabase error:`, error);
      throw error;
    }
    
    console.log(`[PATCH /api/elib/users/:id/role] Success. Data:`, data);
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'update_role', entity: 'profiles', record_id: id, details: { role }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) { 
    console.error(`[PATCH /api/elib/users/:id/role] Catch error:`, e?.message || e);
    res.status(500).json({ error: e.message || 'update failed' }); 
  }
});

// Users: subscription tier change
app.patch('/api/elib/users/:id/tier', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params;
    const { subscription_tier } = req.body || {};
    console.log(`[PATCH /api/elib/users/:id/tier] Updating tier for user ${id} to ${subscription_tier}`);
    
    const updateData = { subscription_tier };
    
    // Set subscription dates based on tier
    const now = new Date();
    if (subscription_tier === 'premium' || subscription_tier === 'premium_pro') {
      updateData.subscription_started_at = now.toISOString();
      // Set expiration 1 year from now
      updateData.subscription_expires_at = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      console.log(`[PATCH /api/elib/users/:id/tier] Premium tier - set expiration to 1 year`);
    } else {
      // For free/basic tiers, clear subscription dates
      updateData.subscription_started_at = null;
      updateData.subscription_expires_at = null;
      console.log(`[PATCH /api/elib/users/:id/tier] Non-premium tier - clearing subscription dates`);
    }
    
    console.log(`[PATCH /api/elib/users/:id/tier] Update payload:`, updateData);
    
    const { data, error } = await supabaseAdmin.from('profiles').update(updateData).eq('id', id).select().maybeSingle();
    
    if (error) {
      console.error(`[PATCH /api/elib/users/:id/tier] Supabase error:`, JSON.stringify(error, null, 2));
      throw new Error(`Database update failed: ${error.message || JSON.stringify(error)}`);
    }
    
    if (!data) {
      console.warn(`[PATCH /api/elib/users/:id/tier] No data returned from update for user ${id}`);
    }
    
    console.log(`[PATCH /api/elib/users/:id/tier] Success. Updated user:`, data?.id);
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'update_tier', entity: 'profiles', record_id: id, details: { subscription_tier }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) { 
    console.error(`[PATCH /api/elib/users/:id/tier] Catch error:`, e?.message || e);
    res.status(500).json({ error: e.message || 'update failed' }); 
  }
});

// Users: suspend/unsuspend user (super_admin only)
app.patch('/api/elib/users/:id/suspend', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params;
    const { suspended, reason } = req.body || {};
    
    // Get the requesting user's email from headers and verify they are super_admin
    const actorEmail = req.headers['x-actor-email'];
    if (!actorEmail) {
      return res.status(401).json({ error: 'Unauthorized: No actor email provided' });
    }

    // Check if the requesting user is a super_admin
    const { data: actorProfile, error: actorError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('email', actorEmail)
      .maybeSingle();

    if (actorError || !actorProfile) {
      console.error(`[PATCH /api/elib/users/:id/suspend] Error fetching actor profile:`, actorError);
      return res.status(401).json({ error: 'Unauthorized: Could not verify user permissions' });
    }

    if (actorProfile.role !== 'super_admin') {
      console.warn(`[PATCH /api/elib/users/:id/suspend] User ${actorEmail} with role ${actorProfile.role} attempted to suspend user ${id}`);
      return res.status(403).json({ error: 'Forbidden: Only super admins can suspend users' });
    }

    console.log(`[PATCH /api/elib/users/:id/suspend] Updating suspend status for user ${id} to ${suspended}, reason: ${reason}`);
    
    const updateData = { 
      is_suspended: Boolean(suspended),
      suspended_reason: suspended ? (reason || 'System suspension') : null,
      suspended_at: suspended ? new Date().toISOString() : null
    };
    
    const { data, error } = await supabaseAdmin.from('profiles').update(updateData).eq('id', id).select().maybeSingle();
    
    if (error) {
      console.error(`[PATCH /api/elib/users/:id/suspend] Supabase error:`, JSON.stringify(error, null, 2));
      throw new Error(`Database update failed: ${error.message || JSON.stringify(error)}`);
    }
    
    if (!data) {
      console.warn(`[PATCH /api/elib/users/:id/suspend] No data returned from update for user ${id}`);
    }
    
    console.log(`[PATCH /api/elib/users/:id/suspend] Success. Updated user:`, data?.id);
    await logAudit({ 
      actor: actorEmail, 
      action: suspended ? 'suspend_user' : 'unsuspend_user', 
      entity: 'profiles', 
      record_id: id, 
      details: { is_suspended: suspended, reason }, 
      ip: req.ip 
    });

    // Send email notification if user is being suspended
    if (suspended && data?.email) {
      try {
        const userEmail = data.email;
        const suspensionReason = reason || 'Your account has been suspended due to violation of our terms of service.';
        
        const emailHtml = buildBrandedEmailHtml(`
          <h2 style="color: #ff6b6b; margin-bottom: 20px;">Account Suspended</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Your SomaLux account has been suspended and is no longer accessible.
          </p>
          <div style="background-color: #f5f5f5; border-left: 4px solid #ff6b6b; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333;"><strong>Reason for Suspension:</strong></p>
            <p style="margin: 8px 0 0 0; color: #666;">${suspensionReason}</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #666;">
            If you believe this is a mistake or would like to appeal this decision, please contact our support team at 
            <a href="mailto:support@somalux.com" style="color: #007bff; text-decoration: none;">support@somalux.com</a>
          </p>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        `);

        await sendEmail({
          to: userEmail,
          subject: 'Your SomaLux Account Has Been Suspended',
          html: emailHtml
        });

        console.log(`[PATCH /api/elib/users/:id/suspend] Suspension notification email sent to ${userEmail}`);
      } catch (emailError) {
        console.warn(`[PATCH /api/elib/users/:id/suspend] Failed to send suspension email:`, emailError?.message || emailError);
        // Don't fail the suspension if email fails to send
      }
    }

    // Send email notification if user is being unsuspended
    if (!suspended && data?.email) {
      try {
        const userEmail = data.email;
        
        const emailHtml = buildBrandedEmailHtml(`
          <h2 style="color: #4caf50; margin-bottom: 20px;">Account Restored</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Good news! Your SomaLux account has been restored and is now active again.
          </p>
          <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #666;">
            You can now log in and resume using all SomaLux features and services normally.
          </p>
          <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #666;">
            If you have any questions or concerns, please contact our support team at 
            <a href="mailto:support@somalux.com" style="color: #007bff; text-decoration: none;">support@somalux.com</a>
          </p>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        `);

        await sendEmail({
          to: userEmail,
          subject: 'Your SomaLux Account Has Been Restored',
          html: emailHtml
        });

        console.log(`[PATCH /api/elib/users/:id/suspend] Account restoration email sent to ${userEmail}`);
      } catch (emailError) {
        console.warn(`[PATCH /api/elib/users/:id/suspend] Failed to send restoration email:`, emailError?.message || emailError);
        // Don't fail the unsuspension if email fails to send
      }
    }

    res.json({ ok: true, data });
  } catch (e) { 
    console.error(`[PATCH /api/elib/users/:id/suspend] Catch error:`, e?.message || e);
    res.status(500).json({ error: e.message || 'update failed' }); 
  }
});

// Audit logs: list (basic pagination and filters)
app.get('/api/elib/audit', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const entity = req.query.entity || null;
    let q = supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (entity) q = q.eq('entity', entity);
    const { data, error, count } = await q;
    if (error) throw error;
    res.json({ ok: true, data, count: count ?? null });
  } catch (e) { res.status(500).json({ error: e.message || 'fetch failed' }); }
});

const PORT = process.env.PORT || 5000;
// Server will be started at the end after all routes are defined
let server;
let wss;
// Map of userId -> Set of ws connections for per-user notifications
const userChannels = new Map();

// Enhanced tracking for reduced Firestore ops
const clients = new Map(); // chatId -> Map<userId, ws>
const onlineUsers = new Map(); // chatId -> Set<userId>
const lastMessageTimestamps = new Map(); // userId -> lastKnownTimestamp for deltas
const userChatSessions = new Map(); // userId_chatId -> ws (track joined sessions to prevent duplicates)
const messageStats = new Map(); // Track only ACTUAL sent/received messages (not joins/leaves)

// Message counter - only for actual sent messages
function countMessage(userId, chatId, direction) {
  if (!messageStats.has(chatId)) {
    messageStats.set(chatId, { sent: new Set(), received: new Set() });
  }
  const stats = messageStats.get(chatId);
  if (direction === 'sent') {
    stats.sent.add(userId);
  } else if (direction === 'received') {
    stats.received.add(userId);
  }
}

// WebSocket setup function - will be called after server starts
function setupWebSocket() {
  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket client connected");
    let currentChatId = null;
    let currentUserId = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, chatId, userId } = message;

        switch (type) {
          case "join_user":
            if (!userId) {
              console.error("❌ join_user missing userId");
              return;
            }
            if (!userChannels.has(userId)) userChannels.set(userId, new Set());
            userChannels.get(userId).add(ws);
            ws.userId = userId;
            console.log(`👤 User channel joined: ${userId} (connections: ${userChannels.get(userId).size})`);
            break;
          case "join":
            if (!chatId || !userId) {
              console.error("❌ join invalid: missing chatId/userId");
              return;
            }
            
            // Check if this user is already joined to this specific chat
            const sessionKey = `${userId}_${chatId}`;
            if (userChatSessions.has(sessionKey)) {
              // Silently skip duplicate joins - frontend may send multiple join messages
              return;
            }
            
            currentChatId = chatId;
            currentUserId = userId;
            if (!clients.has(chatId)) {
              clients.set(chatId, new Map());
              onlineUsers.set(chatId, new Set());
            }
            clients.get(chatId).set(userId, ws);
            onlineUsers.get(chatId).add(userId);
            ws.userId = userId;
            ws.userName = message.userName || userId; // Store userName for groups
            userChatSessions.set(sessionKey, ws); // Mark as joined

            console.log(`👥 User ${userId} (${ws.userName}) joined ${chatId} (online: ${onlineUsers.get(chatId).size})`);

            // Send online users (exclude self)
            const otherOnline = Array.from(onlineUsers.get(chatId)).filter(u => u !== userId);
            ws.send(JSON.stringify({ type: "users_online", data: otherOnline }));

            // DO NOT fetch recent messages automatically - prevents loops
            // Client can request with 'get_messages' type if needed
            lastMessageTimestamps.set(userId, Date.now());

            // Broadcast join
            clients.get(chatId).forEach((clientWs, otherUserId) => {
              if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({ type: "user_online", data: { userId, userName: ws.userName } }));
              }
            });
            break;

          case "leave":
            if (!chatId || !userId) {
              console.error("❌ leave invalid: missing chatId/userId");
              return;
            }
            let leaveSessionKey = `${userId}_${chatId}`;
            userChatSessions.delete(leaveSessionKey); // Remove session tracking
            
            console.log(`👋 User ${userId} (${ws.userName}) left ${chatId}`);
            // Remove from clients and online users
            const room = clients.get(chatId);
            if (room) {
              room.delete(userId);
              onlineUsers.get(chatId)?.delete(userId);

              // Broadcast leave to other users in the room
              room.forEach((clientWs, otherUserId) => {
                if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ type: "user_offline", data: { userId, userName: ws.userName } }));
                }
              });

              // Clean up empty rooms
              if (room.size === 0) {
                clients.delete(chatId);
                onlineUsers.delete(chatId);
              }
            }
            break;

          case "typing_start":
            if (!chatId || !userId) return;
            const { userName: typingUserName } = message;
            clients.get(chatId)?.forEach((clientWs, otherUserId) => {
              if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({
                  type: "typing_start",
                  data: {
                    userId,
                    userName: typingUserName || ws.userName || userId,
                    chatId: chatId,  // Include chatId for frontend filtering
                    groupId: message.isGroup ? chatId : undefined  // Include groupId if group
                  }
                }));
              }
            });
            console.log(`⌨️ Typing start ${typingUserName || userId} in ${chatId}`);
            break;

          case "typing_stop":
            if (!chatId || !userId) return;
            clients.get(chatId)?.forEach((clientWs, otherUserId) => {
              if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({
                  type: "typing_stop",
                  data: {
                    userId,
                    userName: ws.userName || userId,
                    chatId: chatId,  // Include chatId for frontend filtering
                    groupId: chatId  // Assume group context
                  }
                }));
              }
            });
            console.log(`⏹️ Typing stop ${ws.userName || userId} in ${chatId}`);
            break;

          case "messages_read":
            if (!chatId || !userId) return;
            const { messageIds } = message;
            clients.get(chatId)?.forEach((clientWs, otherUserId) => {
              if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({
                  type: "messages_read",
                  data: {
                    userId,
                    messageIds,
                    chatId: chatId,  // Include chatId for frontend filtering
                    groupId: chatId  // Include groupId for consistency
                  }
                }));
              }
            });
            console.log(`📖 Read broadcast ${userId} in ${chatId}: ${messageIds.length} msgs`);
            break;

          case "get_messages":
            // Client explicitly requests recent messages
            if (!chatId || !userId) {
              console.warn('get_messages missing chatId or userId');
              return;
            }
            try {
              const { since } = message;
              const lastTs = since || lastMessageTimestamps.get(userId) || 0;
              await fetchRecentMessages(chatId, ws, lastTs, message.isGroup);
              console.log(`📜 Sent recent messages for ${chatId} on explicit request`);
            } catch (err) {
              console.error('Error fetching messages:', err);
            }
            break;

          case "send_message":
            // Handle incoming messages from user
            // ONLY broadcast to OTHER users - sender should NOT receive echo
            if (!chatId || !userId) {
              console.warn('send_message missing chatId or userId');
              return;
            }
            try {
              const { messageId, text, messageType, timestamp, selectedOptions } = message;
              
              if (!text && !selectedOptions) {
                console.warn('send_message missing text or selectedOptions');
                return;
              }

              // Count this as a SENT message for the sender
              countMessage(userId, chatId, 'sent');

              // Broadcast ONLY to other users in the chat (never send back to sender)
              const room = clients.get(chatId);
              if (room) {
                let broadcastCount = 0;
                room.forEach((clientWs, otherUserId) => {
                  // CRITICAL: Only send to OTHER users, NOT the sender
                  if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                    clientWs.send(JSON.stringify({
                      type: 'new_message',
                      data: {
                        id: messageId,
                        chatId,
                        userId,
                        userName: ws.userName || userId,
                        text,
                        messageType,
                        timestamp,
                        selectedOptions,
                        status: 'delivered'
                      }
                    }));
                    // Count as received for each recipient
                    countMessage(otherUserId, chatId, 'received');
                    broadcastCount++;
                  }
                });
                const stats = messageStats.get(chatId);
                console.log(`💬 Message from ${userId} in ${chatId}: sent=1, received=${broadcastCount}, unique_senders=${stats.sent.size}, unique_receivers=${stats.received.size}`);
              } else {
                console.log(`💬 Message from ${userId} for ${chatId} but no active room`);
              }
            } catch (err) {
              console.error('Error handling send_message:', err);
            }
            break;

          case "poll_voted":
            // Broadcast poll vote updates to other clients in the same chat/group
            if (!chatId || !userId) {
              console.warn('poll_voted missing chatId or userId');
              return;
            }
            try {
              const { messageId: pvMessageId, selectedOptions, updatedPoll } = message;
              const pvChatId = chatId;
              const pvUserId = userId;
              const pvUserName = message.userName || ws.userName || pvUserId;
              const room = clients.get(pvChatId);
              if (room) {
                room.forEach((clientWs, otherUserId) => {
                  if (otherUserId !== pvUserId && clientWs.readyState === clientWs.OPEN) {
                    clientWs.send(JSON.stringify({
                      type: 'poll_voted',
                      data: {
                        chatId: pvChatId,
                        groupId: pvChatId,
                        userId: pvUserId,
                        userName: pvUserName,
                        messageId: pvMessageId,
                        selectedOptions: selectedOptions,
                        updatedPoll: updatedPoll
                      }
                    }));
                  }
                });
                console.log(`🗳️ Broadcast poll_voted in ${pvChatId} from ${pvUserId}`);
              } else {
                console.log(`🗳️ poll_voted received for ${pvChatId} but no active room to broadcast`);
              }
            } catch (err) {
              console.error('Error broadcasting poll_voted:', err);
            }
            break;
          default:
            console.warn(`❓ Unknown type: ${type}`);
        }
      } catch (error) {
        console.error("❌ WS parse error:", error);
      }
    });

    ws.on("close", () => {
      // Clean up ALL sessions for this WebSocket (not just current chat)
      for (let [key, wsRef] of userChatSessions.entries()) {
        if (wsRef === ws) {
          userChatSessions.delete(key);
        }
      }
      
      if (currentChatId && currentUserId) {
        const room = clients.get(currentChatId);
        if (room) {
          room.delete(currentUserId);
          onlineUsers.get(currentChatId)?.delete(currentUserId);

          // Broadcast offline
          room.forEach((clientWs, otherUserId) => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ type: "user_offline", data: { userId: currentUserId } }));
            }
          });

          if (room.size === 0) {
            clients.delete(currentChatId);
            onlineUsers.delete(currentChatId);
          }
        }
      }
      // Cleanup user channel mapping
      if (ws.userId && userChannels.has(ws.userId)) {
        const set = userChannels.get(ws.userId);
        set.delete(ws);
        if (set.size === 0) userChannels.delete(ws.userId);
      }
      console.log("🔌 WS disconnected");
    });
  });
} // End setupWebSocket function

// Delta recent messages (supports both 1-on-1 and groups)
async function fetchRecentMessages(chatId, ws, since = 0, isGroup = false) {
  try {
    if (!supabaseAdmin) {
      console.error("❌ Recent msgs error: Supabase not initialized");
      return;
    }

    const sinceMs = Number(since) || 0;
    const sinceDate = sinceMs > 0 ? new Date(sinceMs).toISOString() : null;

    // Query messages from Supabase using chat_id column
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_deleted', false)  // Filter out deleted messages
      .order('created_at', { ascending: false })
      .limit(100);

    // Filter by timestamp if since provided
    if (sinceDate) {
      query = query.gt('created_at', sinceDate);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("❌ Recent msgs query error:", error);
      return;
    }

    const recent = (messages || []).map((msg) => ({
      id: msg.id,
      ...msg,
      timestamp: new Date(msg.created_at),
      chatId: msg.chat_id
    }));

    ws.send(JSON.stringify({ type: "recent_messages", data: recent }));
    console.log(`📜 Sent ${recent.length} recent msgs since ${since} to ${chatId}`);
  } catch (error) {
    console.error("❌ Recent msgs error:", error);
  }
}

// getChatId unchanged
const getChatId = (sender, receiver) => {
  if (!sender || !receiver || typeof sender !== 'string' || typeof receiver !== 'string') {
    console.error('getChatId: Invalid inputs', { sender, receiver, types: { sender: typeof sender, receiver: typeof receiver } });
    return null;
  }
  if (sender.includes('_') || receiver.includes('_')) {
    console.error('getChatId: UID contains "_", possible prior chatId misuse', { sender, receiver });
    return null;
  }
  const sorted = [String(sender), String(receiver)].sort();
  const chatId = sorted.join('_');
  console.log('Backend getChatId generated', { sender, receiver, sorted, chatId });
  return chatId;
};

// /users - DISABLED (Firebase not used)
app.get("/users", async (req, res) => {
  return res.status(503).json({ error: "Chat system not available" });
});

// /send FIXED: Update status to "delivered" before WS, full broadcast, better touch
app.post("/send", async (req, res) => {
  return res.status(503).json({ error: "Chat system not available" });
});

// /messages/delivered - DISABLED (Chat system not available)
app.post("/messages/delivered", async (req, res) => {
  return res.status(503).json({ error: "Chat system not available" });
});

// /messages/read - DISABLED (Chat system not available)
app.post("/messages/read", async (req, res) => {
  return res.status(503).json({ error: "Chat system not available" });
});

// /chat/:chatId/messages - DISABLED (Chat system not available)
app.get("/chat/:chatId/messages", async (req, res) => {
  return res.status(503).json({ error: "Chat system not available" });
});

// GROUP ENDPOINTS

// /send-group-message - DISABLED (Chat system not available)
app.post("/send-group-message", async (req, res) => {
  return res.status(503).json({ error: "Chat system not available" });
});

// /group/:groupId/messages - DISABLED (Chat system not available)
app.get("/group/:groupId/messages", async (req, res) => {
  return res.status(503).json({ error: "Chat system not available" });
});

// /group-messages/read - DISABLED (Chat system not available)
app.post("/group-messages/read", async (req, res) => {
  return res.status(503).json({ error: "Chat system not available" });
});

// /api/messages/latest-batch - Fetch latest messages for multiple chats
app.post("/api/messages/latest-batch", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { chatIds, limit = 20 } = req.body;
    
    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ error: 'chatIds must be a non-empty array' });
    }

    // Fetch latest messages for each chat
    const results = {};
    
    for (const chatId of chatIds) {
      try {
        // Fetch all messages and filter in code for content
        const { data: messages, error } = await supabaseAdmin
          .from('messages')
          .select('id, content, status, is_read, is_edited, created_at, updated_at, sender_id, chat_id, attachment_urls')
          .eq('chat_id', chatId)
          .isNull('deleted_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.warn(`⚠️ Error fetching messages for ${chatId}:`, error);
          results[chatId] = [];
          continue;
        }

        // Filter for messages with actual text content
        const textMessages = messages?.filter(m => {
          const hasText = m?.text || m?.message;
          return hasText && typeof hasText === 'string' && hasText.trim().length > 0;
        }) || [];

        // Return the first text message (should be the most recent)
        if (textMessages.length > 0) {
          results[chatId] = [textMessages[0]];
          console.log(`✅ Found text message for ${chatId}: "${textMessages[0].text || textMessages[0].message}"`);
        } else {
          results[chatId] = [];
          console.log(`⚠️ No text messages found for ${chatId}, got ${messages?.length || 0} total messages`);
        }
      } catch (err) {
        console.error(`❌ Error querying messages for ${chatId}:`, err);
        results[chatId] = [];
      }
    }

    res.json({ ok: true, data: results });
  } catch (error) {
    console.error('❌ /api/messages/latest-batch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
});

// === BULK UPLOAD ENDPOINTS ===
// Track ongoing bulk upload processes
const bulkUploadProcesses = new Map();
const PROCESSES_FILE = path.join(process.cwd(), 'upload-processes.json');

// Load persisted processes on startup
function loadProcesses() {
  try {
    if (existsSync(PROCESSES_FILE)) {
      const data = JSON.parse(readFileSync(PROCESSES_FILE, 'utf8'));
      Object.entries(data).forEach(([id, process]) => {
        bulkUploadProcesses.set(id, process);
      });
      console.log(`📂 Loaded ${bulkUploadProcesses.size} persisted upload processes`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to load persisted processes:', error.message);
  }
}

// Save processes to disk
function saveProcesses() {
  try {
    const data = Object.fromEntries(bulkUploadProcesses);
    writeFileSync(PROCESSES_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('⚠️ Failed to save processes:', error.message);
  }
}

// Load on startup
loadProcesses();

// Start bulk upload
app.post('/api/elib/bulk-upload/start', async (req, res) => {
  console.log(`📨 [BULK-UPLOAD-START] Request received at ${new Date().toISOString()}`);
  
  if (!supabaseAdmin) {
    console.error(`❌ [BULK-UPLOAD-START] Supabase not configured`);
    return res.status(500).json({ error: 'Supabase not configured on server' });
  }

  try {
    const { booksDirectory, skipDuplicates = true, uploadedBy = null, asSubmission = false } = req.body;
    const actorEmailHeader = req.headers['x-actor-email'] || null;
    const actorNameHeader = req.headers['x-actor-name'] || null;

    console.log(`📂 [BULK-UPLOAD-START] Directory: ${booksDirectory}`);
    console.log(`👤 [BULK-UPLOAD-START] Uploader: ${uploadedBy || 'null'}`);
    console.log(`📋 [BULK-UPLOAD-START] AsSubmission: ${asSubmission}`);

    if (!booksDirectory) {
      console.error(`❌ [BULK-UPLOAD-START] No directory provided`);
      return res.status(400).json({ error: 'booksDirectory is required' });
    }

    // Validate directory exists before launching background task
    try {
      // Normalize path (handle both Unix and Windows paths)
      const normalizedPath = booksDirectory.trim();
      
      if (!fs.existsSync(normalizedPath) || !fs.statSync(normalizedPath).isDirectory()) {
        console.error(`❌ [BULK-UPLOAD-START] Directory not found: ${normalizedPath}`);
        
        // Provide helpful error message based on deployment context
        let helpMessage = 'Directory not found. Please check the path and try again.';
        if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
          helpMessage = `Directory not found: "${normalizedPath}". Note: If using Render or cloud deployment, use the server-side path, not your local machine path.`;
        }
        
        return res.status(400).json({ error: helpMessage });
      }
      console.log(`✅ [BULK-UPLOAD-START] Directory exists and is accessible`);
    } catch (e) {
      console.error(`❌ [BULK-UPLOAD-START] Directory access error:`, e.message);
      let helpMessage = 'Directory not accessible. Please check permissions and path.';
      if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
        helpMessage = `Directory access error: "${e.message}". If using Render or cloud deployment, ensure the path is accessible on the server, not your local machine.`;
      }
      return res.status(400).json({ error: helpMessage });
    }

    // Generate unique process ID
    const processId = `upload_${Date.now()}`;
    console.log(`🔑 [BULK-UPLOAD-START] Process ID: ${processId}`);

    // Import bulk upload module dynamically
    const { bulkUploadBooks } = await import('./scripts/bulkUpload.js');

    // Start upload process in background
    const stopFlag = { stopped: false };
    const processState = {
      id: processId,
      status: 'running',
      startedAt: new Date().toISOString(),
      booksDirectory,
      // Include uploader metadata so frontend can show who started the process
      uploadedBy: uploadedBy || null,
      startedByEmail: actorEmailHeader || null,
      startedByName: actorNameHeader || null,
      stopFlag, // Reference to stop flag
      stats: {
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      }
    };

    bulkUploadProcesses.set(processId, processState);
    saveProcesses();

    console.log(`🚀 [BULK-UPLOAD-START] Starting background upload process`);

    // Run in background
    (async () => {
      try {
        console.log(`📋 [BULK-UPLOAD-${processId}] Calling bulkUploadBooks...`);
        const stats = await bulkUploadBooks({
          booksDirectory,
          supabaseUrl: SUPABASE_URL,
          supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
          googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || null,
          uploadedBy,
          skipDuplicates,
          targetTable: asSubmission ? 'book_submissions' : 'books',
          stopFlag,
          onProgress: ({ stats }) => {
            try {
              // Merge incoming stats into process state for real-time UI
              processState.stats = {
                ...processState.stats,
                ...stats
              };
              saveProcesses(); // Persist updates
            } catch (e) {
              // noop
            }
          }
        });

        console.log(`✅ [BULK-UPLOAD-${processId}] Upload completed:`, stats);
        processState.status = 'completed';
        processState.stats = stats;
        processState.completedAt = new Date().toISOString();
        saveProcesses();

        // Notify admins if user submissions were created
        try {
          if (asSubmission) {
            const uploaderLabel = req.headers['x-actor-email'] || 'user';
            const html = buildBrandedEmailHtml({
              title: '📚 New Book Submissions Awaiting Approval',
              body: `
                <div style="font-size:14px;color:#111827;">
                  <p>${uploaderLabel} submitted books via the Bulk Upload tool.</p>
                  <p><strong>${stats.successful}</strong> created, <strong>${stats.failed}</strong> failed, <strong>${stats.skipped}</strong> skipped.</p>
                  <p>Please review pending items in Admin &gt; Books &gt; Submissions.</p>
                </div>
              `
            });
            const adminTo = process.env.ADMIN_EMAILS || '';
            if (adminTo) {
              await sendEmail({ to: adminTo, subject: 'New Book Submissions Awaiting Approval', text: 'New submissions pending review', html });
            }
          }
        } catch (e) {
          console.warn('Failed to notify admins about submissions:', e?.message || e);
        }

      } catch (error) {
        console.error(`❌ [BULK-UPLOAD-${processId}] Error:`, error.message);
        console.error(`   Stack:`, error.stack);
        processState.status = 'failed';
        processState.error = error.message;
        processState.completedAt = new Date().toISOString();
        saveProcesses();
      }
    })();

    res.json({
      ok: true,
      processId,
      message: 'Bulk upload started in background'
    });
    
    console.log(`✅ [BULK-UPLOAD-START] Response sent with processId: ${processId}`);

  } catch (error) {
    console.error(`❌ [BULK-UPLOAD-START] Exception caught:`, error.message);
    res.status(500).json({ error: error.message || 'Failed to start bulk upload' });
  }
});

// Get bulk upload status
app.get('/api/elib/bulk-upload/status/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    const process = bulkUploadProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    res.json({ ok: true, process });

  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to get status' });
  }
});

// Stop a bulk upload process
app.post('/api/elib/bulk-upload/stop/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    const process = bulkUploadProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    if (process.status !== 'running') {
      return res.status(400).json({ error: 'Process is not running' });
    }

    // Set stop flag
    if (process.stopFlag) {
      process.stopFlag.stopped = true;
    }
    process.status = 'stopped';
    process.completedAt = new Date().toISOString();
    saveProcesses();

    res.json({ ok: true, message: 'Stop signal sent' });

  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to stop process' });
  }
});

// List all bulk upload processes
app.get('/api/elib/bulk-upload/processes', async (req, res) => {
  try {
    const processes = Array.from(bulkUploadProcesses.values())
      .map(p => {
        // Remove stopFlag from response (it's internal)
        const { stopFlag, ...rest } = p;
        return rest;
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 20);  // Last 20 processes

    res.json({ ok: true, processes });

  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to list processes' });
  }
});

// ==================== PAST PAPERS BULK UPLOAD ====================
// Using Auto-Download endpoints below instead

const bulkUploadPastPapersProcesses = new Map();
// Endpoint removed - using new auto-download endpoints instead
/*app.get('/api/elib/bulk-upload-pastpapers/status/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    const process = bulkUploadPastPapersProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    const { stopFlag, ...safeProcess } = process;
    res.json({ ok: true, process: safeProcess });

  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to get status' });
  }
});

app.post('/api/elib/bulk-upload-pastpapers/stop/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    const process = bulkUploadPastPapersProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    if (process.status === 'running') {
      process.stopFlag.stopped = true;
      process.status = 'stopped';
    }

    const { stopFlag, ...safeProcess } = process;
    res.json({ ok: true, process: safeProcess });

  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to stop process' });
  }
});

app.post('/api/elib/bulk-upload-pastpapers/resume/:processId', async (req, res) => {
  console.log(`📨 [PAST-PAPERS-BULK-UPLOAD-RESUME] Request received for process: ${req.params.processId}`);

  try {
    const { processId } = req.params;
    const { uploadedBy } = req.body;
    const actorEmail = req.headers['x-actor-email'] || 'admin';
    const actorName = req.headers['x-actor-name'] || 'Unknown';

    const existingProcess = bulkUploadPastPapersProcesses.get(processId);

    if (!existingProcess) {
      console.error(`❌ [PAST-PAPERS-BULK-UPLOAD-RESUME] Process not found: ${processId}`);
      return res.status(404).json({ error: 'Process not found' });
    }

    if (existingProcess.status !== 'stopped') {
      console.error(`❌ [PAST-PAPERS-BULK-UPLOAD-RESUME] Process status is ${existingProcess.status}, not stopped`);
      return res.status(400).json({ error: 'Only stopped processes can be resumed' });
    }

    console.log(`🔑 [PAST-PAPERS-BULK-UPLOAD-RESUME] Resuming process: ${processId}`);
    console.log(`📂 [PAST-PAPERS-BULK-UPLOAD-RESUME] Directory: ${existingProcess.papersDirectory}`);

    // Reset the stop flag and status to resume
    existingProcess.stopFlag.stopped = false;
    existingProcess.status = 'running';
    existingProcess.resumedAt = new Date().toISOString();

    // Start background upload from where it stopped
    (async () => {
      try {
        console.log(`📋 [PAST-PAPERS-BULK-UPLOAD-${processId}] Resuming bulkUploadPastPapers...`);
        const { bulkUploadPastPapers } = await import('./scripts/bulkUploadPastPapers.js');
        
        const stats = await bulkUploadPastPapers({
          papersDirectory: existingProcess.papersDirectory,
          supabaseUrl: process.env.SUPABASE_URL,
          supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          uploadedBy: existingProcess.uploadedBy,
          asSubmission: existingProcess.asSubmission,
          onProgress: (data) => {
            // Update process stats
            if (data.stats) {
              existingProcess.stats = { ...data.stats };
            }
          },
          stopFlag: existingProcess.stopFlag
        });

        console.log(`✅ [PAST-PAPERS-BULK-UPLOAD-${processId}] Resume completed:`, stats);
        existingProcess.status = 'completed';
        existingProcess.completedAt = new Date().toISOString();
        existingProcess.stats = stats;

        // Notify admin
        if (actorEmail && actorEmail !== 'admin') {
          try {
            await sendEmail({
              to: actorEmail,
              subject: `Past Papers Bulk Upload Completed`,
              html: buildBrandedEmailHtml(`
                <h2>Resumed Upload Complete</h2>
                <p>Your resumed bulk upload of past papers has completed.</p>
                <ul>
                  <li>Total: ${stats.total}</li>
                  <li>Successful: ${stats.successful}</li>
                  <li>Failed: ${stats.failed}</li>
                  <li>Skipped: ${stats.skipped}</li>
                </ul>
              `)
            });
          } catch (emailErr) {
            console.warn(`⚠️ Failed to send email to ${actorEmail}:`, emailErr.message);
          }
        }

      } catch (error) {
        console.error(`❌ [PAST-PAPERS-BULK-UPLOAD-${processId}] Resume error:`, error.message);
        existingProcess.status = 'failed';
        existingProcess.error = error.message;
        existingProcess.completedAt = new Date().toISOString();
      }
    })();

    console.log(`✅ [PAST-PAPERS-BULK-UPLOAD-RESUME] Response sent - resuming process ${processId}`);
    res.json({ ok: true, processId });

  } catch (error) {
    console.error(`❌ [PAST-PAPERS-BULK-UPLOAD-RESUME] Exception caught:`, error.message);
    res.status(500).json({ error: error.message || 'Failed to resume upload' });
  }
});

app.get('/api/elib/bulk-upload-pastpapers/processes', async (req, res) => {
  try {
    const processes = Array.from(bulkUploadPastPapersProcesses.values())
      .map(p => {
        const { stopFlag, ...rest } = p;
        return rest;
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 20);

    res.json({ ok: true, processes });

  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to list processes' });
  }
});
*/

// === PAST PAPERS BULK UPLOAD ENDPOINTS ===

// POST /api/elib/bulk-upload-pastpapers/start - Start uploading past papers from folder
// COMMENTED OUT: This conflicts with URL-based download endpoint. Use lazy-loaded URL endpoint instead.
/*
app.post('/api/elib/bulk-upload-pastpapers/start', async (req, res) => {
  try {
    const { papersDirectory, universityId, uploadedBy, asSubmission } = req.body;

    if (!papersDirectory?.trim()) {
      return res.status(400).json({ ok: false, error: 'Papers directory path is required' });
    }

    // Validate directory exists
    try {
      const normalizedPath = path.resolve(papersDirectory);
      const stats = fs.statSync(normalizedPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ ok: false, error: 'Provided path is not a directory' });
      }
    } catch (e) {
      return res.status(400).json({ ok: false, error: `Directory not accessible: ${e.message}` });
    }

    const processId = crypto.randomUUID();
    const stopFlag = { stopped: false };

    const uploadProcess = {
      id: processId,
      status: 'running',
      papersDirectory,
      universityId,
      uploadedBy,
      asSubmission: !!asSubmission,
      startedAt: new Date().toISOString(),
      completedAt: null,
      stats: {
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      },
      stopFlag
    };

    bulkUploadPastPapersProcesses.set(processId, uploadProcess);
    console.log(`📂 [PAST-PAPERS-BULK-UPLOAD-${processId}] Started from directory: ${papersDirectory}`);

    // Start background upload process
    (async () => {
      try {
        const { bulkUploadPastPapers } = await import('./scripts/bulkUploadPastPapers.js');
        
        const stats = await bulkUploadPastPapers({
          papersDirectory,
          universityId,
          supabaseUrl: process.env.SUPABASE_URL,
          supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          uploadedBy,
          asSubmission,
          onProgress: (data) => {
            if (data.stats) {
              uploadProcess.stats = { ...data.stats };
            }
          },
          stopFlag
        });

        uploadProcess.status = 'completed';
        uploadProcess.completedAt = new Date().toISOString();
        uploadProcess.stats = stats;
        console.log(`✅ [PAST-PAPERS-BULK-UPLOAD-${processId}] Completed:`, stats);

      } catch (error) {
        console.error(`❌ [PAST-PAPERS-BULK-UPLOAD-${processId}] Error:`, error.message);
        uploadProcess.status = 'failed';
        uploadProcess.completedAt = new Date().toISOString();
        uploadProcess.error = error.message;
      }
    })();

    res.json({ ok: true, processId, process: uploadProcess });

  } catch (error) {
    console.error('❌ Error starting bulk upload:', error.message);
    res.status(500).json({ ok: false, error: error.message || 'Failed to start upload' });
  }
});
*/

// GET /api/elib/bulk-upload-pastpapers/status/:processId
// COMMENTED OUT: Related to directory-based upload endpoint
/*
app.get('/api/elib/bulk-upload-pastpapers/status/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    const process = bulkUploadPastPapersProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ ok: false, error: 'Process not found' });
    }

    const { stopFlag, ...safeProcess } = process;
    res.json({ ok: true, process: safeProcess });

  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to get status' });
  }
});
*/

// GET /api/elib/bulk-upload-pastpapers/processes
// COMMENTED OUT: Related to directory-based upload endpoint
/*
app.get('/api/elib/bulk-upload-pastpapers/processes', async (req, res) => {
  try {
    const processes = Array.from(bulkUploadPastPapersProcesses.values())
      .map(p => {
        const { stopFlag, ...rest } = p;
        return rest;
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 20);

    res.json({ ok: true, processes });

  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to list processes' });
  }
});
*/

// POST /api/elib/bulk-upload-pastpapers/stop/:processId
// COMMENTED OUT: Related to directory-based upload endpoint
/*
app.post('/api/elib/bulk-upload-pastpapers/stop/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    const process = bulkUploadPastPapersProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ ok: false, error: 'Process not found' });
    }

    if (process.status === 'running') {
      process.stopFlag.stopped = true;
      process.status = 'stopped';
    }

    const { stopFlag, ...safeProcess } = process;
    res.json({ ok: true, process: safeProcess });

  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to stop process' });
  }
});
*/

// === DSpace Structured Browse Endpoints ===
// Follow exact DSpace navigation: Communities → Items → PDFs

// GET /api/elib/dspace/communities - List all communities from home page
app.get('/api/elib/dspace/communities', async (req, res) => {
  try {
    const baseUrl = 'https://pastpapers.ku.ac.ke';
    
    // Fetch home page
    const homeHtml = await new Promise((resolve, reject) => {
      https.get(baseUrl, {
        timeout: 15000,
        rejectUnauthorized: false,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, (response) => {
        let html = '';
        response.on('data', chunk => html += chunk);
        response.on('end', () => resolve(html));
      }).on('error', reject);
    });

    // Extract community links: <a href="/handle/123456789/4547">Community Name [21]</a>
    const communityRegex = /href=["']\/handle\/(\d+\/\d+)["']>([^<]+)\s*\[(\d+)\]/gi;
    const communities = [];
    let match;
    
    while ((match = communityRegex.exec(homeHtml)) !== null) {
      const [, handle, name, itemCount] = match;
      communities.push({
        handle,
        name: name.trim(),
        itemCount: parseInt(itemCount),
        url: `${baseUrl}/handle/${handle}`
      });
    }

    console.log(`📚 [DSPACE] Found ${communities.length} communities`);
    res.json({ ok: true, communities });
  } catch (error) {
    console.error('[DSPACE] Error fetching communities:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Helper function to extract clean unit code from filename
const extractUnitCode = (filename) => {
  if (!filename) return 'Unknown';
  
  // Try to extract unit code patterns like "UCU 104", "EAE 301", etc.
  const patterns = [
    // Pattern 1: Code-Space-Number (e.g., "UCU 104")
    /([A-Z]{2,4}\s*\d{2,4})/,
    // Pattern 2: Code+Number without space (e.g., "UCU104")
    /([A-Z]{2,4}\d{2,4})/,
    // Pattern 3: Code-Number-Text (e.g., "UCU110 Communication")
    /^([A-Z]{2,4}\d{2,4})/,
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      // Clean up the match - ensure space between code and number
      let code = match[1].trim();
      code = code.replace(/([A-Z]+)(\d+)/, '$1 $2'); // Add space if missing
      return code;
    }
  }
  
  // Fallback: return first 20 chars
  return filename.substring(0, 20).trim();
};

// GET /api/elib/dspace/community-items?handle=123456789/4547 - List items in community (ALL PAGES)
app.get('/api/elib/dspace/community-items', async (req, res) => {
  try {
    const { handle } = req.query;
    if (!handle) return res.status(400).json({ ok: false, error: 'Community handle required' });

    const baseUrl = 'https://pastpapers.ku.ac.ke';
    const items = [];
    const seenHandles = new Set();
    let offset = 0;
    const initialLimit = 100;
    let actualPageSize = null;
    let hasMore = true;
    let pageCount = 0;
    const MAX_PAGES = 10000; // Allow up to 10,000 pages (~1M items) - practically unlimited

    while (hasMore && pageCount < MAX_PAGES) {
      pageCount++;
      const currentLimit = actualPageSize || initialLimit;
      const communityUrl = `${baseUrl}/handle/${handle}?offset=${offset}&limit=${currentLimit}`;
      
      console.log(`📄 [DSPACE] Fetching page ${pageCount} (offset=${offset}, limit=${currentLimit}, total items: ${items.length})...`);
      console.log(`🔗 [DSPACE] URL: ${communityUrl}`);

      // Fetch community page with pagination
      const communityHtml = await new Promise((resolve, reject) => {
        https.get(communityUrl, {
          timeout: 15000,
          rejectUnauthorized: false,
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          },
          followRedirect: true
        }, (response) => {
          let html = '';
          response.on('data', chunk => html += chunk);
          response.on('end', () => {
            console.log(`📥 [DSPACE] Response size: ${html.length} bytes`);
            resolve(html);
          });
        }).on('error', reject);
      });

      // Extract item links using multiple patterns to handle different DSpace HTML structures
      let pageItemCount = 0;
      const pageItems = new Set();

      console.log(`🔍 [DSPACE] Searching for items with multiple regex patterns...`);
      
      // Try multiple regex patterns
      const patternDefs = [
        { name: 'Pattern 1: href with quotes', pattern: /href=["']([^"']*\/handle\/(\d+\/\d+)[^"']*?)["'][^>]*>([^<]+)<\/a>/g },
        { name: 'Pattern 2: Simple handle link', pattern: /\/handle\/(\d+\/\d+)['"]\s*[^>]*>([^<]{0,100})<\/a>/g },
        { name: 'Pattern 3: Handle with any class', pattern: /href=["']([^"']*handle[^"']*(\d+\/\d+)[^"']*?)["'][^>]*title=["']([^"']+)["']/g },
        { name: 'Pattern 4: Data attribute', pattern: /data-[^=]*=["'].*?\/handle\/(\d+\/\d+)["'][^>]*>([^<]{0,100})<\/a>/g }
      ];
      
      let bestPatternMatch = null;
      
      for (const patternDef of patternDefs) {
        const tmpMatches = [];
        let match;
        let count = 0;
        // Create a new regex instance for each iteration to reset lastIndex
        const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags);
        
        while ((match = regex.exec(communityHtml)) !== null) {
          count++;
          let handle, name;
          if (match[2]) {
            handle = match[2];
            name = match[match.length - 1];
          } else if (match[1]) {
            handle = match[1];
            name = match[2];
          }
          
          if (handle && !seenHandles.has(handle) && handle !== handle) {
            tmpMatches.push({ handle, name: (name || 'Unknown').trim().substring(0, 50) });
          }
        }
        
        if (count > 0) {
          console.log(`  ${patternDef.name}: Found ${count} matches, ${tmpMatches.length} new items`);
          if (tmpMatches.length > bestPatternMatch?.matches?.length || !bestPatternMatch) {
            bestPatternMatch = { pattern: patternDef.name, matches: tmpMatches, count };
          }
        }
      }
      
      if (bestPatternMatch && bestPatternMatch.matches.length > 0) {
        console.log(`✅ [DSPACE] Best match: ${bestPatternMatch.pattern} (${bestPatternMatch.matches.length} items):`);
        
        for (const item of bestPatternMatch.matches) {
          seenHandles.add(item.handle);
          pageItems.add(item.handle);
          const cleanName = extractUnitCode(item.name);
          items.push({
            handle: item.handle,
            name: cleanName,
            url: `${baseUrl}/handle/${item.handle}`
          });
          pageItemCount++;
        }
        
        bestPatternMatch.matches.slice(0, 5).forEach(item => {
          const cleanName = extractUnitCode(item.name);
          console.log(`   - ${item.handle}: ${cleanName}`);
        });
        if (bestPatternMatch.matches.length > 5) {
          console.log(`   ... and ${bestPatternMatch.matches.length - 5} more`);
        }
      } else {
        console.log(`⚠️  [DSPACE] NO REGEX PATTERNS MATCHED`);
        const handleCount = (communityHtml.match(/\/handle\/\d+\/\d+/g) || []).length;
        console.log(`📝 [DSPACE] HTML contains ${handleCount} handle references, but none matched our patterns`);
        
        const sampleMatch = communityHtml.match(/\/handle\/\d+\/\d+[^>]{0,200}>/);
        if (sampleMatch) {
          console.log(`📋 [DSPACE] Sample: ${sampleMatch[0].substring(0, 150)}`);
        }
      }

      console.log(`✅ [DSPACE] Page ${pageCount}: Found ${pageItemCount} new items (Total: ${items.length})`);

      // Auto-detect actual page size from first page
      if (actualPageSize === null && pageItemCount > 0) {
        actualPageSize = pageItemCount;
        console.log(`📊 [DSPACE] Detected page size: ${actualPageSize} items per page`);
      }

      // Continue pagination if we got items on this page
      if (pageItemCount > 0) {
        // We got items, so increment offset for next page
        offset += pageItemCount; // Increment by actual count, not limit
        // Continue to next page (we'll stop when we get 0 items)
      } else {
        // No items on this page = we've reached the end
        hasMore = false;
        console.log(`✅ [DSPACE] Pagination complete: Reached end of results`);
      }
    }

    if (pageCount >= MAX_PAGES) {
      console.warn(`⚠️  [DSPACE] Reached maximum page limit (${MAX_PAGES}), but there may be more items. Found ${items.length} items so far.`);
    }

    console.log(`📄 [DSPACE] Found ${items.length} total items in community ${handle}`);
    res.json({ ok: true, items });
  } catch (error) {
    console.error('[DSPACE] Error fetching community items:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/elib/dspace/item-pdfs?handle=123456789/10275 - Get PDF download links from item
app.get('/api/elib/dspace/item-pdfs', async (req, res) => {
  try {
    const { handle } = req.query;
    if (!handle) return res.status(400).json({ ok: false, error: 'Item handle required' });

    const baseUrl = 'https://pastpapers.ku.ac.ke';
    const itemUrl = `${baseUrl}/handle/${handle}`;

    // Fetch item page
    const itemHtml = await new Promise((resolve, reject) => {
      https.get(itemUrl, {
        timeout: 15000,
        rejectUnauthorized: false,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, (response) => {
        let html = '';
        response.on('data', chunk => html += chunk);
        response.on('end', () => resolve(html));
      }).on('error', reject);
    });

    // Extract PDF bitstream URLs
    const pdfRegex = /href=["']([^"']*\/bitstream\/handle\/[^"']*\.pdf[^"']*)["']/gi;
    const pdfs = [];
    let match;
    const seenUrls = new Set();

    while ((match = pdfRegex.exec(itemHtml)) !== null) {
      let pdfUrl = match[1];
      
      // Decode HTML entities
      pdfUrl = pdfUrl.replace(/&amp;/g, '&')
                     .replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>')
                     .replace(/&quot;/g, '"');

      if (!pdfUrl.startsWith('http')) {
        pdfUrl = baseUrl + pdfUrl;
      }

      // Avoid duplicates
      if (!seenUrls.has(pdfUrl)) {
        seenUrls.add(pdfUrl);
        
        // Extract filename from URL
        const urlObj = new URL(pdfUrl);
        let filename = urlObj.pathname.split('/').pop();
        filename = decodeURIComponent(filename) || 'document.pdf';

        pdfs.push({
          url: pdfUrl,
          filename,
          size: urlObj.searchParams.get('sequence')
        });
      }
    }

    console.log(`📎 [DSPACE] Found ${pdfs.length} PDF(s) in item ${handle}`);
    res.json({ ok: true, pdfs });
  } catch (error) {
    console.error('[DSPACE] Error fetching item PDFs:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// === Auto-Download from URL Endpoints ===
const autoDownloadProcesses = new Map();

// POST /api/elib/bulk-upload-pastpapers/start - START URL-BASED DOWNLOAD
app.post('/api/elib/bulk-upload-pastpapers/start', async (req, res) => {
  try {
    const { sourceUrl, userId, advancedOptions, asSubmission } = req.body;

    if (!sourceUrl?.trim()) {
      return res.status(400).json({ ok: false, error: 'Source URL is required' });
    }

    // Validate URL
    try {
      new URL(sourceUrl);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid URL format' });
    }

    const processId = crypto.randomUUID();
    const stopFlag = { stopped: false };

    const downloadProcess = {
      id: processId,
      status: 'running',
      sourceUrl,
      userId,
      asSubmission: asSubmission || false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      stats: {
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      },
      stopFlag,
      files: []
    };

    autoDownloadProcesses.set(processId, downloadProcess);
    console.log(`📥 [AUTO-DOWNLOAD-${processId}] Started bulk download from: ${sourceUrl}`);

    // Start background download process
    (async () => {
      try {
        // Create downloads directory if it doesn't exist
        const downloadDir = path.join(process.cwd(), 'public', 'downloads');
        if (!fs.existsSync(downloadDir)) {
          fs.mkdirSync(downloadDir, { recursive: true });
        }

        console.log(`📥 [AUTO-DOWNLOAD-${processId}] Fetching webpage...`);
        
        // Fetch the webpage HTML using Puppeteer for JavaScript rendering
        let pageHtml = '';
        let browser;
        
        try {
          // Try using Puppeteer first (for JavaScript-rendered content)
          browser = await puppeteer.launch({
            headless: 'new',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu'
            ]
          });
          
          const page = await browser.newPage();
          page.setDefaultNavigationTimeout(45000);
          page.setDefaultTimeout(45000);
          
          // Set a user agent to avoid blocking
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          
          console.log(`⏳ [AUTO-DOWNLOAD-${processId}] Navigating to ${sourceUrl}...`);
          await page.goto(sourceUrl, { waitUntil: 'networkidle2', timeout: 45000 });
          
          // Extra wait for dynamic content - wait for any lazy-loaded elements
          console.log(`⏳ [AUTO-DOWNLOAD-${processId}] Waiting for dynamic content to load...`);
          await page.waitForTimeout(3000); // Wait 3 seconds for AJAX/dynamic content
          
          // Also try scrolling to trigger lazy loading
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
          await page.waitForTimeout(1000);
          
          pageHtml = await page.content();
          
          // Log HTML size for debugging
          console.log(`📊 [AUTO-DOWNLOAD-${processId}] HTML size: ${pageHtml.length} characters`);
          
          // Log a sample of the HTML to see what we're getting
          if (pageHtml.includes('bitstream')) {
            console.log(`✓ [AUTO-DOWNLOAD-${processId}] Found 'bitstream' in HTML`);
          } else {
            console.log(`✗ [AUTO-DOWNLOAD-${processId}] No 'bitstream' found in HTML - links may be loaded via AJAX`);
          }
          
          await browser.close();
          
          console.log(`✅ [AUTO-DOWNLOAD-${processId}] Successfully fetched with Puppeteer`);
        } catch (puppeteerError) {
          console.warn(`⚠️  [AUTO-DOWNLOAD-${processId}] Puppeteer failed, falling back to HTTP:`, puppeteerError.message);
          
          // Close browser if it's still open
          if (browser) {
            try { await browser.close(); } catch (e) { }
          }
          
          // Fallback to simple HTTP request
          pageHtml = await new Promise((resolve, reject) => {
            const protocol = sourceUrl.startsWith('https') ? https : http;
            const options = { 
              timeout: 30000,
              rejectUnauthorized: false,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            };
            protocol.get(sourceUrl, options, (response) => {
              if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
              }
              let html = '';
              response.on('data', chunk => html += chunk);
              response.on('end', () => resolve(html));
            }).on('error', reject);
          });
          
          console.log(`✅ [AUTO-DOWNLOAD-${processId}] Successfully fetched with HTTP fallback`);
        }

        console.log(`📄 [AUTO-DOWNLOAD-${processId}] Parsing HTML for PDF links...`);
        
        // Parse HTML and find all PDF links using multiple regex patterns
        let pdfLinks = [];
        
        // Pattern 1: href="..." or href='...' (standard links)
        const pattern1 = /href=["']([^"']*\.pdf[^"']*?)["']/gi;
        let match;
        while ((match = pattern1.exec(pageHtml)) !== null) {
          pdfLinks.push(match[1]);
        }
        
        // Pattern 2: Bitstream format - /bitstream/handle/... with PDF (with or without query params)
        const pattern2 = /\/bitstream\/handle\/[^\s"'<>&]*\.pdf[^\s"'<>&]*/gi;
        while ((match = pattern2.exec(pageHtml)) !== null) {
          pdfLinks.push(match[0]);
        }
        
        // Pattern 3: data-href="..." (for JavaScript frameworks)
        const pattern3 = /data-href=["']([^"']*\.pdf[^"']*?)["']/gi;
        while ((match = pattern3.exec(pageHtml)) !== null) {
          pdfLinks.push(match[1]);
        }
        
        // Pattern 4: Other data attributes (data-url, data-pdf, etc)
        const pattern4 = /(?:href|data-url|data-pdf|url)\s*=\s*["']([^"']*?\.pdf[^"']*?)["']/gi;
        while ((match = pattern4.exec(pageHtml)) !== null) {
          pdfLinks.push(match[1]);
        }
        
        // Pattern 5: Direct https://...pdf links with query params
        const pattern5 = /(https?:\/\/[^\s"'<>]*\.pdf[^\s"'<>]*)/gi;
        while ((match = pattern5.exec(pageHtml)) !== null) {
          let url = match[1];
          // Clean up common HTML entity encodings
          url = url.replace(/&quot;/g, '').replace(/&amp;/g, '&');
          pdfLinks.push(url);
        }
        
        // Pattern 6: Look for bitstream links without leading slash
        const pattern6 = /bitstream\/handle\/[^\s"'<>&]*\.pdf[^\s"'<>&]*/gi;
        while ((match = pattern6.exec(pageHtml)) !== null) {
          pdfLinks.push(match[0]);
        }
        
        // Pattern 7: DSpace bitstream with query parameters explicitly
        const pattern7 = /(bitstream\/handle\/[^\s"'<>]*\?[^\s"'<>]*)/gi;
        while ((match = pattern7.exec(pageHtml)) !== null) {
          pdfLinks.push(match[1]);
        }

        // Remove duplicates
        pdfLinks = [...new Set(pdfLinks)];
        
        // Filter out invalid entries (too short, not actually URLs)
        pdfLinks = pdfLinks.filter(link => link && link.length > 5 && !link.includes('<') && !link.includes('>'));
        
        // Clean up and convert URLs
        const baseUrlObj = new URL(sourceUrl);
        const baseUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}`;
        pdfLinks = pdfLinks.map(link => {
          // Clean up the URL
          link = link.split(/['"]/)[0].trim(); // Remove trailing quotes
          link = link.split(/[\s&lt;&gt;]/)[0]; // Remove trailing whitespace or HTML entities
          
          // Decode URL-encoded characters
          try {
            link = decodeURIComponent(link);
          } catch (e) {
            // If decoding fails, use original
          }
          
          if (link.startsWith('http')) return link;
          if (link.startsWith('/bitstream')) return baseUrl + link;
          if (link.startsWith('bitstream')) return baseUrl + '/' + link;
          if (link.startsWith('/')) return baseUrl + link;
          if (link.startsWith('./')) return baseUrl + '/' + link.substring(2);
          if (link.startsWith('../')) return baseUrl + '/' + link;
          return baseUrl + '/' + link;
        });
        
        // Additional validation - make sure all links are valid URLs
        pdfLinks = pdfLinks.filter(link => {
          try {
            new URL(link);
            return true;
          } catch (e) {
            return false;
          }
        });

        // If no direct PDF links found, try to extract DSpace item handles from the page
        if (pdfLinks.length === 0) {
          console.log(`📋 [AUTO-DOWNLOAD-${processId}] No direct PDF links found, checking for DSpace items...`);
          
          // Check if this is a DSpace community/collection URL
          const handlePattern = /\/handle\/(\d+\/\d+)(\/[^?]*)?(\?.+)?/;
          const handleMatch = sourceUrl.match(handlePattern);
          
          if (handleMatch) {
            const communityHandle = handleMatch[1];
            const additionalPath = handleMatch[2] || ''; // e.g., /recent-submissions
            const sourceUrlObj = new URL(sourceUrl);
            const dspaceBaseUrl = `${sourceUrlObj.protocol}//${sourceUrlObj.host}`;
            
            console.log(`🔗 [AUTO-DOWNLOAD-${processId}] Detected DSpace community: ${communityHandle}`);
            if (additionalPath) {
              console.log(`🔗 [AUTO-DOWNLOAD-${processId}] Additional path: ${additionalPath}`);
            }
            console.log(`📄 [AUTO-DOWNLOAD-${processId}] Using paginated endpoint to fetch ALL items...`);
            
            // Helper function to extract clean unit code from filename
            const extractUnitCode = (filename) => {
              if (!filename) return 'Unknown';
              
              // Try to extract unit code patterns like "UCU 104", "EAE 301", etc.
              const patterns = [
                // Pattern 1: Code-Space-Number (e.g., "UCU 104")
                /([A-Z]{2,4}\s*\d{2,4})/,
                // Pattern 2: Code+Number without space (e.g., "UCU104")
                /([A-Z]{2,4}\d{2,4})/,
                // Pattern 3: Code-Number-Text (e.g., "UCU110 Communication")
                /^([A-Z]{2,4}\d{2,4})/,
              ];
              
              for (const pattern of patterns) {
                const match = filename.match(pattern);
                if (match) {
                  // Clean up the match - ensure space between code and number
                  let code = match[1].trim();
                  code = code.replace(/([A-Z]+)(\d+)/, '$1 $2'); // Add space if missing
                  return code;
                }
              }
              
              // Fallback: return first 20 chars
              return filename.substring(0, 20).trim();
            };
            
            try {
              // Fetch all items from community with pagination
              let allItems = [];
              let offset = 0;
              let hasMore = true;
              let pageCount = 0;
              const MAX_PAGES = 10000;
              
              while (hasMore && pageCount < MAX_PAGES) {
                pageCount++;
                const limit = 20; // DSpace default page size
                const basePath = additionalPath ? `/handle/${communityHandle}${additionalPath}` : `/handle/${communityHandle}`;
                const communityUrl = `${dspaceBaseUrl}${basePath}?offset=${offset}&limit=${limit}`;
                
                console.log(`  📄 [AUTO-DOWNLOAD-${processId}] Fetching page ${pageCount} (offset=${offset}, total items so far: ${allItems.length})...`);
                console.log(`  🔗 URL: ${communityUrl}`);
                
                const communityHtml = await new Promise((resolve, reject) => {
                  const protocol = communityUrl.startsWith('https') ? https : http;
                  protocol.get(communityUrl, {
                    timeout: 15000,
                    rejectUnauthorized: false,
                    headers: { 
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                      'Accept': 'text/html,application/xhtml+xml',
                      'Accept-Language': 'en-US,en;q=0.9',
                      'Cache-Control': 'no-cache'
                    },
                    followRedirect: true
                  }, (response) => {
                    let html = '';
                    response.on('data', chunk => html += chunk);
                    response.on('end', () => {
                      console.log(`  📥 Response size: ${html.length} bytes`);
                      resolve(html);
                    });
                  }).on('error', reject);
                });
                
                // Extract item handles from this page - simple, direct approach
                let pageItemCount = 0;
                const seenHandles = new Set(allItems.map(i => i.handle));
                
                // Extract all handle references from the page
                // Format: /handle/XXXXX/XXXXX with some text nearby
                const handleRegex = /\/handle\/(\d+\/\d+)['"]\s*[^>]*>([^<]{0,100})<\/a>/g;
                let match;
                const pageItems = [];
                
                while ((match = handleRegex.exec(communityHtml)) !== null) {
                  const handle = match[1];
                  const text = (match[2] || 'Unknown').trim().substring(0, 50);
                  
                  // Only add if we haven't seen this handle before and it's not the community itself
                  if (handle && !seenHandles.has(handle) && handle !== communityHandle) {
                    pageItems.push({ handle, name: text });
                    seenHandles.add(handle);
                  }
                }
                
                // Add items to allItems
                for (const item of pageItems) {
                  const cleanName = extractUnitCode(item.name);
                  allItems.push({ handle: item.handle, name: cleanName });
                  pageItemCount++;
                }
                
                console.log(`  ✅ Page ${pageCount}: Found ${pageItemCount} new items (Total: ${allItems.length})`);
                if (pageItems.length > 0) {
                  pageItems.slice(0, 3).forEach(item => {
                    const cleanName = extractUnitCode(item.name);
                    console.log(`     - ${item.handle}: ${cleanName}`);
                  });
                  if (pageItems.length > 3) {
                    console.log(`     ... and ${pageItems.length - 3} more`);
                  }
                }
                
                // Continue pagination if we got items on this page
                if (pageItemCount > 0) {
                  offset += limit; // Move to next page
                } else {
                  hasMore = false; // No items = end of results
                  console.log(`  ✅ Pagination complete: Reached end of results`);
                }
              }
              
              if (pageCount >= MAX_PAGES) {
                console.warn(`⚠️  [AUTO-DOWNLOAD-${processId}] Reached maximum page limit (${MAX_PAGES}), but there may be more items. Found ${allItems.length} items so far.`);
              }
              
              console.log(`🔗 [AUTO-DOWNLOAD-${processId}] Found ${allItems.length} DSpace item(s) across all pages`);
              
              if (allItems.length > 0) {
                // For each item handle, fetch the item page and extract PDF link
                console.log(`📥 [AUTO-DOWNLOAD-${processId}] Fetching PDF links from ${allItems.length} items...`);
                
                for (const item of allItems) {
                  if (stopFlag.stopped) break;
                  
                  try {
                    const itemUrl = dspaceBaseUrl + '/handle/' + item.handle;
                    console.log(`  📄 Fetching item: ${item.handle}`);
                    
                    // Fetch item HTML
                    const itemHtml = await new Promise((resolve, reject) => {
                      const protocol = itemUrl.startsWith('https') ? https : http;
                      const options = {
                        timeout: 10000,
                        rejectUnauthorized: false,
                        headers: {
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                        }
                      };
                      protocol.get(itemUrl, options, (response) => {
                        if (response.statusCode !== 200) {
                          reject(new Error(`HTTP ${response.statusCode}`));
                          return;
                        }
                        let html = '';
                        response.on('data', chunk => html += chunk);
                        response.on('end', () => resolve(html));
                      }).on('error', reject);
                    });
                    
                    // Extract PDF bitstream URLs from item HTML - multiple patterns
                    const extractedUrls = new Set();
                    
                    console.log(`  📝 Analyzing item HTML (${itemHtml.length} bytes) for PDF links...`);
                    
                    // Pattern 1: Meta tag citation_pdf_url (most reliable)
                    const metaPattern = /name=["']citation_pdf_url["']\s+content=["']([^"']+)["']/i;
                    let metaMatch = metaPattern.exec(itemHtml);
                    let foundByMeta = 0;
                    if (metaMatch) {
                      let pdfUrl = metaMatch[1].trim();
                      foundByMeta++;
                      console.log(`    [Meta] Found: ${pdfUrl}`);
                      
                      // Ensure absolute URL
                      if (!pdfUrl.startsWith('http')) {
                        pdfUrl = dspaceBaseUrl + (pdfUrl.startsWith('/') ? '' : '/') + pdfUrl;
                      }
                      
                      try {
                        new URL(pdfUrl);
                        extractedUrls.add(pdfUrl);
                      } catch (e) {
                        console.log(`    ⚠️  Invalid URL from meta: ${pdfUrl}`);
                      }
                    }
                    
                    // Pattern 2: Download button href (with HTML entity decoding)
                    const downloadPattern = /href=["']([^"']*?\.pdf[^"']*)["']/gi;
                    let match;
                    let foundByPattern2 = 0;
                    while ((match = downloadPattern.exec(itemHtml)) !== null) {
                      let pdfUrl = match[1].trim();
                      foundByPattern2++;
                      
                      // Decode HTML entities
                      pdfUrl = pdfUrl.replace(/&amp;/g, '&')
                                     .replace(/&lt;/g, '<')
                                     .replace(/&gt;/g, '>')
                                     .replace(/&quot;/g, '"')
                                     .replace(/&#x27;/g, "'")
                                     .replace(/&#x2F;/g, '/');
                      
                      console.log(`    [Download] Found: ${pdfUrl.substring(0, 100)}...`);
                      
                      // Ensure absolute URL
                      if (!pdfUrl.startsWith('http')) {
                        pdfUrl = dspaceBaseUrl + (pdfUrl.startsWith('/') ? '' : '/') + pdfUrl;
                      }
                      
                      // Ensure sequence parameters
                      if (!pdfUrl.includes('sequence') && !pdfUrl.includes('?')) {
                        pdfUrl += '?sequence=1&isAllowed=y';
                      } else if (!pdfUrl.includes('sequence') && pdfUrl.includes('?')) {
                        pdfUrl += '&sequence=1&isAllowed=y';
                      }
                      
                      try {
                        new URL(pdfUrl);
                        extractedUrls.add(pdfUrl);
                      } catch (e) {
                        console.log(`    ⚠️  Invalid URL: ${pdfUrl}`);
                      }
                    }
                    
                    // Pattern 3: bitstream in href with handle pattern
                    const bitstreamPattern = /href=["']([^"']*bitstream[^"']*\.pdf[^"']*)["']/gi;
                    let foundByPattern3 = 0;
                    while ((match = bitstreamPattern.exec(itemHtml)) !== null) {
                      let pdfUrl = match[1].trim();
                      foundByPattern3++;
                      
                      // Decode HTML entities
                      pdfUrl = pdfUrl.replace(/&amp;/g, '&')
                                     .replace(/&lt;/g, '<')
                                     .replace(/&gt;/g, '>')
                                     .replace(/&quot;/g, '"');
                      
                      console.log(`    [Bitstream] Found: ${pdfUrl.substring(0, 100)}...`);
                      
                      if (!pdfUrl.startsWith('http')) {
                        pdfUrl = dspaceBaseUrl + (pdfUrl.startsWith('/') ? '' : '/') + pdfUrl;
                      }
                      
                      if (!pdfUrl.includes('sequence')) {
                        pdfUrl += (pdfUrl.includes('?') ? '&' : '?') + 'sequence=1&isAllowed=y';
                      }
                      
                      try {
                        new URL(pdfUrl);
                        extractedUrls.add(pdfUrl);
                      } catch (e) {
                        console.log(`    ⚠️  Invalid URL: ${pdfUrl}`);
                      }
                    }
                    
                    console.log(`  ✅ Found ${extractedUrls.size} unique PDF URL(s) in item ${item.handle}`);
                    console.log(`     Patterns matched - Meta: ${foundByMeta}, Download: ${foundByPattern2}, Bitstream: ${foundByPattern3}`);
                    
                    extractedUrls.forEach(url => {
                      console.log(`     Adding: ${url.substring(0, 100)}...`);
                      pdfLinks.push(url);
                    });
                  } catch (err) {
                    console.warn(`  ⚠️  Error processing item ${item.handle}:`, err.message);
                  }
                  
                  // Remove duplicates after adding item PDFs
                  pdfLinks = [...new Set(pdfLinks)];
                }
              }
            } catch (apiErr) {
              console.warn(`⚠️  [AUTO-DOWNLOAD-${processId}] Error fetching DSpace items:`, apiErr.message);
            }
          }
        }

        downloadProcess.stats.total = pdfLinks.length;
        console.log(`📚 [AUTO-DOWNLOAD-${processId}] Found ${pdfLinks.length} PDF(s)`);

        if (pdfLinks.length === 0) {
          console.warn(`⚠️  [AUTO-DOWNLOAD-${processId}] No PDF links found on the page`);
          downloadProcess.status = 'completed';
          downloadProcess.completedAt = new Date().toISOString();
          return;
        }

        // Validate URLs and collect download info (no actual download to server)
        console.log(`📚 [AUTO-DOWNLOAD-${processId}] Found ${pdfLinks.length} PDF URL(s), removing duplicates...`);
        
        // Remove duplicate URLs (case-insensitive)
        const uniqueUrls = new Map();
        for (const url of pdfLinks) {
          const normalized = url.toLowerCase();
          if (!uniqueUrls.has(normalized)) {
            uniqueUrls.set(normalized, url);
          }
        }
        pdfLinks = Array.from(uniqueUrls.values());
        
        console.log(`📚 [AUTO-DOWNLOAD-${processId}] After deduplication: ${pdfLinks.length} unique PDF(s)`);
        
        const downloadWithLimit = async () => {
          const MAX_PARALLEL_VALIDATION = 3;
          let index = 0;

          const validateOne = async () => {
            if (stopFlag.stopped) return;
            if (index >= pdfLinks.length) return;

            const linkIndex = index++;
            const pdfUrl = pdfLinks[linkIndex];
            
            try {
              console.log(`✓ [AUTO-DOWNLOAD-${processId}] Validating (${linkIndex + 1}/${pdfLinks.length}): ${pdfUrl.substring(0, 80)}...`);
              
              // Try both HEAD and GET requests - some servers block HEAD
              await new Promise((resolve, reject) => {
                const protocol = pdfUrl.startsWith('https') ? https : http;
                let requestComplete = false;
                
                const timeout = setTimeout(() => {
                  if (!requestComplete) {
                    reject(new Error('Timeout'));
                  }
                }, 10000);

                const options = {
                  timeout: 10000,
                  rejectUnauthorized: false,
                  method: 'HEAD',
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/pdf, */*',
                    'Accept-Encoding': 'gzip, deflate',
                    'Referer': 'https://pastpapers.ku.ac.ke/',
                    'Connection': 'close'
                  }
                };

                const req = protocol.request(pdfUrl, options, (response) => {
                  requestComplete = true;
                  clearTimeout(timeout);
                  
                  const statusCode = response.statusCode;
                  const contentLength = parseInt(response.headers['content-length'] || '0', 10);
                  const contentType = response.headers['content-type'] || '';
                  
                  console.log(`  [HEAD] Status: ${statusCode}, Size: ${contentLength}, Type: ${contentType.substring(0, 40)}`);
                  
                  response.destroy();
                  
                  // HEAD failed - try GET with range request
                  if (statusCode >= 400 || statusCode === 405) {
                    console.log(`  [HEAD failed - trying GET]`);
                    
                    const getOptions = Object.assign({}, options, {
                      method: 'GET',
                      headers: Object.assign({}, options.headers, {
                        'Range': 'bytes=0-5000' // Just get first 5KB to verify it's a real PDF
                      })
                    });
                    
                    const getReq = protocol.request(pdfUrl, getOptions, (getRes) => {
                      requestComplete = true;
                      const getStatusCode = getRes.statusCode;
                      let dataReceived = 0;
                      let pdfSignatureFound = false;
                      
                      getRes.on('data', (chunk) => {
                        dataReceived += chunk.length;
                        // Check for PDF signature: %PDF
                        if (!pdfSignatureFound && chunk.includes(Buffer.from('%PDF'))) {
                          pdfSignatureFound = true;
                          console.log(`  ✅ [GET] Confirmed PDF (${dataReceived} bytes received)`);
                        }
                      });
                      
                      getRes.on('end', () => {
                        if ((getStatusCode === 200 || getStatusCode === 206) && dataReceived > 0) {
                          console.log(`  ✅ [GET] Valid (${getStatusCode}): received ${dataReceived} bytes`);
                          resolve();
                        } else {
                          reject(new Error(`GET returned ${getStatusCode} with ${dataReceived} bytes`));
                        }
                      });
                      
                      getRes.on('error', reject);
                    });
                    
                    getReq.on('timeout', () => {
                      getReq.abort();
                      reject(new Error('GET request timeout'));
                    });
                    
                    getReq.on('error', reject);
                    getReq.end();
                    return;
                  }
                  
                  // HEAD succeeded
                  if (statusCode >= 200 && statusCode < 300) {
                    if (contentLength > 0) {
                      if (contentLength < 1000) {
                        console.warn(`  ⚠️  Suspiciously small: ${contentLength} bytes (may be error page)`);
                        // Still allow it - let download endpoint handle it
                      }
                      console.log(`  ✅ Valid (${statusCode}, ${contentLength} bytes)`);
                      resolve();
                    } else {
                      console.log(`  ✅ Valid (${statusCode}, size unknown)`);
                      resolve();
                    }
                  } else {
                    reject(new Error(`HTTP ${statusCode}`));
                  }
                });

                req.on('timeout', () => {
                  if (!requestComplete) {
                    req.abort();
                    reject(new Error('Request timeout'));
                  }
                });

                req.on('error', (err) => {
                  if (!requestComplete) {
                    reject(err);
                  }
                });

                req.end();
              });

              downloadProcess.stats.successful++;
              downloadProcess.stats.processed++;
              
              // Extract filename from URL
              const urlParts = pdfUrl.split('/');
              let filename = urlParts[urlParts.length - 1];
              // Remove query parameters for filename
              filename = filename.split('?')[0];
              // URL decode the filename
              try {
                filename = decodeURIComponent(filename);
              } catch (e) {
                // If decode fails, use as-is
              }
              
              downloadProcess.files.push({ 
                filename, 
                url: pdfUrl, 
                status: 'ready',
                downloadUrl: `http://localhost:5000/api/elib/download-pdf?url=${encodeURIComponent(pdfUrl)}&filename=${encodeURIComponent(filename)}`
              });
              console.log(`✅ [AUTO-DOWNLOAD-${processId}] Ready: ${filename}`);

            } catch (err) {
              downloadProcess.stats.failed++;
              downloadProcess.stats.processed++;
              downloadProcess.files.push({ 
                url: pdfUrl, 
                status: 'failed', 
                error: err.message,
                filename: `paper_${linkIndex}.pdf`
              });
              console.warn(`❌ [AUTO-DOWNLOAD-${processId}] Failed to validate ${pdfUrl}: ${err.message}`);
            }

            // Continue with next file
            await validateOne();
          };

          // Start parallel validation
          const promises = Array(Math.min(MAX_PARALLEL_VALIDATION, pdfLinks.length))
            .fill(null)
            .map(() => validateOne());
          await Promise.all(promises);
        };

        await downloadWithLimit();

        downloadProcess.status = 'completed';
        downloadProcess.completedAt = new Date().toISOString();
        console.log(`✅ [AUTO-DOWNLOAD-${processId}] Bulk download completed: ${downloadProcess.stats.successful}/${downloadProcess.stats.total} successful`);

        // Auto-cleanup after 24 hours
        setTimeout(() => {
          autoDownloadProcesses.delete(processId);
        }, 86400000);

      } catch (err) {
        console.error(`❌ [AUTO-DOWNLOAD-${processId}] Error:`, err.message);
        downloadProcess.status = 'failed';
        downloadProcess.error = err.message;
        downloadProcess.completedAt = new Date().toISOString();
      }
    })();

    res.json({ ok: true, process: downloadProcess });

  } catch (error) {
    console.error('❌ [AUTO-DOWNLOAD-START] Error:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to start download' });
  }
});

// GET /api/elib/bulk-upload-pastpapers/processes - GET ALL DOWNLOAD PROCESSES
app.get('/api/elib/bulk-upload-pastpapers/processes', (req, res) => {
  try {
    const processes = Array.from(autoDownloadProcesses.values())
      .map(p => {
        const { stopFlag, ...rest } = p;
        return rest;
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 20);

    res.json({ ok: true, processes });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to list processes' });
  }
});

// GET /api/elib/bulk-upload-pastpapers/status/:processId - GET DOWNLOAD STATUS
app.get('/api/elib/bulk-upload-pastpapers/status/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    const process = autoDownloadProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ ok: false, error: 'Process not found' });
    }

    // Don't expose stopFlag
    const { stopFlag, ...safeProcess } = process;
    res.json({ ok: true, process: safeProcess });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/elib/bulk-upload-pastpapers/pause/:processId - PAUSE DOWNLOAD
app.post('/api/elib/bulk-upload-pastpapers/pause/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    const process = autoDownloadProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ ok: false, error: 'Process not found' });
    }

    process.status = 'paused';
    res.json({ ok: true, message: 'Download paused' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/elib/bulk-upload-pastpapers/resume/:processId - RESUME DOWNLOAD
app.post('/api/elib/bulk-upload-pastpapers/resume/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    const process = autoDownloadProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ ok: false, error: 'Process not found' });
    }

    process.status = 'running';
    res.json({ ok: true, message: 'Download resumed' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/elib/bulk-upload-pastpapers/stop/:processId - STOP DOWNLOAD
app.post('/api/elib/bulk-upload-pastpapers/stop/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    const process = autoDownloadProcesses.get(processId);

    if (!process) {
      return res.status(404).json({ ok: false, error: 'Process not found' });
    }

    process.status = 'stopped';
    if (process.stopFlag) process.stopFlag.stopped = true;
    autoDownloadProcesses.delete(processId);

    res.json({ ok: true, message: 'Download stopped' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/elib/download-pdf - DOWNLOAD PDF TO BROWSER WITH BETTER HANDLING
app.get('/api/elib/download-pdf', async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({ ok: false, error: 'URL is required' });
    }

    // Decode the URL
    let pdfUrl;
    try {
      pdfUrl = decodeURIComponent(url);
    } catch (e) {
      pdfUrl = url;
    }

    // Validate it's actually a URL
    try {
      new URL(pdfUrl);
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'Invalid URL format' });
    }

    // Set response headers for download
    let downloadFilename = filename ? decodeURIComponent(filename) : 'document.pdf';
    // Clean filename
    downloadFilename = downloadFilename.replace(/[<>:"|?*]/g, '').trim();
    if (!downloadFilename) downloadFilename = 'document.pdf';

    console.log(`[PDF-DOWNLOAD-START] Downloading: ${downloadFilename} from ${pdfUrl.substring(0, 100)}...`);

    // Stream the PDF directly from source with better error handling
    const protocol = pdfUrl.startsWith('https') ? https : http;
    
    let timeoutHandle;
    let responseSent = false;
    let bytesReceived = 0;
    let expectedSize = 0;

    const options = {
      timeout: 180000, // 3 minutes for slow servers
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
        'Accept-Encoding': 'identity',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': pdfUrl.substring(0, pdfUrl.lastIndexOf('/') + 1),
        'DNT': '1',
        'Connection': 'keep-alive'
      }
    };

    // Set content disposition first
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');



    let requestHandle;
    let downloadAttempt = 0;
    
    const downloadWithRetry = (retryCount = 0) => {
      downloadAttempt++;
      console.log(`[PDF-DOWNLOAD] Attempt ${downloadAttempt}: ${downloadFilename} from ${pdfUrl.substring(0, 80)}...`);
      
      requestHandle = protocol.get(pdfUrl, options, (response) => {
        // Clear timeout once we get a response
        if (timeoutHandle) clearTimeout(timeoutHandle);

        const statusCode = response.statusCode;
        const contentType = response.headers['content-type'];
        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        
        console.log(`[PDF-DOWNLOAD] Attempt ${downloadAttempt}: Status ${statusCode} | Type: ${contentType} | Size: ${contentLength} bytes`);

        // Handle redirects (301, 302, 303, 307, 308)
        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          console.log(`[PDF-DOWNLOAD] Redirect (${statusCode}) to: ${response.headers.location}`);
          if (!responseSent) {
            response.destroy();
            let redirectUrl = response.headers.location;
            // Make redirect URL absolute if needed
            if (!redirectUrl.startsWith('http')) {
              redirectUrl = baseUrl + redirectUrl;
            }
            pdfUrl = redirectUrl;
            downloadWithRetry(0);
            responseSent = true;
          }
          return;
        }

        // Accept 200, 206 (partial content)
        if (statusCode !== 200 && statusCode !== 206) {
          console.warn(`[PDF-DOWNLOAD] Bad status ${statusCode} - trying fallback`);
          if (!responseSent) {
            response.destroy();
            
            // Fallback 1: Try with sequence params
            if (!pdfUrl.includes('sequence=') && retryCount < 1) {
              const newUrl = pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 'sequence=1&isAllowed=y';
              console.log(`[PDF-DOWNLOAD] Fallback 1: Trying with sequence params`);
              pdfUrl = newUrl;
              downloadWithRetry(retryCount + 1);
              responseSent = true;
              return;
            }
            
            // Fallback 2: Try with forceAuth parameter
            if (!pdfUrl.includes('forceAuth') && retryCount < 2) {
              const newUrl = pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 'forceAuth=y';
              console.log(`[PDF-DOWNLOAD] Fallback 2: Trying with forceAuth param`);
              pdfUrl = newUrl;
              downloadWithRetry(retryCount + 1);
              responseSent = true;
              return;
            }
            
            // All fallbacks exhausted
            res.status(statusCode || 500).setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              ok: false, 
              error: `Source server returned HTTP ${statusCode} after fallbacks`,
              filename: downloadFilename,
              attemptedUrl: pdfUrl
            }));
            responseSent = true;
          }
          return;
        }

        // Success - stream the PDF
        if (!responseSent) {
          const isPDF = !contentType || contentType.includes('application/pdf') || contentType.includes('application/octet-stream');
          res.setHeader('Content-Type', isPDF ? 'application/pdf' : (contentType || 'application/pdf'));

          if (contentLength > 0) {
            res.setHeader('Content-Length', contentLength);
          }

          console.log(`[PDF-DOWNLOAD] 📥 Streaming ${downloadFilename} (${contentLength} bytes)...`);
          
          response.on('error', (err) => {
            console.error(`[PDF-DOWNLOAD] Response stream error: ${err.message}`);
            if (!responseSent) {
              res.status(500).end();
              responseSent = true;
            }
          });

          response.on('end', () => {
            console.log(`[PDF-DOWNLOAD] ✅ Complete: ${downloadFilename}`);
          });

          response.pipe(res);
          responseSent = true;
        }
      });

      timeoutHandle = setTimeout(() => {
        if (!responseSent) {
          console.error(`[PDF-DOWNLOAD] Timeout (attempt ${downloadAttempt})`);
          if (requestHandle) requestHandle.destroy();
          
          if (retryCount < 2) {
            console.log(`[PDF-DOWNLOAD] Retrying... (${retryCount + 1}/2)`);
            downloadWithRetry(retryCount + 1);
          } else {
            res.status(504).setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              ok: false, 
              error: 'Download timeout',
              filename: downloadFilename
            }));
            responseSent = true;
          }
        }
      }, 180000);

      requestHandle.on('error', (err) => {
        console.error(`[PDF-DOWNLOAD] Request error (${downloadAttempt}): ${err.message}`);
        if (timeoutHandle) clearTimeout(timeoutHandle);
        
        if (!responseSent) {
          if (retryCount < 2) {
            console.log(`[PDF-DOWNLOAD] Retrying after error...`);
            downloadWithRetry(retryCount + 1);
          } else {
            res.status(502).setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              ok: false, 
              error: `Failed after ${downloadAttempt} attempts: ${err.message}`,
              filename: downloadFilename
            }));
            responseSent = true;
          }
        }
      });
    };

    downloadWithRetry();

    // Handle client disconnect
    res.on('close', () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (requestHandle) requestHandle.destroy();
      console.log(`[PDF-DOWNLOAD] Client disconnected for ${downloadFilename}`);
    });

  } catch (error) {
    console.error('❌ [PDF-DOWNLOAD] Error:', error);
    if (!res.headersSent) {
      res.status(500).setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        ok: false, 
        error: error.message || 'Failed to download PDF' 
      }));
    }
  }
});

// === DOWNLOAD FOLDER MANAGEMENT ENDPOINTS ===

// GET /api/elib/download-folders - LIST AVAILABLE FOLDERS
app.get('/api/elib/download-folders', async (req, res) => {
  try {
    // Default folders
    const defaultFolders = [
      { name: 'Downloads', path: 'Downloads', size: 0 },
      { name: 'Documents', path: 'Documents', size: 0 },
      { name: 'Books', path: 'Books', size: 0 },
      { name: 'Past Papers', path: 'Past Papers', size: 0 },
      { name: 'Research', path: 'Research', size: 0 }
    ];

    // Try to get user's folder preferences if authenticated
    let userFolders = [];
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && supabaseAdmin) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (user && !error) {
          // Get user's custom folders from localStorage-like storage (in preferences table if exists)
          const { data: prefs } = await supabaseAdmin
            .from('user_preferences')
            .select('download_folders')
            .eq('user_id', user.id)
            .single();
          
          if (prefs?.download_folders) {
            userFolders = prefs.download_folders;
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch user folders:', err.message);
    }

    const allFolders = [...defaultFolders, ...userFolders];
    
    res.json({ 
      ok: true, 
      folders: allFolders,
      defaultFolder: 'Downloads'
    });
  } catch (error) {
    console.error('Error listing folders:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to list folders' });
  }
});

// POST /api/elib/download-folders - CREATE NEW FOLDER
app.post('/api/elib/download-folders', async (req, res) => {
  try {
    const { folderName, parentFolder } = req.body;

    if (!folderName || !folderName.trim()) {
      return res.status(400).json({ ok: false, error: 'Folder name is required' });
    }

    // Validate folder name (no special characters)
    const sanitizedName = folderName.trim().replace(/[<>:"|?*]/g, '');
    if (!sanitizedName) {
      return res.status(400).json({ ok: false, error: 'Invalid folder name' });
    }

    // Create folder path (virtual path for storage reference)
    const basePath = parentFolder || 'Downloads';
    const folderPath = `${basePath}/${sanitizedName}`;

    // Get user's Downloads directory
    const userDownloadsDir = path.join(
      process.env.USERPROFILE || process.env.HOME || os.homedir(),
      'Downloads'
    );

    // Build the full file system path
    let fullFolderPath = userDownloadsDir;
    if (basePath !== 'Downloads') {
      // If parent is a subfolder, append it
      const subPath = basePath.replace(/^Downloads\//i, '');
      fullFolderPath = path.join(userDownloadsDir, subPath);
    }
    fullFolderPath = path.join(fullFolderPath, sanitizedName);

    console.log(`📁 Creating folder: ${fullFolderPath}`);

    // Create the folder on disk
    try {
      fs.mkdirSync(fullFolderPath, { recursive: true });
      console.log(`✅ Folder created successfully: ${fullFolderPath}`);
    } catch (fsError) {
      console.warn(`⚠️  Could not create physical folder: ${fsError.message}`);
      // Continue anyway - folder is still saved in localStorage
    }

    // Return success response
    res.json({
      ok: true,
      folderPath,
      fullPath: fullFolderPath,
      folder: {
        name: sanitizedName,
        path: folderPath,
        size: 0,
        created: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to create folder' });
  }
});

// DELETE /api/elib/download-folders - DELETE FOLDER FROM DISK AND STORAGE
app.delete('/api/elib/download-folders', async (req, res) => {
  try {
    const { folderPath } = req.body;

    if (!folderPath || !folderPath.trim()) {
      return res.status(400).json({ ok: false, error: 'Folder path is required' });
    }

    // Get user's Downloads directory
    const userDownloadsDir = path.join(
      process.env.USERPROFILE || process.env.HOME || os.homedir(),
      'Downloads'
    );

    // Build the full file system path
    let fullFolderPath = userDownloadsDir;
    const normalizedPath = folderPath.trim();
    
    if (normalizedPath && normalizedPath !== 'Downloads') {
      // If folder is a subfolder, append it
      const subPath = normalizedPath.replace(/^Downloads\//i, '');
      fullFolderPath = path.join(userDownloadsDir, subPath);
    } else if (normalizedPath === 'Downloads') {
      // Can't delete Downloads folder itself
      return res.status(400).json({ ok: false, error: 'Cannot delete Downloads folder' });
    }

    console.log(`🗑️  Deleting folder: ${fullFolderPath}`);

    // Check if folder exists
    if (!fs.existsSync(fullFolderPath)) {
      console.warn(`⚠️  Folder not found on disk: ${fullFolderPath}`);
      return res.json({
        ok: true,
        message: 'Folder already deleted or not found',
        folderPath: normalizedPath
      });
    }

    // Delete the folder and all contents recursively
    try {
      // Use fs.rmSync if available (Node 14.14+), otherwise use fallback
      if (fs.rmSync) {
        console.log(`🗑️  Using fs.rmSync to delete: ${fullFolderPath}`);
        fs.rmSync(fullFolderPath, { recursive: true, force: true });
      } else {
        // Fallback for older Node versions
        console.log(`🗑️  Using fallback recursive deletion for: ${fullFolderPath}`);
        const removeDir = (dirPath) => {
          if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(file => {
              const currentPath = path.join(dirPath, file);
              if (fs.lstatSync(currentPath).isDirectory()) {
                removeDir(currentPath);
              } else {
                fs.unlinkSync(currentPath);
              }
            });
            fs.rmdirSync(dirPath);
          }
        };
        removeDir(fullFolderPath);
      }
      
      console.log(`✅ [DELETE-FOLDER] Folder deleted successfully: ${fullFolderPath}`);
      
      res.json({
        ok: true,
        message: 'Folder deleted successfully',
        folderPath: normalizedPath,
        fullPath: fullFolderPath
      });
    } catch (fsError) {
      console.error(`❌ [DELETE-FOLDER] Error deleting folder: ${fsError.message}`);
      return res.status(500).json({
        ok: false,
        error: `Failed to delete folder: ${fsError.message}`
      });
    }
  } catch (error) {
    console.error('Error in delete folder endpoint:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to delete folder' });
  }
});

// POST /api/elib/download-folders/validate - VALIDATE FOLDER PATH
app.post('/api/elib/download-folders/validate', async (req, res) => {
  try {
    const { folderPath } = req.body;

    if (!folderPath || !folderPath.trim()) {
      return res.status(400).json({ ok: false, error: 'Folder path is required' });
    }

    // Basic validation - check if path is safe
    const path = folderPath.trim();
    const invalidChars = /[<>"|?*]/g;
    
    if (invalidChars.test(path)) {
      return res.json({ ok: false, error: 'Invalid characters in path' });
    }

    // Path is valid
    res.json({ ok: true, folderPath: path });
  } catch (error) {
    console.error('Error validating folder:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to validate folder' });
  }
});

// POST /api/elib/download-file-to-folder - DOWNLOAD AND SAVE FILE TO SPECIFIC FOLDER
app.post('/api/elib/download-file-to-folder', async (req, res) => {
  try {
    const { fileUrl, folderPath, filename } = req.body;

    if (!fileUrl || !folderPath || !filename) {
      return res.status(400).json({ ok: false, error: 'fileUrl, folderPath, and filename are required' });
    }

    console.log(`📥 [FILE-DOWNLOAD] Received request - folderPath: "${folderPath}", filename: "${filename}"`);

    // Get user's Downloads directory
    const userDownloadsDir = path.join(
      process.env.USERPROFILE || process.env.HOME || os.homedir(),
      'Downloads'
    );

    // Build the full file system path
    let fullFolderPath = userDownloadsDir;
    if (folderPath && folderPath !== 'Downloads') {
      // If folder is a subfolder, append it
      const subPath = folderPath.replace(/^Downloads\//i, '');
      fullFolderPath = path.join(userDownloadsDir, subPath);
    }

    console.log(`📥 [FILE-DOWNLOAD] Full folder path: "${fullFolderPath}"`);

    // Ensure folder exists
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
    }

    // Clean filename
    const cleanFilename = filename.replace(/[<>:"|?*]/g, '').trim() || 'download.pdf';
    const fullFilePath = path.join(fullFolderPath, cleanFilename);

    console.log(`📥 [FILE-DOWNLOAD] Saving to: ${fullFilePath}`);

    // Decode the URL
    let decodedUrl = decodeURIComponent(fileUrl);
    
    // Validate it's actually a URL
    try {
      new URL(decodedUrl);
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'Invalid URL format' });
    }

    // Download the file from the source
    const protocol = decodedUrl.startsWith('https') ? https : http;
    
    return new Promise((resolve) => {
      protocol.get(decodedUrl, {
        timeout: 180000,
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/pdf,application/octet-stream,*/*',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }, (response) => {
        if (response.statusCode >= 400) {
          console.error(`❌ Failed to download file: HTTP ${response.statusCode}`);
          resolve(res.status(response.statusCode).json({ 
            ok: false, 
            error: `HTTP ${response.statusCode}: ${response.statusMessage}` 
          }));
          return;
        }

        // Create write stream
        const writeStream = fs.createWriteStream(fullFilePath);
        let bytesWritten = 0;

        response.on('data', (chunk) => {
          bytesWritten += chunk.length;
        });

        response.pipe(writeStream);

        writeStream.on('finish', () => {
          console.log(`✅ [FILE-DOWNLOAD] Saved ${bytesWritten} bytes to: ${fullFilePath}`);
          resolve(res.json({
            ok: true,
            message: 'File saved successfully',
            folderPath: fullFolderPath,
            fullPath: fullFilePath,
            filename: cleanFilename,
            bytes: bytesWritten
          }));
        });

        writeStream.on('error', (err) => {
          console.error(`❌ Error writing file: ${err.message}`);
          fs.unlink(fullFilePath, () => {}); // Clean up partial file
          resolve(res.status(500).json({ ok: false, error: `Failed to write file: ${err.message}` }));
        });

        response.on('error', (err) => {
          console.error(`❌ Error downloading file: ${err.message}`);
          writeStream.destroy();
          fs.unlink(fullFilePath, () => {}); // Clean up partial file
          resolve(res.status(500).json({ ok: false, error: `Download failed: ${err.message}` }));
        });
      }).on('error', (err) => {
        console.error(`❌ Request error: ${err.message}`);
        resolve(res.status(500).json({ ok: false, error: `Request failed: ${err.message}` }));
      });
    });
  } catch (error) {
    console.error('Error in download-file-to-folder:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to download file' });
  }
});

// GET /api/elib/download-folders/preferences - GET USER FOLDER PREFERENCES
app.get('/api/elib/download-folders/preferences', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !supabaseAdmin) {
      return res.json({
        ok: true,
        preferences: {
          defaultFolder: 'Downloads',
          folders: [],
          selectedFolder: 'Downloads'
        }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.json({
        ok: true,
        preferences: {
          defaultFolder: 'Downloads',
          folders: [],
          selectedFolder: 'Downloads'
        }
      });
    }

    // Get user's preferences
    const { data: prefs, error: prefError } = await supabaseAdmin
      .from('user_preferences')
      .select('download_folders, selected_download_folder')
      .eq('user_id', user.id)
      .single();

    if (prefError || !prefs) {
      return res.json({
        ok: true,
        preferences: {
          defaultFolder: 'Downloads',
          folders: [],
          selectedFolder: 'Downloads',
          userId: user.id
        }
      });
    }

    res.json({
      ok: true,
      preferences: {
        defaultFolder: 'Downloads',
        folders: prefs.download_folders || [],
        selectedFolder: prefs.selected_download_folder || 'Downloads',
        userId: user.id
      }
    });
  } catch (error) {
    console.error('Error getting folder preferences:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to get preferences' });
  }
});

// POST /api/elib/download-folders/preferences - SAVE USER FOLDER PREFERENCES
app.post('/api/elib/download-folders/preferences', async (req, res) => {
  try {
    const { defaultFolder, folders, selectedFolder } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !supabaseAdmin) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ ok: false, error: 'Authentication failed' });
    }

    // Update or create user preferences
    const { error: upsertError } = await supabaseAdmin
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          download_folders: folders || [],
          selected_download_folder: selectedFolder || 'Downloads',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Error saving preferences:', upsertError);
      return res.status(500).json({ ok: false, error: 'Failed to save preferences' });
    }

    res.json({
      ok: true,
      message: 'Folder preferences saved successfully',
      selectedFolder: selectedFolder || 'Downloads'
    });
  } catch (error) {
    console.error('Error saving folder preferences:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to save preferences' });
  }
});

// === Submissions Endpoints (Books + Past Papers) ===
app.get('/api/elib/submissions', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
    const status = (req.query.status || 'pending').toString();
    const userId = req.query.userId || null;
    const type = (req.query.type || 'books').toString();

    const table = type === 'past_papers' ? 'past_paper_submissions' : 'book_submissions';
    let q = supabaseAdmin.from(table).select('*').order('created_at', { ascending: false });
    if (status !== 'all') q = q.eq('status', status);
    if (userId) q = q.eq('uploaded_by', userId);
    const { data, error } = await q;
    if (error) throw error;

    // Attach uploader email/name from profiles for admin display
    const submissions = data || [];
    const uploaderIds = Array.from(new Set(
      submissions
        .map((s) => s.uploaded_by)
        .filter((id) => !!id)
    ));

    let profileMap = new Map();
    if (uploaderIds.length > 0) {
      const { data: profiles, error: profErr } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', uploaderIds);
      if (!profErr && Array.isArray(profiles)) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    }

    const enriched = submissions.map((s) => {
      const prof = s.uploaded_by ? profileMap.get(s.uploaded_by) : null;
      
      // For submissions without uploaded_by, try to extract info from auth logs or fallback
      let uploaderEmail = prof?.email || null;
      let uploaderName = prof?.full_name || null;
      
      // If no uploader info and this is an old submission, check if we can find user from approval history
      if (!uploaderEmail && !uploaderName && s.status !== 'pending') {
        // For approved/rejected items, we might have info in the submission details
        uploaderEmail = s.submitter_email || null;
        uploaderName = s.submitter_name || null;
      }
      
      return {
        ...s,
        uploader_email: uploaderEmail,
        uploader_name: uploaderName,
      };
    });

    res.json({ ok: true, type, submissions: enriched });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load submissions' });
  }
});

// PATCH /api/elib/submissions/:id/uploader - Update uploader info for a submission
app.patch('/api/elib/submissions/:id/uploader', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
    
    const { id } = req.params;
    const { uploaded_by } = req.body;
    const type = (req.query.type || 'books').toString();
    
    if (!uploaded_by) {
      return res.status(400).json({ error: 'uploaded_by is required' });
    }
    
    // Validate UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      return res.status(400).json({ error: `Invalid submission ID format: ${id}` });
    }
    
    const table = type === 'past_papers' ? 'past_paper_submissions' : 'book_submissions';
    
    // Update the submission
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ uploaded_by })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Submission not found' });
    
    // Fetch user profile to return enriched data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', uploaded_by)
      .single();
    
    res.json({
      ok: true,
      message: 'Uploader info updated',
      submission: {
        ...data,
        uploader_email: profile?.email || null,
        uploader_name: profile?.full_name || null,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to update submission' });
  }
});

// Summary counts for notification badges
app.get('/api/elib/submissions/summary', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });

    const [booksPending, pastPending] = await Promise.all([
      supabaseAdmin.from('book_submissions').select('id', { head: true, count: 'exact' }).eq('status', 'pending'),
      supabaseAdmin.from('past_paper_submissions').select('id', { head: true, count: 'exact' }).eq('status', 'pending'),
    ]);

    if (booksPending.error) throw booksPending.error;
    if (pastPending.error) throw pastPending.error;

    res.json({
      ok: true,
      booksPending: booksPending.count || 0,
      pastPapersPending: pastPending.count || 0,
      totalPending: (booksPending.count || 0) + (pastPending.count || 0),
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load submissions summary' });
  }
});

// Notify admins about new user submissions (books or past papers)
app.post('/api/elib/submissions/notify-admins', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
    const {
      type = 'books',           // 'books' | 'past_papers'
      uploadedBy = null,       // optional profile id
      itemTitle = null,        // for books
      faculty = null,
      unitCode = null,
      unitName = null,
      year = null,
      semester = null,
    } = req.body || {};

    console.log('🔔 [NOTIFY-ADMINS] Received notification request:', { type, uploadedBy, itemTitle });

    const normalizedType = String(type || 'books').trim();
    const isPastPaper = normalizedType === 'past_papers';

    // Resolve uploader profile if provided
    let uploaderEmail = null;
    let uploaderName = null;
    if (uploadedBy) {
      console.log('🔔 [NOTIFY-ADMINS] Looking up uploader profile:', uploadedBy);
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', uploadedBy)
        .single();
      if (prof) {
        uploaderEmail = prof.email || null;
        uploaderName = prof.full_name || null;
        console.log('🔔 [NOTIFY-ADMINS] Found uploader:', { uploaderEmail, uploaderName });
      } else {
        console.warn('🔔 [NOTIFY-ADMINS] Uploader profile not found');
      }
    }

    // Fallback label if we don't know the uploader
    const uploaderLabel = uploaderName || uploaderEmail || 'A user';

    // Build a short description of the submission
    let submissionSummary;
    if (isPastPaper) {
      const parts = [];
      if (unitCode) parts.push(unitCode);
      if (unitName) parts.push(unitName);
      if (faculty) parts.push(`(${faculty})`);
      const main = parts.join(' ');
      const meta = [year && `Year ${year}`, semester && `Sem ${semester}`].filter(Boolean).join(' • ');
      submissionSummary = [main || 'Past paper', meta].filter(Boolean).join(' — ');
    } else {
      submissionSummary = itemTitle || 'Book submission';
    }

    // Fetch admin recipients (DB first, then .env fallback)
    const adminEmails = await getAdminEmails();
    if (!adminEmails || adminEmails.length === 0) {
      console.warn('⚠️ No admin emails configured; skipping submission notification');
      return res.status(200).json({ ok: false, message: 'No admin emails configured' });
    }

    console.log('🔔 [NOTIFY-ADMINS] Sending to admin emails:', adminEmails);

    const subject = isPastPaper
      ? '📚 New Past Paper Submission Awaiting Review'
      : '📖 New Book Submission Awaiting Review';

    const bodyHtml = `
      <div style="font-size:14px;color:#111827;">
        <p>${uploaderLabel} has submitted a new ${isPastPaper ? 'past paper' : 'book'} that is waiting for your review.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin:16px 0;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Submission details</p>
          <p style="margin:0;color:#111827;font-weight:600;">${submissionSummary}</p>
        </div>
        <p style="color:#374151;">Please open the admin dashboard and review this submission in <strong>Books → Submissions</strong> (${isPastPaper ? 'Past Papers tab' : 'Books tab'}).</p>
      </div>
    `.trim();

    const plainText = `
New ${isPastPaper ? 'Past Paper' : 'Book'} Submission

${uploaderLabel} has submitted a new ${isPastPaper ? 'past paper' : 'book'} that is waiting for your review.

DETAILS
${submissionSummary}

ACTION
Please open the admin dashboard and review this submission in Books → Submissions (${isPastPaper ? 'Past Papers tab' : 'Books tab'}).
`.trim();

    const html = buildBrandedEmailHtml({ title: subject, body: bodyHtml });

    // Send email to each admin (best-effort)
    console.log('🔔 [NOTIFY-ADMINS] Sending emails via Promise.allSettled...');
    const emailPromises = adminEmails.map((to) =>
      sendEmail({ to, subject, text: plainText, html })
    );
    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`🔔 [NOTIFY-ADMINS] Email results: ${successful} succeeded, ${failed} failed`);
    
    if (failed > 0) {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`🔔 [NOTIFY-ADMINS] Email ${i} failed:`, r.reason.message);
        }
      });
    }

    return res.json({ ok: true, message: 'Admin notification sent', successful, failed });
  } catch (e) {
    console.error('❌ [NOTIFY-ADMINS] Error:', e.message);
    return res.status(500).json({ error: e.message || 'Failed to notify admins' });
  }
});

// Send submission confirmation email to the uploader
app.post('/api/elib/submissions/notify-uploader', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
    const {
      type = 'books',           // 'books' | 'past_papers'
      uploaderEmail = null,     // uploader's email address
      uploaderName = null,      // uploader's full name
      itemTitle = null,         // title of submission
      faculty = null,
      unitCode = null,
      unitName = null,
      year = null,
      semester = null,
    } = req.body || {};

    console.log('📬 [NOTIFY-UPLOADER] Received uploader notification request:', { type, uploaderEmail, itemTitle });

    if (!uploaderEmail) {
      console.warn('📬 [NOTIFY-UPLOADER] No uploader email provided, skipping notification');
      return res.status(200).json({ ok: false, message: 'No uploader email provided' });
    }

    const normalizedType = String(type || 'books').trim();
    const isPastPaper = normalizedType === 'past_papers';

    // Build submission summary
    let submissionSummary;
    if (isPastPaper) {
      const parts = [];
      if (unitCode) parts.push(unitCode);
      if (unitName) parts.push(unitName);
      if (faculty) parts.push(`(${faculty})`);
      const main = parts.join(' ');
      const meta = [year && `Year ${year}`, semester && `Sem ${semester}`].filter(Boolean).join(' • ');
      submissionSummary = [main || 'Past paper', meta].filter(Boolean).join(' — ');
    } else {
      submissionSummary = itemTitle || 'Your submission';
    }

    const greeterName = uploaderName ? uploaderName.split(' ')[0] : 'there';
    const subject = isPastPaper
      ? '📚 Your Past Paper Submission Received'
      : '📖 Your Book Submission Received';

    const bodyHtml = `
      <div style="font-size:14px;color:#111827;">
        <p>Hi ${greeterName},</p>
        <p>Thank you for submitting your ${isPastPaper ? 'past paper' : 'book'}! We've received it and it's now under review by our admin team.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin:16px 0;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">What you submitted</p>
          <p style="margin:0;color:#111827;font-weight:600;">${submissionSummary}</p>
        </div>
        <p style="color:#374151;"><strong>What happens next:</strong></p>
        <ul style="color:#374151;margin:8px 0;padding-left:20px;">
          <li>Our team will review your submission for quality and completeness</li>
          <li>You'll receive an email notification once your submission is approved or if we need changes</li>
          <li>After approval, your contribution will be visible to all students on the platform</li>
        </ul>
        <p style="color:#374151;">If you have any questions, feel free to reach out to our support team.</p>
      </div>
    `.trim();

    const plainText = `
Hi ${greeterName},

Thank you for submitting your ${isPastPaper ? 'past paper' : 'book'}! We've received it and it's now under review by our admin team.

WHAT YOU SUBMITTED
${submissionSummary}

WHAT HAPPENS NEXT
- Our team will review your submission for quality and completeness
- You'll receive an email notification once your submission is approved or if we need changes
- After approval, your contribution will be visible to all students on the platform

If you have any questions, feel free to reach out to our support team.
`.trim();

    const html = buildBrandedEmailHtml({ title: subject, body: bodyHtml });

    console.log('📬 [NOTIFY-UPLOADER] Sending confirmation email to:', uploaderEmail);
    try {
      const emailResult = await sendEmail({ 
        to: uploaderEmail, 
        subject, 
        text: plainText, 
        html 
      });
      console.log('✅ [NOTIFY-UPLOADER] Email sent successfully to', uploaderEmail);
      return res.json({ ok: true, message: 'Uploader notification sent', messageId: emailResult.messageId });
    } catch (emailError) {
      console.error('❌ [NOTIFY-UPLOADER] Failed to send email:', emailError.message);
      return res.status(500).json({ ok: false, error: 'Failed to send email to uploader', details: emailError.message });
    }
  } catch (e) {
    console.error('❌ [NOTIFY-UPLOADER] Error:', e.message);
    return res.status(500).json({ error: e.message || 'Failed to notify uploader' });
  }
});

// DELETE old submissions with no uploader info
app.delete('/api/elib/submissions/cleanup/null-uploaders', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured' });
    
    // Delete pending submissions with no uploaded_by
    const { data: booksData, error: booksError } = await supabaseAdmin
      .from('book_submissions')
      .delete()
      .eq('uploaded_by', null)
      .eq('status', 'pending');
    
    const { data: papersData, error: papersError } = await supabaseAdmin
      .from('past_paper_submissions')
      .delete()
      .eq('uploaded_by', null)
      .eq('status', 'pending');
    
    if (booksError) throw booksError;
    if (papersError) throw papersError;
    
    console.log('✅ Cleaned up old submissions with null uploaders');
    res.json({ ok: true, message: 'Cleaned up old submissions' });
  } catch (e) {
    console.error('Error cleaning up submissions:', e);
    res.status(500).json({ error: e.message });
  }
});

// Approve a submission: copy to books/past_papers + mark approved + send warm email
app.post('/api/elib/submissions/:id/approve', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { id } = req.params;
    const type = (req.query.type || 'books').toString().trim();
    const actor = req.headers['x-actor-email'] || 'admin';
    const actorId = req.headers['x-actor-id'] || null;
    const nowIso = new Date().toISOString();

    // Validate UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      return res.status(400).json({ error: `Invalid submission ID format: ${id}` });
    }

    const submissionTable = type === 'past_papers' ? 'past_paper_submissions' : 'book_submissions';
    const targetTable = type === 'past_papers' ? 'past_papers' : 'books';

    // 1. Fetch submission
    const { data: sub, error: fetchErr } = await supabaseAdmin
      .from(submissionTable)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !sub) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (sub.status === 'approved') {
      return res.json({ ok: true, message: 'Already approved', item: sub });
    }

    // Validate that submission has required fields for past papers
    if (type === 'past_papers') {
      if (!sub.unit_name) {
        return res.status(400).json({ 
          error: 'Cannot approve: submission missing unit name',
          submissionId: id,
          type: type
        });
      }
      if (!sub.unit_code) {
        return res.status(400).json({ 
          error: 'Cannot approve: submission missing unit code',
          submissionId: id,
          type: type
        });
      }
      if (!sub.faculty) {
        return res.status(400).json({ 
          error: 'Cannot approve: submission missing faculty',
          submissionId: id,
          type: type
        });
      }
      if (!sub.year) {
        return res.status(400).json({ 
          error: 'Cannot approve: submission missing year',
          submissionId: id,
          type: type
        });
      }
    }

    // Convert file_path to full public URL if needed
    const fileUrl = type === 'past_papers' 
      ? (sub.file_path || sub.file_url)
      : sub.file_url;
    
    if (!fileUrl) {
      return res.status(400).json({ 
        error: 'Cannot approve: submission missing file URL/path',
        submissionId: id,
        type: type
      });
    }

    let finalFileUrl = fileUrl;
    if (type === 'past_papers' && fileUrl && !fileUrl.includes('https://')) {
      // Convert filename to full Supabase public URL
      const projectUrl = process.env.SUPABASE_URL || 'https://wuwlnawtuhjoubfkdtgc.supabase.co'; // Correct Supabase project
      finalFileUrl = `${projectUrl}/storage/v1/object/public/past-papers/${fileUrl}`;
    }

    // 2. Prepare payload for target table
    let insertPayload;
    if (type === 'past_papers') {
      insertPayload = {
        id: sub.id,
        title: sub.title || `${sub.unit_code} - ${sub.unit_name}`,
        university_id: sub.university_id,
        faculty: sub.faculty || sub.subject || 'General',
        unit_code: sub.unit_code || 'UNKNOWN',
        unit_name: sub.unit_name || 'Untitled',
        year: sub.year || new Date().getFullYear(),
        semester: sub.semester || '',
        exam_type: sub.exam_type || 'Main',
        file_url: finalFileUrl, // Use the converted URL with full path
        file_path: sub.file_path || null,
        uploaded_by: null, // Don't reference auth.users here, past_papers refs profiles(id)
        is_active: true,
        downloads_count: 0,
        views_count: 0,
        created_at: nowIso,
        updated_at: nowIso,
      };
    } else {
      // For books - ensure author is never null (required by schema)
      const author = sub.author?.trim() || 'Unknown Author';
      insertPayload = {
        id: sub.id,
        title: sub.title?.trim() || 'Untitled Book',
        author: author, // TEXT NOT NULL
        description: sub.description || '',
        category_id: sub.category_id || null,
        cover_image_url: sub.cover_url,
        file_url: fileUrl, // Already validated to be non-null above
        file_size: sub.file_size || null,
        pages: sub.pages || null,
        upload_date: nowIso,
        uploaded_by: null, // Don't reference auth.users here, books refs profiles(id)
        is_featured: false,
        is_active: true,
        views_count: 0,
        downloads_count: 0,
        rating: 0,
        rating_count: 0,
        created_at: nowIso,
        updated_at: nowIso,
      };
    }

    // 3. Insert into final table (idempotent-safe)
    const { data: publishedItem, error: insertErr } = await supabaseAdmin
      .from(targetTable)
      .upsert(insertPayload, { onConflict: ['id'] })
      .select('*')
      .single();

    if (insertErr) {
      console.error('Insert failed for table:', targetTable);
      console.error('Insert error details:', JSON.stringify(insertErr, null, 2));
      console.error('Insert payload was:', JSON.stringify(insertPayload, null, 2));
      return res.status(500).json({ 
        error: 'Failed to publish item',
        details: insertErr.message,
        table: targetTable,
        payloadKeys: Object.keys(insertPayload)
      });
    }

    // 4. Mark submission as approved
    const { error: updateErr } = await supabaseAdmin
      .from(submissionTable)
      .update({
        status: 'approved',
        approved_at: nowIso,
        approved_by: actorId || null,
        updated_at: nowIso,
      })
      .eq('id', id);

    if (updateErr) {
      console.warn('Failed to update submission status to approved:', updateErr);
      // Not fatal — item is still published
    }

    // 5. Audit log
    await logAudit({
      actor,
      action: 'approve_submission',
      entity: submissionTable,
      record_id: id,
      details: { published_to: targetTable, published_id: publishedItem.id },
      ip: req.ip,
    });

    // 6. Send beautiful, warm approval email
    console.log('📧 [APPROVAL EMAIL] Checking uploader:', { uploaded_by: sub.uploaded_by, has_uploaded_by: !!sub.uploaded_by });
    if (sub.uploaded_by) {
      console.log('📧 [APPROVAL EMAIL] Fetching profile for uploader:', sub.uploaded_by);
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', sub.uploaded_by)
        .single();

      console.log('📧 [APPROVAL EMAIL] Profile fetch result:', { profile, profileErr });
      if (profile?.email) {
        const firstName = profile.full_name?.split(' ')[0] || 'Contributor';
        const isPastPaper = type === 'past_papers';
        const itemName = isPastPaper
          ? `${sub.unit_code || ''} ${sub.unit_name || ''} (${sub.year})`.trim() || 'Past Paper'
          : sub.title || 'Your Book';

        const subject = isPastPaper
          ? `Your Past Paper “${itemName}” Is Now Live!`
          : `Great News – “${itemName}” Has Been Published!`;

        const htmlBody = buildBrandedEmailHtml({
          title: 'Your Submission Was Approved!',
          body: `
            <p>Dear ${firstName},</p>

            <p>We’re thrilled to let you know that your ${isPastPaper ? 'past paper' : 'book'} submission has been <strong>approved and is now live</strong> on our platform!</p>

            <p><strong>${isPastPaper ? 'Past Paper' : 'Title'}:</strong> ${itemName}</p>

            ${!isPastPaper ? `<p>Thank you for sharing your work with our community. Readers can now discover and enjoy your book!</p>` :
              `<p>Students will now be able to access this valuable resource. Thank you for helping others prepare!</p>`}

            <p>We truly appreciate your contribution and hope to see more from you in the future.</p>

            <p>With gratitude,<br>
            ${sub.editorName || 'The Editorial Team'}<br>
            ${sub.publisherName || 'eLib Publishing'}</p>
          `.trim()
        });

        try {
          console.log('📧 [APPROVAL EMAIL] Sending approval email to:', profile.email);
          await sendEmail({
            to: profile.email,
            subject,
            html: htmlBody,
            text: `Congratulations! Your submission "${itemName}" has been approved and published. Thank you for your contribution!`,
          });
          console.log('📧 [APPROVAL EMAIL] Email sent successfully to:', profile.email);
        } catch (emailErr) {
          console.error(`📧 [APPROVAL EMAIL] Failed for ${profile.email}:`, emailErr);
          // Non-blocking
        }
      } else {
        console.warn('📧 [APPROVAL EMAIL] No email found for uploader profile:', { uploaded_by: sub.uploaded_by, profile });
      }
    } else {
      console.warn('📧 [APPROVAL EMAIL] Submission has no uploaded_by field, cannot send email');
    }

    // Send in-app notification via WebSocket
    if (sub.uploaded_by) {
      try {
        const isPastPaper = type === 'past_papers';
        const itemName = isPastPaper
          ? `${sub.unit_code || ''} ${sub.unit_name || ''} (${sub.year})`.trim() || 'Past Paper'
          : sub.title || 'Your Book';

        const notificationMessage = {
          type: 'submission_approved',
          title: 'Submission Approved! 🎉',
          message: `Your ${isPastPaper ? 'past paper' : 'book'} "${itemName}" has been approved and is now live!`,
          submissionId: id,
          submissionType: type,
          timestamp: nowIso,
        };

        // Send via WebSocket to user if connected
        if (userChannels.has(sub.uploaded_by)) {
          const userConnections = userChannels.get(sub.uploaded_by);
          userConnections.forEach((ws) => {
            if (ws.readyState === 1) { // OPEN
              ws.send(JSON.stringify(notificationMessage));
            }
          });
          console.log('📲 [IN-APP NOTIFICATION] Approval notification sent via WebSocket to user:', sub.uploaded_by);
        }
      } catch (notifyErr) {
        console.warn('⚠️ [IN-APP NOTIFICATION] Failed to send WebSocket notification:', notifyErr);
        // Non-blocking
      }
    }

    // Success!
    res.json({
      ok: true,
      message: 'Submission approved and published',
      published_item: publishedItem,
      type: targetTable,
    });

  } catch (e) {
    console.error('Approve submission error:', e);
    res.status(500).json({ error: e.message || 'Failed to approve submission' });
  }
});

// Reject a submission with optional reason
app.post('/api/elib/submissions/:id/reject', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });

    const { id } = req.params;
    const type = (req.query.type || 'books').toString();
    const { reason } = req.body || {};
    const actor = req.headers['x-actor-email'] || 'admin';
    const actorId = req.headers['x-actor-id'] || null;
    const nowIso = new Date().toISOString();

    // Validate UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      return res.status(400).json({ error: `Invalid submission ID format: ${id}` });
    }

    const table = type === 'past_papers' ? 'past_paper_submissions' : 'book_submissions';

    const { data: submission, error } = await supabaseAdmin
      .from(table)
      .update({
        status: 'rejected',
        admin_notes: reason || null,
        rejected_at: nowIso,
        rejected_by: actorId || null,
        updated_at: nowIso
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    // Log audit trail
    await logAudit({
      actor,
      action: 'reject_submission',
      entity: table,
      record_id: id,
      details: { reason: reason || null },
      ip: req.ip
    });

    // Send notification email only if uploader has an email
    console.log('📧 [REJECTION EMAIL] Checking uploader:', { uploaded_by: submission.uploaded_by, has_uploaded_by: !!submission.uploaded_by });
    if (submission.uploaded_by) {
      console.log('📧 [REJECTION EMAIL] Fetching profile for uploader:', submission.uploaded_by);
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', submission.uploaded_by)
        .single();

      console.log('📧 [REJECTION EMAIL] Profile fetch result:', { profile, profileErr });
      if (profile?.email) {
        const bookTitle = submission.title?.trim() || 'Untitled';
        const authorGreeting = profile.full_name?.split(' ')[0] || 'Author';

        const emailSubject = `Update on Your Submission – “${bookTitle}”`;
        const emailHtml = buildBrandedEmailHtml({
          title: emailSubject,
          body: `
            <p>Dear ${authorGreeting},</p>

            <p>Thank you for submitting <strong>“${bookTitle}”</strong> and for trusting us with your work. We truly appreciate the opportunity to consider your manuscript.</p>

            <p>After careful review by our editorial team, we’ve decided not to move forward with this project at this time.</p>

            <p>This wasn’t an easy decision—publishing is highly subjective, and we receive many excellent submissions. Our decision reflects our current editorial focus and market priorities rather than the quality or potential of your work.</p>

            ${reason ? `<p><strong>Reason for the decision:</strong><br><em>${reason}</em></p>` : ''}

            <p>We sincerely wish you the very best in finding the perfect home for your book, and we’d be delighted to consider your future projects.</p>

            <p>With appreciation and warm regards,<br>
            ${submission.editorName || 'The Editorial Team'}<br>
            ${submission.publisherName || 'eLib Publishing'}</p>
          `.trim()
        });

        try {
          await sendEmail({
            to: profile.email,
            subject: emailSubject,
            html: emailHtml,
            text: `Your submission “${bookTitle}” was not selected for publication at this time.${reason ? ` Reason: ${reason}` : ''} Thank you and best wishes!`
          });
        } catch (emailError) {
          console.warn('Failed to send rejection email:', emailError);
          // Don't fail the whole request just because email failed
        }
      }
    }

    // Send in-app notification via WebSocket
    if (submission.uploaded_by) {
      try {
        const itemName = submission.title?.trim() || 'Your submission';

        const notificationMessage = {
          type: 'submission_rejected',
          title: 'Submission Status Update',
          message: `Your submission "${itemName}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
          submissionId: id,
          submissionType: type,
          reason: reason || null,
          timestamp: nowIso,
        };

        // Send via WebSocket to user if connected
        if (userChannels.has(submission.uploaded_by)) {
          const userConnections = userChannels.get(submission.uploaded_by);
          userConnections.forEach((ws) => {
            if (ws.readyState === 1) { // OPEN
              ws.send(JSON.stringify(notificationMessage));
            }
          });
          console.log('📲 [IN-APP NOTIFICATION] Rejection notification sent via WebSocket to user:', submission.uploaded_by);
        }
      } catch (notifyErr) {
        console.warn('⚠️ [IN-APP NOTIFICATION] Failed to send WebSocket notification:', notifyErr);
        // Non-blocking
      }
    }

    res.json({ ok: true, submission });
  } catch (e) {
    console.error('Reject submission error:', e);
    res.status(500).json({ error: e.message || 'Failed to reject submission' });
  }
});

// Create past paper directly (admin endpoint - bypasses RLS with service role)
app.post('/api/elib/past-papers/create', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    // Handle both JSON with base64 and FormData with file
    let metadata, fileBuffer, fileName;

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with file
      const { file, metadata: metadataStr } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      // File from express.static or multer would be in req.files
      // For raw body parsing, we'll read it from the request
      // This requires a multipart parser - for now, accept the JSON method
      return res.status(400).json({ error: 'Please send file as JSON with base64 encoding' });
    } else {
      // Handle JSON with base64
      const { metadata: metadataObj, fileBase64, fileName: fileNameArg } = req.body;

      if (!metadataObj || !fileBase64 || !fileNameArg) {
        return res.status(400).json({ error: 'Missing required fields: metadata, fileBase64, fileName' });
      }

      metadata = metadataObj;
      fileName = fileNameArg;
      
      // Convert base64 to buffer
      // Handle both with and without data URL prefix
      let base64Str = fileBase64;
      if (fileBase64.includes(',')) {
        base64Str = fileBase64.split(',')[1];
      }
      
      fileBuffer = Buffer.from(base64Str, 'base64');
    }

    // Validate file is actually a PDF
    if (!fileBuffer || fileBuffer.length < 4) {
      return res.status(400).json({ error: 'Invalid file: file is too small' });
    }

    // Check PDF header (should start with %PDF)
    const pdfHeader = fileBuffer.toString('utf8', 0, 4);
    if (!pdfHeader.startsWith('%PDF')) {
      console.warn('Warning: File does not have PDF header. Header:', fileBuffer.toString('utf8', 0, 20));
      // Don't fail here as some PDFs might have different encoding
    }

    // Use metadata uploaded_by if provided, otherwise null
    const uploadedById = metadata.uploaded_by || null;
    
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext !== 'pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    const storagePath = `${crypto.randomUUID()}.pdf`;

    // Upload file using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('past-papers')
      .upload(storagePath, fileBuffer, { 
        cacheControl: '3600', 
        upsert: false, 
        contentType: 'application/pdf' 
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: `Failed to upload file: ${uploadError.message}` });
    }

    // Prepare past paper record
    const nowIso = new Date().toISOString();
    
    // Generate title with fallbacks
    let title = metadata.title;
    if (!title) {
      const unitCode = metadata.unit_code || 'UNIT';
      const unitName = metadata.unit_name || 'Unknown';
      title = `${unitCode} - ${unitName}`;
    }
    
    // Generate public URL for the stored file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('past-papers')
      .getPublicUrl(uploadData.path);
    const fileUrl = publicUrlData?.publicUrl || uploadData.path;
    
    const pastPaperRecord = {
      id: crypto.randomUUID(),
      title: title || 'Past Paper',
      university_id: metadata.university_id || null,
      subject: metadata.faculty || '',
      course_code: metadata.unit_code || '',
      file_url: fileUrl,
      exam_year: metadata.year ? Number(metadata.year) : null,
      semester: metadata.semester || '',
      level: null,
      file_size: fileBuffer.length,
      uploaded_by: uploadedById,
      is_featured: false,
      is_active: true,
      downloads_count: 0,
      views_count: 0,
      rating: 0,
      rating_count: 0,
      created_at: nowIso,
      updated_at: nowIso
    };

    // Insert using admin client (bypasses RLS)
    const { data: pastPaper, error: insertError } = await supabaseAdmin
      .from('past_papers')
      .insert(pastPaperRecord)
      .select('*')
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ error: `Failed to create past paper: ${insertError.message}` });
    }

    res.json({ ok: true, pastPaper });
  } catch (e) {
    console.error('Failed to create past paper:', e);
    res.status(500).json({ error: e.message || 'Failed to create past paper' });
  }
});

// Upload book file (admin endpoint - bypasses RLS with service role)
app.post('/api/elib/books/upload-file', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: 'Missing required fields: fileBase64, fileName' });
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const ext = fileName.split('.').pop();
    const storagePath = `${crypto.randomUUID()}.${ext}`;

    // Upload file using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('elib-books')
      .upload(storagePath, fileBuffer, { 
        cacheControl: '3600', 
        upsert: false, 
        contentType: 'application/pdf' 
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: `Failed to upload file: ${uploadError.message}` });
    }

    res.json({ ok: true, path: uploadData.path });
  } catch (e) {
    console.error('Failed to upload book file:', e);
    res.status(500).json({ error: e.message || 'Failed to upload file' });
  }
});

// Upload book cover (admin endpoint - bypasses RLS with service role)
app.post('/api/elib/books/upload-cover', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: 'Missing required fields: fileBase64, fileName' });
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const ext = fileName.split('.').pop();
    const storagePath = `${crypto.randomUUID()}.${ext}`;

    // Upload file using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('elib-covers')
      .upload(storagePath, fileBuffer, { 
        cacheControl: '3600', 
        upsert: false, 
        contentType: 'image/' + (ext === 'jpg' ? 'jpeg' : ext) 
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: `Failed to upload cover: ${uploadError.message}` });
    }

    const publicUrl = supabaseAdmin.storage.from('elib-covers').getPublicUrl(uploadData.path).data.publicUrl;
    res.json({ ok: true, path: uploadData.path, publicUrl });
  } catch (e) {
    console.error('Failed to upload book cover:', e);
    res.status(500).json({ error: e.message || 'Failed to upload cover' });
  }
});

// Upload author profile image (admin endpoint - bypasses RLS with service role)
app.post('/api/authors/upload-profile-image', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    const { fileBase64, fileName, authorName } = req.body;
    if (!fileBase64 || !fileName || !authorName) {
      return res.status(400).json({ error: 'Missing required fields: fileBase64, fileName, authorName' });
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const ext = fileName.split('.').pop();
    const sanitizedAuthorName = (authorName || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 30);
    const storagePath = `${sanitizedAuthorName}/${crypto.randomUUID()}.${ext}`;

    // Upload file using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('author-profiles')
      .upload(storagePath, fileBuffer, { 
        cacheControl: '3600', 
        upsert: false, 
        contentType: 'image/' + (ext === 'jpg' ? 'jpeg' : ext) 
      });

    if (uploadError) {
      console.error('Author profile image upload error:', uploadError);
      return res.status(500).json({ error: `Failed to upload author profile image: ${uploadError.message}` });
    }

    const publicUrl = supabaseAdmin.storage.from('author-profiles').getPublicUrl(uploadData.path).data.publicUrl;
    console.log(`✅ Author profile image uploaded for ${authorName}: ${storagePath}`);
    res.json({ ok: true, path: uploadData.path, publicUrl });
  } catch (e) {
    console.error('Failed to upload author profile image:', e);
    res.status(500).json({ error: e.message || 'Failed to upload author profile image' });
  }
});

// Fetch author profile image from Wikipedia or Google Books and store it
app.post('/api/authors/fetch-profile-image', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    const { authorName } = req.body;
    if (!authorName) {
      return res.status(400).json({ error: 'Missing required field: authorName' });
    }

    let imageBuffer = null;
    let imageUrl = null;

    // Try Wikipedia first (most reliable)
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(authorName)}&srlimit=1`;
      const sres = await axios.get(searchUrl, { timeout: 10000 });
      
      if (sres.data?.query?.search?.[0]) {
        const hit = sres.data.query.search[0];
        const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&pageids=${hit.pageid}&prop=pageimages&piprop=thumbnail&pithumbsize=400`;
        const pres = await axios.get(pageUrl, { timeout: 10000 });
        
        if (pres.data?.query?.pages?.[hit.pageid]?.thumbnail?.source) {
          imageUrl = pres.data.query.pages[hit.pageid].thumbnail.source;
          console.log(`📸 Found Wikipedia image for ${authorName}: ${imageUrl}`);
        }
      }
    } catch (e) {
      console.warn(`⚠️ Wikipedia search failed for ${authorName}:`, e.message);
    }

    // Fallback to Google Books if Wikipedia fails
    if (!imageUrl) {
      try {
        const q = `inauthor:"${authorName}"`;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`;
        const gbres = await axios.get(url, { timeout: 10000 });
        
        if (gbres.data?.items?.[0]) {
          const vi = gbres.data.items[0].volumeInfo || {};
          imageUrl = vi.imageLinks?.medium || vi.imageLinks?.small || vi.imageLinks?.thumbnail;
          if (imageUrl) {
            console.log(`📕 Found Google Books image for ${authorName}: ${imageUrl}`);
          }
        }
      } catch (e) {
        console.warn(`⚠️ Google Books search failed for ${authorName}:`, e.message);
      }
    }

    // Download the image if found
    if (imageUrl) {
      try {
        const imgRes = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        imageBuffer = Buffer.from(imgRes.data);
        console.log(`✅ Downloaded author image (${imageBuffer.length} bytes)`);
      } catch (e) {
        console.warn(`⚠️ Failed to download author image from ${imageUrl}:`, e.message);
        imageBuffer = null;
      }
    }

    // If image was successfully downloaded, upload to Supabase
    if (imageBuffer) {
      const sanitizedAuthorName = (authorName || 'unknown')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .substring(0, 30);
      const storagePath = `${sanitizedAuthorName}/${crypto.randomUUID()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('author-profiles')
        .upload(storagePath, imageBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Failed to upload author profile image to storage:', uploadError);
        return res.status(500).json({ error: `Failed to upload image: ${uploadError.message}` });
      }

      const publicUrl = supabaseAdmin.storage.from('author-profiles').getPublicUrl(uploadData.path).data.publicUrl;
      console.log(`✅ Author profile image stored: ${storagePath}`);
      return res.json({ ok: true, path: uploadData.path, publicUrl, source: imageUrl });
    }

    // No image found
    res.json({ ok: false, message: 'No author profile image found', publicUrl: null });
  } catch (e) {
    console.error('Failed to fetch author profile image:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch author profile image' });
  }
});

// ============= IMAGE PROXY (Cache-enabled) ======================

// Proxy endpoint for Google and other external images to prevent rate limiting
// Implements caching with ETag support for 24-hour cache validity
const imageProxyCache = new Map(); // In-memory cache for image metadata

app.get('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    // Validate URL to prevent SSRF attacks
    try {
      const urlObj = new URL(url);
      const allowedDomains = [
        'lh3.googleusercontent.com',
        'lh4.googleusercontent.com',
        'lh5.googleusercontent.com',
        'lh6.googleusercontent.com',
        'apis.google.com',
        'books.google.com',
        'en.wikipedia.org',
        'commons.wikimedia.org'
      ];
      
      if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
        return res.status(403).json({ error: 'URL domain not allowed' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    
    // Check in-memory cache first
    if (imageProxyCache.has(url)) {
      const cached = imageProxyCache.get(url);
      const age = Date.now() - cached.timestamp;
      
      // Cache valid for 24 hours
      if (age < 86400000) {
        console.log(`✅ Serving cached image from memory: ${url}`);
        res.set('Content-Type', cached.contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('X-Cache', 'HIT');
        return res.send(cached.buffer);
      } else {
        // Remove expired cache
        imageProxyCache.delete(url);
      }
    }
    
    // Fetch image with proper headers to avoid rate limiting
    console.log(`📥 Fetching image through proxy: ${url}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://somalux.com/',
        'Accept': 'image/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=31536000'
      },
      maxRedirects: 5
    });
    
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const buffer = Buffer.from(response.data);
    
    // Cache the image in memory
    imageProxyCache.set(url, {
      buffer,
      contentType,
      timestamp: Date.now()
    });
    
    console.log(`✅ Cached image (${buffer.length} bytes): ${url}`);
    
    // Send with aggressive caching headers
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400, immutable');
    res.set('X-Cache', 'MISS');
    res.set('ETag', `"${crypto.createHash('sha256').update(buffer).digest('hex')}"`);
    res.send(buffer);
    
  } catch (error) {
    console.warn(`⚠️ Image proxy error:`, error.message);
    res.status(502).json({ 
      error: 'Failed to fetch image', 
      message: error.message 
    });
  }
});

// Periodic cleanup of old cache entries (run every 6 hours)
setInterval(() => {
  const now = Date.now();
  let removedCount = 0;
  
  for (const [url, data] of imageProxyCache.entries()) {
    if (now - data.timestamp > 86400000) {
      imageProxyCache.delete(url);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`🧹 Cleaned up ${removedCount} expired image cache entries`);
  }
}, 6 * 60 * 60 * 1000);

// =============PAYMENT SYSTEM=====================

// M-Pesa configuration
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_INITIATOR_NAME = process.env.MPESA_INITIATOR_NAME;
const MPESA_INITIATOR_PASSWORD = process.env.MPESA_INITIATOR_PASSWORD;
const MPESA_SECURITY_CREDENTIAL = process.env.MPESA_SECURITY_CREDENTIAL;
const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;
const MPESA_MODE = process.env.MPESA_MODE || 'live'; // 'demo' or 'live'

// Check if M-Pesa is properly configured
const MPESA_CONFIGURED = MPESA_CONSUMER_KEY && !MPESA_CONSUMER_KEY.includes('your_')
  && MPESA_CONSUMER_SECRET && !MPESA_CONSUMER_SECRET.includes('your_')
  && MPESA_BUSINESS_SHORTCODE && !MPESA_BUSINESS_SHORTCODE.includes('your_')
  && MPESA_PASSKEY && !MPESA_PASSKEY.includes('your_')
  && MPESA_MODE !== 'demo'; // Don't consider it configured if in demo mode

console.log(`[M-Pesa] Status: ${MPESA_MODE === 'demo' ? '🎮 DEMO MODE' : MPESA_CONFIGURED ? '✅ Configured' : '❌ Not configured - using demo mode'}`);

// M-Pesa API URLs
const MPESA_BASE_URL = MPESA_ENVIRONMENT === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// Helper function to get M-Pesa access token
async function getMpesaAccessToken() {
  try {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get M-Pesa access token:', error);
    throw new Error('Failed to authenticate with M-Pesa');
  }
}

// Helper function to generate timestamp
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
}

// Helper function to generate password
function generatePassword() {
  const timestamp = generateTimestamp();
  const shortcode = MPESA_BUSINESS_SHORTCODE;
  const passkey = MPESA_PASSKEY;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  return { password, timestamp };
}

const SUBSCRIPTION_PLANS = {
  books: {
    '1m': { months: 1, priceKes: 50 },
    '2m': { months: 2, priceKes: 100 },
    '3m': { months: 3, priceKes: 150 },
    '6m': { months: 6, priceKes: 300 },
    '12m': { months: 12, priceKes: 600 }
  },
  past_papers: {
    '1m': { months: 1, priceKes: 50 },
    '2m': { months: 2, priceKes: 100 },
    '3m': { months: 3, priceKes: 150 },
    '6m': { months: 6, priceKes: 300 },
    '12m': { months: 12, priceKes: 600 }
  },
  videos: {
    '1m': { months: 1, priceKes: 50 },
    '2m': { months: 2, priceKes: 100 },
    '3m': { months: 3, priceKes: 150 },
    '6m': { months: 6, priceKes: 300 },
    '12m': { months: 12, priceKes: 600 }
  }
};

app.post('/api/subscriptions/mpesa/init', async (req, res) => {
  try {
    console.log('🎯 [M-Pesa Init] Request received');
    console.log('   MPESA_MODE:', MPESA_MODE);
    console.log('   MPESA_CONFIGURED:', MPESA_CONFIGURED);
    console.log('   Body:', req.body);
    
    if (!supabaseAdmin) {
      console.error('Supabase admin not configured');
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    // Check if M-Pesa is configured
    if (!MPESA_CONFIGURED) {
      console.log('🎮 [M-Pesa] Running in DEMO MODE');
      
      // Return a demo/test response for development
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      // In demo mode, we can skip strict auth validation for testing
      // Just require the token to exist
      if (!token) {
        console.warn('⚠️ [M-Pesa Demo] No auth token provided, but continuing in demo mode');
      }

      let user_id = null;
      if (token) {
        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
          if (!userError && userData?.user) {
            user_id = userData.user.id;
            console.log('✅ [M-Pesa Demo] Token verified for user:', user_id);
          } else {
            console.warn('⚠️ [M-Pesa Demo] Token verification failed:', userError?.message || 'unknown error');
            // In demo mode, continue without verification
          }
        } catch (e) {
          console.warn('⚠️ [M-Pesa Demo] Token verification exception:', e.message);
          // In demo mode, continue without strict verification
        }
      }

      const body = req.body || {};
      const productKey = (body.product || 'books').toString();
      const planId = body.planId;
      const phoneNumber = body.phoneNumber;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required for M-Pesa payment' });
      }

      const productPlans = SUBSCRIPTION_PLANS[productKey];
      if (!productPlans || !productPlans[planId]) {
        return res.status(400).json({ error: 'Invalid product or planId' });
      }

      const plan = productPlans[planId];
      const reference = `sub_${productKey}_${user_id || 'demo'}_${Date.now()}`;

      // Return a demo response
      return res.json({
        ok: true,
        checkoutRequestId: 'DEMO_' + Date.now(),
        responseCode: '0',
        responseDescription: 'Demo mode - STK push initiated',
        customerMessage: 'Demo: Enter your M-Pesa PIN (this is a demo)',
        reference: reference,
        product: productKey,
        planId,
        months: plan.months,
        priceKes: plan.priceKes,
        phoneNumber: phoneNumber,
        isDemo: true
      });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization token' });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('Auth error:', userError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = userData.user;
    const body = req.body || {};
    const productKey = (body.product || 'books').toString();
    const planId = body.planId;
    const phoneNumber = body.phoneNumber; // M-Pesa phone number

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required for M-Pesa payment' });
    }

    const productPlans = SUBSCRIPTION_PLANS[productKey];
    if (!productPlans || !productPlans[planId]) {
      return res.status(400).json({ error: 'Invalid product or planId' });
    }

    const plan = productPlans[planId];
    const amount = plan.priceKes; // M-Pesa uses actual amount, not kobo
    const reference = `sub_${productKey}_${user.id}_${Date.now()}`;

    // Format phone number (remove +254, ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/\s+/g, '');
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    console.log('M-Pesa Init - Getting access token...');
    const accessToken = await getMpesaAccessToken();
    const { password, timestamp } = generatePassword();

    const stkPushPayload = {
      BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_BUSINESS_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: reference,
      TransactionDesc: `Subscription for ${productKey} - ${planId}`
    };

    console.log('M-Pesa Init - Sending STK push...');
    const stkResponse = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('M-Pesa response:', stkResponse.data);

    if (!stkResponse.data.ResponseCode || stkResponse.data.ResponseCode !== '0') {
      console.error('M-Pesa error response:', stkResponse.data);
      return res.status(500).json({ 
        error: stkResponse.data.ResponseDescription || 'Failed to initiate M-Pesa payment'
      });
    }

    res.json({
      ok: true,
      checkoutRequestId: stkResponse.data.CheckoutRequestID,
      responseCode: stkResponse.data.ResponseCode,
      responseDescription: stkResponse.data.ResponseDescription,
      customerMessage: stkResponse.data.CustomerMessage,
      reference: reference,
      product: productKey,
      planId,
      months: plan.months,
      priceKes: plan.priceKes,
      phoneNumber: formattedPhone,
      isDemo: false
    });
  } catch (error) {
    console.error('M-Pesa init error:', error.response?.data || error.message);
    const message = error?.response?.data?.errorMessage 
      || error?.response?.data?.message 
      || error?.message 
      || 'M-Pesa init failed';
    res.status(500).json({ error: message });
  }
});

app.post('/api/subscriptions/mpesa/verify', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization token' });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = userData.user;
    const body = req.body || {};
    const reference = body.reference;

    if (!reference) {
      return res.status(400).json({ error: 'reference is required' });
    }

    // Check if subscription already exists
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('mpesa_reference', reference)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({ error: existingError.message || 'Failed to load subscription' });
    }

    if (existing) {
      return res.json({ ok: true, subscription: existing });
    }

    // For demo mode, create a demo subscription
    if (!MPESA_CONFIGURED && reference.startsWith('sub_')) {
      const referenceParts = reference.split('_');
      if (referenceParts.length >= 3) {
        const productKey = referenceParts[1];
        
        // Try to find pending subscription to get plan info
        const { data: recentSubs, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('product', productKey)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!subError && recentSubs && recentSubs.length > 0) {
          const recentSub = recentSubs[0];
          const plan = SUBSCRIPTION_PLANS[productKey]?.[recentSub.plan_id];

          if (plan) {
            const startAt = new Date();
            const endAt = new Date();
            endAt.setMonth(endAt.getMonth() + plan.months);

            const { data: inserted, error: insertError } = await supabaseAdmin
              .from('subscriptions')
              .insert({
                user_id: user.id,
                product: productKey,
                plan_id: recentSub.plan_id,
                months: plan.months,
                price_kes: plan.priceKes,
                status: 'active',
                provider: 'mpesa',
                mpesa_reference: reference,
                mpesa_receipt: 'DEMO_' + Date.now(),
                raw_mpesa: { demo: true, message: 'Demo mode subscription' },
                start_at: startAt.toISOString(),
                end_at: endAt.toISOString()
              })
              .select('*')
              .single();

            if (!insertError && inserted) {
              console.log('Demo subscription created:', inserted.id);
              return res.json({ ok: true, subscription: inserted, isDemo: true });
            }
          }
        }
      }
    }

    // If not found and not demo mode, check if there's a pending transaction
    return res.status(202).json({
      ok: false,
      message: 'Payment is being processed. Please wait for confirmation or try again in a few minutes.'
    });

  } catch (error) {
    console.error('M-Pesa verify error:', error);
    const message = error?.response?.data?.errorMessage || error?.message || 'M-Pesa verify failed';
    res.status(500).json({ error: message });
  }
});

// M-Pesa callback endpoint
app.post('/api/subscriptions/mpesa/callback', async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const callbackData = req.body.Body?.stkCallback;
    if (!callbackData) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }

    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;
    const checkoutRequestId = callbackData.CheckoutRequestID;
    const accountReference = callbackData.CallbackMetadata?.Item?.find(
      item => item.Name === 'AccountReference'
    )?.Value;

    if (!accountReference) {
      console.error('No account reference in callback');
      return res.status(400).json({ error: 'Missing account reference' });
    }

    // Extract user info from reference (format: sub_{product}_{userId}_{timestamp})
    const referenceParts = accountReference.split('_');
    if (referenceParts.length < 4 || referenceParts[0] !== 'sub') {
      console.error('Invalid reference format:', accountReference);
      return res.status(400).json({ error: 'Invalid reference format' });
    }

    const productKey = referenceParts[1];
    const userId = referenceParts[2];

    if (resultCode !== 0) {
      console.log(`Payment failed for ${accountReference}: ${resultDesc}`);
      return res.json({ ok: false, message: 'Payment failed' });
    }

    // Extract payment details
    const callbackMetadata = callbackData.CallbackMetadata.Item;
    const amount = callbackMetadata.find(item => item.Name === 'Amount')?.Value;
    const mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
    const transactionDate = callbackMetadata.find(item => item.Name === 'TransactionDate')?.Value;
    const phoneNumber = callbackMetadata.find(item => item.Name === 'PhoneNumber')?.Value;

    // Find the subscription plan (we need to get this from our stored data)
    // For now, we'll check recent subscriptions or store plan info during init
    const { data: recentSubs, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('product', productKey)
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError || !recentSubs || recentSubs.length === 0) {
      console.error('No recent subscription found for user:', userId);
      return res.status(400).json({ error: 'Subscription not found' });
    }

    const recentSub = recentSubs[0];
    const plan = SUBSCRIPTION_PLANS[productKey][recentSub.plan_id];

    if (!plan) {
      console.error('Plan not found:', recentSub.plan_id);
      return res.status(400).json({ error: 'Plan not found' });
    }

    // Check if subscription already exists
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('mpesa_reference', accountReference)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing subscription:', existingError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      console.log('Subscription already exists for reference:', accountReference);
      return res.json({ ok: true, message: 'Subscription already processed' });
    }

    // Create subscription
    const startAt = new Date();
    const endAt = new Date();
    endAt.setMonth(endAt.getMonth() + plan.months);

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        product: productKey,
        plan_id: recentSub.plan_id,
        months: plan.months,
        price_kes: plan.priceKes,
        status: 'active',
        provider: 'mpesa',
        mpesa_reference: accountReference,
        mpesa_receipt: mpesaReceiptNumber,
        raw_mpesa: req.body,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString()
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Failed to save subscription:', insertError);
      return res.status(500).json({ error: insertError.message || 'Failed to save subscription' });
    }

    console.log('Subscription created successfully:', inserted.id);
    res.json({ ok: true, subscription: inserted });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// === READING ANALYTICS ENDPOINTS ===
// Reading statistics
app.get('/api/reading/stats/:userId', getReadingStats(supabaseAdmin));
app.get('/api/reading/activity/:userId', getReadingActivity(supabaseAdmin));

// Reading sessions (writes under RLS → require user-authenticated client)
app.post('/api/reading/session', (req, res) => createReadingSession(createClientFromRequest(req))(req, res));

// Reading goals (use user-authenticated client so RLS evaluates auth.uid())
app.get('/api/reading/goals/:userId', (req, res) => getReadingGoals(createClientFromRequest(req))(req, res));
app.post('/api/reading/goals', (req, res) => createReadingGoal(createClientFromRequest(req))(req, res));
app.put('/api/reading/goals/:goalId', (req, res) => updateReadingGoal(createClientFromRequest(req))(req, res));

// Achievements: reads can use admin; checks (writes) should use user client for RLS
app.get('/api/reading/achievements/:userId', getAchievements(supabaseAdmin));
app.post('/api/reading/achievements/check/:userId', (req, res) => checkAchievements(createClientFromRequest(req))(req, res));

// Leaderboard
app.get('/api/reading/leaderboard', getLeaderboard(supabaseAdmin));

// === USER REWARDS & POINTS ===
// Daily login reward
app.post('/api/rpc/daily_login_reward', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { user_id } = req.body || {};
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Check if user already claimed reward today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabaseAdmin
      .from('daily_rewards')
      .select('id')
      .eq('user_id', user_id)
      .gte('created_at', `${today}T00:00:00`)
      .single();

    if (existing) {
      return res.json({ 
        success: true, 
        message: 'Already claimed today',
        points: 0 
      });
    }

    // Award points
    const reward_points = 10;
    const { error: insertError } = await supabaseAdmin
      .from('daily_rewards')
      .insert({
        user_id,
        points: reward_points,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Daily reward error:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // Update user points
    const { data: currentStats } = await supabaseAdmin
      .from('user_points_stats')
      .select('total_points')
      .eq('user_id', user_id)
      .single();

    if (currentStats) {
      await supabaseAdmin
        .from('user_points_stats')
        .update({ total_points: (currentStats.total_points || 0) + reward_points })
        .eq('user_id', user_id);
    } else {
      await supabaseAdmin
        .from('user_points_stats')
        .insert({
          user_id,
          total_points: reward_points,
          daily_logins: 1
        });
    }

    res.json({ 
      success: true, 
      message: 'Daily reward claimed',
      points: reward_points 
    });
  } catch (error) {
    console.error('Daily login reward error:', error);
    res.status(500).json({ error: error.message || 'Failed to claim reward' });
  }
});

// Get user points stats
app.get('/api/user_points_stats', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id query parameter is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_points_stats')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error) {
      // Return empty stats if table/row doesn't exist
      return res.json({
        user_id,
        total_points: 0,
        daily_logins: 0,
        achievements_unlocked: 0
      });
    }

    res.json(data);
  } catch (error) {
    console.error('User points stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === ADMIN SEARCH ANALYTICS (search_events) ===
app.get('/api/admin/search-analytics/top', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not configured' });
    }

    const scope = req.query.scope || null;
    const days = Math.max(parseInt(req.query.days || '30', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 50);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabaseAdmin
      .from('search_events')
      .select('scope, query_text, results_count, created_at');

    if (scope) {
      query = query.eq('scope', scope);
    }

    query = query.gte('created_at', since).not('query_text', 'is', null);

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const buckets = new Map();
    (data || []).forEach((row) => {
      const keyScope = row.scope || 'unknown';
      const keyQuery = (row.query_text || '').trim();
      if (!keyQuery) return;
      const key = `${keyScope}__${keyQuery}`;
      const existing = buckets.get(key) || {
        scope: keyScope,
        query_text: keyQuery,
        search_count: 0,
        last_searched: null,
        results_sum: 0,
        results_count_non_null: 0,
      };

      existing.search_count += 1;
      const ts = row.created_at ? new Date(row.created_at).getTime() : 0;
      const lastTs = existing.last_searched ? new Date(existing.last_searched).getTime() : 0;
      if (ts > lastTs) existing.last_searched = row.created_at;

      if (typeof row.results_count === 'number') {
        existing.results_sum += row.results_count;
        existing.results_count_non_null += 1;
      }

      buckets.set(key, existing);
    });

    let rows = Array.from(buckets.values());
    rows.forEach((r) => {
      r.avg_results = r.results_count_non_null > 0 ? r.results_sum / r.results_count_non_null : null;
      delete r.results_sum;
      delete r.results_count_non_null;
    });

    rows.sort((a, b) => b.search_count - a.search_count);
    rows = rows.slice(0, limit);

    res.json({ ok: true, scope: scope || null, rows });
  } catch (e) {
    console.error('Failed to fetch admin search analytics (top):', e);
    res.status(500).json({ error: e.message || 'Failed to fetch search analytics' });
  }
});

app.get('/api/admin/search-analytics/user/:userId', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not configured' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit || '200', 10), 1), 500);
    const daysRaw = req.query.days;
    let sinceIso = null;
    if (daysRaw) {
      const days = Math.max(parseInt(daysRaw, 10), 1);
      sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    }

    let query = supabaseAdmin
      .from('search_events')
      .select('id, scope, query_text, results_count, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sinceIso) {
      query = query.gte('created_at', sinceIso);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    res.json({ ok: true, events: data || [] });
  } catch (e) {
    console.error('Failed to fetch user search history (admin):', e);
    res.status(500).json({ error: e.message || 'Failed to fetch user search history' });
  }
});

// === USER RANKINGS (30-day activity window) ===
// Helper to safely fetch aggregated data with supabaseAdmin
async function safeAggregate(queryPromise, fallback = []) {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.warn('user_rankings aggregate error:', error.message || error);
      return fallback;
    }
    return data || fallback;
  } catch (e) {
    console.warn('user_rankings aggregate exception:', e.message || e);
    return fallback;
  }
}

async function recomputeUserRankings() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  const windowStartIso = windowStart.toISOString();
  const nowIso = windowEnd.toISOString();

  // Load base users (profiles)
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name');
  if (profilesError) throw profilesError;

  const userIds = (profiles || []).map((p) => p.id);
  if (userIds.length === 0) return [];

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const { data: existingRankings, error: existingRankingsError } = await supabaseAdmin
    .from('user_rankings')
    .select('user_id, tier');
  if (existingRankingsError) throw existingRankingsError;

  const previousTierMap = new Map((existingRankings || []).map((r) => [r.user_id, r.tier]));

  // Aggregates over last 30 days
  const [sessionsAgg, viewsAgg, likesAgg, commentsAgg, uploadsAgg, goalsAgg, achievementsAgg, streaksAgg, subsAgg, searchesAgg] = await Promise.all([
    // reading_sessions: sum pages_read
    safeAggregate(
      supabaseAdmin
        .from('reading_sessions')
        .select('user_id, sum(pages_read) as total_pages')
        .gte('started_at', windowStartIso)
        .group('user_id')
    ),
    // book_views: count
    safeAggregate(
      supabaseAdmin
        .from('book_views')
        .select('user_id, count(id) as views_count')
        .gte('viewed_at', windowStartIso)
        .group('user_id')
    ),
    // book_likes: count
    safeAggregate(
      supabaseAdmin
        .from('book_likes')
        .select('user_id, count(id) as likes_count')
        .gte('created_at', windowStartIso)
        .group('user_id')
    ),
    // book_comments: count
    safeAggregate(
      supabaseAdmin
        .from('book_comments')
        .select('user_id, count(id) as comments_count')
        .gte('created_at', windowStartIso)
        .group('user_id')
    ),
    // uploads: count books uploaded overall (not time-limited for v1)
    safeAggregate(
      supabaseAdmin
        .from('books')
        .select('uploaded_by, count(id) as uploads_count')
        .not('uploaded_by', 'is', null)
        .group('uploaded_by')
    ),
    // goals completed (progress >= target_books) in window
    safeAggregate(
      supabaseAdmin
        .from('reading_goals')
        .select('user_id, count(id) as goals_completed')
        .gte('updated_at', windowStartIso)
        .lte('updated_at', nowIso)
        .gte('current_progress', 1)
        .group('user_id')
    ),
    // achievements earned in window
    safeAggregate(
      supabaseAdmin
        .from('user_achievements')
        .select('user_id, count(id) as achievements_count')
        .gte('earned_at', windowStartIso)
        .group('user_id')
    ),
    // reading streaks (current streak not time-bound; use as-is)
    safeAggregate(
      supabaseAdmin
        .from('reading_streaks')
        .select('user_id, current_streak')
    ),
    // active book subscriptions
    safeAggregate(
      supabaseAdmin
        .from('subscriptions')
        .select('user_id, status, product, end_at')
        .eq('product', 'books')
        .eq('status', 'active')
    ),
    // search events: count of searches in window
    safeAggregate(
      supabaseAdmin
        .from('search_events')
        .select('user_id, count(id) as searches_count')
        .gte('created_at', windowStartIso)
        .group('user_id')
    ),
  ]);

  const sessionsMap = new Map(sessionsAgg.map((r) => [r.user_id, Number(r.total_pages) || 0]));
  const viewsMap = new Map(viewsAgg.map((r) => [r.user_id, Number(r.views_count) || 0]));
  const likesMap = new Map(likesAgg.map((r) => [r.user_id, Number(r.likes_count) || 0]));
  const commentsMap = new Map(commentsAgg.map((r) => [r.user_id, Number(r.comments_count) || 0]));
  const uploadsMap = new Map(uploadsAgg.map((r) => [r.uploaded_by, Number(r.uploads_count) || 0]));
  const goalsMap = new Map(goalsAgg.map((r) => [r.user_id, Number(r.goals_completed) || 0]));
  const achievementsMap = new Map(achievementsAgg.map((r) => [r.user_id, Number(r.achievements_count) || 0]));
  const streaksMap = new Map(streaksAgg.map((r) => [r.user_id, Number(r.current_streak) || 0]));
  const searchesMap = new Map(searchesAgg.map((r) => [r.user_id, Number(r.searches_count) || 0]));

  const subsSet = new Set(
    subsAgg
      .filter((s) => s.end_at && new Date(s.end_at) > windowStart)
      .map((s) => s.user_id)
  );

  const rows = [];
  const legendEmailPromises = [];

  for (const userId of userIds) {
    const totalPages = sessionsMap.get(userId) || 0;
    const streakDays = streaksMap.get(userId) || 0;
    const views = viewsMap.get(userId) || 0;
    const likes = likesMap.get(userId) || 0;
    const comments = commentsMap.get(userId) || 0;
    const uploads = uploadsMap.get(userId) || 0;
    const goalsCompleted = goalsMap.get(userId) || 0;
    const achievementsCount = achievementsMap.get(userId) || 0;
    const searches = searchesMap.get(userId) || 0;
    const isSubscriber = subsSet.has(userId);

    // Reading score: treat pages_read as "minutes" proxy
    const readingScore = Math.min(totalPages, 600) * 0.2 + Math.min(streakDays, 30) * 1;

    const engagementScore =
      Math.min(views, 200) * 0.05 +
      Math.min(likes, 200) * 0.1 +
      Math.min(comments, 100) * 0.5 +
      Math.min(searches, 400) * 0.05; // include searches with a modest weight

    const contributionScore = uploads * 10; // v1: only uploads; can extend later

    const goalsScore = goalsCompleted * 5;
    const achievementsScore = achievementsCount * 8;

    const baseScore =
      readingScore +
      engagementScore +
      contributionScore +
      goalsScore +
      achievementsScore;

    const multiplier = isSubscriber ? 1.1 : 1.0;
    const finalScore = baseScore * multiplier;

    let tier = 'new_reader';
    if (finalScore >= 1500) tier = 'legend';
    else if (finalScore >= 700) tier = 'community_star';
    else if (finalScore >= 300) tier = 'power_reader';
    else if (finalScore >= 100) tier = 'active_reader';

    const prevTier = previousTierMap.get(userId) || null;
    const justBecameLegend = tier === 'legend' && prevTier !== 'legend';

    if (justBecameLegend) {
      const profile = profileMap.get(userId);
      const to = profile?.email || null;
      if (to) {
        const displayName = profile?.full_name || profile?.email || 'Reader';
        const subject = '🎉 You reached Legend status — Campus Life | Paltech';
        const bodyHtml = `
          <div style="font-size:14px;color:#111827;">
            <p>Dear ${displayName},</p>
            <p>Congratulations! You have unlocked the <strong>highest reading tier</strong> on Campus Life.</p>
            <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin:20px 0;border-radius:8px;">
              <h3 style="margin:0 0 8px;color:#16a34a;font-size:16px;">Legend Reader</h3>
              <p style="margin:0;color:#374151;font-size:14px;">
                This tier recognises outstanding consistency in reading, engagement and contributions to the community.
              </p>
            </div>
            <p style="color:#374151;">Thank you for being an active part of the Campus Life reading community. Keep exploring, learning and inspiring others.</p>
          </div>
        `;

        const plainText = `
Dear ${displayName},

Congratulations! You have unlocked the highest reading tier on Campus Life.

LEGEND READER
This tier recognises outstanding consistency in reading, engagement and contributions to the community.

Thank you for being an active part of the Campus Life reading community. Keep exploring, learning and inspiring others.

Campus Life | Paltech
Your digital campus companion
        `.trim();

        const html = buildBrandedEmailHtml({ title: subject, body: bodyHtml });
        legendEmailPromises.push(
          sendEmail({ to, subject, text: plainText, html }).catch((e) => {
            console.warn('Failed to send legend tier email for user', userId, e?.message || e);
          })
        );
      }
    }

    rows.push({
      user_id: userId,
      score: finalScore,
      tier,
      window_start: windowStartIso,
      window_end: nowIso,
      reading_score: readingScore,
      engagement_score: engagementScore,
      contribution_score: contributionScore,
      goals_score: goalsScore,
      achievements_score: achievementsScore,
      subscription_bonus_applied: isSubscriber,
      updated_at: nowIso,
    });
  }

  // Sort and assign rank positions
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((row, idx) => {
    row.rank_position = idx + 1;
  });

  // Upsert into user_rankings
  const { error: upsertError } = await supabaseAdmin
    .from('user_rankings')
    .upsert(rows, { onConflict: 'user_id' });
  if (upsertError) throw upsertError;

  if (legendEmailPromises.length > 0) {
    await Promise.allSettled(legendEmailPromises);
  }

  return rows;
}

// Admin endpoint to recompute rankings (should be auth-protected in production)
app.post('/api/admin/user-rankings/recompute', async (req, res) => {
  try {
    const rows = await recomputeUserRankings();
    res.json({ ok: true, count: rows.length });
  } catch (e) {
    console.error('Failed to recompute user rankings:', e);
    res.status(500).json({ error: e.message || 'Failed to recompute rankings' });
  }
});

// Admin endpoint to fetch all rankings joined with basic profile info
app.get('/api/admin/user-rankings', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_rankings')
      .select('user_id, score, tier, rank_position, reading_score, engagement_score, contribution_score, goals_score, achievements_score, subscription_bonus_applied, updated_at, profiles:profiles!inner(id, email, full_name, role, avatar_url)')
      .order('rank_position', { ascending: true });

    if (error) throw error;

    res.json({ ok: true, rankings: data || [] });
  } catch (e) {
    console.error('Failed to fetch user rankings:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
  }
});

// Admin endpoint to fetch ranking for a single user
app.get('/api/admin/user-rankings/:userId', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not configured' });
    }

    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('user_rankings')
      .select('user_id, score, tier, rank_position, reading_score, engagement_score, contribution_score, goals_score, achievements_score, subscription_bonus_applied, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ranking not found' });

    res.json({ ok: true, ranking: data });
  } catch (e) {
    console.error('Failed to fetch user ranking by id:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch ranking' });
  }
});

// =====================================================
// AD SYSTEM ROUTES
// =====================================================
app.use('/api', adsApiV2);

// =====================================================
// RANKING SYSTEM ROUTES
// =====================================================
app.use('/api/admin/rankings', createRankingRoutes(supabaseAdmin));

// =====================================================
// ADMIN MIGRATION ENDPOINT
// =====================================================
app.post('/api/admin/migrate/fix-submission-fields', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured' });
    
    // Check authorization (simple check - in production, use proper auth)
    const actorEmail = req.headers['x-actor-email'];
    const actorId = req.headers['x-actor-id'];
    if (!actorEmail || !actorId) {
      return res.status(401).json({ error: 'Unauthorized: Missing actor credentials' });
    }
    
    console.log('🔄 Running migration: fix-submission-fields...');
    
    // Fix book_submissions rejected_by
    const { data: bookRejectedFixed, error: err1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `UPDATE public.book_submissions
            SET rejected_by = NULL
            WHERE rejected_by IS NOT NULL
              AND rejected_by::text ~ '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'`
    }).catch(() => ({ data: null, error: { message: 'Function not available' } }));
    
    // Fallback: Use direct SQL with better error handling
    let fixedCount = 0;
    try {
      // Fix book_submissions with invalid rejected_by
      await supabaseAdmin
        .from('book_submissions')
        .update({ rejected_by: null })
        .filter('rejected_by', 'neq', 'null')
        .then(() => fixedCount++);
      
      // Fix book_submissions with invalid approved_by
      await supabaseAdmin
        .from('book_submissions')
        .update({ approved_by: null })
        .filter('approved_by', 'neq', 'null')
        .then(() => fixedCount++);
      
      // Fix past_paper_submissions with invalid rejected_by
      await supabaseAdmin
        .from('past_paper_submissions')
        .update({ rejected_by: null })
        .filter('rejected_by', 'neq', 'null')
        .then(() => fixedCount++);
      
      // Fix past_paper_submissions with invalid approved_by
      await supabaseAdmin
        .from('past_paper_submissions')
        .update({ approved_by: null })
        .filter('approved_by', 'neq', 'null')
        .then(() => fixedCount++);
    } catch (innerErr) {
      console.warn('Direct update failed:', innerErr.message);
    }
    
    console.log(`✅ Migration complete`);
    res.json({ 
      ok: true, 
      message: 'Migration applied successfully',
      details: 'Cleaned up corrupted admin_id fields in submission tables'
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ error: error.message || 'Migration failed' });
  }
});

// TEST ENDPOINT - for debugging (MUST be before server.listen)
app.get('/api/test/check-dir', (req, res) => {
  const dirPath = req.query.dirPath;
  console.log(`🔍 [TEST] Checking directory: ${dirPath}`);
  
  if (!dirPath) return res.status(400).json({ error: 'dirPath query param required' });
  
  try {
    const exists = fs.existsSync(dirPath);
    const isDir = exists && fs.statSync(dirPath).isDirectory();
    const files = isDir ? fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf')).slice(0, 5) : [];
    const allFiles = isDir ? fs.readdirSync(dirPath).slice(0, 10) : [];
    
    console.log(`✅ [TEST] Directory check result:`, { exists, isDir, pdfCount: files.length, totalFiles: allFiles.length });
    
    res.json({
      ok: true,
      exists,
      isDir,
      pdfFiles: files,
      allFiles: allFiles,
      message: isDir ? `Directory found with ${allFiles.length} files` : 'Path is not a directory'
    });
  } catch (err) {
    console.error(`❌ [TEST] Error:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// START SERVER - Must be after all routes are defined
// Global error handler middleware (catch-all for unhandled errors)
app.use((err, req, res, next) => {
  console.error('❌ [GLOBAL ERROR HANDLER] Unhandled error:', err.message);
  console.error('   Stack:', err.stack);
  
  // Always return JSON, never HTML
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal server error',
    message: 'An error occurred processing your request'
  });
});

// Serve React frontend from build folder
// Build folder is at project root: ../build (when running from backend/)
// Fallback to absolute path if running from root
const buildPath = process.env.BUILD_PATH 
  || path.resolve(process.cwd(), '..', 'build')
  || path.resolve(process.cwd(), 'build');

console.log(`📁 Current working directory: ${process.cwd()}`);
console.log(`📁 Checking build folder at: ${buildPath}`);
console.log(`✅ Build exists: ${existsSync(buildPath)}`);

if (existsSync(buildPath)) {
  console.log(`🚀 Serving React frontend from build folder`);
  
  // Route to serve HTML with dynamic meta tags for social sharing - MUST BE BEFORE static middleware
  app.get('/api/og', async (req, res) => {
    const { type, id, title, image, description } = req.query;
    
    // Validate inputs
    if (!type || !id) {
      return res.json({ error: 'Missing type or id parameter' });
    }
    
    try {
      // Read the base index.html
      let html = fs.readFileSync(path.join(buildPath, 'index.html'), 'utf8');
      
      // Determine the URL and image
      const baseUrl = process.env.FRONTEND_URL || 'https://somalux.co.ke';
      let ogUrl = baseUrl;
      let ogTitle = title ? decodeURIComponent(title) : 'Somalux.co.ke';
      let ogDescription = description ? decodeURIComponent(description) : 'Authenticity.';
      let ogImage = image ? decodeURIComponent(image) : `${baseUrl}/PaltechBlack192.png`;
      
      // Ensure image URL is absolute
      if (ogImage && !ogImage.startsWith('http')) {
        ogImage = `${baseUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
      }
      
      if (type === 'book') {
        ogUrl = `${baseUrl}/BookManagement?id=${id}`;
      } else if (type === 'paper') {
        ogUrl = `${baseUrl}/PastPapers?paper=${id}`;
      }
      
      // Replace meta tags with proper escaping for HTML attributes
      const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#x27;');
      };
      
      // Replace og:image (CRITICAL FOR SHARING)
      html = html.replace(
        /<meta property="og:image" content="[^"]*">/,
        `<meta property="og:image" content="${escapeHtml(ogImage)}">`
      );
      html = html.replace(
        /<meta name="twitter:image" content="[^"]*">/,
        `<meta name="twitter:image" content="${escapeHtml(ogImage)}">`
      );
      
      // Replace og:url
      html = html.replace(
        /<meta property="og:url" content="[^"]*">/,
        `<meta property="og:url" content="${escapeHtml(ogUrl)}">`
      );
      html = html.replace(
        /<meta name="twitter:url" content="[^"]*">/,
        `<meta name="twitter:url" content="${escapeHtml(ogUrl)}">`
      );
      
      // Replace og:title
      html = html.replace(
        /<meta property="og:title" content="[^"]*">/,
        `<meta property="og:title" content="${escapeHtml(ogTitle)}"`
      );
      html = html.replace(
        /<meta name="twitter:title" content="[^"]*">/,
        `<meta name="twitter:title" content="${escapeHtml(ogTitle)}"`
      );
      
      // Replace og:description
      html = html.replace(
        /<meta property="og:description" content="[^"]*">/,
        `<meta property="og:description" content="${escapeHtml(ogDescription)}"`
      );
      html = html.replace(
        /<meta name="twitter:description" content="[^"]*">/,
        `<meta name="twitter:description" content="${escapeHtml(ogDescription)}"`
      );
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Error serving OG meta tags:', error);
      res.status(500).json({ error: 'Failed to generate meta tags' });
    }
  });
  
  app.use(express.static(buildPath));
  
  // Catch-all for client-side routing - use middleware syntax
  app.use((req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to serve frontend' });
      }
    });
  });
} else {
  console.warn(`⚠️ Build folder not found at ${buildPath}`);
  
  // Fallback: simple health check
  app.get('/', (req, res) => {
    res.json({ 
      ok: true, 
      message: 'Somalux Backend is running',
      note: 'Build folder not found',
      buildPath: buildPath
    });
  });
}

// Search for faculty of a unit at a university using Google Search
// This helps auto-fill the faculty field accurately
app.get('/api/elib/search-unit-faculty', async (req, res) => {
  try {
    const { universityName, unitCode, unitName } = req.query;
    
    if (!universityName || !unitCode) {
      return res.status(400).json({ error: 'universityName and unitCode are required' });
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.warn('⚠️ Google Search API not configured');
      return res.status(503).json({ 
        error: 'Faculty search not available',
        fallback: true 
      });
    }

    // Known Egerton University faculties for matching
    const egerton_faculties = [
      'Faculty of Agriculture',
      'Faculty of Arts and Social Sciences',
      'Faculty of Commerce',
      'Faculty of Education and Community Development Studies',
      'Faculty of Engineering and Technology',
      'Faculty of Environment and Resources Development',
      'Faculty of Health Sciences',
      'Faculty of Law',
      'Faculty of Science',
      'Faculty of Veterinary Medicine and Surgery'
    ];

    // ======================================================
    // EGERTON UNIVERSITY 2026 - VERIFIED UNIT CODES
    // 161 Verified Codes Across 10 Faculties
    // ======================================================
    const egerton_unit_mapping = {
      // ========== 1. FACULTY OF AGRICULTURE (FoA) - 13 codes ==========
      'AGEC': 'Agriculture', 'AGBM': 'Agriculture',
      'ANSC': 'Agriculture', 'APHY': 'Agriculture',
      'CROP': 'Agriculture', 'HORT': 'Agriculture',
      'SOIL': 'Agriculture', 'LPBP': 'Agriculture',
      'DAIR': 'Agriculture', 'FOST': 'Agriculture',
      'AENG': 'Agriculture', 'ENTM': 'Agriculture',
      'AGRI': 'Agriculture',
      
      // ========== 2. FACULTY OF ARTS & SOCIAL SCIENCES (FASS) - 18 codes ==========
      'ECON': 'FASS', 'BECO': 'FASS',
      'STAT': 'FASS', 'LITL': 'FASS',
      'ENGL': 'FASS', 'KISW': 'FASS',
      'LINS': 'FASS', 'FREN': 'FASS',
      'GERM': 'FASS', 'CRSS': 'FASS',
      'SOCI': 'FASS', 'PSCS': 'FASS',
      'PHIL': 'FASS', 'HIST': 'FASS',
      'RELI': 'FASS', 'ANTH': 'FASS',
      'LIBS': 'FASS', 'COMM': 'FASS',
      
      // ========== 3. FACULTY OF COMMERCE (FoC) - 11 codes ==========
      'BACT': 'Commerce', 'BFIN': 'Commerce',
      'BOPM': 'Commerce', 'BBIS': 'Commerce',
      'BMGT': 'Commerce', 'BBAM': 'Commerce',
      'BCOM': 'Commerce', 'PROC': 'Commerce',
      'ENTR': 'Commerce', 'HRM': 'Commerce',
      'MARK': 'Commerce',
      
      // ========== 4. FACULTY OF EDUCATION & COMMUNITY DEVELOPMENT STUDIES (FEDCOS) - 15 codes ==========
      'AGED': 'FEDCOS',
      'ACDS': 'FEDCOS',
      'ADSN': 'FEDCOS',
      'CDEV': 'FEDCOS',
      'CIEM': 'FEDCOS',
      'BUST': 'FEDCOS',
      'EPSC': 'FEDCOS',
      'EDFO': 'FEDCOS',
      'EDUC': 'FEDCOS',
      'MENT': 'FEDCOS',
      'PSYC': 'FEDCOS',
      'GUID': 'FEDCOS',
      'COUN': 'FEDCOS',
      'ECD': 'FEDCOS',
      'SPEC': 'FEDCOS',
      
      // ========== 5. FACULTY OF ENGINEERING & TECHNOLOGY (FET) - 20 codes ==========
      'AGEN': 'FET',
      'CEEN': 'FET',
      'ECEN': 'FET',
      'IEEN': 'FET',
      'MEEN': 'FET',
      'WREN': 'FET',
      'BENG': 'FET',
      'CENG': 'FET',
      'SENG': 'FET',
      'EENG': 'FET',
      'PENG': 'FET',
      'TENG': 'FET',
      'MENG': 'FET',
      'COMP': 'FET',
      'ICT': 'FET',
      'CSCI': 'FET',
      'DATA': 'FET',
      'SOFT': 'FET',
      'NETS': 'FET',
      
      // ========== 6. FACULTY OF ENVIRONMENT & RESOURCES DEVELOPMENT (FERD) - 17 codes ==========
      'ENVS': 'FERD',
      'GEOG': 'FERD',
      'NRES': 'FERD',
      'FRST': 'FERD',
      'DRLM': 'FERD',
      'WILD': 'FERD',
      'ECOT': 'FERD',
      'WEM': 'FERD',
      'LAND': 'FERD',
      'ENVI': 'FERD',
      'ENMS': 'FERD',
      'CLEE': 'FERD',
      'WRES': 'FERD',
      'FRES': 'FERD',
      'SWCO': 'FERD',
      'CONS': 'FERD',
      'NARE': 'FERD',
      
      // ========== 7. FACULTY OF HEALTH SCIENCES (FHS) - 21 codes ==========
      'ANAT': 'Health Sciences', 'PHYS': 'Health Sciences',
      'PATH': 'Health Sciences', 'NURS': 'Health Sciences',
      'NUTR': 'Health Sciences', 'COMH': 'Health Sciences',
      'REPH': 'Health Sciences', 'PEDI': 'Health Sciences',
      'IMED': 'Health Sciences', 'SURG': 'Health Sciences',
      'CLIN': 'Health Sciences', 'EPID': 'Health Sciences',
      'MICB': 'Health Sciences', 'MED': 'Health Sciences',
      'MEDS': 'Health Sciences', 'PHAR': 'Health Sciences',
      'PHARM': 'Health Sciences', 'CHEM': 'Health Sciences',
      'DENT': 'Health Sciences', 'DRES': 'Health Sciences',
      'PUHE': 'Health Sciences',
      
      // ========== 8. FACULTY OF LAW (FoL) - 7 codes ==========
      'LAW': 'Law', 'LLB': 'Law',
      'CLAW': 'Law', 'PLAW': 'Law',
      'ILWA': 'Law', 'LAWI': 'Law',
      'LAWS': 'Law',
      
      // ========== 9. FACULTY OF SCIENCE (FoS) - 25 codes ==========
      'BIOL': 'Science', 'ZOO': 'Science',
      'BOT': 'Science', 'BCMB': 'Science',
      'CHEM': 'Science', 'COMP': 'Science',
      'MATH': 'Science', 'STAT': 'Science',
      'PHYS': 'Science', 'MET': 'Science',
      'ORGA': 'Science', 'INOR': 'Science',
      'PHCH': 'Science', 'MECH': 'Science',
      'ELEC': 'Science', 'OPTI': 'Science',
      'BIO': 'Science', 'ZOOL': 'Science',
      'ECOL': 'Science', 'GENT': 'Science',
      'ALGE': 'Science', 'CALC': 'Science',
      'GEOL': 'Science', 'MING': 'Science',
      'GEOM': 'Science',
      
      // ========== 10. FACULTY OF VETERINARY MEDICINE & SURGERY (FVMS) - 15 codes ==========
      'VAPH': 'Veterinary Medicine and Surgery',
      'VMTP': 'Veterinary Medicine and Surgery',
      'VPMP': 'Veterinary Medicine and Surgery',
      'VETA': 'Veterinary Medicine and Surgery',
      'PARA': 'Veterinary Medicine and Surgery',
      'ANAV': 'Veterinary Medicine and Surgery',
      'VMED': 'Veterinary Medicine and Surgery',
      'VETS': 'Veterinary Medicine and Surgery',
      'VSUR': 'Veterinary Medicine and Surgery',
      'DVSO': 'Veterinary Medicine and Surgery',
      'VPAT': 'Veterinary Medicine and Surgery',
      'VPHE': 'Veterinary Medicine and Surgery',
      'DVET': 'Veterinary Medicine and Surgery',
      'VANA': 'Veterinary Medicine and Surgery',
      'VPHY': 'Veterinary Medicine and Surgery'
    };

    const detectEgertonFaculty = (unitPrefix) => {
      if (!unitPrefix) return null;
      const faculty = egerton_unit_mapping[unitPrefix];
      if (faculty) {
        console.log(`✅ Backend: Egerton verified: "${unitPrefix}" → ${faculty}`);
        return faculty;
      }
      console.log(`❌ Backend: Unknown Egerton unit code: "${unitPrefix}"`);
      return null;
    };

    // Helper function to search and extract faculty
    const searchForFaculty = async (query) => {
      try {
        const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&num=5`;
        
        const response = await axios.get(googleSearchUrl, { timeout: 5000 });
        const results = response.data.items || [];
        
        // Patterns to extract faculty
        const facultyPatterns = [
          /FACULTY\s+OF\s+([A-Z][A-Za-z\s&,.-]+?)(?:\n|\.|,|$|EXAMINATION|EXAM|DEPARTMENT|SCHOOL)/i,
          /SCHOOL\s+OF\s+([A-Z][A-Za-z\s&,.-]+?)(?:\n|\.|,|$|EXAMINATION|EXAM|DEPARTMENT)/i,
          /DEPARTMENT\s+OF\s+([A-Z][A-Za-z\s&,.-]+?)(?:\n|\.|,|$|EXAMINATION|EXAM)/i,
          /(?:FACULTY|SCHOOL|DEPARTMENT):\s*([A-Z][A-Za-z\s&,.-]+?)(?:\n|\.|,|$)/i,
          /([A-Z][A-Za-z\s&,.-]*FACULTY[A-Za-z\s&,.-]*?)(?:\n|\.|,|$|EXAMINATION|EXAM)/i
        ];
        
        for (const result of results) {
          const text = (result.snippet || '').toUpperCase();
          const title = (result.title || '').toUpperCase();
          const combined = title + ' ' + text;
          
          for (const pattern of facultyPatterns) {
            const match = combined.match(pattern);
            if (match && match[1]) {
              const extracted = match[1].trim().replace(/\d+/g, '').trim();
              
              // Check if extracted text matches known Egerton faculties
              for (const egerton_fac of egerton_faculties) {
                if (egerton_fac.toUpperCase().includes(extracted) || extracted.includes(egerton_fac.toUpperCase())) {
                  return egerton_fac;
                }
                // Also check partial matches
                const egerton_words = egerton_fac.split(/\s+/);
                const extracted_words = extracted.split(/\s+/);
                if (egerton_words.some(w => extracted_words.some(ew => ew.length > 4 && w.includes(ew)))) {
                  return egerton_fac;
                }
              }
              
              // If no exact match but extracted text looks valid, return it
              if (extracted.length > 4 && extracted.length < 120) {
                return extracted;
              }
            }
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error in faculty search:', error.message);
        return null;
      }
    };

    let faculty = null;

    // Strategy 1: Search with full context "[University] [Unit Code] [Unit Name] faculty"
    console.log(`🔍 Strategy 1: Searching "${universityName} ${unitCode} ${unitName || ''} faculty"`);
    faculty = await searchForFaculty(`${universityName} ${unitCode} ${unitName || ''} faculty site:.ac.ke OR site:.edu`);
    
    // Strategy 2: If not found, try with just unit code and name
    if (!faculty) {
      console.log(`🔍 Strategy 2: Searching "${unitCode} ${unitName || ''} course"`);
      faculty = await searchForFaculty(`${unitCode} ${unitName || ''} course ${universityName} site:.ac.ke`);
    }
    
    // Strategy 3: Try unit code alone
    if (!faculty) {
      console.log(`🔍 Strategy 3: Searching "${unitCode} ${universityName}"`);
      faculty = await searchForFaculty(`${unitCode} ${universityName} department site:.ac.ke`);
    }
    
    // Strategy 4: Try unit name if available
    if (!faculty && unitName) {
      console.log(`🔍 Strategy 4: Searching "${unitName} ${universityName}"`);
      faculty = await searchForFaculty(`${unitName} ${universityName} faculty site:.ac.ke`);
    }
    
    // Strategy 5: Use Egerton strict detection (exact match only)
    if (!faculty && universityName) {
      const isEgerton = universityName.toLowerCase().includes('egerton');
      
      if (isEgerton) {
        console.log(`🔍 Strategy 5: Egerton strict detection (exact match only)`);
        const unitPrefix = unitCode.replace(/\d+/g, '').toUpperCase().trim();
        console.log(`📋 Unit prefix: "${unitPrefix}"`);
        
        faculty = detectEgertonFaculty(unitPrefix);
        
        if (faculty) {
          console.log(`✅ Found faculty from Egerton mapping: ${faculty}`);
        } else {
          console.log(`⚠️ Unknown unit code at Egerton: "${unitPrefix}"`);
        }
      }
    }
    
    if (faculty) {
      console.log(`✅ Found faculty via detection strategy: ${faculty}`);
      return res.json({ faculty, source: 'detection' });
    }
    
    console.log(`⚠️ No faculty found for ${unitCode} at ${universityName}`);
    return res.json({ faculty: null, source: 'not_found' });
    
  } catch (error) {
    console.error('Error searching for faculty:', error.message);
    return res.status(500).json({ 
      error: 'Faculty search failed',
      details: error.message 
    });
  }
});

// Get user notifications (approval/rejection status updates)
app.get('/api/user/notifications', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured' });

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'Missing x-user-id header' });
    }

    // Fetch user's submission approval/rejection history
    const { data: bookSubmissions, error: bookErr } = await supabaseAdmin
      .from('book_submissions')
      .select('id, title, status, approved_at, rejected_at, admin_notes')
      .eq('uploaded_by', userId)
      .in('status', ['approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: paperSubmissions, error: paperErr } = await supabaseAdmin
      .from('past_paper_submissions')
      .select('id, unit_code, unit_name, year, status, approved_at, rejected_at, admin_notes')
      .eq('uploaded_by', userId)
      .in('status', ['approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (bookErr || paperErr) {
      console.error('Error fetching notifications:', { bookErr, paperErr });
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Transform into notification objects
    const notifications = [
      ...(bookSubmissions || []).map(sub => ({
        id: sub.id,
        type: 'book',
        title: sub.title,
        status: sub.status,
        timestamp: sub.status === 'approved' ? sub.approved_at : sub.rejected_at,
        reason: sub.admin_notes,
        message: sub.status === 'approved' 
          ? `Your book "${sub.title}" has been approved and published!`
          : `Your book submission "${sub.title}" was not approved.${sub.admin_notes ? ` Reason: ${sub.admin_notes}` : ''}`
      })),
      ...(paperSubmissions || []).map(sub => {
        const paperName = `${sub.unit_code} ${sub.unit_name} (${sub.year})`.trim();
        return {
          id: sub.id,
          type: 'paper',
          title: paperName,
          status: sub.status,
          timestamp: sub.status === 'approved' ? sub.approved_at : sub.rejected_at,
          reason: sub.admin_notes,
          message: sub.status === 'approved'
            ? `Your past paper "${paperName}" has been approved and published!`
            : `Your past paper submission "${paperName}" was not approved.${sub.admin_notes ? ` Reason: ${sub.admin_notes}` : ''}`
        };
      })
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      ok: true,
      notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error in notifications endpoint:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

/**
 * Diagnostic endpoints for debugging
 */
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'somalux-backend',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

/**
 * Global error handler middleware - catches any unhandled errors
 */
app.use((err, req, res, next) => {
  console.error('🔴 GLOBAL ERROR HANDLER:', err);
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Stack:', err?.stack);
  
  // Send error response
  res.status(500).json({
    error: 'Internal server error',
    message: err?.message || 'Unknown error',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  console.warn('⚠️ 404 Not Found:', req.method, req.path);
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend + WebSocket server running on port ${PORT}`);
  console.log(`🌐 Access via: http://localhost:${PORT} or https://somalux.co.ke`);
  console.log(`📡 Routes registered: /send-message, /send-group-message, /group/:groupId/messages, /group-messages/read`);
  console.log(`📊 Reading Analytics routes enabled`);
  console.log(`✨ Feature Flags API: GET /api/features`);
  console.log(`🏥 Health check: GET /api/health or GET /api/status`);
  console.log(`🔧 Supabase configured: ${global.supabaseAdmin ? '✅ Yes' : '❌ No'}`);
  console.log(`📍 API diagnostic endpoints:`);
  console.log(`   - GET /api/status (backend status)`);
  console.log(`   - GET /api/health (feature flags status)`);
  console.log(`   - GET /api/features-simple (test endpoint, no DB)`);
  console.log(`   - GET /api/features (main endpoint)`);

  // Start the scheduled email send processor
  startScheduledSendProcessor(60000); // Check every 60 seconds
});

// Setup WebSocket after server starts
wss = new WebSocketServer({ server });
global.wss = wss; // Store reference for feature flags broadcasting
setupWebSocket();
// Setup ChatMe WebSocket and FCM routes (unified backend)
if (admin) {
  console.log('🔗 Integrating ChatMe into unified WebSocket server...');
  await setupChatMeWebSocket(wss);
  await setupChatMeFCMRoutes(app, admin);
  console.log('✅ ChatMe integrated into main backend');
} else {
  console.warn('⚠️ ChatMe Firebase not available; messaging features disabled');
}