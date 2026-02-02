import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format');
export const positiveDecimalSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a positive decimal with max 2 decimal places');

// User validation schemas
export const createUserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  avatar: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  avatar: z.string().url().optional(),
});

// Group validation schemas
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  defaultSplitType: z.enum(['equal', 'percentage', 'shares', 'exact']).default('equal'),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters').optional(),
  defaultSplitType: z.enum(['equal', 'percentage', 'shares', 'exact']).optional(),
});

export const addGroupMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'member']).default('member'),
});

// Expense validation schemas
export const expenseSplitSchema = z.object({
  userId: uuidSchema,
  amount: positiveDecimalSchema,
  percentage: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid percentage').optional(),
  shares: z.number().int().positive('Shares must be positive').optional(),
});

export const createExpenseSchema = z.object({
  groupId: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  totalAmount: positiveDecimalSchema,
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  paidBy: uuidSchema.optional(), // Make paidBy optional - will be set to current user
  splitType: z.enum(['equal', 'percentage', 'shares', 'exact']),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long').default('Other'),
  date: z.string().datetime('Invalid date format'),
  receipt: z.string().url('Invalid receipt URL').optional(),
  splits: z.array(expenseSplitSchema).optional(), // Make splits optional - will auto-generate for current user
});

export const updateExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  totalAmount: positiveDecimalSchema.optional(),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long').optional(),
  date: z.string().datetime('Invalid date format').optional(),
  receipt: z.union([z.string().url('Invalid receipt URL'), z.null()]).optional(),
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  fromUserId: uuidSchema,
  toUserId: uuidSchema,
  groupId: uuidSchema,
  amount: positiveDecimalSchema,
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  description: z.string().max(500, 'Description too long').optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']),
  description: z.string().max(500, 'Description too long').optional(),
});

// Query validation schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
});

// Group invitation validation schemas
export const createGroupInvitationSchema = z.object({
  groupId: uuidSchema,
  invitedEmail: emailSchema,
});

export const acceptGroupInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Notification validation schemas
export const createNotificationSchema = z.object({
  userId: uuidSchema,
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  data: z.string().optional(),
});

export const updateNotificationSchema = z.object({
  isRead: z.boolean(),
});

// Balance calculation validation
export const balanceCalculationSchema = z.object({
  groupId: uuidSchema,
  userId: uuidSchema.optional(),
});

// Debt simplification validation
export const debtSimplificationSchema = z.object({
  groupId: uuidSchema,
});

// Export type inference helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddGroupMemberInput = z.infer<typeof addGroupMemberSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeSchema>;
export type CreateGroupInvitationInput = z.infer<typeof createGroupInvitationSchema>;
export type AcceptGroupInvitationInput = z.infer<typeof acceptGroupInvitationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type BalanceCalculationQuery = z.infer<typeof balanceCalculationSchema>;
export type DebtSimplificationQuery = z.infer<typeof debtSimplificationSchema>;

// Group Invitation Schemas
export const sendInvitationSchema = z.object({
  groupId: uuidSchema,
  invitedEmail: z.string().email('Invalid email address'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const declineInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type DeclineInvitationInput = z.infer<typeof declineInvitationSchema>;

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}
