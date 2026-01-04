-- Add flexible widget size support (1x1 to 5x10, within 5x10 grid)
-- Update size constraints for friend_widgets and pixel_art_images
-- Allow any size from 1x1 up to 4x6 or 5x5 (or any combination that fits in 5x10 grid)

-- Create a function to validate widget size format and bounds
CREATE OR REPLACE FUNCTION is_valid_widget_size(size_text TEXT) RETURNS BOOLEAN AS $$
DECLARE
  cols INTEGER;
  rows INTEGER;
BEGIN
  -- Check format matches NxM pattern (e.g., 1x1, 2x3, 5x10)
  IF size_text !~ '^[1-5]x([1-9]|10)$' THEN
    RETURN FALSE;
  END IF;
  
  -- Extract columns and rows
  cols := (regexp_match(size_text, '^(\d+)x'))[1]::INTEGER;
  rows := (regexp_match(size_text, 'x(\d+)$'))[1]::INTEGER;
  
  -- Validate bounds: 1-5 columns, 1-10 rows, and fits in grid
  RETURN cols >= 1 AND cols <= 5 AND rows >= 1 AND rows <= 10;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update size constraint for friend_widgets
ALTER TABLE friend_widgets DROP CONSTRAINT IF EXISTS friend_widgets_size_check;
ALTER TABLE friend_widgets 
  ADD CONSTRAINT friend_widgets_size_check 
  CHECK (is_valid_widget_size(size));

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
      CHECK (size IS NULL OR is_valid_widget_size(size));
  END IF;
END $$;

-- Add allow_multiple flag to widgets table
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT FALSE;

-- Set allow_multiple to true for pixel_art (only widget type that allows multiple instances)
UPDATE widgets SET allow_multiple = TRUE WHERE type = 'pixel_art';

-- Add unique constraint to prevent duplicate widget types per friend (except those that allow_multiple)
-- Since PostgreSQL doesn't allow subqueries in index predicates, we'll use a trigger function
-- Application-level checks are also in place for safety

-- Create function to check for duplicate widget types
CREATE OR REPLACE FUNCTION check_duplicate_widget_type()
RETURNS TRIGGER AS $$
DECLARE
  allow_multiple_flag BOOLEAN;
  existing_count INTEGER;
BEGIN
  -- Get allow_multiple flag for this widget type
  SELECT allow_multiple INTO allow_multiple_flag
  FROM widgets
  WHERE id = NEW.widget_id;
  
  -- If allow_multiple is true, allow duplicates
  IF allow_multiple_flag = TRUE THEN
    RETURN NEW;
  END IF;
  
  -- Check if this widget type already exists for this friend
  SELECT COUNT(*) INTO existing_count
  FROM friend_widgets
  WHERE friend_id = NEW.friend_id
    AND widget_id = NEW.widget_id
    AND id != NEW.id; -- Exclude the current row being inserted/updated
  
  -- If duplicate found, raise error
  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Only one widget of this type is allowed per friend (widget type: %)', 
      (SELECT type FROM widgets WHERE id = NEW.widget_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce uniqueness
DROP TRIGGER IF EXISTS trigger_check_duplicate_widget_type ON friend_widgets;
CREATE TRIGGER trigger_check_duplicate_widget_type
  BEFORE INSERT OR UPDATE ON friend_widgets
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_widget_type();
