-- Rename preview_webp column to preview (format-agnostic)
-- The column stores PNG previews

ALTER TABLE pixel_art_images 
RENAME COLUMN preview_webp TO preview;
