const express = require('express');
const cors = require('cors');
const { initializeDb, seedData } = require('./db');
const authMiddleware = require('./middleware/auth');
const notificationRoutes = require('./routes/notifications');
const triggerRoutes = require('./routes/triggers');

const app = express();
const PORT = process.env.PORT || 4000;

// Load environment variables for local development
require('dotenv').config();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply auth middleware to all API routes
app.use('/notifications', authMiddleware, notificationRoutes);
app.use('/triggers', authMiddleware, triggerRoutes);

// Static file serving removed as frontend will be hosted on Vercel

// Initialize database (async for sql.js), seed data, and start server
async function start() {
  await initializeDb();
  if (process.env.NODE_ENV !== 'production') {
    await seedData();
  }

  app.listen(PORT, () => {
    console.log(`\n🔔 Notification server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app; // Export for testing
