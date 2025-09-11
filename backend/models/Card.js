const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Card = sequelize.define('Card', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  labels: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  checklist: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  actualHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  columnId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'columns',
      key: 'id'
    }
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'cards',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['columnId'] },
    { fields: ['assigneeId'] },
    { fields: ['createdById'] },
    { fields: ['position'] },
    { fields: ['dueDate'] },
    { fields: ['priority'] },
    { fields: ['isArchived'] },
    { fields: ['columnId', 'position'] }
  ]
});

module.exports = Card;
