-- Create club_skill_tiers table
-- Stores both system-default tiers (club_id = NULL) and club-custom tiers (PRO feature)
CREATE TABLE club_skill_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    score INT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed system-default tiers (club_id = NULL)
INSERT INTO club_skill_tiers (club_id, name, score, display_order)
VALUES
    (NULL, 'Lower', 10, 0),
    (NULL, 'Middle', 50, 1),
    (NULL, 'Upper', 100, 2);

-- Add skill_tier_id to players (replaces tier_skill_level)
ALTER TABLE players ADD COLUMN skill_tier_id UUID REFERENCES club_skill_tiers(id) ON DELETE SET NULL;

-- Migrate existing tier_skill_level data to skill_tier_id
UPDATE players p
SET skill_tier_id = cst.id
FROM club_skill_tiers cst
WHERE cst.club_id IS NULL
  AND p.tier_skill_level IS NOT NULL
  AND (
    (p.tier_skill_level = 0 AND cst.name = 'Lower')
    OR (p.tier_skill_level = 1 AND cst.name = 'Middle')
    OR (p.tier_skill_level = 2 AND cst.name = 'Upper')
  );

-- Drop old tier_skill_level column
ALTER TABLE players DROP CONSTRAINT IF EXISTS chk_players_tier_skill_level;
ALTER TABLE players DROP COLUMN tier_skill_level;

-- Enable RLS
ALTER TABLE club_skill_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read system defaults (club_id IS NULL)
CREATE POLICY club_skill_tiers_read_defaults ON club_skill_tiers
    FOR SELECT
    TO authenticated
    USING (club_id IS NULL);

-- Policy: organisers can manage their own club's tiers
CREATE POLICY club_skill_tiers_club_policy ON club_skill_tiers
    FOR ALL
    TO authenticated
    USING (
        club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    )
    WITH CHECK (
        club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    );
