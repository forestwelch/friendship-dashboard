-- Update pixel_art_images table to use pixel_data instead of base_image_data
-- This stores 128x128 intensity arrays (~16KB) instead of full images (MB)

-- Make base_image_data nullable (new images use pixel_data instead)
ALTER TABLE pixel_art_images 
ALTER COLUMN base_image_data DROP NOT NULL;

-- Add new columns
ALTER TABLE pixel_art_images 
ADD COLUMN IF NOT EXISTS pixel_data TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 128,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 128;

-- Note: base_image_data column is kept for backward compatibility but is now nullable
-- New images should use pixel_data (NOT NULL constraint will be added later)

