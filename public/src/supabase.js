// Cloud service has been removed. Using Supabase instead.
// This file is kept for backwards compatibility but all references
// should be migrated to use the backend API or Supabase directly.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wuwlnawtuhjoubfkdtgc.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2xuYXd0dWhqb3ViZmtkdGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNDQyNDksImV4cCI6MTczODgyNDI0OX0.gmlvDM6pDyPj0_xMJHoXOQN_3F4p2J6-8vLdXkJEBxY';

// Export Supabase client for any components that need it
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Enable session persistence - keep user logged in across page reloads
    persistSession: true,
    // Store session in localStorage (survives page refresh)
    storage: window.localStorage,
    // Auto-refresh session if it expires
    autoRefreshToken: true,
    // Detect session changes across tabs
    detectSessionInUrl: true,
    // Keep-alive interval (ms) - refresh token before expiry
    keepAliveInterval: 60000, // 60 seconds
  },
});

// Placeholder exports for compatibility (not using anymore)
export const db = null;
export const auth = null;
export const provider = null;
export const messaging = null;
export const storage = null;

// Group Service - Handles all group-related database operations
export const groupService = {
  // Get all groups for current user
  async getGroups(userId) {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map(item => item.groups);
  },

  // Get group by ID with members
  async getGroup(groupId) {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId);

    if (membersError) throw membersError;

    const { data: admins, error: adminsError } = await supabase
      .from('group_admins')
      .select('admin_id')
      .eq('group_id', groupId);

    if (adminsError) throw adminsError;

    return {
      id: group.id,
      ...group,
      members: members,
      memberIds: members.map(m => m.user_id),
      admins: admins.map(a => a.admin_id)
    };
  },

  // Create group
  async createGroup(groupData, userId) {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([{
        name: groupData.name,
        description: groupData.description || '',
        icon: groupData.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupData.name)}&background=random`,
        created_by: userId,
        last_activity: new Date().toISOString(),
        only_admins_can_send: false
      }])
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert([{
        group_id: group.id,
        user_id: userId,
        role: 'admin'
      }]);

    if (memberError) throw memberError;

    // Add to admins table
    const { error: adminError } = await supabase
      .from('group_admins')
      .insert([{
        group_id: group.id,
        admin_id: userId
      }]);

    if (adminError) throw adminError;

    // Add other members
    if (groupData.memberIds && groupData.memberIds.length > 0) {
      const memberInserts = groupData.memberIds.map(memberId => ({
        group_id: group.id,
        user_id: memberId,
        role: 'member'
      }));

      const { error: addMembersError } = await supabase
        .from('group_members')
        .insert(memberInserts);

      if (addMembersError) throw addMembersError;
    }

    return group;
  },

  // Update group
  async updateGroup(groupId, updates) {
    const { data, error } = await supabase
      .from('groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add member to group
  async addMember(groupId, userId) {
    const { data, error } = await supabase
      .from('group_members')
      .insert([{
        group_id: groupId,
        user_id: userId,
        role: 'member'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove member from group
  async removeMember(groupId, userId) {
    const { error: memberError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (memberError) throw memberError;

    // Also remove from admins if applicable
    const { error: adminError } = await supabase
      .from('group_admins')
      .delete()
      .eq('group_id', groupId)
      .eq('admin_id', userId);

    if (adminError) throw adminError;
  },

  // Make user admin
  async makeAdmin(groupId, userId) {
    const { error: memberError } = await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const { error: adminError } = await supabase
      .from('group_admins')
      .insert([{
        group_id: groupId,
        admin_id: userId
      }]);

    if (adminError && adminError.code !== '23505') throw adminError; // Ignore unique constraint
  },

  // Remove admin privileges
  async removeAdmin(groupId, userId) {
    const { error: memberError } = await supabase
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const { error: adminError } = await supabase
      .from('group_admins')
      .delete()
      .eq('group_id', groupId)
      .eq('admin_id', userId);

    if (adminError) throw adminError;
  },

  // Get group messages
  async getGroupMessages(groupId, limit = 50) {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Send message to group
  async sendMessage(groupId, senderId, text, replyToId = null) {
    const { data, error } = await supabase
      .from('group_messages')
      .insert([{
        group_id: groupId,
        sender_id: senderId,
        text: text,
        status: 'delivered',
        reply_to: replyToId,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Update group last activity
    await this.updateGroup(groupId, { last_activity: new Date().toISOString() });

    return data;
  },

  // Delete message
  async deleteMessage(messageId, userId) {
    const { data, error } = await supabase
      .from('group_messages')
      .select('deleted_by')
      .eq('id', messageId)
      .single();

    if (error) throw error;

    const deletedBy = data.deleted_by || [];
    if (!deletedBy.includes(userId)) {
      deletedBy.push(userId);
    }

    const { error: updateError } = await supabase
      .from('group_messages')
      .update({ deleted_by: deletedBy })
      .eq('id', messageId);

    if (updateError) throw updateError;
  },

  // Mark message as read
  async markMessageAsRead(messageId, userId) {
    const { error } = await supabase
      .from('group_message_reads')
      .insert([{
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString()
      }], { onConflict: 'message_id,user_id' });

    if (error && error.code !== '23505') throw error; // Ignore duplicate key
  },

  // Subscribe to group changes
  subscribeToGroup(groupId, callback) {
    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Subscribe to group messages
  subscribeToGroupMessages(groupId, callback) {
    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          callback({ type: 'INSERT', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          callback({ type: 'UPDATE', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          callback({ type: 'DELETE', data: payload.old });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get group members with details
  async getGroupMembersWithDetails(groupId) {
    const { data: members, error } = await supabase
      .from('group_members')
      .select(`
        user_id,
        role,
        joined_at
      `)
      .eq('group_id', groupId);

    if (error) throw error;
    return members;
  }
};

// Chat Service - Handles all 1-1 chat operations with Supabase
export const chatService = {
  // Get all chats for current user (1-1 conversations)
  async getChats(userId) {
    if (!userId) throw new Error('User ID is required');

    try {
      // Fetch all conversations where user is involved
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      return conversations || [];
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  },

  // Get or create a conversation between two users
  async getOrCreateConversation(userId, otherUserId) {
    if (!userId || !otherUserId) throw new Error('Both user IDs are required');

    // Ensure userId is the smaller one for consistent conversation ID
    const [user1Id, user2Id] = [userId, otherUserId].sort();

    try {
      // Check if conversation already exists
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user1_id', user1Id)
        .eq('user2_id', user2Id)
        .single();

      // If found, return it
      if (existing && !fetchError) {
        return existing;
      }

      // If not found and no error, create new conversation
      if (fetchError?.code === 'PGRST116') {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert([{
            user1_id: user1Id,
            user2_id: user2Id,
            created_at: new Date().toISOString(),
            last_message_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        return newConversation;
      }

      // Other errors
      if (fetchError) throw fetchError;
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  },

  // Get self-chat (chat with yourself)
  async getSelfChat(userId) {
    if (!userId) throw new Error('User ID is required');

    try {
      const selfChatId = `self_${userId}`;
      
      // Check if self-chat record exists
      const { data: existing, error: fetchError } = await supabase
        .from('self_chats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If found, return it
      if (existing && !fetchError) {
        return existing;
      }

      // If not found, create self-chat record
      if (fetchError?.code === 'PGRST116') {
        const { data: selfChat, error: createError } = await supabase
          .from('self_chats')
          .insert([{
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        return selfChat;
      }

      if (fetchError) throw fetchError;
    } catch (error) {
      console.error('Error getting self-chat:', error);
      throw error;
    }
  },

  // Fetch user details
  async getUserDetails(userId) {
    if (!userId) throw new Error('User ID is required');

    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  // Fetch multiple users
  async getUsersDetails(userIds) {
    if (!userIds || userIds.length === 0) return [];

    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (error) throw error;
      
      return users || [];
    } catch (error) {
      console.error('Error fetching users details:', error);
      throw error;
    }
  },

  // Get latest message in a conversation
  async getLatestMessage(conversationId) {
    if (!conversationId) return null;

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error?.code === 'PGRST116') return null; // No messages yet
      if (error) throw error;
      
      return message || null;
    } catch (error) {
      console.error('Error fetching latest message:', error);
      return null;
    }
  },

  // Get latest messages for multiple conversations (batched)
  async getLatestMessagesForConversations(conversationIds) {
    if (!conversationIds || conversationIds.length === 0) return new Map();

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('conversation_id, id, text, sender_id, created_at, is_deleted')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const latestMap = new Map();
      (messages || []).forEach(msg => {
        if (!latestMap.has(msg.conversation_id)) {
          latestMap.set(msg.conversation_id, msg);
        }
      });

      return latestMap;
    } catch (error) {
      console.error('Error fetching latest messages:', error);
      return new Map();
    }
  },

  // Send message in conversation
  async sendMessage(conversationId, senderId, text) {
    if (!conversationId || !senderId || !text) {
      throw new Error('conversationId, senderId, and text are required');
    }

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          text: text,
          is_deleted: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Delete message (soft delete)
  async deleteMessage(messageId) {
    if (!messageId) throw new Error('Message ID is required');

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Subscribe to conversation changes
  subscribeToConversation(conversationId, callback) {
    if (!conversationId) return () => {};

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Subscribe to messages in conversation
  subscribeToMessages(conversationId, callback) {
    if (!conversationId) return () => {};

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => callback({ type: 'INSERT', data: payload.new })
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => callback({ type: 'UPDATE', data: payload.new })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
