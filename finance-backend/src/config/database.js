const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize;

// Use DATABASE_URL or individual variables
if (process.env.DATABASE_URL) {
  console.log('✅ Using DATABASE_URL connection');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
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
      define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Drop all tables and recreate to fix constraint issues
    // This will reset your database - run this once
    if (process.env.RESET_DATABASE === 'true') {
      console.log('⚠️ Resetting database...');
      await sequelize.drop();
      console.log('✅ Database dropped');
    }
    
    // Sync models without altering (safer for production)
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

module.exports = { sequelize, connectDB };