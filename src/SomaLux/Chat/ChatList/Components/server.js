const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chatapp', { useNewUrlParser: true, useUnifiedTopology: true });

// Message schema
const messageSchema = new mongoose.Schema({
  chatId: String,
  id: String,
  text: String,
  sender: String,
  senderName: String,
  timestamp: Date,
  status: String,
  replyTo: String,
});
const Message = mongoose.model('Message', messageSchema);

// Chat schema
const chatSchema = new mongoose.Schema({
  id: String,
  name: String,
  profilePicture: String,
  lastMessage: String,
  time: String,
  unreadCount: Number,
  isOnline: Boolean,
  lastSeen: Date,
  isMuted: Boolean,
  isPinned: Boolean,
  isArchived: Boolean,
});
const Chat = mongoose.model('Chat', chatSchema);

app.use(express.json());

// Middleware for JWT authentication
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, 'your-secret-key'); // Replace with your JWT secret
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// API Endpoints
app.get('/api/chats', authMiddleware, async (req, res) => {
  const chats = await Chat.find({ $or: [{ user1: req.userId }, { user2: req.userId }] });
  res.json(chats);
});

app.get('/api/chats/:chatId/messages', authMiddleware, async (req, res) => {
  const messages = await Message.find({ chatId: req.get('chatId') });
  res.json(messages);
});

app.post('/api/messages/voice', authMiddleware, async (req, res) => {
  // Handle file upload (use multer for file handling)
  const message = new Message({
    chatId: req.body.chatId,
    id: `msg-${Date.now()}`,
    sender: req.body.sender,
    type: 'voice',
    url: '/path/to/voice/file', // Save file and return URL
    timestamp: new Date(),
    status: 'sent'
  });
  await message.save();
  res.json(message);
});

app.post('/api/messages/file', authMiddleware, async (req, res) => {
  // Handle file upload
  const message = new Message({
    chatId: req.body.chatId,
    id: `msg-${Date.now()}`,
    sender: req.body.sender,
    type: 'file',
    url: '/path/to/file', // Save file and return URL
    timestamp: new Date(),
    status: 'sent'
  });
  await message.save();
  res.json(message);
});

app.post('/api/messages/:messageId/react', authMiddleware, async (req, res) => {
  const { reaction } = req.body;
  const message = await Message.findOneAndUpdate(
    { id: req.params.messageId },
    { $push: { reactions: reaction } },
    { new: true }
  );
  res.json(message);
});

app.delete('/api/messages/:messageId', authMiddleware, async (req, res) => {
  await Message.deleteOne({ id: req.params.messageId, sender: req.userId });
  res.json({ success: true });
});

app.delete('/api/messages/:messageId/delete-for-everyone', authMiddleware, async (req, res) => {
  await Message.deleteOne({ id: req.params.messageId });
  res.json({ success: true });
});

app.post('/api/messages/:messageId/pin', authMiddleware, async (req, res) => {
  const { pinned } = req.body;
  const message = await Message.findOneAndUpdate(
    { id: req.params.messageId },
    { pinned },
    { new: true }
  );
  res.json(message);
});

app.post('/api/messages/:messageId/report', authMiddleware, async (req, res) => {
  const { reason } = req.body;
  const message = await Message.findOneAndUpdate(
    { id: req.params.messageId },
    { reported: true, reportReason: reason },
    { new: true }
  );
  res.json(message);
});

app.delete('/api/chats/:chatId/clear', authMiddleware, async (req, res) => {
  await Message.deleteMany({ chatId: req.params.chatId });
  res.json({ success: true });
});

app.get('/api/chats/:chatId/export', authMiddleware, async (req, res) => {
  const messages = await Message.find({ chatId: req.params.chatId });
  const text = messages.map(m => `${m.senderName}: ${m.text || m.type}`).join('\n');
  res.set('Content-Type', 'text/plain');
  res.send(text);
});

app.patch('/api/chats/:chatId', authMiddleware, async (req, res) => {
  const chat = await Chat.findOneAndUpdate({ id: req.params.chatId }, req.body, { new: true });
  res.json(chat);
});

app.delete('/api/chats/:chatId', authMiddleware, async (req, res) => {
  await Chat.deleteOne({ id: req.params.chatId });
  await Message.deleteMany({ chatId: req.params.chatId });
  res.json({ success: true });
});

// Socket.IO
io.on('connection', (socket) => {
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('sendMessage', async ({ chatId, message }) => {
    const savedMessage = new Message({ ...message, chatId });
    await savedMessage.save();
    io.to(chatId).emit('newMessage', { chatId, message: savedMessage });
    // Update chat metadata
    await Chat.findOneAndUpdate(
      { id: chatId },
      {
        lastMessage: message.text || 'Attachment',
        time: new Date().toISOString(),
        $inc: { unreadCount: 1 }
      }
    );
  });

  socket.on('typing', ({ chatId, userId }) => {
    socket.to(chatId).emit('typing', { chatId, userId });
  });

  socket.on('readMessages', async ({ chatId, userId }) => {
    await Message.updateMany({ chatId, status: 'sent' }, { status: 'read' });
    io.to(chatId).emit('readMessages', { chatId, userId });
  });

  socket.on('deleteMessage', async ({ chatId, messageId }) => {
    await Message.deleteOne({ id: messageId });
    io.to(chatId).emit('messageDeleted', { chatId, messageId });
  });

  socket.on('onlineStatus', ({ userId, isOnline }) => {
    io.emit('onlineStatus', { userId, isOnline });
  });
});

server.listen(3001, () => console.log('Server running on port 3001'));