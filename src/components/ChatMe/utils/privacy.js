// Firebase imports removed - using Supabase instead
// import { doc, setDoc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { supabase } from '../../../supabase';

export const PRIVACY_FIELDS = [
  'lastSeen',
  'profilePhotoVisibility',
  'aboutVisibility',
  'statusVisibility',
  'groupPrivacy',
  'readReceipts',
  'blockedContacts',
  'mutedContacts',
];

const CACHE_KEY = 'myPrivacyCache';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeCache(obj) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...obj, __updatedAt: Date.now() }));
  } catch {}
}

function emitPrivacyUpdated(detail) {
  try {
    window.dispatchEvent(new CustomEvent('privacy:updated', { detail }));
  } catch {}
}

export async function loadMyPrivacy({ preferCache = true } = {}) {
  // Firestore disabled - using Supabase instead
  const cached = readCache();
  if (cached) return cached;
  return null;
}

export async function savePrivacySetting(key, value) {
  // Firestore disabled - using Supabase instead
  if (!PRIVACY_FIELDS.includes(key)) throw new Error('Invalid privacy field');
  // Update cache and emit event for instant UI reflection
  const cached = readCache() || {};
  const next = { ...cached, [key]: value };
  writeCache(next);
  emitPrivacyUpdated({ key, value, all: next });
}

export async function resetPrivacyToDefaults() {
  // Firestore disabled - using Supabase instead
  const defaults = {
    lastSeen: 'everyone',
    profilePhotoVisibility: 'everyone',
    aboutVisibility: 'everyone',
    statusVisibility: 'contacts',
    groupPrivacy: 'contacts',
    readReceipts: true,
  };
  writeCache(defaults);
  emitPrivacyUpdated({ reset: true, all: defaults });
}

// Optional live sync (one listener) – keeps cache fresh with minimal reads
// DISABLED: Firebase migration to Supabase
let liveUnsub = null;
export function ensurePrivacyLiveSync() {
  // Firebase listener disabled - migration to Supabase pending
  return null;
  /*
  if (liveUnsub) return liveUnsub;
  const user = auth.currentUser;
  if (!user) return null;
  const ref = doc(db, 'users', user.uid);
  liveUnsub = onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      writeCache(data);
      emitPrivacyUpdated({ all: data });
    }
  }, (err) => {
    // On failure, drop listener so it can be retried later
    liveUnsub = null;
    console.warn('privacy live sync error', err);
  });
  */
  return liveUnsub;
}
