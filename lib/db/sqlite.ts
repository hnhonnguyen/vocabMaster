import Database from 'better-sqlite3';
import path from 'path';
import { VocabWord } from '../types';
import { IDatabase, UserStats } from './types';
import { sampleWords } from '../types';
import { generateId } from '../spaced-repetition';

const DB_PATH = path.join(process.cwd(), 'data', 'vocab-master.db');

let dbInstance: Database.Database | null = null;

function getConnection(): Database.Database {
  if (!dbInstance) {
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export class SQLiteDatabase implements IDatabase {
  private db: Database.Database;

  constructor() {
    this.db = getConnection();
  }

  initialize(): void {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        definition TEXT NOT NULL,
        example TEXT NOT NULL DEFAULT '',
        part_of_speech TEXT NOT NULL DEFAULT 'noun',
        ease_factor REAL NOT NULL DEFAULT 2.5,
        interval INTEGER NOT NULL DEFAULT 0,
        repetitions INTEGER NOT NULL DEFAULT 0,
        next_review_date TEXT NOT NULL,
        last_review_date TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_words INTEGER NOT NULL DEFAULT 0,
        words_learned INTEGER NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_study_date TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_words_next_review ON words(next_review_date);
      CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
    `);

    // Seed stats row if not exists
    const statsRow = this.db.prepare('SELECT id FROM stats WHERE id = 1').get();
    if (!statsRow) {
      this.db.prepare(
        'INSERT INTO stats (id, total_words, words_learned, current_streak, longest_streak, last_study_date) VALUES (1, 0, 0, 0, 0, NULL)'
      ).run();
    }

    // Seed sample words if table is empty
    const count = this.db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number };
    if (count.count === 0) {
      this.seedSampleWords();
    }

    // Sync stats total
    this.syncStatsTotal();
  }

  private seedSampleWords(): void {
    const now = new Date();
    const insert = this.db.prepare(`
      INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
      VALUES (@id, @word, @definition, @example, @partOfSpeech, @easeFactor, @interval, @repetitions, @nextReviewDate, @lastReviewDate, @createdAt)
    `);

    const insertMany = this.db.transaction((words: VocabWord[]) => {
      for (const w of words) {
        insert.run({
          id: w.id,
          word: w.word,
          definition: w.definition,
          example: w.example,
          partOfSpeech: w.partOfSpeech,
          easeFactor: w.easeFactor,
          interval: w.interval,
          repetitions: w.repetitions,
          nextReviewDate: w.nextReviewDate,
          lastReviewDate: w.lastReviewDate,
          createdAt: w.createdAt,
        });
      }
    });

    const words: VocabWord[] = sampleWords.map((w, index) => ({
      ...w,
      id: generateId(),
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: now.toISOString(),
      lastReviewDate: null,
      createdAt: new Date(now.getTime() - index * 60000).toISOString(),
    }));

    insertMany(words);
  }

  private syncStatsTotal(): void {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number };
    const learned = this.db.prepare('SELECT COUNT(*) as count FROM words WHERE repetitions > 0').get() as { count: number };
    this.db.prepare('UPDATE stats SET total_words = ?, words_learned = ? WHERE id = 1').run(count.count, learned.count);
  }

  // --- Words ---

  getAllWords(): VocabWord[] {
    const rows = this.db.prepare('SELECT * FROM words ORDER BY created_at DESC').all() as any[];
    return rows.map(rowToWord);
  }

  getWordById(id: string): VocabWord | null {
    const row = this.db.prepare('SELECT * FROM words WHERE id = ?').get(id) as any;
    return row ? rowToWord(row) : null;
  }

  addWord(word: VocabWord): VocabWord {
    this.db.prepare(`
      INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
      VALUES (@id, @word, @definition, @example, @partOfSpeech, @easeFactor, @interval, @repetitions, @nextReviewDate, @lastReviewDate, @createdAt)
    `).run({
      id: word.id,
      word: word.word,
      definition: word.definition,
      example: word.example,
      partOfSpeech: word.partOfSpeech,
      easeFactor: word.easeFactor,
      interval: word.interval,
      repetitions: word.repetitions,
      nextReviewDate: word.nextReviewDate,
      lastReviewDate: word.lastReviewDate,
      createdAt: word.createdAt,
    });
    this.syncStatsTotal();
    return word;
  }

  addWords(words: VocabWord[]): VocabWord[] {
    const insert = this.db.prepare(`
      INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
      VALUES (@id, @word, @definition, @example, @partOfSpeech, @easeFactor, @interval, @repetitions, @nextReviewDate, @lastReviewDate, @createdAt)
    `);

    const insertMany = this.db.transaction((items: VocabWord[]) => {
      for (const w of items) {
        insert.run({
          id: w.id,
          word: w.word,
          definition: w.definition,
          example: w.example,
          partOfSpeech: w.partOfSpeech,
          easeFactor: w.easeFactor,
          interval: w.interval,
          repetitions: w.repetitions,
          nextReviewDate: w.nextReviewDate,
          lastReviewDate: w.lastReviewDate,
          createdAt: w.createdAt,
        });
      }
    });

    insertMany(words);
    this.syncStatsTotal();
    return words;
  }

  updateWord(id: string, updates: Partial<VocabWord>): VocabWord | null {
    const existing = this.getWordById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    this.db.prepare(`
      UPDATE words SET
        word = @word,
        definition = @definition,
        example = @example,
        part_of_speech = @partOfSpeech,
        ease_factor = @easeFactor,
        interval = @interval,
        repetitions = @repetitions,
        next_review_date = @nextReviewDate,
        last_review_date = @lastReviewDate
      WHERE id = @id
    `).run({
      id: merged.id,
      word: merged.word,
      definition: merged.definition,
      example: merged.example,
      partOfSpeech: merged.partOfSpeech,
      easeFactor: merged.easeFactor,
      interval: merged.interval,
      repetitions: merged.repetitions,
      nextReviewDate: merged.nextReviewDate,
      lastReviewDate: merged.lastReviewDate,
    });

    this.syncStatsTotal();
    return merged;
  }

  deleteWord(id: string): boolean {
    const result = this.db.prepare('DELETE FROM words WHERE id = ?').run(id);
    this.syncStatsTotal();
    return result.changes > 0;
  }

  // --- Stats ---

  getStats(): UserStats {
    const row = this.db.prepare('SELECT * FROM stats WHERE id = 1').get() as any;
    if (!row) {
      return { totalWords: 0, wordsLearned: 0, currentStreak: 0, longestStreak: 0, lastStudyDate: null };
    }
    return {
      totalWords: row.total_words,
      wordsLearned: row.words_learned,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastStudyDate: row.last_study_date || null,
    };
  }

  updateStats(updates: Partial<UserStats>): UserStats {
    const current = this.getStats();
    const merged = { ...current, ...updates };

    this.db.prepare(`
      UPDATE stats SET
        total_words = ?,
        words_learned = ?,
        current_streak = ?,
        longest_streak = ?,
        last_study_date = ?
      WHERE id = 1
    `).run(
      merged.totalWords,
      merged.wordsLearned,
      merged.currentStreak,
      merged.longestStreak,
      merged.lastStudyDate
    );

    return merged;
  }

  // --- Utility ---

  resetAll(): void {
    this.db.exec('DELETE FROM words');
    this.db.prepare(
      'UPDATE stats SET total_words = 0, words_learned = 0, current_streak = 0, longest_streak = 0, last_study_date = NULL WHERE id = 1'
    ).run();
    this.seedSampleWords();
    this.syncStatsTotal();
  }
}

// Map DB row to VocabWord
function rowToWord(row: any): VocabWord {
  return {
    id: row.id,
    word: row.word,
    definition: row.definition,
    example: row.example,
    partOfSpeech: row.part_of_speech,
    easeFactor: row.ease_factor,
    interval: row.interval,
    repetitions: row.repetitions,
    nextReviewDate: row.next_review_date,
    lastReviewDate: row.last_review_date || null,
    createdAt: row.created_at,
  };
}
