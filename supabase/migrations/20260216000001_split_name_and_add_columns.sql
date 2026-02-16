-- Add first_name and last_name columns and migrate existing data
ALTER TABLE players
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT;

-- Populate first_name from existing name column
UPDATE players
SET first_name = split_part(name, ' ', 1);

-- Populate last_name from the remainder of the name column
UPDATE players
SET last_name = NULL
WHERE name NOT LIKE '% %';

UPDATE players
SET last_name = trim(substring(name from position(' ' in name) + 1))
WHERE name LIKE '% %';
