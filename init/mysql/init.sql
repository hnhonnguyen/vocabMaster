-- MySQL initialization script for VocabMaster
-- This script creates the necessary tables and indexes

-- Create words table
CREATE TABLE IF NOT EXISTS words (
    id VARCHAR(255) PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    example TEXT NOT NULL DEFAULT '',
    part_of_speech VARCHAR(50) NOT NULL DEFAULT 'noun',
    ease_factor FLOAT NOT NULL DEFAULT 2.5,
    interval INT NOT NULL DEFAULT 0,
    repetitions INT NOT NULL DEFAULT 0,
    next_review_date DATETIME NOT NULL,
    last_review_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create stats table
CREATE TABLE IF NOT EXISTS stats (
    id INT PRIMARY KEY CHECK (id = 1),
    total_words INT NOT NULL DEFAULT 0,
    words_learned INT NOT NULL DEFAULT 0,
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_study_date DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_next_review ON words(next_review_date);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at);

-- Insert initial stats row if not exists
INSERT IGNORE INTO stats (id, total_words, words_learned, current_streak, longest_streak, last_study_date)
VALUES (1, 0, 0, 0, 0, NULL);

-- Grant privileges to the application user
GRANT ALL PRIVILEGES ON vocabmaster.* TO 'vocabuser'@'%';
FLUSH PRIVILEGES;