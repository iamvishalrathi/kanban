const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM(
      'card_assigned', 'card_due_soon', 'card_overdue', 'card_commented',
      'card_moved', 'mentioned', 'board_invited', 'board_updated'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  triggeredById: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  boardId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'boards',
      key: 'id'
    }
  },
  cardId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'cards',
      key: 'id'
    }
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['recipientId'] },
    { fields: ['triggeredById'] },
    { fields: ['boardId'] },
    { fields: ['cardId'] },
    { fields: ['type'] },
    { fields: ['isRead'] },
    { fields: ['createdAt'] },
    { fields: ['recipientId', 'isRead'] }
  ]
});

module.exports = Notification;
