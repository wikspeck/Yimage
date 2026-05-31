ALTER TABLE reports ADD COLUMN reporter_username TEXT NOT NULL DEFAULT '';
ALTER TABLE reports ADD COLUMN target_owner_id TEXT;
ALTER TABLE reports ADD COLUMN target_owner_username TEXT NOT NULL DEFAULT '';
ALTER TABLE reports ADD COLUMN reviewed_at TEXT;
ALTER TABLE reports ADD COLUMN reviewed_by TEXT;

UPDATE users
SET moderation_status = 'visible'
WHERE COALESCE(moderation_status, 'active') = 'active';

UPDATE posts
SET moderation_status = 'visible'
WHERE COALESCE(moderation_status, 'active') = 'active';

UPDATE comments
SET moderation_status = 'visible'
WHERE COALESCE(moderation_status, 'active') = 'active';

UPDATE reports
SET reporter_username = COALESCE(
  reporter_username,
  (SELECT COALESCE(users.username, '') FROM users WHERE users.id = reports.reporter_id LIMIT 1),
  ''
)
WHERE reporter_username = '';

UPDATE reports
SET target_owner_id = (
    SELECT posts.author_id
    FROM posts
    WHERE reports.target_type = 'post' AND posts.id = reports.target_id
    LIMIT 1
  ),
  target_owner_username = COALESCE(
    (
      SELECT users.username
      FROM posts
      INNER JOIN users ON users.id = posts.author_id
      WHERE reports.target_type = 'post' AND posts.id = reports.target_id
      LIMIT 1
    ),
    target_owner_username,
    ''
  )
WHERE reports.target_type = 'post';

CREATE INDEX IF NOT EXISTS idx_reports_status_created_at ON reports(status, created_at DESC);
