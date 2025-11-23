-- Migrate existing "image" widgets to "pixel_art" widget type
-- This ensures backward compatibility

UPDATE friend_widgets 
SET widget_id = (SELECT id FROM widgets WHERE type = 'pixel_art')
WHERE widget_id = (SELECT id FROM widgets WHERE type = 'image');

-- Delete the "image" widget type (after migration)
DELETE FROM widgets WHERE type = 'image';

