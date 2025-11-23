-- Initial database schema for Friendship Dashboard
-- Consolidated and optimized

-- Friends table
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  color_primary TEXT NOT NULL,
  color_secondary TEXT NOT NULL,
  color_accent TEXT NOT NULL,
  color_bg TEXT NOT NULL,
  color_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widgets table (widget types)
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend widgets junction table (layout configuration)
CREATE TABLE friend_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  size TEXT NOT NULL CHECK (size IN ('1x1', '2x2', '3x3')),
  position_x INTEGER NOT NULL CHECK (position_x >= 0 AND position_x < 6),
  position_y INTEGER NOT NULL CHECK (position_y >= 0 AND position_y < 8),
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(friend_id, position_x, position_y)
);

-- Global content table (shared across all friends)
CREATE TABLE global_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_type)
);

-- Personal content table (friend-specific content)
CREATE TABLE personal_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(friend_id, content_type)
);

-- Pixel art images table (global images, friend_id nullable)
-- Size is kept for backward compatibility but images work for all sizes
CREATE TABLE pixel_art_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE, -- Nullable for global images
  widget_id UUID REFERENCES friend_widgets(id) ON DELETE SET NULL, -- Optional link to specific widget
  size TEXT CHECK (size IN ('1x1', '2x2', '3x3')), -- Nullable since images work for all sizes
  base_image_data TEXT NOT NULL, -- Base64 encoded image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inbox items table (recommendations and hangout proposals)
CREATE TABLE inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recommendation', 'hangout_proposal')),
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_friend_widgets_friend_id ON friend_widgets(friend_id);
CREATE INDEX idx_friend_widgets_widget_id ON friend_widgets(widget_id);
CREATE INDEX idx_friend_widgets_position ON friend_widgets(friend_id, position_x, position_y);
CREATE INDEX idx_personal_content_friend_id ON personal_content(friend_id);
CREATE INDEX idx_pixel_art_images_friend_id ON pixel_art_images(friend_id);
CREATE INDEX idx_pixel_art_images_widget_id ON pixel_art_images(widget_id);
CREATE INDEX idx_pixel_art_images_global ON pixel_art_images(friend_id) WHERE friend_id IS NULL;
CREATE INDEX idx_inbox_items_friend_id ON inbox_items(friend_id);
CREATE INDEX idx_inbox_items_status ON inbox_items(status);
CREATE INDEX idx_inbox_items_friend_status ON inbox_items(friend_id, status);
