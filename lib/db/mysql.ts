import mysql from 'mysql2/promise';
import { VocabWord } from '../types';
import { IDatabase, UserStats } from './types';
import { sampleWords } from '../types';
import { generateId } from '../spaced-repetition';

export class MySQLDatabase implements IDatabase {
  private pool: mysql.Pool;
  private initialized = false;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for MySQL');
    }

    // Parse MySQL connection string
    const url = new URL(connectionString);
    const config = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
      charset: 'utf8mb4',
    };

    this.pool = mysql.createPool(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Test connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
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
      console.log('MySQL database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MySQL database:', error);
      throw error;
    }
  }

  private async ensureStatsRow(): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `INSERT IGNORE INTO stats (id, total_words, words_learned, current_streak, longest_streak, last_study_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 0, 0, 0, 0, null]
      );
    } finally {
      connection.release();
    }
  }

  private async getCount(tableName: string): Promise<number> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      return parseInt((rows as any)[0].count);
    } finally {
      connection.release();
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

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const word of words) {
        await connection.execute(
          `INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async syncStatsTotal(): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      const [totalRows] = await connection.execute('SELECT COUNT(*) as count FROM words');
      const [learnedRows] = await connection.execute('SELECT COUNT(*) as count FROM words WHERE repetitions > 0');
      
      const totalWords = parseInt((totalRows as any)[0].count);
      const wordsLearned = parseInt((learnedRows as any)[0].count);
      
      await connection.execute(
        'UPDATE stats SET total_words = ?, words_learned = ? WHERE id = ?',
        [totalWords, wordsLearned, 1]
      );
    } finally {
      connection.release();
    }
  }

  // --- Words ---

  async getAllWords(): Promise<VocabWord[]> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM words ORDER BY created_at DESC');
      return (rows as any[]).map(this.rowToWord);
    } finally {
      connection.release();
    }
  }

  async getWordById(id: string): Promise<VocabWord | null> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM words WHERE id = ?', [id]);
      const result = rows as any[];
      return result.length > 0 ? this.rowToWord(result[0]) : null;
    } finally {
      connection.release();
    }
  }

  async addWord(word: VocabWord): Promise<VocabWord> {
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      connection.release();
    }
  }

  async addWords(words: VocabWord[]): Promise<VocabWord[]> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const word of words) {
        await connection.execute(
          `INSERT INTO words (id, word, definition, example, part_of_speech, ease_factor, interval, repetitions, next_review_date, last_review_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      
      await connection.commit();
      await this.syncStatsTotal();
      return words;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateWord(id: string, updates: Partial<VocabWord>): Promise<VocabWord | null> {
    const existing = await this.getWordById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `UPDATE words SET
         word = ?, definition = ?, example = ?, part_of_speech = ?,
         ease_factor = ?, interval = ?, repetitions = ?,
         next_review_date = ?, last_review_date = ?
         WHERE id = ?`,
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
      connection.release();
    }
  }

  async deleteWord(id: string): Promise<boolean> {
    const connection = await this.pool.getConnection();
    try {
      const [result] = await connection.execute('DELETE FROM words WHERE id = ?', [id]);
      await this.syncStatsTotal();
      return ((result as any).affectedRows || 0) > 0;
    } finally {
      connection.release();
    }
  }

  // --- Stats ---

  async getStats(): Promise<UserStats> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM stats WHERE id = ?', [1]);
      const result = rows as any[];
      
      if (result.length === 0) {
        return { totalWords: 0, wordsLearned: 0, currentStreak: 0, longestStreak: 0, lastStudyDate: null };
      }
      
      const row = result[0];
      return {
        totalWords: row.total_words,
        wordsLearned: row.words_learned,
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
        lastStudyDate: row.last_study_date || null,
      };
    } finally {
      connection.release();
    }
  }

  async updateStats(updates: Partial<UserStats>): Promise<UserStats> {
    const current = await this.getStats();
    const merged = { ...current, ...updates };
    
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `UPDATE stats SET
         total_words = ?, words_learned = ?, current_streak = ?,
         longest_streak = ?, last_study_date = ?
         WHERE id = ?`,
        [
          merged.totalWords,
          merged.wordsLearned,
          merged.currentStreak,
          merged.longestStreak,
          merged.lastStudyDate,
          1,
        ]
      );
      return merged;
    } finally {
      connection.release();
    }
  }

  // --- Utility ---

  async resetAll(): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('DELETE FROM words');
      await connection.execute(
        'UPDATE stats SET total_words = ?, words_learned = ?, current_streak = ?, longest_streak = ?, last_study_date = ? WHERE id = ?',
        [0, 0, 0, 0, null, 1]
      );
      await connection.commit();
      
      await this.seedSampleWords();
      await this.syncStatsTotal();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
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