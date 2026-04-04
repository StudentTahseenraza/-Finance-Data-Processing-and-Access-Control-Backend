const { sequelize } = require('../src/config/database');
const Role = require('../src/models/Role');
const User = require('../src/models/User');
const FinancialRecord = require('../src/models/FinancialRecord');
const AuditLog = require('../src/models/AuditLog');

async function forceSync() {
  console.log('🔄 Force syncing database...');
  
  try {
    // Drop all tables and recreate
    await sequelize.sync({ force: true });
    console.log('✅ Database synced with force');
    
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
    
    console.log('🎉 Database force sync completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

forceSync();