import { eq, and, desc, sum, count } from 'drizzle-orm';
import { db, expenses, expenseSplits, userBalances, groups, users, groupMembers, type Expense, type NewExpense, type ExpenseSplit, type NewExpenseSplit } from '../db';
import { GroupService } from './groupService';
import { UserService } from './userService';
import { NotFoundError, ForbiddenError, ValidationError, DatabaseError } from '../utils/errors';
import { sendExpenseNotificationEmail } from './emailService';
import { EnhancedExpense, ExpenseShare, CurrentUserShare, NetBalance } from '../types';

export class ExpenseService {
  /**
   * Create a new expense with splits
   */
  static async createExpense(
    expenseData: {
      groupId: string;
      title: string;
      description?: string;
      totalAmount: string;
      currency?: string;
      paidBy?: string; // Make paidBy optional
      splitType: 'equal' | 'percentage' | 'shares' | 'exact';
      category: string;
      date: string;
      receipt?: string;
      splits?: Array<{
        userId: string;
        amount: string;
        percentage?: string;
        shares?: number;
      }>;
    },
    createdBy: string
  ): Promise<Expense & { splits: (ExpenseSplit & { user: any })[] }> {
    try {
      // Set paidBy to current user if not provided
      const paidBy = expenseData.paidBy || createdBy;
      
      // Get group to extract organizationId
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, expenseData.groupId));

      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // Validate group membership
      const isMember = await GroupService.isUserGroupMember(expenseData.groupId, createdBy);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // Validate paid by user is a group member
      const isPaidByMember = await GroupService.isUserGroupMember(expenseData.groupId, paidBy);
      if (!isPaidByMember) {
        throw new ValidationError('The person who paid must be a group member');
      }

