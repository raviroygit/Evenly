import { ENV } from '../config/env';

// EVENLY_BACKEND_URL already includes /api (e.g. https://xxx.run.app/api) – append /app/... only
const getAppDownloadUrl = (): string => {
  const base = ENV.EVENLY_BACKEND_URL?.replace(/\/$/, '');
  return base ? `${base}/app/download` : 'https://apps.apple.com/app/id6756101586';
};

// Backend "open" URLs: tappable in WhatsApp/SMS – open app or redirect to store
const getAppOpenKhataUrl = (): string => {
  const base = ENV.EVENLY_BACKEND_URL?.replace(/\/$/, '');
  return base ? `${base}/app/open/khata` : getAppDownloadUrl();
};

const getAppOpenGroupUrl = (groupId: string): string => {
  const base = ENV.EVENLY_BACKEND_URL?.replace(/\/$/, '');
  return base ? `${base}/app/open/group/${groupId}` : getAppDownloadUrl();
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

  const downloadUrl = getAppDownloadUrl();
  const openKhataUrl = getAppOpenKhataUrl();
  const appLink = `\n\n━━━━━━━━━━━━━━━━━━━━\n${t ? t('messages.viewInApp') : 'View in EvenlySplit'}:\n${openKhataUrl}\n\n${t ? t('messages.download') : 'Download'}:\n${downloadUrl}`;

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
  // Use backend open URL so link is tappable in WhatsApp/SMS – opens app or store
  const downloadUrl = getAppDownloadUrl();
  const appLink = groupId
    ? `\n\n━━━━━━━━━━━━━━━━━━━━\n${t ? t('messages.viewInApp') : 'View in EvenlySplit'}:\n${getAppOpenGroupUrl(groupId)}\n\n${t ? t('messages.download') : 'Download'}:\n${downloadUrl}`
    : `\n\n━━━━━━━━━━━━━━━━━━━━\n${t ? t('messages.viewInApp') : 'View in EvenlySplit'}:\n${downloadUrl}\n\n${t ? t('messages.download') : 'Download'}:\n${downloadUrl}`;

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
