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

  const appLink = `\n\n━━━━━━━━━━━━━━━━━━━━\nView in EvenlySplit:\nevenly://tabs/books\n\nDownload:\nhttps://apps.apple.com/app/id6756101586`;

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
  // Use deep link to open group directly in app
  const appLink = groupId
    ? `\n\n━━━━━━━━━━━━━━━━━━━━\nView in EvenlySplit:\nevenly://tabs/groups/${groupId}\n\nDownload:\nhttps://apps.apple.com/app/id6756101586`
    : `\n\n━━━━━━━━━━━━━━━━━━━━\nView in EvenlySplit:\nevenly://tabs/groups\n\nDownload:\nhttps://apps.apple.com/app/id6756101586`;

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
