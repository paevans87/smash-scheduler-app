CREATE OR REPLACE FUNCTION upgrade_club_subscription(
  p_club_id UUID,
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_current_period_end TIMESTAMPTZ,
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_user_id UUID := COALESCE(auth.uid(), p_user_id);
  v_rows_updated INT;
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

  UPDATE subscriptions
  SET
    plan_type = 'pro',
    status = 'active',
    stripe_subscription_id = p_stripe_subscription_id,
    stripe_customer_id = p_stripe_customer_id,
    current_period_start = NOW(),
    current_period_end = p_current_period_end,
    updated_at = NOW()
  WHERE club_id = p_club_id
    AND plan_type = 'free'
    AND status = 'active';

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION 'No active free subscription found for this club';
  END IF;
END;
$$;
