const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  action: {
    type: DataTypes.ENUM(
      'board_created', 'board_updated', 'board_deleted', 'board_archived',
      'column_created', 'column_updated', 'column_deleted', 'column_moved',
      'card_created', 'card_updated', 'card_deleted', 'card_moved', 'card_assigned',
      'comment_created', 'comment_updated', 'comment_deleted',
      'member_added', 'member_removed', 'member_role_changed'
    ),
    allowNull: false
  },
  entityType: {
    type: DataTypes.ENUM('board', 'column', 'card', 'comment', 'member'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  oldValues: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  newValues: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  boardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'boards',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // Audit logs should never be updated
  indexes: [
    { fields: ['boardId'] },
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['entityType'] },
    { fields: ['entityId'] },
    { fields: ['createdAt'] },
    { fields: ['boardId', 'createdAt'] }
  ]
});

module.exports = AuditLog;
