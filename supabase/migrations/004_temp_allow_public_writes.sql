-- TEMPORARY: Allow public writes for development
-- This is a workaround until SUPABASE_SERVICE_ROLE_KEY is configured
-- WARNING: This allows anyone to write to your database. Use only for development!

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can manage friend widgets" ON friend_widgets;
DROP POLICY IF EXISTS "Only admins can manage global content" ON global_content;
DROP POLICY IF EXISTS "Only admins can manage pixel art images" ON pixel_art_images;

-- Create permissive policies for development
CREATE POLICY "Allow public writes to friend_widgets (DEV ONLY)"
  ON friend_widgets FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public writes to global_content (DEV ONLY)"
  ON global_content FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public writes to pixel_art_images (DEV ONLY)"
  ON pixel_art_images FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: Once you add SUPABASE_SERVICE_ROLE_KEY to .env.local,
-- you can revert this migration and use the admin client instead.

