// ChatMe Backend Integration Module
// Handles WebSocket, FCM, and real-time messaging for ChatMe

import { WebSocketServer } from "ws";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin SDK for ChatMe (separate from Supabase)
let firebaseAdmin = null;
let db = null;

export function initializeChatMeFirebase() {
  try {
    // Try to load ChatMe Firebase credentials
    const credentialPath = path.join(__dirname, 'chatme', 'paltechproject-firebase-adminsdk-fbsvc-bd9fcaae72.json');
    
    const serviceAccount = JSON.parse(readFileSync(credentialPath, 'utf8'));
    
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    }, 'chatme'); // Use unique app name to avoid conflicts
    
    db = admin.firestore(firebaseAdmin);
    console.log('✅ ChatMe Firebase initialized successfully');
    return { success: true, admin: firebaseAdmin };
  } catch (error) {
    console.warn('⚠️  ChatMe Firebase initialization failed:', error.message);
    console.warn('   ChatMe real-time messaging will be unavailable');
    return { success: false, admin: null };
  }
}

// WebSocket state management
const userChannels = new Map(); // userId -> Set of ws connections
const clients = new Map(); // chatId -> Map<userId, ws>
const onlineUsers = new Map(); // chatId -> Set<userId>
const lastMessageTimestamps = new Map(); // userId -> lastKnownTimestamp
const userChatSessions = new Map(); // userId_chatId -> ws (track joined sessions)
const messageStats = new Map(); // Track only ACTUAL sent/received messages

// Message counter - only for actual sent messages
function countMessage(userId, chatId, direction) {
  if (!messageStats.has(chatId)) {
    messageStats.set(chatId, { sent: new Set(), received: new Set() });
  }
  const stats = messageStats.get(chatId);
  if (direction === 'sent') {
    stats.sent.add(userId);
  } else if (direction === 'received') {
    stats.received.add(userId);
  }
}

