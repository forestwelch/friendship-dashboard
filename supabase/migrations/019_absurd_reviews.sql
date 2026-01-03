-- Create review_topics and reviews tables for Absurd Reviews widget

CREATE TABLE review_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'both_reviewed', 'revealed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES review_topics(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL CHECK (reviewer IN ('admin', 'friend')),
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  review_text TEXT NOT NULL CHECK (char_length(review_text) <= 200),
  recommend BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic_id, reviewer)
);

CREATE INDEX idx_review_topics_friend_id ON review_topics(friend_id);
CREATE INDEX idx_review_topics_status ON review_topics(status);
CREATE INDEX idx_reviews_topic_id ON reviews(topic_id);
