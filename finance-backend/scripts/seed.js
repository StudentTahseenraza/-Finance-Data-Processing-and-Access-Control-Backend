require('dotenv').config();
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const FinancialRecord = require('../src/models/FinancialRecord');
const logger = require('../src/utils/logger');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

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

    logger.info('Roles created');

    // Get role IDs
    const adminRole = roles.find(r => r.name === 'admin');
    const analystRole = roles.find(r => r.name === 'analyst');
    const viewerRole = roles.find(r => r.name === 'viewer');

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminUser = await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@finance.com',
      password_hash: adminPassword,
      full_name: process.env.ADMIN_NAME || 'System Administrator',
      role_id: adminRole.id,
      status: 'active',
    });

    logger.info('Admin user created');

    // Create analyst user
    const analystUser = await User.create({
      email: 'analyst@finance.com',
      password_hash: 'Analyst@123456',
      full_name: 'Financial Analyst',
      role_id: analystRole.id,
      status: 'active',
    });

    // Create viewer user
    const viewerUser = await User.create({
      email: 'viewer@finance.com',
      password_hash: 'Viewer@123456',
      full_name: 'Dashboard Viewer',
      role_id: viewerRole.id,
      status: 'active',
    });

    logger.info('Test users created');

    // Create sample financial records for admin
    const sampleRecords = [
      {
        user_id: adminUser.id,
        amount: 5000.00,
        type: 'income',
        category: 'Salary',
        date: new Date(),
        description: 'Monthly salary',
        tags: ['work', 'regular'],
      },
      {
        user_id: adminUser.id,
        amount: 150.00,
        type: 'expense',
        category: 'Food',
        date: new Date(),
        description: 'Grocery shopping',
        tags: ['essential'],
      },
      {
        user_id: adminUser.id,
        amount: 2000.00,
        type: 'expense',
        category: 'Rent',
        date: new Date(),
        description: 'Monthly rent',
        tags: ['essential'],
      },
      {
        user_id: adminUser.id,
        amount: 100.00,
        type: 'expense',
        category: 'Entertainment',
        date: new Date(),
        description: 'Movie tickets',
        tags: ['leisure'],
      },
      {
        user_id: adminUser.id,
        amount: 50.00,
        type: 'income',
        category: 'Freelance',
        date: new Date(),
        description: 'Small freelance project',
        tags: ['extra'],
      },
    ];

    await FinancialRecord.bulkCreate(sampleRecords);
    logger.info('Sample records created');

    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();