-- Add skill_type column to clubs table
-- 0 = Numerical Skill Gauge (1-10)
-- 1 = Tier Skill Gauge (Lower, Middle, Upper)
ALTER TABLE clubs ADD COLUMN skill_type SMALLINT NOT NULL DEFAULT 0;

-- Add constraint to ensure valid skill_type values
ALTER TABLE clubs ADD CONSTRAINT chk_clubs_skill_type CHECK (skill_type IN (0, 1));

-- Rename skill_level to numerical_skill_level and make it nullable
ALTER TABLE players RENAME COLUMN skill_level TO numerical_skill_level;
ALTER TABLE players ALTER COLUMN numerical_skill_level DROP NOT NULL;

-- Remove the old constraint (it enforced NOT NULL and 1-10 range)
ALTER TABLE players DROP CONSTRAINT IF EXISTS chk_players_skill_level;

-- Add new constraint for numerical_skill_level (1-10 when not null)
ALTER TABLE players ADD CONSTRAINT chk_players_numerical_skill_level CHECK (
    numerical_skill_level IS NULL OR (numerical_skill_level BETWEEN 1 AND 10)
);

-- Add tier_skill_level column (0 = Lower, 1 = Middle, 2 = Upper)
ALTER TABLE players ADD COLUMN tier_skill_level SMALLINT DEFAULT NULL;

-- Add constraint for tier_skill_level (0-2 when not null)
ALTER TABLE players ADD CONSTRAINT chk_players_tier_skill_level CHECK (
    tier_skill_level IS NULL OR (tier_skill_level BETWEEN 0 AND 2)
);

-- Seed tier-based matchmaking profiles (system defaults)
-- These follow the same pattern as the numerical profiles
--INSERT INTO match_making_profiles (club_id, name, weight_skill_balance, weight_time_off_court, weight_match_history)
--VALUES
    --(NULL, 'Equal Tier', 60, 20, 20),
    --(NULL, 'Fair Rotation', 20, 60, 20),
    --(NULL, 'Unique Matches', 20, 20, 60);
