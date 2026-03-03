-- PostgreSQL initialization script for VocabMaster
-- This script creates the necessary tables and indexes

-- Create words table
CREATE TABLE IF NOT EXISTS words (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    example TEXT NOT NULL DEFAULT '',
    part_of_speech TEXT NOT NULL DEFAULT 'noun',
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create stats table
CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_words INTEGER NOT NULL DEFAULT 0,
    words_learned INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_study_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_next_review ON words(next_review_date);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at);

-- Insert initial stats row if not exists
INSERT INTO stats (id, total_words, words_learned, current_streak, longest_streak, last_study_date)
VALUES (1, 0, 0, 0, 0, NULL)
ON CONFLICT (id) DO NOTHING;

-- Grant privileges to the application user
GRANT ALL PRIVILEGES ON TABLE words TO vocabuser;
GRANT ALL PRIVILEGES ON TABLE stats TO vocabuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vocabuser;