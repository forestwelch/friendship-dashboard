-- Add new widget types for Mood, Event Countdown, Personality Quiz, and Connect Four
INSERT INTO widgets (type, name, description)
VALUES
  ('mood', 'Mood Tracker', 'Track your mood with emojis'),
  ('event_countdown', 'Event Countdown', 'Countdown to upcoming events'),
  ('personality_quiz', 'Personality Quiz', 'Discover your vibe together'),
  ('connect_four', 'Connect Four', 'Play async turn-based game')
ON CONFLICT (type) DO NOTHING;

