ALTER TABLE ai_moderation_results ADD COLUMN source TEXT NOT NULL DEFAULT 'text';

CREATE TABLE IF NOT EXISTS moderation_appeals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_moderation_appeals_content
  ON moderation_appeals(content_type, content_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_appeals_status
  ON moderation_appeals(status, created_at DESC);
