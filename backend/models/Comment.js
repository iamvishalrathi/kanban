const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  mentions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'cards',
      key: 'id'
    }
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  }
}, {
  tableName: 'comments',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['cardId'] },
    { fields: ['authorId'] },
    { fields: ['parentId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Comment;
