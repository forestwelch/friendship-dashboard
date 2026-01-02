-- Update grid dimensions from 6x9 to 5x10
-- This updates the check constraints for position_x and position_y

-- First, fix any existing rows that violate the new constraints
-- Move widgets in column 5 (x=5) to column 4 (x=4), wrapping if needed
UPDATE friend_widgets 
SET position_x = 4 
WHERE position_x >= 5;

-- Move widgets in row 9+ (y>=9) to row 9 (y=9), wrapping if needed
UPDATE friend_widgets 
SET position_y = 9 
WHERE position_y >= 10;

-- Handle conflicts: if moving creates duplicates, delete the ones that can't fit
-- Delete widgets that would conflict after the move (keep the one with lower id)
DELETE FROM friend_widgets f1
WHERE EXISTS (
  SELECT 1 FROM friend_widgets f2
  WHERE f2.friend_id = f1.friend_id
    AND f2.position_x = f1.position_x
    AND f2.position_y = f1.position_y
    AND f2.id < f1.id
);

-- Drop existing constraints
ALTER TABLE friend_widgets DROP CONSTRAINT IF EXISTS friend_widgets_position_x_check;
ALTER TABLE friend_widgets DROP CONSTRAINT IF EXISTS friend_widgets_position_y_check;

-- Add new constraints for 5x10 grid
ALTER TABLE friend_widgets 
  ADD CONSTRAINT friend_widgets_position_x_check 
  CHECK (position_x >= 0 AND position_x < 5);

ALTER TABLE friend_widgets 
  ADD CONSTRAINT friend_widgets_position_y_check 
  CHECK (position_y >= 0 AND position_y < 10);
