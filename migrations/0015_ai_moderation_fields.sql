ALTER TABLE posts ADD COLUMN ai_reported INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN ai_report_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN ai_report_categories TEXT NOT NULL DEFAULT '[]';
ALTER TABLE posts ADD COLUMN ai_checked_at TEXT;

ALTER TABLE ai_moderation_results ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE ai_moderation_results ADD COLUMN confidence REAL;
ALTER TABLE ai_moderation_results ADD COLUMN reviewed_at TEXT;
ALTER TABLE ai_moderation_results ADD COLUMN reviewed_by TEXT;

UPDATE posts
SET ai_reported = 1,
    ai_report_reason = COALESCE(
      (
        SELECT ai_moderation_results.ai_reason
        FROM ai_moderation_results
        WHERE ai_moderation_results.content_type = 'post'
          AND ai_moderation_results.content_id = posts.id
          AND ai_moderation_results.status = 'open'
        ORDER BY ai_moderation_results.created_at DESC
        LIMIT 1
      ),
      ''
    ),
    ai_report_categories = COALESCE(
      (
        SELECT ai_moderation_results.labels
        FROM ai_moderation_results
        WHERE ai_moderation_results.content_type = 'post'
          AND ai_moderation_results.content_id = posts.id
          AND ai_moderation_results.status = 'open'
        ORDER BY ai_moderation_results.created_at DESC
        LIMIT 1
      ),
      '[]'
    ),
    ai_checked_at = COALESCE(
      (
        SELECT ai_moderation_results.created_at
        FROM ai_moderation_results
        WHERE ai_moderation_results.content_type = 'post'
          AND ai_moderation_results.content_id = posts.id
          AND ai_moderation_results.status = 'open'
        ORDER BY ai_moderation_results.created_at DESC
        LIMIT 1
      ),
      ai_checked_at
    )
WHERE EXISTS (
  SELECT 1
  FROM ai_moderation_results
  WHERE ai_moderation_results.content_type = 'post'
    AND ai_moderation_results.content_id = posts.id
    AND ai_moderation_results.status = 'open'
);

CREATE INDEX IF NOT EXISTS idx_ai_moderation_results_status
  ON ai_moderation_results(status, content_type, content_id, created_at DESC);
