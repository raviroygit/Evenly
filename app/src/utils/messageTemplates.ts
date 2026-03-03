// Single smart download link with OG metadata for rich WhatsApp preview
const DOWNLOAD_URL = 'https://evenlysplit.nxtgenaidev.com/download';

// Download section appended to every shared message.
// Uses a single link so WhatsApp shows a rich preview with the app icon.
const getAppDownloadLinks = (t?: (key: string) => string): string => {
  return `${t ? t('messages.download') : 'Download'} EvenlySplit:\n${DOWNLOAD_URL}`;
};

export interface CustomerBalanceData {
  name: string;
  amount: string;
  type: 'give' | 'get' | 'settled';
  businessName?: string; // From user's profile
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
}

export interface MemberBalanceData {
  name: string;
  amount: string;
  status: 'owes' | 'gets' | 'even';
  groupName: string;
}

// Format contact details as "(phone, email)" or "(phone)" or "(email)" or ""
const formatContactInfo = (phone?: string, email?: string): string => {
  const parts: string[] = [];
  if (phone) parts.push(phone);
  if (email) parts.push(email);
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
};

// Build "Requested by:" block with name, phone, email on separate lines
const buildSenderBlock = (
  t: ((key: string, params?: any) => string) | undefined,
  senderName?: string,
  senderPhone?: string,
  senderEmail?: string
): string => {
  if (!senderName) return '';
  const requestedBy = t ? t('messages.requestedBy') || 'Requested by:' : 'Requested by:';
  const phoneLabel = t ? t('messages.phone') || 'Phone:' : 'Phone:';
  const emailLabel = t ? t('messages.email') || 'Email:' : 'Email:';

  let block = `\n\n${requestedBy}\n${senderName}`;
  if (senderPhone) block += `\n${phoneLabel} ${senderPhone}`;
  if (senderEmail) block += `\n${emailLabel} ${senderEmail}`;
  return block;
};

export const generateKhataBalanceMessage = (
  data: CustomerBalanceData,
  t?: (key: string, params?: any) => string,
  currencySymbol: string = '₹'
): string => {
  const { name, amount, type, businessName = 'Evenly', senderName, senderEmail, senderPhone } = data;

  const appLink = `\n\n${getAppDownloadLinks(t)}`;
  const senderBlock = buildSenderBlock(t, senderName, senderPhone, senderEmail);
  const thankYouTeam = t ? t('messages.thankYouTeam') || 'Thank you,\nTeam EvenlySplit' : 'Thank you,\nTeam EvenlySplit';

  if (type === 'settled') {
    const settledBy = senderName || businessName;
    return t
      ? `${t('messages.hi', { name })},\n\n${t('messages.accountSettled', { businessName: settledBy })}${senderBlock}\n\n${thankYouTeam}${appLink}`
      : `Hi ${name},\n\nYour account with ${settledBy} is settled.${senderBlock}\n\n${thankYouTeam}${appLink}`;
  }

  if (type === 'give') {
    return t
      ? `${t('messages.hi', { name })},\n\n${t('messages.reminderOutstanding', { amount: `${currencySymbol}${amount}` })}${senderBlock}\n\n${t('messages.pleaseSettle')}\n\n${thankYouTeam}${appLink}`
      : `Hi ${name},\n\nThis is a friendly reminder that you have an outstanding balance of ${currencySymbol}${amount}.${senderBlock}\n\nKindly settle the amount at your earliest convenience.\n\n${thankYouTeam}${appLink}`;
  }

  return t
    ? `${t('messages.hi', { name })},\n\n${t('messages.balanceInFavor', { amount: `${currencySymbol}${amount}` })}${senderBlock}\n\n${thankYouTeam}${appLink}`
    : `Hi ${name},\n\nYour account shows a balance of ${currencySymbol}${amount} in your favor.${senderBlock}\n\n${thankYouTeam}${appLink}`;
};

export interface SimplifiedDebt {
  owesTo: string;      // Name of person
  amount: string;      // Amount owed
  email?: string;      // Email of person
  phone?: string;      // Phone number of person
}

export const generateGroupBalanceMessage = (
  memberName: string,
  groupName: string,
  debts: SimplifiedDebt[],
  credits: SimplifiedDebt[],
  groupId?: string,
  t?: (key: string, params?: any) => string,
  currencySymbol: string = '₹'
): string => {
  const appLink = `\n\n${getAppDownloadLinks(t)}`;

  // If no debts or credits, user is settled
  if (debts.length === 0 && credits.length === 0) {
    return t
      ? `${t('messages.hi', { name: memberName })}\n\n✅ ${t('messages.balanceSettled', { groupName })}\n${appLink}`
      : `Hi ${memberName},\n\n✅ Your balance in "${groupName}" group is settled!${appLink}`;
  }

  let message = t
    ? `${t('messages.hi', { name: memberName })}\n\n📊 ${t('messages.group')}: ${groupName}\n\n`
    : `Hi ${memberName},\n\n📊 Group: ${groupName}\n\n`;

  // Add debts (what they owe to others)
  if (debts.length > 0) {
    message += t ? `💸 ${t('messages.youOwe')}:\n` : `💸 You owe:\n`;
    debts.forEach(debt => {
      const contact = formatContactInfo(debt.phone, debt.email);
      message += t
        ? `• ${currencySymbol}${debt.amount} ${t('messages.to')} ${debt.owesTo}${contact}\n`
        : `• ${currencySymbol}${debt.amount} to ${debt.owesTo}${contact}\n`;
    });
    message += '\n';
  }

  // Add credits (what others owe to them)
  if (credits.length > 0) {
    message += t ? `💰 ${t('messages.youAreOwed')}:\n` : `💰 You are owed:\n`;
    credits.forEach(credit => {
      const contact = formatContactInfo(credit.phone, credit.email);
      message += t
        ? `• ${currencySymbol}${credit.amount} ${t('messages.from')} ${credit.owesTo}${contact}\n`
        : `• ${currencySymbol}${credit.amount} from ${credit.owesTo}${contact}\n`;
    });
    message += '\n';
  }

  const thankYouTeam = t ? t('messages.thankYouTeam') || 'Thank you,\nTeam EvenlySplit' : 'Thank you,\nTeam EvenlySplit';
  message += t
    ? `${t('messages.viewDetailsInApp')}\n\n${thankYouTeam}${appLink}`
    : `View details in the app.\n\n${thankYouTeam}${appLink}`;
  return message;
};
