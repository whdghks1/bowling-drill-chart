-- Only creates app-specific tables. Does not change existing club tables.
CREATE TABLE IF NOT EXISTS bowling_fit_charts (
  id uuid PRIMARY KEY,
  data jsonb NOT NULL,
  shared boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bowling_fit_shared_updated_idx ON bowling_fit_charts (shared, updated_at DESC);
CREATE TABLE IF NOT EXISTS bowling_fit_auth_attempts (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);
