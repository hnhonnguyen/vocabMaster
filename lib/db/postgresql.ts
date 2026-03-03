import { Pool, QueryResult } from 'pg';
import { VocabWord } from '../types';
import { IDatabase, UserStats } from './types';
import { sampleWords } from '../types';
import { generateId } from '../spaced-repetition';

export class PostgreSQlDatabase implements IDatabase {
  private pool: Pool;
  private initialized = false;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
    }

    // Check if running in production/Supabase environment
    const isProduction = process.env.NODE_ENV === 'production' || process.env.SUPABASE_URL;

    this.pool = new Pool({
      connectionString,
      max: 10, // Reduced for serverless environments
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased for cloud connections
      // Enable SSL for Supabase/production
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      // Ensure stats row exists
      await this.ensureStatsRow();
      
      // Seed sample words if table is empty
      const count = await this.getCount('words');
      if (count === 0) {
        await this.seedSampleWords();
      }
      
      // Sync stats total
      await this.syncStatsTotal();
      
      this.initialized = true;
      console.log('PostgreSQL database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL database:', error);
      throw error;
    }
  }

  private async ensureStatsRow(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO stats (id, total_words, words_learned, current_streak, longest_streak, last_study_date)
        VALUES (1, 0, 0, 0, 0, NULL)
        ON CONFLICT (id) DO NOTHING
      `);
    } finally {
      client.release();
    }
  }

  private async getCount(tableName: string): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  private async seedSampleWords(): Promise<void> {
    const now = new Date();
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

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const word of words) {
        await client.query(
          `INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            word.id,
            word.word,
            word.definition,
            word.example,
            word.partOfSpeech,
            word.easeFactor,
            word.interval,
            word.repetitions,
            word.nextReviewDate,
            word.lastReviewDate,
            word.createdAt,
          ]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async syncStatsTotal(): Promise<void> {
    const client = await this.pool.connect();
    try {
      const totalResult = await client.query('SELECT COUNT(*) as count FROM words');
      const learnedResult = await client.query('SELECT COUNT(*) as count FROM words WHERE repetitions > 0');
      
      const totalWords = parseInt(totalResult.rows[0].count);
      const wordsLearned = parseInt(learnedResult.rows[0].count);
      
      await client.query(
        'UPDATE stats SET total_words = $1, words_learned = $2 WHERE id = 1',
        [totalWords, wordsLearned]
      );
    } finally {
      client.release();
    }
  }

  // --- Words ---

  async getAllWords(): Promise<VocabWord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM words ORDER BY created_at DESC');
      return result.rows.map(this.rowToWord);
    } finally {
      client.release();
    }
  }

  async getWordById(id: string): Promise<VocabWord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM words WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.rowToWord(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async addWord(word: VocabWord): Promise<VocabWord> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          word.id,
          word.word,
          word.definition,
          word.example,
          word.partOfSpeech,
          word.easeFactor,
          word.interval,
          word.repetitions,
          word.nextReviewDate,
          word.lastReviewDate,
          word.createdAt,
        ]
      );
      await this.syncStatsTotal();
      return word;
    } finally {
      client.release();
    }
  }

  async addWords(words: VocabWord[]): Promise<VocabWord[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const word of words) {
        await client.query(
          `INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            word.id,
            word.word,
            word.definition,
            word.example,
            word.partOfSpeech,
            word.easeFactor,
            word.interval,
            word.repetitions,
            word.nextReviewDate,
            word.lastReviewDate,
            word.createdAt,
          ]
        );
      }
      
      await client.query('COMMIT');
      await this.syncStatsTotal();
      return words;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateWord(id: string, updates: Partial<VocabWord>): Promise<VocabWord | null> {
    const existing = await this.getWordById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE words SET
         word = $1, definition = $2, example = $3, part_of_speech = $4,
         ease_factor = $5, interval = $6, repetitions = $7,
         next_review_date = $8, last_review_date = $9
         WHERE id = $10`,
        [
          merged.word,
          merged.definition,
          merged.example,
          merged.partOfSpeech,
          merged.easeFactor,
          merged.interval,
          merged.repetitions,
          merged.nextReviewDate,
          merged.lastReviewDate,
          merged.id,
        ]
      );
      await this.syncStatsTotal();
      return merged;
    } finally {
      client.release();
    }
  }

  async deleteWord(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM words WHERE id = $1', [id]);
      await this.syncStatsTotal();
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  // --- Stats ---

  async getStats(): Promise<UserStats> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM stats WHERE id = 1');
      if (result.rows.length === 0) {
        return { totalWords: 0, wordsLearned: 0, currentStreak: 0, longestStreak: 0, lastStudyDate: null };
      }
      
      const row = result.rows[0];
      return {
        totalWords: row.total_words,
        wordsLearned: row.words_learned,
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
        lastStudyDate: row.last_study_date || null,
      };
    } finally {
      client.release();
    }
  }

  async updateStats(updates: Partial<UserStats>): Promise<UserStats> {
    const current = await this.getStats();
    const merged = { ...current, ...updates };
    
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE stats SET
         total_words = $1, words_learned = $2, current_streak = $3,
         longest_streak = $4, last_study_date = $5
         WHERE id = 1`,
        [
          merged.totalWords,
          merged.wordsLearned,
          merged.currentStreak,
          merged.longestStreak,
          merged.lastStudyDate,
        ]
      );
      return merged;
    } finally {
      client.release();
    }
  }

  // --- Utility ---

  async resetAll(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM words');
      await client.query(
        'UPDATE stats SET total_words = 0, words_learned = 0, current_streak = 0, longest_streak = 0, last_study_date = NULL WHERE id = 1'
      );
      await client.query('COMMIT');
      
      await this.seedSampleWords();
      await this.syncStatsTotal();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper method to convert database row to VocabWord
  private rowToWord(row: any): VocabWord {
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

  // Cleanup method
  async close(): Promise<void> {
    await this.pool.end();
  }
}