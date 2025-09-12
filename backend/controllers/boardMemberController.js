const { BoardMember, Board, User } = require('../models');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const emailService = require('../services/emailService');
const auditService = require('../services/auditService');
const { Op } = require('sequelize');

/**
 * Get all members of a board
 */
const getBoardMembers = async (req, res) => {
  const { boardId } = req.params;
  const { status, role } = req.query;

  const whereClause = { boardId };
  
  if (status) {
    whereClause.status = status;
  }
  
  if (role) {
    whereClause.role = role;
  }

  const members = await BoardMember.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'avatar']
      },
      {
        model: User,
        as: 'InvitedBy',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        required: false
      }
    ],
    order: [
      ['role', 'ASC'], // owner, admin, editor, viewer
      ['joinedAt', 'ASC']
    ]
  });

  const membersWithPermissions = members.map(member => ({
    id: member.id,
    user: member.User,
    role: member.role,
    permissions: member.permissions,
    status: member.status,
    joinedAt: member.joinedAt,
    invitedAt: member.invitedAt,
    invitedBy: member.InvitedBy,
    isActive: member.isActive
  }));

  res.json({
    success: true,
    data: membersWithPermissions
  });
};

/**
 * Invite a user to board
 */
const inviteToBoard = async (req, res) => {
  const { boardId } = req.params;
  const { email, role = 'viewer' } = req.body;
  const inviterId = req.user.id;

  if (!email) {
    throw new BadRequestError('Email is required');
  }

  if (!['admin', 'editor', 'viewer'].includes(role)) {
    throw new BadRequestError('Invalid role. Must be admin, editor, or viewer');
  }

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new NotFoundError('User with this email not found');
  }

  // Check if user is already a member
  const existingMember = await BoardMember.findOne({
    where: { boardId, userId: user.id }
  });

  if (existingMember) {
    if (existingMember.status === 'active') {
      throw new ConflictError('User is already a member of this board');
    }
    
    // Update existing invitation
    existingMember.role = role;
    existingMember.invitedBy = inviterId;
    existingMember.invitedAt = new Date();
    existingMember.status = 'pending';
    await existingMember.save();
  } else {
    // Create new invitation
    await BoardMember.create({
      boardId,
      userId: user.id,
      role,
      invitedBy: inviterId,
      invitedAt: new Date(),
      status: 'pending'
    });
  }

  // Get board details for email
  const board = await Board.findByPk(boardId, {
    include: [{ model: User, as: 'Owner' }]
  });

  // Send invitation email
  await emailService.sendBoardInvitationEmail(
    user.email,
    user.firstName || user.username,
    board.title,
    req.user.firstName || req.user.username,
    role
  );

  // Log audit event
  await auditService.logEvent(boardId, req.user.id, 'member_invited', {
    invitedUserId: user.id,
    invitedUserEmail: email,
    role
  });

  res.status(201).json({
    success: true,
    message: 'Invitation sent successfully',
    data: {
      invitedUser: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      role,
      status: 'pending'
    }
  });
};

/**
 * Accept board invitation
 */
const acceptInvitation = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;

  const boardMember = await BoardMember.findOne({
    where: { 
      boardId, 
      userId, 
      status: 'pending' 
    }
  });

  if (!boardMember) {
    throw new NotFoundError('No pending invitation found for this board');
  }

  boardMember.status = 'active';
  boardMember.joinedAt = new Date();
  boardMember.isActive = true;
  await boardMember.save();

  // Log audit event
  await auditService.logEvent(boardId, userId, 'member_joined', {
    role: boardMember.role
  });

  res.json({
    success: true,
    message: 'Successfully joined the board',
    data: {
      role: boardMember.role,
      permissions: boardMember.permissions
    }
  });
};

/**
 * Decline board invitation
 */
const declineInvitation = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;

  const boardMember = await BoardMember.findOne({
    where: { 
      boardId, 
      userId, 
      status: 'pending' 
    }
  });

  if (!boardMember) {
    throw new NotFoundError('No pending invitation found for this board');
  }

  await boardMember.destroy();

  res.json({
    success: true,
    message: 'Invitation declined successfully'
  });
};

/**
 * Update member role
 */
