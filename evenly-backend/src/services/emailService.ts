import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';
import { config } from '../config/config';

// Create a transporter object using Zoho SMTP settings (matching nxgenaidev_auth)
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
  pool: false, // Disable pooling for Zoho
  tls: {
    rejectUnauthorized: false
  }
} as nodemailer.TransportOptions);

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ EmailService - SMTP connection verification failed:', error);
  } else {
    console.log('✅ EmailService - SMTP connection verified successfully');
  }
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
    console.log("📧 EmailService - Preparing to send email to:", to);
    console.log("📧 EmailService - Email config:", {
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      user: config.email.auth.user
    });

    const mailOptions = {
      from: `"EvenlySplit" <${config.email.auth.user}>`,
      to,
      subject,
      html: htmlBody
    };

    console.log("📤 EmailService - Sending email via transporter");

    // Add timeout to prevent hanging
    const sendMailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000);
    });

    const info = await Promise.race([sendMailPromise, timeoutPromise]) as any;
    console.log(`✅ EmailService - Email sent to ${to}: ${info.messageId}`);
  } catch (error: any) {
    console.error('💥 EmailService - Error sending email:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode
    });

    // Log detailed error information
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error(`🚨 SMTP authentication failed for ${to}. Email credentials are incorrect!`);
      console.error('Current email config:', {
        host: config.email.host,
        port: config.email.port,
        user: config.email.auth.user,
        secure: config.email.secure
      });
      console.error('To fix: Check EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file');
      // THROW error so invitation service knows email failed
      throw new Error(`SMTP_AUTH_FAILED: Cannot send email to ${to}. Please configure email credentials.`);
    }

    // For other errors, also throw so system knows email failed
    console.error(`🚨 Email sending failed for ${to}:`, error.message);
    throw error;
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
  isExistingUser: boolean,
  invitationToken?: string
): Promise<void> {
  try {
    // Construct app download link (smart redirect that detects device)
    // Include invitation token so the app can open directly to the invitation
    let appDownloadLink = `${config.app.baseUrl}/api/app/download`;
    if (invitationToken) {
      appDownloadLink += `?token=${invitationToken}`;
    }

    const htmlBody = await renderTemplate('groupInvitation.ejs', {
      groupName,
      inviterName,
      invitationLink,
      isExistingUser,
      appDownloadLink,
      year: new Date().getFullYear()
    });

    const subject = isExistingUser
      ? `You've been invited to join "${groupName}" on EvenlySplit`
      : `Join "${groupName}" on EvenlySplit - Expense Sharing Made Easy`;

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
    // Create smart app open link for expense/group
    const appOpenLink = `${config.app.baseUrl}/api/app/open/expense/${group.id}`;

    const htmlBody = await renderTemplate('expenseNotification.ejs', {
      expense,
      addedBy,
      group,
      userSplit,
      appBaseUrl: config.app.baseUrl,
      appOpenLink,
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
    
    // Send confirmation email to user
    await sendSupportConfirmationEmail(userEmail, userName, subject, message, priority, category);
  } catch (error) {
    console.error('Error in sendSupportEmail:', error);
    throw error;
  }
}

/**
 * Send support confirmation email to user.
 * @param userEmail - User's email address
 * @param userName - User's name
 * @param subject - Support request subject
 * @param message - Support request message
 * @param priority - Priority level (low, medium, high)
 * @param category - Support category (technical, billing, feature, other)
 */
async function sendSupportConfirmationEmail(
  userEmail: string,
  userName: string,
  subject: string,
  message: string,
  priority: 'low' | 'medium' | 'high' = 'medium',
  category: 'technical' | 'billing' | 'feature' | 'other' = 'other'
): Promise<void> {
  console.log('Sending support confirmation email to:', userEmail);

  try {
    // Create HTML body for confirmation email
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Request Confirmation - EvenlySplit</title>
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
          .success-message { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>✅ Support Request Received</h2>
          <p>Thank you for contacting EvenlySplit support!</p>
        </div>
        
        <div class="content">
          <div class="success-message">
            <strong>Your support request has been successfully submitted!</strong><br>
            We'll get back to you as soon as possible.
          </div>
          
          <h3>Request Summary</h3>
          <table class="info-table">
            <tr>
              <th>Name:</th>
              <td>${userName}</td>
            </tr>
            <tr>
              <th>Email:</th>
              <td>${userEmail}</td>
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
              <th>Submitted:</th>
              <td>${new Date().toLocaleString()}</td>
            </tr>
          </table>
          
          <h3>Your Message</h3>
          <div class="message-box">
            ${message.replace(/\n/g, '<br>')}
          </div>
          
          <div class="footer">
            <p><strong>What happens next?</strong></p>
            <p>Our support team will review your request and respond within 24-48 hours.</p>
            <p>For urgent issues, please contact us directly at support@evenly.com</p>
            <br>
            <p>Thank you for using EvenlySplit! 🎉</p>
            <p>© ${new Date().getFullYear()} EvenlySplit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const confirmationSubject = `Support Request Confirmation: ${subject}`;
    
    console.log('Sending confirmation email with subject:', confirmationSubject);
    await sendEmail(userEmail, confirmationSubject, htmlBody);
    console.log('Support confirmation email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Error in sendSupportConfirmationEmail:', error);
    // Don't throw error - confirmation email failure shouldn't break the main flow
  }
}

/**
 * Send Khata transaction notification email to customer.
 * @param customerEmail - Customer's email address
 * @param customerName - Customer's name
 * @param userName - User's name (who made the transaction)
 * @param transaction - Transaction data
 */
export async function sendKhataTransactionEmail(
  customerEmail: string,
  customerName: string,
  userName: string,
  transaction: {
    type: 'give' | 'get';
    amount: string;
    currency: string;
    description?: string;
    balance: string;
    date: string;
  }
): Promise<void> {
  console.log('sendKhataTransactionEmail called with:', {
    to: customerEmail,
    customerName,
    userName,
    transactionType: transaction.type,
    amount: transaction.amount,
  });

  try {
    const transactionType = transaction.type === 'give' ? 'You Gave' : 'You Got';
    const transactionColor = transaction.type === 'give' ? '#D9433D' : '#519F51';
    const balanceNum = parseFloat(transaction.balance);
    const balanceType = balanceNum > 0 ? 'You will get' : balanceNum < 0 ? 'You will give' : 'Settled';
    const balanceColor = balanceNum > 0 ? '#FF3B30' : balanceNum < 0 ? '#FF3B30' : '#666';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Khata Transaction - ${transactionType}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .transaction-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${transactionColor}; }
          .amount { font-size: 28px; font-weight: bold; color: ${transactionColor}; margin: 10px 0; }
          .balance { font-size: 20px; font-weight: bold; color: ${balanceColor}; margin: 10px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .info-table th, .info-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .info-table th { background-color: #f5f5f5; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>📝 Khata Transaction Update</h2>
          <p>New transaction recorded by ${userName}</p>
        </div>
        
        <div class="content">
          <h3>Hello ${customerName},</h3>
          <p>A new transaction has been recorded in your Khata:</p>
          
          <div class="transaction-card">
            <h3 style="margin-top: 0; color: ${transactionColor};">${transactionType}</h3>
            <div class="amount">₹${transaction.amount}</div>
            ${transaction.description ? `<p><strong>Description:</strong> ${transaction.description}</p>` : ''}
            <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleString('en-IN')}</p>
          </div>
          
          <h3>Current Balance</h3>
          <div class="balance">${balanceType}: ₹${Math.abs(balanceNum).toFixed(2)}</div>
          
          <div class="footer">
            <p>This is an automated notification from EvenlySplit Khata.</p>
            <p>© ${new Date().getFullYear()} EvenlySplit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const subject = `Khata Transaction: ${transactionType} ₹${transaction.amount}`;
    
    console.log('Sending Khata transaction email with subject:', subject);
    await sendEmail(customerEmail, subject, htmlBody);
    console.log('Khata transaction email sent successfully to:', customerEmail);
  } catch (error) {
    console.error('Error in sendKhataTransactionEmail:', error);
    throw error;
  }
}

/**
 * Send expense updated notification email to group members.
 */
export async function sendExpenseUpdatedEmail(
  email: string,
  expense: {
    id: string;
    title: string;
    description?: string;
    totalAmount: string;
    category: string;
    date: string;
  },
  updatedBy: {
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
  console.log('sendExpenseUpdatedEmail called with:', {
    to: email,
    expenseTitle: expense.title,
    updatedByName: updatedBy.name,
    groupName: group.name,
    userSplitAmount: userSplit.amount
  });

  try {
    // Create smart app open link for expense/group
    const appOpenLink = `${config.app.baseUrl}/api/app/open/expense/${group.id}`;

    const htmlBody = await renderTemplate('expenseUpdated.ejs', {
      expense,
      updatedBy,
      group,
      userSplit,
      appBaseUrl: config.app.baseUrl,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `Expense "${expense.title}" updated in ${group.name}`;

    await sendEmail(email, subject, htmlBody);
    console.log('Expense updated email sent successfully to:', email);
  } catch (error) {
    console.error('Error in sendExpenseUpdatedEmail:', error);
    // Don't throw - email failure shouldn't break the update operation
  }
}

/**
 * Send expense deleted notification email to group members.
 */
export async function sendExpenseDeletedEmail(
  email: string,
  expense: {
    id: string;
    title: string;
    description?: string;
    totalAmount: string;
    category: string;
    date: string;
  },
  deletedBy: {
    id: string;
    name: string;
    email: string;
  },
  group: {
    id: string;
    name: string;
  }
): Promise<void> {
  console.log('sendExpenseDeletedEmail called with:', {
    to: email,
    expenseTitle: expense.title,
    deletedByName: deletedBy.name,
    groupName: group.name
  });

  try {
    // Create smart app open link for group
    const appOpenLink = `${config.app.baseUrl}/api/app/open/group/${group.id}`;

    const htmlBody = await renderTemplate('expenseDeleted.ejs', {
      expense,
      deletedBy,
      group,
      appBaseUrl: config.app.baseUrl,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `Expense "${expense.title}" deleted from ${group.name}`;

    await sendEmail(email, subject, htmlBody);
    console.log('Expense deleted email sent successfully to:', email);
  } catch (error) {
    console.error('Error in sendExpenseDeletedEmail:', error);
    // Don't throw - email failure shouldn't break the delete operation
  }
}

/**
 * Send customer added notification email.
 */
export async function sendCustomerAddedEmail(
  customerEmail: string,
  customerName: string,
  userName: string
): Promise<void> {
  console.log('📧 sendCustomerAddedEmail called with:', {
    to: customerEmail,
    customerName,
    userName
  });

  try {
    // Create smart app open link for Khata
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;

    console.log('🎨 Rendering customerAdded.ejs template...');
    const htmlBody = await renderTemplate('customerAdded.ejs', {
      customerName,
      userName,
      appOpenLink,
      year: new Date().getFullYear()
    });
    console.log('✅ Template rendered successfully');

    const subject = `You've been added to ${userName}'s Khata on EvenlySplit`;  

    console.log('📤 Sending customer added email...');
    await sendEmail(customerEmail, subject, htmlBody);
    console.log('✅ Customer added email sent successfully to:', customerEmail);
  } catch (error: any) {
    console.error('❌ Error in sendCustomerAddedEmail:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      to: customerEmail
    });
    // Don't throw - email failure shouldn't break customer creation
  }
}

/**
 * Send customer deleted notification email.
 */
export async function sendCustomerDeletedEmail(
  customerEmail: string,
  customerName: string,
  userName: string,
  finalBalance?: string
): Promise<void> {
  console.log('sendCustomerDeletedEmail called with:', {
    to: customerEmail,
    customerName,
    userName,
    finalBalance
  });

  try {
    // Create smart app open link for Khata
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;

    const htmlBody = await renderTemplate('customerDeleted.ejs', {
      customerName,
      userName,
      finalBalance,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `Khata account closed with ${userName}`;

    await sendEmail(customerEmail, subject, htmlBody);
    console.log('Customer deleted email sent successfully to:', customerEmail);
  } catch (error) {
    console.error('Error in sendCustomerDeletedEmail:', error);
    // Don't throw - email failure shouldn't break customer deletion
  }
}

/**
 * Send transaction updated notification email to customer.
 */
export async function sendTransactionUpdatedEmail(
  customerEmail: string,
  customerName: string,
  userName: string,
  transaction: {
    type: 'give' | 'get';
    amount: string;
    currency: string;
    description?: string;
    balance: string;
    date: string;
  }
): Promise<void> {
  console.log('sendTransactionUpdatedEmail called with:', {
    to: customerEmail,
    customerName,
    userName,
    transactionType: transaction.type,
    amount: transaction.amount,
  });

  try {
    const transactionType = transaction.type === 'give' ? 'You Gave' : 'You Got';
    const transactionColor = transaction.type === 'give' ? '#D9433D' : '#519F51';
    const balanceNum = parseFloat(transaction.balance);
    const balanceType = balanceNum > 0 ? 'You will get' : balanceNum < 0 ? 'You will give' : 'Settled';
    const balanceColor = balanceNum > 0 ? '#FF3B30' : balanceNum < 0 ? '#FF3B30' : '#666';

    // Create smart app open link for Khata
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;

    const htmlBody = await renderTemplate('transactionUpdated.ejs', {
      customerName,
      userName,
      transaction,
      transactionType,
      transactionColor,
      balanceNum,
      balanceType,
      balanceColor,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `Transaction Updated: ${transactionType} ₹${transaction.amount}`;

    await sendEmail(customerEmail, subject, htmlBody);
    console.log('Transaction updated email sent successfully to:', customerEmail);
  } catch (error) {
    console.error('Error in sendTransactionUpdatedEmail:', error);
    // Don't throw - email failure shouldn't break the update
  }
}

/**
 * Send transaction deleted notification email to customer.
 */
export async function sendTransactionDeletedEmail(
  customerEmail: string,
  customerName: string,
  userName: string,
  transaction: {
    type: 'give' | 'get';
    amount: string;
    currency: string;
    description?: string;
    balance: string;
    date: string;
  }
): Promise<void> {
  console.log('sendTransactionDeletedEmail called with:', {
    to: customerEmail,
    customerName,
    userName,
    transactionType: transaction.type,
    amount: transaction.amount,
  });

  try {
    const transactionType = transaction.type === 'give' ? 'You Gave' : 'You Got';
    const balanceNum = parseFloat(transaction.balance);
    const balanceType = balanceNum > 0 ? 'You will get' : balanceNum < 0 ? 'You will give' : 'Settled';
    const balanceColor = balanceNum > 0 ? '#FF3B30' : balanceNum < 0 ? '#FF3B30' : '#666';

    // Create smart app open link for Khata
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;

    const htmlBody = await renderTemplate('transactionDeleted.ejs', {
      customerName,
      userName,
      transaction,
      transactionType,
      balanceNum,
      balanceType,
      balanceColor,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `Transaction Deleted: ${transactionType} ₹${transaction.amount}`;

    await sendEmail(customerEmail, subject, htmlBody);
    console.log('Transaction deleted email sent successfully to:', customerEmail);
  } catch (error) {
    console.error('Error in sendTransactionDeletedEmail:', error);
    // Don't throw - email failure shouldn't break the deletion
  }
}

/**
 * Send group join success email to the user who joined.
 */
export async function sendGroupJoinedEmail(
  userEmail: string,
  userName: string,
  group: {
    id: string;
    name: string;
    description?: string;
  },
  memberCount: number
): Promise<void> {
  console.log('sendGroupJoinedEmail called with:', {
    to: userEmail,
    userName,
    groupName: group.name,
    memberCount
  });

  try {
    // Create smart app open link for group
    const appOpenLink = `${config.app.baseUrl}/api/app/open/group/${group.id}`;

    const htmlBody = await renderTemplate('groupJoined.ejs', {
      groupName: group.name,
      groupDescription: group.description,
      memberCount,
      appBaseUrl: config.app.baseUrl,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `Welcome to ${group.name}!`;

    await sendEmail(userEmail, subject, htmlBody);
    console.log('Group joined email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Error in sendGroupJoinedEmail:', error);
    // Don't throw - email failure shouldn't break the join operation
  }
}

/**
 * Send new member notification email to existing group members.
 */
export async function sendNewMemberJoinedEmail(
  existingMemberEmail: string,
  newMember: {
    name: string;
    email: string;
  },
  group: {
    id: string;
    name: string;
  },
  memberCount: number
): Promise<void> {
  console.log('sendNewMemberJoinedEmail called with:', {
    to: existingMemberEmail,
    newMemberName: newMember.name,
    groupName: group.name,
    memberCount
  });

  try {
    // Create smart app open link for group
    const appOpenLink = `${config.app.baseUrl}/api/app/open/group/${group.id}`;

    const htmlBody = await renderTemplate('newMemberJoined.ejs', {
      newMemberName: newMember.name,
      newMemberEmail: newMember.email,
      groupName: group.name,
      memberCount,
      appBaseUrl: config.app.baseUrl,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `${newMember.name} joined ${group.name}`;

    await sendEmail(existingMemberEmail, subject, htmlBody);
    console.log('New member notification sent successfully to:', existingMemberEmail);
  } catch (error) {
    console.error('Error in sendNewMemberJoinedEmail:', error);
    // Don't throw - email failure shouldn't break the join operation
  }
}
