// src/components/chat/utils/chatUtils.js (New file for shared utils)
export const CACHE_KEY = 'chatme_userChats_cache';

export const getChatId = (uidA, uidB) => {
  if (!uidA || !uidB) {
    console.warn('ChatList.jsx: getChatId: Missing UID', { uidA, uidB });
    return null;
  }
  return [uidA, uidB].sort().join('_');
};

export const serializeUsers = (users) => JSON.stringify(users.map(u => ({
  ...u,
  lastMessageTimestamp: u.lastMessageTimestamp?.toISOString?.(),
})));

export const deserializeUsers = (cachedStr, currentUserUid) => {
  if (!cachedStr) return [];
  try {
    return JSON.parse(cachedStr).map(u => ({
      ...u,
      lastMessageTimestamp: u.lastMessageTimestamp ? new Date(u.lastMessageTimestamp) : new Date(),
      isTyping: false,
      unreadCount: 0,
      currentUserUid,
    }));
  } catch (e) {
    console.warn('ChatList.jsx: Cache deserialization failed', e);
    return [];
  }
};