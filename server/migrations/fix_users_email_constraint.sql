-- Make email nullable for Clerk users who might not have email
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Update the unique constraint to allow NULL emails
-- (PostgreSQL allows multiple NULLs in UNIQUE columns by default)

-- Make sure clerk_id is properly indexed and unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id_unique ON users(clerk_id) WHERE clerk_id IS NOT NULL;
