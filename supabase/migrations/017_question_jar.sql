-- Create question_jar table for Question Jar widget

CREATE TABLE question_jar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  asked_by TEXT NOT NULL CHECK (asked_by IN ('admin', 'friend')),
  answered_by TEXT CHECK (answered_by IN ('admin', 'friend')),
  asked_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE INDEX idx_question_jar_friend_id ON question_jar(friend_id);
CREATE INDEX idx_question_jar_answered_at ON question_jar(answered_at DESC NULLS LAST);
