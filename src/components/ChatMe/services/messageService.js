/**
 * ChatMe Supabase Service
 * Frontend utility for messaging operations via Supabase and backend API
 */

import { supabase } from '../firebase'; // Uses the configured Supabase client
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Message Service - 1-on-1 Chats
 */
export class MessageService {
  /**
   * Fetch messages for a chat
   */
  static async fetchMessages(chatId, options = {}) {
    const { since = 0, limit = 50 } = options;
    
    try {
      const response = await fetch(
        `${API_URL}/api/messages/${chatId}?since=${since}&limit=${limit}`
      );
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('MessageService.fetchMessages: Non-OK response', {
          status: response.status,
          statusText: response.statusText,
          responseSample: responseText.substring(0, 200)
        });
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('MessageService.fetchMessages: Invalid content type', {
          contentType,
          responseSample: responseText.substring(0, 200)
        });
        throw new Error('Server returned non-JSON response');
      }
      
      const { messages = [] } = await response.json();
      return messages.map(msg => this._normalizeMessage(msg));
    } catch (error) {
      console.error('MessageService.fetchMessages error:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(chatId, senderId, recipientId, content, options = {}) {
    const { 
      contentType = 'text',
      attachmentUrls = [],
      replyToId = null
    } = options;

    try {
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          senderId,
          recipientId,
          content,
          contentType,
          attachmentUrls,
          replyToId
        })
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('MessageService.sendMessage: Non-OK response', {
          status: response.status,
          statusText: response.statusText,
          responseSample: responseText.substring(0, 200)
        });
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const contentType_header = response.headers.get('content-type');
      if (!contentType_header || !contentType_header.includes('application/json')) {
        const responseText = await response.text();
        console.error('MessageService.sendMessage: Invalid content type', {
          contentType: contentType_header,
          responseSample: responseText.substring(0, 200)
        });
        throw new Error('Server returned non-JSON response');
      }

      const { message } = await response.json();
      return this._normalizeMessage(message);
    } catch (error) {
      console.error('MessageService.sendMessage error:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  static async markMessageRead(messageId, userId) {
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      const { message } = await response.json();
      return this._normalizeMessage(message);
    } catch (error) {
      console.error('MessageService.markMessageRead error:', error);
      throw error;
    }
  }

  /**
   * Delete a message (soft delete)
   */
  static async deleteMessage(messageId, userId) {
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      return true;
    } catch (error) {
      console.error('MessageService.deleteMessage error:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId, userId, content) {
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content })
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const { message } = await response.json();
      return this._normalizeMessage(message);
    } catch (error) {
      console.error('MessageService.editMessage error:', error);
      throw error;
    }
  }

  /**
   * Add emoji reaction to message
   */
  static async addReaction(messageId, userId, emoji) {
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, emoji })
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      return await response.json();
    } catch (error) {
      console.error('MessageService.addReaction error:', error);
      throw error;
    }
  }

  /**
   * Remove emoji reaction from message
   */
  static async removeReaction(messageId, userId, emoji) {
    try {
      const response = await fetch(
        `${API_URL}/api/messages/${messageId}/react/${emoji}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove reaction');
      }

      return true;
    } catch (error) {
      console.error('MessageService.removeReaction error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time message updates for a chat
   */
  static subscribeToMessages(chatId, onMessage) {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            onMessage({
              type: 'new_message',
              message: this._normalizeMessage(payload.new)
            });
          } else if (payload.eventType === 'UPDATE') {
            onMessage({
              type: 'message_updated',
              message: this._normalizeMessage(payload.new)
            });
          } else if (payload.eventType === 'DELETE') {
            onMessage({
              type: 'message_deleted',
              messageId: payload.old.id
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Message subscription status for ${chatId}:`, status);
      });

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Subscribe to typing indicators
   */
  static subscribeToTyping(chatId, onTyping) {
    const channel = supabase
      .channel(`typing:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          onTyping({
            userId: payload.new?.user_id || payload.old?.user_id,
            isTyping: payload.eventType !== 'DELETE'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Set typing indicator
   */
  static async setTypingIndicator(chatId, userId) {
    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .insert({
          chat_id: chatId,
          user_id: userId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('MessageService.setTypingIndicator error:', error);
      // Don't throw - typing indicators are not critical
    }
  }

  /**
   * Normalize message from database to UI format
   */
  static _normalizeMessage(msg) {
    return {
      id: msg.id,
      chatId: msg.chat_id,
      senderId: msg.sender_id,
      recipientId: msg.recipient_id,
      text: msg.content,
      content: msg.content,
      contentType: msg.content_type || 'text',
      attachments: msg.attachment_urls || [],
      status: msg.status || 'sent',
      isRead: msg.is_read,
      readAt: msg.read_at,
      deletedAt: msg.deleted_at,
      editedAt: msg.edited_at,
      replyToId: msg.reply_to_id,
      forwardedFromId: msg.forwarded_from_id,
      timestamp: new Date(msg.created_at),
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    };
  }
}

/**
 * Group Message Service
 */
export class GroupMessageService {
  /**
   * Fetch messages for a group
   */
  static async fetchMessages(groupId, options = {}) {
    const { since = 0, limit = 50 } = options;

    try {
      const response = await fetch(
        `${API_URL}/api/group-messages/${groupId}?since=${since}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch group messages');
      }

      const { messages = [] } = await response.json();
      return messages.map(msg => this._normalizeMessage(msg));
    } catch (error) {
      console.error('GroupMessageService.fetchMessages error:', error);
      throw error;
    }
  }

  /**
   * Send a group message
   */
  static async sendMessage(groupId, senderId, content, options = {}) {
    const {
      contentType = 'text',
      attachmentUrls = [],
      replyToId = null
    } = options;

    try {
      const response = await fetch(`${API_URL}/api/group-messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          senderId,
          content,
          contentType,
          attachmentUrls,
          replyToId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send group message');
      }

      const { message } = await response.json();
      return this._normalizeMessage(message);
    } catch (error) {
      console.error('GroupMessageService.sendMessage error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time group message updates
   */
  static subscribeToMessages(groupId, onMessage) {
    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            onMessage({
              type: 'new_message',
              message: this._normalizeMessage(payload.new)
            });
          } else if (payload.eventType === 'UPDATE') {
            onMessage({
              type: 'message_updated',
              message: this._normalizeMessage(payload.new)
            });
          } else if (payload.eventType === 'DELETE') {
            onMessage({
              type: 'message_deleted',
              messageId: payload.old.id
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Mark group message as read
   */
  static async markMessageRead(messageId, userId) {
    try {
      const { error } = await supabase
        .from('group_message_read_status')
        .insert({
          group_message_id: messageId,
          user_id: userId,
          is_read: true,
          read_at: new Date().toISOString()
        })
        .on('*', '=', 'upsert');

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }

      return true;
    } catch (error) {
      console.error('GroupMessageService.markMessageRead error:', error);
      throw error;
    }
  }

  /**
   * Normalize group message from database to UI format
   */
  static _normalizeMessage(msg) {
    return {
      id: msg.id,
      groupId: msg.group_id,
      senderId: msg.sender_id,
      text: msg.content,
      content: msg.content,
      contentType: msg.content_type || 'text',
      attachments: msg.attachment_urls || [],
      status: msg.status || 'sent',
      deletedAt: msg.deleted_at,
      editedAt: msg.edited_at,
      replyToId: msg.reply_to_id,
      forwardedFromId: msg.forwarded_from_id,
      timestamp: new Date(msg.created_at),
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    };
  }
}

export default { MessageService, GroupMessageService };
