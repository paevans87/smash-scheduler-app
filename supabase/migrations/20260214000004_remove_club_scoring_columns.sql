-- Remove columns that have been moved to match_making_profiles table
ALTER TABLE clubs DROP COLUMN IF EXISTS blacklist_mode;
ALTER TABLE clubs DROP COLUMN IF EXISTS scoring_weight_skill_balance;
ALTER TABLE clubs DROP COLUMN IF EXISTS scoring_weight_match_history;
ALTER TABLE clubs DROP COLUMN IF EXISTS scoring_weight_time_off_court;

-- Drop constraints that reference these columns
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS chk_clubs_blacklist_mode;
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS chk_clubs_scoring_weights_sum;
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS chk_clubs_scoring_weights_non_negative;
