// OpenAI-compatible AI service for vocabulary features
import { getAIConfig, isAIConfigured } from './config';
import { VocabWord, Question } from './types';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Core chat completion call
async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error('API key not configured');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: options?.maxTokens ?? config.maxTokens,
      temperature: options?.temperature ?? config.temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data: ChatCompletionResponse = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

// Test API connection
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await chatCompletion([
      { role: 'user', content: 'Respond with exactly: OK' }
    ], { maxTokens: 10 });

    return { success: result.toLowerCase().includes('ok') };
  } catch (error: any) {
    return { success: false, error: error.message || 'Connection failed' };
  }
}

// Look up a word and get definitions
export async function aiLookupWord(word: string): Promise<{
  success: boolean;
  entries: Array<{
    word: string;
    partOfSpeech: string;
    definition: string;
    example?: string;
    synonyms?: string[];
  }>;
  error?: string;
}> {
  if (!isAIConfigured()) {
    return { success: false, entries: [], error: 'API not configured' };
  }

  try {
    const result = await chatCompletion([
      {
        role: 'system',
        content: `You are a bilingual English-Vietnamese dictionary API. Return JSON only, no markdown. Format:
[{"partOfSpeech":"...","definition":"English meaning / Vietnamese meaning (closest Vietnamese word)","example":"...","synonyms":["..."]}]
Each definition field must contain: the English meaning, followed by " / ", then the Vietnamese translation, then in parentheses the single most accurate Vietnamese word or short phrase that best captures the word's core meaning.
For example: "lasting for a very short time / tồn tại trong thời gian rất ngắn (nhất thời)"
Another example: "present, appearing, or found everywhere / hiện diện ở khắp nơi (phổ biến)"
Provide 2-3 distinct definitions with examples.`
      },
      {
        role: 'user',
        content: `Define the English word: "${word}"`
      }
    ], { temperature: 0.3 });

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const entries = JSON.parse(cleaned);

    return {
      success: true,
      entries: (Array.isArray(entries) ? entries : [entries]).map((e: any) => ({
        word,
        partOfSpeech: e.partOfSpeech || 'noun',
        definition: e.definition || '',
        example: e.example,
        synonyms: e.synonyms?.slice(0, 5),
      })),
    };
  } catch (error: any) {
    return { success: false, entries: [], error: error.message || 'Lookup failed' };
  }
}

// Generate a contextual question for a vocabulary word
export async function aiGenerateQuestion(word: VocabWord): Promise<Question | null> {
  if (!isAIConfigured()) return null;

  try {
    const result = await chatCompletion([
      {
        role: 'system',
        content: `You are a vocabulary and grammar tutor. Generate a creative question that tests BOTH vocabulary understanding AND a specific grammar structure.

Return JSON only, no markdown. Format:
{"type":"fill-blank"|"context-usage"|"definition"|"synonym","prompt":"...","hint":"...","grammarStructure":"...","grammarExample":"..."}

Rules:
- The question MUST require the student to use the target word in their answer.
- The question MUST require using a specific English grammar structure (e.g., conditional sentences, passive voice, relative clauses, present perfect, reported speech, comparatives/superlatives, wish clauses, modal verbs, gerunds/infinitives, etc.).
- "grammarStructure" must contain the grammar formula/form, e.g. "Conditional Type 2: If + past simple, would + base verb" or "Passive Voice: Subject + be + past participle".
- "grammarExample" must contain a concrete example sentence applying that grammar structure with the target word, e.g. "If I were more eloquent, I would persuade anyone easily."
- "hint" should combine a brief vocabulary reminder with the grammar requirement.
- Vary both question styles AND grammar structures across questions.`
      },
      {
        role: 'user',
        content: `Word: "${word.word}"
Part of speech: ${word.partOfSpeech}
Definition: ${word.definition}
Example: ${word.example || 'N/A'}

Generate a question that tests understanding of this word using a specific grammar structure.`
      }
    ], { temperature: 0.9 });

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      type: parsed.type || 'context-usage',
      prompt: parsed.prompt,
      targetWord: word.word,
      hint: parsed.hint,
      grammarStructure: parsed.grammarStructure,
      grammarExample: parsed.grammarExample,
    };
  } catch {
    return null;
  }
}

// Evaluate a student's answer using AI
export async function aiEvaluateAnswer(
  answer: string,
  word: VocabWord,
  question: Question
): Promise<{ quality: number; feedback: string; correctedAnswer?: string } | null> {
  if (!isAIConfigured()) return null;

  const grammarContext = question.grammarStructure
    ? `\nRequired grammar structure: ${question.grammarStructure}`
    : '';

  try {
    const result = await chatCompletion([
      {
        role: 'system',
        content: `You are a vocabulary and grammar tutor evaluating a student's answer. Return JSON only, no markdown.
Format: {"quality": <0-5>, "feedback": "...", "correctedAnswer": "..."}
Scoring:
- 5: Perfect use of the word AND correct grammar structure
- 4: Good use of word and grammar, minor issues
- 3: Acceptable vocabulary use, grammar structure attempted but imperfect
- 2: Word used but meaning unclear or grammar structure missing
- 1: Word included but used incorrectly, no grammar structure
- 0: Word missing or nonsensical

The answer MUST include the target word "${word.word}" to score 3+.${grammarContext ? '\n' + grammarContext + ' — the answer should follow this structure to score 4+.' : ''}
Be encouraging but honest. Keep feedback under 2 sentences. If grammar structure was required, mention whether it was used correctly.
For "correctedAnswer": if quality < 5, provide an improved version of the student's answer that fixes any vocabulary or grammar issues. If quality is 5, omit this field or set it to null.`
      },
      {
        role: 'user',
        content: `Word: "${word.word}" (${word.partOfSpeech})
Definition: ${word.definition}
Question: ${question.prompt}${grammarContext}
Student's answer: "${answer}"

Evaluate this answer.`
      }
    ], { temperature: 0.3 });

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      quality: Math.max(0, Math.min(5, Math.round(parsed.quality))),
      feedback: parsed.feedback || '',
      correctedAnswer: parsed.correctedAnswer || undefined,
    };
  } catch {
    return null;
  }
}

// Look up multiple words in bulk
export async function aiBulkLookup(words: string[]): Promise<
  Array<{ word: string; definition: string; partOfSpeech: string; example?: string }>
> {
  if (!isAIConfigured()) return [];

  try {
    const result = await chatCompletion([
      {
        role: 'system',
        content: `You are a dictionary. Return JSON only, no markdown. Format:
[{"word":"...","partOfSpeech":"...","definition":"...","example":"..."}]
Provide exactly one primary definition per word.`
      },
      {
        role: 'user',
        content: `Define these words: ${words.join(', ')}`
      }
    ], { temperature: 0.3, maxTokens: 1024 });

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
