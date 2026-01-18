// Example Integration File
// Add this to your backend/server.js or backend/app.js

// ============================================
// EXAMPLE 1: Express App Integration
// ============================================

// At the top with other requires:
const pastPapersRoutes = require('./routes/pastPapersDownloaderRoutes');

// Later, register routes (keep order - put after other elib routes if they exist):
app.use('/api/elib', require('./routes/booksRoutes'));        // existing
app.use('/api/elib/bulk-upload', require('./routes/bulkUploadRoutes')); // existing
// ADD THIS LINE:
app.use('/api/elib/pastpapers', pastPapersRoutes);             // NEW

// ============================================
// EXAMPLE 2: With Middleware
// ============================================

// If you have authentication middleware:
const auth = require('./middleware/auth');

// Register with auth:
app.use('/api/elib/pastpapers', auth.optional, pastPapersRoutes);

// Or require authentication:
app.use('/api/elib/pastpapers', auth.required, pastPapersRoutes);

// ============================================
// EXAMPLE 3: Complete Server Setup
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes - elib APIs
const booksRoutes = require('./routes/booksRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const pastPapersRoutes = require('./routes/pastPapersDownloaderRoutes');

app.use('/api/elib', booksRoutes);
app.use('/api/elib/bulk-upload', bulkUploadRoutes);
app.use('/api/elib/pastpapers', pastPapersRoutes);  // <-- ADD THIS

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PastPapers Downloader available at http://localhost:${PORT}/api/elib/pastpapers`);
});

// ============================================
// EXAMPLE 4: Docker/Production Setup
// ============================================

// Add to your package.json:
/*
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "axios": "^1.4.0",
    "cheerio": "^1.0.0-rc.12",
    "uuid": "^9.0.0"
  }
}
*/

// Create storage directory on startup:
const fs = require('fs');
const downloadDir = path.join(__dirname, '../storage/pastpapers');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
  console.log('Created pastpapers storage directory');
}

// ============================================
// EXAMPLE 5: Testing the API
// ============================================

// Test schools endpoint:
/*
curl http://localhost:5000/api/elib/pastpapers/schools

Expected response:
{
  "ok": true,
  "schools": [
    {
      "id": "4384",
      "name": "School of Agriculture And Enterprise Development",
      "url": "/handle/123456789/4384",
      "paperCount": 327,
      "type": "community"
    },
    ...
  ],
  "count": 18
}
*/

// Test bulk download:
/*
curl -X POST http://localhost:5000/api/elib/pastpapers/bulk-download \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "4384",
    "schoolName": "School of Agriculture And Enterprise Development",
    "userId": "user-123"
  }'

Expected response:
{
  "ok": true,
  "process": {
    "id": "UUID-HERE",
    "schoolId": "4384",
    "schoolName": "School of Agriculture And Enterprise Development",
    "status": "running",
    ...
  }
}
*/

// ============================================
// EXAMPLE 6: Environment Variables (Optional)
// ============================================

// Create .env file:
/*
DSPACE_URL=https://pastpapers.ku.ac.ke
PASTPAPERS_DIR=storage/pastpapers
DOWNLOAD_DELAY=500
API_PORT=5000
*/

// Then in service:
/*
const DSPACE_BASE_URL = process.env.DSPACE_URL || 'https://pastpapers.ku.ac.ke';
const DOWNLOAD_DIR = path.join(__dirname, '../../', process.env.PASTPAPERS_DIR || 'storage/pastpapers');
const DOWNLOAD_DELAY = parseInt(process.env.DOWNLOAD_DELAY) || 500;
*/

// ============================================
// EXAMPLE 7: Monitoring & Logging
// ============================================

const pastPapersService = require('./services/pastPapersDownloaderService');

// Check active downloads periodically
setInterval(() => {
  const processes = pastPapersService.getAllProcesses();
  const active = processes.filter(p => p.status === 'running');
  
  if (active.length > 0) {
    console.log(`[PastPapers] ${active.length} downloads in progress`);
    active.forEach(p => {
      const progress = Math.round((p.stats.processed / p.stats.total) * 100) || 0;
      console.log(`  - ${p.schoolName}: ${progress}%`);
    });
  }
}, 30000);  // Every 30 seconds

// ============================================
// EXAMPLE 8: Database Integration
// ============================================

// If using MongoDB:
/*
const { MongoClient } = require('mongodb');

let db;
MongoClient.connect(process.env.MONGODB_URI, (err, client) => {
  if (err) throw err;
  db = client.db('somalux');
  
  // Create indexes
  db.collection('downloadProcesses').createIndex({ userId: 1 });
  db.collection('downloadProcesses').createIndex({ createdAt: 1 });
  
  console.log('MongoDB connected');
});

// In pastPapersDownloaderService.js, add:
async getAllProcesses(userId = null) {
  const query = userId ? { userId } : {};
  return await db.collection('downloadProcesses')
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}
*/

// If using PostgreSQL:
/*
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// In pastPapersDownloaderService.js:
async getAllProcesses(userId = null) {
  let query = 'SELECT * FROM download_processes';
  let params = [];
  
  if (userId) {
    query += ' WHERE user_id = $1';
    params.push(userId);
  }
  
  query += ' ORDER BY start_time DESC';
  const result = await pool.query(query, params);
  return result.rows;
}
*/

// ============================================
// EXAMPLE 9: Rate Limiting (Optional)
// ============================================

const rateLimit = require('express-rate-limit');

const pastPapersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 requests per window
  message: 'Too many downloads initiated, please try again later'
});

// Apply to bulk-download endpoint:
app.post('/api/elib/pastpapers/bulk-download', pastPapersLimiter, (req, res) => {
  // handler
});

// ============================================
// EXAMPLE 10: Health Check Endpoint
// ============================================

app.get('/api/elib/pastpapers/health', (req, res) => {
  const processes = pastPapersService.getAllProcesses();
  const active = processes.filter(p => p.status === 'running');
  
  res.json({
    ok: true,
    status: 'healthy',
    activeDownloads: active.length,
    totalProcesses: processes.length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date()
  });
});

// Test health:
/*
curl http://localhost:5000/api/elib/pastpapers/health
*/

module.exports = { app };
