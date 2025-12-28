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
import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

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

// Express Setup MUST be before any app.use/app.post calls
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public')); // Serve static files from public folder (for ads, etc)

app.post('/subscribe-topic', async (req, res) => {
  const { topic, token } = req.body || {};
  if (!topic || !token) return res.status(400).send('Missing topic or token');
  try {
    console.log(`📢 Topic subscription requested: ${topic}`);
    res.json({ success: false, message: 'Cloud messaging disabled' });
  } catch (e) {
    console.error('subscribe-topic error', e);
    res.status(500).send(e.message || 'subscribe error');
  }
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
      scope,
      query_text: queryText.trim(),
      user_id: userId || null,
      category_id: categoryId || null,
      book_id: bookId || null,
      author_name: authorName || null,
      past_paper_id: pastPaperId || null,
      results_count: typeof resultsCount === 'number' ? resultsCount : null,
    };

    const { error } = await supabaseAdmin.from('search_events').insert(payload);
    if (error) {
      console.warn('search_events insert error:', error);
      return res.status(500).json({ error: error.message || 'Failed to log search event' });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('search_events insert exception:', e);
    res.status(500).json({ error: e.message || 'Failed to log search event' });
  }
});

app.post('/unsubscribe-topic', async (req, res) => {
  const { topic, token } = req.body || {};
  if (!topic || !token) return res.status(400).send('Missing topic or token');
  try {
    console.log(`📢 Topic unsubscribe requested: ${topic}`);
    res.json({ success: false, message: 'Cloud messaging disabled' });
  } catch (e) {
    console.error('unsubscribe-topic error', e);
    res.status(500).send(e.message || 'unsubscribe error');
  }
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

// Record user login
app.post('/api/user/session/login', async (req, res) => {
  try {
    const { userId, ipAddress, userAgent, deviceType } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update profiles table with last_login and session_count
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        last_login: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        total_logins: supabaseAdmin.rpc('increment_total_logins', { user_id: userId })
      })
      .eq('id', userId);

    if (updateError) console.warn('Failed to update profile on login:', updateError);

    // Record session in user_sessions table
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: userId,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        device_type: deviceType || 'unknown'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to record user session:', sessionError);
      return res.status(500).json({ error: sessionError.message });
    }

    res.json({ ok: true, session });
  } catch (e) {
    console.error('Error recording login:', e);
    res.status(500).json({ error: e.message || 'Failed to record login' });
  }
});

// Record user logout
app.post('/api/user/session/logout', async (req, res) => {
  try {
    const { userId, sessionId } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update profiles table with deactivated_at (for sign-out tracking)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) console.warn('Failed to update profile on logout:', updateError);

    // Update session record with logout time if sessionId provided
    if (sessionId) {
      const logoutTime = new Date();
      const { data: sessionData } = await supabaseAdmin
        .from('user_sessions')
        .select('login_time')
        .eq('id', sessionId)
        .single();

      let durationMinutes = null;
      if (sessionData && sessionData.login_time) {
        const loginTime = new Date(sessionData.login_time);
        durationMinutes = Math.round((logoutTime - loginTime) / (1000 * 60));
      }

      const { error: logoutError } = await supabaseAdmin
        .from('user_sessions')
        .update({
          logout_time: logoutTime.toISOString(),
          session_duration_minutes: durationMinutes
        })
        .eq('id', sessionId);

      if (logoutError) console.warn('Failed to record logout:', logoutError);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Error recording logout:', e);
    res.status(500).json({ error: e.message || 'Failed to record logout' });
  }
});

