import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';
import { config } from '../config/config';
import { t, getUserLanguage, getUserCurrencySymbol } from '../i18n/emailTranslator';
import { getCurrencySymbol, DEFAULT_CURRENCY } from '../utils/currency';

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
 * @param recipientUser - Optional; when provided, subject and body use preferred language (fallback: English)
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
    const lang = getUserLanguage(recipientUser);
    const subject = isExistingUser
      ? t(lang, 'groupInvitation.subject', { groupName })
      : t(lang, 'groupInvitation.subjectNew', { groupName });

    let appDownloadLink = `${config.app.baseUrl}/api/app/download`;
    if (invitationToken) {
      appDownloadLink += `?token=${invitationToken}`;
    }

    const msg = {
      inviteHeadingExisting: t(lang, 'groupInvitation.inviteHeadingExisting'),
      inviteHeadingNew: t(lang, 'groupInvitation.inviteHeadingNew'),
      invitedByLabel: t(lang, 'groupInvitation.invitedByLabel'),
      bodyExisting: t(lang, 'groupInvitation.bodyExisting', { inviterName, groupName }),
      bodyNew: t(lang, 'groupInvitation.bodyNew', { inviterName, groupName }),
      whatYouCanDo: t(lang, 'groupInvitation.whatYouCanDo'),
      feature1: t(lang, 'groupInvitation.feature1'),
      feature2: t(lang, 'groupInvitation.feature2'),
      feature3: t(lang, 'groupInvitation.feature3'),
      feature4: t(lang, 'groupInvitation.feature4'),
      acceptInvitation: t(lang, 'groupInvitation.acceptInvitation'),
      openInBrowser: t(lang, 'groupInvitation.openInBrowser'),
      downloadBoxTitle: t(lang, 'groupInvitation.downloadBoxTitle'),
      downloadBoxText: t(lang, 'groupInvitation.downloadBoxText'),
      getTheApp: t(lang, 'groupInvitation.getTheApp'),
      worksOnDevices: t(lang, 'groupInvitation.worksOnDevices'),
      downloadNote: t(lang, 'groupInvitation.downloadNote'),
      expireNote: t(lang, 'groupInvitation.expireNote'),
      footerSent: t(lang, 'groupInvitation.footerSent'),
      copyright: t(lang, 'groupInvitation.copyright')
    };

    const htmlBody = await renderTemplate('groupInvitation.ejs', {
      groupName,
      inviterName,
      invitationLink,
      isExistingUser,
      appDownloadLink,
      msg,
      year: new Date().getFullYear()
    });

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
 * @param recipientUser - Optional; when provided, subject and body use preferred language and currency (fallback: English, default currency)
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
  const lang = getUserLanguage(recipientUser);
  const currencySymbol = recipientUser ? getUserCurrencySymbol(recipientUser) : getCurrencySymbol(DEFAULT_CURRENCY);
  const subject = t(lang, 'expenseNotification.subject', { expenseTitle: expense.title, groupName: group.name });

  const msg = {
    heading: t(lang, 'expenseNotification.heading'),
    subtitle: t(lang, 'expenseNotification.subtitle'),
    addedByLabel: t(lang, 'expenseNotification.addedByLabel'),
    groupLabel: t(lang, 'expenseNotification.groupLabel'),
    dateLabel: t(lang, 'expenseNotification.dateLabel'),
    descriptionLabel: t(lang, 'expenseNotification.descriptionLabel'),
    categoryLabel: t(lang, 'expenseNotification.categoryLabel'),
    yourShareLabel: t(lang, 'expenseNotification.yourShareLabel'),
    payToMessage: t(lang, 'expenseNotification.payToMessage', { addedByName: addedBy.name }),
    viewInApp: t(lang, 'expenseNotification.viewInApp'),
    footer: t(lang, 'expenseNotification.footer', { groupName: group.name }),
    copyright: t(lang, 'expenseNotification.copyright')
  };

  const appOpenLink = `${config.app.baseUrl}/api/app/open/expense/${group.id}`;

  const htmlBody = await renderTemplate('expenseNotification.ejs', {
    expense,
    addedBy,
    group,
    userSplit,
    appBaseUrl: config.app.baseUrl,
    appOpenLink,
    msg,
    currencySymbol,
    year: new Date().getFullYear()
  });

  await sendEmail(email, subject, htmlBody);
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
 * @param recipientUser - Optional; when provided, subject and body use preferred language and currency (fallback: English, default currency)
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
  const lang = getUserLanguage(recipientUser);
  const currencySymbol = recipientUser ? getUserCurrencySymbol(recipientUser) : getCurrencySymbol(DEFAULT_CURRENCY);

  const transactionType = transaction.type === 'give'
    ? t(lang, 'khataTransaction.youTaken')
    : t(lang, 'khataTransaction.youGiven', { userName });
  const transactionColor = transaction.type === 'give' ? '#D9433D' : '#519F51';
  const amountSign = transaction.type === 'give' ? '-' : '+';
  const amountWithSign = `${amountSign}${currencySymbol}${transaction.amount}`;
  const balanceNum = parseFloat(transaction.balance);
  const balanceType = balanceNum < 0
    ? t(lang, 'khataTransaction.totalDue', { userName })
    : balanceNum > 0
      ? t(lang, 'khataTransaction.youWillGet')
      : t(lang, 'khataTransaction.settled');
  const balanceColor = balanceNum > 0 ? '#10B981' : balanceNum < 0 ? '#EF4444' : '#666';
  const balanceAmountFormatted = balanceNum > 0
    ? `+${currencySymbol}${balanceNum.toFixed(2)}`
    : balanceNum < 0
      ? `-${currencySymbol}${Math.abs(balanceNum).toFixed(2)}`
      : `${currencySymbol}0.00`;

  const headerSubtitle = t(lang, 'khataTransaction.headerSubtitle', { userName });
  const transactionRecordedBody = t(lang, 'khataTransaction.transactionRecorded');
  const descLabel = t(lang, 'khataTransaction.description');
  const dateLabel = t(lang, 'khataTransaction.date');
  const currentBalanceLabel = t(lang, 'khataTransaction.currentBalance');
  const footerText = t(lang, 'khataTransaction.footer');
  const greeting = t(lang, 'khataTransaction.greeting', { customerName });

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
          <p>${headerSubtitle}</p>
        </div>
        
        <div class="content">
          <h3>${greeting}</h3>
          <p>${transactionRecordedBody}</p>
          
          <div class="transaction-card">
            <h3 style="margin-top: 0; color: ${transactionColor};">${transactionType}</h3>
            <div class="amount">${amountWithSign}</div>
            ${transaction.description ? `<p><strong>${descLabel}:</strong> ${transaction.description}</p>` : ''}
            <p><strong>${dateLabel}:</strong> ${new Date(transaction.date).toLocaleString('en-IN')}</p>
          </div>
          
          <h3>${currentBalanceLabel}</h3>
          <div class="balance">${balanceType}: ${balanceAmountFormatted}</div>
          
          <div class="footer">
            <p>${footerText}</p>
            <p>© ${new Date().getFullYear()} EvenlySplit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
  `;

  const subject = t(lang, 'khataTransaction.subject', { transactionType, amount: amountWithSign });
  await sendEmail(customerEmail, subject, htmlBody);
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
  }
): Promise<void> {
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
  } catch {
    // Don't throw - email failure shouldn't break the delete operation
  }
}

/**
 * Send customer added notification email.
 * @param recipientUser - Optional; when provided, subject and body use preferred language (fallback: English)
 */
export async function sendCustomerAddedEmail(
  customerEmail: string,
  customerName: string,
  userName: string,
  recipientUser?: { preferredLanguage?: string | null }
): Promise<void> {
  try {
    const lang = getUserLanguage(recipientUser);
    const subject = t(lang, 'customerAdded.subject', { userName });
    const msg = {
      greeting: t(lang, 'customerAdded.greeting', { customerName }),
      addedToKhata: t(lang, 'customerAdded.addedToKhata', { userName }),
      whatIsKhata: t(lang, 'customerAdded.whatIsKhata'),
      khataDescription: t(lang, 'customerAdded.khataDescription', { userName }),
      getStarted: t(lang, 'customerAdded.getStarted'),
      downloadApp: t(lang, 'customerAdded.downloadApp'),
      viewKhata: t(lang, 'customerAdded.viewKhata'),
      downloadAppButton: t(lang, 'customerAdded.downloadAppButton'),
      footer: t(lang, 'customerAdded.footer', { userName })
    };
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;
    const htmlBody = await renderTemplate('customerAdded.ejs', {
      customerName,
      userName,
      appOpenLink,
      msg,
      year: new Date().getFullYear()
    });
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
  finalBalance?: string
): Promise<void> {
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
  }
): Promise<void> {
  try {
    const transactionType = transaction.type === 'give' ? 'You taken' : `You given to ${userName}`;
    const transactionColor = transaction.type === 'give' ? '#D9433D' : '#519F51';
    const amountSign = transaction.type === 'give' ? '-' : '+';
    const amountWithSign = `${amountSign}₹${transaction.amount}`;
    const balanceNum = parseFloat(transaction.balance);
    const balanceType = balanceNum < 0 ? `Total Due of ${userName}` : balanceNum > 0 ? 'You will get' : 'Settled';
    const balanceColor = balanceNum > 0 ? '#10B981' : balanceNum < 0 ? '#EF4444' : '#666';
    const balanceAmountFormatted = balanceNum > 0 ? `+₹${balanceNum.toFixed(2)}` : balanceNum < 0 ? `-₹${Math.abs(balanceNum).toFixed(2)}` : '₹0.00';

    // Create smart app open link for Khata
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;

    const htmlBody = await renderTemplate('transactionUpdated.ejs', {
      customerName,
      userName,
      transaction,
      transactionType,
      transactionColor,
      amountWithSign,
      balanceNum,
      balanceType,
      balanceColor,
      balanceAmountFormatted,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `Transaction Updated: ${transactionType} ${amountWithSign}`;

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
  }
): Promise<void> {
  try {
    const transactionType = transaction.type === 'give' ? 'You taken' : `You given to ${userName}`;
    const amountSign = transaction.type === 'give' ? '-' : '+';
    const amountWithSign = `${amountSign}₹${transaction.amount}`;
    const balanceNum = parseFloat(transaction.balance);
    const balanceType = balanceNum < 0 ? `Total Due of ${userName}` : balanceNum > 0 ? 'You will get' : 'Settled';
    const balanceColor = balanceNum > 0 ? '#10B981' : balanceNum < 0 ? '#EF4444' : '#666';
    const balanceAmountFormatted = balanceNum > 0 ? `+₹${balanceNum.toFixed(2)}` : balanceNum < 0 ? `-₹${Math.abs(balanceNum).toFixed(2)}` : '₹0.00';

    // Create smart app open link for Khata
    const appOpenLink = `${config.app.baseUrl}/api/app/open/khata`;

    const htmlBody = await renderTemplate('transactionDeleted.ejs', {
      customerName,
      userName,
      transaction,
      transactionType,
      amountWithSign,
      balanceNum,
      balanceType,
      balanceColor,
      balanceAmountFormatted,
      appOpenLink,
      year: new Date().getFullYear()
    });

    const subject = `Transaction Deleted: ${transactionType} ${amountWithSign}`;

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
  memberCount: number
): Promise<void> {
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
  memberCount: number
): Promise<void> {
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
  } catch {
    // Don't throw - email failure shouldn't break the join operation
  }
}
