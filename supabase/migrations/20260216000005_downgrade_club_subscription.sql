CREATE OR REPLACE FUNCTION downgrade_club_to_free(
  p_club_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_user_id UUID := COALESCE(auth.uid(), p_user_id);
BEGIN
  IF v_resolved_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM club_organisers
    WHERE club_id = p_club_id AND user_id = v_resolved_user_id
  ) THEN
    RAISE EXCEPTION 'User is not an organiser of this club';
  END IF;

  -- Reset subscription to free
  UPDATE subscriptions
  SET
    plan_type = 'free',
    status = 'active',
    stripe_subscription_id = NULL,
    stripe_customer_id = NULL,
    current_period_start = NOW(),
    current_period_end = NULL,
    updated_at = NOW()
  WHERE club_id = p_club_id
    AND plan_type = 'pro'
    AND status IN ('cancelled', 'expired');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No lapsed pro subscription found for this club';
  END IF;

  -- Remove custom matchmaking profiles (keep system defaults where club_id IS NULL)
  DELETE FROM match_making_profiles
  WHERE club_id = p_club_id;
END;
$$;
