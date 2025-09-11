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
}

module.exports = new EmailService();
