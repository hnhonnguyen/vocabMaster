"use client"

import * as React from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { speakText, stopSpeaking } from "@/lib/tts-service"
import { cn } from "@/lib/utils"

interface SpeakButtonProps {
  text: string
  lang?: string
  /** Extra Tailwind classes forwarded to the Button */
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function SpeakButton({ text, lang = "en", className, size = "icon" }: SpeakButtonProps) {
  const [playing, setPlaying] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  // Cleanup on unmount: stop audio and remove listeners
  React.useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (playing) {
      stopSpeaking()
      audioRef.current = null
      setPlaying(false)
    } else {
      const audio = speakText(text, lang)
      if (audio) {
        audioRef.current = audio
        setPlaying(true)

        const onDone = () => {
          setPlaying(false)
          audioRef.current = null
          audio.removeEventListener("ended", onDone)
          audio.removeEventListener("error", onDone)
          audio.removeEventListener("pause", onDone)
        }

        audio.addEventListener("ended", onDone)
        audio.addEventListener("error", onDone)
        audio.addEventListener("pause", onDone)
      }
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      className={cn("shrink-0 text-muted-foreground hover:text-primary", className)}
      title={`Speak "${text}"`}
      type="button"
    >
      {playing ? (
        <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      )}
    </Button>
  )
}
