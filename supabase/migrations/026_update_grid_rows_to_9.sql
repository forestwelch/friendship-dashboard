-- Update grid rows constraint from 10 to 9
-- This prevents mobile cutoff by reducing the grid from 10 rows to 9 rows

-- Update the widget size validation function to allow max 9 rows instead of 10
CREATE OR REPLACE FUNCTION is_valid_widget_size(size_text TEXT) RETURNS BOOLEAN AS $$
DECLARE
  cols INTEGER;
  rows INTEGER;
BEGIN
  -- Check format matches NxM pattern (e.g., 1x1, 2x3, 5x9)
  IF size_text !~ '^[1-5]x[1-9]$' THEN
    RETURN FALSE;
  END IF;
  
  -- Extract columns and rows
  cols := (regexp_match(size_text, '^(\d+)x'))[1]::INTEGER;
  rows := (regexp_match(size_text, 'x(\d+)$'))[1]::INTEGER;
  
  -- Validate bounds: 1-5 columns, 1-9 rows, and fits in grid
  RETURN cols >= 1 AND cols <= 5 AND rows >= 1 AND rows <= 9;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