// Get all authenticated users with detailed status
app.get('/api/admin/authenticated-users', async (req, res) => {
  try {
    console.log('[authenticated-users] Endpoint called');

    // Fetch all profiles first
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('[authenticated-users] Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log('[authenticated-users] Profiles count:', profiles?.length || 0);

    // Try to get all auth users using the admin API
    let authUsers = [];
    try {
      const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) {
        console.warn('[authenticated-users] auth.admin.listUsers error:', authError);
      } else {
        authUsers = users || [];
        console.log('[authenticated-users] Auth users count:', authUsers.length);
      }
    } catch (authErr) {
      console.error('[authenticated-users] Exception calling listUsers:', authErr?.message || authErr);
      // If admin API doesn't work, use profiles as the source of truth
      authUsers = (profiles || []).map(p => ({
        id: p.id,
        email: p.email,
        created_at: p.created_at,
        user_metadata: { full_name: p.full_name, avatar_url: p.avatar_url }
      }));
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
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

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

// Sign-out reason notification endpoint
app.post('/api/user/signout-feedback', async (req, res) => {
  try {
    const { userEmail, userName, signOutReason } = req.body || {};

    if (!signOutReason || !signOutReason.trim()) {
      // No reason provided, just return success
      return res.json({ ok: true, sent: false, reason: 'No reason provided' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Missing user email' });
    }

    // Send email to admins (they'll be fetched dynamically from the database)
    const result = await sendSignOutReasonEmail({
      userEmail,
      userName,
      signOutReason
      // Note: adminEmails not provided, will be fetched from database
    });

    res.json({ ok: true, sent: !!result, result });
  } catch (e) {
    console.error('Failed to send sign-out feedback:', e);
    res.status(500).json({ error: e.message || 'Failed to process sign-out feedback' });
  }
});

// Agora token endpoint - server must generate tokens (do NOT embed App Certificate in client)
app.post('/api/agora/token', async (req, res) => {
  try {
    const { channel, uid } = req.body || {};
    if (!channel) return res.status(400).json({ error: 'channel required' });

    // Require a valid ID token unless explicitly allowed for development
    const allowPublic = String(process.env.ALLOW_PUBLIC_AGORA_TOKEN || '').toLowerCase() === 'true';
    let decoded = null;
    if (!allowPublic) {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.body.idToken || null);
      if (!idToken) return res.status(401).json({ error: 'idToken required in Authorization header or body' });
      try {
        decoded = await admin.auth().verifyIdToken(idToken);
      } catch (ve) {
        console.error('Token verification failed', ve);
        return res.status(401).json({ error: 'invalid idToken' });
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
  console.log('🔐 Supabase service-role client initialized');
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Proxy endpoints will be disabled.');
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

// Minimal open proxy (no auth restriction yet) — use service role for DB writes
// Books: create
app.post('/api/elib/books', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { metadata } = req.body || {};
    if (!metadata || !metadata.title) return res.status(400).json({ error: 'metadata.title required' });
    const { data, error } = await supabaseAdmin.from('books').insert(metadata).select('*').single();
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
    const { data, error } = await supabaseAdmin.from('books').update(updates).eq('id', id).select('*').single();
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
    const { data, error } = await supabaseAdmin.from('categories').insert({ name, description }).select('*').single();
    if (error) throw error;
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'create', entity: 'categories', record_id: data.id, details: { name, description }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ error: e.message || 'insert failed' }); }
});

app.patch('/api/elib/categories/:id', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params; const { name, description } = req.body || {};
    const { data, error } = await supabaseAdmin.from('categories').update({ name, description }).eq('id', id).select('*').single();
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
    const { id } = req.params; const { role } = req.body || {};
    const { data, error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', id).select('*').single();
    if (error) throw error;
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'update_role', entity: 'profiles', record_id: id, details: { role }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ error: e.message || 'update failed' }); }
});

// Users: subscription tier change
app.patch('/api/elib/users/:id/tier', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured on server' });
  try {
    const { id } = req.params;
    const { subscription_tier } = req.body || {};
    const updateData = { subscription_tier };
    
    // Set subscription dates if upgrading to premium tiers
    if (subscription_tier === 'premium' || subscription_tier === 'premium_pro') {
      const now = new Date();
      updateData.subscription_started_at = now.toISOString();
      updateData.subscription_expires_at = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
    } else if (subscription_tier === 'basic') {
      updateData.subscription_started_at = null;
      updateData.subscription_expires_at = null;
    }
    
    const { data, error } = await supabaseAdmin.from('profiles').update(updateData).eq('id', id).select('*').single();
    if (error) throw error;
    await logAudit({ actor: req.headers['x-actor-email'] || 'public', action: 'update_tier', entity: 'profiles', record_id: id, details: { subscription_tier }, ip: req.ip });
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ error: e.message || 'update failed' }); }
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

            console.log(`👥 User ${userId} (${ws.userName}) joined ${chatId} (online: ${onlineUsers.get(chatId).size})`);

            // Send online users (exclude self)
            const otherOnline = Array.from(onlineUsers.get(chatId)).filter(u => u !== userId);
            ws.send(JSON.stringify({ type: "users_online", data: otherOnline }));

            // Delta fetch recent messages
            const lastTs = lastMessageTimestamps.get(userId) || 0;
            await fetchRecentMessages(chatId, ws, lastTs, message.isGroup);
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
    // FIXED: Use Timestamp.fromDate for since
    const sinceTimestamp = admin.firestore.Timestamp.fromDate(new Date(since));

    // For groups, use "groups" collection, for 1-on-1 use "chats" collection
    const collection = isGroup ? "groups" : "chats";
    const q = db.collection(collection).doc(chatId).collection("messages")
      .orderBy("timestamp", "desc")
      .limit(100)  // FIXED: Increased for fuller initial load
      .where("timestamp", ">", sinceTimestamp);

    const snapshot = await q.get();
    const recent = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
      groupId: isGroup ? chatId : undefined,  // Include groupId for groups
      chatId: chatId  // Include chatId for all messages
    }));
    ws.send(JSON.stringify({ type: "recent_messages", data: recent }));
    console.log(`📜 Sent ${recent.length} recent ${isGroup ? 'group' : '1-on-1'} msgs since ${since} to ${chatId}`);
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

