export interface VocabWord {
  id: string;
  word: string;
  definition: string;
  example: string;
  partOfSpeech: string;
  // Spaced repetition fields
  easeFactor: number; // SM-2 ease factor (starts at 2.5)
  interval: number; // Days until next review
  repetitions: number; // Number of successful reviews
  nextReviewDate: string; // ISO date string
  lastReviewDate: string | null;
  createdAt: string;
}

export interface ReviewResult {
  wordId: string;
  quality: number; // 0-5 rating based on answer quality
  timestamp: string;
}

export interface Question {
  type: 'fill-blank' | 'context-usage' | 'definition' | 'synonym';
  prompt: string;
  targetWord: string;
  hint?: string;
  /** Grammar formula/form the answer should follow, e.g. "If + past simple, would + base verb" */
  grammarStructure?: string;
  /** Concrete example applying the grammar structure with the target word */
  grammarExample?: string;
}

export interface LearningSession {
  id: string;
  startTime: string;
  endTime?: string;
  wordsReviewed: string[];
  correctCount: number;
  totalCount: number;
}

export interface AppState {
  words: VocabWord[];
  currentSession: LearningSession | null;
  stats: {
    totalWords: number;
    wordsLearned: number;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null;
  };
}

// Default words to start with
export const sampleWords: Omit<VocabWord, 'id' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReviewDate' | 'lastReviewDate' | 'createdAt'>[] = [
  {
    word: "ephemeral",
    definition: "lasting for a very short time",
    example: "The ephemeral beauty of cherry blossoms reminds us to cherish each moment.",
    partOfSpeech: "adjective"
  },
  {
    word: "ubiquitous",
    definition: "present, appearing, or found everywhere",
    example: "Smartphones have become ubiquitous in modern society.",
    partOfSpeech: "adjective"
  },
  {
    word: "eloquent",
    definition: "fluent or persuasive in speaking or writing",
    example: "The eloquent speaker captivated the audience with her words.",
    partOfSpeech: "adjective"
  },
  {
    word: "meticulous",
    definition: "showing great attention to detail; very careful and precise",
    example: "The meticulous chef ensured every dish was perfectly plated.",
    partOfSpeech: "adjective"
  },
  {
    word: "pragmatic",
    definition: "dealing with things sensibly and realistically",
    example: "We need a pragmatic approach to solve this complex problem.",
    partOfSpeech: "adjective"
  },
  {
    word: "resilient",
    definition: "able to recover quickly from difficulties",
    example: "The resilient community rebuilt after the natural disaster.",
    partOfSpeech: "adjective"
  },
  {
    word: "serendipity",
    definition: "the occurrence of events by chance in a happy way",
    example: "Finding that book was pure serendipity; it changed my life.",
    partOfSpeech: "noun"
  },
  {
    word: "ambivalent",
    definition: "having mixed feelings about something",
    example: "She felt ambivalent about accepting the job offer abroad.",
    partOfSpeech: "adjective"
  }
];
