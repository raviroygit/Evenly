// Direct store links so recipients can download the app immediately
const APP_STORE_URL = 'https://apps.apple.com/us/app/evenlysplit/id6756101586';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nxtgenaidev.evenly';

// Download section appended to every shared message with both store links.
const getAppDownloadLinks = (t?: (key: string) => string): string => {
  return `${t ? t('messages.download') : 'Download'}:\nApp Store: ${APP_STORE_URL}\nPlay Store: ${PLAY_STORE_URL}`;
};

export interface CustomerBalanceData {
  name: string;
  amount: string;
  type: 'give' | 'get' | 'settled';
  businessName?: string; // From user's profile
}

export interface MemberBalanceData {
  name: string;
  amount: string;
  status: 'owes' | 'gets' | 'even';
  groupName: string;
}

export const generateKhataBalanceMessage = (
  data: CustomerBalanceData,
  t?: (key: string, params?: any) => string,
  currencySymbol: string = '₹'
): string => {
  const { name, amount, type, businessName = 'Evenly' } = data;

  const appLink = `\n\n${getAppDownloadLinks(t)}`;

  if (type === 'settled') {
    return t
      ? `${t('messages.hi', { name })}\n\n${t('messages.accountSettled', { businessName })}\n\n${t('messages.thankYou')}${appLink}`
      : `Hi ${name},\n\nYour account with ${businessName} is settled.\n\nThank you for your business!${appLink}`;
  }

  if (type === 'give') {
    return t
      ? `${t('messages.hi', { name })}\n\n${t('messages.reminderOutstanding', { amount })}\n\n${t('messages.account')}: ${businessName}\n\n${t('messages.pleaseSettle')}${appLink}`
      : `Hi ${name},\n\nReminder: You have an outstanding balance of ${currencySymbol}${amount} to pay.\n\nAccount: ${businessName}\n\nPlease settle at your earliest convenience.${appLink}`;
  }

  return t
    ? `${t('messages.hi', { name })}\n\n${t('messages.balanceInFavor', { amount })}\n\n${t('messages.account')}: ${businessName}\n\n${t('messages.thankYou')}${appLink}`
    : `Hi ${name},\n\nYour account shows a balance of ${currencySymbol}${amount} in your favor.\n\nAccount: ${businessName}\n\nThank you!${appLink}`;
};

export interface SimplifiedDebt {
  owesTo: string;      // Name of person
  amount: string;      // Amount owed
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
      message += t
        ? `• ${currencySymbol}${debt.amount} ${t('messages.to')} ${debt.owesTo}\n`
        : `• ${currencySymbol}${debt.amount} to ${debt.owesTo}\n`;
    });
    message += '\n';
  }

  // Add credits (what others owe to them)
  if (credits.length > 0) {
    message += t ? `💰 ${t('messages.youAreOwed')}:\n` : `💰 You are owed:\n`;
    credits.forEach(credit => {
      message += t
        ? `• ${currencySymbol}${credit.amount} ${t('messages.from')} ${credit.owesTo}\n`
        : `• ${currencySymbol}${credit.amount} from ${credit.owesTo}\n`;
    });
    message += '\n';
  }

  message += t
    ? `${t('messages.viewDetailsInApp')}${appLink}`
    : `View details in the app.${appLink}`;
  return message;
};
