// Initialize local database fallback by default
global.useLocalDB = true;

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Connect to MongoDB Database (will set global.useLocalDB = false on success)
connectDB();

// Middleware
app.use(cors()); // Allow cross-origin requests from React frontend
app.use(express.json()); // Body parser for JSON payloads

// Logging middleware for development
app.use((req, res, next) => {
  const dbStatus = global.useLocalDB ? 'Local JSON File DB' : 'MongoDB Atlas / Local';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} (${dbStatus})`);
  next();
});

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/docs', require('./routes/docs')); // Renders publication-grade API Docs!

// Root Endpoint - Status & Welcome info
app.get('/', (req, res) => {
  res.json({
    name: 'SafeCompanion API',
    description: 'AI-Powered Women Safety Smart Companion (MERN Backend)',
    status: 'Online',
    database: global.useLocalDB ? 'Local JSON Fallback' : 'MongoDB (Live)',
    docsUrl: 'http://localhost:5000/api/docs', // Connects directly!
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error Context:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error occurred',
    message: err.message
  });
});

// Configure PORT
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 SafeCompanion Backend server is running in development mode on port ${PORT}`);
  console.log(`🔗 Local status check: http://localhost:${PORT}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api/docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});
