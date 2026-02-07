import { eq, and, desc, asc, or, like, sql } from 'drizzle-orm';
import {
  db,
  khataCustomers,
  khataTransactions,
  users,
  type KhataCustomer,
  type NewKhataCustomer,
  type KhataTransaction,
  type NewKhataTransaction,
} from '../db';
import { NotFoundError, ValidationError, DatabaseError } from '../utils/errors';
import { sendKhataTransactionEmail, sendCustomerAddedEmail } from './emailService';

export class KhataService {
  /**
   * Get all customers for a user with optional filters
   */
  static async getCustomers(
    userId: string,
    options: {
      search?: string;
      filterType?: 'all' | 'give' | 'get' | 'settled';
      sortType?: 'most-recent' | 'oldest' | 'highest-amount' | 'least-amount' | 'name-az';
      organizationId?: string;
    } = {}
  ): Promise<Array<KhataCustomer & { balance: string; type: 'give' | 'get' | 'settled' }>> {
    try {
      const { search, filterType = 'all', sortType = 'most-recent', organizationId } = options;

      // If no organizationId provided, return empty array
      if (!organizationId) {
        return [];
      }

      // Get all customers for the user and organization
      const whereConditions = [
        eq(khataCustomers.userId, userId),
        eq(khataCustomers.organizationId, organizationId)
      ];

      if (search) {
        whereConditions.push(
          or(
            like(khataCustomers.name, `%${search}%`),
            like(khataCustomers.email, `%${search}%`),
            like(khataCustomers.phone, `%${search}%`)
          )!
        );
      }

      const customers = await db
        .select()
        .from(khataCustomers)
        .where(and(...whereConditions));

      // Get balance for each customer
      const customersWithBalance = await Promise.all(
        customers.map(async (customer) => {
          const lastTransaction = await db
            .select()
            .from(khataTransactions)
            .where(eq(khataTransactions.customerId, customer.id))
            .orderBy(desc(khataTransactions.transactionDate))
            .limit(1);

          let balance = '0.00';
          let type: 'give' | 'get' | 'settled' = 'settled';

          if (lastTransaction.length > 0) {
            const last = lastTransaction[0];
            balance = last.balance;
            const balanceNum = parseFloat(balance);
            // When all dues are 0 (give and get balance out), show settled
            if (Math.abs(balanceNum) < 0.01) {
              type = 'settled';
            } else {
              // Derive type from balance sign: positive = customer owes you (you will get), negative = you owe customer (you will give)
              type = balanceNum > 0 ? 'give' : 'get';
            }
          }

          return {
            ...customer,
            balance,
            type,
          };
        })
      );

      // Apply filter
      let filtered = customersWithBalance;
      if (filterType !== 'all') {
        filtered = customersWithBalance.filter((c) => c.type === filterType);
      }

      // Apply sort
      let sorted = filtered;
      if (sortType === 'most-recent') {
        sorted = filtered.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA;
        });
      } else if (sortType === 'oldest') {
        sorted = filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
      } else if (sortType === 'highest-amount') {
        sorted = filtered.sort((a, b) => {
          const balanceA = Math.abs(parseFloat(a.balance));
          const balanceB = Math.abs(parseFloat(b.balance));
          return balanceB - balanceA;
        });
      } else if (sortType === 'least-amount') {
        sorted = filtered.sort((a, b) => {
          const balanceA = Math.abs(parseFloat(a.balance));
          const balanceB = Math.abs(parseFloat(b.balance));
          return balanceA - balanceB;
        });
      } else if (sortType === 'name-az') {
        sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
      }

