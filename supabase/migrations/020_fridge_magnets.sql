-- Create fridge_state table for Fridge Magnets widget

CREATE TABLE fridge_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE UNIQUE,
  magnets JSONB NOT NULL DEFAULT '[]',
  -- Each magnet: {type: "letter"|"number"|"punctuation"|"icon", value: "E", x: number, y: number}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fridge_state_friend_id ON fridge_state(friend_id);
