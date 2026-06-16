CREATE TABLE players (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  primary_role TEXT NOT NULL,
  bats TEXT,
  throws TEXT,
  debut_year INTEGER,
  last_year INTEGER,
  hall_of_fame BOOLEAN DEFAULT FALSE,
  aliases JSONB DEFAULT '[]'::jsonb,
  search_tokens TSVECTOR
);

CREATE TABLE seasons (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id),
  season INTEGER NOT NULL,
  team TEXT NOT NULL,
  role TEXT NOT NULL,
  stats JSONB NOT NULL,
  source_map JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (player_id, season, team, role)
);

CREATE TABLE career_aggregates (
  player_id TEXT PRIMARY KEY REFERENCES players(id),
  role TEXT NOT NULL,
  stats JSONB NOT NULL,
  peak_window JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metrics (
  id TEXT PRIMARY KEY,
  role_scope TEXT NOT NULL,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  short_description TEXT NOT NULL,
  format TEXT NOT NULL,
  better_direction TEXT NOT NULL,
  source_label TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE
);
