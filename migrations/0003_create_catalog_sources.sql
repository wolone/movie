CREATE TABLE IF NOT EXISTS catalog_movies (
  douban_id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  year INTEGER NOT NULL,
  rating REAL NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  maturity TEXT NOT NULL DEFAULT '',
  genres TEXT NOT NULL,
  poster_url TEXT NOT NULL DEFAULT '',
  backdrop_url TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  trending_rank INTEGER,
  area TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT '',
  directors TEXT NOT NULL DEFAULT '',
  actors TEXT NOT NULL DEFAULT '',
  metadata_provider TEXT NOT NULL DEFAULT 'apizero-douban',
  metadata_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_movies_year ON catalog_movies (year DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_movies_rating ON catalog_movies (rating DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_movies_genres ON catalog_movies (genres);

CREATE TABLE IF NOT EXISTS movie_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT '',
  source_area TEXT NOT NULL DEFAULT '',
  source_language TEXT NOT NULL DEFAULT '',
  status_note TEXT NOT NULL DEFAULT '',
  source_updated_at TEXT,
  poster_url TEXT NOT NULL DEFAULT '',
  play_lines TEXT NOT NULL DEFAULT '[]',
  douban_id TEXT,
  detail_url TEXT NOT NULL DEFAULT '',
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_key, source_id),
  FOREIGN KEY (douban_id) REFERENCES catalog_movies (douban_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_movie_sources_douban_id ON movie_sources (douban_id);
CREATE INDEX IF NOT EXISTS idx_movie_sources_updated_at ON movie_sources (source_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_movie_sources_source_key ON movie_sources (source_key);

CREATE TABLE IF NOT EXISTS source_sync_runs (
  source_key TEXT PRIMARY KEY NOT NULL,
  last_page INTEGER NOT NULL DEFAULT 0,
  last_run_at TEXT,
  last_success_at TEXT,
  last_error TEXT,
  items_synced INTEGER NOT NULL DEFAULT 0
);
