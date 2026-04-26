/* eslint-disable no-console */
/**
 * One-off script: sends every transactional email to a target inbox so the
 * dark/indigo theme can be visually inspected. Run via:
 *   npx tsx scripts/test-emails.ts
 *
 * Safe to delete after review.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import {
  sendWelcomeEmail,
  sendGroupInvitationEmail,
  sendExpenseNotificationEmail,
  sendExpenseUpdatedEmail,
  sendExpenseDeletedEmail,
  sendGroupJoinedEmail,
  sendNewMemberJoinedEmail,
  sendCustomerAddedEmail,
  sendCustomerDeletedEmail,
  sendTransactionUpdatedEmail,
  sendTransactionDeletedEmail,
} from '../src/services/emailService';

const TO = process.argv[2] || 'ravi140398@gmail.com';

const expense = {
  id: 'exp-1',
  title: 'Dinner at Pizza Place',
  description: 'Margherita + garlic bread + drinks',
  totalAmount: '1250.00',
  category: 'Food & Drinks',
  date: new Date().toISOString(),
};
const updatedExpense = { ...expense, totalAmount: '1500.00', description: 'Added desserts' };
const addedBy = { id: 'u-1', name: 'Aarav Sharma', email: 'aarav@example.com' };
const group = { id: 'g-1', name: 'Goa Trip 2026' };
const userSplit = { amount: '312.50' };

const txGive = {
  type: 'give' as const,
  amount: '500',
  currency: 'INR',
  description: 'Cash given for groceries',
  balance: '-200.00',
  date: new Date().toISOString(),
};
const txGet = {
  type: 'get' as const,
  amount: '300',
  currency: 'INR',
  description: 'Tea shop split',
  balance: '0.00',
  date: new Date().toISOString(),
};

const steps: Array<[string, () => Promise<void>]> = [
  ['welcome', () => sendWelcomeEmail(TO, 'Ravi')],

  ['groupInvitation (new user)', () =>
    sendGroupInvitationEmail(
      TO,
      group.name,
      addedBy.name,
      'https://evenly.example.com/invite/abc123',
      false,
      'token-abc123'
    )],

  ['groupInvitation (existing user)', () =>
    sendGroupInvitationEmail(
      TO,
      group.name,
      addedBy.name,
      'https://evenly.example.com/invite/xyz789',
      true
    )],

  ['expenseNotification', () =>
    sendExpenseNotificationEmail(TO, expense, addedBy, group, userSplit)],

  ['expenseUpdated', () =>
    sendExpenseUpdatedEmail(TO, updatedExpense, addedBy, group, { amount: '375.00' })],

  ['expenseDeleted', () =>
    sendExpenseDeletedEmail(TO, expense, addedBy, group)],

  ['groupJoined', () =>
    sendGroupJoinedEmail(TO, 'Ravi', { ...group, description: 'Beach holiday with college friends' }, 4)],

  ['newMemberJoined', () =>
    sendNewMemberJoinedEmail(TO, { name: 'Priya Patel', email: 'priya@example.com' }, group, 5)],

  ['customerAdded', () =>
    sendCustomerAddedEmail(TO, 'Ravi', 'Aarav Sharma')],

  ['customerDeleted (with balance)', () =>
    sendCustomerDeletedEmail(TO, 'Ravi', 'Aarav Sharma', '-150.50')],

  ['customerDeleted (settled)', () =>
    sendCustomerDeletedEmail(TO, 'Ravi', 'Aarav Sharma')],

  ['transactionUpdated (give)', () =>
    sendTransactionUpdatedEmail(TO, 'Ravi', 'Aarav Sharma', txGive)],

  ['transactionUpdated (get / settled)', () =>
    sendTransactionUpdatedEmail(TO, 'Ravi', 'Aarav Sharma', txGet)],

  ['transactionDeleted', () =>
    sendTransactionDeletedEmail(TO, 'Ravi', 'Aarav Sharma', txGive)],
];

(async () => {
  console.log(`Sending ${steps.length} test emails to: ${TO}\n`);
  let ok = 0, fail = 0;
  for (const [label, run] of steps) {
    try {
      await run();
      console.log(`  ✔ ${label}`);
      ok++;
    } catch (e: any) {
      console.log(`  ✘ ${label}: ${e?.message || e}`);
      fail++;
    }
    // brief pause to avoid SMTP throttling
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`\n${ok} sent, ${fail} failed.`);
  process.exit(fail ? 1 : 0);
})();
