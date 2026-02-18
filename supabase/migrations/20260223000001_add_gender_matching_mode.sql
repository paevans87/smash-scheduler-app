ALTER TABLE match_making_profiles
ADD COLUMN gender_matching_mode SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE match_making_profiles
ADD CONSTRAINT chk_gender_matching_mode CHECK (gender_matching_mode IN (0, 1));
