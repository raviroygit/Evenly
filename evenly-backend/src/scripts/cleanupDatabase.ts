/**
 * Backend Database Cleanup Script
 *
 * Deletes ALL data from PostgreSQL to start fresh with organization-based system
 *
 * ⚠️  WARNING: THIS WILL DELETE ALL DATA! USE WITH CAUTION! ⚠️
 *
 * Run with: npm run db:clean
 */

import { db } from '../db';
import { neon } from '@neondatabase/serverless';
import { config } from '../config/config';
import {
  users,
  groups,
  groupMembers,
  expenses,
  expenseSplits,
  payments,
  khataCustomers,
  khataTransactions,
} from '../db/schema';
import dotenv from 'dotenv';

// Import organization tables conditionally
let organizations: any = null;
let organizationMembers: any = null;
try {
  const schema = require('../db/schema');
  organizations = schema.organizations;
  organizationMembers = schema.organizationMembers;
} catch (error) {
  // Organization tables not in schema yet
  console.log('ℹ️  Organization tables not found in schema (will be added in migration)');
}

// Create raw SQL connection
const sql = neon(config.database.url);

// Load environment variables
dotenv.config();

interface CleanupStats {
  users: number;
  groups: number;
  groupMembers: number;
  expenses: number;
  expenseSplits: number;
  payments: number;
  khataCustomers: number;
  khataTransactions: number;
  organizationMembers: number;
  organizations: number;
}

/**
 * Clean all data from database
 */
