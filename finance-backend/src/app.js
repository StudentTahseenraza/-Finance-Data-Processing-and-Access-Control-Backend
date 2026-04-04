require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Import database
const { connectDB } = require('./config/database');
const redisClient = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';

// Trust proxy for Render
app.set('trust proxy', 1);

// CORS configuration for production
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Database connection
connectDB();

// Redis connection (optional)
redisClient.connect().catch(err => {
  console.warn('Redis connection failed, continuing without cache');
});

// ============ DOCUMENTATION ROUTES ============

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance Dashboard API - Production',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    urls: [{
      url: '/api-docs.json',
      name: 'Production API'
    }]
  }
}));

// OpenAPI JSON spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(swaggerSpec);
});

// Postman Collection endpoint
app.get('/api/postman-collection.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, '../Postman_Collection.json'));
});

// HR Review Guide
app.get('/hr-review', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/hr-review-guide.html'));
});

// API Testing Guide
app.get('/guide', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/api-guide.html'));
});

// ============ API ROUTES ============

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recordRoutes = require('./routes/records');
const dashboardRoutes = require('./routes/dashboard');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: redisClient.isConnected ? 'connected' : 'disabled'
    },
    documentation: {
      swagger: `${req.protocol}://${req.get('host')}/api-docs`,
      guide: `${req.protocol}://${req.get('host')}/hr-review`,
      postman: `${req.protocol}://${req.get('host')}/api/postman-collection.json`
    }
  });
});

// API routes
app.use(`${API_PREFIX}/${API_VERSION}/auth`, authRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/users`, userRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/records`, recordRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/dashboard`, dashboardRoutes);

// Root route - redirect to HR review guide
app.get('/', (req, res) => {
  res.redirect('/hr-review');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.url} not found`,
    documentation: '/api-docs'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    code: err.errorCode || 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`📖 HR Guide: http://localhost:${PORT}/hr-review`);
  console.log(`📮 Postman: http://localhost:${PORT}/api/postman-collection.json`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    if (redisClient.client) {
      await redisClient.client.quit();
    }
    process.exit(0);
  });
});

module.exports = app;