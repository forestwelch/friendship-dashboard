-- Make base_image_data nullable to support new pixel_data format
-- New images use pixel_data (128x128, 16KB) instead of base_image_data (MB)

ALTER TABLE pixel_art_images 
ALTER COLUMN base_image_data DROP NOT NULL;

