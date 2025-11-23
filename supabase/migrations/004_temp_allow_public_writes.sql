-- COMPLETELY OPEN: Allow anyone to do anything
-- WARNING: This removes ALL security. Use only for development!

-- Grant full schema access to anon and authenticated roles
GRANT ALL ON SCHEMA public TO anon, authenticated, public;

-- Grant ALL permissions on ALL tables to everyone
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, public;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, public;

-- Set default privileges so future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, public;

-- Drop ALL existing policies (restrictive or otherwise)
DROP POLICY IF EXISTS "Friends are viewable by everyone" ON friends;
DROP POLICY IF EXISTS "Only admins can insert friends" ON friends;
DROP POLICY IF EXISTS "Only admins can update friends" ON friends;
DROP POLICY IF EXISTS "Only admins can delete friends" ON friends;
DROP POLICY IF EXISTS "Allow public writes to friends (DEV ONLY)" ON friends;

DROP POLICY IF EXISTS "Widgets are viewable by everyone" ON widgets;
DROP POLICY IF EXISTS "Only admins can manage widgets" ON widgets;

DROP POLICY IF EXISTS "Friend widgets are viewable by everyone" ON friend_widgets;
DROP POLICY IF EXISTS "Only admins can manage friend widgets" ON friend_widgets;
DROP POLICY IF EXISTS "Allow public writes to friend_widgets (DEV ONLY)" ON friend_widgets;

DROP POLICY IF EXISTS "Global content is viewable by everyone" ON global_content;
DROP POLICY IF EXISTS "Only admins can manage global content" ON global_content;
DROP POLICY IF EXISTS "Allow public writes to global_content (DEV ONLY)" ON global_content;

DROP POLICY IF EXISTS "Personal content is viewable by everyone" ON personal_content;
DROP POLICY IF EXISTS "Only admins can manage personal content" ON personal_content;
DROP POLICY IF EXISTS "Allow public writes to personal_content (DEV ONLY)" ON personal_content;

DROP POLICY IF EXISTS "Pixel art images are viewable by everyone" ON pixel_art_images;
DROP POLICY IF EXISTS "Only admins can manage pixel_art_images" ON pixel_art_images;
DROP POLICY IF EXISTS "Allow public writes to pixel_art_images (DEV ONLY)" ON pixel_art_images;

DROP POLICY IF EXISTS "Inbox items are viewable by everyone" ON inbox_items;
DROP POLICY IF EXISTS "Only admins can manage inbox items" ON inbox_items;
DROP POLICY IF EXISTS "Allow public writes to inbox_items (DEV ONLY)" ON inbox_items;

-- Disable RLS entirely (no policies needed, everything is open)
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
ALTER TABLE widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_art_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items DISABLE ROW LEVEL SECURITY;
