-- Create tic_tac_toe_games table for Tic Tac Toe widget
-- Following pattern from connect_four_games

CREATE TABLE IF NOT EXISTS tic_tac_toe_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE UNIQUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_friend_id ON tic_tac_toe_games(friend_id);

-- Enable Realtime on tic_tac_toe_games table
ALTER PUBLICATION supabase_realtime ADD TABLE tic_tac_toe_games;

-- Add widget type
INSERT INTO widgets (type, name, description)
VALUES ('tic_tac_toe', 'Tic Tac Toe', 'Play infinite tic-tac-toe')
ON CONFLICT (type) DO NOTHING;

-- Add tic_tac_toe to widget content mappings (if mapping table exists)
-- If migration 042 hasn't run yet, this will be handled there
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_content_mappings') THEN
    INSERT INTO widget_content_mappings (table_name, widget_type, friend_id_column)
    VALUES ('tic_tac_toe_games', 'tic_tac_toe', 'friend_id')
    ON CONFLICT (table_name) DO UPDATE SET widget_type = EXCLUDED.widget_type;
  END IF;
END $$;

-- Trigger for tic_tac_toe_games (on INSERT or UPDATE)
DROP TRIGGER IF EXISTS trigger_update_widget_on_tic_tac_toe_change ON tic_tac_toe_games;
CREATE TRIGGER trigger_update_widget_on_tic_tac_toe_change
  AFTER INSERT OR UPDATE ON tic_tac_toe_games
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_last_updated_by_type();
