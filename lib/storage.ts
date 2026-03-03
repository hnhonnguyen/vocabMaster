import { VocabWord, AppState } from './types';
import { getDatabase } from './db';

// --- Async API-based storage (primary) ---

export async function fetchWords(): Promise<VocabWord[]> {
  const res = await fetch('/api/words');
  if (!res.ok) throw new Error('Failed to fetch words');
  const data = await res.json();
  return data.words;
}

export async function fetchStats(): Promise<AppState['stats']> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json();
  return data.stats;
}

export async function addWordToDb(word: VocabWord): Promise<VocabWord> {
  const res = await fetch('/api/words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(word),
  });
  if (!res.ok) throw new Error('Failed to add word');
  const data = await res.json();
  return data.word;
}

export async function addWordsToDb(words: VocabWord[]): Promise<VocabWord[]> {
  const res = await fetch('/api/words/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words }),
  });
  if (!res.ok) throw new Error('Failed to bulk add words');
  const data = await res.json();
  return data.words;
}

export async function updateWordInDb(id: string, updates: Partial<VocabWord>): Promise<VocabWord | null> {
  const res = await fetch(`/api/words/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to update word');
  }
  const data = await res.json();
  return data.word;
}

export async function deleteWordFromDb(id: string): Promise<boolean> {
  const res = await fetch(`/api/words/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    if (res.status === 404) return false;
    throw new Error('Failed to delete word');
  }
  return true;
}

export async function updateStatsInDb(stats: Partial<AppState['stats']>): Promise<AppState['stats']> {
  const res = await fetch('/api/stats', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stats),
  });
  if (!res.ok) throw new Error('Failed to update stats');
  const data = await res.json();
  return data.stats;
}

// --- Load full app state from DB ---

export async function loadDataAsync(): Promise<AppState> {
  const [words, stats] = await Promise.all([fetchWords(), fetchStats()]);
  return {
    words,
    currentSession: null,
    stats,
  };
}

// --- Streak logic (unchanged, runs client-side then syncs to DB) ---

export function calculateUpdatedStreak(stats: AppState['stats']): AppState['stats'] {
  const today = new Date().toDateString();
  const lastStudy = stats.lastStudyDate ? new Date(stats.lastStudyDate).toDateString() : null;

  if (lastStudy === today) {
    return stats;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastStudy === yesterday.toDateString()) {
    const newStreak = stats.currentStreak + 1;
    return {
      ...stats,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, stats.longestStreak),
      lastStudyDate: new Date().toISOString(),
    };
  }

  return {
    ...stats,
    currentStreak: 1,
    longestStreak: Math.max(1, stats.longestStreak),
    lastStudyDate: new Date().toISOString(),
  };
}

// --- Legacy sync functions (kept for backward compatibility, now no-ops) ---

/** @deprecated Use loadDataAsync() instead */
export function loadData(): AppState {
  return {
    words: [],
    currentSession: null,
    stats: { totalWords: 0, wordsLearned: 0, currentStreak: 0, longestStreak: 0, lastStudyDate: null },
  };
}

/** @deprecated Data is saved through API calls now */
export function saveData(_state: AppState): void {
  // No-op: data is persisted via API calls
}

/** @deprecated Use calculateUpdatedStreak + updateStatsInDb instead */
export function updateStreak(stats: AppState['stats']): AppState['stats'] {
  return calculateUpdatedStreak(stats);
}
