#!/usr/bin/env tsx

import { initializeDatabase } from '../src/utils/migrate';

/**
 * Standalone migration script
 * Run with: npm run db:init or tsx scripts/migrate.ts
 */
async function main() {
  console.log('🚀 Starting database migration...');
  
  const success = await initializeDatabase();
  
  if (success) {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } else {
    console.error('❌ Migration failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Migration script error:', error);
  process.exit(1);
});
