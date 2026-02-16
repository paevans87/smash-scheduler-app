-- Enforce maximum player count per club based on subscription plan.
-- Free plans are limited to 16 players. Pro plans have no limit.
-- This trigger prevents bypass of the client-side restriction.

CREATE OR REPLACE FUNCTION enforce_player_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_plan TEXT;
  current_count INT;
  max_allowed INT := 16;
BEGIN
  -- Look up the club's subscription plan
  SELECT plan_type INTO current_plan
  FROM subscriptions
  WHERE club_id = NEW.club_id
    AND status IN ('active', 'trialling')
  LIMIT 1;

  -- Pro plans have no limit
  IF current_plan = 'pro' THEN
    RETURN NEW;
  END IF;

  -- Count existing players for this club
  SELECT COUNT(*) INTO current_count
  FROM players
  WHERE club_id = NEW.club_id;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Player limit reached. Free plans are limited to % players.', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_player_limit
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION enforce_player_limit();
