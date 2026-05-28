-- Adds more category choices for the post composer and discovery filters.

INSERT OR IGNORE INTO categories (id, slug, label) VALUES
  ('cat_animals', 'animals', 'Animals'),
  ('cat_music', 'music', 'Music'),
  ('cat_sports', 'sports', 'Sports'),
  ('cat_food', 'food', 'Food'),
  ('cat_travel', 'travel', 'Travel'),
  ('cat_education', 'education', 'Education'),
  ('cat_random', 'random', 'Random');
