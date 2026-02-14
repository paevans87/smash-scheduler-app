CREATE TABLE match_making_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weight_skill_balance INT NOT NULL DEFAULT 40,
    weight_time_off_court INT NOT NULL DEFAULT 35,
    weight_match_history INT NOT NULL DEFAULT 25,
    apply_gender_matching BOOLEAN NOT NULL DEFAULT FALSE,
    blacklist_mode SMALLINT NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_match_making_weights_sum CHECK (
        weight_skill_balance + weight_time_off_court + weight_match_history = 100
    ),
    CONSTRAINT chk_match_making_weights_non_negative CHECK (
        weight_skill_balance >= 0
        AND weight_time_off_court >= 0
        AND weight_match_history >= 0
    ),
    CONSTRAINT chk_blacklist_mode CHECK (blacklist_mode IN (0, 1))
);

CREATE INDEX idx_match_making_profiles_club_id ON match_making_profiles (club_id);
CREATE UNIQUE INDEX idx_match_making_profiles_default_per_club ON match_making_profiles (club_id) WHERE is_default = TRUE;

ALTER TABLE match_making_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_making_profiles_policy ON match_making_profiles
    FOR ALL
    TO authenticated
    USING (
        club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    )
    WITH CHECK (
        club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    );

CREATE TRIGGER trg_match_making_profiles_updated_at
    BEFORE UPDATE ON match_making_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