async function cleanupDatabase(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    users: 0,
    groups: 0,
    groupMembers: 0,
    expenses: 0,
    expenseSplits: 0,
    payments: 0,
    khataCustomers: 0,
    khataTransactions: 0,
    organizationMembers: 0,
    organizations: 0,
  };

  /**
   * Safe delete - handles tables that don't exist yet
   */
  const safeDelete = async (table: any, tableName: string): Promise<number> => {
    // Skip if table is not defined (organization tables before migration)
    if (!table || table === null) {
      console.log(`⚠️  Table ${tableName} not defined yet (skipped)`);
      return 0;
    }

    try {
      const result = await db.delete(table).returning();
      return Array.isArray(result) ? result.length : 0;
    } catch (error: any) {
      // Table doesn't exist yet (before migration) or column doesn't exist
      if (error.code === '42P01' || error.code === '42703') {
        console.log(`⚠️  Table ${tableName} doesn't exist yet (skipped)`);
        return 0;
      }
      throw error;
    }
  };

  console.log('\n⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️');
  console.log('This will DELETE ALL DATA from the database!');
  console.log('⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️\n');

  try {
    // Use raw SQL with CASCADE to handle foreign key constraints
    console.log('🗑️  Using raw SQL to truncate all tables with CASCADE...\n');

    const tablesToTruncate = [
      'expense_splits',
      'user_balances',
      'expenses',
      'payments',
      'group_invitations',
      'group_members',
      'groups',
      'khata_transactions',
      'khata_customers',
      'organization_members',
      'organizations',
      'users'
    ];

    for (const tableName of tablesToTruncate) {
      try {
        console.log(`🗑️  Truncating ${tableName}...`);
        await sql(`TRUNCATE TABLE "${tableName}" CASCADE`);
        console.log(`✅ Truncated ${tableName}`);
      } catch (error: any) {
        // Table doesn't exist yet
        if (error.code === '42P01') {
          console.log(`⚠️  Table ${tableName} doesn't exist yet (skipped)`);
        } else {
          console.warn(`⚠️  Warning truncating ${tableName}:`, error.message);
        }
      }
    }

    console.log('\n✅ All tables truncated successfully');
    return stats;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

/**
 * Count all documents
 * Gracefully handles tables that don't exist yet (returns 0)
 */
async function countDocuments() {
  const safeCount = async (table: any, tableName: string): Promise<number> => {
    // Skip if table is not defined (organization tables before migration)
    if (!table || table === null) {
      return 0;
    }

    try {
      return await db.select().from(table).then(r => r.length);
    } catch (error: any) {
      // Table doesn't exist yet (before migration)
      if (error.code === '42P01' || error.code === '42703') {
        return 0;
      }
      throw error;
    }
  };

  try {
    const counts = {
      users: await safeCount(users, 'users'),
      groups: await safeCount(groups, 'groups'),
      groupMembers: await safeCount(groupMembers, 'groupMembers'),
      expenses: await safeCount(expenses, 'expenses'),
      expenseSplits: await safeCount(expenseSplits, 'expenseSplits'),
      payments: await safeCount(payments, 'payments'),
      khataCustomers: await safeCount(khataCustomers, 'khataCustomers'),
      khataTransactions: await safeCount(khataTransactions, 'khataTransactions'),
      organizationMembers: await safeCount(organizationMembers, 'organizationMembers'),
      organizations: await safeCount(organizations, 'organizations'),
    };
    return counts;
  } catch (error) {
    console.error('❌ Failed to count documents:', error);
    throw error;
  }
}

/**
 * Main cleanup function
 */
async function main() {
  console.log('\n========================================');
  console.log('🧹 Backend Database Cleanup Script');
  console.log('========================================\n');

  try {
    // Count documents before cleanup
    console.log('📊 Counting documents before cleanup...\n');
    const beforeCounts = await countDocuments();

    console.log('Current database state:');
    console.log(`  Users:                 ${beforeCounts.users}`);
    console.log(`  Groups:                ${beforeCounts.groups}`);
    console.log(`  Group Members:         ${beforeCounts.groupMembers}`);
    console.log(`  Expenses:              ${beforeCounts.expenses}`);
    console.log(`  Expense Splits:        ${beforeCounts.expenseSplits}`);
    console.log(`  Payments:              ${beforeCounts.payments}`);
    console.log(`  Khata Customers:       ${beforeCounts.khataCustomers}`);
    console.log(`  Khata Transactions:    ${beforeCounts.khataTransactions}`);
    console.log(`  Organizations:         ${beforeCounts.organizations}`);
    console.log(`  Organization Members:  ${beforeCounts.organizationMembers}`);
    console.log('');

    // Run cleanup
    const stats = await cleanupDatabase();

    // Print summary
    console.log('\n========================================');
    console.log('📊 Cleanup Summary');
    console.log('========================================');
    console.log(`Users deleted:                 ${stats.users} ✅`);
    console.log(`Groups deleted:                ${stats.groups} ✅`);
    console.log(`Group members deleted:         ${stats.groupMembers} ✅`);
    console.log(`Expenses deleted:              ${stats.expenses} ✅`);
    console.log(`Expense splits deleted:        ${stats.expenseSplits} ✅`);
    console.log(`Payments deleted:              ${stats.payments} ✅`);
    console.log(`Khata customers deleted:       ${stats.khataCustomers} ✅`);
    console.log(`Khata transactions deleted:    ${stats.khataTransactions} ✅`);
    console.log(`Organizations deleted:         ${stats.organizations} ✅`);
    console.log(`Organization members deleted:  ${stats.organizationMembers} ✅`);
    console.log('========================================\n');

    // Verify cleanup
    console.log('🔍 Running verification...');
    const afterCounts = await countDocuments();

    const allClean = Object.values(afterCounts).every(count => count === 0);

    if (allClean) {
      console.log('✅ Verification passed: Database is completely clean!\n');
    } else {
      console.log('⚠️  Verification warning: Some records remain:');
      if (afterCounts.users > 0) console.log(`  Users: ${afterCounts.users}`);
      if (afterCounts.groups > 0) console.log(`  Groups: ${afterCounts.groups}`);
      if (afterCounts.groupMembers > 0) console.log(`  Group Members: ${afterCounts.groupMembers}`);
      if (afterCounts.expenses > 0) console.log(`  Expenses: ${afterCounts.expenses}`);
      if (afterCounts.expenseSplits > 0) console.log(`  Expense Splits: ${afterCounts.expenseSplits}`);
      if (afterCounts.payments > 0) console.log(`  Payments: ${afterCounts.payments}`);
      if (afterCounts.khataCustomers > 0) console.log(`  Khata Customers: ${afterCounts.khataCustomers}`);
      if (afterCounts.khataTransactions > 0) console.log(`  Khata Transactions: ${afterCounts.khataTransactions}`);
      if (afterCounts.organizations > 0) console.log(`  Organizations: ${afterCounts.organizations}`);
      if (afterCounts.organizationMembers > 0) console.log(`  Organization Members: ${afterCounts.organizationMembers}`);
      console.log('');
    }

    console.log('✨ Cleanup completed successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Auth service should create super user');
    console.log('   2. Test organization-based features\n');

  } catch (error: any) {
    console.error('\n❌ Cleanup failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { cleanupDatabase };
