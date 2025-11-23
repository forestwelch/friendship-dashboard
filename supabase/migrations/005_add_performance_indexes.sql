-- Add performance indexes for frequently queried columns

-- Index for friends.slug (used in getFriendPage)
CREATE INDEX IF NOT EXISTS idx_friends_slug ON friends(slug);

-- Index for global_content.content_type (used in getGlobalContent)
CREATE INDEX IF NOT EXISTS idx_global_content_type ON global_content(content_type);

