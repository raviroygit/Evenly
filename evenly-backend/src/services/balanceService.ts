import { eq, and, desc, sum } from 'drizzle-orm';
import { db, userBalances, users, type UserBalance, type SimplifiedDebt } from '../db';
import { GroupService } from './groupService';
import { NotFoundError, ForbiddenError, DatabaseError } from '../utils/errors';

export class BalanceService {
  /**
   * Get user balances for a group
   */
  static async getGroupBalances(
    groupId: string,
    userId: string
  ): Promise<(UserBalance & { user: any })[]> {
    try {
      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      const balances = await db
        .select({
          id: userBalances.id,
          userId: userBalances.userId,
          groupId: userBalances.groupId,
          balance: userBalances.balance,
          lastUpdated: userBalances.updatedAt,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            avatar: users.avatar,
          },
        })
        .from(userBalances)
        .innerJoin(users, eq(userBalances.userId, users.id))
        .where(eq(userBalances.groupId, groupId))
        .orderBy(desc(userBalances.balance));

      return balances;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      console.error('Error fetching group balances:', error);
      throw new DatabaseError('Failed to fetch group balances');
    }
  }

  /**
   * Get user's balances across all groups
   */
  static async getUserBalances(userId: string): Promise<UserBalance[]> {
    try {
      const balances = await db
        .select({
          id: userBalances.id,
          userId: userBalances.userId,
          groupId: userBalances.groupId,
          balance: userBalances.balance,
          lastUpdated: userBalances.updatedAt,
        })
        .from(userBalances)
        .where(eq(userBalances.userId, userId));

      return balances;
    } catch (error) {
      console.error('Error fetching user balances:', error);
      throw new DatabaseError('Failed to fetch user balances');
    }
  }

  /**
   * Get simplified debts for a group (who owes whom)
   */
  static async getSimplifiedDebts(
    groupId: string,
    userId: string
  ): Promise<SimplifiedDebt[]> {
    try {
      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      const balances = await this.getGroupBalances(groupId, userId);
      
      // Separate creditors (positive balance) and debtors (negative balance)
      const creditors = balances.filter(b => parseFloat(b.balance) > 0);
      const debtors = balances.filter(b => parseFloat(b.balance) < 0);

      const simplifiedDebts: SimplifiedDebt[] = [];

      // Use greedy algorithm to minimize number of transactions
      let creditorIndex = 0;
      let debtorIndex = 0;

      while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];

        const creditorAmount = parseFloat(creditor.balance);
        const debtorAmount = Math.abs(parseFloat(debtor.balance));

        const transferAmount = Math.min(creditorAmount, debtorAmount);

        if (transferAmount > 0.01) { // Avoid tiny amounts due to floating point precision
          simplifiedDebts.push({
            fromUserId: debtor.userId,
            toUserId: creditor.userId,
            amount: transferAmount,
            fromUser: debtor.user,
            toUser: creditor.user,
          });
        }

        // Update remaining amounts
        creditors[creditorIndex] = {
          ...creditor,
          balance: (creditorAmount - transferAmount).toString(),
        };
        debtors[debtorIndex] = {
          ...debtor,
          balance: (-(debtorAmount - transferAmount)).toString(),
        };

        // Move to next creditor/debtor if current one is settled
        if (creditorAmount - transferAmount < 0.01) {
          creditorIndex++;
        }
        if (debtorAmount - transferAmount < 0.01) {
          debtorIndex++;
        }
      }

      return simplifiedDebts;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      console.error('Error calculating simplified debts:', error);
      throw new DatabaseError('Failed to calculate simplified debts');
    }
  }

  /**
   * Get user's net balance (total owed - total owing)
   */
  static async getUserNetBalance(userId: string): Promise<{
    totalOwed: number;
    totalOwing: number;
    netBalance: number;
  }> {
    try {
      const balances = await this.getUserBalances(userId);

      let totalOwed = 0;
      let totalOwing = 0;

      for (const balance of balances) {
        const amount = parseFloat(balance.balance);
        if (amount > 0) {
          totalOwed += amount;
        } else {
          totalOwing += Math.abs(amount);
        }
      }

      return {
        totalOwed,
        totalOwing,
        netBalance: totalOwed - totalOwing,
      };
    } catch (error) {
      console.error('Error calculating user net balance:', error);
      throw new DatabaseError('Failed to calculate user net balance');
    }
  }

  /**
   * Get group balance summary
   */
  static async getGroupBalanceSummary(
    groupId: string,
    userId: string
  ): Promise<{
    totalExpenses: number;
    totalMembers: number;
    totalOwed: number;
    totalOwing: number;
    netBalance: number;
    balances: (UserBalance & { user: any })[];
    simplifiedDebts: SimplifiedDebt[];
  }> {
    try {
      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      const balances = await this.getGroupBalances(groupId, userId);
      const simplifiedDebts = await this.getSimplifiedDebts(groupId, userId);

      let totalOwed = 0;
      let totalOwing = 0;

      for (const balance of balances) {
        const amount = parseFloat(balance.balance);
        if (amount > 0) {
          totalOwed += amount;
        } else {
          totalOwing += Math.abs(amount);
        }
      }

      // TODO: Get total expenses from expense service
      const totalExpenses = 0;
      const totalMembers = balances.length;

      return {
        totalExpenses,
        totalMembers,
        totalOwed,
        totalOwing,
        netBalance: totalOwed - totalOwing,
        balances,
        simplifiedDebts,
      };
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      console.error('Error calculating group balance summary:', error);
      throw new DatabaseError('Failed to calculate group balance summary');
    }
  }

  /**
   * Recalculate all balances for a group (useful for data consistency)
   */
  static async recalculateGroupBalances(groupId: string, userId: string): Promise<void> {
    try {
      // Check if user is an admin of the group
      const isAdmin = await GroupService.isUserGroupAdmin(groupId, userId);
      if (!isAdmin) {
        throw new ForbiddenError('Only group admins can recalculate balances');
      }

      // TODO: Implement balance recalculation
      // This would involve:
      // 1. Get all expenses for the group
      // 2. Calculate balances from scratch
      // 3. Update userBalances table
      // 4. Verify calculations are correct

      console.log(`Recalculating balances for group ${groupId}`);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      console.error('Error recalculating group balances:', error);
      throw new DatabaseError('Failed to recalculate group balances');
    }
  }

  /**
   * Get balance history for a user in a group
   */
  static async getBalanceHistory(
    groupId: string,
    userId: string,
    targetUserId: string
  ): Promise<any[]> {
    try {
      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // TODO: Implement balance history
      // This would require a balance_history table to track changes over time
      return [];
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      console.error('Error fetching balance history:', error);
      throw new DatabaseError('Failed to fetch balance history');
    }
  }

  /**
   * Validate group balance consistency
   */
  static async validateGroupBalanceConsistency(groupId: string): Promise<{
    isValid: boolean;
    totalBalance: number;
    issues: string[];
  }> {
    try {
      const balances = await db
        .select()
        .from(userBalances)
        .where(eq(userBalances.groupId, groupId));

      let totalBalance = 0;
      const issues: string[] = [];

      for (const balance of balances) {
        totalBalance += parseFloat(balance.balance);
      }

      const isValid = Math.abs(totalBalance) < 0.01; // Should be zero (or very close due to floating point)

      if (!isValid) {
        issues.push(`Total balance is ${totalBalance}, should be 0`);
      }

      return {
        isValid,
        totalBalance,
        issues,
      };
    } catch (error) {
      console.error('Error validating group balance consistency:', error);
      throw new DatabaseError('Failed to validate group balance consistency');
    }
  }
}
