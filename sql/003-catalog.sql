CREATE TABLE IF NOT EXISTS bowling_fit_catalog (
  key text PRIMARY KEY CHECK (key = 'products'),
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
