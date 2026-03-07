// Text-to-speech service using Google Translate TTS API
// Uses the unofficial Google Translate TTS endpoint (no API key required)

let currentAudio: HTMLAudioElement | null = null

/**
 * Speak text using the Google Translate TTS API.
 * Stops any previously playing audio before starting.
 * @param text - The text to speak
 * @param lang - BCP-47 language code (default: "en")
 * @returns The HTMLAudioElement so callers can listen to "ended"/"error" events
 */
export function speakText(text: string, lang = 'en'): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null

  // Stop any currently playing audio
  stopSpeaking()

  const encoded = encodeURIComponent(text)
  const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=gtx`

  const audio = new Audio(url)
  currentAudio = audio

  audio.play().catch(() => {
    if (currentAudio === audio) currentAudio = null
  })

  audio.addEventListener('ended', () => {
    if (currentAudio === audio) currentAudio = null
  })

  return audio
}

/**
 * Stop any currently playing TTS audio.
 */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}
