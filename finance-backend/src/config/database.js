const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize;

// Prefer DATABASE_URL if available
if (process.env.DATABASE_URL) {
  console.log('✅ Using DATABASE_URL connection');
  console.log('Database URL:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for Render
      },
    },
    logging: (msg) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(msg);
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  console.log('✅ Using individual database variables');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Please check:');
    console.error('1. DATABASE_URL or DB_NAME is correct');
    console.error('2. Database exists on Render');
    return false;
  }
};

module.exports = { sequelize, connectDB };