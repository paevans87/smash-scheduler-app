CREATE OR REPLACE FUNCTION create_club_with_stripe_subscription(
  p_club_name TEXT,
  p_plan_type TEXT,
  p_status TEXT,
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_current_period_end TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_club_id UUID;
  v_user_id UUID := auth.uid();
  v_existing_club_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT s.club_id INTO v_existing_club_id
  FROM subscriptions s
  WHERE s.stripe_subscription_id = p_stripe_subscription_id;

  IF v_existing_club_id IS NOT NULL THEN
    RETURN v_existing_club_id;
  END IF;

  INSERT INTO clubs (name) VALUES (p_club_name) RETURNING id INTO v_club_id;
  INSERT INTO club_organisers (club_id, user_id) VALUES (v_club_id, v_user_id);

  INSERT INTO subscriptions (
    club_id,
    status,
    plan_type,
    stripe_subscription_id,
    stripe_customer_id,
    current_period_end
  ) VALUES (
    v_club_id,
    p_status,
    p_plan_type,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_current_period_end
  );

  RETURN v_club_id;
END;
$$;
