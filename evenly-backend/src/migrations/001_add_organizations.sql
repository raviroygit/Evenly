-- Migration: Add Organizations Support
-- Description: Adds organizations and organizationMembers tables, adds organizationId to existing tables
-- Date: 2026-01-20

-- Step 1: Create organization_role enum
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member', 'guest');

-- Step 2: Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_service_org_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT,
  logo TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  max_members INTEGER NOT NULL DEFAULT 10,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 3: Create indexes on organizations table
CREATE INDEX organizations_auth_service_org_id_idx ON organizations(auth_service_org_id);
CREATE INDEX organizations_slug_idx ON organizations(slug);

-- Step 4: Create organization_members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role organization_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 5: Create indexes on organization_members table
CREATE INDEX organization_members_org_user_idx ON organization_members(organization_id, user_id);
CREATE INDEX organization_members_user_id_idx ON organization_members(user_id);

-- Step 6: Add organizationId to groups table
ALTER TABLE groups ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX groups_organization_id_idx ON groups(organization_id);
CREATE INDEX groups_created_by_idx ON groups(created_by);

-- Step 7: Add organizationId to expenses table
ALTER TABLE expenses ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX expenses_organization_id_idx ON expenses(organization_id);

-- Step 8: Add organizationId to khata_customers table
ALTER TABLE khata_customers ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX khata_customers_organization_id_idx ON khata_customers(organization_id);

-- Step 9: Update updated_at trigger for organizations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: organizationId columns are nullable initially to allow migration
-- They will be populated by the migration script, then made NOT NULL
-- Run the TypeScript migration script after this SQL migration:
-- npm run migrate:sync-organizations
