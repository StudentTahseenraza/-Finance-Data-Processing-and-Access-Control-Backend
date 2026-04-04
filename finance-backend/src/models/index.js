const User = require('./User');
const Role = require('./Role');
const FinancialRecord = require('./FinancialRecord');
const AuditLog = require('./AuditLog');

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

User.hasMany(FinancialRecord, { foreignKey: 'user_id', as: 'records' });
FinancialRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Role,
  FinancialRecord,
  AuditLog,
};