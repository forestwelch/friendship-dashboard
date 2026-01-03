-- Add new widget types for the widget overhaul
INSERT INTO widgets (type, name, description)
VALUES
  ('consumption_log', 'Shared Consumption Log', 'Track shared media consumption'),
  ('question_jar', 'Question Jar', 'Ask and answer questions asynchronously'),
  ('audio_snippets', 'Audio Snippets', 'Record and play short audio clips'),
  ('absurd_reviews', 'Absurd Reviews', 'Review absurd topics together'),
  ('fridge_magnets', 'Fridge Magnets', 'Arrange magnetic words on a virtual fridge')
ON CONFLICT (type) DO NOTHING;