// /users unchanged
app.get("/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// /send FIXED: Update status to "delivered" before WS, full broadcast, better touch
app.post("/send", async (req, res) => {
  const { sender, receiver, text, replyingTo } = req.body;

  console.log('🔍 Backend /send called:', { sender, receiver, text: text.substring(0, 50) });

  if (!sender || !receiver || !text) {
    console.error('❌ Missing required fields:', { sender, receiver, text: !!text });
    return res.status(400).json({ error: "Missing required fields: sender, receiver, text" });
  }

  const chatId = getChatId(sender, receiver);
  if (!chatId) {
    console.error('❌ Invalid chatId:', { sender, receiver });
    return res.status(400).json({ error: "Invalid sender or receiver IDs" });
  }

  try {
    const messageRef = await db.collection("chats").doc(chatId).collection("messages").add({
      sender,
      receiver,
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "sent",  // Initial
      replyingTo: replyingTo || null,
      readBy: [],
      deletedBy: [],
      isPinned: false,
    });

    // FIXED: Immediately update to "delivered" (single write)
    await messageRef.update({ status: "delivered" });

    let skipNotification = false;
    let isLocked = false;
    let isMuted = false;
    let isPinned = false;
    let customTitle = null;
    let customSubtext = null;

    try {
      const chatDoc = await db.collection('userChats').doc(receiver).collection('chats').doc(sender).get();
      if (chatDoc.exists) {
        const chatState = chatDoc.data();
        isLocked = chatState.isLocked || false;
        isMuted = chatState.isMuted || false;
        isPinned = chatState.isPinned || false;

        if (chatState.isArchived) {
          console.log('⏸️ Skipping notification: chat is archived');
          skipNotification = true;
        }

        if (isLocked) {
          customTitle = 'Message from locked chat';
          customSubtext = '🔒 Locked chat';
        }
      } else {
        console.log('ℹ️ No chat document found - treating as new contact (normal notification)');
      }
    } catch (stateError) {
      console.error('⚠️ Error fetching chat state:', stateError);
    }

    if (!skipNotification) {
      const senderDoc = await db.collection("users").doc(sender).get();
      const senderData = senderDoc.exists ? senderDoc.data() : {};
      const senderName = senderData.displayName || senderData.name || sender;
      const senderPhotoURL = senderData.photoURL || null;
      const senderInitial = senderName.charAt(0).toUpperCase();

      if (!customTitle) customTitle = `Message from ${senderName}`;
      if (!customSubtext) customSubtext = text.length > 50 ? text.substring(0, 50) + '...' : text;

      const userDoc = await db.collection("users").doc(receiver).get();

      if (userDoc.exists) {
        const receiverData = userDoc.data() || {};
        const blocked = Array.isArray(receiverData.blockedContacts) && receiverData.blockedContacts.includes(sender);
        const muted = Array.isArray(receiverData.mutedContacts) && receiverData.mutedContacts.includes(sender);
        if (blocked) {
          console.log('⛔ Receiver has blocked sender, skipping FCM');
          // Still return success; message stored and WS can handle others
          skipNotification = true;
        } else if (muted) {
          console.log('🔇 Receiver has muted sender, skipping FCM');
          skipNotification = true;
        }
        const fcmToken = receiverData.fcmToken;
        if (fcmToken) {
          const foregroundData = {
            enabled: true,
            position: 'top-right',
            message: customTitle,
            subtext: customSubtext,
            duration: 4000,
            chatId: chatId,
            senderId: sender,
            timestamp: Date.now(),
            isMuted,
            isPinned,
            isLocked,
            isGroup: false, // This is a 1-on-1 chat
          };

          const messagePayload = {
            token: fcmToken,
            notification: {
              title: customTitle,
              body: customSubtext,
              image: senderPhotoURL || undefined,
            },
            data: {
              foreground: JSON.stringify(foregroundData),
              chatId: chatId,
              sender: sender,
              senderName: senderName,
              senderPhotoURL: senderPhotoURL,
              senderInitial: senderInitial,
              message: text,
              messageId: messageRef.id,
              type: 'new_message',
              isMuted: isMuted.toString(),
              isPinned: isPinned.toString(),
              isLocked: isLocked.toString(),
            },
            android: {
              notification: {
                // icon: 'ic_notification',
              },
            },
            apns: {
              payload: {
                aps: {
                  'mutable-content': true,
                },
              },
              fcm_options: {
                image: senderPhotoURL || undefined,
              },
            },
          };

          try {
            console.log('📢 Cloud messaging send skipped');
          } catch (fcmError) {
            console.warn('⚠️ Cloud messaging disabled');
            // Do not throw; message is saved and WS will still notify active clients
          }
        } else {
          console.log('ℹ️ No FCM token for receiver:', receiver);
        }
      } else {
        console.log('ℹ️ Receiver user doc not found:', receiver);
      }
    } else {
      console.log('⏸️ Notification fully skipped due to archived state');
    }

    // FIXED: Touch lastUpdated reliably (create if missing)
    try {
      await db.collection('userChats').doc(receiver).collection('chats').doc(sender).update({
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`🔄 Touched lastUpdated for receiver ${receiver} chat with ${sender}`);
    } catch (touchError) {
      if (touchError.code === 'NOT_FOUND') {
        await db.collection('userChats').doc(receiver).collection('chats').doc(sender).set({
          contactUid: sender,
          addedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          isPinned: false,
          isArchived: false,
          isMuted: false,
          isLocked: false,
          isDeleted: false,
        });
        console.log(`📝 Created userChats doc for receiver ${receiver} chat with ${sender}`);
      } else {
        console.warn('Failed to touch lastUpdated:', touchError);
      }
    }

    // FIXED: Fetch full message for WS broadcast (after update)
    const fullMessageSnap = await messageRef.get();
    const fullMessageData = {
      id: messageRef.id,
      ...fullMessageSnap.data(),
      timestamp: fullMessageSnap.data().timestamp.toDate(),  // JS Date for client
      chatId: chatId,  // Include chatId for frontend filtering
    };

    // WS broadcast to all clients in the chat room (sender and receiver connections)
    const room = clients.get(chatId);
    const receiverInRoom = room && room.has(receiver);

    if (room && room.size > 0) {
      let sentCount = 0;
      room.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "new_message", data: fullMessageData }));
          sentCount++;
        }
      });
      console.log(`📡 WS broadcast FULL message to ${sentCount} clients in room ${chatId}`);
    }

    // Fallback: if receiver is NOT in the room, also send via user-channel
    if (!receiverInRoom) {
      try {
        const receiverSet = userChannels.get(receiver);
        if (receiverSet && receiverSet.size > 0) {
          receiverSet.forEach((wsConn) => {
            if (wsConn.readyState === wsConn.OPEN) {
              wsConn.send(JSON.stringify({ type: "new_message", data: fullMessageData }));
            }
          });
          console.log(`📣 User-channel broadcast to receiver ${receiver} (not in room, connections: ${receiverSet.size})`);
        } else {
          console.log(`ℹ️ Receiver ${receiver} not online - FCM handles offline`);
        }
      } catch (e) {
        console.warn('User-channel broadcast error:', e);
      }
    }

    res.json({
      success: true,
      messageId: messageRef.id,
    });

  } catch (error) {
    console.error("💥 Backend /send ERROR:", {
      error: error.message,
      code: error.code,
      sender,
      receiver,
      chatId
    });
    res.status(500).json({ error: "Failed to save message: " + error.message });
  }
});

