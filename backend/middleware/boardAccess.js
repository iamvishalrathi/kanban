const { BoardMember, Board } = require('../models');

const checkBoardAccess = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      const boardId = req.params.boardId || req.body.boardId;
      const userId = req.userId;

      if (!boardId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Board ID is required' 
        });
      }

      // Check if board exists
      const board = await Board.findByPk(boardId);
      if (!board || board.isArchived) {
        return res.status(404).json({ 
          success: false, 
          message: 'Board not found' 
        });
      }

      // Check if user is the owner
      if (board.ownerId === userId) {
        req.board = board;
        req.userRole = 'owner';
        req.canEdit = true;
        req.canDelete = true;
        req.canInvite = true;
        req.canManageMembers = true;
        return next();
      }

      // Check membership
      const membership = await BoardMember.findOne({
        where: {
          boardId,
          userId,
          isActive: true
        }
      });

      if (!membership) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied to this board' 
        });
      }

      // Check required role
      if (requiredRole) {
        const roleHierarchy = ['viewer', 'editor', 'admin', 'owner'];
        const userRoleIndex = roleHierarchy.indexOf(membership.role);
        const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

        if (userRoleIndex < requiredRoleIndex) {
          return res.status(403).json({ 
            success: false, 
            message: `${requiredRole} access required` 
          });
        }
      }

      // Set permissions based on role
      const permissions = membership.permissions || {};
      req.board = board;
      req.membership = membership;
      req.userRole = membership.role;
      req.canEdit = membership.role === 'admin' || membership.role === 'editor' || permissions.canEdit;
      req.canDelete = membership.role === 'admin' || permissions.canDelete;
      req.canInvite = membership.role === 'admin' || permissions.canInvite;
      req.canManageMembers = membership.role === 'admin' || permissions.canManageMembers;

      next();
    } catch (error) {
      console.error('Board access check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to verify board access' 
      });
    }
  };
};

const requireBoardEdit = checkBoardAccess('editor');
const requireBoardAdmin = checkBoardAccess('admin');

module.exports = {
  checkBoardAccess,
  requireBoardEdit,
  requireBoardAdmin
};
