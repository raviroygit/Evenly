import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from '../config/config';
import * as schema from './schema';

// Create the database connection
const sql = neon(config.database.url);
export const db = drizzle(sql, { schema });

// Export schema for use in other files
export * from './schema';
