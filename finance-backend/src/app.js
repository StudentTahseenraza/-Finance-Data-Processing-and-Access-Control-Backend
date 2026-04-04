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
const { sequelize, connectDB } = require('./config/database');
const redisClient = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';

// Trust proxy for Render
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: [
    'https://finance-data-processing-and-access-5h1o.onrender.com',
    'https://finance-data-processing-and-access-ecru.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://*.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
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

// ============ DATABASE INITIALIZATION ============
let dbConnected = false;

// Initialize database and models
(async () => {
  try {
    // Connect to database
    dbConnected = await connectDB();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your configuration.');
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️ Continuing without database for now...');
      } else {
        process.exit(1);
      }
    }
    
    // Load model associations
    try {
      require('./models/index');
      console.log('✅ Model associations loaded');
    } catch (error) {
      console.error('❌ Failed to load associations:', error.message);
    }
    
    // Check if roles exist, if not create them
    if (dbConnected) {
      const Role = require('./models/Role');
      const User = require('./models/User');
      
      const roleCount = await Role.count();
      
      if (roleCount === 0) {
        console.log('📦 Seeding initial data...');
        
        // Create roles
        const roles = await Role.bulkCreate([
          {
            name: 'admin',
            permissions: Role.PERMISSIONS.ADMIN,
            description: 'Full system access',
            is_system: true,
          },
          {
            name: 'analyst',
            permissions: Role.PERMISSIONS.ANALYST,
            description: 'Can view and create records',
            is_system: true,
          },
          {
            name: 'viewer',
            permissions: Role.PERMISSIONS.VIEWER,
            description: 'Read-only access',
            is_system: true,
          },
        ]);
        console.log('✅ Roles created');
        
        // Create admin user
        const adminRole = roles.find(r => r.name === 'admin');
        await User.create({
          email: 'admin@finance.com',
          password_hash: 'Admin@123456',
          full_name: 'System Administrator',
          role_id: adminRole.id,
          status: 'active',
        });
        console.log('✅ Admin user created');
        
        // Create analyst user
        const analystRole = roles.find(r => r.name === 'analyst');
        await User.create({
          email: 'analyst@finance.com',
          password_hash: 'Analyst@123456',
          full_name: 'Financial Analyst',
          role_id: analystRole.id,
          status: 'active',
        });
        console.log('✅ Analyst user created');
        
        // Create viewer user
        const viewerRole = roles.find(r => r.name === 'viewer');
        await User.create({
          email: 'viewer@finance.com',
          password_hash: 'Viewer@123456',
          full_name: 'Dashboard Viewer',
          role_id: viewerRole.id,
          status: 'active',
        });
        console.log('✅ Viewer user created');
        
        console.log('🎉 Database seeding completed!');
      } else {
        console.log('✅ Database already has data');
      }
    }
  } catch (error) {
    console.error('❌ Initialization error:', error.message);
  }
})();

// Redis connection (optional)
redisClient.connect().catch(err => {
  console.warn('Redis connection failed, continuing without cache');
});

