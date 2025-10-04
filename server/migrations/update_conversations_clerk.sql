-- Update conversation_members to use TEXT for user_id (clerk_id compatibility)

-- Drop existing foreign key constraints
ALTER TABLE conversation_members DROP CONSTRAINT IF EXISTS conversation_members_user_id_fkey;

-- Change user_id column type to TEXT
ALTER TABLE conversation_members ALTER COLUMN user_id TYPE TEXT;

-- Do the same for messages table
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT;

-- Recreate indexes
DROP INDEX IF EXISTS idx_conversation_members_user;
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);
