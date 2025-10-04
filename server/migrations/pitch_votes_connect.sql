-- Add votes and direct connect functionality to pitches

-- Create table for pitch votes
CREATE TABLE IF NOT EXISTS pitch_votes (
  id SERIAL PRIMARY KEY,
  pitch_id INTEGER NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pitch_id, user_id)
);

-- Create table for direct connect requests
CREATE TABLE IF NOT EXISTS pitch_connect_requests (
  id SERIAL PRIMARY KEY,
  pitch_id INTEGER NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add vote counts to pitches table for quick access
ALTER TABLE pitches ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE pitches ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pitch_votes_pitch_id ON pitch_votes(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitch_votes_user_id ON pitch_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_pitch_connect_pitch_id ON pitch_connect_requests(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitch_connect_requester_id ON pitch_connect_requests(requester_id);