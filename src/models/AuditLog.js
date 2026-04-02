const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  resource_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  resource_id: {
    type: DataTypes.STRING(255),
  },
  old_value: {
    type: DataTypes.JSONB,
  },
  new_value: {
    type: DataTypes.JSONB,
  },
  ip_address: {
    type: DataTypes.INET,
  },
  user_agent: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('success', 'failure'),
    defaultValue: 'success',
  },
  error_message: {
    type: DataTypes.TEXT,
  },
  duration_ms: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'audit_logs',
  indexes: [
    {
      fields: ['user_id', 'created_at'],
    },
    {
      fields: ['resource_type', 'resource_id'],
    },
    {
      fields: ['action', 'created_at'],
    },
  ],
});

module.exports = AuditLog;