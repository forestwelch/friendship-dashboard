-- Move Connect Four game state to friend-based storage
-- Create connect_four_games table keyed by friend_id instead of widget_id

CREATE TABLE IF NOT EXISTS connect_four_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE UNIQUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_four_games_friend_id ON connect_four_games(friend_id);

-- Enable Realtime on connect_four_games table
ALTER PUBLICATION supabase_realtime ADD TABLE connect_four_games;

-- Migrate existing Connect Four game data from widget configs to the new table
-- This preserves existing games when widgets are deleted/recreated
INSERT INTO connect_four_games (friend_id, config, updated_at)
SELECT DISTINCT ON (friend_id)
  friend_id,
  config,
  COALESCE(created_at, NOW()) as updated_at
FROM friend_widgets
WHERE widget_id IN (SELECT id FROM widgets WHERE type = 'connect_four')
  AND config IS NOT NULL
  AND config != '{}'::jsonb
  AND NOT EXISTS (
    SELECT 1 FROM connect_four_games WHERE connect_four_games.friend_id = friend_widgets.friend_id
  )
ORDER BY friend_id, created_at DESC NULLS LAST;

-- Add allow_multiple flag to widgets table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widgets' AND column_name = 'allow_multiple'
  ) THEN
    ALTER TABLE widgets ADD COLUMN allow_multiple BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Set allow_multiple to true for pixel_art (only widget type that allows multiple instances)
UPDATE widgets SET allow_multiple = TRUE WHERE type = 'pixel_art';

-- Duplicate widget type prevention is handled by the trigger function
-- created in migration 024_add_3x1_widget_size.sql
-- No additional index needed here
