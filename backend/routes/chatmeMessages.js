/**
 * ChatMe Message API Routes - Supabase Backend Integration
 * Handles 1-on-1 and group messaging via Supabase
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase Admin client
function getSupabaseAdmin() {
  if (global.supabaseAdmin) return global.supabaseAdmin;
  throw new Error('Supabase admin not initialized');
}

/**
 * GET /api/messages/:chatId
 * Fetch messages for a 1-on-1 chat
 * Query params: since (timestamp), limit (default: 50)
 */
router.get('/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { since = 0, limit = 50 } = req.query;

    if (!chatId) {
      return res.status(400).json({ error: 'Missing chatId' });
    }

    const supabase = getSupabaseAdmin();
    
    let query = supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (since) {
      query = query.gte('created_at', new Date(parseInt(since)).toISOString());
    }

    const { data, error } = await query.limit(parseInt(limit));

    if (error) {
      console.error('Fetch messages error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true, messages: data || [] });
  } catch (error) {
    console.error('GET /messages/:chatId error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
});

/**
 * GET /api/messages/:chatId/latest
 * Fetch latest message for a chat
 * Query params: limit (default: 1)
 */
router.get('/messages/:chatId/latest', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 1 } = req.query;

    if (!chatId) {
      return res.status(400).json({ error: 'Missing chatId' });
    }

    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Fetch latest message error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true, messages: data || [] });
  } catch (error) {
    console.error('GET /messages/:chatId/latest error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch latest message' });
  }
});

/**
 * POST /api/messages/latest-batch
 * Fetch latest messages for multiple chats
 * Body: { chatIds: ['id1', 'id2', ...], limit: 1 }
 */
router.post('/messages/latest-batch', async (req, res) => {
  try {
    console.log('📥 POST /messages/latest-batch received:', { bodyKeys: Object.keys(req.body || {}) });
    
    const { chatIds = [], limit = 1 } = req.body;

    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      console.warn('❌ Missing or invalid chatIds array:', chatIds);
      return res.status(400).json({ error: 'Missing chatIds array' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('❌ Supabase admin not initialized');
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const results = new Map();
    console.log(`📤 Fetching latest messages for ${chatIds.length} chats`);

    // Fetch latest message for each chat
    for (const chatId of chatIds) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(parseInt(limit));

        if (error) {
          console.warn(`⚠️ Error fetching messages for chat ${chatId}:`, error.message);
          continue;
        }
        
        if (data && data.length > 0) {
          console.log(`✅ Found ${data.length} message(s) for chat ${chatId}`);
          results.set(chatId, data[0]);
        } else {
          console.log(`📭 No messages found for chat ${chatId}`);
        }
      } catch (e) {
        console.error(`❌ Exception fetching latest message for chat ${chatId}:`, e.message);
      }
    }

    console.log(`✅ Returning ${results.size} results for /messages/latest-batch`);
    res.json({ ok: true, messages: Object.fromEntries(results) });
  } catch (error) {
    console.error('❌ POST /messages/latest-batch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch latest messages' });
  }
});


/**
 * POST /api/messages/send
 * Send a 1-on-1 message
 */
router.post('/messages/send', async (req, res) => {
  try {
    const { 
      chatId, 
      senderId, 
      recipientId, 
      content, 
      contentType = 'text',
      attachmentUrls = [],
      replyToId = null
    } = req.body;

    console.log('📥 Received POST /messages/send:', {
      chatId,
      senderId,
      recipientId,
      contentLength: content?.length,
      contentType,
      hasAttachments: attachmentUrls?.length > 0
    });

    if (!chatId || !senderId || !recipientId || !content) {
      return res.status(400).json({ error: 'Missing required fields: chatId, senderId, recipientId, content' });
    }

    const supabase = getSupabaseAdmin();

    const messageData = {
      chat_id: chatId,
      sender_id: senderId,
      recipient_id: recipientId,
      content: content.trim(),
      content_type: contentType,
      attachment_urls: Array.isArray(attachmentUrls) ? attachmentUrls : [],
      reply_to_id: replyToId || null,
      status: 'sent',
      is_read: false
    };

    console.log('📤 Inserting message into Supabase:', messageData);

    const insertResult = await supabase
      .from('messages')
      .insert([messageData])
      .select();

    console.log('📋 Insert result:', { 
      dataCount: insertResult.data?.length,
      data: insertResult.data?.[0],
      error: insertResult.error 
    });
    
    const message = insertResult.data?.[0];
    const error = insertResult.error;

    if (error) {
      console.error('❌ Supabase insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: error.status,
        fullError: JSON.stringify(error, null, 2)
      });
      return res.status(500).json({ 
        error: error.message || 'Failed to insert message',
        details: error.details || error.hint,
        code: error.code
      });
    }

    if (!message) {
      console.error('❌ Message was not returned from insert query');
      return res.status(500).json({ 
        error: 'Message was inserted but not returned. This may be a Supabase RLS issue.'
      });
    }

    console.log('✅ Message inserted successfully:', message.id);

    // Broadcast via WebSocket if available
    if (global.wss) {
      console.log('📡 Broadcasting message to chat:', { chatId, messageId: message.id });
      broadcastToChat(chatId, {
        type: 'new_message',
        data: message
      });
    }

    res.json({ ok: true, message });
  } catch (error) {
    console.error('❌ POST /messages/send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

/**
 * POST /api/messages/:messageId/read
 * Mark message as read
 */
router.post('/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!messageId || !userId) {
      return res.status(400).json({ error: 'Missing messageId or userId' });
    }

    const supabase = getSupabaseAdmin();

    const { data: message, error } = await supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString(),
        status: 'read'
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Mark read error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Broadcast read receipt
    if (global.wss && message) {
      broadcastToChat(message.chat_id, {
        type: 'message_read',
        messageId: messageId,
        userId: userId
      });
    }

    res.json({ ok: true, message });
  } catch (error) {
    console.error('POST /messages/:messageId/read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark message as read' });
  }
});

