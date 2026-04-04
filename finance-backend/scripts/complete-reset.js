const { sequelize } = require('../src/config/database');
const Role = require('../src/models/Role');
const User = require('../src/models/User');
const FinancialRecord = require('../src/models/FinancialRecord');
const AuditLog = require('../src/models/AuditLog');

async function completeReset() {
  console.log('🔄 Starting complete database reset...');
  
  try {
    // Drop all tables
    await sequelize.drop();
    console.log('✅ All tables dropped');
    
    // Sync all models (creates tables)
    await sequelize.sync({ force: true });
    console.log('✅ All tables recreated');
    
    // Create roles
    const roles = await Role.bulkCreate([
      {
        name: 'admin',
        permissions: {
          canViewDashboard: true,
          canViewOwnRecords: true,
          canViewAnalytics: true,
          canCreateRecords: true,
          canUpdateOwnRecords: true,
          canDeleteOwnRecords: true,
          canManageUsers: true,
          canViewAllRecords: true,
          canUpdateAnyRecord: true,
          canDeleteAnyRecord: true,
        },
        description: 'Full system access',
        is_system: true,
      },
      {
        name: 'analyst',
        permissions: {
          canViewDashboard: true,
          canViewOwnRecords: true,
          canViewAnalytics: true,
          canCreateRecords: true,
          canUpdateOwnRecords: true,
          canDeleteOwnRecords: true,
          canManageUsers: false,
          canViewAllRecords: false,
          canUpdateAnyRecord: false,
          canDeleteAnyRecord: false,
        },
        description: 'Can view and create records',
        is_system: true,
      },
      {
        name: 'viewer',
        permissions: {
          canViewDashboard: true,
          canViewOwnRecords: true,
          canViewAnalytics: false,
          canCreateRecords: false,
          canUpdateOwnRecords: false,
          canDeleteOwnRecords: false,
          canManageUsers: false,
          canViewAllRecords: false,
          canUpdateAnyRecord: false,
          canDeleteAnyRecord: false,
        },
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
    
    console.log('🎉 Database reset complete!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin:    admin@finance.com / Admin@123456');
    console.log('Analyst:  analyst@finance.com / Analyst@123456');
    console.log('Viewer:   viewer@finance.com / Viewer@123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

completeReset();