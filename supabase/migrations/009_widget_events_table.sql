-- Create widget_events table for storing historical data
CREATE TABLE IF NOT EXISTS widget_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_widget_id UUID NOT NULL REFERENCES friend_widgets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_widget_events_friend_widget_id ON widget_events(friend_widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_events_event_type ON widget_events(event_type);
CREATE INDEX IF NOT EXISTS idx_widget_events_created_at ON widget_events(created_at);

-- Note: RLS policies can be added later if needed
-- For now, following the pattern of allowing public access



