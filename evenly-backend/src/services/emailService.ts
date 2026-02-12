import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';
import { config } from '../config/config';
import { t, getUserLanguage, getUserCurrencySymbol } from '../i18n/emailTranslator';

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
transporter.verify(() => {});

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
      from: `"EvenlySplit" <${config.email.auth.user}>`,
      to,
      subject,
      html: htmlBody
    };

    // Add timeout to prevent hanging
    const sendMailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000);
    });

    await Promise.race([sendMailPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      throw new Error(`SMTP_AUTH_FAILED: Cannot send email to ${to}. Please configure email credentials.`);
    }
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
 * @param invitationToken - Optional invitation token
 * @param recipientUser - Recipient user object with language preference (optional)
 */
export async function sendGroupInvitationEmail(
  email: string,
  groupName: string,
  inviterName: string,
  invitationLink: string,
  isExistingUser: boolean,
  invitationToken?: string,
  recipientUser?: { preferredLanguage?: string | null }
): Promise<void> {
  try {
    // Get user's preferred language
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';

    // Construct app download link (smart redirect that detects device)
    // Include invitation token so the app can open directly to the invitation
    let appDownloadLink = `${config.app.baseUrl}/api/app/download`;
    if (invitationToken) {
      appDownloadLink += `?token=${invitationToken}`;
    }

    // Get translated subject
    const subject = isExistingUser
      ? t(lang, 'groupInvitation.subject', { groupName })
      : t(lang, 'groupInvitation.subjectNew', { groupName });

    // Create translated HTML body
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0 0 10px 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .group-badge { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .button:hover { background: #5568d3; }
          .button-secondary { background: #6c757d; }
          .button-secondary:hover { background: #5a6268; }
          .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .steps li { margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ${t(lang, 'groupInvitation.greeting')}</h1>
          <p style="font-size: 16px; margin: 0;">${t(lang, 'groupInvitation.invitedBy', { inviterName })}</p>
        </div>

        <div class="content">
          <div class="group-badge">
            <h2 style="margin: 0 0 5px 0; color: #667eea;">"${groupName}"</h2>
            <p style="margin: 0; color: #666;">${t(lang, 'groupInvitation.onEvenly')}</p>
          </div>

          <p>${isExistingUser ? t(lang, 'groupInvitation.existingUserMessage') : t(lang, 'groupInvitation.newUserMessage')}</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" class="button">${t(lang, 'groupInvitation.acceptInvitation')}</a>
            <a href="${appDownloadLink}" class="button button-secondary">${t(lang, 'groupInvitation.downloadApp')}</a>
          </div>

          <div class="steps">
            <h3>${t(lang, 'groupInvitation.whatsNext')}</h3>
            <ol>
              <li>${t(lang, 'groupInvitation.step1')}</li>
              <li>${t(lang, 'groupInvitation.step2')}</li>
              <li>${t(lang, 'groupInvitation.step3')}</li>
            </ol>
          </div>

          <p style="margin-top: 30px;"><strong>${t(lang, 'groupInvitation.needHelp')}</strong><br>
          ${t(lang, 'groupInvitation.contactSupport')}</p>

          <div class="footer">
            <p>${t(lang, 'groupInvitation.footer', { inviterName })}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email, subject, htmlBody);
  } catch {
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
 * @param recipientUser - Recipient user object with language preference (optional)
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
  },
  recipientUser?: { preferredLanguage?: string | null; preferredCurrency?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const currencySymbol = getUserCurrencySymbol(recipientUser);
    const appOpenLink = `${config.app.baseUrl}/api/app/open/expense/${group.id}`;
    const subject = t(lang, 'expenseNotification.subject', { expenseTitle: expense.title, groupName: group.name });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .expense-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💸 ${t(lang, 'expenseNotification.greeting')}</h1>
          <p>${t(lang, 'expenseNotification.newExpenseAdded')} <strong>"${group.name}"</strong></p>
          <p>${t(lang, 'expenseNotification.by')} ${addedBy.name}</p>
        </div>
        <div class="content">
          <div class="expense-card">
            <h2 style="margin-top: 0;">${expense.title}</h2>
            ${expense.description ? `<p>${expense.description}</p>` : ''}
            <div class="info-row"><strong>${t(lang, 'expenseNotification.amount')}:</strong><span>${currencySymbol}${expense.totalAmount}</span></div>
            <div class="info-row"><strong>${t(lang, 'expenseNotification.yourShare')}:</strong><span style="color: #667eea;">${currencySymbol}${userSplit.amount}</span></div>
            <div class="info-row"><strong>${t(lang, 'expenseNotification.category')}:</strong><span>${expense.category}</span></div>
            <div class="info-row"><strong>${t(lang, 'expenseNotification.date')}:</strong><span>${new Date(expense.date).toLocaleDateString()}</span></div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appOpenLink}" class="button">${t(lang, 'expenseNotification.viewInApp')}</a>
          </div>
          <div class="footer">
            <p>${t(lang, 'expenseNotification.footer', { groupName: group.name })}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email, subject, htmlBody);
  } catch (error) {
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
    await sendEmail(config.email.supportEmail || 'support@evenly.com', emailSubject, htmlBody);

    // Send confirmation email to user
    await sendSupportConfirmationEmail(userEmail, userName, subject, message, priority, category);
  } catch (error) {
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
    await sendEmail(userEmail, confirmationSubject, htmlBody);
  } catch {
    // Don't throw error - confirmation email failure shouldn't break the main flow
  }
}

/**
 * Send Khata transaction notification email to customer.
 * @param customerEmail - Customer's email address
 * @param customerName - Customer's name
 * @param userName - User's name (who made the transaction)
 * @param transaction - Transaction data; balance must be from customer's perspective (negative = customer owes, positive = customer will get)
 * @param recipientUser - Recipient user object with language preference (optional)
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
  },
  recipientUser?: { preferredLanguage?: string | null; preferredCurrency?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const currencySymbol = getUserCurrencySymbol(recipientUser);
    const transactionType = transaction.type === 'give' ? t(lang, 'khataTransaction.youTaken') : t(lang, 'khataTransaction.youGiven', { userName });
    const transactionColor = transaction.type === 'give' ? '#D9433D' : '#519F51';
    const amountSign = transaction.type === 'give' ? '-' : '+';
    const amountWithSign = `${amountSign}${currencySymbol}${transaction.amount}`;
    const balanceNum = parseFloat(transaction.balance);
    const balanceType = balanceNum < 0 ? t(lang, 'khataTransaction.totalDue', { userName }) : balanceNum > 0 ? t(lang, 'khataTransaction.youWillGet') : t(lang, 'khataTransaction.settled');
    const balanceColor = balanceNum > 0 ? '#10B981' : balanceNum < 0 ? '#EF4444' : '#666';
    const balanceAmountFormatted = balanceNum > 0 ? `+${currencySymbol}${balanceNum.toFixed(2)}` : balanceNum < 0 ? `-${currencySymbol}${Math.abs(balanceNum).toFixed(2)}` : `${currencySymbol}0.00`;
    const subject = t(lang, 'khataTransaction.subject', { transactionType, amount: amountWithSign });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .transaction-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${transactionColor}; }
          .amount { font-size: 28px; font-weight: bold; color: ${transactionColor}; margin: 10px 0; }
          .balance { font-size: 20px; font-weight: bold; color: ${balanceColor}; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>📝 ${t(lang, 'khataTransaction.greeting', { customerName })}</h2>
        </div>
        <div class="content">
          <p>${t(lang, 'khataTransaction.transactionRecorded')}</p>
          <div class="transaction-card">
            <h3 style="margin-top: 0; color: ${transactionColor};">${transactionType}</h3>
            <div class="amount">${amountWithSign}</div>
            ${transaction.description ? `<p><strong>${t(lang, 'khataTransaction.description')}:</strong> ${transaction.description}</p>` : ''}
            <p><strong>${t(lang, 'khataTransaction.date')}:</strong> ${new Date(transaction.date).toLocaleString()}</p>
          </div>
          <h3>${t(lang, 'khataTransaction.currentBalance')}</h3>
          <div class="balance">${balanceType}: ${balanceAmountFormatted}</div>
          <div class="footer">
            <p>${t(lang, 'khataTransaction.footer')}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(customerEmail, subject, htmlBody);
  } catch (error) {
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
  },
  recipientUser?: { preferredLanguage?: string | null; preferredCurrency?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const currencySymbol = getUserCurrencySymbol(recipientUser);
    const appOpenLink = `${config.app.baseUrl}/api/app/open/expense/${group.id}`;
    const subject = t(lang, 'expenseUpdated.subject', { expenseTitle: expense.title, groupName: group.name });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .expense-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; background: #f39c12; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✏️ ${t(lang, 'expenseUpdated.greeting')}</h1>
          <p>${t(lang, 'expenseUpdated.expenseUpdated')} <strong>"${group.name}"</strong></p>
          <p>${t(lang, 'expenseUpdated.by')} ${updatedBy.name}</p>
        </div>
        <div class="content">
          <div class="expense-card">
            <h2 style="margin-top: 0;">${expense.title}</h2>
            ${expense.description ? `<p>${expense.description}</p>` : ''}
            <div class="info-row"><strong>${t(lang, 'expenseUpdated.amount')}:</strong><span>${currencySymbol}${expense.totalAmount}</span></div>
            <div class="info-row"><strong>${t(lang, 'expenseUpdated.yourShare')}:</strong><span style="color: #f39c12;">${currencySymbol}${userSplit.amount}</span></div>
            <div class="info-row"><strong>${t(lang, 'expenseUpdated.category')}:</strong><span>${expense.category}</span></div>
            <div class="info-row"><strong>${t(lang, 'expenseUpdated.date')}:</strong><span>${new Date(expense.date).toLocaleDateString()}</span></div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appOpenLink}" class="button">${t(lang, 'expenseUpdated.viewInApp')}</a>
          </div>
          <div class="footer">
            <p>${t(lang, 'expenseUpdated.footer', { groupName: group.name })}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email, subject, htmlBody);
  } catch {
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
  },
  recipientUser?: { preferredLanguage?: string | null; preferredCurrency?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const currencySymbol = getUserCurrencySymbol(recipientUser);
    const appOpenLink = `${config.app.baseUrl}/api/app/open/group/${group.id}`;
    const subject = t(lang, 'expenseDeleted.subject', { expenseTitle: expense.title, groupName: group.name });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .expense-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🗑️ ${t(lang, 'expenseDeleted.greeting')}</h1>
          <p>${t(lang, 'expenseDeleted.expenseDeleted')} <strong>"${group.name}"</strong></p>
          <p>${t(lang, 'expenseDeleted.by')} ${deletedBy.name}</p>
        </div>
        <div class="content">
          <div class="expense-card">
            <h2 style="margin-top: 0;">${expense.title}</h2>
            ${expense.description ? `<p>${expense.description}</p>` : ''}
            <div class="info-row"><strong>${t(lang, 'expenseDeleted.amount')}:</strong><span>${currencySymbol}${expense.totalAmount}</span></div>
            <div class="info-row"><strong>${t(lang, 'expenseDeleted.category')}:</strong><span>${expense.category}</span></div>
            <div class="info-row"><strong>${t(lang, 'expenseDeleted.date')}:</strong><span>${new Date(expense.date).toLocaleDateString()}</span></div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appOpenLink}" class="button">${t(lang, 'expenseDeleted.viewGroup')}</a>
          </div>
          <div class="footer">
            <p>${t(lang, 'expenseDeleted.footer', { groupName: group.name })}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email, subject, htmlBody);
  } catch {
    // Don't throw - email failure shouldn't break the delete operation
  }
}

/**
 * Send customer added notification email.
 */
export async function sendCustomerAddedEmail(
  customerEmail: string,
  customerName: string,
  userName: string,
  recipientUser?: { preferredLanguage?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;
    const subject = t(lang, 'customerAdded.subject', { userName });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📖 ${t(lang, 'customerAdded.greeting', { customerName })}</h1>
        </div>
        <div class="content">
          <p>${t(lang, 'customerAdded.addedToKhata', { userName })}</p>
          <div class="info-box">
            <h3>${t(lang, 'customerAdded.whatIsKhata')}</h3>
            <p>${t(lang, 'customerAdded.khataDescription', { userName })}</p>
          </div>
          <h3>${t(lang, 'customerAdded.getStarted')}</h3>
          <p>${t(lang, 'customerAdded.downloadApp')}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appOpenLink}" class="button">${t(lang, 'customerAdded.viewKhata')}</a>
            <a href="${config.app.baseUrl}/api/app/download" class="button" style="background: #6c757d;">${t(lang, 'customerAdded.downloadAppButton')}</a>
          </div>
          <div class="footer">
            <p>${t(lang, 'customerAdded.footer', { userName })}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(customerEmail, subject, htmlBody);
  } catch {
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
  finalBalance?: string,
  recipientUser?: { preferredLanguage?: string | null; preferredCurrency?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const currencySymbol = getUserCurrencySymbol(recipientUser);
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;
    const subject = t(lang, 'customerDeleted.subject', { userName });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📕 ${t(lang, 'customerDeleted.greeting', { customerName })}</h1>
        </div>
        <div class="content">
          <p>${t(lang, 'customerDeleted.accountClosed', { userName })}</p>
          ${finalBalance ? `
          <div class="info-box">
            <h3>${t(lang, 'customerDeleted.finalBalance')}</h3>
            <p style="font-size: 24px; font-weight: bold;">${currencySymbol}${finalBalance}</p>
          </div>
          ` : `<p>${t(lang, 'customerDeleted.noBalance')}</p>`}
          <p>${t(lang, 'customerDeleted.thankYou')}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appOpenLink}" class="button">${t(lang, 'customerDeleted.viewKhata')}</a>
          </div>
          <div class="footer">
            <p>${t(lang, 'customerDeleted.footer', { userName })}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(customerEmail, subject, htmlBody);
  } catch {
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
  },
  recipientUser?: { preferredLanguage?: string | null; preferredCurrency?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const currencySymbol = getUserCurrencySymbol(recipientUser);
    const transactionType = transaction.type === 'give' ? t(lang, 'transactionUpdated.youTaken') : t(lang, 'transactionUpdated.youGiven', { userName });
    const transactionColor = transaction.type === 'give' ? '#D9433D' : '#519F51';
    const amountSign = transaction.type === 'give' ? '-' : '+';
    const amountWithSign = `${amountSign}${currencySymbol}${transaction.amount}`;
    const balanceNum = parseFloat(transaction.balance);
    const balanceType = balanceNum < 0 ? t(lang, 'transactionUpdated.totalDue', { userName }) : balanceNum > 0 ? t(lang, 'transactionUpdated.youWillGet') : t(lang, 'transactionUpdated.settled');
    const balanceColor = balanceNum > 0 ? '#10B981' : balanceNum < 0 ? '#EF4444' : '#666';
    const balanceAmountFormatted = balanceNum > 0 ? `+${currencySymbol}${balanceNum.toFixed(2)}` : balanceNum < 0 ? `-${currencySymbol}${Math.abs(balanceNum).toFixed(2)}` : `${currencySymbol}0.00`;
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;
    const subject = t(lang, 'transactionUpdated.subject', { transactionType, amount: amountWithSign });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .transaction-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${transactionColor}; }
          .amount { font-size: 28px; font-weight: bold; color: ${transactionColor}; margin: 10px 0; }
          .balance { font-size: 20px; font-weight: bold; color: ${balanceColor}; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>✏️ ${t(lang, 'transactionUpdated.greeting', { customerName })}</h2>
          <p>${t(lang, 'transactionUpdated.updatedBy', { userName })}</p>
        </div>
        <div class="content">
          <p>${t(lang, 'transactionUpdated.transactionUpdated')}</p>
          <div class="transaction-card">
            <h3 style="margin-top: 0; color: ${transactionColor};">${transactionType}</h3>
            <div class="amount">${amountWithSign}</div>
            ${transaction.description ? `<p><strong>${t(lang, 'transactionUpdated.description')}:</strong> ${transaction.description}</p>` : ''}
            <p><strong>${t(lang, 'transactionUpdated.date')}:</strong> ${new Date(transaction.date).toLocaleString()}</p>
          </div>
          <h3>${t(lang, 'transactionUpdated.currentBalance')}</h3>
          <div class="balance">${balanceType}: ${balanceAmountFormatted}</div>
          <div class="footer">
            <p>${t(lang, 'transactionUpdated.footer')}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(customerEmail, subject, htmlBody);
  } catch {
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
  },
  recipientUser?: { preferredLanguage?: string | null; preferredCurrency?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const currencySymbol = getUserCurrencySymbol(recipientUser);
    const transactionType = transaction.type === 'give' ? t(lang, 'transactionDeleted.youTaken') : t(lang, 'transactionDeleted.youGiven', { userName });
    const amountSign = transaction.type === 'give' ? '-' : '+';
    const amountWithSign = `${amountSign}${currencySymbol}${transaction.amount}`;
    const balanceNum = parseFloat(transaction.balance);
    const balanceType = balanceNum < 0 ? t(lang, 'transactionDeleted.totalDue', { userName }) : balanceNum > 0 ? t(lang, 'transactionDeleted.youWillGet') : t(lang, 'transactionDeleted.settled');
    const balanceColor = balanceNum > 0 ? '#10B981' : balanceNum < 0 ? '#EF4444' : '#666';
    const balanceAmountFormatted = balanceNum > 0 ? `+${currencySymbol}${balanceNum.toFixed(2)}` : balanceNum < 0 ? `-${currencySymbol}${Math.abs(balanceNum).toFixed(2)}` : `${currencySymbol}0.00`;
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;
    const subject = t(lang, 'transactionDeleted.subject', { transactionType, amount: amountWithSign });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .transaction-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #e74c3c; }
          .amount { font-size: 28px; font-weight: bold; color: #e74c3c; margin: 10px 0; }
          .balance { font-size: 20px; font-weight: bold; color: ${balanceColor}; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🗑️ ${t(lang, 'transactionDeleted.greeting', { customerName })}</h2>
          <p>${t(lang, 'transactionDeleted.deletedBy', { userName })}</p>
        </div>
        <div class="content">
          <p>${t(lang, 'transactionDeleted.transactionDeleted')}</p>
          <div class="transaction-card">
            <h3 style="margin-top: 0; color: #e74c3c;">${transactionType}</h3>
            <div class="amount">${amountWithSign}</div>
            ${transaction.description ? `<p><strong>${t(lang, 'transactionDeleted.description')}:</strong> ${transaction.description}</p>` : ''}
            <p><strong>${t(lang, 'transactionDeleted.date')}:</strong> ${new Date(transaction.date).toLocaleString()}</p>
          </div>
          <h3>${t(lang, 'transactionDeleted.currentBalance')}</h3>
          <div class="balance">${balanceType}: ${balanceAmountFormatted}</div>
          <div class="footer">
            <p>${t(lang, 'transactionDeleted.footer')}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(customerEmail, subject, htmlBody);
  } catch {
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
  memberCount: number,
  recipientUser?: { preferredLanguage?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const appOpenLink = `${config.app.baseUrl}/api/app/open/group/${group.id}`;
    const subject = t(lang, 'groupJoined.subject', { groupName: group.name });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .group-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .button { display: inline-block; background: #10b981; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ${t(lang, 'groupJoined.greeting')}</h1>
          <p style="font-size: 18px;">${t(lang, 'groupJoined.joinedSuccessfully')} <strong>"${group.name}"</strong> ${t(lang, 'groupJoined.onEvenly')}</p>
        </div>
        <div class="content">
          <div class="group-info">
            <h2 style="margin-top: 0;">${group.name}</h2>
            ${group.description ? `<p><strong>${t(lang, 'groupJoined.groupDescription')}:</strong> ${group.description}</p>` : ''}
            <p><strong>${memberCount > 1 ? t(lang, 'groupJoined.members_plural', { memberCount }) : t(lang, 'groupJoined.members', { memberCount })}</strong></p>
          </div>
          <h3>${t(lang, 'groupJoined.getStarted')}</h3>
          <p>${t(lang, 'groupJoined.startTracking')}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appOpenLink}" class="button">${t(lang, 'groupJoined.viewGroup')}</a>
            <a href="${config.app.baseUrl}/api/app/download" class="button" style="background: #6c757d;">${t(lang, 'groupJoined.downloadApp')}</a>
          </div>
          <div class="footer">
            <p>${t(lang, 'groupJoined.footer', { groupName: group.name })}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(userEmail, subject, htmlBody);
  } catch {
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
  memberCount: number,
  recipientUser?: { preferredLanguage?: string | null }
): Promise<void> {
  try {
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';
    const appOpenLink = `${config.app.baseUrl}/api/app/open/group/${group.id}`;
    const subject = t(lang, 'newMemberJoined.subject', { newMemberName: newMember.name, groupName: group.name });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .member-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>👋 ${t(lang, 'newMemberJoined.greeting')}</h1>
        </div>
        <div class="content">
          <p><strong>${newMember.name}</strong> ${t(lang, 'newMemberJoined.memberJoined')} <strong>"${group.name}"</strong></p>
          <div class="member-info">
            <h3 style="margin-top: 0;">${newMember.name}</h3>
            <p>${t(lang, 'newMemberJoined.newMemberEmail', { newMemberEmail: newMember.email })}</p>
          </div>
          <p>${t(lang, 'newMemberJoined.groupNow')} <strong>${memberCount > 1 ? t(lang, 'newMemberJoined.members_plural', { memberCount }) : t(lang, 'newMemberJoined.members', { memberCount })}</strong></p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appOpenLink}" class="button">${t(lang, 'newMemberJoined.viewGroup')}</a>
          </div>
          <div class="footer">
            <p>${t(lang, 'newMemberJoined.footer', { groupName: group.name })}</p>
            <p>${t(lang, 'common.copyrightFooter', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(existingMemberEmail, subject, htmlBody);
  } catch {
    // Don't throw - email failure shouldn't break the join operation
  }
}
