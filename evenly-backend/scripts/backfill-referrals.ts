#!/usr/bin/env tsx

/**
 * One-time script to backfill missing referral records.
 *
 * Problem: referrals table had UNIQUE on referral_code, so only the first
 * person who used a code got recorded. The other invited users' INSERTs
 * failed silently.
 *
 * This script:
 * 1. Finds the referrer (Arvind Kumar - ajmk075@gmail.com)
 * 2. Finds the invited users by email
 * 3. Inserts missing referral records (skips if already exists)
 * 4. Does NOT delete or modify any existing data
 *
 * Run: npx tsx scripts/backfill-referrals.ts
 */

import { eq } from 'drizzle-orm';
import { db, users, referrals } from '../src/db';

const REFERRER_EMAIL = 'ajmk075@gmail.com';
const INVITED_EMAILS = [
  'kuldeeprangian25@gmail.com',
  'amitranga74664@gmail.com',
  'sumitkumarby1256@gmail.com',
];

async function main() {
  console.log('🔍 Looking up referrer:', REFERRER_EMAIL);

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

    // Check if referral record already exists for this user
    const [existing] = await db
      .select({ id: referrals.id })
      .from(referrals)
      .where(eq(referrals.referredUserId, invitedUser.id))
      .limit(1);

    if (existing) {
      console.log(`  ⏭️  Referral record already exists for ${invitedUser.name} — skipping`);
      skipped++;
      continue;
    }

    // Insert missing referral record
    await db.insert(referrals).values({
      referrerId: referrer.id,
      referralCode: referrer.referralCode,
      referredUserId: invitedUser.id,
      status: 'completed',
    });

    console.log(`  ✅ Created referral: ${referrer.name} → ${invitedUser.name}`);
    inserted++;
  }

  console.log(`\n📊 Done! Inserted: ${inserted}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
