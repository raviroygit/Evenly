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

export const generateKhataBalanceMessage = (data: CustomerBalanceData): string => {
  const { name, amount, type, businessName = 'Evenly' } = data;

  const downloadUrl = getAppDownloadUrl();
  const openKhataUrl = getAppOpenKhataUrl();
  const appLink = `\n\n━━━━━━━━━━━━━━━━━━━━\nView in EvenlySplit:\n${openKhataUrl}\n\nDownload:\n${downloadUrl}`;

  if (type === 'settled') {
    return `Hi ${name},\n\nYour account with ${businessName} is settled.\n\nThank you for your business!${appLink}`;
  }

  // type 'give' = You gave to customer → customer owes you → tell them "outstanding to pay"
  if (type === 'give') {
    return `Hi ${name},\n\nReminder: You have an outstanding balance of ₹${amount} to pay.\n\nAccount: ${businessName}\n\nPlease settle at your earliest convenience.${appLink}`;
  }

  // type 'get' = You got from customer → you owe customer → tell them "in your favor"
  return `Hi ${name},\n\nYour account shows a balance of ₹${amount} in your favor.\n\nAccount: ${businessName}\n\nThank you!${appLink}`;
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
  groupId?: string
): string => {
  // Use backend open URL so link is tappable in WhatsApp/SMS – opens app or store
  const downloadUrl = getAppDownloadUrl();
  const appLink = groupId
    ? `\n\n━━━━━━━━━━━━━━━━━━━━\nView in EvenlySplit:\n${getAppOpenGroupUrl(groupId)}\n\nDownload:\n${downloadUrl}`
    : `\n\n━━━━━━━━━━━━━━━━━━━━\nView in EvenlySplit:\n${downloadUrl}\n\nDownload:\n${downloadUrl}`;

  // If no debts or credits, user is settled
  if (debts.length === 0 && credits.length === 0) {
    return `Hi ${memberName},\n\n✅ Your balance in "${groupName}" group is settled!${appLink}`;
  }

  let message = `Hi ${memberName},\n\n📊 Group: ${groupName}\n\n`;

  // Add debts (what they owe to others)
  if (debts.length > 0) {
    message += `💸 You owe:\n`;
    debts.forEach(debt => {
      message += `• ₹${debt.amount} to ${debt.owesTo}\n`;
    });
    message += '\n';
  }

  // Add credits (what others owe to them)
  if (credits.length > 0) {
    message += `💰 You are owed:\n`;
    credits.forEach(credit => {
      message += `• ₹${credit.amount} from ${credit.owesTo}\n`;
    });
    message += '\n';
  }

  message += `View details in the app.${appLink}`;
  return message;
};
