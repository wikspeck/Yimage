-- Adds editable profile fields for the current profile UI.
-- Run once per database.

ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN avatar_url TEXT;
