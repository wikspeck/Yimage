-- Adds reporting, moderation, suspensions, safety flags, and content status fields.
-- Run once per database.

ALTER TABLE posts ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE posts ADD COLUMN moderation_risk_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE comments ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE comments ADD COLUMN moderation_risk_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN moderation_risk_score INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'open',
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS copyright_reports (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL UNIQUE,
  claimant_name TEXT NOT NULL DEFAULT '',
  claimant_email TEXT NOT NULL DEFAULT '',
  copyright_description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id TEXT PRIMARY KEY,
  moderator_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_warnings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_suspensions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lifted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_safety_flags (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_reason ON reports(reason);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_copyright_reports_created_at ON copyright_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_id ON user_suspensions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_safety_flags_target ON user_safety_flags(target_type, target_id, created_at);
