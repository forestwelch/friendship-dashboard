-- Add albums table and album_id column to pixel_art_images
-- Albums allow grouping photos together for easier organization

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add album_id column to pixel_art_images (nullable, references albums)
ALTER TABLE pixel_art_images
ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES albums(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_albums_name ON albums(name);
CREATE INDEX IF NOT EXISTS idx_pixel_art_images_album_id ON pixel_art_images(album_id);