/**
 * DELETE /api/messages/:messageId
 * Delete a message (soft delete)
 */
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!messageId || !userId) {
      return res.status(400).json({ error: 'Missing messageId or userId' });
    }

    const supabase = getSupabaseAdmin();

    // Verify user owns the message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Soft delete
    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('Delete message error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Broadcast deletion
    if (global.wss) {
      broadcastToChat(message.chat_id, {
        type: 'message_deleted',
        messageId: messageId
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /messages/:messageId error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete message' });
  }
});

/**
 * PUT /api/messages/:messageId
 * Edit a message
 */
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, content } = req.body;

    if (!messageId || !userId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getSupabaseAdmin();

    // Verify user owns the message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update message
    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({ 
        content: content.trim(),
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Edit message error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Broadcast edit
    if (global.wss) {
      broadcastToChat(message.chat_id, {
        type: 'message_edited',
        message: updatedMessage
      });
    }

    res.json({ ok: true, message: updatedMessage });
  } catch (error) {
    console.error('PUT /messages/:messageId error:', error);
    res.status(500).json({ error: error.message || 'Failed to edit message' });
  }
});

/**
 * POST /api/messages/:messageId/react
 * Add emoji reaction to message
 */
router.post('/messages/:messageId/react', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    if (!messageId || !userId || !emoji) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getSupabaseAdmin();

    // Try to insert reaction (will fail if already exists due to UNIQUE constraint)
    const { data: reaction, error } = await supabase
      .from('message_reactions')
      .insert([{
        message_id: messageId,
        user_id: userId,
        emoji: emoji
      }])
      .select()
      .single();

    if (error) {
      // If duplicate, treat as success (idempotent)
      if (error.code !== '23505') {
        console.error('Add reaction error:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    res.json({ ok: true, reaction });
  } catch (error) {
    console.error('POST /messages/:messageId/react error:', error);
    res.status(500).json({ error: error.message || 'Failed to add reaction' });
  }
});

/**
 * DELETE /api/messages/:messageId/react/:emoji
 * Remove emoji reaction from message
 */
router.delete('/messages/:messageId/react/:emoji', async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const { userId } = req.body;

    if (!messageId || !userId || !emoji) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji);

    if (error) {
      console.error('Remove reaction error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /messages/:messageId/react error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove reaction' });
  }
});

/**
 * GET /api/group-messages/:groupId
 * Fetch messages for a group chat
 */
router.get('/group-messages/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { since = 0, limit = 50 } = req.query;

    if (!groupId) {
      return res.status(400).json({ error: 'Missing groupId' });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (since) {
      query = query.gte('created_at', new Date(parseInt(since)).toISOString());
    }

    const { data, error } = await query.limit(parseInt(limit));

    if (error) {
      console.error('Fetch group messages error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true, messages: data || [] });
  } catch (error) {
    console.error('GET /group-messages/:groupId error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch group messages' });
  }
});

/**
 * POST /api/group-messages/send
 * Send a group message
 */
router.post('/group-messages/send', async (req, res) => {
  try {
    const { 
      groupId, 
      senderId, 
      content,
      contentType = 'text',
      attachmentUrls = [],
      replyToId = null
    } = req.body;

    if (!groupId || !senderId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getSupabaseAdmin();

    const messageData = {
      group_id: groupId,
      sender_id: senderId,
      content: content.trim(),
      content_type: contentType,
      attachment_urls: attachmentUrls,
      reply_to_id: replyToId,
      status: 'sent',
      created_at: new Date().toISOString()
    };

    const { data: message, error } = await supabase
      .from('group_messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      console.error('Send group message error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Broadcast via WebSocket
    if (global.wss) {
      broadcastToGroup(groupId, {
        type: 'new_message',
        message: message
      });
    }

    res.json({ ok: true, message });
  } catch (error) {
    console.error('POST /group-messages/send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send group message' });
  }
});

/**
 * Helper: Broadcast to all clients in a 1-on-1 chat
 */
function broadcastToChat(chatId, data) {
  if (!global.wss) return;
  global.wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

/**
 * Helper: Broadcast to all clients in a group
 */
function broadcastToGroup(groupId, data) {
  if (!global.wss) return;
  global.wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify({ ...data, groupId }));
    }
  });
}

export default router;
