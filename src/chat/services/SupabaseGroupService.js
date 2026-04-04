/**
 * SupabaseGroupService.js
 * 
 * Supabase integration for group chats
 * Replaces Firebase Firestore group operations with Supabase PostgreSQL
 */

import { supabase } from '../../supabase';
import { logError } from '../../Services/utils/errorFormatter';

class SupabaseGroupServiceClass {
  constructor() {
    this.unsubscribers = new Map();
  }

  /**
   * Create a new group
   */
  async createGroup(groupData) {
    try {
      const {
        groupId,
        name,
        ownerId,
        description = null,
        groupPictureUrl = null,
        memberIds = [],
      } = groupData;

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          group_id: groupId,
          name,
          owner_id: ownerId,
          description,
          group_picture_url: groupPictureUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (groupError) {
        logError('Failed to create group', groupError);
        throw groupError;
      }

      // Add members
      if (memberIds.length > 0) {
        const memberInserts = memberIds.map((userId) => ({
          group_id: group.id,
          user_id: userId,
          joined_at: new Date().toISOString(),
        }));

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(memberInserts);

        if (membersError) {
          logError('Failed to add group members', membersError);
          throw membersError;
        }
      }

      return group;
    } catch (error) {
      logError('createGroup error', error);
      throw error;
    }
  }

  /**
   * Fetch user's groups
   */
  async fetchUserGroups(userId) {
    try {
      const { data: groups, error } = await supabase
        .from('group_members')
        .select('group_id, groups(*)')
        .eq('user_id', userId);

      if (error) {
        logError('Failed to fetch user groups', error);
        throw error;
      }

      return groups?.map((g) => g.groups) || [];
    } catch (error) {
      logError('fetchUserGroups error', error);
      throw error;
    }
  }

