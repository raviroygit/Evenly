/**
 * Migration Script: Sync Organizations from Auth Service
 *
 * This script syncs organizations from the auth service to the backend database
 * and assigns existing user data (groups, expenses, khata customers) to their
 * personal organizations.
 *
 * Run with: npm run migrate:sync-orgs
 */

import { db } from '../db';
import { users, organizations, organizationMembers, groups, expenses, khataCustomers } from '../db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationStats {
  totalUsers: number;
  orgsCreated: number;
  membershipsCreated: number;
  groupsAssigned: number;
  expensesAssigned: number;
  khataCustomersAssigned: number;
  errors: Array<{ userId: string; email?: string; error: string }>;
}

const stats: MigrationStats = {
  totalUsers: 0,
  orgsCreated: 0,
  membershipsCreated: 0,
  groupsAssigned: 0,
  expensesAssigned: 0,
  khataCustomersAssigned: 0,
  errors: []
};

// Auth Service MongoDB Schemas (minimal definitions for migration)
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  phoneNumber: String,
  defaultOrganizationId: String,
  lastOrganizationId: String,
  createdAt: Date,
}, { collection: 'users' });

const OrganizationSchema = new mongoose.Schema({
  name: String,
  slug: String,
  displayName: String,
  logo: String,
  plan: String,
  maxMembers: Number,
  createdBy: String,
  createdAt: Date,
  deletedAt: Date,
}, { collection: 'organizations' });

const OrganizationMemberSchema = new mongoose.Schema({
  organizationId: String,
  userId: String,
  role: String,
  status: String,
  joinedAt: Date,
}, { collection: 'organizationmembers' });

/**
 * Connect to Auth Service MongoDB
 */