      return sorted;
    } catch (error: any) {
      throw new DatabaseError('Failed to get customers');
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(
    customerId: string,
    userId: string,
    organizationId?: string
  ): Promise<KhataCustomer & { balance: string; type: 'give' | 'get' | 'settled' }> {
    try {
      // Validate organizationId if provided
      if (organizationId) {
        const [customer] = await db
          .select()
          .from(khataCustomers)
          .where(and(
            eq(khataCustomers.id, customerId),
            eq(khataCustomers.userId, userId),
            eq(khataCustomers.organizationId, organizationId)
          ))
          .limit(1);

        if (!customer) {
          throw new NotFoundError('Customer not found or does not belong to your organization');
        }
      }

      const customer = await db
        .select()
        .from(khataCustomers)
        .where(and(eq(khataCustomers.id, customerId), eq(khataCustomers.userId, userId)))
        .limit(1);

      if (customer.length === 0) {
        throw new NotFoundError('Customer not found');
      }

      // Get balance
      const lastTransaction = await db
        .select()
        .from(khataTransactions)
        .where(eq(khataTransactions.customerId, customerId))
        .orderBy(desc(khataTransactions.transactionDate))
        .limit(1);

      let balance = '0.00';
      let type: 'give' | 'get' | 'settled' = 'settled';

      if (lastTransaction.length > 0) {
        const last = lastTransaction[0];
        balance = last.balance;
        const balanceNum = parseFloat(balance);
        // When all dues are 0 (give and get balance out), show settled
        if (Math.abs(balanceNum) < 0.01) {
          type = 'settled';
        } else {
          // Derive type from balance sign: positive = you will get, negative = you will give
          type = balanceNum > 0 ? 'give' : 'get';
        }
      }

      return {
        ...customer[0],
        balance,
        type,
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get customer');
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(
    customerData: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
    },
    userId: string,
    organizationId: string
  ): Promise<KhataCustomer> {
    try {
      const newCustomer: NewKhataCustomer = {
        organizationId,
        userId,
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        address: customerData.address || null,
        avatar: customerData.avatar || null,
        notes: customerData.notes || null,
      };

      const [customer] = await db.insert(khataCustomers).values(newCustomer).returning();

      // Send email notification to customer in background (non-blocking)
      if (customer.email) {
        const customerEmail = customer.email; // Capture for closure
        // Fire-and-forget: Don't await, let it run in background
        (async () => {
          try {
            // Get user's name for the email
            const [user] = await db
              .select()
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);

            if (user) {
              await sendCustomerAddedEmail(
                customerEmail,
                customer.name,
                user.name || 'User'
              );
            }
          } catch {
            // Email failure doesn't affect customer creation
          }
        })().catch(() => {});
      }

      return customer;
    } catch (error: any) {
      throw new DatabaseError('Failed to create customer');
    }
  }

  /**
   * Update a customer
   */
  static async updateCustomer(
    customerId: string,
    customerData: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
    },
    userId: string,
    organizationId?: string
  ): Promise<KhataCustomer> {
    try {
      // Verify ownership and organizationId
      const customer = await this.getCustomerById(customerId, userId, organizationId);

      const updateData: Partial<NewKhataCustomer> = {
        updatedAt: new Date(),
      };

      if (customerData.name !== undefined) updateData.name = customerData.name;
      if (customerData.email !== undefined) updateData.email = customerData.email || null;
      if (customerData.phone !== undefined) updateData.phone = customerData.phone || null;
      if (customerData.address !== undefined) updateData.address = customerData.address || null;
      if (customerData.avatar !== undefined) updateData.avatar = customerData.avatar || null;
      if (customerData.notes !== undefined) updateData.notes = customerData.notes || null;

      const [updated] = await db
        .update(khataCustomers)
        .set(updateData)
        .where(eq(khataCustomers.id, customerId))
        .returning();

      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update customer');
    }
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(customerId: string, userId: string, organizationId?: string): Promise<void> {
    try {
      // Verify ownership and organizationId
      await this.getCustomerById(customerId, userId, organizationId);

      await db.delete(khataCustomers).where(eq(khataCustomers.id, customerId));
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete customer');
    }
  }

  /**
   * Get transactions for a customer
   */
  static async getCustomerTransactions(
    customerId: string,
    userId: string,
    organizationId?: string
  ): Promise<KhataTransaction[]> {
    try {
      // Verify customer ownership and organizationId
      await this.getCustomerById(customerId, userId, organizationId);

      const transactions = await db
        .select()
        .from(khataTransactions)
        .where(eq(khataTransactions.customerId, customerId))
        .orderBy(desc(khataTransactions.transactionDate));

      return transactions;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get transactions');
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(
    transactionData: {
      customerId: string;
      type: 'give' | 'get';
      amount: string;
      currency?: string;
      description?: string;
      imageUrl?: string;
      transactionDate?: string;
    },
    userId: string,
    organizationId?: string
  ): Promise<KhataTransaction> {
    try {
      // Verify customer ownership and organizationId
      const customer = await this.getCustomerById(transactionData.customerId, userId, organizationId);

      // Get current balance
      const lastTransaction = await db
        .select()
        .from(khataTransactions)
        .where(eq(khataTransactions.customerId, transactionData.customerId))
        .orderBy(desc(khataTransactions.transactionDate))
        .limit(1);

      let currentBalance = '0.00';
      if (lastTransaction.length > 0) {
        currentBalance = lastTransaction[0].balance;
      }

      // Calculate new balance (from logged-in user's perspective: positive = customer owes user, negative = user owes customer)
      const amount = parseFloat(transactionData.amount);
      const balanceNum = parseFloat(currentBalance);
      let newBalance: number;

      if (transactionData.type === 'give') {
        // User gave money to customer → customer owes user more → balance increases (positive)
        newBalance = balanceNum + amount;
      } else {
        // User got money from customer → customer owes user less (or user owes customer) → balance decreases (negative)
        newBalance = balanceNum - amount;
      }

      const newTransaction: NewKhataTransaction = {
        customerId: transactionData.customerId,
        userId,
        type: transactionData.type,
        amount: transactionData.amount,
        currency: transactionData.currency || 'INR',
        description: transactionData.description || null,
        imageUrl: transactionData.imageUrl || null,
        balance: newBalance.toFixed(2),
        transactionDate: transactionData.transactionDate
          ? new Date(transactionData.transactionDate)
          : new Date(),
      };

      const [transaction] = await db
        .insert(khataTransactions)
        .values(newTransaction)
        .returning();

      // Send email notification in background (non-blocking)
      if (customer.email) {
        const customerEmail = customer.email; // Capture for closure
        // Fire-and-forget: Don't await, let it run in background
        (async () => {
          try {
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (user) {
              await sendKhataTransactionEmail(
                customerEmail,
                customer.name,
                user.name,
                {
                  type: transactionData.type,
                  amount: transactionData.amount,
                  currency: transactionData.currency || 'INR',
                  description: transactionData.description,
                  balance: newBalance.toFixed(2),
                  date: transaction.transactionDate.toISOString(),
                }
              );
            }
          } catch {
            // Ignore
          }
        })().catch(() => {});
      }

      return transaction;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to create transaction');
    }
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(
    transactionId: string,
    transactionData: {
      type?: 'give' | 'get';
      amount?: string;
      currency?: string;
      description?: string;
      imageUrl?: string;
      transactionDate?: string;
    },
    userId: string,
    organizationId?: string
  ): Promise<KhataTransaction> {
    try {
      // Get the transaction and verify ownership
      const [existingTransaction] = await db
        .select()
        .from(khataTransactions)
        .where(eq(khataTransactions.id, transactionId))
        .limit(1);

      if (!existingTransaction) {
        throw new NotFoundError('Transaction not found');
      }

      // Verify customer ownership and organizationId
      await this.getCustomerById(existingTransaction.customerId, userId, organizationId);

      // Update the transaction
      const updateData: any = {};
      if (transactionData.type) updateData.type = transactionData.type;
      if (transactionData.amount) updateData.amount = transactionData.amount;
      if (transactionData.currency) updateData.currency = transactionData.currency;
      if (transactionData.description !== undefined) updateData.description = transactionData.description || null;
      if (transactionData.imageUrl !== undefined) updateData.imageUrl = transactionData.imageUrl || null;
      if (transactionData.transactionDate) updateData.transactionDate = new Date(transactionData.transactionDate);

      const [updatedTransaction] = await db
        .update(khataTransactions)
        .set(updateData)
        .where(eq(khataTransactions.id, transactionId))
        .returning();

      // Recalculate balances for all transactions of this customer
      await this.recalculateCustomerBalances(existingTransaction.customerId);

      // Fetch the updated transaction with recalculated balance
      const [finalTransaction] = await db
        .select()
        .from(khataTransactions)
        .where(eq(khataTransactions.id, transactionId))
        .limit(1);

      return finalTransaction;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update transaction');
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(transactionId: string, userId: string, organizationId?: string): Promise<void> {
    try {
      // Get the transaction and verify ownership
      const [transaction] = await db
        .select()
        .from(khataTransactions)
        .where(eq(khataTransactions.id, transactionId))
        .limit(1);

      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      // Verify customer ownership and organizationId
      await this.getCustomerById(transaction.customerId, userId, organizationId);

      // Delete the transaction
      await db.delete(khataTransactions).where(eq(khataTransactions.id, transactionId));

      // Recalculate balances for all transactions of this customer
      await this.recalculateCustomerBalances(transaction.customerId);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete transaction');
    }
  }

  /**
   * Recalculate balances for all transactions of a customer
   */
  private static async recalculateCustomerBalances(customerId: string): Promise<void> {
    try {
      // Get all transactions for the customer ordered by date
      const transactions = await db
        .select()
        .from(khataTransactions)
        .where(eq(khataTransactions.customerId, customerId))
        .orderBy(khataTransactions.transactionDate);

      let currentBalance = 0;

        // Recalculate balance for each transaction (positive = customer owes user, negative = user owes customer)
      for (const transaction of transactions) {
        const amount = parseFloat(transaction.amount);

        if (transaction.type === 'give') {
          currentBalance += amount; // User gave → customer owes more
        } else {
          currentBalance -= amount; // User got → customer owes less
        }

        // Update the transaction with new balance
        await db
          .update(khataTransactions)
          .set({ balance: currentBalance.toFixed(2) })
          .where(eq(khataTransactions.id, transaction.id));
      }
    } catch (error: any) {
      throw new DatabaseError('Failed to recalculate balances');
    }
  }

  /**
   * Get financial summary (total give and total get)
   */
  static async getFinancialSummary(userId: string, organizationId?: string): Promise<{
    totalGive: string;
    totalGet: string;
  }> {
    try {
      // Get all customers
      const customers = await this.getCustomers(userId, { organizationId });

      let totalGive = 0;
      let totalGet = 0;

      customers.forEach((customer) => {
        const balance = parseFloat(customer.balance);
        if (balance < 0) {
          // User will give (negative balance)
          totalGive += Math.abs(balance);
        } else if (balance > 0) {
          // User will get (positive balance)
          totalGet += balance;
        }
      });

      return {
        totalGive: totalGive.toFixed(2),
        totalGet: totalGet.toFixed(2),
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to get financial summary');
    }
  }
}

