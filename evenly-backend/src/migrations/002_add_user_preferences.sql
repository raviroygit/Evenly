-- Migration: Add User Preferences
-- Description: Adds preferred_language and preferred_currency columns to users table
-- Date: 2026-02-12

-- Step 1: Add preferred_language column to users table
ALTER TABLE users
ADD COLUMN preferred_language TEXT DEFAULT 'en';

-- Step 2: Add preferred_currency column to users table
ALTER TABLE users
ADD COLUMN preferred_currency TEXT DEFAULT 'INR';

-- Step 3: Create indexes for better query performance
CREATE INDEX users_preferred_language_idx ON users(preferred_language);
CREATE INDEX users_preferred_currency_idx ON users(preferred_currency);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN users.preferred_language IS 'User preferred language for emails and notifications (en, hi)';
COMMENT ON COLUMN users.preferred_currency IS 'User preferred currency for displaying amounts (INR, USD, EUR, GBP, AUD, CAD, JPY, CNY, AED, SAR)';
