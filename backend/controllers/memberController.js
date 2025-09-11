const { BoardMember, User, Board } = require('../models');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');

class MemberController {
  // Get board members
  async getMembers(req, res) {
    try {
      const { boardId } = req.params;

      const members = await BoardMember.findAll({
        where: {
          boardId,
          isActive: true
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar', 'lastSeen']
          }
        ],
        order: [
          ['role', 'ASC'],
          ['joinedAt', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: { members }
      });
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get board members'
      });
    }
  }

  // Invite member to board
  async inviteMember(req, res) {
    try {
      const { boardId } = req.params;
      const { email, role = 'viewer' } = req.body;

      if (!req.canInvite) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to invite members'
        });
      }

      // Find user by email
      const user = await User.findOne({
        where: {
          email: email.toLowerCase(),
          isActive: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this email address'
        });
      }

      // Check if user is already a member
      const existingMember = await BoardMember.findOne({
        where: {
          boardId,
          userId: user.id
        }
      });

      if (existingMember) {
        if (existingMember.isActive) {
          return res.status(400).json({
            success: false,
            message: 'User is already a member of this board'
          });
        } else {
          // Reactivate membership
          await existingMember.update({
            isActive: true,
            role,
            joinedAt: new Date()
          });

          const updatedMember = await BoardMember.findByPk(existingMember.id, {
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
              }
            ]
          });

          // Log audit event
          await auditService.logMemberAdded(boardId, user.id, role, req.userId, req);

          // Send notification
          await notificationService.notifyBoardInvitation(boardId, user.id, req.userId, role);

          // Broadcast to board members
          socketService.broadcastToBoard(boardId, 'member:added', {
            member: updatedMember
          });

          return res.json({
            success: true,
            message: 'User re-invited to board successfully',
            data: { member: updatedMember }
          });
        }
      }

      // Set permissions based on role
      const permissions = {
        viewer: { canEdit: false, canDelete: false, canInvite: false, canManageMembers: false },
        editor: { canEdit: true, canDelete: false, canInvite: false, canManageMembers: false },
        admin: { canEdit: true, canDelete: true, canInvite: true, canManageMembers: true }
      };

      // Create new membership
      const member = await BoardMember.create({
        boardId,
        userId: user.id,
        role,
        permissions: permissions[role] || permissions.viewer
      });

      const newMember = await BoardMember.findByPk(member.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
          }
        ]
      });

      // Log audit event
      await auditService.logMemberAdded(boardId, user.id, role, req.userId, req);

      // Send notification
      await notificationService.notifyBoardInvitation(boardId, user.id, req.userId, role);

      // Broadcast to board members
      socketService.broadcastToBoard(boardId, 'member:added', {
        member: newMember
      });

      res.status(201).json({
        success: true,
        message: 'User invited to board successfully',
        data: { member: newMember }
      });
    } catch (error) {
      console.error('Invite member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invite member'
      });
    }
  }

  // Update member role
  async updateMemberRole(req, res) {
    try {
      const { boardId, memberId } = req.params;
      const { role } = req.body;

      if (!req.canManageMembers) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to manage members'
        });
      }

      const member = await BoardMember.findOne({
        where: {
          id: memberId,
          boardId,
          isActive: true
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
          }
        ]
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      // Cannot change owner role
      if (member.role === 'owner') {
        return res.status(400).json({
          success: false,
          message: 'Cannot change owner role'
        });
      }

      // Cannot demote yourself if you are the only admin
      if (member.userId === req.userId && member.role === 'admin' && role !== 'admin') {
        const adminCount = await BoardMember.count({
          where: {
            boardId,
            role: { [Op.in]: ['owner', 'admin'] },
            isActive: true
          }
        });

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot demote yourself as you are the only admin'
          });
        }
      }

      const oldRole = member.role;

      // Set permissions based on role
      const permissions = {
        viewer: { canEdit: false, canDelete: false, canInvite: false, canManageMembers: false },
        editor: { canEdit: true, canDelete: false, canInvite: false, canManageMembers: false },
        admin: { canEdit: true, canDelete: true, canInvite: true, canManageMembers: true }
      };

      await member.update({
        role,
        permissions: permissions[role] || permissions.viewer
      });

      // Log audit event
      await auditService.logMemberRoleChanged(boardId, member.userId, oldRole, role, req.userId, req);

      // Broadcast to board members
      socketService.broadcastToBoard(boardId, 'member:role_updated', {
        memberId: member.id,
        userId: member.userId,
        oldRole,
        newRole: role
      });

      res.json({
        success: true,
        message: 'Member role updated successfully',
        data: { member }
      });
    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member role'
      });
    }
  }

  // Remove member from board
  async removeMember(req, res) {
    try {
      const { boardId, memberId } = req.params;

      const member = await BoardMember.findOne({
        where: {
          id: memberId,
          boardId,
          isActive: true
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
          }
        ]
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      // Cannot remove owner
      if (member.role === 'owner') {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove board owner'
        });
      }

      // Can remove yourself or if you have manage members permission
      if (member.userId !== req.userId && !req.canManageMembers) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to remove this member'
        });
      }

      // If removing yourself and you're an admin, check if there are other admins
      if (member.userId === req.userId && member.role === 'admin') {
        const adminCount = await BoardMember.count({
          where: {
            boardId,
            role: { [Op.in]: ['owner', 'admin'] },
            isActive: true
          }
        });

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot remove yourself as you are the only admin'
          });
        }
      }

      const memberData = {
        userId: member.userId,
        role: member.role,
        firstName: member.user.firstName,
        lastName: member.user.lastName
      };

      // Deactivate membership
      await member.update({ isActive: false });

      // Log audit event
      await auditService.logMemberRemoved(boardId, member.userId, member.role, req.userId, req);

      // Broadcast to board members
      socketService.broadcastToBoard(boardId, 'member:removed', {
        memberId: member.id,
        userId: member.userId
      });

      // If member is currently connected to this board, force them to leave
      socketService.broadcastToUser(member.userId, 'board:access_revoked', {
        boardId,
        message: 'You have been removed from this board'
      });

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove member'
      });
    }
  }
}

module.exports = new MemberController();
