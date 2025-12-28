// src/utils/fcmTopics.js
// Firebase Cloud Messaging has been removed - use backend API instead

// Format group ID into a valid topic
export const getGroupTopic = (groupId) => `group_${groupId.replace(/[^a-zA-Z0-9-]/g, '_')}`;

// Subscribe to group notifications (via backend)
export const subscribeToGroupTopic = async (groupId) => {
  try {
    const topic = getGroupTopic(groupId);
    // TODO: Implement via backend/Supabase instead of FCM
    console.log(`📢 Group topic subscription: ${topic} (not yet implemented)`);
  } catch (error) {
    console.error('❌ Error subscribing to group topic:', error);
  }
};

// Unsubscribe from group notifications
export const unsubscribeFromGroupTopic = async (groupId) => {
  try {
    const token = await getToken(messaging);
    if (!token) {
      console.log('❌ No FCM token available for group unsubscription');
      return;
    }

    const topic = getGroupTopic(groupId);
    const response = await fetch('/unsubscribe-topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, topic }),
    });

    if (!response.ok) throw new Error('Failed to unsubscribe from group topic');
    console.log(`✅ Unsubscribed from group topic: ${topic}`);
  } catch (error) {
    console.error('❌ Error unsubscribing from group topic:', error);
  }
};