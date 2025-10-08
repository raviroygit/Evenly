import { db } from '../config/database';
import { DatabaseError } from '../types';
import { eq, and } from 'drizzle-orm';

export class DatabaseService {
  /**
   * Get the Drizzle database instance
   */
  static getDb() {
    return db;
  }

  /**
   * Check if a record exists using Drizzle
   */
  static async exists(
    table: any,
    conditions: Record<string, any>
  ): Promise<boolean> {
    try {
      // Convert conditions to Drizzle where clauses
      const whereClauses = Object.entries(conditions).map(([key, value]) => 
        eq(table[key], value)
      );
      
      const result = await db
        .select()
        .from(table)
        .where(and(...whereClauses))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      const dbError = error as DatabaseError;
      console.error('Database exists check error:', {
        table: table._.name,
        conditions,
        error: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
      });
      throw dbError;
    }
  }

  /**
   * Insert a record using Drizzle
   */
  static async insert<T = any>(
    table: any,
    data: Record<string, any>
  ): Promise<T> {
    try {
      const result = await db.insert(table).values(data).returning();
      return (result as any)[0] as T;
    } catch (error) {
      const dbError = error as DatabaseError;
      console.error('Database insert error:', {
        table: table._.name,
        data,
        error: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
      });
      throw dbError;
    }
  }

  /**
   * Update records using Drizzle
   */
  static async update<T = any>(
    table: any,
    data: Record<string, any>,
    conditions: Record<string, any>
  ): Promise<T[]> {
    try {
      // Convert conditions to Drizzle where clauses
      const whereClauses = Object.entries(conditions).map(([key, value]) => 
        eq(table[key], value)
      );
      
      const result = await db
        .update(table)
        .set(data)
        .where(and(...whereClauses))
        .returning();
      
      return result as T[];
    } catch (error) {
      const dbError = error as DatabaseError;
      console.error('Database update error:', {
        table: table._.name,
        data,
        conditions,
        error: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
      });
      throw dbError;
    }
  }

  /**
   * Delete records using Drizzle
   */
  static async delete<T = any>(
    table: any,
    conditions: Record<string, any>
  ): Promise<T[]> {
    try {
      // Convert conditions to Drizzle where clauses
      const whereClauses = Object.entries(conditions).map(([key, value]) => 
        eq(table[key], value)
      );
      
      const result = await db
        .delete(table)
        .where(and(...whereClauses))
        .returning();
      
      return result as T[];
    } catch (error) {
      const dbError = error as DatabaseError;
      console.error('Database delete error:', {
        table: table._.name,
        conditions,
        error: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
      });
      throw dbError;
    }
  }
}
