-- Supabase Seed Data for VocabMaster
-- This file is run after migrations to populate initial data

-- Ensure stats row exists
INSERT INTO stats (id, total_words, words_learned, current_streak, longest_streak, last_study_date)
VALUES (1, 0, 0, 0, 0, NULL)
ON CONFLICT (id) DO NOTHING;

-- Sample vocabulary words for initial setup
INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
VALUES 
  ('seed_001', 'ubiquitous', 'present, appearing, or found everywhere', 'Smartphones have become ubiquitous in modern society.', 'adjective', 2.5, 0, 0, NOW(), NULL, NOW()),
  ('seed_002', 'ephemeral', 'lasting for a very short time', 'The ephemeral beauty of cherry blossoms draws millions of visitors.', 'adjective', 2.5, 0, 0, NOW(), NULL, NOW()),
  ('seed_003', 'eloquent', 'fluent or persuasive in speaking or writing', 'Her eloquent speech moved the entire audience to tears.', 'adjective', 2.5, 0, 0, NOW(), NULL, NOW()),
  ('seed_004', 'pragmatic', 'dealing with things sensibly and realistically', 'We need a pragmatic approach to solve this complex problem.', 'adjective', 2.5, 0, 0, NOW(), NULL, NOW()),
  ('seed_005', 'resilient', 'able to recover quickly from difficulties', 'Children are remarkably resilient in the face of adversity.', 'adjective', 2.5, 0, 0, NOW(), NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Update stats after seeding
UPDATE stats 
SET total_words = (SELECT COUNT(*) FROM words),
    words_learned = (SELECT COUNT(*) FROM words WHERE repetitions > 0)
WHERE id = 1;
