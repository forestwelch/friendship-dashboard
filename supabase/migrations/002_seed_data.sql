-- Seed initial data

-- Insert friends
INSERT INTO friends (name, slug, display_name, color_primary, color_secondary, color_accent, color_bg, color_text)
VALUES
  ('daniel', 'daniel', 'Daniel', '#2a52be', '#7cb9e8', '#00308f', '#e6f2ff', '#001f3f'),
  ('max', 'max', 'Max', '#dc143c', '#ff6b6b', '#8b0000', '#ffe6e6', '#2d0000'),
  ('violet', 'violet', 'Violet', '#832161ff', '#da4167ff', '#3d2645ff', '#f0eff4ff', '#000000ff'),
  ('gameboy', 'gameboy', 'Gameboy', '#306230', '#8bac0f', '#0f380f', '#9bbc0f', '#0f380f')
ON CONFLICT (slug) DO NOTHING;

-- Insert widget types
INSERT INTO widgets (type, name, description)
VALUES
  ('music_player', 'Music Player', 'Play your top 10 songs'),
  ('pixel_art', 'Pixel Art', 'Display pixelated images'),
  ('media_recommendations', 'Media Recommendations', 'Share movies, shows, books'),
  ('calendar', 'Calendar', 'Show availability and events'),
  ('notes', 'Notes', 'Leave messages for friends'),
  ('shared_links', 'Shared Links', 'Share interesting links')
ON CONFLICT (type) DO NOTHING;

-- Insert default music player widgets for Daniel
INSERT INTO friend_widgets (friend_id, widget_id, size, position_x, position_y, config)
SELECT 
  f.id,
  w.id,
  '1x1',
  0,
  0,
  '{}'::jsonb
FROM friends f, widgets w
WHERE f.slug = 'daniel' AND w.type = 'music_player'
ON CONFLICT DO NOTHING;

INSERT INTO friend_widgets (friend_id, widget_id, size, position_x, position_y, config)
SELECT 
  f.id,
  w.id,
  '2x2',
  2,
  0,
  '{}'::jsonb
FROM friends f, widgets w
WHERE f.slug = 'daniel' AND w.type = 'music_player'
ON CONFLICT DO NOTHING;

INSERT INTO friend_widgets (friend_id, widget_id, size, position_x, position_y, config)
SELECT 
  f.id,
  w.id,
  '3x3',
  0,
  2,
  '{}'::jsonb
FROM friends f, widgets w
WHERE f.slug = 'daniel' AND w.type = 'music_player'
ON CONFLICT DO NOTHING;

-- Insert top 10 songs (global content)
INSERT INTO global_content (content_type, data)
VALUES (
  'top_10_songs',
  '[
    {"id": "1", "title": "Bohemian Rhapsody", "artist": "Queen", "youtubeId": "fJ9rUzIMcZQ"},
    {"id": "2", "title": "Stairway to Heaven", "artist": "Led Zeppelin", "youtubeId": "QkF3oxziUI4"},
    {"id": "3", "title": "Hotel California", "artist": "Eagles", "youtubeId": "BciS5krYL80"},
    {"id": "4", "title": "Sweet Child O'' Mine", "artist": "Guns N'' Roses", "youtubeId": "1w7OgIMMRc4"},
    {"id": "5", "title": "Comfortably Numb", "artist": "Pink Floyd", "youtubeId": "YlUKcNNmywk"},
    {"id": "6", "title": "Thunderstruck", "artist": "AC/DC", "youtubeId": "v2AC41dglnM"},
    {"id": "7", "title": "Back in Black", "artist": "AC/DC", "youtubeId": "pAgnJDJN4VA"},
    {"id": "8", "title": "Smells Like Teen Spirit", "artist": "Nirvana", "youtubeId": "hTWKbfoikeg"},
    {"id": "9", "title": "Enter Sandman", "artist": "Metallica", "youtubeId": "CD-E-LDc384"},
    {"id": "10", "title": "Paranoid", "artist": "Black Sabbath", "youtubeId": "0qanF-91aJo"}
  ]'::jsonb
)
ON CONFLICT (content_type) DO UPDATE SET data = EXCLUDED.data;