async function connectAuthServiceDB() {
  try {
    const mongoUri = process.env.AUTH_MONGODB_URL || process.env.MONGODB_URL;
    if (!mongoUri) {
      throw new Error('AUTH_MONGODB_URL or MONGODB_URL not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Auth Service MongoDB');

    return {
      User: mongoose.model('User', UserSchema),
      Organization: mongoose.model('Organization', OrganizationSchema),
      OrganizationMember: mongoose.model('OrganizationMember', OrganizationMemberSchema),
    };
  } catch (error) {
    console.error('❌ Auth Service MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from Auth Service MongoDB
 */
async function disconnectAuthServiceDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from Auth Service MongoDB');
  } catch (error) {
    console.error('❌ Auth Service MongoDB disconnection failed:', error);
  }
}

/**
 * Migrate a single user's organization
 */
async function migrateUserOrganization(
  backendUser: any,
  authModels: any
): Promise<boolean> {
  try {
    // Find corresponding user in auth service by email
    const authUser = await authModels.User.findOne({
      $or: [
        { email: backendUser.email },
        { phoneNumber: backendUser.phoneNumber },
        { _id: backendUser.authServiceUserId }
      ]
    });

    if (!authUser) {
      console.log(`⚠️  No auth service user found for backend user ${backendUser.email || backendUser.id}`);
      return false;
    }

    if (!authUser.defaultOrganizationId) {
      console.log(`⚠️  Auth user ${authUser.email} has no default organization - skipping`);
      return false;
    }

    // Fetch organization from auth service
    const authOrg = await authModels.Organization.findById(authUser.defaultOrganizationId);
    if (!authOrg) {
      console.log(`⚠️  Organization ${authUser.defaultOrganizationId} not found - skipping`);
      return false;
    }

    // Check if organization already exists in backend
    const existingOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.authServiceOrgId, authOrg._id.toString()))
      .limit(1);

    let localOrgId: string;

    if (existingOrgs.length > 0) {
      localOrgId = existingOrgs[0].id;
      console.log(`✓ Organization ${authOrg.slug} already exists in backend`);
    } else {
      // Create organization in backend
      const [newOrg] = await db
        .insert(organizations)
        .values({
          authServiceOrgId: authOrg._id.toString(),
          name: authOrg.name,
          slug: authOrg.slug,
          displayName: authOrg.displayName,
          logo: authOrg.logo,
          plan: authOrg.plan || 'free',
          maxMembers: authOrg.maxMembers || 10,
          createdBy: backendUser.id,
        })
        .returning();

      localOrgId = newOrg.id;
      stats.orgsCreated++;
      console.log(`✅ Created organization ${authOrg.slug} in backend`);
    }

    // Check if membership already exists
    const existingMemberships = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, localOrgId),
          eq(organizationMembers.userId, backendUser.id)
        )
      )
      .limit(1);

    if (existingMemberships.length === 0) {
      // Fetch membership from auth service
      const authMembership = await authModels.OrganizationMember.findOne({
        organizationId: authOrg._id.toString(),
        userId: authUser._id.toString(),
      });

      // Create membership in backend
      await db.insert(organizationMembers).values({
        organizationId: localOrgId,
        userId: backendUser.id,
        role: authMembership?.role || 'owner',
        status: authMembership?.status || 'active',
        joinedAt: authMembership?.joinedAt || new Date(),
      });

      stats.membershipsCreated++;
      console.log(`✅ Created membership for user ${backendUser.email} in organization ${authOrg.slug}`);
    }

    // Assign user's groups to organization
    const userGroups = await db
      .select()
      .from(groups)
      .where(
        and(
          eq(groups.createdBy, backendUser.id),
          isNull(groups.organizationId)
        )
      );

    if (userGroups.length > 0) {
      await db
        .update(groups)
        .set({ organizationId: localOrgId })
        .where(
          and(
            eq(groups.createdBy, backendUser.id),
            isNull(groups.organizationId)
          )
        );
      stats.groupsAssigned += userGroups.length;
      console.log(`✅ Assigned ${userGroups.length} groups to organization ${authOrg.slug}`);
    }

    // Assign user's expenses to organization
    const userExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.paidBy, backendUser.id),
          isNull(expenses.organizationId)
        )
      );

    if (userExpenses.length > 0) {
      await db
        .update(expenses)
        .set({ organizationId: localOrgId })
        .where(
          and(
            eq(expenses.paidBy, backendUser.id),
            isNull(expenses.organizationId)
          )
        );
      stats.expensesAssigned += userExpenses.length;
      console.log(`✅ Assigned ${userExpenses.length} expenses to organization ${authOrg.slug}`);
    }

    // Assign user's khata customers to organization
    const userCustomers = await db
      .select()
      .from(khataCustomers)
      .where(
        and(
          eq(khataCustomers.userId, backendUser.id),
          isNull(khataCustomers.organizationId)
        )
      );

    if (userCustomers.length > 0) {
      await db
        .update(khataCustomers)
        .set({ organizationId: localOrgId })
        .where(
          and(
            eq(khataCustomers.userId, backendUser.id),
            isNull(khataCustomers.organizationId)
          )
        );
      stats.khataCustomersAssigned += userCustomers.length;
      console.log(`✅ Assigned ${userCustomers.length} khata customers to organization ${authOrg.slug}`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Failed to migrate user ${backendUser.email || backendUser.id}:`, error.message);
    stats.errors.push({
      userId: backendUser.id,
      email: backendUser.email,
      error: error.message
    });
    return false;
  }
}

/**
 * Main migration function
 */
async function syncOrganizations() {
  console.log('\n========================================');
  console.log('🚀 Starting Organization Sync Migration');
  console.log('========================================\n');

  let authModels: any;

  try {
    // Connect to auth service database
    authModels = await connectAuthServiceDB();

    // Get all users from backend
    const backendUsers = await db.select().from(users);
    stats.totalUsers = backendUsers.length;

    console.log(`📊 Found ${stats.totalUsers} users in backend\n`);

    if (stats.totalUsers === 0) {
      console.log('✨ No users found in backend. Nothing to migrate!\n');
      return;
    }

    // Migrate each user
    for (const backendUser of backendUsers) {
      console.log(`\n🔄 Processing user: ${backendUser.email || backendUser.id}`);
      await migrateUserOrganization(backendUser, authModels);
    }

    // Print summary
    console.log('\n========================================');
    console.log('📊 Migration Summary');
    console.log('========================================');
    console.log(`Total users processed:         ${stats.totalUsers}`);
    console.log(`Organizations created:         ${stats.orgsCreated} ✅`);
    console.log(`Memberships created:           ${stats.membershipsCreated} ✅`);
    console.log(`Groups assigned:               ${stats.groupsAssigned} 📁`);
    console.log(`Expenses assigned:             ${stats.expensesAssigned} 💰`);
    console.log(`Khata customers assigned:      ${stats.khataCustomersAssigned} 📒`);
    console.log(`Errors:                        ${stats.errors.length} ❌`);
    console.log('========================================\n');

    // Print errors if any
    if (stats.errors.length > 0) {
      console.log('❌ Migration Errors:\n');
      stats.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. User ID: ${err.userId}`);
        if (err.email) console.log(`   Email: ${err.email}`);
        console.log(`   Error: ${err.error}\n`);
      });
    }

    // Verification
    console.log('🔍 Running verification...');

    const orgsWithoutAssignedData = await db
      .select()
      .from(groups)
      .where(isNull(groups.organizationId))
      .limit(10);

    if (orgsWithoutAssignedData.length === 0) {
      console.log('✅ Verification passed: All groups have organizations!\n');
    } else {
      console.log(`⚠️  Verification warning: ${orgsWithoutAssignedData.length}+ groups still without organizations\n`);
    }

    console.log('✨ Migration completed successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed with error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    if (authModels) {
      await disconnectAuthServiceDB();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  syncOrganizations()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { syncOrganizations };
