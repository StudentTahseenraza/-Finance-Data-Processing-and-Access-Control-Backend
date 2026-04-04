const { sequelize } = require('../src/config/database');
const Role = require('../src/models/Role');
const User = require('../src/models/User');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    
    // Check if roles already exist
    const roleCount = await Role.count();
    
    if (roleCount === 0) {
      console.log('📦 Creating roles...');
      
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
      console.log('✅ Admin user created (admin@finance.com / Admin@123456)');
      
      // Create analyst user
      const analystRole = roles.find(r => r.name === 'analyst');
      await User.create({
        email: 'analyst@finance.com',
        password_hash: 'Analyst@123456',
        full_name: 'Financial Analyst',
        role_id: analystRole.id,
        status: 'active',
      });
      console.log('✅ Analyst user created (analyst@finance.com / Analyst@123456)');
      
      // Create viewer user
      const viewerRole = roles.find(r => r.name === 'viewer');
      await User.create({
        email: 'viewer@finance.com',
        password_hash: 'Viewer@123456',
        full_name: 'Dashboard Viewer',
        role_id: viewerRole.id,
        status: 'active',
      });
      console.log('✅ Viewer user created (viewer@finance.com / Viewer@123456)');
      
      console.log('🎉 Database seeding completed successfully!');
    } else {
      console.log('✅ Roles already exist, skipping seed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();