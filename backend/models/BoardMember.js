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
      canView: true,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canManageMembers: false,
      canManageSettings: false
    }
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  invitedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive'),
    defaultValue: 'pending'
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
    { fields: ['isActive'] },
    { fields: ['status'] }
  ],
  hooks: {
    beforeCreate: (boardMember, options) => {
      // Set permissions based on role
      const rolePermissions = {
        owner: {
          canView: true,
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true,
          canManageSettings: true
        },
        admin: {
          canView: true,
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true,
          canManageSettings: false
        },
        editor: {
          canView: true,
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageMembers: false,
          canManageSettings: false
        },
        viewer: {
          canView: true,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false,
          canManageSettings: false
        }
      };
      
      boardMember.permissions = rolePermissions[boardMember.role] || rolePermissions.viewer;
      
      // Set joinedAt if status is active
      if (boardMember.status === 'active' && !boardMember.joinedAt) {
        boardMember.joinedAt = new Date();
      }
    },
    beforeUpdate: (boardMember, options) => {
      // Update permissions if role changed
      if (boardMember.changed('role')) {
        const rolePermissions = {
          owner: {
            canView: true,
            canEdit: true,
            canDelete: true,
            canInvite: true,
            canManageMembers: true,
            canManageSettings: true
          },
          admin: {
            canView: true,
            canEdit: true,
            canDelete: true,
            canInvite: true,
            canManageMembers: true,
            canManageSettings: false
          },
          editor: {
            canView: true,
            canEdit: true,
            canDelete: false,
            canInvite: false,
            canManageMembers: false,
            canManageSettings: false
          },
          viewer: {
            canView: true,
            canEdit: false,
            canDelete: false,
            canInvite: false,
            canManageMembers: false,
            canManageSettings: false
          }
        };
        
        boardMember.permissions = rolePermissions[boardMember.role] || rolePermissions.viewer;
      }
      
      // Set joinedAt if status changed to active
      if (boardMember.changed('status') && boardMember.status === 'active' && !boardMember.joinedAt) {
        boardMember.joinedAt = new Date();
      }
    }
  }
});

// Instance methods
BoardMember.prototype.hasPermission = function(permission) {
  return this.permissions && this.permissions[permission] === true;
};

BoardMember.prototype.canPerformAction = function(action) {
  const actionPermissions = {
    'view_board': 'canView',
    'edit_cards': 'canEdit',
    'delete_cards': 'canDelete',
    'invite_members': 'canInvite',
    'manage_members': 'canManageMembers',
    'manage_settings': 'canManageSettings'
  };
  
  const permission = actionPermissions[action];
  return permission ? this.hasPermission(permission) : false;
};

module.exports = BoardMember;
