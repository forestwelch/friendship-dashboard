-- Create audio_snippets table and storage bucket for Audio Snippets widget

CREATE TABLE audio_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  recorded_by TEXT NOT NULL CHECK (recorded_by IN ('admin', 'friend')),
  icon_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audio_snippets_friend_id ON audio_snippets(friend_id);
CREATE INDEX idx_audio_snippets_created_at ON audio_snippets(created_at DESC);

-- Note: Storage bucket creation should be done via Supabase dashboard or CLI
-- Bucket name: audio-snippets
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: audio/webm, audio/mp4, audio/ogg
