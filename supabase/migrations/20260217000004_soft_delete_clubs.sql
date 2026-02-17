-- Add soft delete support to clubs
ALTER TABLE clubs ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
