import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from '../src/config/config';
import { sql } from 'drizzle-orm';

// Create the database connection
const neonSql = neon(config.database.url);
const db = drizzle(neonSql);

async function cleanupData() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Delete in the correct order to respect foreign key constraints using raw SQL
    console.log('🗑️  Deleting expense splits...');
    await db.execute(sql`DELETE FROM expense_splits`);
    
    console.log('🗑️  Deleting expenses...');
    await db.execute(sql`DELETE FROM expenses`);
    
    console.log('🗑️  Deleting payments...');
    await db.execute(sql`DELETE FROM payments`);
    
    console.log('🗑️  Deleting user balances...');
    await db.execute(sql`DELETE FROM user_balances`);
    
    console.log('🗑️  Deleting group invitations...');
    await db.execute(sql`DELETE FROM group_invitations`);
    
    console.log('🗑️  Deleting group members...');
    await db.execute(sql`DELETE FROM group_members`);
    
    console.log('🗑️  Deleting groups...');
    await db.execute(sql`DELETE FROM groups`);
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('📝 All groups, expenses, payments, balances, and invitations have been removed.');
    console.log('🔄 You can now create fresh data from the app.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupData();
