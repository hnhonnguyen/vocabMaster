// Dictionary service - uses AI when configured, falls back to free API
import { isAIConfigured } from './config';
import { aiLookupWord } from './ai-service';

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms?: string[];
}

export interface DictionaryResponse {
  success: boolean;
  entries: DictionaryEntry[];
  error?: string;
}

// Main lookup function - routes to AI or free API
export async function lookupWord(word: string): Promise<DictionaryResponse> {
  if (isAIConfigured()) {
    return aiLookup(word);
  }
  return freeDictionaryLookup(word);
}

// AI-powered lookup via OpenAI-compatible API
async function aiLookup(word: string): Promise<DictionaryResponse> {
  try {
    const result = await aiLookupWord(word);
    if (result.success) {
      return {
        success: true,
        entries: result.entries.map(e => ({
          word: e.word,
          partOfSpeech: e.partOfSpeech,
          definition: e.definition,
          example: e.example,
          synonyms: e.synonyms,
        })),
      };
    }
    // Fall back to free API on AI failure
    return freeDictionaryLookup(word);
  } catch {
    return freeDictionaryLookup(word);
  }
}

// Free Dictionary API fallback
async function freeDictionaryLookup(word: string): Promise<DictionaryResponse> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, entries: [], error: 'Word not found in dictionary' };
      }
      return { success: false, entries: [], error: 'Failed to fetch definition' };
    }

    const data = await response.json();
    const entries: DictionaryEntry[] = [];

    for (const entry of data) {
      const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text;
      
      for (const meaning of entry.meanings || []) {
        for (const def of meaning.definitions || []) {
          entries.push({
            word: entry.word,
            phonetic,
            partOfSpeech: meaning.partOfSpeech || 'noun',
            definition: def.definition,
            example: def.example,
            synonyms: def.synonyms?.slice(0, 5) || meaning.synonyms?.slice(0, 5),
          });
        }
      }
    }

    return { success: true, entries: entries.slice(0, 10) }; // Limit to 10 entries
  } catch (error) {
    console.error('Dictionary lookup error:', error);
    return { success: false, entries: [], error: 'Network error' };
  }
}

// Parse bulk import text (supports various formats)
export interface ParsedWord {
  word: string;
  definition?: string;
  example?: string;
  partOfSpeech?: string;
}

export interface BulkParseResult {
  success: boolean;
  words: ParsedWord[];
  errors: string[];
}

// Parse CSV format: word,definition,example,partOfSpeech
export function parseCSV(text: string): BulkParseResult {
  const lines = text.trim().split('\n');
  const words: ParsedWord[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Skip header row if present
    if (i === 0 && line.toLowerCase().includes('word') && line.toLowerCase().includes('definition')) {
      continue;
    }

    // Handle CSV with potential quoted values
    const parts = parseCSVLine(line);
    
    if (parts.length >= 1 && parts[0].trim()) {
      words.push({
        word: parts[0].trim(),
        definition: parts[1]?.trim() || undefined,
        example: parts[2]?.trim() || undefined,
        partOfSpeech: parts[3]?.trim() || undefined,
      });
    } else {
      errors.push(`Line ${i + 1}: Invalid format`);
    }
  }

  return { success: errors.length === 0, words, errors };
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

// Parse JSON format
export function parseJSON(text: string): BulkParseResult {
  const errors: string[] = [];
  
  try {
    const data = JSON.parse(text);
    const items = Array.isArray(data) ? data : [data];
    
    const words: ParsedWord[] = items
      .filter((item, index) => {
        if (!item.word && !item.term) {
          errors.push(`Item ${index + 1}: Missing word field`);
          return false;
        }
        return true;
      })
      .map(item => ({
        word: item.word || item.term,
        definition: item.definition || item.meaning || item.def,
        example: item.example || item.sentence,
        partOfSpeech: item.partOfSpeech || item.pos || item.type,
      }));

    return { success: errors.length === 0, words, errors };
  } catch (e) {
    return { success: false, words: [], errors: ['Invalid JSON format'] };
  }
}

// Parse simple text format (word - definition or word: definition)
export function parseSimpleText(text: string): BulkParseResult {
  const lines = text.trim().split('\n');
  const words: ParsedWord[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try different separators: " - ", ": ", " – ", " — ", "\t"
    const separators = [' - ', ': ', ' – ', ' — ', '\t'];
    let parsed = false;

    for (const sep of separators) {
      const idx = line.indexOf(sep);
      if (idx > 0) {
        const word = line.substring(0, idx).trim();
        const definition = line.substring(idx + sep.length).trim();
        
        if (word && definition) {
          words.push({ word, definition });
          parsed = true;
          break;
        }
      }
    }

    // If no separator found, treat whole line as just a word
    if (!parsed) {
      if (line.length > 0 && line.length < 50 && !line.includes(' ')) {
        words.push({ word: line });
      } else if (line.split(/\s+/).length <= 3) {
        // Could be a multi-word term
        words.push({ word: line });
      } else {
        errors.push(`Line ${i + 1}: Could not parse "${line.substring(0, 30)}..."`);
      }
    }
  }

  return { success: true, words, errors };
}

// Auto-detect format and parse
export function parseImportText(text: string): BulkParseResult {
  const trimmed = text.trim();
  
  // Try JSON first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const result = parseJSON(trimmed);
    if (result.words.length > 0) return result;
  }
  
  // Try CSV (if first line has commas and looks like header or data)
  const firstLine = trimmed.split('\n')[0];
  if (firstLine.includes(',') && (firstLine.split(',').length >= 2)) {
    const result = parseCSV(trimmed);
    if (result.words.length > 0) return result;
  }
  
  // Fall back to simple text parsing
  return parseSimpleText(trimmed);
}
