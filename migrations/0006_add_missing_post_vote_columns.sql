-- Repairs post metric columns required by the current Worker vote/repost/feed logic.
-- Apply this only once per database.
--
-- The current code expects these post columns to exist:
-- - like_count
-- - comments_count
-- - views
-- - score
-- - repost_count
--
-- SQLite/D1 does not reliably support ADD COLUMN IF NOT EXISTS,
-- so these ALTER TABLE statements should only be run on databases
-- that are still missing the columns.

ALTER TABLE posts ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN repost_count INTEGER NOT NULL DEFAULT 0;

UPDATE posts
SET score = COALESCE(like_count, 0)
WHERE score IS NULL OR score = 0;

UPDATE posts
SET repost_count = 0
WHERE repost_count IS NULL;
