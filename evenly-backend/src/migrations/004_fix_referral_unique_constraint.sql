-- Migration: Fix referral unique constraint
-- Problem: referral_code had a UNIQUE constraint, so only 1 person could use a given code.
-- Fix: Remove unique from referral_code, add unique on referred_user_id instead
-- (each user can only be referred once, but a code can be used by many people)

-- Step 1: Drop the existing unique constraint on referral_code
-- (constraint name may vary, try both common patterns)
DO $$
BEGIN
  -- Try dropping by index name (Drizzle generates this pattern)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'referrals_referral_code_unique') THEN
    ALTER TABLE referrals DROP CONSTRAINT referrals_referral_code_unique;
  END IF;
  -- Try alternate naming pattern
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referral_code_key') THEN
    ALTER TABLE referrals DROP CONSTRAINT referrals_referral_code_key;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not drop referral_code unique constraint: %', SQLERRM;
END $$;

-- Step 2: Add unique constraint on referred_user_id (each user can only be referred once)
-- Only add if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referred_user_id_unique'
  ) THEN
    ALTER TABLE referrals ADD CONSTRAINT referrals_referred_user_id_unique UNIQUE (referred_user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add referred_user_id unique constraint: %', SQLERRM;
END $$;
