-- Adds vote + repost storage for the current Worker/UI behavior.
-- Run this once per database.

CREATE TABLE IF NOT EXISTS votes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reposts (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE posts ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN repost_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_votes_post_created_at ON votes(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_votes_user_created_at ON votes(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reposts_post_created_at ON reposts(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reposts_user_created_at ON reposts(user_id, created_at);
