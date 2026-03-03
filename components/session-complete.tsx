"use client"

import * as React from "react"
import { Trophy, Star, ArrowRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SessionCompleteProps {
  correct: number
  total: number
  onRestart: () => void
  onExit: () => void
}

export function SessionComplete({ correct, total, onRestart, onExit }: SessionCompleteProps) {
  const percentage = Math.round((correct / total) * 100)
  
  const getMessage = () => {
    if (percentage === 100) return { title: "Perfect Score!", emoji: "🎉", subtitle: "You're a vocabulary master!" }
    if (percentage >= 80) return { title: "Excellent!", emoji: "🌟", subtitle: "Outstanding performance!" }
    if (percentage >= 60) return { title: "Great Job!", emoji: "👏", subtitle: "Keep up the good work!" }
    if (percentage >= 40) return { title: "Good Effort!", emoji: "💪", subtitle: "Practice makes perfect!" }
    return { title: "Keep Trying!", emoji: "📚", subtitle: "Every step counts!" }
  }

  const message = getMessage()

  return (
    <Card className="max-w-md mx-auto overflow-hidden animate-bounce-in">
      <div className="gradient-primary p-8 text-center text-primary-foreground">
        <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-1">{message.title}</h2>
        <p className="text-primary-foreground/80">{message.subtitle}</p>
      </div>
      
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-2">{message.emoji}</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < Math.ceil(percentage / 20) 
                    ? 'text-warning fill-warning' 
                    : 'text-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-4xl font-bold text-gradient">{percentage}%</p>
          <p className="text-muted-foreground">
            {correct} out of {total} correct
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onRestart} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Review Again
          </Button>
          <Button variant="hero" onClick={onExit} className="gap-2">
            Done
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
