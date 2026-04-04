const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize;

// Function to get database URL from environment
function getDatabaseUrl() {
  // Check for DATABASE_URL first (Render provides this)
  if (process.env.DATABASE_URL) {
    console.log('✅ Using DATABASE_URL from environment');
    return process.env.DATABASE_URL;
  }
  
  // Fallback to individual variables
  if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
    console.log('✅ Using individual database variables');
    const url = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
    return url;
  }
  
  // For local development
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Using local development database');
    return 'postgresql://postgres:postgres@localhost:5432/finance_db';
  }
  
  return null;
}

const databaseUrl = getDatabaseUrl();

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.error('❌ No database configuration found in production!');
  console.error('Please set DATABASE_URL or DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
  process.exit(1);
}

// Configure Sequelize
if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: (msg) => {
      // Don't log SQL queries in production
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(msg);
      }
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false, // Required for Render PostgreSQL
      } : false,
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
    retry: {
      max: 3,
      timeout: 60000,
    },
  });
} else {
  // Local development with SQLite as fallback
  const { Sequelize: SQLiteSequelize } = require('sequelize');
  sequelize = new SQLiteSequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: (msg) => logger.debug(msg),
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    
    // Sync models only in development, not in production
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synced');
    } else if (process.env.NODE_ENV === 'production') {
      // Just log that we're connected, don't sync
      logger.info('Production database connected - running in production mode');
    }
  } catch (error) {
    logger.error('❌ Unable to connect to database:', error.message);
    
    // Log more details for debugging
    if (process.env.NODE_ENV === 'production') {
      console.error('Production database connection failed. Details:');
      console.error('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
      console.error('- DB_HOST exists:', !!process.env.DB_HOST);
      console.error('- DB_NAME exists:', !!process.env.DB_NAME);
      
      // Don't exit in production, let the app try to reconnect
      if (error.message.includes('does not exist')) {
        console.error('⚠️ Database does not exist. Please create it first.');
        console.error('   Run: node scripts/create-database.js');
      }
    }
    
    // Exit in development, keep trying in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };