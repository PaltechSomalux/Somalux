// src/components/chat/hooks/useCache.js
import { useEffect } from 'react';
import { serializeUsers, deserializeUsers } from './chatUtils'; // Assume utils file

export const useCache = (currentUserUid, users) => {
  useEffect(() => {
    if (!currentUserUid) return;
    const cached = localStorage.getItem(`${'chatme_userChats_cache'}_${currentUserUid}`);
    if (cached) {
      const cachedUsers = deserializeUsers(cached, currentUserUid);
      // Note: In original, it sets users here, but since we have main fetch, perhaps just log or handle initial load
      // console.log('ChatList.jsx: Loaded from cache', { count: cachedUsers.length });
    }
  }, [currentUserUid]);

  useEffect(() => {
    if (!currentUserUid || users.length === 0) return;
    localStorage.setItem(`${'chatme_userChats_cache'}_${currentUserUid}`, serializeUsers(users));
  }, [currentUserUid, users]);
};