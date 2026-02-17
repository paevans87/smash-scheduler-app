ALTER TABLE subscriptions
  ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Backfill existing subscriptions: set created_by to the first organiser of each club
UPDATE subscriptions s
SET created_by = (
  SELECT co.user_id
  FROM club_organisers co
  WHERE co.club_id = s.club_id
  LIMIT 1
)
WHERE s.created_by IS NULL;

-- Now make it NOT NULL for future rows
ALTER TABLE subscriptions
  ALTER COLUMN created_by SET NOT NULL;

-- Update create_club_with_subscription to set created_by
CREATE OR REPLACE FUNCTION create_club_with_subscription(
  p_club_name TEXT,
  p_plan_type TEXT,
  p_status TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_club_id UUID;
  v_user_id UUID := auth.uid();
  v_period_end TIMESTAMPTZ;
  v_slug TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_slug := generate_club_slug(p_club_name);

  INSERT INTO clubs (name, slug) VALUES (p_club_name, v_slug) RETURNING id INTO v_club_id;
  INSERT INTO club_organisers (club_id, user_id) VALUES (v_club_id, v_user_id);

  IF p_status = 'trialling' THEN
    v_period_end := now() + INTERVAL '14 days';
  END IF;

  INSERT INTO subscriptions (club_id, status, plan_type, current_period_end, created_by)
  VALUES (v_club_id, p_status, p_plan_type, v_period_end, v_user_id);

  RETURN v_club_id;
END;
$$;

-- Update create_club_with_stripe_subscription to set created_by
CREATE OR REPLACE FUNCTION create_club_with_stripe_subscription(
  p_club_name TEXT,
  p_plan_type TEXT,
  p_status TEXT,
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_current_period_end TIMESTAMPTZ,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_club_id UUID;
  v_resolved_user_id UUID := COALESCE(auth.uid(), p_user_id);
  v_existing_club_id UUID;
  v_slug TEXT;
BEGIN
  IF v_resolved_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT s.club_id INTO v_existing_club_id
  FROM subscriptions s
  WHERE s.stripe_subscription_id = p_stripe_subscription_id;

  IF v_existing_club_id IS NOT NULL THEN
    RETURN v_existing_club_id;
  END IF;

  v_slug := generate_club_slug(p_club_name);

  INSERT INTO clubs (name, slug) VALUES (p_club_name, v_slug) RETURNING id INTO v_club_id;
  INSERT INTO club_organisers (club_id, user_id) VALUES (v_club_id, v_resolved_user_id);

  INSERT INTO subscriptions (
    club_id,
    status,
    plan_type,
    stripe_subscription_id,
    stripe_customer_id,
    current_period_end,
    created_by
  ) VALUES (
    v_club_id,
    p_status,
    p_plan_type,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_current_period_end,
    v_resolved_user_id
  );

  RETURN v_club_id;
END;
$$;