      // Auto-generate splits for all group members if not provided
      let splits = expenseData.splits;
      if (!splits) {
        // Get all active group members
        const activeMembers = await db
          .select({
            userId: groupMembers.userId,
          })
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, expenseData.groupId),
            eq(groupMembers.isActive, true)
          ));

        if (activeMembers.length === 0) {
          throw new ValidationError('No active members found in the group');
        }

        // Create equal splits for all group members
        const splitAmount = parseFloat(expenseData.totalAmount) / activeMembers.length;
        splits = activeMembers.map(member => ({
          userId: member.userId,
          amount: splitAmount.toFixed(2),
        }));
      }

      // Validate splits
      await this.validateExpenseSplits({ ...expenseData, splits });

      // Create expense
      const newExpense: NewExpense = {
        organizationId: group.organizationId,
        groupId: expenseData.groupId,
        title: expenseData.title,
        description: expenseData.description,
        totalAmount: expenseData.totalAmount,
        currency: expenseData.currency || 'INR',
        paidBy: paidBy, // Use the resolved paidBy (current user if not provided)
        splitType: expenseData.splitType,
        category: expenseData.category,
        date: new Date(expenseData.date),
        receipt: expenseData.receipt,
      };

      const [createdExpense] = await db
        .insert(expenses)
        .values(newExpense)
        .returning();

      // Create expense splits
      const expenseSplitData: NewExpenseSplit[] = splits.map(split => ({
        expenseId: createdExpense.id,
        userId: split.userId,
        amount: split.amount,
        percentage: split.percentage ? split.percentage : undefined,
        shares: split.shares,
      }));

      const createdSplits = await db
        .insert(expenseSplits)
        .values(expenseSplitData)
        .returning();

      // Update user balances
      await this.updateUserBalances(createdExpense.id);

      // Get expense with splits and user details
      const expenseWithSplits = await this.getExpenseById(createdExpense.id);
      if (!expenseWithSplits) {
        throw new DatabaseError('Failed to retrieve created expense');
      }

      // Send email notifications to other group members (never fail expense creation)
      try {
        await this.sendExpenseNotifications(expenseWithSplits, createdBy);
      } catch (emailError) {
        console.error('[ExpenseService] sendExpenseNotifications failed:', emailError instanceof Error ? emailError.message : String(emailError));
        if (emailError instanceof Error && emailError.stack) {
          console.error('[ExpenseService] stack:', emailError.stack);
        }
      }

      return expenseWithSplits;
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof ValidationError) {
        throw error;
      }
      // Log original error so it appears in GCP logs
      console.error('[ExpenseService] createExpense failed:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('[ExpenseService] stack:', error.stack);
      }
      throw new DatabaseError('Failed to create expense');
    }
  }

  /**
   * Get expense by ID with splits
   */
  static async getExpenseById(expenseId: string, organizationId?: string): Promise<(Expense & { splits: (ExpenseSplit & { user: any })[] }) | null> {
    try {
      // Validate organizationId if provided
      if (organizationId) {
        const [expense] = await db
          .select()
          .from(expenses)
          .where(and(eq(expenses.id, expenseId), eq(expenses.organizationId, organizationId)))
          .limit(1);

        if (!expense) {
          throw new NotFoundError('Expense not found or does not belong to your organization');
        }
      }

      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, expenseId))
        .limit(1);

      if (!expense) {
        return null;
      }

      // Get expense splits with user details (include preferredLanguage/preferredCurrency for email i18n)
      const splits = await db
        .select({
          id: expenseSplits.id,
          expenseId: expenseSplits.expenseId,
          userId: expenseSplits.userId,
          amount: expenseSplits.amount,
          percentage: expenseSplits.percentage,
          shares: expenseSplits.shares,
          createdAt: expenseSplits.createdAt,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            avatar: users.avatar,
            preferredLanguage: users.preferredLanguage,
            preferredCurrency: users.preferredCurrency,
          },
        })
        .from(expenseSplits)
        .innerJoin(users, eq(expenseSplits.userId, users.id))
        .where(eq(expenseSplits.expenseId, expenseId));

      return {
        ...expense,
        splits,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch expense');
    }
  }

  /**
   * Calculate enhanced expense display data for a specific user
   */
  private static calculateEnhancedExpenseData(
    expense: Expense & { splits: (ExpenseSplit & { user: any })[]; paidByUser: any },
    currentUserId: string,
    currentUserEmail?: string
  ): EnhancedExpense {
    // Simple comparison - if the current user ID matches the expense paidBy ID
    const isPaidByCurrentUser = expense.paidBy === currentUserId;
    // Calculate paidByDisplay
    const paidByDisplay = isPaidByCurrentUser 
      ? 'You paid' 
      : `${expense.paidByUser?.name?.split(' ')[0] || 'Unknown'} paid`;

    // Calculate sharesList
    const sharesList: ExpenseShare[] = expense.splits.map(split => {
      const isCurrentUser = split.userId === currentUserId;
      const isPaidByThisUser = expense.paidBy === split.userId;
      
      return {
        userId: split.userId,
        userName: split.user?.name || 'Unknown',
        amount: parseFloat(split.amount),
        status: isPaidByThisUser ? 'gets' : 'owes',
        isCurrentUser
      };
    });

    // Calculate currentUserShare
    const currentUserSplit = expense.splits.find(split => split.userId === currentUserId);
    let currentUserShare: CurrentUserShare;
    if (!currentUserSplit) {
      currentUserShare = {
        amount: 0,
        status: 'even',
        color: '#6B7280'
      };
    } else if (isPaidByCurrentUser) {
      // User paid, so they lent money
      const totalAmount = typeof expense.totalAmount === 'string' ? parseFloat(expense.totalAmount) : expense.totalAmount;
      const lentAmount = totalAmount - parseFloat(currentUserSplit.amount);
      currentUserShare = {
        amount: lentAmount,
        status: 'lent',
        color: '#10B981' // Green
      };
    } else {
      // Others paid, so user borrowed
      currentUserShare = {
        amount: parseFloat(currentUserSplit.amount),
        status: 'borrowed',
        color: '#EF4444' // Red
      };
    }

    // Calculate netBalance (same as currentUserShare for now)
    const netBalance: NetBalance = {
      amount: currentUserShare.amount,
      status: currentUserShare.status === 'lent' ? 'positive' : 
              currentUserShare.status === 'borrowed' ? 'negative' : 'zero',
      text: currentUserShare.status === 'lent' ? `you lent ₹${currentUserShare.amount.toFixed(2)}` :
            currentUserShare.status === 'borrowed' ? `you borrowed ₹${currentUserShare.amount.toFixed(2)}` :
            'even',
      color: currentUserShare.color
    };
    return {
      ...expense,
      totalAmount: parseFloat(expense.totalAmount),
      description: expense.description || undefined,
      receipt: expense.receipt || undefined,
      splits: expense.splits?.map(split => ({
        ...split,
        amount: parseFloat(split.amount),
        percentage: split.percentage ? parseFloat(split.percentage) : undefined,
        shares: split.shares || undefined,
      })),
      paidByDisplay,
      sharesList,
      currentUserShare,
      netBalance
    };
  }

  /**
   * Get expenses for a group
   */
  static async getGroupExpenses(
    groupId: string,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      organizationId?: string;
    } = {}
  ): Promise<{
    expenses: EnhancedExpense[];
    total: number;
  }> {
    try {
      // Validate organizationId if provided
      if (options.organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, groupId), eq(groups.organizationId, options.organizationId)))
          .limit(1);

        if (!group) {
          throw new NotFoundError('Group not found or does not belong to your organization');
        }
      }

      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // Get current user info for better comparison
      const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = options;
      const offset = (page - 1) * limit;

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(expenses)
        .where(eq(expenses.groupId, groupId));

      // Get expenses with paidBy user information
      const expensesList = await db
        .select({
          id: expenses.id,
          organizationId: expenses.organizationId,
          groupId: expenses.groupId,
          title: expenses.title,
          description: expenses.description,
          totalAmount: expenses.totalAmount,
          currency: expenses.currency,
          paidBy: expenses.paidBy,
          splitType: expenses.splitType,
          category: expenses.category,
          date: expenses.date,
          receipt: expenses.receipt,
          createdAt: expenses.createdAt,
          updatedAt: expenses.updatedAt,
          paidByUser: {
            id: users.id,
            email: users.email,
            name: users.name,
            avatar: users.avatar || undefined,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          },
        })
        .from(expenses)
        .innerJoin(users, eq(expenses.paidBy, users.id))
        .where(eq(expenses.groupId, groupId))
        .orderBy(sortOrder === 'desc' ? desc(expenses.date) : expenses.date)
        .limit(limit)
        .offset(offset);

      // Get splits for each expense
      const expensesWithSplits = await Promise.all(
        expensesList.map(async (expense) => {
          const splits = await db
            .select({
              id: expenseSplits.id,
              expenseId: expenseSplits.expenseId,
              userId: expenseSplits.userId,
              amount: expenseSplits.amount,
              percentage: expenseSplits.percentage,
              shares: expenseSplits.shares,
              createdAt: expenseSplits.createdAt,
              user: {
                id: users.id,
                email: users.email,
                name: users.name,
                avatar: users.avatar || undefined,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
              },
            })
            .from(expenseSplits)
            .innerJoin(users, eq(expenseSplits.userId, users.id))
            .where(eq(expenseSplits.expenseId, expense.id));

          return {
            ...expense,
            splits,
            paidByUser: expense.paidByUser,
          };
        })
      );

      // Enhance expenses with display data for the current user
      const enhancedExpenses = expensesWithSplits.map(expense => {
        try {
          return this.calculateEnhancedExpenseData(expense, userId, currentUser[0]?.email);
        } catch (error) {
          // Return a fallback enhanced expense
          return {
            ...expense,
            totalAmount: parseFloat(expense.totalAmount),
            description: expense.description || undefined,
            receipt: expense.receipt || undefined,
            paidByUser: expense.paidByUser ? {
              ...expense.paidByUser,
              avatar: expense.paidByUser.avatar || undefined,
            } : undefined,
            splits: expense.splits?.map(split => ({
              ...split,
              amount: parseFloat(split.amount),
              percentage: split.percentage ? parseFloat(split.percentage) : undefined,
              shares: split.shares || undefined,
              user: split.user ? {
                ...split.user,
                avatar: split.user.avatar || undefined,
              } : undefined,
            })),
            paidByDisplay: expense.paidByUser?.name ? `${expense.paidByUser.name.split(' ')[0]} paid` : 'Unknown paid',
            sharesList: [],
            currentUserShare: { amount: 0, status: 'even' as const, color: '#6B7280' },
            netBalance: { amount: 0, status: 'zero' as const, text: 'even', color: '#6B7280' }
          };
        }
      });

      return {
        expenses: enhancedExpenses,
        total: totalResult.count,
      };
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch group expenses');
    }
  }

  /**
   * Update expense
   */
  static async updateExpense(
    expenseId: string,
    updateData: {
      title?: string;
      description?: string;
      totalAmount?: string;
      category?: string;
      date?: string;
      receipt?: string | null;
    },
    userId: string,
    organizationId?: string
  ): Promise<Expense> {
    try {
      // Validate organizationId if provided
      if (organizationId) {
        const [expense] = await db
          .select()
          .from(expenses)
          .where(and(eq(expenses.id, expenseId), eq(expenses.organizationId, organizationId)))
          .limit(1);

        if (!expense) {
          throw new NotFoundError('Expense not found or does not belong to your organization');
        }
      }

      // Get expense to check permissions
      const expense = await this.getExpenseById(expenseId);
      if (!expense) {
        throw new NotFoundError('Expense');
      }

      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(expense.groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      const updateFields: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      if (updateData.date) {
        updateFields.date = new Date(updateData.date);
      }

      const [updatedExpense] = await db
        .update(expenses)
        .set(updateFields)
        .where(eq(expenses.id, expenseId))
        .returning();

      if (!updatedExpense) {
        throw new NotFoundError('Expense');
      }

      return updatedExpense;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError('Failed to update expense');
    }
  }

  /**
   * Delete expense
   */
  static async deleteExpense(expenseId: string, userId: string, organizationId?: string): Promise<void> {
    try {
      // Validate organizationId if provided
      if (organizationId) {
        const [expense] = await db
          .select()
          .from(expenses)
          .where(and(eq(expenses.id, expenseId), eq(expenses.organizationId, organizationId)))
          .limit(1);

        if (!expense) {
          throw new NotFoundError('Expense not found or does not belong to your organization');
        }
      }

      // Get expense to check permissions
      const expense = await this.getExpenseById(expenseId);
      if (!expense) {
        throw new NotFoundError('Expense');
      }

      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(expense.groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // Delete expense (cascade will handle splits and balance updates)
      await db.delete(expenses).where(eq(expenses.id, expenseId));
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete expense');
    }
  }

  /**
   * Validate expense splits
   */
  private static async validateExpenseSplits(expenseData: {
    groupId: string;
    totalAmount: string;
    splitType: 'equal' | 'percentage' | 'shares' | 'exact';
    splits: Array<{
      userId: string;
      amount: string;
      percentage?: string;
      shares?: number;
    }>;
  }): Promise<void> {
    const totalAmount = parseFloat(expenseData.totalAmount);
    const splits = expenseData.splits;

    // Validate all users are group members
    for (const split of splits) {
      const isMember = await GroupService.isUserGroupMember(expenseData.groupId, split.userId);
      if (!isMember) {
        throw new ValidationError(`User ${split.userId} is not a member of this group`);
      }
    }

    // Validate split amounts based on split type
    switch (expenseData.splitType) {
      case 'equal':
        const equalAmount = totalAmount / splits.length;
        for (const split of splits) {
          if (Math.abs(parseFloat(split.amount) - equalAmount) > 0.01) {
            throw new ValidationError('Equal split amounts do not match');
          }
        }
        break;

      case 'percentage':
        let totalPercentage = 0;
        for (const split of splits) {
          if (!split.percentage) {
            throw new ValidationError('Percentage is required for percentage splits');
          }
          totalPercentage += parseFloat(split.percentage);
        }
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new ValidationError('Percentages must sum to 100%');
        }
        break;

      case 'shares':
        let totalShares = 0;
        for (const split of splits) {
          if (!split.shares || split.shares <= 0) {
            throw new ValidationError('Valid shares are required for shares-based splits');
          }
          totalShares += split.shares;
        }
        for (const split of splits) {
          const expectedAmount = (split.shares! / totalShares) * totalAmount;
          if (Math.abs(parseFloat(split.amount) - expectedAmount) > 0.01) {
            throw new ValidationError('Shares-based split amounts do not match');
          }
        }
        break;

      case 'exact':
        let totalSplitAmount = 0;
        for (const split of splits) {
          totalSplitAmount += parseFloat(split.amount);
        }
        if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
          throw new ValidationError('Exact split amounts must sum to total amount');
        }
        break;
    }
  }

  /**
   * Update user balances after expense creation/update/deletion
   */
  private static async updateUserBalances(expenseId: string): Promise<void> {
    try {
      const expense = await this.getExpenseById(expenseId);
      if (!expense) return;

      const groupId = expense.groupId;
      const paidBy = expense.paidBy;
      const totalAmount = parseFloat(expense.totalAmount);

      // Calculate total split amount (sum of all splits)
      const totalSplitAmount = expense.splits.reduce((sum, split) => sum + parseFloat(split.amount), 0);

      // Validate that total split amount equals total expense amount
      if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
        throw new ValidationError('Total split amount does not match expense amount');
      }

      // Update balances for each member involved in the expense
      for (const split of expense.splits) {
        const memberId = split.userId;
        const splitAmount = parseFloat(split.amount);

        // Get current balance
        const [currentBalance] = await db
          .select()
          .from(userBalances)
          .where(and(eq(userBalances.userId, memberId), eq(userBalances.groupId, groupId)))
          .limit(1);

        // Calculate balance change according to Splitwise logic:
        // balance[payer] += amount_paid - their_share
        // balance[participant] -= their_share
        let balanceChange = 0;

        if (memberId === paidBy) {
          // Person who paid: they get (amount they paid - their share)
          balanceChange = totalAmount - splitAmount;
        } else {
          // Other participants: they owe their share (negative balance)
          balanceChange = -splitAmount;
        }

        const newBalance = (currentBalance ? parseFloat(currentBalance.balance) : 0) + balanceChange;

        if (currentBalance) {
          // Update existing balance
          await db
            .update(userBalances)
            .set({
              balance: newBalance.toString(),
              updatedAt: new Date(),
            })
            .where(and(eq(userBalances.userId, memberId), eq(userBalances.groupId, groupId)));
        } else {
          // Create new balance record
          await db.insert(userBalances).values({
            userId: memberId,
            groupId,
            balance: newBalance.toString(),
          });
        }
      }
    } catch (error) {
      // Log the actual error details for debugging
      console.error('[ExpenseService] updateUserBalances error:', error);
      if (error instanceof Error) {
        console.error('[ExpenseService] Error name:', error.name);
        console.error('[ExpenseService] Error message:', error.message);
        console.error('[ExpenseService] Error stack:', error.stack);
        // @ts-ignore - PostgreSQL error details
        if (error.code) console.error('[ExpenseService] Error code:', error.code);
        // @ts-ignore
        if (error.detail) console.error('[ExpenseService] Error detail:', error.detail);
      }
      throw new DatabaseError(`Failed to update user balances: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get expense categories
   */
  static async getExpenseCategories(): Promise<string[]> {
    return [
      'Food & Dining',
      'Transportation',
      'Entertainment',
      'Shopping',
      'Bills & Utilities',
      'Healthcare',
      'Travel',
      'Education',
      'Other',
    ];
  }

  /**
   * Send email notifications to group members about new expense
   */
  private static async sendExpenseNotifications(
    expense: Expense & { splits: (ExpenseSplit & { user: any })[] },
    createdBy: string
  ): Promise<void> {
    try {
      // Get group information
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, expense.groupId))
        .limit(1);

      if (!group) {
        return;
      }
      // Get user who added the expense
      const [addedByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, expense.paidBy))
        .limit(1);

      if (!addedByUser) {
        return;
      }
      // Filter splits to exclude the person who added the expense
      const splitsToNotify = expense.splits.filter(split => split.userId !== createdBy);
      if (splitsToNotify.length === 0) {
        return;
      }

      // Send emails to all split users except the one who added the expense
      const emailPromises = splitsToNotify.map(async (split) => {
        try {
          await sendExpenseNotificationEmail(
            split.user?.email,
            {
              id: expense.id,
              title: expense.title,
              description: expense.description || undefined,
              totalAmount: expense.totalAmount.toString(),
              category: expense.category,
              date: expense.date.toISOString(),
            },
            {
              id: addedByUser.id,
              name: addedByUser.name,
              email: addedByUser.email,
            },
            {
              id: group.id,
              name: group.name,
            },
            {
              amount: split.amount.toString(),
            },
            split.user ? { preferredLanguage: (split.user as any).preferredLanguage ?? null, preferredCurrency: (split.user as any).preferredCurrency ?? null } : undefined
          );
        } catch (err) {
          console.error('[ExpenseService] sendExpenseNotificationEmail failed for', split.user?.email, err instanceof Error ? err.message : err);
        }
      });

      await Promise.all(emailPromises);
    } catch (error) {
      // Never throw: log and swallow so expense creation never fails due to email/i18n
      console.error('[ExpenseService] sendExpenseNotifications error:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('[ExpenseService] sendExpenseNotifications stack:', error.stack);
      }
    }
  }
}
