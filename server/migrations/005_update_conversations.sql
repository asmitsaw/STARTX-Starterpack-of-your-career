-- Update existing conversations table to add missing columns
-- This migration updates the schema to match the new messaging system

-- Add type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'type'
    ) THEN
        ALTER TABLE conversations ADD COLUMN type VARCHAR(20) DEFAULT 'direct';
    END IF;
END $$;

-- Add name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'name'
    ) THEN
        ALTER TABLE conversations ADD COLUMN name VARCHAR(255);
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Update existing conversations to have type 'direct'
UPDATE conversations SET type = 'direct' WHERE type IS NULL;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

COMMENT ON COLUMN conversations.type IS 'Type of conversation: direct, group, or ai';
COMMENT ON COLUMN conversations.name IS 'Name for group chats or AI conversations';
COMMENT ON COLUMN conversations.updated_at IS 'Last activity timestamp';
