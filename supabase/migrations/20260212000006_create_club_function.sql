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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO clubs (name) VALUES (p_club_name) RETURNING id INTO v_club_id;
  INSERT INTO club_organisers (club_id, user_id) VALUES (v_club_id, v_user_id);

  IF p_status = 'trialling' THEN
    v_period_end := now() + INTERVAL '14 days';
  END IF;

  INSERT INTO subscriptions (club_id, status, plan_type, current_period_end)
  VALUES (v_club_id, p_status, p_plan_type, v_period_end);

  RETURN v_club_id;
END;
$$;
