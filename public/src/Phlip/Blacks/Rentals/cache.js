// Simple localStorage-backed cache with TTL and prefix deletion
// Keys are stored as JSON: { expires: timestamp, value: any }
export function setCache(key, value, ttlMs = 60000) {
  try {
    const item = {
      expires: Date.now() + ttlMs,
      value
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    // localStorage may be unavailable — ignore
    console.warn('setCache failed', e);
  }
}

export function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (!item || !item.expires) return null;
    if (Date.now() > item.expires) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (e) {
    console.warn('getCache failed', e);
    return null;
  }
}

export function delCache(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('delCache failed', e);
  }
}

export function delCacheByPrefix(prefix) {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('delCacheByPrefix failed', e);
  }
}

export function clearCache() {
  try {
    localStorage.clear();
  } catch (e) {
    console.warn('clearCache failed', e);
  }
}
