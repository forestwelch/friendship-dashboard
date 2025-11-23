-- Migration to support global images and inbox functionality

-- 1. Modify pixel_art_images to support global images (nullable friend_id)
ALTER TABLE pixel_art_images ALTER COLUMN friend_id DROP NOT NULL;
ALTER TABLE pixel_art_images RENAME COLUMN image_data TO base_image_data;

-- 2. Create friend_image_assignments table for friend-specific quantized versions
CREATE TABLE friend_image_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES pixel_art_images(id) ON DELETE CASCADE,
  quantized_image_data TEXT, -- The color-quantized version for this friend
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(friend_id, image_id)
);

-- 3. Create inbox_items table
CREATE TABLE inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recommendation', 'hangout_proposal')),
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add indexes
CREATE INDEX idx_friend_image_assignments_friend_id ON friend_image_assignments(friend_id);
CREATE INDEX idx_friend_image_assignments_image_id ON friend_image_assignments(image_id);
CREATE INDEX idx_inbox_items_friend_id ON inbox_items(friend_id);
CREATE INDEX idx_inbox_items_status ON inbox_items(status);


