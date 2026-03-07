import { VocabWord, Question } from './types';
import { isAIConfigured } from './config';
import { aiGenerateQuestion, aiEvaluateAnswer } from './ai-service';

// Question templates for fallback (non-AI) mode
const questionTemplates = {
  fillBlank: [
    "Complete the sentence: {sentence}",
    "Fill in the blank with the appropriate word: {sentence}",
    "What word best completes this sentence? {sentence}",
  ],
  contextUsage: [
    "Write a sentence using '{word}' that describes {topic}. Use the required grammar structure in your answer.",
    "Create a sentence about {topic} using '{word}' and the specified grammar pattern.",
    "How would you use '{word}' in a conversation about {topic}? Follow the grammar structure provided.",
  ],
  definition: [
    "Explain what '{word}' means and use it in a sentence that follows the required grammar structure.",
    "Define '{word}' and demonstrate its usage with the specified grammar pattern.",
  ],
  synonym: [
    "'{word}' means '{definition}'. Use this word in a new sentence following the required grammar structure.",
    "Given that '{word}' means '{definition}', write a sentence using the specified grammar pattern.",
  ],
  grammarFocus: [
    "Practice the {grammarName} by writing a sentence that includes the word '{word}'. Follow the pattern: {structure}",
    "Using the {grammarName} pattern ({structure}), write a sentence that naturally incorporates '{word}'.",
    "Demonstrate the {grammarName} structure by creating a sentence about '{word}' (meaning: {definition}). Pattern: {structure}",
    "Apply the {grammarName} rule to write one sentence that uses '{word}'. Required pattern: {structure}",
  ],
};

const contextTopics = [
  "work or professional life",
  "relationships",
  "technology",
  "nature",
  "daily life",
  "education",
  "travel",
  "emotions",
  "creativity",
  "problem-solving",
];

// Grammar structures for fallback mode
interface GrammarTemplate {
  name: string;
  structure: string;
  makeExample: (word: string) => string;
}

const grammarStructures: GrammarTemplate[] = [
  {
    name: "Conditional Type 2",
    structure: "If + past simple, would + base verb",
    makeExample: (word) => `If I were more ${word}, I would handle challenges with ease.`,
  },
  {
    name: "Passive Voice",
    structure: "Subject + be + past participle (+ by agent)",
    makeExample: (word) => `The concept of being ${word} is often admired by many people.`,
  },
  {
    name: "Present Perfect",
    structure: "Subject + have/has + past participle",
    makeExample: (word) => `She has always been ${word} when facing difficult situations.`,
  },
  {
    name: "Relative Clause",
    structure: "Noun + who/which/that + verb",
    makeExample: (word) => `A person who is ${word} can overcome many obstacles in life.`,
  },
  {
    name: "Reported Speech",
    structure: "Subject + said/told + (that) + clause",
    makeExample: (word) => `The teacher said that being ${word} was essential for academic success.`,
  },
  {
    name: "Wish Clause",
    structure: "Subject + wish + past simple / past perfect",
    makeExample: (word) => `I wish I were more ${word} when dealing with stressful situations.`,
  },
  {
    name: "Comparative Structure",
    structure: "Subject + be + more/less + adjective + than",
    makeExample: (word) => `Being ${word} is more valuable than being merely talented.`,
  },
  {
    name: "Gerund as Subject",
    structure: "Verb-ing + verb (as subject of sentence)",
    makeExample: (word) => `Being ${word} requires consistent practice and determination.`,
  },
  {
    name: "Modal Verb (should/must)",
    structure: "Subject + should/must + base verb",
    makeExample: (word) => `Students must be ${word} to succeed in challenging courses.`,
  },
  {
    name: "Third Conditional",
    structure: "If + past perfect, would have + past participle",
    makeExample: (word) => `If he had been more ${word}, he would have completed the marathon.`,
  },
];

// Generate a contextual question - uses AI when configured
export async function generateQuestionAsync(word: VocabWord): Promise<Question> {
  if (isAIConfigured()) {
    try {
      const aiQuestion = await aiGenerateQuestion(word);
      if (aiQuestion) return aiQuestion;
    } catch {
      // Fall through to template-based generation
    }
  }
  return generateQuestionLocal(word);
}

// Synchronous fallback for when AI is not available
export function generateQuestion(word: VocabWord): Question {
  return generateQuestionLocal(word);
}

