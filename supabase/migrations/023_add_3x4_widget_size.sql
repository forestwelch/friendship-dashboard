-- Add 3x4 widget size support
-- Update size constraints for friend_widgets and pixel_art_images

-- Update size constraint for friend_widgets
ALTER TABLE friend_widgets DROP CONSTRAINT IF EXISTS friend_widgets_size_check;
ALTER TABLE friend_widgets 
  ADD CONSTRAINT friend_widgets_size_check 
  CHECK (size IN ('1x1', '2x1', '2x2', '3x3', '1x2', '1x3', '2x3', '3x4'));

-- Update size constraint for pixel_art_images (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pixel_art_images_size_check'
  ) THEN
    ALTER TABLE pixel_art_images DROP CONSTRAINT pixel_art_images_size_check;
    ALTER TABLE pixel_art_images 
      ADD CONSTRAINT pixel_art_images_size_check 
      CHECK (size IS NULL OR size IN ('1x1', '2x1', '2x2', '3x3', '1x2', '1x3', '2x3', '3x4'));
  END IF;
END $$;
