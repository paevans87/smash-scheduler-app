-- Make club_id nullable to support system-wide default profiles
ALTER TABLE match_making_profiles ALTER COLUMN club_id DROP NOT NULL;

-- Drop the existing unique index for default per club (it doesn't handle NULLs well)
DROP INDEX IF EXISTS idx_match_making_profiles_default_per_club;

-- Recreate unique index: one default per club (excluding system defaults)
CREATE UNIQUE INDEX idx_match_making_profiles_default_per_club
    ON match_making_profiles (club_id) WHERE is_default = TRUE AND club_id IS NOT NULL;

-- Update RLS policy to allow authenticated users to read system default profiles
DROP POLICY IF EXISTS match_making_profiles_policy ON match_making_profiles;

-- Read policy: club organisers can read their club profiles + everyone can read system defaults
CREATE POLICY match_making_profiles_select ON match_making_profiles
    FOR SELECT
    TO authenticated
    USING (
        club_id IS NULL
        OR club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    );

-- Write policy: only club organisers can insert/update/delete their own club profiles
CREATE POLICY match_making_profiles_modify ON match_making_profiles
    FOR ALL
    TO authenticated
    USING (
        club_id IS NOT NULL
        AND club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    )
    WITH CHECK (
        club_id IS NOT NULL
        AND club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    );

-- Seed 3 system default profiles
INSERT INTO match_making_profiles (club_id, name, weight_skill_balance, weight_time_off_court, weight_match_history)
VALUES
    (NULL, 'Equal Level', 60, 20, 20),
    (NULL, 'Fair Rotation', 20, 60, 20),
    (NULL, 'Unique Matches', 20, 20, 60);