// Template-based question generation (no API needed)
function generateQuestionLocal(word: VocabWord): Question {
  const questionTypes: Question['type'][] = ['fill-blank', 'context-usage', 'definition', 'synonym', 'grammar-focus'];
  const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
  const grammar = grammarStructures[Math.floor(Math.random() * grammarStructures.length)];

  let prompt: string;
  let hint: string | undefined;
  const grammarStructure = `${grammar.name}: ${grammar.structure}`;
  const grammarExample = grammar.makeExample(word.word);
  const learningFocus: Question['learningFocus'] = type === 'grammar-focus' ? 'grammar' : 'vocabulary';

  switch (type) {
    case 'fill-blank':
      const sentenceWithBlank = word.example.replace(
        new RegExp(word.word, 'gi'),
        '_____'
      );
      const templates = questionTemplates.fillBlank;
      prompt = templates[Math.floor(Math.random() * templates.length)]
        .replace('{sentence}', sentenceWithBlank);
      hint = `The word starts with "${word.word[0]}" and means "${word.definition}". Use the grammar structure: ${grammarStructure}`;
      break;

    case 'context-usage':
      const topic = contextTopics[Math.floor(Math.random() * contextTopics.length)];
      const contextTemplates = questionTemplates.contextUsage;
      prompt = contextTemplates[Math.floor(Math.random() * contextTemplates.length)]
        .replace('{word}', word.word)
        .replace('{topic}', topic);
      hint = `"${word.word}" means "${word.definition}". Apply the grammar structure: ${grammarStructure}`;
      break;

    case 'definition':
      const defTemplates = questionTemplates.definition;
      prompt = defTemplates[Math.floor(Math.random() * defTemplates.length)]
        .replace('{word}', word.word);
      hint = `Think about: ${word.definition}. Use the grammar structure: ${grammarStructure}`;
      break;

    case 'synonym':
      const synTemplates = questionTemplates.synonym;
      prompt = synTemplates[Math.floor(Math.random() * synTemplates.length)]
        .replace('{word}', word.word)
        .replace('{definition}', word.definition);
      hint = `Apply the grammar structure: ${grammarStructure}`;
      break;

    case 'grammar-focus':
      const grammarTemplates = questionTemplates.grammarFocus;
      prompt = grammarTemplates[Math.floor(Math.random() * grammarTemplates.length)]
        .replace('{grammarName}', grammar.name)
        .replace('{structure}', grammar.structure)
        .replace('{word}', word.word)
        .replace('{definition}', word.definition);
      hint = `Focus on the grammar pattern: ${grammar.structure}. Include the word "${word.word}" (${word.definition}) in your answer.`;
      break;

    default:
      prompt = `Use the word "${word.word}" in a sentence that demonstrates you understand its meaning. Follow the required grammar structure.`;
      hint = `Use: ${grammarStructure}`;
  }

  return { type, learningFocus, prompt, targetWord: word.word, hint, grammarStructure, grammarExample };
}

// Evaluate answer - uses AI when configured, falls back to heuristic
export async function evaluateAnswerAsync(
  answer: string,
  word: VocabWord,
  question: Question
): Promise<{ quality: number; feedback: string }> {
  if (isAIConfigured()) {
    try {
      const aiResult = await aiEvaluateAnswer(answer, word, question);
      if (aiResult) return aiResult;
    } catch {
      // Fall through to local evaluation
    }
  }
  return evaluateAnswerLocal(answer, word);
}

// Synchronous fallback evaluation
export function evaluateAnswer(
  answer: string,
  word: VocabWord,
  question: Question
): { quality: number; feedback: string } {
  return evaluateAnswerLocal(answer, word);
}

// Local heuristic-based evaluation
function evaluateAnswerLocal(
  answer: string,
  word: VocabWord,
): { quality: number; feedback: string } {
  const normalizedAnswer = answer.toLowerCase().trim();
  const targetWord = word.word.toLowerCase();

  const containsWord = normalizedAnswer.includes(targetWord);
  const hasMinLength = normalizedAnswer.split(' ').length >= 3;
  const isNotJustWord = normalizedAnswer !== targetWord;

  if (!containsWord) {
    return {
      quality: 1,
      feedback: `Your answer should include the word "${word.word}". Try to use it naturally in a sentence.`,
    };
  }
  if (!hasMinLength) {
    return {
      quality: 2,
      feedback: `Good start! Try to create a more complete sentence using "${word.word}" to better demonstrate understanding.`,
    };
  }
  if (!isNotJustWord) {
    return {
      quality: 2,
      feedback: `Please write a complete sentence using "${word.word}" in context.`,
    };
  }

  const wordCount = normalizedAnswer.split(' ').length;
  if (wordCount >= 5) {
    return {
      quality: 5,
      feedback: `Excellent! You've demonstrated a clear understanding of "${word.word}".`,
    };
  }

  return {
    quality: 4,
    feedback: `Good job using "${word.word}"! Consider how the word's meaning (${word.definition}) fits your sentence.`,
  };
}

// Generate feedback message based on quality
export function getQualityFeedback(quality: number): {
  level: 'perfect' | 'good' | 'okay' | 'needs-work';
  message: string;
  emoji: string;
} {
  if (quality >= 5) return { level: 'perfect', message: 'Perfect!', emoji: '🌟' };
  if (quality >= 4) return { level: 'good', message: 'Great job!', emoji: '✨' };
  if (quality >= 3) return { level: 'okay', message: 'Good effort!', emoji: '👍' };
  return { level: 'needs-work', message: 'Keep practicing!', emoji: '💪' };
}
