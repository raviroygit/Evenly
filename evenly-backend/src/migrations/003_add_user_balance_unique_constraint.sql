-- Migration: Add unique constraint on user_balances (userId, groupId)
-- This prevents duplicate balance records for the same user in the same group

-- First, remove any duplicate records (keep the most recent one)
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
);

-- Add unique constraint
ALTER TABLE user_balances
ADD CONSTRAINT user_balances_user_group_unique UNIQUE (user_id, group_id);
