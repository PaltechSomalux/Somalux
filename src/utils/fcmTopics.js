// src/utils/fcmTopics.js
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';

// Format group ID into a valid FCM topic
export const getGroupTopic = (groupId) => `group_${groupId.replace(/[^a-zA-Z0-9-]/g, '_')}`;

// Subscribe to group notifications
export const subscribeToGroupTopic = async (groupId) => {
  try {
    const token = await getToken(messaging);
    if (!token) {
      console.log('❌ No FCM token available for group subscription');
      return;
    }

    const topic = getGroupTopic(groupId);
    const response = await fetch('/subscribe-topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, topic }),
    });

    if (!response.ok) throw new Error('Failed to subscribe to group topic');
    console.log(`✅ Subscribed to group topic: ${topic}`);
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