-- Update pixel_art_images table to use pixel_data instead of base_image_data
-- This stores 64x64 intensity arrays (4KB) instead of full images (MB)

-- Add new columns
ALTER TABLE pixel_art_images 
ADD COLUMN IF NOT EXISTS pixel_data TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 128,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 128;

-- Note: base_image_data column will be removed in a future migration
-- For now, we keep both for backward compatibility during transition

