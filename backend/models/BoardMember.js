const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const BoardMember = sequelize.define('BoardMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
    defaultValue: 'viewer'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canManageMembers: false
    }
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'board_members',
  timestamps: true,
  indexes: [
    { fields: ['boardId'] },
    { fields: ['userId'] },
    { fields: ['boardId', 'userId'], unique: true },
    { fields: ['role'] },
    { fields: ['isActive'] }
  ]
});

module.exports = BoardMember;
