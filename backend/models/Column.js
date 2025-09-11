const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Column = sequelize.define('Column', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#e2e8f0'
  },
  wipLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  isCollapsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  boardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'boards',
      key: 'id'
    }
  }
}, {
  tableName: 'columns',
  timestamps: true,
  indexes: [
    { fields: ['boardId'] },
    { fields: ['position'] },
    { fields: ['boardId', 'position'] }
  ]
});

module.exports = Column;
