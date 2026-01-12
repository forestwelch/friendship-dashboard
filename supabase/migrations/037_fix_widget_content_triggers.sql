-- Fix widget notification triggers: add missing triggers and improve error handling
-- This migration updates the trigger function and adds triggers for inbox_items and global_content

-- Update the function to handle inbox_items and global_content, and add better error handling
CREATE OR REPLACE FUNCTION update_widget_last_updated_by_type()
RETURNS TRIGGER AS $$
DECLARE
  widget_type_id UUID;
  friend_id_val UUID;
BEGIN
  -- Get friend_id from the trigger context
  IF TG_TABLE_NAME = 'connect_four_games' THEN
    friend_id_val := NEW.friend_id;
    -- Get widget type ID for connect_four
    SELECT id INTO widget_type_id FROM widgets WHERE type = 'connect_four' LIMIT 1;
  ELSIF TG_TABLE_NAME = 'fridge_state' THEN
    friend_id_val := NEW.friend_id;
    -- Get widget type ID for fridge_magnets
    SELECT id INTO widget_type_id FROM widgets WHERE type = 'fridge_magnets' LIMIT 1;
  ELSIF TG_TABLE_NAME = 'audio_snippets' THEN
    friend_id_val := NEW.friend_id;
    -- Get widget type ID for audio_snippets
    SELECT id INTO widget_type_id FROM widgets WHERE type = 'audio_snippets' LIMIT 1;
  ELSIF TG_TABLE_NAME = 'inbox_items' THEN
    friend_id_val := NEW.friend_id;
    -- Get widget type ID for media_recommendations (recommendations go to inbox_items)
    SELECT id INTO widget_type_id FROM widgets WHERE type = 'media_recommendations' LIMIT 1;
  ELSIF TG_TABLE_NAME = 'global_content' THEN
    -- For global_content, update ALL friends' music_player widgets when songs change
    IF NEW.content_type = 'top_10_songs' THEN
      SELECT id INTO widget_type_id FROM widgets WHERE type = 'music_player' LIMIT 1;
      IF widget_type_id IS NOT NULL THEN
        -- Update all friends' music_player widgets
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
    
    -- Log if no rows were updated (widget might not exist for this friend)
    IF NOT FOUND THEN
      RAISE WARNING 'Widget notification trigger: No widget found for friend_id=%, widget_type_id=%', friend_id_val, widget_type_id;
    END IF;
  ELSE
    RAISE WARNING 'Widget notification trigger: Missing widget_type_id or friend_id_val. Table=%, widget_type_id=%, friend_id_val=%', TG_TABLE_NAME, widget_type_id, friend_id_val;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for inbox_items (on INSERT - new recommendation added)
DROP TRIGGER IF EXISTS trigger_update_widget_on_inbox_item_insert ON inbox_items;
CREATE TRIGGER trigger_update_widget_on_inbox_item_insert
  AFTER INSERT ON inbox_items
  FOR EACH ROW
  WHEN (NEW.type = 'recommendation')
  EXECUTE FUNCTION update_widget_last_updated_by_type();

-- Trigger for global_content (on UPDATE - songs updated)
DROP TRIGGER IF EXISTS trigger_update_widget_on_global_content_update ON global_content;
CREATE TRIGGER trigger_update_widget_on_global_content_update
  AFTER UPDATE ON global_content
  FOR EACH ROW
  WHEN (NEW.content_type = 'top_10_songs')
  EXECUTE FUNCTION update_widget_last_updated_by_type();
