// Centralized API configuration for OpenAI-compatible endpoints
// Stored in localStorage for easy user modification

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  googleApiKey: string;
}

const CONFIG_STORAGE_KEY = 'vocab-master-ai-config';

const DEFAULT_CONFIG: AIConfig = {
  apiKey: 'ahihi',
  baseUrl: '',
  model: '',
  maxTokens: 512,
  temperature: 0.7,
  googleApiKey: '',
};

// Load config from localStorage
export function getAIConfig(): AIConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    console.error('Error loading AI config:', error);
  }

  return DEFAULT_CONFIG;
}

// Save config to localStorage
export function saveAIConfig(config: Partial<AIConfig>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getAIConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving AI config:', error);
  }
}

// Check if API is configured (has a key)
export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return !!config.apiKey && config.apiKey.trim().length > 0;
}

// Reset config to defaults
export function resetAIConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

// Check if Google TTS is configured
export function isGoogleTTSConfigured(): boolean {
  const config = getAIConfig();
  return !!config.googleApiKey && config.googleApiKey.trim().length > 0;
}
