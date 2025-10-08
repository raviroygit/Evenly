import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from '../src/config/config';
import { sql } from 'drizzle-orm';

const neonSql = neon(config.database.url);
const db = drizzle(neonSql);

async function addAuthServiceIdColumn() {
  try {
    console.log('🔄 Adding auth_service_id column to users table...');
    
    // Add the auth_service_id column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS auth_service_id TEXT UNIQUE
    `);
    
    console.log('✅ Successfully added auth_service_id column to users table');
    console.log('📝 Note: Existing users will need to be recreated with auth service IDs');
    console.log('🔄 You may need to clear existing data and recreate users');
    
  } catch (error) {
    console.error('❌ Error adding auth_service_id column:', error);
    process.exit(1);
  }
}

addAuthServiceIdColumn();
