-- Debug and fix fridge_state trigger
-- Add detailed logging to diagnose why fridge magnets trigger isn't working

-- Create a test function to check if fridge_state updates are triggering
CREATE OR REPLACE FUNCTION test_fridge_trigger()
RETURNS TABLE (
  trigger_exists BOOLEAN,
  trigger_table TEXT,
  trigger_function TEXT,
  widget_type_exists BOOLEAN,
  widget_type_id UUID,
  widget_type_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trigger_update_widget_on_fridge_change'
      AND tgrelid = 'fridge_state'::regclass
    ) as trigger_exists,
    'fridge_state'::TEXT as trigger_table,
    'update_widget_last_updated_by_type'::TEXT as trigger_function,
    EXISTS (SELECT 1 FROM widgets WHERE type = 'fridge_magnets') as widget_type_exists,
    (SELECT id FROM widgets WHERE type = 'fridge_magnets' LIMIT 1) as widget_type_id,
    (SELECT type FROM widgets WHERE type = 'fridge_magnets' LIMIT 1) as widget_type_name;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function with better logging for fridge_state
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
  ELSIF TG_TABLE_NAME = 'inbox_items' THEN
    friend_id_val := NEW.friend_id;
    SELECT id INTO widget_type_id FROM widgets WHERE type = 'media_recommendations' LIMIT 1;
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
