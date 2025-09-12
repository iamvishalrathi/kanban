const sgMail = require('@sendgrid/mail');
require('dotenv').config();

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourapp.com';
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid API key not configured, skipping email send');
      return { success: false, error: 'SendGrid not configured' };
    }

    try {
      const msg = {
        to,
        from: this.fromEmail,
        subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent)
      };

      const result = await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}: ${subject}`);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Card assignment notification
  async sendCardAssignmentEmail(assignee, card, board, assignedBy) {
    const subject = `You've been assigned to "${card.title}"`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Card Assignment Notification</h2>
        <p>Hello ${assignee.firstName},</p>
        <p>${assignedBy.firstName} ${assignedBy.lastName} has assigned you to a card on the "${board.title}" board.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">${card.title}</h3>
          ${card.description ? `<p style="color: #6b7280;">${card.description}</p>` : ''}
          ${card.dueDate ? `<p><strong>Due Date:</strong> ${new Date(card.dueDate).toLocaleDateString()}</p>` : ''}
          <p><strong>Priority:</strong> ${card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}</p>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/boards/${board.id}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Card
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from your Kanban board system.
        </p>
      </div>
    `;

    return await this.sendEmail(assignee.email, subject, html);
  }

  // Card due soon notification
  async sendCardDueSoonEmail(assignee, card, board) {
    const subject = `Reminder: "${card.title}" is due soon`;
    const dueDate = new Date(card.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Card Due Soon</h2>
        <p>Hello ${assignee.firstName},</p>
        <p>This is a reminder that the following card is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}.</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
          <h3 style="margin-top: 0; color: #92400e;">${card.title}</h3>
          ${card.description ? `<p style="color: #6b7280;">${card.description}</p>` : ''}
          <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
          <p><strong>Priority:</strong> ${card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}</p>
          <p><strong>Board:</strong> ${board.title}</p>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/boards/${board.id}" 
             style="background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Card
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated reminder from your Kanban board system.
        </p>
      </div>
    `;

    return await this.sendEmail(assignee.email, subject, html);
  }

  // Card overdue notification
  async sendCardOverdueEmail(assignee, card, board) {
    const subject = `Overdue: "${card.title}" was due ${new Date(card.dueDate).toLocaleDateString()}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Card Overdue</h2>
        <p>Hello ${assignee.firstName},</p>
        <p>The following card is now overdue and requires your attention.</p>
        
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #991b1b;">${card.title}</h3>
          ${card.description ? `<p style="color: #6b7280;">${card.description}</p>` : ''}
          <p><strong>Was Due:</strong> ${new Date(card.dueDate).toLocaleDateString()} at ${new Date(card.dueDate).toLocaleTimeString()}</p>
          <p><strong>Priority:</strong> ${card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}</p>
          <p><strong>Board:</strong> ${board.title}</p>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/boards/${board.id}" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Card
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated notification from your Kanban board system.
        </p>
      </div>
    `;

    return await this.sendEmail(assignee.email, subject, html);
  }

  // Mention notification
  async sendMentionEmail(mentionedUser, comment, card, board, author) {
    const subject = `You were mentioned in "${card.title}"`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">You Were Mentioned</h2>
        <p>Hello ${mentionedUser.firstName},</p>
        <p>${author.firstName} ${author.lastName} mentioned you in a comment on "${card.title}".</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">${card.title}</h3>
          <p><strong>Board:</strong> ${board.title}</p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 3px solid #2563eb;">
            <p style="margin: 0; color: #374151;"><strong>${author.firstName} ${author.lastName}:</strong></p>
            <p style="margin: 5px 0 0 0; color: #6b7280;">${comment.content}</p>
          </div>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/boards/${board.id}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Card
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated notification from your Kanban board system.
        </p>
      </div>
    `;

    return await this.sendEmail(mentionedUser.email, subject, html);
  }

  // Board invitation
  async sendBoardInvitationEmail(invitedUser, board, invitedBy, role) {
    const subject = `You've been invited to join "${board.title}"`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Board Invitation</h2>
        <p>Hello ${invitedUser.firstName},</p>
        <p>${invitedBy.firstName} ${invitedBy.lastName} has invited you to join the "${board.title}" board as a ${role}.</p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0; color: #065f46;">${board.title}</h3>
          ${board.description ? `<p style="color: #6b7280;">${board.description}</p>` : ''}
          <p><strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
          <p><strong>Invited By:</strong> ${invitedBy.firstName} ${invitedBy.lastName}</p>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/boards/${board.id}" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Board
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated invitation from your Kanban board system.
        </p>
      </div>
    `;

    return await this.sendEmail(invitedUser.email, subject, html);
  }

  // Weekly digest
  async sendWeeklyDigest(user, boardsData) {
    const subject = 'Your Weekly Kanban Digest';

    let boardsHtml = '';
    boardsData.forEach(boardData => {
      boardsHtml += `
        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #374151;">${boardData.board.title}</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #6b7280;">
            <li>${boardData.assignedCards} cards assigned to you</li>
            <li>${boardData.completedCards} cards completed this week</li>
            <li>${boardData.overdueCards} overdue cards</li>
          </ul>
        </div>
      `;
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your Weekly Digest</h2>
        <p>Hello ${user.firstName},</p>
        <p>Here's your weekly summary of activity across your Kanban boards.</p>
        
        ${boardsHtml}
        
        <p>
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is your weekly digest from your Kanban board system.
        </p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  // Comment mention notification
  async sendCommentMentionEmail(mentionedUser, comment, card, board, author) {
    const subject = `You were mentioned in a comment on "${card.title}"`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">You were mentioned!</h2>
        <p>Hello ${mentionedUser.firstName},</p>
        <p>${author.firstName} ${author.lastName} mentioned you in a comment on the card "${card.title}" in the "${board.title}" board.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
          <h4 style="margin-top: 0; color: #374151;">Comment:</h4>
          <p style="color: #6b7280; font-style: italic;">"${comment.content}"</p>
          <p style="margin-bottom: 0; font-size: 14px; color: #9ca3af;">
            — ${author.firstName} ${author.lastName}
          </p>
        </div>

        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #374151;">Card: ${card.title}</h4>
          ${card.description ? `<p style="color: #6b7280; margin-bottom: 0;">${card.description}</p>` : ''}
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/boards/${board.id}" 
             style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Card & Reply
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from your Kanban board system.
        </p>
      </div>
    `;

    return await this.sendEmail(mentionedUser.email, subject, html);
  }

  // New comment notification for card assignee/watchers
  async sendNewCommentEmail(recipient, comment, card, board, author) {
    const subject = `New comment on "${card.title}"`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Comment Added</h2>
        <p>Hello ${recipient.firstName},</p>
        <p>${author.firstName} ${author.lastName} added a comment to the card "${card.title}" in the "${board.title}" board.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h4 style="margin-top: 0; color: #374151;">Comment:</h4>
          <p style="color: #6b7280;">${comment.content}</p>
          <p style="margin-bottom: 0; font-size: 14px; color: #9ca3af;">
            — ${author.firstName} ${author.lastName}
          </p>
        </div>

        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #374151;">Card: ${card.title}</h4>
          ${card.description ? `<p style="color: #6b7280; margin-bottom: 0;">${card.description}</p>` : ''}
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/boards/${board.id}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Card
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from your Kanban board system.
        </p>
      </div>
    `;

    return await this.sendEmail(recipient.email, subject, html);
  }

  // Board invitation email
  async sendBoardInvitationEmail(invitedUser, board, invitedBy, role) {
    const subject = `You've been invited to join "${board.title}"`;
    
    const roleDescriptions = {
      'owner': 'full control over the board',
      'admin': 'manage members and settings',
      'editor': 'create and edit cards',
      'viewer': 'view the board'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Board Invitation</h2>
        <p>Hello ${invitedUser.firstName},</p>
        <p>${invitedBy.firstName} ${invitedBy.lastName} has invited you to join the "${board.title}" board as a <strong>${role}</strong>.</p>
        
        ${board.description ? `
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #374151;">Board Description:</h4>
            <p style="color: #6b7280; margin-bottom: 0;">${board.description}</p>
          </div>
        ` : ''}

        <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)} - ${roleDescriptions[role]}
          </p>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/boards/${board.id}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This invitation will expire in 7 days. If you don't have an account yet, you'll be prompted to create one.
        </p>
      </div>
    `;

    return await this.sendEmail(invitedUser.email, subject, html);
  }

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Kanban Board!';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Kanban Board! 🎉</h2>
        <p>Hello ${user.firstName},</p>
        <p>Welcome to our collaborative Kanban board platform! We're excited to have you on board.</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0369a1;">Getting Started:</h3>
          <ul style="color: #0369a1; margin-bottom: 0;">
            <li>Create your first board</li>
            <li>Add columns to organize your workflow</li>
            <li>Create cards for your tasks</li>
            <li>Invite team members to collaborate</li>
            <li>Use templates to get started quickly</li>
          </ul>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Get Started
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Need help? Check out our documentation or contact support at support@kanban.com
        </p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailService();