// ============ SETUP ENDPOINT ============
app.get('/api/setup', async (req, res) => {
  try {
    const Role = require('./models/Role');
    const User = require('./models/User');
    
    // Force sync
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');
    
    // Create roles
    const roles = await Role.bulkCreate([
      {
        name: 'admin',
        permissions: Role.PERMISSIONS.ADMIN,
        description: 'Full system access',
        is_system: true,
      },
      {
        name: 'analyst',
        permissions: Role.PERMISSIONS.ANALYST,
        description: 'Can view and create records',
        is_system: true,
      },
      {
        name: 'viewer',
        permissions: Role.PERMISSIONS.VIEWER,
        description: 'Read-only access',
        is_system: true,
      },
    ]);
    
    // Create admin user
    const adminRole = roles.find(r => r.name === 'admin');
    await User.create({
      email: 'admin@finance.com',
      password_hash: 'Admin@123456',
      full_name: 'System Administrator',
      role_id: adminRole.id,
      status: 'active',
    });
    
    // Create analyst user
    const analystRole = roles.find(r => r.name === 'analyst');
    await User.create({
      email: 'analyst@finance.com',
      password_hash: 'Analyst@123456',
      full_name: 'Financial Analyst',
      role_id: analystRole.id,
      status: 'active',
    });
    
    // Create viewer user
    const viewerRole = roles.find(r => r.name === 'viewer');
    await User.create({
      email: 'viewer@finance.com',
      password_hash: 'Viewer@123456',
      full_name: 'Dashboard Viewer',
      role_id: viewerRole.id,
      status: 'active',
    });
    
    res.json({ 
      status: 'success',
      message: 'Database setup complete!',
      users: {
        admin: 'admin@finance.com / Admin@123456',
        analyst: 'analyst@finance.com / Analyst@123456',
        viewer: 'viewer@finance.com / Viewer@123456'
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ RESET DATABASE ENDPOINT ============
app.post('/api/admin/reset-db', async (req, res) => {
  try {
    const Role = require('./models/Role');
    const User = require('./models/User');
    
    // Drop all tables
    await sequelize.drop();
    console.log('Database dropped');
    
    // Recreate tables
    await sequelize.sync({ force: true });
    console.log('Tables recreated');
    
    // Create roles
    const roles = await Role.bulkCreate([
      { name: 'admin', permissions: Role.PERMISSIONS.ADMIN, description: 'Full system access', is_system: true },
      { name: 'analyst', permissions: Role.PERMISSIONS.ANALYST, description: 'Can view and create records', is_system: true },
      { name: 'viewer', permissions: Role.PERMISSIONS.VIEWER, description: 'Read-only access', is_system: true },
    ]);
    
    // Create users
    const adminRole = roles.find(r => r.name === 'admin');
    await User.create({ email: 'admin@finance.com', password_hash: 'Admin@123456', full_name: 'System Administrator', role_id: adminRole.id, status: 'active' });
    
    const analystRole = roles.find(r => r.name === 'analyst');
    await User.create({ email: 'analyst@finance.com', password_hash: 'Analyst@123456', full_name: 'Financial Analyst', role_id: analystRole.id, status: 'active' });
    
    const viewerRole = roles.find(r => r.name === 'viewer');
    await User.create({ email: 'viewer@finance.com', password_hash: 'Viewer@123456', full_name: 'Dashboard Viewer', role_id: viewerRole.id, status: 'active' });
    
    res.json({ message: 'Database reset successful! Users created.' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: error.message });
  }
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
    database: dbConnected ? 'connected' : 'disconnected',
    redis: redisClient.isConnected ? 'connected' : 'disabled',
    version: '1.0.0',
    endpoints: {
      swagger: `${req.protocol}://${req.get('host')}/api-docs`,
      guide: `${req.protocol}://${req.get('host')}/hr-review`,
      postman: `${req.protocol}://${req.get('host')}/api/postman-collection.json`,
      setup: `${req.protocol}://${req.get('host')}/api/setup`
    }
  });
});

// Debug endpoint to check database status
app.get('/debug/db-status', async (req, res) => {
  try {
    const Role = require('./models/Role');
    const User = require('./models/User');
    
    const roleCount = await Role.count();
    const userCount = await User.count();
    const users = await User.findAll({ 
      attributes: ['email', 'role_id', 'status'],
      raw: true 
    });
    
    res.json({
      database_connected: dbConnected,
      roles_count: roleCount,
      users_count: userCount,
      users: users,
      message: roleCount === 0 ? 'Database empty - run /api/setup' : 'Database has data'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
  console.error('Error:', err.message);
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    status: 'error',
    code: err.errorCode || 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
});

// Start server only if not in test mode
if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`📖 HR Guide: http://localhost:${PORT}/hr-review`);
    console.log(`🔧 Setup: http://localhost:${PORT}/api/setup`);
    console.log(`🔍 DB Status: http://localhost:${PORT}/debug/db-status\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
      console.log('HTTP server closed');
      if (redisClient.client) {
        await redisClient.client.quit();
      }
      if (sequelize) {
        await sequelize.close();
      }
      process.exit(0);
    });
  });
}

module.exports = app;