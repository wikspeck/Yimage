-- Creates the vote/repost tables required by the current Worker logic.
-- Safe to run on remote Cloudflare D1.
--
-- This migration assumes the posts table already exists.
-- If posts.score or posts.repost_count are still missing, run:
-- - 0006_add_missing_post_vote_columns.sql

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  value INTEGER NOT NULL CHECK (value IN (1, -1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_votes_post_id ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_post_updated_at ON votes(post_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_votes_user_updated_at ON votes(user_id, updated_at);

CREATE TABLE IF NOT EXISTS reposts (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post_created_at ON reposts(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reposts_user_created_at ON reposts(user_id, created_at);
