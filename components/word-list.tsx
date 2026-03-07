"use client"

import * as React from "react"
import { BookOpen, Trash2, Clock, Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { VocabWord } from "@/lib/types"
import { calculateMastery } from "@/lib/spaced-repetition"
import { SpeakButton } from "@/components/speak-button"

interface WordListProps {
  words: VocabWord[]
  onDeleteWord: (id: string) => void
}

export function WordList({ words, onDeleteWord }: WordListProps) {
  if (words.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-muted-foreground">No words yet</h3>
        <p className="text-xs sm:text-sm text-muted-foreground/70 px-4">Add your first word to start learning!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {words.map((word, index) => (
        <WordCard 
          key={word.id} 
          word={word} 
          onDelete={() => onDeleteWord(word.id)}
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  )
}

interface WordCardProps {
  word: VocabWord
  onDelete: () => void
  style?: React.CSSProperties
}

function WordCard({ word, onDelete, style }: WordCardProps) {
  const mastery = calculateMastery(word)
  const isDue = new Date(word.nextReviewDate) <= new Date()
  
  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'success'
    if (mastery >= 40) return 'warning'
    return 'secondary'
  }

  const getNextReviewText = () => {
    const nextReview = new Date(word.nextReviewDate)
    const now = new Date()
    const diffDays = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'Due now'
    if (diffDays === 1) return 'Tomorrow'
    return `In ${diffDays} days`
  }

  return (
    <Card className="group animate-slide-up overflow-hidden" style={style}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <h3 className="font-semibold text-base sm:text-lg truncate">{word.word}</h3>
              <SpeakButton text={word.word} className="h-6 w-6 sm:h-7 sm:w-7" />
              <Badge variant="outline" className="text-xs shrink-0 px-1.5 py-0.5">
                {word.partOfSpeech}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{word.definition}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
        
        {word.example && (
          <div className="flex items-start gap-1 mb-2 sm:mb-3">
            <p className="text-xs text-muted-foreground italic line-clamp-2 flex-1">
              &ldquo;{word.example}&rdquo;
            </p>
            <SpeakButton text={word.example} className="h-6 w-6 mt-0.5 shrink-0" />
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Award className="w-3 h-3" />
              <span>Mastery</span>
            </div>
            <span className="font-medium">{mastery}%</span>
          </div>
          <Progress value={mastery} className="h-1.5 sm:h-2" />
          
          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{getNextReviewText()}</span>
            </div>
            {isDue && (
              <Badge variant="default" className="text-xs px-1.5 py-0.5 animate-pulse">
                Ready to review
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
