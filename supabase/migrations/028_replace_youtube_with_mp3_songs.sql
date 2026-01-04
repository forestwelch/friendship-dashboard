-- Replace YouTube-based music player with MP3-based system
-- This migration:
-- 1. Removes the mp3_music_player widget type (if it exists)
-- 2. Updates the music_player widget description
-- 3. Cleans up old YouTube-based song data (songs with youtubeId instead of mp3Url)

-- Remove mp3_music_player widget type if it exists
DELETE FROM widgets WHERE type = 'mp3_music_player';

-- Update music_player widget description
UPDATE widgets 
SET description = 'Play MP3 songs (upload your own)'
WHERE type = 'music_player';

-- Note: The actual song data migration (youtubeId -> mp3Url) should be done manually
-- or via a data migration script, as it requires uploading MP3 files.
-- Old songs with youtubeId will need to be re-uploaded as MP3s.
