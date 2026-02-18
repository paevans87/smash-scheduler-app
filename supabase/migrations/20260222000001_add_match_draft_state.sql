-- Allow court_number = 0 for draft matches (no court assigned yet)
ALTER TABLE matches DROP CONSTRAINT chk_matches_court_number;
ALTER TABLE matches ADD CONSTRAINT chk_matches_court_number CHECK (court_number >= 0);

-- Add draft state (2) — 0 = inProgress, 1 = completed, 2 = draft
ALTER TABLE matches DROP CONSTRAINT chk_matches_state;
ALTER TABLE matches ADD CONSTRAINT chk_matches_state CHECK (state IN (0, 1, 2));

-- Allow started_at to be null for draft matches that have not started yet
ALTER TABLE matches ALTER COLUMN started_at DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN started_at DROP DEFAULT;
