-- Update widget notification trigger to track ALL changes (position, size, config)
-- This ensures last_updated_at updates on move, resize, and content changes

-- Update the function to check for position, size, AND config changes
CREATE OR REPLACE FUNCTION update_widget_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Update if ANY field changed (config, position, size, etc.)
  IF (
    OLD.config IS DISTINCT FROM NEW.config OR
    OLD.position_x IS DISTINCT FROM NEW.position_x OR
    OLD.position_y IS DISTINCT FROM NEW.position_y OR
    OLD.size IS DISTINCT FROM NEW.size
  ) THEN
    NEW.last_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists from migration 034, so we just update the function
-- No need to recreate the trigger
