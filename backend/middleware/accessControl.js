const { BoardMember, Board } = require('../models');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Middleware to check if user has access to a board with specific permissions
 */
const checkBoardAccess = (requiredAction = 'view_board') => {
  return async (req, res, next) => {
    try {
      const { boardId } = req.params;
      const userId = req.user.id;

      // Check if board exists
      const board = await Board.findByPk(boardId);
      if (!board) {
        throw new NotFoundError('Board not found');
      }

      // Check if user is board owner first
      if (board.ownerId === userId) {
        // Board owners have all permissions
        req.board = board;
        req.boardMember = { 
          role: 'owner', 
          canPerformAction: () => true,
          permissions: {
            canView: true,
            canEdit: true,
            canDelete: true,
            canInvite: true,
            canManageMembers: true,
            canManageSettings: true
          }
        };
        return next();
      }

      // Check if user is board member
      const boardMember = await BoardMember.findOne({
        where: { 
          boardId,
          userId,
          isActive: true
          // Removed status: 'active' condition temporarily to debug
        }
      });

      if (!boardMember) {
        throw new ForbiddenError('Access denied: You are not a member of this board');
      }

      // Check specific permission
      if (!boardMember.canPerformAction(requiredAction)) {
        throw new ForbiddenError(`Access denied: Insufficient permissions for ${requiredAction}`);
      }

      // Attach board and member info to request
      req.board = board;
      req.boardMember = boardMember;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is board owner
 */
const requireBoardOwner = () => {
  return async (req, res, next) => {
    try {
      const { boardId } = req.params;
      const userId = req.user.id;

      const boardMember = await BoardMember.findOne({
        where: { 
          boardId,
          userId,
          role: 'owner',
          isActive: true,
          status: 'active'
        }
      });

      if (!boardMember) {
        throw new ForbiddenError('Access denied: Board owner privileges required');
      }

      req.boardMember = boardMember;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user can manage board members
 */
const requireMemberManagement = () => {
  return async (req, res, next) => {
    try {
      const { boardId } = req.params;
      const userId = req.user.id;

      const boardMember = await BoardMember.findOne({
        where: { 
          boardId,
          userId,
          isActive: true,
          status: 'active'
        }
      });

      if (!boardMember || !boardMember.hasPermission('canManageMembers')) {
        throw new ForbiddenError('Access denied: Member management privileges required');
      }

      req.boardMember = boardMember;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user can manage board settings
 */
const requireSettingsManagement = () => {
  return async (req, res, next) => {
    try {
      const { boardId } = req.params;
      const userId = req.user.id;

      const boardMember = await BoardMember.findOne({
        where: { 
          boardId,
          userId,
          isActive: true,
          status: 'active'
        }
      });

      if (!boardMember || !boardMember.hasPermission('canManageSettings')) {
        throw new ForbiddenError('Access denied: Settings management privileges required');
      }

      req.boardMember = boardMember;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can edit/delete a specific card
 */
const checkCardAccess = (action = 'edit') => {
  return async (req, res, next) => {
    try {
      const { boardId, cardId } = req.params;
      const userId = req.user.id;
      
      const Card = require('../models/Card');

      // First get the card with its column to extract boardId if not provided
      const card = await Card.findOne({
        where: { id: cardId },
        include: [{
          model: require('../models/Column'),
          as: 'column'
        }]
      });

      if (!card) {
        throw new NotFoundError('Card not found');
      }

      // Get boardId from parameter or from card's column
      const effectiveBoardId = boardId || card.column.boardId;

      // Verify card belongs to the expected board if boardId was provided
      if (boardId && card.column.boardId !== boardId) {
        throw new NotFoundError('Card not found in this board');
      }

      // Check board access first
      const boardMember = await BoardMember.findOne({
        where: { 
          boardId: effectiveBoardId,
          userId,
          isActive: true
          // Removed status: 'active' condition to match board access logic
        }
      });

      if (!boardMember) {
        throw new ForbiddenError('Access denied: You are not a member of this board');
      }

      // Check if user can perform the action
      const requiredAction = action === 'delete' ? 'delete_cards' : 'edit_cards';
      
      if (!boardMember.canPerformAction(requiredAction)) {
        // Allow card assignee to edit their own card
        if (action === 'edit' && card.assigneeId === userId) {
          req.card = card;
          req.boardMember = boardMember;
          return next();
        }
        
        throw new ForbiddenError(`Access denied: Insufficient permissions for ${action} operation`);
      }

      req.card = card;
      req.boardMember = boardMember;
      req.boardId = effectiveBoardId; // Add boardId to request for downstream handlers
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Get user's effective permissions for a board
 */
const getBoardPermissions = async (userId, boardId) => {
  const boardMember = await BoardMember.findOne({
    where: { 
      boardId,
      userId,
      isActive: true,
      status: 'active'
    }
  });

  if (!boardMember) {
    return null;
  }

  return {
    role: boardMember.role,
    permissions: boardMember.permissions,
    canView: boardMember.hasPermission('canView'),
    canEdit: boardMember.hasPermission('canEdit'),
    canDelete: boardMember.hasPermission('canDelete'),
    canInvite: boardMember.hasPermission('canInvite'),
    canManageMembers: boardMember.hasPermission('canManageMembers'),
    canManageSettings: boardMember.hasPermission('canManageSettings')
  };
};

module.exports = {
  checkBoardAccess,
  requireBoardOwner,
  requireMemberManagement,
  requireSettingsManagement,
  checkCardAccess,
  getBoardPermissions
};