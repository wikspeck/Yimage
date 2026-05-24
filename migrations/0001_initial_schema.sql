CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS likes (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
