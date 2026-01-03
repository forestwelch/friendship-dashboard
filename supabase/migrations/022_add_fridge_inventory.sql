-- Add inventory field to fridge_state table
-- This tracks total counts for each character type

ALTER TABLE fridge_state 
ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '{}';

-- Update existing rows to have default inventory
UPDATE fridge_state 
SET inventory = '{}' 
WHERE inventory IS NULL;
