-- Refactor widget trigger to use a mapping table instead of hardcoded IF/ELSIF chain
-- This allows new widgets to be added without modifying the trigger function

-- Create mapping table for widget content tables to widget types
CREATE TABLE IF NOT EXISTS widget_content_mappings (
  table_name TEXT PRIMARY KEY,
  widget_type TEXT NOT NULL REFERENCES widgets(type) ON DELETE CASCADE,
  friend_id_column TEXT NOT NULL DEFAULT 'friend_id',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert existing mappings for tables that need widget update triggers
-- Note: consumption_log and question_jar exist but don't currently have triggers
-- Add them here if you want real-time updates for those widgets
INSERT INTO widget_content_mappings (table_name, widget_type, friend_id_column)
VALUES
  ('connect_four_games', 'connect_four', 'friend_id'),
  ('fridge_state', 'fridge_magnets', 'friend_id'),
  ('audio_snippets', 'audio_snippets', 'friend_id'),
  ('tic_tac_toe_games', 'tic_tac_toe', 'friend_id')
  -- Uncomment these if you want triggers for these widgets:
  -- ('consumption_log', 'consumption_log', 'friend_id'),
  -- ('question_jar', 'question_jar', 'friend_id')
ON CONFLICT (table_name) DO UPDATE SET widget_type = EXCLUDED.widget_type;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_widget_content_mappings_table_name ON widget_content_mappings(table_name);
CREATE INDEX IF NOT EXISTS idx_widget_content_mappings_widget_type ON widget_content_mappings(widget_type);

-- Refactor the trigger function to use the mapping table
CREATE OR REPLACE FUNCTION update_widget_last_updated_by_type()
RETURNS TRIGGER AS $$
DECLARE
  widget_type_id UUID;
  friend_id_val UUID;
  widget_type_val TEXT;
BEGIN
  -- Special handling for global_content (updates all friends)
  -- Note: content_type was renamed from 'top_10_songs' to 'songs' in migration 039
  IF TG_TABLE_NAME = 'global_content' THEN
    IF NEW.content_type = 'songs' THEN
      SELECT id INTO widget_type_id FROM widgets WHERE type = 'music_player' LIMIT 1;
      IF widget_type_id IS NOT NULL THEN
        UPDATE friend_widgets
        SET last_updated_at = NOW()
        WHERE widget_id = widget_type_id;
      END IF;
      RETURN NEW;
    END IF;
    RETURN NEW;
  END IF;

  -- Note: inbox_items table was removed in migration 040
  -- Note: media_recommendations widget was removed in migration 014
  
  -- Look up widget type from mapping table
  SELECT widget_type INTO widget_type_val
  FROM widget_content_mappings
  WHERE table_name = TG_TABLE_NAME;

  -- If no mapping found, return early (table not tracked)
  IF widget_type_val IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get friend_id (all current tables use 'friend_id' column)
  -- If a future table uses a different column name, add it to the mapping table
  -- and handle it here with a CASE statement
  friend_id_val := NEW.friend_id;

  -- Get widget type ID
  SELECT id INTO widget_type_id FROM widgets WHERE type = widget_type_val LIMIT 1;

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
