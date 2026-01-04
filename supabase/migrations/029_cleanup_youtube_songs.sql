-- Clean up old YouTube-based songs from global_content
-- Remove songs that have youtubeId instead of mp3Url

-- Clean up old YouTube-based songs from global_content
-- Remove songs that have youtubeId instead of mp3Url
-- Use COALESCE to ensure we always set an empty array if all songs are filtered out
UPDATE global_content
SET data = jsonb_set(
  data,
  '{songs}',
  COALESCE(
    (
      SELECT jsonb_agg(song)
      FROM jsonb_array_elements(data->'songs') AS song
      WHERE song->>'mp3Url' IS NOT NULL
        AND song->>'youtubeId' IS NULL
    ),
    '[]'::jsonb
  )
)
WHERE content_type = 'top_10_songs'
  AND data->'songs' IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(data->'songs') AS song
    WHERE song->>'youtubeId' IS NOT NULL
  );

-- Handle case where all songs were YouTube songs (now empty array)
-- This ensures the data structure is correct
UPDATE global_content
SET data = '{"songs": []}'::jsonb
WHERE content_type = 'top_10_songs'
  AND (data->'songs' IS NULL OR jsonb_array_length(COALESCE(data->'songs', '[]'::jsonb)) = 0);
