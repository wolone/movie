CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  year INTEGER NOT NULL,
  rating REAL NOT NULL,
  duration_minutes INTEGER NOT NULL,
  maturity TEXT NOT NULL,
  genres TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  backdrop_url TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  trending_rank INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movies_featured ON movies (featured DESC);
CREATE INDEX IF NOT EXISTS idx_movies_trending ON movies (trending_rank);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies (year DESC);
