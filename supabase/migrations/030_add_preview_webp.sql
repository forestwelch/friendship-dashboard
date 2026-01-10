-- Add preview_webp column to pixel_art_images table
-- This stores pre-generated grayscale WebP previews for fast loading

ALTER TABLE pixel_art_images 
ADD COLUMN IF NOT EXISTS preview_webp TEXT;
