-- Connection/Follow System for Messaging
-- Users must be connected before they can message each other

-- Create connections table if not exists
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  connected_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'blocked'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id),
  CHECK (user_id != connected_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connections_user ON connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user ON connections(connected_user_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- Function to check if two users are connected
CREATE OR REPLACE FUNCTION are_users_connected(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'accepted'
      AND (
        (user_id = user1_id AND connected_user_id = user2_id)
        OR
        (user_id = user2_id AND connected_user_id = user1_id)
      )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get connection status between two users
CREATE OR REPLACE FUNCTION get_connection_status(user1_id UUID, user2_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  conn_status VARCHAR;
BEGIN
  -- Check if user1 sent request to user2
  SELECT status INTO conn_status
  FROM connections
  WHERE user_id = user1_id AND connected_user_id = user2_id;
  
  IF conn_status IS NOT NULL THEN
    RETURN conn_status;
  END IF;
  
  -- Check if user2 sent request to user1
  SELECT status INTO conn_status
  FROM connections
  WHERE user_id = user2_id AND connected_user_id = user1_id;
  
  IF conn_status IS NOT NULL THEN
    RETURN 'received_' || conn_status;
  END IF;
  
  RETURN 'none';
END;
$$ LANGUAGE plpgsql;

-- Add connection_required flag to conversations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'connection_required'
    ) THEN
        ALTER TABLE conversations ADD COLUMN connection_required BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update trigger to update updated_at on connections
CREATE OR REPLACE FUNCTION update_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_connection_timestamp ON connections;
CREATE TRIGGER trigger_update_connection_timestamp
BEFORE UPDATE ON connections
FOR EACH ROW
EXECUTE FUNCTION update_connection_timestamp();

COMMENT ON TABLE connections IS 'User connections/follows for messaging';
COMMENT ON COLUMN connections.status IS 'pending: request sent, accepted: connected, rejected: declined, blocked: blocked user';
