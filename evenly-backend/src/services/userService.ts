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
   * Create or update user from auth service
   */
  static async createOrUpdateUser(userData: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    phoneNumber?: string;
  }): Promise<User> {
    try {
      console.log('🔍 Checking if user exists in evenly database:', {
        authServiceId: userData.id,
        email: userData.email
      });

      // Check if user exists by auth service ID
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.authServiceId, userData.id))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        console.log('🔄 Updating existing user in evenly database:', {
          evenlyId: existingUser[0].id,
          authServiceId: userData.id,
          oldEmail: existingUser[0].email,
          newEmail: userData.email,
          oldName: existingUser[0].name,
          newName: userData.name
        });

        const [updatedUser] = await db
          .update(users)
          .set({
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar,
            phoneNumber: userData.phoneNumber,
            updatedAt: new Date(),
          })
          .where(eq(users.authServiceId, userData.id))
          .returning();

        console.log('✅ User updated successfully in evenly database');
        return updatedUser;
      } else {
        // Create new user with generated UUID
        const newEvenlyId = UUIDUtils.generateForDB();
        console.log('🆕 Creating new user in evenly database:', {
          newEvenlyId: newEvenlyId,
          authServiceId: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar
        });

        const [createdUser] = await db
          .insert(users)
          .values({
            id: newEvenlyId, // Explicitly generate UUID
            authServiceId: userData.id, // Store the auth service ID
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar,
            phoneNumber: userData.phoneNumber,
          })
          .returning();

        console.log('✅ New user created successfully in evenly database');
        return createdUser;
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new DatabaseError('Failed to create or update user');
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
      console.error('Error fetching user:', error);
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
      console.error('Error fetching user by email:', error);
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
      console.error('Error fetching users by IDs:', error);
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
      console.error('Error updating user:', error);
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
      console.error('Error syncing user with auth service:', error);
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
      console.error('Error checking user existence:', error);
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
      console.error('Error fetching user stats:', error);
      throw new DatabaseError('Failed to fetch user statistics');
    }
  }
}
