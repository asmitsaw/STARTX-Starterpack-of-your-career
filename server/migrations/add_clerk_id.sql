-- Add clerk_id column to users table for Clerk authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Make password nullable for Clerk users (they don't have passwords)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
