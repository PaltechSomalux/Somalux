/**
 * IndexedDB Cache for super-fast loading
 * Persists across browser sessions for instant loads
 */

const DB_NAME = 'SomaLuxCache';
const DB_VERSION = 1;
const STORES = {
  CATEGORIES: 'categories',
  AUTHORS: 'authors'
};

class CacheDB {
  constructor() {
    this.db = null;
    this.initDB();
  }

  initDB() {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB init failed');
    };

    request.onsuccess = (event) => {
      this.db = event.target.result;
      console.log('✅ IndexedDB initialized');
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.AUTHORS)) {
        db.createObjectStore(STORES.AUTHORS, { keyPath: 'id' });
      }
    };
  }

  /**
   * Save categories to IndexedDB
   */
  async saveCategories(categories) {
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db.transaction([STORES.CATEGORIES], 'readwrite');
      const store = tx.objectStore(STORES.CATEGORIES);

      store.clear();

      categories.forEach(cat => {
        store.add({
          id: cat.id,
          ...cat,
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });
      });

      tx.oncomplete = () => {
        console.log(`✅ Cached ${categories.length} categories in IndexedDB`);
        resolve(true);
      };
      tx.onerror = () => resolve(false);
    });
  }

  /**
   * Load categories from IndexedDB
   */
  async loadCategories() {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const tx = this.db.transaction([STORES.CATEGORIES], 'readonly');
      const store = tx.objectStore(STORES.CATEGORIES);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.filter(cat => cat.expiresAt > Date.now());
        if (results.length > 0) {
          console.log(`✅ Loaded ${results.length} categories from IndexedDB - INSTANT`);
          resolve(results);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  /**
   * Save authors to IndexedDB
   */
  async saveAuthors(authors) {
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db.transaction([STORES.AUTHORS], 'readwrite');
      const store = tx.objectStore(STORES.AUTHORS);

      store.clear();

      authors.forEach(author => {
        store.add({
          id: author.id,
          ...author,
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });
      });

      tx.oncomplete = () => {
        console.log(`✅ Cached ${authors.length} authors in IndexedDB`);
        resolve(true);
      };
      tx.onerror = () => resolve(false);
    });
  }

  /**
   * Load authors from IndexedDB
   */
  async loadAuthors() {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const tx = this.db.transaction([STORES.AUTHORS], 'readonly');
      const store = tx.objectStore(STORES.AUTHORS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.filter(author => author.expiresAt > Date.now());
        if (results.length > 0) {
          console.log(`✅ Loaded ${results.length} authors from IndexedDB - INSTANT`);
          resolve(results);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  /**
   * Clear all caches
   */
  async clearAll() {
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db.transaction([STORES.CATEGORIES, STORES.AUTHORS], 'readwrite');
      
      tx.objectStore(STORES.CATEGORIES).clear();
      tx.objectStore(STORES.AUTHORS).clear();

      tx.oncomplete = () => {
        console.log('✅ All caches cleared');
        resolve(true);
      };
      tx.onerror = () => resolve(false);
    });
  }
}

// Export singleton instance
export const cacheDB = new CacheDB();
