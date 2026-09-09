-- Additive, app-specific tables. Existing club/member tables are untouched.
CREATE TABLE IF NOT EXISTS bowling_fit_users (
 id uuid PRIMARY KEY,
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
 name_key text NOT NULL UNIQUE,
 password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','editor','admin')),
 active boolean NOT NULL DEFAULT true,
 session_version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bowling_fit_account_guard (
 id integer PRIMARY KEY CHECK (id = 1),
 bootstrapped boolean NOT NULL DEFAULT false,
 revision bigint NOT NULL DEFAULT 0
);
INSERT INTO bowling_fit_account_guard(id) VALUES (1) ON CONFLICT DO NOTHING;
