-- Row Level Security Policies
-- NOTE: RLS is enabled here but will be DISABLED in migration 004 for development
-- This allows you to easily re-enable RLS later by removing migration 004

-- Enable RLS on all tables (will be disabled in next migration)
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_art_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;

-- Friends: Public read, admin write
CREATE POLICY "Friends are viewable by everyone"
  ON friends FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert friends"
  ON friends FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only admins can update friends"
  ON friends FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Widgets: Public read, admin write
CREATE POLICY "Widgets are viewable by everyone"
  ON widgets FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage widgets"
  ON widgets FOR ALL
  USING (auth.role() = 'authenticated');

-- Friend widgets: Public read, admin write
CREATE POLICY "Friend widgets are viewable by everyone"
  ON friend_widgets FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage friend widgets"
  ON friend_widgets FOR ALL
  USING (auth.role() = 'authenticated');

-- Global content: Public read, admin write
CREATE POLICY "Global content is viewable by everyone"
  ON global_content FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage global content"
  ON global_content FOR ALL
  USING (auth.role() = 'authenticated');

-- Personal content: Public read, admin write
CREATE POLICY "Personal content is viewable by everyone"
  ON personal_content FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage personal content"
  ON personal_content FOR ALL
  USING (auth.role() = 'authenticated');

-- Pixel art images: Public read, admin write
CREATE POLICY "Pixel art images are viewable by everyone"
  ON pixel_art_images FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage pixel art images"
  ON pixel_art_images FOR ALL
  USING (auth.role() = 'authenticated');

-- Inbox items: Public read, admin write
CREATE POLICY "Inbox items are viewable by everyone"
  ON inbox_items FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage inbox items"
  ON inbox_items FOR ALL
  USING (auth.role() = 'authenticated');

-- Note: For now, these policies allow public read access.
-- Once authentication is set up, you can restrict reads to authenticated users only.
