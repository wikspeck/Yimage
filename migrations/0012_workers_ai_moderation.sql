CREATE TABLE IF NOT EXISTS ai_moderation_results (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  labels TEXT NOT NULL DEFAULT '[]',
  ai_reason TEXT NOT NULL DEFAULT '',
  moderation_status TEXT NOT NULL DEFAULT 'under_review',
  model TEXT NOT NULL DEFAULT '@cf/meta/llama-guard-3-8b',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_moderation_results_content
  ON ai_moderation_results(content_type, content_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_moderation_results_status
  ON ai_moderation_results(moderation_status, created_at DESC);
