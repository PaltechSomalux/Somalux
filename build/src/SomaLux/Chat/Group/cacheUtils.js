// Cache utility functions for group chat
// Helps reduce Firebase reads and improve performance

const STORAGE_PREFIX = 'groupChat_';
const MAX_CACHED_GROUPS = 20; // Only cache recent groups
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const cacheUtils = {
  // Get messages cache key
  getMessagesKey: (groupId) => `${STORAGE_PREFIX}messages_${groupId}`,
  
  // Get group metadata cache key
  getGroupKey: (groupId) => `${STORAGE_PREFIX}group_${groupId}`,
  
  // Clear old/expired caches
  clearExpiredCaches: () => {
    try {
      const now = Date.now();
      const keysToRemove = [];
      
      // Check all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Only check our group chat keys
        if (key && key.startsWith(STORAGE_PREFIX)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              
              // Check if it has a timestamp and is expired
              if (parsed.timestamp && now - parsed.timestamp > CACHE_DURATION) {
                keysToRemove.push(key);
              }
            }
          } catch (e) {
            // If we can't parse it, mark for removal
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove expired keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleared ${keysToRemove.length} expired cache entries`);
      }
    } catch (error) {
      console.error('Error clearing expired caches:', error);
    }
  },
  
  // Clear specific group cache
  clearGroupCache: (groupId) => {
    try {
      localStorage.removeItem(cacheUtils.getMessagesKey(groupId));
      localStorage.removeItem(cacheUtils.getGroupKey(groupId));
      console.log(`🗑️ Cleared cache for group ${groupId}`);
    } catch (error) {
      console.error('Error clearing group cache:', error);
    }
  },
  
  // Get cache size in MB
  getCacheSize: () => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            total += value.length;
          }
        }
      }
      return (total / (1024 * 1024)).toFixed(2); // Convert to MB
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }
};

// Run cleanup on load
if (typeof window !== 'undefined') {
  cacheUtils.clearExpiredCaches();
}
