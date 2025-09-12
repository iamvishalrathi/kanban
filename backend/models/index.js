const sequelize = require('./database');
const User = require('./User');
const Board = require('./Board');
const Column = require('./Column');
const Card = require('./Card');
const BoardMember = require('./BoardMember');
const Comment = require('./Comment');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const Template = require('./Template');

// Define associations
// User associations
User.hasMany(Board, { foreignKey: 'ownerId', as: 'ownedBoards' });
User.hasMany(BoardMember, { foreignKey: 'userId', as: 'memberships' });
User.hasMany(Card, { foreignKey: 'assigneeId', as: 'assignedCards' });
User.hasMany(Card, { foreignKey: 'createdById', as: 'createdCards' });
User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
User.hasMany(Notification, { foreignKey: 'triggeredById', as: 'triggeredNotifications' });

// Board associations
Board.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Board.hasMany(Column, { foreignKey: 'boardId', as: 'columns' });
Board.hasMany(BoardMember, { foreignKey: 'boardId', as: 'members' });
Board.hasMany(AuditLog, { foreignKey: 'boardId', as: 'auditLogs' });
Board.hasMany(Notification, { foreignKey: 'boardId', as: 'notifications' });

// Column associations
Column.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });
Column.hasMany(Card, { foreignKey: 'columnId', as: 'cards' });

// Card associations
Card.belongsTo(Column, { foreignKey: 'columnId', as: 'column' });
Card.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
Card.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
Card.hasMany(Comment, { foreignKey: 'cardId', as: 'comments' });
Card.hasMany(Notification, { foreignKey: 'cardId', as: 'notifications' });

// BoardMember associations
BoardMember.belongsTo(Board, { foreignKey: 'boardId', as: 'Board' });
BoardMember.belongsTo(User, { foreignKey: 'userId', as: 'User' });
BoardMember.belongsTo(User, { foreignKey: 'invitedBy', as: 'InvitedBy' });

// Comment associations
Comment.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

// AuditLog associations
AuditLog.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'triggeredById', as: 'triggeredBy' });
Notification.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });
Notification.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// Template associations
Template.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
User.hasMany(Template, { foreignKey: 'createdById', as: 'templates' });

module.exports = {
  sequelize,
  User,
  Board,
  Column,
  Card,
  BoardMember,
  Comment,
  AuditLog,
  Notification,
  Template
};
