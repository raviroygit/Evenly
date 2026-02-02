import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from './config';
import * as schema from '../db/schema';

// Create the database connection
const sql = neon(config.database.url);
export const db = drizzle(sql, { schema });

// Test database connection with timeout
export const testConnection = async (timeoutMs: number = 5000): Promise<boolean> => {
  try {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs);
    });

    // Race between the query and the timeout
    await Promise.race([
      sql`SELECT NOW()`,
      timeoutPromise
    ]);
    return true;
  } catch {
    return false;
  }
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  try {
    // Neon serverless doesn't need explicit connection closing
  } catch {
    // Ignore
  }
};
