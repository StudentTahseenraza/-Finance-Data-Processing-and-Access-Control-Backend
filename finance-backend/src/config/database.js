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
      underscored: true, // This will map createdAt -> created_at
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
    
    // Force sync to create all tables with correct schema
    // Use { force: true } to recreate tables (only for first deployment)
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

module.exports = { sequelize, connectDB };