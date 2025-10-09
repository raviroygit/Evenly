import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';
import { config } from '../config/config';

// Create a transporter object using SMTP settings
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: config.email.auth
});

/**
 * Render an EJS template from the templates folder.
 * @param templateName - Template filename (e.g., 'groupInvitation.ejs')
 * @param data - Data to be passed to the template
 * @returns Rendered HTML string
 */
async function renderTemplate(templateName: string, data: any): Promise<string> {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  return ejs.renderFile(templatePath, data);
}

/**
 * Send an email using Nodemailer.
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param htmlBody - HTML email body
 */
export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
  try {
    const mailOptions = {
      from: `"Evenly" <${config.email.auth.user}>`,
      to,
      subject,
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Log the error but don't throw to prevent invitation creation from failing
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.warn(`SMTP authentication failed for ${to}. Please check your email credentials in .env file.`);
      console.warn('Email not sent, but invitation was created successfully.');
      console.warn('To fix: Set up EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file');
      return; // Don't throw error, just log it
    }
    
    console.warn(`Email sending failed for ${to}, but invitation was created successfully.`);
    return; // Don't throw error to prevent invitation creation from failing
  }
}

/**
 * Send a group invitation email.
 * @param email - Recipient's email address
 * @param groupName - Name of the group
 * @param inviterName - Name of the person who sent the invitation
 * @param invitationLink - Link to accept the invitation
 * @param isExistingUser - Whether the recipient already has an account
 */
export async function sendGroupInvitationEmail(
  email: string, 
  groupName: string, 
  inviterName: string, 
  invitationLink: string,
  isExistingUser: boolean
): Promise<void> {
  try {
    const htmlBody = await renderTemplate('groupInvitation.ejs', {
      groupName,
      inviterName,
      invitationLink,
      isExistingUser,
      year: new Date().getFullYear()
    });
    
    const subject = isExistingUser 
      ? `You've been invited to join "${groupName}" on Evenly`
      : `Join "${groupName}" on Evenly - Expense Sharing Made Easy`;
      
    await sendEmail(email, subject, htmlBody);
  } catch (error: any) {
    console.error('Error in sendGroupInvitationEmail:', error);
    console.warn(`Failed to send invitation email to ${email}, but this will not affect invitation creation`);
    // Don't throw error - let the invitation creation continue
  }
}

/**
 * Send expense notification email to group members.
 * @param email - Recipient's email address
 * @param expense - Expense data
 * @param addedBy - User who added the expense
 * @param group - Group information
 * @param userSplit - User's split amount for this expense
 */
export async function sendExpenseNotificationEmail(
  email: string,
  expense: {
    id: string;
    title: string;
    description?: string;
    totalAmount: string;
    category: string;
    date: string;
  },
  addedBy: {
    id: string;
    name: string;
    email: string;
  },
  group: {
    id: string;
    name: string;
  },
  userSplit: {
    amount: string;
  }
): Promise<void> {
  console.log('sendExpenseNotificationEmail called with:', {
    to: email,
    expenseTitle: expense.title,
    addedByName: addedBy.name,
    groupName: group.name,
    userSplitAmount: userSplit.amount
  });

  try {
    const htmlBody = await renderTemplate('expenseNotification.ejs', {
      expense,
      addedBy,
      group,
      userSplit,
      appBaseUrl: config.app.baseUrl,
      year: new Date().getFullYear()
    });
    
    const subject = `New expense "${expense.title}" added to ${group.name}`;
    
    console.log('Sending email with subject:', subject);
    await sendEmail(email, subject, htmlBody);
    console.log('Email sent successfully to:', email);
  } catch (error) {
    console.error('Error in sendExpenseNotificationEmail:', error);
    throw error;
  }
}

/**
 * Send support email from user to support team.
 * @param userEmail - User's email address
 * @param userName - User's name
 * @param subject - Support request subject
 * @param message - Support request message
 * @param priority - Priority level (low, medium, high)
 * @param category - Support category (technical, billing, feature, other)
 */
export async function sendSupportEmail(
  userEmail: string,
  userName: string,
  subject: string,
  message: string,
  priority: 'low' | 'medium' | 'high' = 'medium',
  category: 'technical' | 'billing' | 'feature' | 'other' = 'other'
): Promise<void> {
  console.log('sendSupportEmail called with:', {
    from: userEmail,
    userName,
    subject,
    priority,
    category
  });

  try {
    // Create HTML body for support email
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Request - ${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .info-table th, .info-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .info-table th { background-color: #f5f5f5; font-weight: bold; }
          .message-box { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea; margin: 15px 0; }
          .priority-high { color: #e74c3c; font-weight: bold; }
          .priority-medium { color: #f39c12; font-weight: bold; }
          .priority-low { color: #27ae60; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🔧 Support Request</h2>
          <p>New support request received from Evenly app</p>
        </div>
        
        <div class="content">
          <h3>Request Details</h3>
          <table class="info-table">
            <tr>
              <th>From:</th>
              <td>${userName} (${userEmail})</td>
            </tr>
            <tr>
              <th>Subject:</th>
              <td>${subject}</td>
            </tr>
            <tr>
              <th>Priority:</th>
              <td><span class="priority-${priority}">${priority.toUpperCase()}</span></td>
            </tr>
            <tr>
              <th>Category:</th>
              <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
            </tr>
            <tr>
              <th>Date:</th>
              <td>${new Date().toLocaleString()}</td>
            </tr>
          </table>
          
          <h3>Message</h3>
          <div class="message-box">
            ${message.replace(/\n/g, '<br>')}
          </div>
          
          <div class="footer">
            <p>This email was sent from the Evenly app support system.</p>
            <p>Please respond directly to ${userEmail} to provide support.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const emailSubject = `[${priority.toUpperCase()}] Support Request: ${subject}`;
    
    console.log('Sending support email with subject:', emailSubject);
    await sendEmail(config.email.supportEmail || 'support@evenly.com', emailSubject, htmlBody);
    console.log('Support email sent successfully');
  } catch (error) {
    console.error('Error in sendSupportEmail:', error);
    throw error;
  }
}