  /**
   * Get group details with members
   */
  async getGroupWithMembers(groupId) {
    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (groupError) {
        throw groupError;
      }

      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, users(*)')
        .eq('group_id', group.id);

      if (membersError) {
        throw membersError;
      }

      return {
        ...group,
        members: members?.map((m) => m.users) || [],
      };
    } catch (error) {
      logError('getGroupWithMembers error', error);
      throw error;
    }
  }

  /**
   * Add member to group
   */
  async addGroupMember(groupId, userId) {
    try {
      // Get group by group_id
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('group_id', groupId)
        .single();

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logError('Failed to add group member', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('addGroupMember error', error);
      throw error;
    }
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(groupId, userId) {
    try {
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('group_id', groupId)
        .single();

      const { error, data } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .select();

      if (error) {
        logError('Failed to remove group member', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('removeGroupMember error', error);
      throw error;
    }
  }

  /**
   * Update group info
   */
  async updateGroup(groupId, updates) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('group_id', groupId)
        .select()
        .single();

      if (error) {
        logError('Failed to update group', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('updateGroup error', error);
      throw error;
    }
  }

  /**
   * Send group message
   */
  async sendGroupMessage(groupId, senderId, content, options = {}) {
    try {
      const {
        messageType = 'text',
        mediaUrl = null,
        replyToId = null,
      } = options;

      // Get group by group_id
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('group_id', groupId)
        .single();

      const { data: message, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: group.id,
          sender_id: senderId,
          content,
          message_type: messageType,
          media_url: mediaUrl,
          reply_to_id: replyToId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logError('Failed to send group message', error);
        throw error;
      }

      return message;
    } catch (error) {
      logError('sendGroupMessage error', error);
      throw error;
    }
  }

  /**
   * Fetch group messages
   */
  async fetchGroupMessages(groupId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
      } = options;

      // Get group by group_id
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('group_id', groupId)
        .single();

      const { data: messages, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logError('Failed to fetch group messages', error);
        throw error;
      }

      return messages?.reverse() || [];
    } catch (error) {
      logError('fetchGroupMessages error', error);
      throw error;
    }
  }

  /**
   * Subscribe to group messages (real-time)
   */
  subscribeToGroupMessages(groupId, onMessage) {
    try {
      // Note: This requires getting the group ID first
      // In production, you might want to optimize this
      
      const subscription = supabase
        .from(`group_messages:groups.group_id=eq.${groupId}`)
        .on('INSERT', (payload) => {
          if (onMessage) {
            onMessage({ type: 'INSERT', message: payload.new });
          }
        })
        .on('UPDATE', (payload) => {
          if (onMessage) {
            onMessage({ type: 'UPDATE', message: payload.new });
          }
        })
        .subscribe();

      const subscriptionId = `group_messages_${groupId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => subscription.unsubscribe());

      return subscriptionId;
    } catch (error) {
      logError('subscribeToGroupMessages error', error);
      return null;
    }
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId) {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('group_id', groupId);

      if (error) {
        logError('Failed to delete group', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      logError('deleteGroup error', error);
      throw error;
    }
  }

  /**
   * Create a group folder
   */
  async createGroupFolder(userId, name) {
    try {
      // Generate a proper UUID for the folder ID
      const folderId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('user_group_folders')
        .insert({
          user_id: userId,
          folder_id: folderId,
          name,
          members: [],
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logError('Failed to create group folder', error);
        throw error;
      }

      return { ...data, id: data.folder_id };
    } catch (error) {
      logError('createGroupFolder error', error);
      throw error;
    }
  }

  /**
   * Add groups to a folder
   */
  async addGroupsToFolder(userId, folderId, groupIds) {
    try {
      // Get current folder data
      const { data: folder, error: fetchError } = await supabase
        .from('user_group_folders')
        .select('*')
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .single();

      if (fetchError) throw fetchError;

      const currentMembers = folder.members || [];
      const newMembers = Array.from(new Set([...currentMembers, ...groupIds]));

      // Update folder with new members
      const { data, error } = await supabase
        .from('user_group_folders')
        .update({
          members: newMembers,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('addGroupsToFolder error', error);
      throw error;
    }
  }

  /**
   * Remove groups from a folder
   */
  async removeGroupsFromFolder(userId, folderId, groupIds) {
    try {
      // Get current folder data
      const { data: folder, error: fetchError } = await supabase
        .from('user_group_folders')
        .select('*')
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .single();

      if (fetchError) throw fetchError;

      const currentMembers = folder.members || [];
      const newMembers = currentMembers.filter(id => !groupIds.includes(id));

      // Update folder with removed members
      const { data, error } = await supabase
        .from('user_group_folders')
        .update({
          members: newMembers,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('removeGroupsFromFolder error', error);
      throw error;
    }
  }

  /**
   * Delete a group folder
   */
  async deleteGroupFolder(userId, folderId) {
    try {
      const { error } = await supabase
        .from('user_group_folders')
        .delete()
        .eq('user_id', userId)
        .eq('folder_id', folderId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('deleteGroupFolder error', error);
      throw error;
    }
  }

  /**
   * Update group folder
   */
  async updateGroupFolder(userId, folderId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_group_folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('updateGroupFolder error', error);
      throw error;
    }
  }

  /**
   * Fetch user group folders
   */
  async fetchUserGroupFolders(userId) {
    try {
      const { data: folders, error } = await supabase
        .from('user_group_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return folders.map(f => ({
        ...f,
        id: f.folder_id,
      }));
    } catch (error) {
      logError('fetchUserGroupFolders error', error);
      throw error;
    }
  }

  /**
   * Subscribe to user groups
   */
  subscribeToUserGroups(userId, callback) {
    try {
      // Initial fetch
      this.fetchUserGroups(userId).then(callback);

      // Set up polling for updates
      const pollInterval = setInterval(async () => {
        try {
          const groups = await this.fetchUserGroups(userId);
          if (callback) callback(groups);
        } catch (error) {
          logError('subscribeToUserGroups polling error', error);
        }
      }, 3000); // Poll every 3 seconds

      const subscriptionId = `groups_${userId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => clearInterval(pollInterval));

      return () => this.unsubscribe(subscriptionId);
    } catch (error) {
      logError('subscribeToUserGroups error', error);
      throw error;
    }
  }

  /**
   * Subscribe to user group folders
   */
  subscribeToUserGroupFolders(userId, callback) {
    try {
      // Initial fetch
      this.fetchUserGroupFolders(userId).then(callback);

      // Set up polling for updates
      const pollInterval = setInterval(async () => {
        try {
          const folders = await this.fetchUserGroupFolders(userId);
          if (callback) callback(folders);
        } catch (error) {
          logError('subscribeToUserGroupFolders polling error', error);
        }
      }, 3000); // Poll every 3 seconds

      const subscriptionId = `group_folders_${userId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => clearInterval(pollInterval));

      return () => this.unsubscribe(subscriptionId);
    } catch (error) {
      logError('subscribeToUserGroupFolders error', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a subscription
   */
  unsubscribe(subscriptionId) {
    const unsubscribe = this.unsubscribers.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe all
   */
  unsubscribeAll() {
    this.unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        logError('Error unsubscribing', error);
      }
    });
    this.unsubscribers.clear();
  }
}

export const SupabaseGroupService = new SupabaseGroupServiceClass();
