ALTER TABLE match_making_profiles
  ADD COLUMN level_multiplier NUMERIC(5,4) NOT NULL DEFAULT 1.12,
  ADD COLUMN mix_multiplier NUMERIC(5,4) NOT NULL DEFAULT 1.04,
  ADD COLUMN asymmetric_gender_multiplier NUMERIC(5,4) NOT NULL DEFAULT 0.90;
