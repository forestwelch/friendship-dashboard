-- Rename content_type from 'top_10_songs' to 'songs' in global_content
-- Also delete any 'mp3_songs' entries as they are unused

-- Rename top_10_songs to songs
UPDATE global_content
SET content_type = 'songs'
WHERE content_type = 'top_10_songs';

-- Delete mp3_songs entries (unused)
DELETE FROM global_content
WHERE content_type = 'mp3_songs';
