-- Remove inbox_items table and all related functionality
-- This migration removes all inbox functionality including triggers, policies, and the table itself

-- Drop the trigger for inbox_items if it exists
DROP TRIGGER IF EXISTS trigger_update_widget_on_inbox_item_insert ON inbox_items;

-- Drop RLS policies for inbox_items if they exist
DROP POLICY IF EXISTS "Inbox items are viewable by everyone" ON inbox_items;
DROP POLICY IF EXISTS "Only admins can manage inbox items" ON inbox_items;
DROP POLICY IF EXISTS "Allow public writes to inbox_items (DEV ONLY)" ON inbox_items;

-- Update the trigger function to remove inbox_items handling
-- This matches the function from migration 038 but without the inbox_items case
CREATE OR REPLACE FUNCTION update_widget_last_updated_by_type()
RETURNS TRIGGER AS $$
DECLARE
  widget_type_id UUID;
  friend_id_val UUID;
  rows_updated INTEGER;
BEGIN
  -- Get friend_id from the trigger context
  IF TG_TABLE_NAME = 'connect_four_games' THEN
    friend_id_val := NEW.friend_id;
    SELECT id INTO widget_type_id FROM widgets WHERE type = 'connect_four' LIMIT 1;
  ELSIF TG_TABLE_NAME = 'fridge_state' THEN
    friend_id_val := NEW.friend_id;
    -- Get widget type ID for fridge_magnets
    SELECT id INTO widget_type_id FROM widgets WHERE type = 'fridge_magnets' LIMIT 1;
    
    -- Enhanced logging for fridge_state
    IF widget_type_id IS NULL THEN
      RAISE WARNING 'Fridge trigger: Widget type "fridge_magnets" not found in widgets table';
    END IF;
    IF friend_id_val IS NULL THEN
      RAISE WARNING 'Fridge trigger: friend_id is NULL in NEW record';
    END IF;
  ELSIF TG_TABLE_NAME = 'audio_snippets' THEN
    friend_id_val := NEW.friend_id;
    SELECT id INTO widget_type_id FROM widgets WHERE type = 'audio_snippets' LIMIT 1;
  ELSIF TG_TABLE_NAME = 'global_content' THEN
    IF NEW.content_type = 'top_10_songs' THEN
      SELECT id INTO widget_type_id FROM widgets WHERE type = 'music_player' LIMIT 1;
      IF widget_type_id IS NOT NULL THEN
        UPDATE friend_widgets
        SET last_updated_at = NOW()
        WHERE widget_id = widget_type_id;
      END IF;
      RETURN NEW;
    END IF;
    RETURN NEW;
  ELSE
    RETURN NEW;
  END IF;

  -- Update last_updated_at for the widget if it exists
  IF widget_type_id IS NOT NULL AND friend_id_val IS NOT NULL THEN
    UPDATE friend_widgets
    SET last_updated_at = NOW()
    WHERE friend_id = friend_id_val
      AND widget_id = widget_type_id;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    -- Log results for fridge_state specifically
    IF TG_TABLE_NAME = 'fridge_state' THEN
      IF rows_updated = 0 THEN
        RAISE WARNING 'Fridge trigger: Updated 0 rows. friend_id=%, widget_type_id=%. Check if widget exists for this friend.', friend_id_val, widget_type_id;
      ELSE
        RAISE NOTICE 'Fridge trigger: Successfully updated % row(s) for friend_id=%, widget_type_id=%', rows_updated, friend_id_val, widget_type_id;
      END IF;
    END IF;
    
    -- Log if no rows were updated (widget might not exist for this friend)
    IF NOT FOUND AND TG_TABLE_NAME != 'fridge_state' THEN
      RAISE WARNING 'Widget notification trigger: No widget found for friend_id=%, widget_type_id=%', friend_id_val, widget_type_id;
    END IF;
  ELSE
    IF TG_TABLE_NAME = 'fridge_state' THEN
      RAISE WARNING 'Fridge trigger: Missing widget_type_id or friend_id_val. widget_type_id=%, friend_id_val=%', widget_type_id, friend_id_val;
    ELSE
      RAISE WARNING 'Widget notification trigger: Missing widget_type_id or friend_id_val. Table=%, widget_type_id=%, friend_id_val=%', TG_TABLE_NAME, widget_type_id, friend_id_val;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the inbox_items table (CASCADE will drop dependent objects like indexes and foreign key constraints)
DROP TABLE IF EXISTS inbox_items CASCADE;
