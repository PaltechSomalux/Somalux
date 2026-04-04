// Helper functions for managing self-chat functionality
// Handles fetching and creating self-chat entries from the self_chats table

import { supabase } from '../../../../supabase';

/**
 * Gets or creates a self-chat for a user
 * Returns the UUID from the self_chats table
 * 
 * @param {string} userId - The user's unique ID
 * @returns {Promise<string>} - The self-chat UUID
 */
export async function getSelfChatId(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // First, try to fetch existing self-chat
    const { data: selfChat, error: fetchError } = await supabase
      .from('self_chats')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (selfChat && selfChat.id) {
      return selfChat.id;
    }

    // If not found and it's a "no rows" error, create a new one
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newSelfChat, error: createError } = await supabase
        .from('self_chats')
        .insert({ user_id: userId })
        .select()
        .single();

      if (createError) {
        console.error('Error creating self-chat:', createError);
        throw createError;
      }

      if (newSelfChat && newSelfChat.id) {
        return newSelfChat.id;
      }

      throw new Error('Failed to create self-chat: no ID returned');
    }

    // Other fetch errors
    if (fetchError) {
      console.error('Error fetching self-chat:', fetchError);
      throw fetchError;
    }

    throw new Error('Self-chat not found and could not be created');
  } catch (error) {
    console.error('getSelfChatId error:', error);
    throw error;
  }
}

/**
 * Batch fetch or create self-chats for multiple users
 * More efficient than calling getSelfChatId multiple times
 * 
 * @param {string[]} userIds - Array of user IDs
 * @returns {Promise<Map<string, string>>} - Map of userId -> selfChatId
 */
export async function getSelfChatIds(userIds) {
  if (!userIds || userIds.length === 0) {
    return new Map();
  }

  const resultMap = new Map();

  try {
    // Fetch existing self-chats
    const { data: existingSelfChats, error: fetchError } = await supabase
      .from('self_chats')
      .select('id, user_id')
      .in('user_id', userIds);

    if (fetchError) {
      console.error('Error fetching self-chats:', fetchError);
      throw fetchError;
    }

    // Map the results
    const foundUserIds = new Set();
    existingSelfChats.forEach(chat => {
      resultMap.set(chat.user_id, chat.id);
      foundUserIds.add(chat.user_id);
    });

    // Find missing users
    const missingUserIds = userIds.filter(uid => !foundUserIds.has(uid));

    // Create self-chats for missing users
    if (missingUserIds.length > 0) {
      const newChatsData = missingUserIds.map(uid => ({ user_id: uid }));
      const { data: newSelfChats, error: createError } = await supabase
        .from('self_chats')
        .insert(newChatsData)
        .select();

      if (createError) {
        console.error('Error creating self-chats:', createError);
        throw createError;
      }

      newSelfChats.forEach(chat => {
        resultMap.set(chat.user_id, chat.id);
      });
    }

    return resultMap;
  } catch (error) {
    console.error('getSelfChatIds error:', error);
    throw error;
  }
}

/**
 * Checks if a given chat ID is a self-chat
 * In the new schema, self-chats have valid UUIDs from the self_chats table
 * 
 * @param {string} chatId - The chat ID to check
 * @param {string} currentUserSelfChatId - The current user's self-chat ID
 * @returns {boolean}
 */
export function isSelfChat(chatId, currentUserSelfChatId) {
  return chatId === currentUserSelfChatId;
}