// Setup WebSocket server for ChatMe
export function setupChatMeWebSocket(wss) {
  if (!wss || !db) {
    console.warn('⚠️  WebSocket or Firebase not available for ChatMe');
    return;
  }

  console.log('🔌 Setting up ChatMe WebSocket...');

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket client connected for ChatMe");
    let currentChatId = null;
    let currentUserId = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, chatId, userId } = message;

        switch (type) {
          case "join_user":
            if (!userId) {
              console.error("❌ join_user missing userId");
              return;
            }
            if (!userChannels.has(userId)) userChannels.set(userId, new Set());
            userChannels.get(userId).add(ws);
            ws.userId = userId;
            console.log(`👤 User channel joined: ${userId}`);
            break;

          case "join":
            if (!chatId || !userId) {
              console.error("❌ join invalid: missing chatId/userId");
              return;
            }
            
            // Check if this user is already joined to this specific chat
            const sessionKey = `${userId}_${chatId}`;
            if (userChatSessions.has(sessionKey)) {
              // Silently skip duplicate joins - frontend may send multiple join messages
              return;
            }
            
            currentChatId = chatId;
            currentUserId = userId;
            if (!clients.has(chatId)) {
              clients.set(chatId, new Map());
              onlineUsers.set(chatId, new Set());
            }
            clients.get(chatId).set(userId, ws);
            onlineUsers.get(chatId).add(userId);
            ws.userId = userId;
            ws.userName = message.userName || userId;
            userChatSessions.set(sessionKey, ws); // Mark as joined

            console.log(`👥 User ${userId} joined ${chatId}`);

            const otherOnline = Array.from(onlineUsers.get(chatId)).filter(u => u !== userId);
            ws.send(JSON.stringify({ type: "users_online", data: otherOnline }));

            // DO NOT fetch recent messages automatically - prevents loops
            // Client can request with 'get_messages' type if needed
            lastMessageTimestamps.set(userId, Date.now());

            clients.get(chatId).forEach((clientWs, otherUserId) => {
              if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({ 
                  type: "user_online", 
                  data: { userId, userName: ws.userName } 
                }));
              }
            });
            break;

          case "leave":
            if (!chatId || !userId) return;
            let leaveSessionKey = `${userId}_${chatId}`;
            userChatSessions.delete(leaveSessionKey); // Remove session tracking
            
            const room = clients.get(chatId);
            if (room) {
              room.delete(userId);
              onlineUsers.get(chatId)?.delete(userId);
              room.forEach((clientWs, otherUserId) => {
                if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ 
                    type: "user_offline", 
                    data: { userId, userName: ws.userName } 
                  }));
                }
              });
              if (room.size === 0) {
                clients.delete(chatId);
                onlineUsers.delete(chatId);
              }
            }
            break;

          case "typing_start":
            if (!chatId || !userId) return;
            const { userName: typingUserName } = message;
            clients.get(chatId)?.forEach((clientWs, otherUserId) => {
              if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({ 
                  type: "typing_start", 
                  data: { 
                    userId, 
                    userName: typingUserName || ws.userName || userId,
                    chatId
                  } 
                }));
              }
            });
            break;

          case "typing_stop":
            if (!chatId || !userId) return;
            clients.get(chatId)?.forEach((clientWs, otherUserId) => {
              if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({ 
                  type: "typing_stop", 
                  data: { userId, userName: ws.userName || userId, chatId } 
                }));
              }
            });
            break;

          case "messages_read":
            if (!chatId || !userId) return;
            const { messageIds } = message;
            clients.get(chatId)?.forEach((clientWs, otherUserId) => {
              if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({ 
                  type: "messages_read", 
                  data: { userId, messageIds, chatId } 
                }));
              }
            });
            break;

          case "get_messages":
            // Client explicitly requests recent messages
            if (!chatId || !userId) {
              console.warn('get_messages missing chatId or userId');
              return;
            }
            try {
              const { since } = message;
              const lastTs = since || lastMessageTimestamps.get(userId) || 0;
              await fetchRecentMessages(chatId, ws, lastTs, message.isGroup);
              console.log(`📜 Sent recent messages for ${chatId} on explicit request`);
            } catch (err) {
              console.error('Error fetching messages:', err);
            }
            break;

          case "send_message":
            // Handle incoming messages from user
            // ONLY broadcast to OTHER users - sender should NOT receive echo
            if (!chatId || !userId) {
              console.warn('send_message missing chatId or userId');
              return;
            }
            try {
              const { messageId, text, messageType, timestamp, selectedOptions } = message;
              
              if (!text && !selectedOptions) {
                console.warn('send_message missing text or selectedOptions');
                return;
              }

              // Count this as a SENT message for the sender
              countMessage(userId, chatId, 'sent');

              // Broadcast ONLY to other users in the chat (never send back to sender)
              const room = clients.get(chatId);
              if (room) {
                let broadcastCount = 0;
                room.forEach((clientWs, otherUserId) => {
                  // CRITICAL: Only send to OTHER users, NOT the sender
                  if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                    clientWs.send(JSON.stringify({
                      type: 'new_message',
                      data: {
                        id: messageId,
                        chatId,
                        userId,
                        userName: ws.userName || userId,
                        text,
                        messageType,
                        timestamp,
                        selectedOptions,
                        status: 'delivered'
                      }
                    }));
                    // Count as received for each recipient
                    countMessage(otherUserId, chatId, 'received');
                    broadcastCount++;
                  }
                });
                const stats = messageStats.get(chatId);
                console.log(`💬 Message from ${userId} in ${chatId}: sent=1, received=${broadcastCount}, unique_senders=${stats.sent.size}, unique_receivers=${stats.received.size}`);
              } else {
                console.log(`💬 Message from ${userId} for ${chatId} but no active room`);
              }
            } catch (err) {
              console.error('Error handling send_message:', err);
            }
            break;

          case "poll_voted":
            if (!chatId || !userId) {
              console.warn('poll_voted missing chatId or userId');
              return;
            }
            try {
              const { messageId: pvMessageId, selectedOptions, updatedPoll } = message;
              const room = clients.get(chatId);
              if (room) {
                room.forEach((clientWs, otherUserId) => {
                  if (otherUserId !== userId && clientWs.readyState === clientWs.OPEN) {
                    clientWs.send(JSON.stringify({
                      type: 'poll_voted',
                      data: {
                        chatId,
                        userId,
                        userName: message.userName || ws.userName || userId,
                        messageId: pvMessageId,
                        selectedOptions,
                        updatedPoll
                      }
                    }));
                  }
                });
              }
            } catch (err) {
              console.error('Error broadcasting poll_voted:', err);
            }
            break;

          default:
            console.warn(`❓ Unknown message type: ${type}`);
        }
      } catch (error) {
        console.error("❌ WS parse error:", error);
      }
    });

    ws.on("close", () => {
      // Clean up ALL sessions for this WebSocket (not just current chat)
      for (let [key, wsRef] of userChatSessions.entries()) {
        if (wsRef === ws) {
          userChatSessions.delete(key);
        }
      }
      
      if (currentChatId && currentUserId) {
        const room = clients.get(currentChatId);
        if (room) {
          room.delete(currentUserId);
          onlineUsers.get(currentChatId)?.delete(currentUserId);
          room.forEach((clientWs) => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ 
                type: "user_offline", 
                data: { userId: currentUserId } 
              }));
            }
          });
          if (room.size === 0) {
            clients.delete(currentChatId);
            onlineUsers.delete(currentChatId);
          }
        }
      }
      if (ws.userId && userChannels.has(ws.userId)) {
        const set = userChannels.get(ws.userId);
        set.delete(ws);
        if (set.size === 0) userChannels.delete(ws.userId);
      }
      console.log("🔌 WS disconnected");
    });
  });

  console.log('✅ ChatMe WebSocket server setup complete');
}

