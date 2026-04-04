// utils/fcmTopics.js
// Client helpers to subscribe/unsubscribe the current FCM token to a group topic via your backend

import { API_BASE } from '../../../config';

const topicName = (groupId) => `group_${groupId}`;

export async function subscribeToGroupTopic(groupId, token) {
  if (!groupId || !token) return { ok: false, error: 'Missing groupId or token' };
  try {
    const res = await fetch(`${API_BASE}/subscribe-topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topicName(groupId), token })
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || 'Failed to subscribe' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function unsubscribeFromGroupTopic(groupId, token) {
  if (!groupId || !token) return { ok: false, error: 'Missing groupId or token' };
  try {
    const res = await fetch(`${API_BASE}/unsubscribe-topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topicName(groupId), token })
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || 'Failed to unsubscribe' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}
