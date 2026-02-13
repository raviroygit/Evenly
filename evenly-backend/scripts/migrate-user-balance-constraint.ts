#!/usr/bin/env tsx
/**
 * Migration script to add unique constraint on user_balances (user_id, group_id)
 * This script:
 * 1. Checks for duplicate records
 * 2. Removes duplicates (keeping the most recent)
 * 3. Adds the unique constraint
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

config();

const DATABASE_URL = process.env.EVENLY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function migrateUserBalanceConstraint() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    console.log('🚀 Starting migration: Add unique constraint to user_balances');

    // Check if constraint already exists
    const constraintCheck = await client`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'user_balances'
      AND constraint_name = 'user_balances_user_group_unique'
    `;

    if (constraintCheck.length > 0) {
      console.log('✅ Unique constraint already exists. Skipping migration.');
      await client.end();
      return;
    }

    // Step 1: Check for duplicates
    console.log('🔍 Checking for duplicate records...');
    const duplicates = await client`
      SELECT user_id, group_id, COUNT(*) as count
      FROM user_balances
      GROUP BY user_id, group_id
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate user-group combinations`);

      // Step 2: Remove duplicates (keep the most recent one)
      console.log('🧹 Removing duplicate records (keeping most recent)...');

      const deleteResult = await client`
        WITH duplicates AS (
          SELECT
            id,
            user_id,
            group_id,
            ROW_NUMBER() OVER (PARTITION BY user_id, group_id ORDER BY updated_at DESC) as rn
          FROM user_balances
        )
        DELETE FROM user_balances
        WHERE id IN (
          SELECT id FROM duplicates WHERE rn > 1
        )
      `;

      console.log(`✅ Removed ${deleteResult.count} duplicate records`);
    } else {
      console.log('✅ No duplicate records found');
    }

    // Step 3: Add unique constraint
    console.log('🔧 Adding unique constraint...');
    await client`
      ALTER TABLE user_balances
      ADD CONSTRAINT user_balances_user_group_unique UNIQUE (user_id, group_id)
    `;
    console.log('✅ Unique constraint added successfully');

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrateUserBalanceConstraint().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
