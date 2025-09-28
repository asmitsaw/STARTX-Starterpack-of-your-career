-- Pitches and comments migration

-- Create pitches table
CREATE TABLE IF NOT EXISTS pitches (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE IF NOT EXISTS pitch_comments (
  id SERIAL PRIMARY KEY,
  pitch_id INTEGER NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pitch
    FOREIGN KEY(pitch_id)
    REFERENCES pitches(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pitch_comments_pitch_id ON pitch_comments(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitches_user_id ON pitches(user_id);