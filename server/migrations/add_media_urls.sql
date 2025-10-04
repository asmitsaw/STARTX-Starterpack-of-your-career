-- Add media_urls column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'media_urls'
    ) THEN
        ALTER TABLE posts ADD COLUMN media_urls TEXT[];
    END IF;
END $$;

-- Also ensure media_url and media_type exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'media_url'
    ) THEN
        ALTER TABLE posts ADD COLUMN media_url TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'media_type'
    ) THEN
        ALTER TABLE posts ADD COLUMN media_type VARCHAR(50);
    END IF;
END $$;
