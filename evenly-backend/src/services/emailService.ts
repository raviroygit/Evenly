import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
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
