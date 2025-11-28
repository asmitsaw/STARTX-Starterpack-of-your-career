-- Add visibility and encryption columns to posts table
-- This migration adds the missing columns that are referenced in the posts route

-- Add visibility column to control post visibility (public, connections, private)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'connections' 
  CHECK (visibility IN ('public', 'connections', 'private'));

-- Add is_encrypted column to support content encryption
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Add media_urls column for enhanced media information (ImageKit integration)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls JSONB;

-- Add index for visibility-based queries
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

-- Add index for encrypted posts
CREATE INDEX IF NOT EXISTS idx_posts_encrypted ON posts(is_encrypted);
