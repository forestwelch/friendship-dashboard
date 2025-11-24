-- Enable Realtime on friend_widgets table for Connect Four game moves
-- This allows real-time subscriptions to widget updates

-- Add friend_widgets to the Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE friend_widgets;

-- Note: This requires the table to have REPLICA IDENTITY set
-- If the table doesn't have a primary key, we may need to set it
-- Since friend_widgets has an id UUID PRIMARY KEY, we should be good

-- Verify the table has REPLICA IDENTITY set (should be DEFAULT for tables with primary key)
-- If needed, run: ALTER TABLE friend_widgets REPLICA IDENTITY FULL;

