import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from './config';
import * as schema from '../db/schema';

// Create the database connection
const sql = neon(config.database.url);
export const db = drizzle(sql, { schema });

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sql`SELECT NOW()`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  try {
    // Neon serverless doesn't need explicit connection closing
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};
