const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'general',
    validate: {
      isIn: [['general', 'software', 'marketing', 'hr', 'project-management', 'personal']]
    }
  },
  thumbnail: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isOfficial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'templates',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['isPublic', 'isOfficial']
    },
    {
      fields: ['createdById']
    },
    {
      fields: ['usageCount']
    }
  ]
});

module.exports = Template;