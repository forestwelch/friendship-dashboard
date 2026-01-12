-- Widget notification triggers for content tables
-- Automatically update friend_widgets.last_updated_at when content changes
-- in related tables (connect_four_games, fridge_state, audio_snippets)

-- Function to update friend_widgets.last_updated_at for a specific widget type
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
  ELSE
    RETURN NEW;
  END IF;

  -- Update last_updated_at for the widget if it exists
  IF widget_type_id IS NOT NULL AND friend_id_val IS NOT NULL THEN
    UPDATE friend_widgets
    SET last_updated_at = NOW()
    WHERE friend_id = friend_id_val
      AND widget_id = widget_type_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for connect_four_games (on INSERT or UPDATE)
DROP TRIGGER IF EXISTS trigger_update_widget_on_connect_four_change ON connect_four_games;
CREATE TRIGGER trigger_update_widget_on_connect_four_change
  AFTER INSERT OR UPDATE ON connect_four_games
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_last_updated_by_type();

-- Trigger for fridge_state (on INSERT or UPDATE)
DROP TRIGGER IF EXISTS trigger_update_widget_on_fridge_change ON fridge_state;
CREATE TRIGGER trigger_update_widget_on_fridge_change
  AFTER INSERT OR UPDATE ON fridge_state
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_last_updated_by_type();

-- Trigger for audio_snippets (on INSERT - new audio snippet added)
DROP TRIGGER IF EXISTS trigger_update_widget_on_audio_snippet_insert ON audio_snippets;
CREATE TRIGGER trigger_update_widget_on_audio_snippet_insert
  AFTER INSERT ON audio_snippets
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_last_updated_by_type();
