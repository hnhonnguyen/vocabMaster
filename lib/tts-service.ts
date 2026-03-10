// TTS (Text-to-Speech) service with provider abstraction
// Supports browser Web Speech API and Google GenAI TTS
import { getAIConfig } from './config';

export interface TTSProvider {
  name: string;
  isAvailable(): boolean;
  speak(text: string): Promise<void>;
}

// ── Browser Web Speech API provider (free, built-in) ───────────────────────
export class BrowserTTSProvider implements TTSProvider {
  name = 'browser';

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async speak(text: string): Promise<void> {
    if (!this.isAvailable()) return;

    return new Promise((resolve, reject) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(e.error));
      window.speechSynthesis.speak(utterance);
    });
  }
}

// ── Google GenAI TTS provider ───────────────────────────────────────────────
// Calls the Generative Language REST API directly from the browser.
// The API key is the user's Google AI Studio key (AIzaSy...).

const GOOGLE_GENAI_TTS_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';

// PCM parameters returned by the Google GenAI TTS model
const PCM_SAMPLE_RATE = 24000;
const PCM_CHANNELS = 1;
const PCM_BIT_DEPTH = 16;

async function playPCMAudio(base64Data: string): Promise<void> {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();

  const bytesPerSample = PCM_BIT_DEPTH / 8;
  const numSamples = bytes.byteLength / bytesPerSample;
  const audioBuffer = audioContext.createBuffer(
    PCM_CHANNELS,
    numSamples,
    PCM_SAMPLE_RATE,
  );

  const channelData = audioBuffer.getChannelData(0);
  const dataView = new DataView(bytes.buffer);
  for (let i = 0; i < numSamples; i++) {
    // Convert little-endian Int16 to Float32 (-1.0 to 1.0)
    channelData[i] = dataView.getInt16(i * bytesPerSample, true) / 32768.0;
  }

  return new Promise((resolve) => {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      audioContext.close().catch(() => {});
      resolve();
    };
    source.start();
  });
}

export class GoogleGenAITTSProvider implements TTSProvider {
  name = 'google-genai';

  constructor(private apiKey: string) {}

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async speak(text: string): Promise<void> {
    const response = await fetch(GOOGLE_GENAI_TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Google GenAI TTS request failed (HTTP ${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();
    const audioData =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error('No audio data returned from Google GenAI TTS');
    }

    await playPCMAudio(audioData);
  }
}

// ── Provider selection ──────────────────────────────────────────────────────

/**
 * Returns the best available TTS provider based on the current config.
 * Prefers Google GenAI when a Google API key is configured; falls back to the
 * browser's built-in Web Speech API.
 */
export function getTTSProvider(): TTSProvider {
  if (typeof window === 'undefined') {
    // Server-side: return a no-op browser provider (will not be called)
    return new BrowserTTSProvider();
  }

  const config = getAIConfig();
  if (config.googleApiKey?.trim()) {
    return new GoogleGenAITTSProvider(config.googleApiKey.trim());
  }

  return new BrowserTTSProvider();
}

/**
 * Speaks the given text using the best available provider.
 * Falls back to the browser Web Speech API if the primary provider fails.
 */
export async function speakText(text: string): Promise<void> {
  if (!text?.trim()) return;

  const provider = getTTSProvider();

  if (!provider.isAvailable()) return;

  try {
    await provider.speak(text);
  } catch (err) {
    console.error(`[TTS] ${provider.name} provider failed:`, err);
    // If Google GenAI failed, try the browser fallback
    if (provider.name !== 'browser') {
      const fallback = new BrowserTTSProvider();
      if (fallback.isAvailable()) {
        await fallback.speak(text).catch((fallbackErr) => {
          console.error('[TTS] Browser fallback also failed:', fallbackErr);
        });
      }
    }
  }
}
