#!/usr/bin/env tsx

/**
 * One-time script to:
 * 1. Fix the unique constraint on referrals table (drop unique on referral_code)
 * 2. Backfill missing referral records for Arvind Kumar's invites
 *
 * Run: npx tsx scripts/backfill-referrals.ts
 */

import { eq, sql } from 'drizzle-orm';
import { db, users, referrals } from '../src/db';

const REFERRER_EMAIL = 'ajmk075@gmail.com';
const INVITED_EMAILS = [
  'kuldeeprangian25@gmail.com',
  'amitranga74664@gmail.com',
  'sumitkumarby1256@gmail.com',
];

async function main() {
  // Step 1: Fix the constraint first
  console.log('🔧 Step 1: Fixing referrals table constraints...');
  try {
    await db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referral_code_key') THEN
          ALTER TABLE referrals DROP CONSTRAINT referrals_referral_code_key;
          RAISE NOTICE 'Dropped referrals_referral_code_key';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop constraint: %', SQLERRM;
      END $$;
    `);
    console.log('✅ Unique constraint on referral_code dropped (or already removed)');
  } catch (err: any) {
    console.log('⚠️  Constraint drop result:', err.message);
  }

  // Also try the alternate name pattern
  try {
    await db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referral_code_unique') THEN
          ALTER TABLE referrals DROP CONSTRAINT referrals_referral_code_unique;
          RAISE NOTICE 'Dropped referrals_referral_code_unique';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop constraint: %', SQLERRM;
      END $$;
    `);
  } catch {
    // ignore
  }

  // Add unique on referred_user_id if not exists
  try {
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referred_user_id_unique' OR conname = 'referrals_referred_user_id_key') THEN
          ALTER TABLE referrals ADD CONSTRAINT referrals_referred_user_id_unique UNIQUE (referred_user_id);
          RAISE NOTICE 'Added unique on referred_user_id';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add constraint: %', SQLERRM;
      END $$;
    `);
    console.log('✅ Unique constraint on referred_user_id ensured');
  } catch (err: any) {
    console.log('⚠️  referred_user_id constraint result:', err.message);
  }

  // Step 2: Backfill missing referrals
  console.log('\n🔍 Step 2: Looking up referrer:', REFERRER_EMAIL);

  const [referrer] = await db
    .select({ id: users.id, name: users.name, referralCode: users.referralCode })
    .from(users)
    .where(eq(users.email, REFERRER_EMAIL))
    .limit(1);

  if (!referrer) {
    console.error('❌ Referrer not found:', REFERRER_EMAIL);
    process.exit(1);
  }

  if (!referrer.referralCode) {
    console.error('❌ Referrer has no referral code');
    process.exit(1);
  }

  console.log(`✅ Found referrer: ${referrer.name} (code: ${referrer.referralCode})`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const email of INVITED_EMAILS) {
    console.log(`\n🔍 Processing: ${email}`);

    // Find the invited user
    const [invitedUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!invitedUser) {
      console.log(`  ⚠️  User not found in database — skipping`);
      skipped++;
      continue;
    }

    console.log(`  👤 Found user: ${invitedUser.name} (${invitedUser.id})`);

    // Check if referral record already exists for this user
    const [existing] = await db
      .select({ id: referrals.id, referralCode: referrals.referralCode })
      .from(referrals)
      .where(eq(referrals.referredUserId, invitedUser.id))
      .limit(1);

    if (existing) {
      console.log(`  ⏭️  Referral record already exists (code: ${existing.referralCode}) — skipping`);
      skipped++;
      continue;
    }

    // Insert missing referral record
    try {
      await db.insert(referrals).values({
        referrerId: referrer.id,
        referralCode: referrer.referralCode,
        referredUserId: invitedUser.id,
        status: 'completed',
      });
      console.log(`  ✅ Created referral: ${referrer.name} → ${invitedUser.name}`);
      inserted++;
    } catch (err: any) {
      console.error(`  ❌ INSERT failed for ${invitedUser.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Done! Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
