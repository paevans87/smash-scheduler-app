ALTER TABLE subscriptions
  ADD COLUMN stripe_subscription_id TEXT,
  ADD COLUMN stripe_customer_id TEXT;

CREATE UNIQUE INDEX idx_subscriptions_stripe_subscription_id
  ON subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX idx_subscriptions_stripe_customer_id
  ON subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