// /messages/delivered unchanged
app.post("/messages/delivered", async (req, res) => {
  const { chatId, messageIds, receiver } = req.body;
  if (!chatId || !messageIds || !Array.isArray(messageIds) || !receiver) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    const batch = db.batch();
    messageIds.forEach((messageId) => {
      const messageRef = db.collection("chats").doc(chatId).collection("messages").doc(messageId);
      batch.update(messageRef, { status: "delivered" });
    });
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as delivered:", error);
    res.status(500).json({ error: "Failed to mark messages as delivered" });
  }
});

// /messages/read unchanged (already broadcasts WS)
app.post("/messages/read", async (req, res) => {
  const { chatId, messageIds, receiver } = req.body;
  if (!chatId || !messageIds || !Array.isArray(messageIds) || !receiver) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    // Respect user's readReceipts setting
    try {
      const userDoc = await db.collection('users').doc(receiver).get();
      if (userDoc.exists && userDoc.data() && userDoc.data().readReceipts === false) {
        console.log('ℹ️ Read receipts disabled, ignoring /messages/read');
        return res.json({ success: true, skipped: true });
      }
    } catch (e) { console.warn('readReceipts check failed', e); }
    const batch = db.batch();
    messageIds.forEach((messageId) => {
      const messageRef = db.collection("chats").doc(chatId).collection("messages").doc(messageId);
      batch.update(messageRef, { status: "read", readBy: admin.firestore.FieldValue.arrayUnion(receiver) });
    });
    await batch.commit(); // Single batch = 1 write op

    // WS broadcast for instant UI
    const room = clients.get(chatId);
    if (room && room.size > 0) {
      room.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "messages_read",
            data: {
              userId: receiver,
              messageIds,
              chatId: chatId  // Include chatId for frontend filtering
            }
          }));
        }
      });
      console.log(`📖 WS read broadcast to ${room.size} in ${chatId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

// /chat/:chatId/messages FIXED: Remove 'since' where clause for full initial load (use limit for perf)
app.get("/chat/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  // const sinceStr = req.query.since;  // FIXED: Ignore since for full load

  if (!chatId) {
    return res.status(400).json({ error: "Missing chatId" });
  }

  try {
    // FIXED: No where clause - always fetch last 100 for initial/full load
    const q = db.collection("chats").doc(chatId).collection("messages")
      .orderBy("timestamp", "desc")
      .limit(100);

    const snapshot = await q.get();
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()  // Always JS Date for client
    }));
    console.log(`📜 HTTP fetched ${messages.length} msgs (full load) for ${chatId}`);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GROUP ENDPOINTS

// /send-group-message - Send message to a group
app.post("/send-group-message", async (req, res) => {
  const { groupId, sender, senderName, text, replyingTo } = req.body;

  console.log('🔍 Backend /send-group-message called:', { groupId, sender, senderName, text: text?.substring(0, 50) });

  if (!groupId || !sender || !senderName || !text) {
    console.error('❌ Missing required fields:', { groupId, sender, senderName, text: !!text });
    return res.status(400).json({ error: "Missing required fields: groupId, sender, senderName, text" });
  }

  try {
    const messageRef = await db.collection("groups").doc(groupId).collection("messages").add({
      sender,
      senderName,
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "sent",
      replyingTo: replyingTo || null,
      readBy: [sender],  // Sender has read it
      deletedBy: [],
      isPinned: false,
    });

    // Update to "delivered"
    await messageRef.update({ status: "delivered" });

    // Update group last activity and messages count for ordering in lists
    try {
      await db.collection("groups").doc(groupId).set({
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        messagesCount: admin.firestore.FieldValue.increment(1),
        lastMessageText: text || '',
        lastMessageSenderName: senderName || '',
        lastMessageSenderId: sender,
        lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (metaErr) {
      console.warn('⚠️ Failed to update group metadata (lastActivity/messagesCount):', metaErr?.message || metaErr);
    }

    // Send a single FCM topic notification: group_<groupId>
    let groupName = null;
    let groupData = null;
    try {
      const groupDoc = await db.collection("groups").doc(groupId).get();
      if (groupDoc.exists) {
        groupData = groupDoc.data();
        groupName = groupData?.name || groupData?.groupName || null;
      }
      const senderDoc = await db.collection("users").doc(sender).get();
      const senderData = senderDoc.exists ? senderDoc.data() : {};
      const senderDisplay = senderData.displayName || senderData.name || senderName || sender;
      const senderPhotoURL = senderData.photoURL || undefined;

      const foregroundData = {
        enabled: true,
        position: 'top-right',
        message: `${senderDisplay} in ${groupName || 'Group'}`,
        subtext: text.length > 50 ? text.substring(0, 50) + '...' : text,
        duration: 4000,
        chatId: groupId,
        senderId: sender,
        timestamp: Date.now(),
        isGroup: true,
      };

      // Cloud messaging disabled - use Supabase instead
      console.log(`📢 Group notification skipped for group_${groupId}`);
    } catch (notificationError) {
      console.error('❌ Error sending group topic notification:', notificationError);
    }

    // Fetch full message for WebSocket broadcast
    const fullMessageSnap = await messageRef.get();
    // groupName already fetched above during notifications to reduce Firestore reads
    const fullMessageData = {
      id: messageRef.id,
      ...fullMessageSnap.data(),
      timestamp: fullMessageSnap.data().timestamp.toDate(),
      groupId: groupId, // CRITICAL: Include groupId for frontend filtering
      chatId: groupId,  // Compatibility: some components check chatId
      groupName,  // Include group name for toast title (from earlier fetch)
    };

    // WebSocket broadcast: Send to room members first, then user-channel for those NOT in room
    const room = clients.get(groupId);
    const membersInRoom = new Set();

    if (room && room.size > 0) {
      room.forEach((client, userId) => {
        if (userId !== sender && client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "new_message", data: fullMessageData }));
          membersInRoom.add(userId);
        }
      });
      console.log(`📡 WS broadcast group message to ${membersInRoom.size} clients in room ${groupId}`);
    }

    // 🔔 Also broadcast to each member's user channel (duplicates are fine; frontend dedupe prevents double-toasts)
    try {
      if (groupData && groupData.memberIds) {
        const memberIds = groupData.memberIds || [];
        for (const memberId of memberIds) {
          if (memberId === sender) continue;
          const set = userChannels.get(memberId);
          if (set && set.size > 0) {
            set.forEach((wsConn) => {
              if (wsConn.readyState === wsConn.OPEN) {
                wsConn.send(JSON.stringify({ type: "new_message", data: fullMessageData }));
              }
            });
            console.log(`📣 User-channel broadcast to group member ${memberId} (connections: ${set.size})`);
          }
        }
      }
    } catch (e) {
      console.warn('Group user-channel broadcast error:', e);
    }

    res.json({
      success: true,
      messageId: messageRef.id,
    });

  } catch (error) {
    console.error("💥 Backend /send-group-message ERROR:", {
      error: error.message,
      code: error.code,
      groupId,
      sender
    });
    res.status(500).json({ error: "Failed to save group message: " + error.message });
  }
});

// /group/:groupId/messages - Get group messages
app.get("/group/:groupId/messages", async (req, res) => {
  const { groupId } = req.params;

  if (!groupId) {
    return res.status(400).json({ error: "Missing groupId" });
  }

  try {
    const q = db.collection("groups").doc(groupId).collection("messages")
      .orderBy("timestamp", "desc")
      .limit(100);

    const snapshot = await q.get();
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
    console.log(`📜 HTTP fetched ${messages.length} group msgs for ${groupId}`);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ error: "Failed to fetch group messages" });
  }
});

// /group-messages/read - Mark group messages as read
app.post("/group-messages/read", async (req, res) => {
  const { groupId, messageIds, userId } = req.body;

  if (!groupId || !messageIds || !Array.isArray(messageIds) || !userId) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    // Respect user's readReceipts setting
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data() && userDoc.data().readReceipts === false) {
        console.log('ℹ️ Read receipts disabled, ignoring /group-messages/read');
        return res.json({ success: true, skipped: true });
      }
    } catch (e) { console.warn('group readReceipts check failed', e); }
    const batch = db.batch();
    messageIds.forEach((messageId) => {
      const messageRef = db.collection("groups").doc(groupId).collection("messages").doc(messageId);
      batch.update(messageRef, {
        status: "read",
        readBy: admin.firestore.FieldValue.arrayUnion(userId)
      });
    });
    await batch.commit();

    // WebSocket broadcast for instant UI
    const room = clients.get(groupId);
    if (room && room.size > 0) {
      room.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "messages_read",
            data: {
              userId,
              messageIds,
              chatId: groupId,  // Include chatId for frontend filtering
              groupId: groupId  // Include groupId for group context
            }
          }));
        }
      });
      console.log(`📖 WS group read broadcast to ${room.size} in ${groupId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking group messages as read:", error);
    res.status(500).json({ error: "Failed to mark group messages as read" });
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
      if (!fs.existsSync(booksDirectory) || !fs.statSync(booksDirectory).isDirectory()) {
        console.error(`❌ [BULK-UPLOAD-START] Directory not found: ${booksDirectory}`);
        return res.status(400).json({ error: 'Directory not found. Please check the path and try again.' });
      }
      console.log(`✅ [BULK-UPLOAD-START] Directory exists and is accessible`);
    } catch (e) {
      console.error(`❌ [BULK-UPLOAD-START] Directory access error:`, e.message);
      return res.status(400).json({ error: 'Directory not accessible. Please check permissions/path.' });
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
      return {
        ...s,
        uploader_email: prof?.email || null,
        uploader_name: prof?.full_name || null,
      };
    });

    res.json({ ok: true, type, submissions: enriched });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load submissions' });
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

    const normalizedType = String(type || 'books').trim();
    const isPastPaper = normalizedType === 'past_papers';

    // Resolve uploader profile if provided
    let uploaderEmail = null;
    let uploaderName = null;
    if (uploadedBy) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', uploadedBy)
        .single();
      if (prof) {
        uploaderEmail = prof.email || null;
        uploaderName = prof.full_name || null;
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
    await Promise.allSettled(
      adminEmails.map((to) =>
        sendEmail({ to, subject, text: plainText, html })
      )
    );

    return res.json({ ok: true, message: 'Admin notification sent' });
  } catch (e) {
    console.error('Failed to notify admins about new submission:', e);
    return res.status(500).json({ error: e.message || 'Failed to notify admins' });
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

    // Validate that submission has required file data
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

    // Convert file_path to full public URL if needed
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
        subject: sub.faculty || sub.subject || '',
        course_code: sub.unit_code || '',
        exam_year: sub.year || null,
        semester: sub.semester || '',
        level: sub.level || null,
        file_url: finalFileUrl, // Use the converted URL with full path
        file_size: null,
        uploaded_by: null, // Don't reference auth.users here, past_papers refs profiles(id)
        is_featured: false,
        is_active: true,
        downloads_count: 0,
        views_count: 0,
        rating: 0,
        rating_count: 0,
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
      console.error('Insert failed:', insertErr);
      console.error('Insert payload was:', JSON.stringify(insertPayload, null, 2));
      return res.status(500).json({ 
        error: 'Failed to publish item',
        details: insertErr.message 
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
    if (sub.uploaded_by) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', sub.uploaded_by)
        .single();

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
          await sendEmail({
            to: profile.email,
            subject,
            html: htmlBody,
            text: `Congratulations! Your submission "${itemName}" has been approved and published. Thank you for your contribution!`,
          });
        } catch (emailErr) {
          console.warn(`Approval email failed for ${profile.email}:`, emailErr);
          // Non-blocking
        }
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
    if (submission.uploaded_by) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', submission.uploaded_by)
        .single();

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

server = app.listen(PORT, () => {
  console.log(`✅ Backend + WebSocket server running on http://localhost:${PORT}`);
  console.log(`📡 Routes registered: /send-message, /send-group-message, /group/:groupId/messages, /group-messages/read`);
  console.log(`📊 Reading Analytics routes enabled`);
});

// Setup WebSocket after server starts
wss = new WebSocketServer({ server });
setupWebSocket();
