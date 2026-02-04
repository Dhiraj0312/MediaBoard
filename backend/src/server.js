const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import middleware
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { 
  apiLimiter, 
  authLimiter, 
  uploadLimiter, 
  heartbeatLimiter, 
  dashboardLimiter,
  clearRateLimitCache
} = require('./middleware/rateLimiter');
const { requestMonitoring, errorMonitoring } = require('./middleware/monitoring');

// Import routes
const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');
const screenRoutes = require('./routes/screens');
const playlistRoutes = require('./routes/playlists');
const assignmentRoutes = require('./routes/assignments');
const playerRoutes = require('./routes/player');
const dashboardRoutes = require('./routes/dashboard');
const monitoringRoutes = require('./routes/monitoring');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      // Allow player to access API from same origin
      `http://localhost:${PORT}`,
      `http://127.0.0.1:${PORT}`
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting middleware
app.use('/api/', apiLimiter);

// Request monitoring middleware (before routes)
app.use(requestMonitoring);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve player static files
app.use('/player', express.static(path.join(__dirname, '../../player')));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({
      error: 'Request timeout',
      code: 'REQUEST_TIMEOUT'
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'digital-signage-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// EMERGENCY: Clear rate limit cache endpoint
app.post('/api/clear-cache', (req, res) => {
  try {
    clearRateLimitCache();
    
    // Also temporarily disable rate limiting for 5 minutes
    process.env.DISABLE_RATE_LIMITING = 'true';
    setTimeout(() => {
      delete process.env.DISABLE_RATE_LIMITING;
      console.log('🔄 Rate limiting re-enabled after 5 minutes');
    }, 5 * 60 * 1000);
    
    res.json({ 
      success: true, 
      message: 'Rate limit cache cleared successfully and rate limiting temporarily disabled',
      timestamp: new Date().toISOString(),
      disabledFor: '5 minutes'
    });
    
    console.log('🧹 Rate limit cache cleared via API call');
    console.log('🚫 Rate limiting temporarily disabled for 5 minutes');
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear cache',
      error: error.message 
    });
  }
});

// Player application endpoint
app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, '../../player/index.html'));
});

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/media', uploadLimiter, authenticateToken, mediaRoutes);
app.use('/api/screens', authenticateToken, screenRoutes);
app.use('/api/playlists', authenticateToken, playlistRoutes);
app.use('/api/assignments', authenticateToken, assignmentRoutes);
app.use('/api/player', heartbeatLimiter, playerRoutes); // No auth required for player endpoints
app.use('/api/dashboard', dashboardLimiter, authenticateToken, dashboardRoutes);
app.use('/api/monitoring', authenticateToken, monitoringRoutes); // Monitoring endpoints

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Digital Signage Platform API',
    version: '1.0.0',
    description: 'Backend API for digital signage management system',
    endpoints: {
      health: '/health',
      player: '/player',
      auth: '/api/auth',
      media: '/api/media',
      screens: '/api/screens',
      playlists: '/api/playlists',
      assignments: '/api/assignments',
      playerApi: '/api/player',
      dashboard: '/api/dashboard',
      monitoring: '/api/monitoring'
    }
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Error monitoring middleware (before error handler)
app.use(errorMonitoring);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  // EMERGENCY: Clear rate limit cache on startup
  clearRateLimitCache();
  
  // Set development environment variable if not set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    console.log('🔧 NODE_ENV set to development');
  }
  
  // Disable rate limiting for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🚫 Rate limiting disabled for development environment');
  }
  
  console.log(`🚀 Digital Signage API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎮 Player app: http://localhost:${PORT}/player`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
  console.log(`🎬 Media endpoint: http://localhost:${PORT}/api/media`);
  console.log(`📺 Screens endpoint: http://localhost:${PORT}/api/screens`);
  console.log(`📋 Playlists endpoint: http://localhost:${PORT}/api/playlists`);
  console.log(`🎯 Assignments endpoint: http://localhost:${PORT}/api/assignments`);
  console.log(`🌐 Player endpoint: http://localhost:${PORT}/api/player`);
  console.log(`📊 Dashboard endpoint: http://localhost:${PORT}/api/dashboard`);
  console.log(`🔍 Monitoring endpoint: http://localhost:${PORT}/api/monitoring`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;