// Helper function to fetch recent messages
async function fetchRecentMessages(chatId, ws, since = 0, isGroup = false) {
  if (!db) return;

  try {
    const sinceTimestamp = admin.firestore.Timestamp.fromDate(new Date(since));
    const collection = isGroup ? "groups" : "chats";
    
    const q = db.collection(collection).doc(chatId).collection("messages")
      .orderBy("timestamp", "desc")
      .limit(100)
      .where("timestamp", ">", sinceTimestamp);

    const snapshot = await q.get();
    const recent = snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data(), 
      timestamp: doc.data().timestamp.toDate(),
      groupId: isGroup ? chatId : undefined,
      chatId: chatId
    }));

    ws.send(JSON.stringify({ type: "recent_messages", data: recent }));
    console.log(`📜 Sent ${recent.length} recent messages to ${chatId}`);
  } catch (error) {
    console.error("❌ Error fetching recent messages:", error);
  }
}

// FCM subscription management
export function setupChatMeFCMRoutes(app, admin) {
  // Subscribe to topic
  app.post('/api/chatme/subscribe-topic', async (req, res) => {
    const { topic, token } = req.body || {};
    if (!topic || !token) return res.status(400).send('Missing topic or token');
    
    try {
      // Use main Firebase admin instance if available
      await admin.messaging().subscribeToTopic(token, topic);
      res.json({ success: true });
    } catch (e) {
      console.error('subscribe-topic error', e);
      res.status(500).send(e.message || 'subscribe error');
    }
  });

  // Unsubscribe from topic
  app.post('/api/chatme/unsubscribe-topic', async (req, res) => {
    const { topic, token } = req.body || {};
    if (!topic || !token) return res.status(400).send('Missing topic or token');
    
    try {
      await admin.messaging().unsubscribeFromTopic(token, topic);
      res.json({ success: true });
    } catch (e) {
      console.error('unsubscribe-topic error', e);
      res.status(500).send(e.message || 'unsubscribe error');
    }
  });
}

// Export for use in main backend
export { userChannels, clients, onlineUsers, firebaseAdmin };

