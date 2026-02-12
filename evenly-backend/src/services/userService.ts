import { eq } from 'drizzle-orm';
import { db, users, type User, type NewUser } from '../db';
import { AuthService } from '../utils/auth';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { UUIDUtils } from '../utils/uuid';

export class UserService {
  /**
   * Convert MongoDB ObjectId to UUID format
   */
  private static convertToUUID(mongoId: string): string {
    // Always return the original ID to maintain consistency with auth service
    // The auth service uses MongoDB ObjectId format, so we should keep it consistent
    return mongoId;
  }

  /**
   * Create or update user from auth service.
   * - Found by authServiceId: return existing user (no DB write).
   * - Found by email only (same person, id not matching): update authServiceId in Evenly DB so they're linked (only update when email existing).
   * - Else: insert new user.
   */
  static async createOrUpdateUser(userData: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    phoneNumber?: string;
  }): Promise<User> {
    try {
      // 1. Already exists by auth service ID → return as-is (no insert/update)
      const byAuthId = await db
        .select()
        .from(users)
        .where(eq(users.authServiceId, userData.id))
        .limit(1);

      if (byAuthId.length > 0) {
        return byAuthId[0];
      }

      // 2. Same person in Evenly DB (by email) but auth id different/missing → update authServiceId only when email existing
      const byEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (byEmail.length > 0) {
        const [updatedUser] = await db
          .update(users)
          .set({
            authServiceId: userData.id,
            name: userData.name,
            avatar: userData.avatar,
            phoneNumber: userData.phoneNumber,
            updatedAt: new Date(),
          })
          .where(eq(users.id, byEmail[0].id))
          .returning();
        return updatedUser;
      }

      // 3. Insert new user
      const newEvenlyId = UUIDUtils.generateForDB();
      const [createdUser] = await db
        .insert(users)
        .values({
          id: newEvenlyId,
          authServiceId: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          phoneNumber: userData.phoneNumber,
        })
        .returning();
      return createdUser;
    } catch (error: unknown) {
      const err = error as { code?: string; detail?: string; message?: string };
      // Log so we can see constraint name / detail in logs
      if (err?.code === '23505') {
        // Unique violation: try linking by email if we didn't already
        try {
          const byEmail = await db
            .select()
            .from(users)
            .where(eq(users.email, userData.email))
            .limit(1);
          if (byEmail.length > 0) {
            const [updated] = await db
              .update(users)
              .set({
                authServiceId: userData.id,
                name: userData.name,
                avatar: userData.avatar,
                phoneNumber: userData.phoneNumber,
                updatedAt: new Date(),
              })
              .where(eq(users.id, byEmail[0].id))
              .returning();
            return updated;
          }
        } catch {
          // fall through to rethrow
        }
      }
      throw new DatabaseError(
        err?.message ? `Failed to create or update user: ${err.message}` : 'Failed to create or update user'
      );
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user || null;
    } catch (error) {
      throw new DatabaseError('Failed to fetch user');
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user || null;
    } catch (error) {
      throw new DatabaseError('Failed to fetch user by email');
    }
  }

  /**
   * Get multiple users by IDs
   */
  static async getUsersByIds(userIds: string[]): Promise<User[]> {
    try {
      if (userIds.length === 0) return [];

      const usersList = await db
        .select()
        .from(users)
        .where(eq(users.id, userIds[0])); // This needs to be fixed with proper IN clause

      return usersList;
    } catch (error) {
      throw new DatabaseError('Failed to fetch users');
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updateData: {
    name?: string;
    avatar?: string;
  }): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new NotFoundError('User');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user');
    }
  }

  /**
   * Sync user with auth service
   */
  static async syncUserWithAuthService(userId: string): Promise<User> {
    try {
      // Get user details from auth service
      const authResult = await AuthService.getUserById(userId);

      if (!authResult.success || !authResult.user) {
        throw new NotFoundError('User not found in auth service');
      }

      // Create or update user in our database
      return await this.createOrUpdateUser(authResult.user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to sync user with auth service');
    }
  }

  /**
   * Check if user exists
   */
  static async userExists(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<{
    totalGroups: number;
    totalExpenses: number;
    totalOwed: number;
    totalOwing: number;
  }> {
    try {
      // This would require joins with other tables
      // For now, return basic stats
      return {
        totalGroups: 0,
        totalExpenses: 0,
        totalOwed: 0,
        totalOwing: 0,
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch user statistics');
    }
  }

  /**
   * Update user's preferred language
   */
  static async updateUserLanguage(userId: string, language: string): Promise<void> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          preferredLanguage: language,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user language preference');
    }
  }

  /**
   * Update user's preferred currency
   */
  static async updateUserCurrency(userId: string, currency: string): Promise<void> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          preferredCurrency: currency,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user currency preference');
    }
  }
}
