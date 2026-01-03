-- Create consumption_log table for Shared Consumption Log widget

CREATE TABLE consumption_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link TEXT,
  thought TEXT NOT NULL CHECK (char_length(thought) <= 280),
  added_by TEXT NOT NULL CHECK (added_by IN ('admin', 'friend')),
  read_by_admin BOOLEAN DEFAULT FALSE,
  read_by_friend BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consumption_log_friend_id ON consumption_log(friend_id);
CREATE INDEX idx_consumption_log_created_at ON consumption_log(created_at DESC);
