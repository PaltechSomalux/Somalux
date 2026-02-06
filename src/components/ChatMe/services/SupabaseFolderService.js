/**
 * SupabaseFolderService.js
 * 
 * Supabase integration for chat folder organization
 * Handles 1-on-1 chat folders and group folders
 */

import { supabase } from '../../../supabase';
import { logError } from '../../../utils/errorFormatter';

class SupabaseFolderServiceClass {
  constructor() {
    this.unsubscribers = new Map();
  }

  /**
   * Create a new chat folder
   */
  async createChatFolder(userId, folderId, name) {
    try {
      const { data, error } = await supabase
        .from('user_chat_folders')
        .insert({
          folder_id: folderId,
          user_id: userId,
          name,
          is_pinned: false,
          is_locked: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logError('Failed to create chat folder', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('createChatFolder error', error);
      throw error;
    }
  }

  /**
   * Get all chat folders for a user
   */
  async getUserChatFolders(userId) {
    try {
      const { data: folders, error: foldersError } = await supabase
        .from('user_chat_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (foldersError) {
        logError('Failed to fetch chat folders', foldersError);
        throw foldersError;
      }

      // Get members for each folder
      const foldersWithMembers = await Promise.all(
        (folders || []).map(async (folder) => {
          const { data: members, error: membersError } = await supabase
            .from('chat_folder_assignments')
            .select('chat_id')
            .eq('folder_id', folder.folder_id);

          if (membersError) {
            logError('Failed to fetch folder members', membersError);
            return { ...folder, members: [] };
          }

          return {
            ...folder,
            members: members?.map((m) => m.chat_id) || [],
          };
        })
      );

      return foldersWithMembers;
    } catch (error) {
      logError('getUserChatFolders error', error);
      throw error;
    }
  }

  /**
   * Subscribe to user's chat folders (real-time)
   */
  subscribeToUserChatFolders(userId, onUpdate) {
    try {
      const subscription = supabase
        .from(`user_chat_folders:user_id=eq.${userId}`)
        .on('*', () => {
          if (onUpdate) onUpdate();
        })
        .subscribe();

      const subscriptionId = `chat_folders_${userId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => subscription.unsubscribe());

      return subscriptionId;
    } catch (error) {
      logError('subscribeToUserChatFolders error', error);
      return null;
    }
  }

  /**
   * Update chat folder (name, pinned, locked status)
   */
  async updateChatFolder(folderId, userId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_chat_folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logError('Failed to update chat folder', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('updateChatFolder error', error);
      throw error;
    }
  }

  /**
   * Delete chat folder
   */
  async deleteChatFolder(folderId, userId) {
    try {
      // Delete all members first
      const { error: membersError } = await supabase
        .from('chat_folder_assignments')
        .delete()
        .eq('folder_id', folderId);

      if (membersError) {
        logError('Failed to delete folder members', membersError);
        throw membersError;
      }

      // Delete folder
      const { error } = await supabase
        .from('user_chat_folders')
        .delete()
        .eq('folder_id', folderId)
        .eq('user_id', userId);

      if (error) {
        logError('Failed to delete chat folder', error);
        throw error;
      }

      return true;
    } catch (error) {
      logError('deleteChatFolder error', error);
      throw error;
    }
  }

  /**
   * Add chat to folder
   */
  async addChatToFolder(folderId, userId, chatId) {
    try {
      const { data, error } = await supabase
        .from('chat_folder_assignments')
        .insert({
          folder_id: folderId,
          user_id: userId,
          chat_id: chatId,
        })
        .select()
        .single();

      if (error) {
        logError('Failed to add chat to folder', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('addChatToFolder error', error);
      throw error;
    }
  }

  /**
   * Remove chat from folder
   */
  async removeChatFromFolder(folderId, chatId) {
    try {
      const { error } = await supabase
        .from('chat_folder_assignments')
        .delete()
        .eq('folder_id', folderId)
        .eq('chat_id', chatId);

      if (error) {
        logError('Failed to remove chat from folder', error);
        throw error;
      }

      return true;
    } catch (error) {
      logError('removeChatFromFolder error', error);
      throw error;
    }
  }

  /**
   * Get chats in a folder
   */
  async getFolderChats(folderId, userId) {
    try {
      const { data: members, error } = await supabase
        .from('chat_folder_assignments')
        .select('chat_id')
        .eq('folder_id', folderId)
        .eq('user_id', userId);

      if (error) {
        logError('Failed to fetch folder chats', error);
        throw error;
      }

      return members?.map((m) => m.chat_id) || [];
    } catch (error) {
      logError('getFolderChats error', error);
      throw error;
    }
  }

  /**
   * Create a new group folder
   */
  async createGroupFolder(userId, folderId, name) {
    try {
      const { data, error } = await supabase
        .from('user_group_folders')
        .insert({
          folder_id: folderId,
          user_id: userId,
          name,
          is_pinned: false,
          is_locked: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logError('Failed to create group folder', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('createGroupFolder error', error);
      throw error;
    }
  }

  /**
   * Get all group folders for a user
   */
  async getUserGroupFolders(userId) {
    try {
      const { data: folders, error: foldersError } = await supabase
        .from('user_group_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (foldersError) {
        logError('Failed to fetch group folders', foldersError);
        throw foldersError;
      }

      // Get members for each folder
      const foldersWithMembers = await Promise.all(
        (folders || []).map(async (folder) => {
          const { data: members, error: membersError } = await supabase
            .from('group_folder_members')
            .select('group_id')
            .eq('folder_id', folder.folder_id);

          if (membersError) {
            logError('Failed to fetch group folder members', membersError);
            return { ...folder, members: [] };
          }

          return {
            ...folder,
            members: members?.map((m) => m.group_id) || [],
          };
        })
      );

      return foldersWithMembers;
    } catch (error) {
      logError('getUserGroupFolders error', error);
      throw error;
    }
  }

  /**
   * Subscribe to user's group folders (real-time)
   */
  subscribeToUserGroupFolders(userId, onUpdate) {
    try {
      const subscription = supabase
        .from(`user_group_folders:user_id=eq.${userId}`)
        .on('*', () => {
          if (onUpdate) onUpdate();
        })
        .subscribe();

      const subscriptionId = `group_folders_${userId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => subscription.unsubscribe());

      return subscriptionId;
    } catch (error) {
      logError('subscribeToUserGroupFolders error', error);
      return null;
    }
  }

  /**
   * Update group folder
   */
  async updateGroupFolder(folderId, userId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_group_folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logError('Failed to update group folder', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('updateGroupFolder error', error);
      throw error;
    }
  }

  /**
   * Delete group folder
   */
  async deleteGroupFolder(folderId, userId) {
    try {
      // Delete all members first
      const { error: membersError } = await supabase
        .from('group_folder_members')
        .delete()
        .eq('folder_id', folderId);

      if (membersError) {
        logError('Failed to delete group folder members', membersError);
        throw membersError;
      }

      // Delete folder
      const { error } = await supabase
        .from('user_group_folders')
        .delete()
        .eq('folder_id', folderId)
        .eq('user_id', userId);

      if (error) {
        logError('Failed to delete group folder', error);
        throw error;
      }

      return true;
    } catch (error) {
      logError('deleteGroupFolder error', error);
      throw error;
    }
  }

  /**
   * Add group to folder
   */
  async addGroupToFolder(folderId, userId, groupId) {
    try {
      const { data, error } = await supabase
        .from('group_folder_members')
        .insert({
          folder_id: folderId,
          user_id: userId,
          group_id: groupId,
        })
        .select()
        .single();

      if (error) {
        logError('Failed to add group to folder', error);
        throw error;
      }

      return data;
    } catch (error) {
      logError('addGroupToFolder error', error);
      throw error;
    }
  }

  /**
   * Remove group from folder
   */
  async removeGroupFromFolder(folderId, groupId) {
    try {
      const { error } = await supabase
        .from('group_folder_members')
        .delete()
        .eq('folder_id', folderId)
        .eq('group_id', groupId);

      if (error) {
        logError('Failed to remove group from folder', error);
        throw error;
      }

      return true;
    } catch (error) {
      logError('removeGroupFromFolder error', error);
      throw error;
    }
  }

  /**
   * Get groups in a folder
   */
  async getFolderGroups(folderId, userId) {
    try {
      const { data: members, error } = await supabase
        .from('group_folder_members')
        .select('group_id')
        .eq('folder_id', folderId)
        .eq('user_id', userId);

      if (error) {
        logError('Failed to fetch folder groups', error);
        throw error;
      }

      return members?.map((m) => m.group_id) || [];
    } catch (error) {
      logError('getFolderGroups error', error);
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

export const SupabaseFolderService = new SupabaseFolderServiceClass();
