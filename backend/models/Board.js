const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Board = sequelize.define('Board', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  backgroundColor: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  isTemplate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  templateData: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      allowComments: true,
      requireAssignee: false,
      autoArchive: false
    }
  },
  visibility: {
    type: DataTypes.ENUM('private', 'team', 'public'),
    defaultValue: 'private'
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ownerId: {
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
  tableName: 'boards',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['ownerId'] },
    { fields: ['isArchived'] },
    { fields: ['visibility'] },
    { fields: ['isTemplate'] }
  ]
});

module.exports = Board;
