-- Widget notification system: track widget updates and user interactions
-- Phase 1: Infrastructure for showing which widgets have new content

-- Add last_updated_at to friend_widgets to track when widget content was last updated
-- Set to NULL initially for existing widgets (they haven't been "updated" yet, just created)
ALTER TABLE friend_widgets
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE;

-- Ensure existing widgets have NULL (they haven't been updated, just created)
-- This ensures only widgets that are actually updated show as "new content"
UPDATE friend_widgets
SET last_updated_at = NULL
WHERE last_updated_at IS NOT NULL;

-- Create widget_interactions table to track when a viewer friend last interacted with a widget
-- This allows us to show "new content" indicators based on last_interacted_at vs last_updated_at
CREATE TABLE IF NOT EXISTS widget_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_widget_id UUID NOT NULL REFERENCES friend_widgets(id) ON DELETE CASCADE,
  viewer_friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  last_interacted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(friend_widget_id, viewer_friend_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_widget_interactions_friend_widget_id ON widget_interactions(friend_widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_interactions_viewer_friend_id ON widget_interactions(viewer_friend_id);
CREATE INDEX IF NOT EXISTS idx_widget_interactions_composite ON widget_interactions(friend_widget_id, viewer_friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_widgets_last_updated_at ON friend_widgets(last_updated_at);

-- Create a function to automatically update last_updated_at when widget config changes
-- This will be triggered by application code, but we can also add a trigger if needed
CREATE OR REPLACE FUNCTION update_widget_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if config actually changed
  IF OLD.config IS DISTINCT FROM NEW.config THEN
    NEW.last_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_updated_at when widget changes
DROP TRIGGER IF EXISTS trigger_update_widget_last_updated_at ON friend_widgets;
CREATE TRIGGER trigger_update_widget_last_updated_at
  BEFORE UPDATE ON friend_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_last_updated_at();
