-- Remove unused fields from pixel_art_images table
-- friend_id, widget_id, and size are always null/constant and not used
-- base_image_data is no longer used (user manually deleted remaining records)

ALTER TABLE pixel_art_images 
DROP COLUMN IF EXISTS friend_id,
DROP COLUMN IF EXISTS widget_id,
DROP COLUMN IF EXISTS size,
DROP COLUMN IF EXISTS base_image_data;
