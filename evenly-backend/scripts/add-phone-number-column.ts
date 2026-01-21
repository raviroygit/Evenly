import { neon } from '@neondatabase/serverless';
import { config } from '../src/config/config';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const neonSql = neon(config.database.url);
const db = drizzle(neonSql);

async function addPhoneNumberColumn() {
  try {
    console.log('🔄 Adding phone_number column to users table...');
    
    // Add the phone_number column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone_number TEXT
    `);
    
    console.log('✅ Successfully added phone_number column to users table');
    console.log('📝 Note: Existing users will have NULL phone_number until they log in again');
    
  } catch (error) {
    console.error('❌ Error adding phone_number column:', error);
    process.exit(1);
  }
}

addPhoneNumberColumn();