const updateMemberRole = async (req, res) => {
  const { boardId, memberId } = req.params;
  const { role } = req.body;

  if (!['admin', 'editor', 'viewer'].includes(role)) {
    throw new BadRequestError('Invalid role. Must be admin, editor, or viewer');
  }

  const member = await BoardMember.findOne({
    where: { id: memberId, boardId },
    include: [{ model: User, as: 'User' }]
  });

  if (!member) {
    throw new NotFoundError('Board member not found');
  }

  if (member.role === 'owner') {
    throw new BadRequestError('Cannot change owner role');
  }

  const oldRole = member.role;
  member.role = role;
  await member.save();

  // Log audit event
  await auditService.logEvent(boardId, req.user.id, 'member_role_updated', {
    targetUserId: member.userId,
    targetUserEmail: member.User.email,
    oldRole,
    newRole: role
  });

  res.json({
    success: true,
    message: 'Member role updated successfully',
    data: {
      member: {
        id: member.id,
        user: member.User,
        role: member.role,
        permissions: member.permissions
      }
    }
  });
};

/**
 * Remove member from board
 */
const removeMember = async (req, res) => {
  const { boardId, memberId } = req.params;

  const member = await BoardMember.findOne({
    where: { id: memberId, boardId },
    include: [{ model: User, as: 'User' }]
  });

  if (!member) {
    throw new NotFoundError('Board member not found');
  }

  if (member.role === 'owner') {
    throw new BadRequestError('Cannot remove board owner');
  }

  // Log audit event before deletion
  await auditService.logEvent(boardId, req.user.id, 'member_removed', {
    removedUserId: member.userId,
    removedUserEmail: member.User.email,
    removedUserRole: member.role
  });

  await member.destroy();

  res.json({
    success: true,
    message: 'Member removed successfully'
  });
};

/**
 * Leave board (self-removal)
 */
const leaveBoard = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;

  const member = await BoardMember.findOne({
    where: { boardId, userId }
  });

  if (!member) {
    throw new NotFoundError('You are not a member of this board');
  }

  if (member.role === 'owner') {
    throw new BadRequestError('Board owner cannot leave. Transfer ownership first');
  }

  // Log audit event
  await auditService.logEvent(boardId, userId, 'member_left', {
    role: member.role
  });

  await member.destroy();

  res.json({
    success: true,
    message: 'Successfully left the board'
  });
};

/**
 * Transfer board ownership
 */
const transferOwnership = async (req, res) => {
  const { boardId, memberId } = req.params;
  const currentOwnerId = req.user.id;

  const newOwner = await BoardMember.findOne({
    where: { id: memberId, boardId },
    include: [{ model: User, as: 'User' }]
  });

  if (!newOwner) {
    throw new NotFoundError('Target member not found');
  }

  if (newOwner.status !== 'active') {
    throw new BadRequestError('Cannot transfer ownership to inactive member');
  }

  const currentOwner = await BoardMember.findOne({
    where: { boardId, userId: currentOwnerId, role: 'owner' }
  });

  if (!currentOwner) {
    throw new NotFoundError('Current owner record not found');
  }

  // Transfer ownership
  await BoardMember.update(
    { role: 'admin' },
    { where: { id: currentOwner.id } }
  );

  await BoardMember.update(
    { role: 'owner' },
    { where: { id: newOwner.id } }
  );

  // Update board owner
  await Board.update(
    { ownerId: newOwner.userId },
    { where: { id: boardId } }
  );

  // Log audit event
  await auditService.logEvent(boardId, currentOwnerId, 'ownership_transferred', {
    newOwnerId: newOwner.userId,
    newOwnerEmail: newOwner.User.email
  });

  res.json({
    success: true,
    message: 'Ownership transferred successfully',
    data: {
      newOwner: {
        id: newOwner.User.id,
        username: newOwner.User.username,
        email: newOwner.User.email
      }
    }
  });
};

/**
 * Get user's pending invitations
 */
const getPendingInvitations = async (req, res) => {
  const userId = req.user.id;

  const invitations = await BoardMember.findAll({
    where: { 
      userId, 
      status: 'pending' 
    },
    include: [
      {
        model: Board,
        as: 'Board',
        attributes: ['id', 'title', 'description', 'backgroundColor']
      },
      {
        model: User,
        as: 'InvitedBy',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName']
      }
    ],
    order: [['invitedAt', 'DESC']]
  });

  res.json({
    success: true,
    data: invitations.map(inv => ({
      id: inv.id,
      board: inv.Board,
      role: inv.role,
      invitedAt: inv.invitedAt,
      invitedBy: inv.InvitedBy
    }))
  });
};

module.exports = {
  getBoardMembers,
  inviteToBoard,
  acceptInvitation,
  declineInvitation,
  updateMemberRole,
  removeMember,
  leaveBoard,
  transferOwnership,
  getPendingInvitations
};