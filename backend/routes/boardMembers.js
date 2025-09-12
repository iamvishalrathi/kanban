const express = require('express');
const router = express.Router();
const boardMemberController = require('../controllers/boardMemberController');
const { authenticateToken } = require('../middleware/auth');
const { 
  checkBoardAccess, 
  requireMemberManagement, 
  requireBoardOwner 
} = require('../middleware/accessControl');
const { validate } = require('../middleware/validation');
const { body, param } = require('express-validator');

// Validation schemas
const inviteValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Role must be admin, editor, or viewer')
];

const roleUpdateValidation = [
  param('memberId')
    .isUUID()
    .withMessage('Valid member ID is required'),
  body('role')
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Role must be admin, editor, or viewer')
];

// Get board members
router.get(
  '/:boardId/members',
  authenticateToken,
  checkBoardAccess('view_board'),
  boardMemberController.getBoardMembers
);

// Invite user to board
router.post(
  '/:boardId/members/invite',
  authenticateToken,
  checkBoardAccess('invite_members'),
  inviteValidation,
  validate,
  boardMemberController.inviteToBoard
);

// Accept invitation
router.post(
  '/:boardId/members/accept',
  authenticateToken,
  boardMemberController.acceptInvitation
);

// Decline invitation
router.delete(
  '/:boardId/members/decline',
  authenticateToken,
  boardMemberController.declineInvitation
);

// Update member role
router.put(
  '/:boardId/members/:memberId/role',
  authenticateToken,
  requireMemberManagement(),
  roleUpdateValidation,
  validate,
  boardMemberController.updateMemberRole
);

// Remove member
router.delete(
  '/:boardId/members/:memberId',
  authenticateToken,
  requireMemberManagement(),
  param('memberId').isUUID().withMessage('Valid member ID is required'),
  validate,
  boardMemberController.removeMember
);

// Leave board
router.delete(
  '/:boardId/members/leave',
  authenticateToken,
  checkBoardAccess('view_board'),
  boardMemberController.leaveBoard
);

// Transfer ownership
router.put(
  '/:boardId/members/:memberId/transfer-ownership',
  authenticateToken,
  requireBoardOwner(),
  param('memberId').isUUID().withMessage('Valid member ID is required'),
  validate,
  boardMemberController.transferOwnership
);

// Get user's pending invitations (global endpoint)
router.get(
  '/invitations/pending',
  authenticateToken,
  boardMemberController.getPendingInvitations
);

module.exports = router;