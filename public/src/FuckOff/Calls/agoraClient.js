import AgoraRTC from 'agora-rtc-sdk-ng';
import { auth } from '../../firebase';

// Simple wrapper around Agora RTC SDK (agora-rtc-sdk-ng)
// Usage: pass APP_ID via REACT_APP_AGORA_APP_ID and optional token via REACT_APP_AGORA_TOKEN.

let RTCSDK = AgoraRTC;
let client = null;
let localTracks = { videoTrack: null, audioTrack: null };
let clientReadyPromise = null;
let hasJoined = false;
let currentChannel = null;
let joinPromise = null;

export async function initAgoraClient() {
  if (!client) {
    // Lazy/dynamic import fallback in case default import is undefined in this bundler
    if (!RTCSDK || typeof RTCSDK.createClient !== 'function') {
      try {
        const mod = await import('agora-rtc-sdk-ng');
        RTCSDK = mod?.default || mod;
      } catch (impErr) {
        console.error('AgoraRTC dynamic import failed', impErr);
      }
    }
    if (!RTCSDK || typeof RTCSDK.createClient !== 'function') throw new Error('AgoraRTC SDK not available');
    try {
      client = RTCSDK.createClient({ mode: 'rtc', codec: 'vp8' });
    } catch (e) {
      console.error('AgoraRTC.createClient failed', e);
      client = null;
      throw e;
    }
  }
  return client;
}

async function ensureClient() {
  if (client) return client;
  if (!clientReadyPromise) {
    clientReadyPromise = (async () => {
      // ensure SDK present
      if (!RTCSDK || typeof RTCSDK.createClient !== 'function') {
        try {
          const mod = await import('agora-rtc-sdk-ng');
          RTCSDK = mod?.default || mod;
        } catch (e) {
          console.error('AgoraRTC dynamic import failed in ensureClient', e);
          throw e;
        }
      }
      client = RTCSDK.createClient({ mode: 'rtc', codec: 'vp8' });
      return client;
    })().finally(() => {
      clientReadyPromise = null;
    });
  }
  return clientReadyPromise;
}

export async function joinChannel({ appId, token = null, channel, uid = null, onUserPublished, enableVideo = true }) {
  if (!channel) throw new Error('Agora channel is required');
  await initAgoraClient();
  if (!client) {
    try { await ensureClient(); } catch (e) { console.error('Failed to initialize Agora client', e); }
  }
  if (!client) {
    throw new Error('Agora client not initialized');
  }
  try {
    // If token is not provided, try fetching from backend
    let effectiveToken = token;
    let effectiveAppId = appId || null;
    if (!effectiveToken) {
      try {
        // Try to include Firebase ID token for backend authorization
        let idToken = null;
        try {
          idToken = await auth?.currentUser?.getIdToken?.();
        } catch (tokenErr) {
          console.warn('Could not retrieve Firebase ID token for Agora token request', tokenErr);
        }

        const backendBase = process.env.REACT_APP_BACKEND_URL || '';
        const resp = await fetch(`${backendBase}/api/agora/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
          },
          body: JSON.stringify({ channel, uid, ...(idToken ? { idToken } : {}) })
        });
        if (resp.ok) {
          const json = await resp.json();
          effectiveToken = json.token || null;
          if (!effectiveAppId && json.appId) effectiveAppId = json.appId;
        } else {
          console.warn('Failed to fetch agora token from backend', await resp.text());
        }
      } catch (e) {
        console.warn('Error fetching agora token', e);
      }
    }

    // Prevent concurrent joins and reuse existing join
    let localClient = client;
    let joinedUid;
    if (hasJoined && currentChannel === channel) {
      // already in this channel, continue to track creation/publish
      joinedUid = uid || 0;
    } else if (joinPromise) {
      // wait for in-flight join
      await joinPromise;
      joinedUid = uid || 0;
    } else {
      joinPromise = (async () => {
        try {
          const resUid = await localClient.join(effectiveAppId || appId, channel, effectiveToken || null, uid || null);
          hasJoined = true;
          currentChannel = channel;
          return resUid;
        } catch (err) {
          // recreate client and retry once if client got torn down
          if (!client || !localClient) {
            await ensureClient();
            localClient = client;
            const resUid = await localClient.join(effectiveAppId || appId, channel, effectiveToken || null, uid || null);
            hasJoined = true;
            currentChannel = channel;
            return resUid;
          }
          throw err;
        } finally {
          joinPromise = null;
        }
      })();
      joinedUid = await joinPromise;
    }
    // create local tracks
    try {
      if (enableVideo) {
        localTracks = await RTCSDK.createMicrophoneAndCameraTracks();
      } else {
        const audioTrack = await RTCSDK.createMicrophoneAudioTrack();
        localTracks = { videoTrack: null, audioTrack };
      }
    } catch (e) {
      // If camera/mic unavailable, try audio only
      console.warn('Track creation failed, trying audio only', e);
      try {
        const audioTrack = await RTCSDK.createMicrophoneAudioTrack();
        localTracks = { videoTrack: null, audioTrack };
      } catch (err) {
        console.warn('createMicrophoneAudioTrack failed', err);
        localTracks = { videoTrack: null, audioTrack: null };
      }
    }

    // publish local tracks if any
    const publishList = [];
    if (localTracks.audioTrack) publishList.push(localTracks.audioTrack);
    if (localTracks.videoTrack) publishList.push(localTracks.videoTrack);
    if (publishList.length > 0) {
      await client.publish(publishList);
    }

    // Subscribe to remote published users
    client.on('user-published', async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (onUserPublished) onUserPublished(user, mediaType);
      } catch (e) { console.warn('subscribe failed', e); }
    });

    client.on('user-unpublished', (user) => {
      // nothing expensive here; consumer can handle removing streams
      if (onUserPublished) onUserPublished(user, 'leave');
    });

    // Proactively subscribe to already-published remote users (if any)
    try {
      const remotes = Array.isArray(client.remoteUsers) ? client.remoteUsers : [];
      for (const ru of remotes) {
        if (ru && ru.hasAudio) {
          try { await client.subscribe(ru, 'audio'); if (onUserPublished) onUserPublished(ru, 'audio'); } catch (e) { console.warn('subscribe existing audio failed', e); }
        }
        if (ru && ru.hasVideo) {
          try { await client.subscribe(ru, 'video'); if (onUserPublished) onUserPublished(ru, 'video'); } catch (e) { console.warn('subscribe existing video failed', e); }
        }
      }
    } catch (e) { console.warn('proactive subscribe failed', e); }

    return { client, uid: joinedUid, localTracks };
  } catch (err) {
    console.error('Agora joinChannel failed', err);
    throw err;
  }
}

export async function leaveChannel() {
  try {
    if (client && hasJoined) {
      try { await client.unpublish(); } catch (e) {}
      try { await client.leave(); } catch (e) {}
    }
  } finally {
    try {
      if (localTracks.audioTrack) {
        localTracks.audioTrack.stop();
        localTracks.audioTrack.close();
      }
      if (localTracks.videoTrack) {
        localTracks.videoTrack.stop();
        localTracks.videoTrack.close();
      }
    } catch (e) {}
    client = null;
    localTracks = { videoTrack: null, audioTrack: null };
    hasJoined = false;
    currentChannel = null;
  }
}

export function getLocalTracks() {
  return localTracks;
}

export default {
  initAgoraClient,
  joinChannel,
  leaveChannel,
  getLocalTracks,
};
