/**
 * Chat Authentication Service
 * Integrates with the main system's Supabase auth
 */

import { supabase } from '../../Books/supabaseClient';

/**
 * Get current authenticated user
 */
export const getCurrentChatUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get current user's session
 */
export const getChatUserSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  return subscription;
};

/**
 * Get or create user chat profile
 * NOTE: Profiles are now auto-created by database trigger when user signs up
 * This function just retrieves the existing profile
 */
export const ensureChatUserProfile = async (userId) => {
  try {
    // Get existing profile
    const { data: existing, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existing) {
      return existing;
    }

    // If profile doesn't exist yet, it will be created by auth trigger
    // For now, just log and return null
    console.warn('Profile not yet created for user:', userId);
    return null;
  } catch (error) {
    console.error('Error retrieving chat user profile:', error);
    return null;
  }
};

/**
 * Update user chat PIN (hashed)
 * NOTE: chat_pin_hash and chat_pin_updated_at columns don't exist in schema
 * This functionality is disabled for now
 */
export const setUserChatPin = async (userId, pinHash) => {
  try {
    // Disabled - columns don't exist in profiles schema
    console.warn('setUserChatPin: PIN storage disabled - columns not in schema');
    return null;
  } catch (error) {
    console.error('Error setting chat PIN:', error);
    throw error;
  }
};

/**
 * Get user chat PIN (hashed)
 * NOTE: chat_pin_hash column doesn't exist in schema
 * This functionality is disabled for now
 */
export const getUserChatPin = async (userId) => {
  try {
    // Disabled - column doesn't exist in profiles schema
    console.warn('getUserChatPin: PIN retrieval disabled - column not in schema');
    return null;
  } catch (error) {
    console.error('Error getting chat PIN:', error);
    return null;
  }
};

/**
 * Verify user chat PIN
 */
export const verifyChatPin = async (userId, pinHash) => {
  try {
    const stored = await getUserChatPin(userId);
    return stored === pinHash;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

/**
 * Clear user chat PIN
 * NOTE: chat_pin_hash and chat_pin_updated_at columns don't exist in schema
 * This functionality is disabled for now
 */
export const clearUserChatPin = async (userId) => {
  try {
    // Disabled - columns don't exist in profiles schema
    console.warn('clearUserChatPin: PIN clearing disabled - columns not in schema');
    return null;

    if (error) throw error;
  } catch (error) {
    console.error('Error clearing chat PIN:', error);
    throw error;
  }
};
