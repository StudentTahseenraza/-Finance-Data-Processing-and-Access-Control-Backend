const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    retry: {
      max: 3,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synced');
    }
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };