import { pgTable, uuid, text, timestamp, boolean, integer, decimal, pgEnum, index } from 'drizzle-orm/pg-core';

// Enums
export const splitTypeEnum = pgEnum('split_type', ['equal', 'percentage', 'shares', 'exact']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'declined', 'expired']);
export const organizationRoleEnum = pgEnum('organization_role', ['owner', 'admin', 'member', 'guest']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authServiceId: text('auth_service_id').notNull().unique(), // MongoDB ObjectId from auth service
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  phoneNumber: text('phone_number'), // Phone number from auth service
  preferredLanguage: text('preferred_language').default('en'), // User's preferred language for emails and notifications
  preferredCurrency: text('preferred_currency').default('INR'), // User's preferred currency (INR, USD, EUR, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organizations table (synced from auth service)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  authServiceOrgId: text('auth_service_org_id').notNull().unique(), // MongoDB ObjectId from auth service
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  displayName: text('display_name'),
  logo: text('logo'),
  plan: text('plan').notNull().default('free'), // 'free', 'pro', 'enterprise'
  maxMembers: integer('max_members').notNull().default(10),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  authServiceOrgIdIdx: index('organizations_auth_service_org_id_idx').on(table.authServiceOrgId),
  slugIdx: index('organizations_slug_idx').on(table.slug),
}));

// Organization members table (synced from auth service)
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: organizationRoleEnum('role').notNull(),
  status: text('status').notNull().default('active'), // 'active', 'suspended'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdUserIdIdx: index('organization_members_org_user_idx').on(table.organizationId, table.userId),
  userIdIdx: index('organization_members_user_id_idx').on(table.userId),
}));

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  currency: text('currency').notNull().default('USD'),
  defaultSplitType: splitTypeEnum('default_split_type').notNull().default('equal'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index('groups_organization_id_idx').on(table.organizationId),
  createdByIdx: index('groups_created_by_idx').on(table.createdBy),
}));

// Group members table
export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'admin' or 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  groupIdIdx: index('group_members_group_id_idx').on(table.groupId),
  userIdIdx: index('group_members_user_id_idx').on(table.userId),
}));

// Group invitations table
export const groupInvitations = pgTable('group_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  invitedEmail: text('invited_email').notNull(),
  invitedUserId: uuid('invited_user_id').references(() => users.id), // null if user doesn't exist yet
  status: invitationStatusEnum('status').notNull().default('pending'),
  token: text('token').notNull().unique(), // unique token for invitation link
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  declinedAt: timestamp('declined_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  groupIdIdx: index('group_invitations_group_id_idx').on(table.groupId),
  invitedEmailIdx: index('group_invitations_invited_email_idx').on(table.invitedEmail),
  tokenIdx: index('group_invitations_token_idx').on(table.token),
  statusIdx: index('group_invitations_status_idx').on(table.status),
}));

// Expenses table
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  paidBy: uuid('paid_by').notNull().references(() => users.id),
  splitType: splitTypeEnum('split_type').notNull().default('equal'),
  category: text('category').notNull().default('Other'),
  date: timestamp('date').notNull(),
  receipt: text('receipt'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index('expenses_organization_id_idx').on(table.organizationId),
  groupIdIdx: index('expenses_group_id_idx').on(table.groupId),
  paidByIdx: index('expenses_paid_by_idx').on(table.paidBy),
  dateIdx: index('expenses_date_idx').on(table.date),
}));

// Expense splits table
export const expenseSplits = pgTable('expense_splits', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseId: uuid('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  shares: integer('shares'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  expenseIdIdx: index('expense_splits_expense_id_idx').on(table.expenseId),
  userIdIdx: index('expense_splits_user_id_idx').on(table.userId),
}));

// User balances table
export const userBalances = pgTable('user_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull().default('0.00'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  groupIdIdx: index('user_balances_group_id_idx').on(table.groupId),
  userIdIdx: index('user_balances_user_id_idx').on(table.userId),
}));

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  fromUserId: uuid('from_user_id').notNull().references(() => users.id),
  toUserId: uuid('to_user_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  description: text('description'),
  paymentMethod: text('payment_method'), // 'cash', 'bank_transfer', 'card', etc.
  status: text('status').notNull().default('pending'), // 'pending', 'completed', 'cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  groupIdIdx: index('payments_group_id_idx').on(table.groupId),
  fromUserIdIdx: index('payments_from_user_id_idx').on(table.fromUserId),
  toUserIdIdx: index('payments_to_user_id_idx').on(table.toUserId),
}));

// Khata Customers table
export const khataCustomers = pgTable('khata_customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  avatar: text('avatar'), // Cloudinary URL
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index('khata_customers_organization_id_idx').on(table.organizationId),
  userIdIdx: index('khata_customers_user_id_idx').on(table.userId),
  emailIdx: index('khata_customers_email_idx').on(table.email),
}));

// Khata Transactions table
export const khataTransactions = pgTable('khata_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => khataCustomers.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'give' or 'get'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  description: text('description'),
  imageUrl: text('image_url'), // Cloudinary URL
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull(), // Running balance after this transaction
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('khata_transactions_customer_id_idx').on(table.customerId),
  userIdIdx: index('khata_transactions_user_id_idx').on(table.userId),
  transactionDateIdx: index('khata_transactions_transaction_date_idx').on(table.transactionDate),
}));


// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;

export type GroupInvitation = typeof groupInvitations.$inferSelect;
export type NewGroupInvitation = typeof groupInvitations.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type NewExpenseSplit = typeof expenseSplits.$inferInsert;

export type UserBalance = typeof userBalances.$inferSelect;
export type NewUserBalance = typeof userBalances.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type KhataCustomer = typeof khataCustomers.$inferSelect;
export type NewKhataCustomer = typeof khataCustomers.$inferInsert;

export type KhataTransaction = typeof khataTransactions.$inferSelect;
export type NewKhataTransaction = typeof khataTransactions.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

// Simplified debt type for debt calculations
export type SimplifiedDebt = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser: any;
  toUser: any;
};