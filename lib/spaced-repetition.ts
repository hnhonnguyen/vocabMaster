import { VocabWord, ReviewResult } from './types';

/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on SuperMemo 2 algorithm
 */

// Calculate the next review based on quality rating (0-5)
export function calculateNextReview(
  word: VocabWord,
  quality: number // 0-5, where 5 is perfect recall
): Partial<VocabWord> {
  let { easeFactor, interval, repetitions } = word;
  
  // Quality < 3 means incorrect answer - reset
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }
  
  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    repetitions,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewDate: new Date().toISOString(),
  };
}

// Get words due for review
export function getWordsForReview(words: VocabWord[]): VocabWord[] {
  const now = new Date();
  
  return words
    .filter(word => {
      const reviewDate = new Date(word.nextReviewDate);
      return reviewDate <= now;
    })
    .sort((a, b) => {
      // Sort by priority: overdue words first, then by ease factor (harder words first)
      const aDate = new Date(a.nextReviewDate);
      const bDate = new Date(b.nextReviewDate);
      if (aDate.getTime() !== bDate.getTime()) {
        return aDate.getTime() - bDate.getTime();
      }
      return a.easeFactor - b.easeFactor;
    });
}

// Create a new vocabulary word with default SR values
export function createWord(
  word: string,
  definition: string,
  example: string,
  partOfSpeech: string
): VocabWord {
  const now = new Date();
  return {
    id: generateId(),
    word,
    definition,
    example,
    partOfSpeech,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: now.toISOString(), // Review immediately
    lastReviewDate: null,
    createdAt: now.toISOString(),
  };
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate mastery level (0-100%)
export function calculateMastery(word: VocabWord): number {
  const baseScore = Math.min(word.repetitions * 20, 60);
  const easeBonus = (word.easeFactor - 1.3) / (2.5 - 1.3) * 20;
  const intervalBonus = Math.min(word.interval / 30, 1) * 20;
  
  return Math.round(Math.min(baseScore + easeBonus + intervalBonus, 100));
}

// Get stats about learning progress
export function getStats(words: VocabWord[]) {
  const now = new Date();
  const dueWords = words.filter(w => new Date(w.nextReviewDate) <= now);
  const masteredWords = words.filter(w => calculateMastery(w) >= 80);
  const learningWords = words.filter(w => w.repetitions > 0 && calculateMastery(w) < 80);
  const newWords = words.filter(w => w.repetitions === 0);
  
  return {
    total: words.length,
    due: dueWords.length,
    mastered: masteredWords.length,
    learning: learningWords.length,
    new: newWords.length,
  };
}
