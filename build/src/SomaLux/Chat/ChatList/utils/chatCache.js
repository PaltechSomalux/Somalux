/**
 * ChatCache - LocalStorage utility for caching chat data
 * Reduces Firebase reads and provides instant UI loading
 */

export const ChatCache = {
  // Cache key generators
  KEYS: {
    CHATLIST: (userId) => `kissme_chatlist_${userId}`,
    MESSAGES: (chatId) => `kissme_messages_${chatId}`,
    USERS: 'kissme_users_cache',
    TYPING: 'kissme_typing_state',
    SETTINGS: (userId) => `kissme_settings_${userId}`,
  },

  // Cache expiration times
  MAX_AGE: {
    CHATLIST: 5 * 60 * 1000, // 5 minutes
    MESSAGES: 10 * 60 * 1000, // 10 minutes
    USERS: 30 * 60 * 1000, // 30 minutes
    TYPING: 30 * 1000, // 30 seconds
  },

  VERSION: '1.0',

  /**
   * Save data to cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} maxAge - Optional custom max age
   */
  save(key, data, maxAge = null) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: this.VERSION,
        maxAge: maxAge || this.MAX_AGE.CHATLIST,
      };
      
      localStorage.setItem(key, JSON.stringify(cacheData));
      // console.log(`💾 Cached: ${key} (${this._getSize(cacheData)} KB)`);
      
      return true;
    } catch (error) {
      console.error('❌ Cache save failed:', error);
      
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ Storage quota exceeded, clearing old cache...');
        this.clearOldCache();
        
        // Try again after clearing
        try {
          localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now(),
            version: this.VERSION,
          }));
          console.log(`✅ Cached after cleanup: ${key}`);
          return true;
        } catch (retryError) {
          console.error('❌ Cache save failed even after cleanup:', retryError);
          return false;
        }
      }
      
      return false;
    }
  },

  /**
   * Load data from cache
   * @param {string} key - Cache key
   * @param {number} maxAge - Optional custom max age
   * @returns {any|null} Cached data or null if expired/missing
   */
  load(key, maxAge = null) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        console.log(`📭 Cache miss: ${key}`);
        return null;
      }

      const { data, timestamp, version, maxAge: storedMaxAge } = JSON.parse(cached);

      // Check version compatibility
      if (version !== this.VERSION) {
        console.warn(`⚠️ Cache version mismatch for ${key}: ${version} vs ${this.VERSION}`);
        this.clear(key);
        return null;
      }

      // Check age
      const age = Date.now() - timestamp;
      const ageLimit = maxAge || storedMaxAge || this.MAX_AGE.CHATLIST;
      
      if (age > ageLimit) {
        console.log(`⏰ Cache expired: ${key} (${Math.round(age / 1000)}s old)`);
        this.clear(key);
        return null;
      }

      console.log(`✅ Cache hit: ${key} (${Math.round(age / 1000)}s old)`);
      return data;
    } catch (error) {
      console.error('❌ Cache load failed:', error);
      this.clear(key);
      return null;
    }
  },

  /**
   * Clear specific cache entry
   * @param {string} key - Cache key to clear
   */
  clear(key) {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared cache: ${key}`);
    } catch (error) {
      console.error('❌ Cache clear failed:', error);
    }
  },

  /**
   * Clear all cache for a specific user
   * @param {string} userId - User ID
   */
  clearUserCache(userId) {
    try {
      const keys = Object.keys(localStorage);
      let cleared = 0;
      
      keys.forEach(key => {
        if (key.startsWith('kissme_') && key.includes(userId)) {
          localStorage.removeItem(key);
          cleared++;
        }
      });
      
      console.log(`🗑️ Cleared ${cleared} cache entries for user: ${userId}`);
    } catch (error) {
      console.error('❌ Clear user cache failed:', error);
    }
  },

  /**
   * Clear all KissMe cache
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      let cleared = 0;
      
      keys.forEach(key => {
        if (key.startsWith('kissme_')) {
          localStorage.removeItem(key);
          cleared++;
        }
      });
      
      console.log(`🗑️ Cleared all ${cleared} KissMe cache entries`);
    } catch (error) {
      console.error('❌ Clear all cache failed:', error);
    }
  },

  /**
   * Clear oldest cache entries when quota is exceeded
   */
  clearOldCache() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith('kissme_'));

      if (cacheKeys.length === 0) {
        console.log('ℹ️ No cache to clear');
        return;
      }

      // Get cache items with timestamps
      const cacheItems = cacheKeys
        .map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            return { key, timestamp: data.timestamp || 0, size: this._getSize(data) };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // Sort by timestamp (oldest first)
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 30%
      const toRemove = Math.ceil(cacheItems.length * 0.3);
      const removed = cacheItems.slice(0, toRemove);
      
      removed.forEach(item => {
        localStorage.removeItem(item.key);
      });

      const totalSize = removed.reduce((sum, item) => sum + item.size, 0);
      console.log(`🗑️ Cleared ${toRemove} old cache items (${totalSize.toFixed(2)} KB freed)`);
    } catch (error) {
      console.error('❌ Clear old cache failed:', error);
    }
  },

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith('kissme_'));
      
      let totalSize = 0;
      let validCount = 0;
      let expiredCount = 0;
      
      cacheKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const size = this._getSize(data);
          totalSize += size;
          
          const age = Date.now() - (data.timestamp || 0);
          const maxAge = data.maxAge || this.MAX_AGE.CHATLIST;
          
          if (age > maxAge) {
            expiredCount++;
          } else {
            validCount++;
          }
        } catch {
          // Invalid cache entry
        }
      });
      
      return {
        total: cacheKeys.length,
        valid: validCount,
        expired: expiredCount,
        totalSize: totalSize.toFixed(2) + ' KB',
      };
    } catch (error) {
      console.error('❌ Get cache stats failed:', error);
      return { total: 0, valid: 0, expired: 0, totalSize: '0 KB' };
    }
  },

  /**
   * Check if cache is available and working
   * @returns {boolean} True if cache is available
   */
  isAvailable() {
    try {
      const testKey = 'kissme_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get size of data in KB
   * @private
   */
  _getSize(data) {
    try {
      const str = JSON.stringify(data);
      return new Blob([str]).size / 1024;
    } catch {
      return 0;
    }
  },

  /**
   * Batch save multiple items
   * @param {Array} items - Array of {key, data} objects
   */
  batchSave(items) {
    let saved = 0;
    let failed = 0;
    
    items.forEach(({ key, data, maxAge }) => {
      if (this.save(key, data, maxAge)) {
        saved++;
      } else {
        failed++;
      }
    });
    
    console.log(`📦 Batch save: ${saved} saved, ${failed} failed`);
    return { saved, failed };
  },

  /**
   * Batch load multiple items
   * @param {Array} keys - Array of cache keys
   * @returns {Object} Map of key -> data
   */
  batchLoad(keys) {
    const results = {};
    
    keys.forEach(key => {
      const data = this.load(key);
      if (data !== null) {
        results[key] = data;
      }
    });
    
    console.log(`📦 Batch load: ${Object.keys(results).length}/${keys.length} hits`);
    return results;
  },
};

// Export default
export default ChatCache;
