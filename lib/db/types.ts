// Database abstraction interface - designed for easy swap to MySQL/PostgreSQL
import { VocabWord, AppState } from '../types';

export interface UserStats {
  totalWords: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

/**
 * Database repository interface.
 * Implement this for any database backend (SQLite, MySQL, PostgreSQL).
 */
export interface IDatabase {
  // Lifecycle
  initialize(): Promise<void> | void;

  // Words
  getAllWords(): Promise<VocabWord[]> | VocabWord[];
  getWordById(id: string): Promise<VocabWord | null> | VocabWord | null;
  addWord(word: VocabWord): Promise<VocabWord> | VocabWord;
  addWords(words: VocabWord[]): Promise<VocabWord[]> | VocabWord[];
  updateWord(id: string, updates: Partial<VocabWord>): Promise<VocabWord | null> | VocabWord | null;
  deleteWord(id: string): Promise<boolean> | boolean;

  // Stats
  getStats(): Promise<UserStats> | UserStats;
  updateStats(stats: Partial<UserStats>): Promise<UserStats> | UserStats;

  // Utility
  resetAll(): Promise<void> | void;
}
