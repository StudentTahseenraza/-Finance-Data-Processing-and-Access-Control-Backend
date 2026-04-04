require('dotenv').config();
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const FinancialRecord = require('../src/models/FinancialRecord');

async function setupProduction() {
  try {
    console.log('🔄 Starting production database setup...');
    
    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');
    
    // Create roles
    const roles = await Role.bulkCreate([
      {
        name: 'admin',
        permissions: JSON.stringify(Role.PERMISSIONS.ADMIN),
        description: 'Full system access',
        is_system: true,
      },
      {
        name: 'analyst',
        permissions: JSON.stringify(Role.PERMISSIONS.ANALYST),
        description: 'Can view and create records',
        is_system: true,
      },
      {
        name: 'viewer',
        permissions: JSON.stringify(Role.PERMISSIONS.VIEWER),
        description: 'Read-only access',
        is_system: true,
      },
    ]);
    console.log('✅ Roles created');
    
    // Get role IDs
    const adminRole = roles.find(r => r.name === 'admin');
    const analystRole = roles.find(r => r.name === 'analyst');
    const viewerRole = roles.find(r => r.name === 'viewer');
    
    // Create admin user
    await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@finance.com',
      password_hash: process.env.ADMIN_PASSWORD || 'Admin@123456',
      full_name: process.env.ADMIN_NAME || 'System Administrator',
      role_id: adminRole.id,
      status: 'active',
    });
    console.log('✅ Admin user created');
    
    // Create analyst user
    await User.create({
      email: 'analyst@finance.com',
      password_hash: 'Analyst@123456',
      full_name: 'Financial Analyst',
      role_id: analystRole.id,
      status: 'active',
    });
    console.log('✅ Analyst user created');
    
    // Create viewer user
    await User.create({
      email: 'viewer@finance.com',
      password_hash: 'Viewer@123456',
      full_name: 'Dashboard Viewer',
      role_id: viewerRole.id,
      status: 'active',
    });
    console.log('✅ Viewer user created');
    
    console.log('🎉 Production database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupProduction();