-- This migration upgrades an older/minimal Yimage D1 schema so it matches
-- the current Worker SQL expectations without dropping existing data.
--
-- Important:
-- - CREATE TABLE / CREATE INDEX statements are safe to run multiple times.
-- - ALTER TABLE ... ADD COLUMN statements are NOT idempotent in SQLite/D1.
--   This file should be applied once to a given database.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users ADD COLUMN email TEXT;

ALTER TABLE posts ADD COLUMN author_id TEXT;
ALTER TABLE posts ADD COLUMN image_mime_type TEXT;
ALTER TABLE posts ADD COLUMN comments_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0;

UPDATE posts
SET author_id = user_id
WHERE author_id IS NULL AND user_id IS NOT NULL;

UPDATE posts
SET description = ''
WHERE description IS NULL;

UPDATE posts
SET image_mime_type = 'application/octet-stream'
WHERE image_mime_type IS NULL OR TRIM(image_mime_type) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_likes_post_created_at ON likes(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_created_at ON likes(user_id, created_at);
