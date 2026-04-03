const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FinancialRecord = sequelize.define('FinancialRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01,
      isDecimal: true,
    },
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  deleted_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'financial_records',
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['user_id', 'date'],
    },
    {
      fields: ['user_id', 'type', 'date'],
    },
    {
      fields: ['user_id', 'category'],
    },
  ],
});

// Scopes for common queries
FinancialRecord.addScope('active', {
  where: { deleted_at: null },
});

FinancialRecord.addScope('income', {
  where: { type: 'income', deleted_at: null },
});

FinancialRecord.addScope('expense', {
  where: { type: 'expense', deleted_at: null },
});

FinancialRecord.addScope('dateRange', (startDate, endDate) => ({
  where: {
    date: {
      [sequelize.Op.between]: [startDate, endDate],
    },
    deleted_at: null,
  },
}));

module.exports = FinancialRecord;