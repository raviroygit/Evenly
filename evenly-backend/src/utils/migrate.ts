import { neon } from '@neondatabase/serverless';
import { config } from '../config/config';

/**
 * Initialize database using Drizzle schema push
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // eslint-disable-next-line no-console
    console.log('🔄 Initializing database with Drizzle schema...');
    
    // Create database connection
    const sql = neon(config.database.url);

    // Test connection
    await sql`SELECT NOW()`;
    // eslint-disable-next-line no-console
    console.log('✅ Database connected successfully');

    // Create tables using raw SQL based on schema
    // eslint-disable-next-line no-console
    console.log('🔄 Creating database tables...');
    await createTablesFromSchema(sql);
    // eslint-disable-next-line no-console
    console.log('✅ Schema created successfully');
    
    // eslint-disable-next-line no-console
    console.log('✅ Database initialization completed');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

/**
 * Create tables based on Drizzle schema
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createTablesFromSchema(sql: any): Promise<void> {
  // Create enums first
  await sql`
    DO $$ BEGIN
      CREATE TYPE split_type AS ENUM ('equal', 'percentage', 'shares', 'exact');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE role AS ENUM ('admin', 'member');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'cancelled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  // Create users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_service_id TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // Create groups table
  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      currency TEXT NOT NULL DEFAULT 'INR',
      default_split_type split_type NOT NULL DEFAULT 'equal',
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // Create group_members table
  await sql`
    CREATE TABLE IF NOT EXISTS group_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role role DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE(group_id, user_id)
    )
  `;

  // Create expenses table
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      total_amount DECIMAL(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      paid_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      split_type split_type NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      date TIMESTAMP NOT NULL,
      receipt TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // Create expense_splits table
  await sql`
    CREATE TABLE IF NOT EXISTS expense_splits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      percentage DECIMAL(5,2),
      shares INTEGER,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // Create user_balances table
  await sql`
    CREATE TABLE IF NOT EXISTS user_balances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      balance DECIMAL(10,2) DEFAULT 0,
      last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE(user_id, group_id)
    )
  `;

  // Create payments table
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      from_user_id UUID NOT NULL REFERENCES users(id),
      to_user_id UUID NOT NULL REFERENCES users(id),
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      status payment_status DEFAULT 'pending',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // Create notifications table
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // Create group_invitations table
  await sql`
    CREATE TABLE IF NOT EXISTS group_invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      invited_by UUID NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // Add missing columns if they don't exist
  await sql`
    DO $$ BEGIN
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS default_split_type split_type DEFAULT 'equal';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  // Fix id column to have proper UUID generation for all tables
  await sql`
    DO $$ BEGIN
      ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE groups ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE group_members ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expense_splits ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE user_balances ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE group_invitations ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  // Add missing columns to users table
  await sql`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_service_id TEXT UNIQUE;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  // Add missing columns to group_members table
  await sql`
    DO $$ BEGIN
      ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  // Add missing columns to group_invitations table
  await sql`
    DO $$ BEGIN
      ALTER TABLE group_invitations ADD COLUMN IF NOT EXISTS invited_email TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE group_invitations ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE group_invitations ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE group_invitations ADD COLUMN IF NOT EXISTS status invitation_status DEFAULT 'pending';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE group_invitations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE group_invitations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  // Drop the old amount column if it exists (to avoid conflicts)
  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses DROP COLUMN IF EXISTS amount;
    EXCEPTION
      WHEN OTHERS THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES users(id);
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_type split_type DEFAULT 'equal';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS date TIMESTAMP;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  // Add missing columns to expense_splits table
  await sql`
    DO $$ BEGIN
      ALTER TABLE expense_splits ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expense_splits ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2);
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE expense_splits ADD COLUMN IF NOT EXISTS shares INTEGER;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id)`;
  await sql`CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS expenses_group_id_idx ON expenses(group_id)`;
  await sql`CREATE INDEX IF NOT EXISTS expense_splits_expense_id_idx ON expense_splits(expense_id)`;
  await sql`CREATE INDEX IF NOT EXISTS user_balances_user_id_idx ON user_balances(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS user_balances_group_id_idx ON user_balances(group_id)`;
  await sql`CREATE INDEX IF NOT EXISTS payments_group_id_idx ON payments(group_id)`;
  await sql`CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id)`;
}
