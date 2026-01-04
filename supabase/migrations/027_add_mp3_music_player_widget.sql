-- Add MP3 Music Player widget type
INSERT INTO widgets (type, name, description)
VALUES
  ('mp3_music_player', 'MP3 Music Player', 'Play MP3 songs (upload your own)')
ON CONFLICT (type) DO NOTHING;
