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
      return 0;
    }

    try {
      const result = await db.delete(table).returning();
      return Array.isArray(result) ? result.length : 0;
    } catch (error: any) {
      // Table doesn't exist yet (before migration) or column doesn't exist
      if (error.code === '42P01' || error.code === '42703') {
        return 0;
      }
      throw error;
    }
  };


  try {
    // Use raw SQL with CASCADE to handle foreign key constraints

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
        await sql(`TRUNCATE TABLE "${tableName}" CASCADE`);
      } catch (error: any) {
        // Table doesn't exist yet
        if (error.code === '42P01') {
        } else {
        }
      }
    }

    return stats;
  } catch (error) {
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
    throw error;
  }
}

/**
 * Main cleanup function
 */
async function main() {

  try {
    // Count documents before cleanup
    const beforeCounts = await countDocuments();


    // Run cleanup
    const stats = await cleanupDatabase();

    // Print summary

    // Verify cleanup
    const afterCounts = await countDocuments();

    const allClean = Object.values(afterCounts).every(count => count === 0);

    if (allClean) {
    } else {
    }


  } catch (error: any) {
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

export { cleanupDatabase };
