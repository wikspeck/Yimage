-- Backfills and syncs fields used by the current vote/repost UI + Worker.
-- Safe to run after 0004_votes_reposts.sql.

UPDATE posts
SET score = COALESCE(like_count, 0)
WHERE score IS NULL OR score = 0;

UPDATE posts
SET repost_count = 0
WHERE repost_count IS NULL;
