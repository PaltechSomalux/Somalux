import express from 'express';
import { buildBrandedEmailHtml, sendEmail } from '../utils/email.js';
import { getAdminEmails } from './adminNotifications.js';

const router = express.Router();

// List requests (admin UI)
router.get('/', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const search = (req.query.search || '').trim();

    if (!global.supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    let q = global.supabaseAdmin.from('requests').select('*');
    if (status && status !== 'all') q = q.eq('status', status);
    q = q.order('created_at', { ascending: false }).limit(1000);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message || 'DB error' });

    let items = data || [];
    
    // Enrich each request with proper display name from profiles table
    console.log(`[Requests GET] Fetched ${items.length} requests, enriching with profile data...`);
    
    const enrichedItems = await Promise.all(
      items.map(async (r) => {
        let profile = null;
        
        // Try lookup by user_id first
        if (r.user_id) {
          try {
            const { data: p, error: profileErr } = await global.supabaseAdmin
              .from('profiles')
              .select('display_name, full_name')
              .eq('id', r.user_id)
              .single();
            
            if (profileErr) {
              console.warn(`[Requests GET] Profile lookup by user_id ${r.user_id} failed:`, profileErr.message);
            } else {
              profile = p;
            }
          } catch (e) {
            console.warn(`[Requests GET] Profile fetch error for user_id ${r.user_id}:`, e.message);
          }
        }
        
        // Fallback: lookup by email
        if (!profile && r.user_email) {
          try {
            const { data: p, error: profileErr } = await global.supabaseAdmin
              .from('profiles')
              .select('display_name, full_name')
              .eq('email', r.user_email)
              .single();
            
            if (profileErr) {
              console.warn(`[Requests GET] Profile lookup by email ${r.user_email} failed:`, profileErr.message);
            } else {
              profile = p;
            }
          } catch (e) {
            console.warn(`[Requests GET] Profile fetch error for email ${r.user_email}:`, e.message);
          }
        }
        
        // Apply enrichment if profile found
        if (profile && (profile.display_name || profile.full_name)) {
          const newName = profile.display_name || profile.full_name;
          console.log(`[Requests GET] Enriched "${r.user_name}" → "${newName}"`);
          r.user_name = newName;
        }
        
        return r;
      })
    );

    if (search) {
      const s = search.toLowerCase();
      items = enrichedItems.filter(r => (r.title || '').toLowerCase().includes(s) || (r.notes || r.message || '').toLowerCase().includes(s) || (r.user_email || r.userEmail || '').toLowerCase().includes(s) || (r.user_name || '').toLowerCase().includes(s));
    } else {
      items = enrichedItems;
    }

    console.log(`[Requests GET] Returning ${items.length} enriched requests`);
    res.json({ ok: true, requests: items });
  } catch (err) {
    console.error('GET /api/requests error:', err.message || err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Create request (from frontend)
router.post('/', async (req, res) => {
  try {
    if (!global.supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    const body = req.body || {};
    console.log('[Requests POST] Received request body:', JSON.stringify(body, null, 2));
    
    let user_name = body.userName || body.user_name || null;
    
    // If user_id is provided, fetch the actual display name from profiles table
    if (body.userId) {
      try {
        const { data: profile } = await global.supabaseAdmin
          .from('profiles')
          .select('display_name, full_name')
          .eq('id', body.userId)
          .single();
        
        if (profile && (profile.display_name || profile.full_name)) {
          user_name = profile.display_name || profile.full_name;
        }
      } catch (e) {
        console.warn('Could not fetch profile for request:', e.message);
        // Fall back to provided userName or email prefix
      }
    }

    // Normalize type: convert 'past_paper' → 'pastpaper', 'past papers' → 'pastpaper', etc.
    let requestType = (body.type || body.requestType || 'other').toLowerCase().trim();
    requestType = requestType.replace(/[_\s]+/g, ''); // Remove underscores and spaces
    
    // Ensure it matches valid values
    const validTypes = ['book', 'pastpaper', 'feature', 'complaint', 'feedback', 'other'];
    if (!validTypes.includes(requestType)) {
      console.warn(`[Requests POST] Invalid type "${body.type}", defaulting to "other"`);
      requestType = 'other';
    }

    // Collect any extra fields into metadata (for extensibility)
    const extraFields = {};
    const standardFields = ['userId', 'user_id', 'userEmail', 'user_email', 'userName', 'user_name', 'type', 'requestType', 'title', 'itemTitle', 'notes', 'requestText', 'message', 'link', 'externalLink', 'attachments', 'metadata', 'createdAt'];
    Object.keys(body).forEach(key => {
      if (!standardFields.includes(key)) {
        extraFields[key] = body[key];
      }
    });

    const payload = {
      user_id: body.userId || null,
      user_email: body.userEmail || body.user_email || null,
      user_name: user_name,
      type: requestType,
      title: body.title || body.itemTitle || null,
      notes: body.notes || body.requestText || body.message || null,
      link: body.link || body.externalLink || null,
      attachments: Array.isArray(body.attachments) ? body.attachments : (body.attachments ? [body.attachments] : []),
      metadata: { ...extraFields, ...body.metadata },
      status: 'pending'
      // Don't set created_at - let the database DEFAULT use server time
    };

    console.log('[Requests POST] Insert payload:', JSON.stringify(payload, null, 2));

    const { data, error } = await global.supabaseAdmin.from('requests').insert(payload).select('*').single();
    if (error) {
      console.error('[Requests POST] DB insert error:', error.code, error.message, error.details);
      return res.status(500).json({ error: error.message || 'Failed to save request', code: error.code });
    }

    console.log('[Requests POST] Request created successfully:', data.id);
    res.json({ ok: true, request: data });

    // Send email confirmations asynchronously
    (async () => {
      try {
        // Email to user (confirmation)
        if (payload.user_email) {
          const subject = `Request received — ${payload.type}`;
          const bodyHtml = `<div><p>Hi ${payload.user_name || ''},</p>
            <p>We received your request. Our admin team will review it shortly.</p>
            <div style="background:#f6f9fb;border-left:4px solid #06b6d4;padding:12px;border-radius:6px;margin-top:12px;">
              <strong>Request:</strong>
              <p>${(payload.title || payload.notes || '').replace(/</g, '&lt;')}</p>
            </div>
          </div>`;

          const html = buildBrandedEmailHtml({ title: subject, body: bodyHtml });
          await sendEmail({ to: payload.user_email, subject, text: payload.notes || payload.title || '', html });
        }

        // Notify admins
        const admins = await getAdminEmails();
        if (admins && admins.length > 0) {
          const subject = `New user request — ${payload.type}`;
          const submittedAt = data?.created_at ? new Date(data.created_at).toLocaleString() : 'N/A';
          const bodyHtml = `<div>
            <p>A new request has been submitted by ${payload.user_name || payload.user_email || 'Unknown'}.</p>
            <div style="background:#fff;padding:12px;border-radius:6px;border:1px solid #e6eef5;">
              <p><strong>Type:</strong> ${payload.type}</p>
              <p><strong>Title:</strong> ${payload.title || '—'}</p>
              <p><strong>Notes:</strong><br/>${(payload.notes || '—').replace(/</g, '&lt;')}</p>
              <p><strong>Submitted at:</strong> ${submittedAt}</p>
            </div>
            <p>Please review the request in the admin panel.</p>
          </div>`;
          const html = buildBrandedEmailHtml({ title: subject, body: bodyHtml });

          const emailPromises = admins.map(a => sendEmail({ to: a, subject, text: `${payload.type} request from ${payload.user_name || payload.user_email}`, html }));
          await Promise.allSettled(emailPromises);
        }
      } catch (e) {
        console.warn('Background email send failed:', e?.message || e);
      }
    })();

  } catch (err) {
    console.error('POST /api/requests error:', err.message || err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Resolve a request
router.post('/:id/resolve', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    if (!global.supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured' });

    const updates = { status: 'resolved', resolved_at: new Date().toISOString() };
    // Optionally set processed_by if Authorization header contains token
    const { data, error } = await global.supabaseAdmin.from('requests').update(updates).eq('id', id).select('*').single();
    if (error) return res.status(500).json({ error: error.message || 'Failed to resolve' });
    res.json({ ok: true, request: data });
  } catch (err) {
    console.error('POST /api/requests/:id/resolve error:', err.message || err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Delete a request
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    if (!global.supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured' });

    const { error } = await global.supabaseAdmin.from('requests').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message || 'Delete failed' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/requests/:id error:', err.message || err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
