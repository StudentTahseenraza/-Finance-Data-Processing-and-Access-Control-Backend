const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      isIn: [['viewer', 'analyst', 'admin']],
    },
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  description: {
    type: DataTypes.STRING(200),
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'roles',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Role.PERMISSIONS = {
  VIEWER: {
    canViewDashboard: true,
    canViewOwnRecords: true,
    canViewAnalytics: false,
    canCreateRecords: false,
    canUpdateOwnRecords: false,
    canDeleteOwnRecords: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllRecords: false,
    canUpdateAnyRecord: false,
    canDeleteAnyRecord: false,
  },
  ANALYST: {
    canViewDashboard: true,
    canViewOwnRecords: true,
    canViewAnalytics: true,
    canCreateRecords: true,
    canUpdateOwnRecords: true,
    canDeleteOwnRecords: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllRecords: false,
    canUpdateAnyRecord: false,
    canDeleteAnyRecord: false,
  },
  ADMIN: {
    canViewDashboard: true,
    canViewOwnRecords: true,
    canViewAnalytics: true,
    canCreateRecords: true,
    canUpdateOwnRecords: true,
    canDeleteOwnRecords: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewAllRecords: true,
    canUpdateAnyRecord: true,
    canDeleteAnyRecord: true,
  },
};

module.exports = Role;