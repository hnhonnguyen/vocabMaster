"use client"

import * as React from "react"
import { ArrowRight, Lightbulb, CheckCircle2, XCircle, Sparkles, Loader2, BookOpenText, SkipForward, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { VocabWord } from "@/lib/types"
import { generateQuestion, generateQuestionAsync, evaluateAnswer, evaluateAnswerAsync, getQualityFeedback } from "@/lib/question-generator"
import { isAIConfigured } from "@/lib/config"
import { calculateNextReview } from "@/lib/spaced-repetition"

interface LearningModeProps {
  words: VocabWord[]
  onUpdateWord: (wordId: string, updates: Partial<VocabWord>) => void
  onComplete: (correct: number, total: number) => void
  onExit: () => void
}

interface ReviewState {
  currentIndex: number
  answer: string
  showFeedback: boolean
  feedback: string
  quality: number
  completed: number
  correct: number
  skippedKnown: number
  skippedUnknown: number
  lastAction: 'answer' | 'skip-known' | 'skip-unknown' | null
}

export function LearningMode({ words, onUpdateWord, onComplete, onExit }: LearningModeProps) {
  // Store words snapshot at session start to prevent mid-session changes
  const sessionWords = React.useRef<VocabWord[]>(words)
  const pendingUpdates = React.useRef<Map<string, { wordId: string; updates: Partial<VocabWord> }>>(new Map())

  const [state, setState] = React.useState<ReviewState>({
    currentIndex: 0,
    answer: "",
    showFeedback: false,
    feedback: "",
    quality: 0,
    completed: 0,
    correct: 0,
    skippedKnown: 0,
    skippedUnknown: 0,
    lastAction: null,
  })

  const [showHint, setShowHint] = React.useState(false)
  const [isLoadingQuestion, setIsLoadingQuestion] = React.useState(false)
  const [isEvaluating, setIsEvaluating] = React.useState(false)
  const [question, setQuestion] = React.useState(() => 
    sessionWords.current.length > 0 ? generateQuestion(sessionWords.current[0]) : null
  )

  // Try to load an AI-generated question on mount
  React.useEffect(() => {
    if (sessionWords.current.length > 0 && isAIConfigured()) {
      setIsLoadingQuestion(true)
      generateQuestionAsync(sessionWords.current[0])
        .then(q => setQuestion(q))
        .catch(() => {})
        .finally(() => setIsLoadingQuestion(false))
    }
  }, [])

  const currentWord = sessionWords.current[state.currentIndex]
  const totalWords = sessionWords.current.length
  const progress = ((state.completed) / totalWords) * 100
  const isLastWord = state.currentIndex >= totalWords - 1

  const handleSubmit = async () => {
    if (!currentWord || !question) return

    setIsEvaluating(true)
    const { quality, feedback } = await evaluateAnswerAsync(state.answer, currentWord, question)
    setIsEvaluating(false)
    
    setState(prev => ({
      ...prev,
      showFeedback: true,
      feedback,
      quality,
      correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      lastAction: 'answer',
    }))

    // Store update for later - apply when moving to next word
    const updates = calculateNextReview(currentWord, quality)
    pendingUpdates.current.set(currentWord.id, { wordId: currentWord.id, updates })
  }

  const handleSkip = (type: 'known' | 'unknown') => {
    if (!currentWord) return

    const quality = type === 'known' ? 5 : 1
    const updates = calculateNextReview(currentWord, quality)
    pendingUpdates.current.set(currentWord.id, { wordId: currentWord.id, updates })

    setState(prev => ({
      ...prev,
      showFeedback: true,
      quality,
      feedback: type === 'known'
        ? `Marked as known — next review scheduled in ${updates.interval || 1} day${(updates.interval || 1) > 1 ? 's' : ''}.`
        : `Marked for review — this word will appear again tomorrow.`,
      correct: type === 'known' ? prev.correct + 1 : prev.correct,
      lastAction: type === 'known' ? 'skip-known' : 'skip-unknown',
      skippedKnown: type === 'known' ? prev.skippedKnown + 1 : prev.skippedKnown,
      skippedUnknown: type === 'unknown' ? prev.skippedUnknown + 1 : prev.skippedUnknown,
    }))
  }

  const handleNext = () => {
    // Apply pending update for current word
    const pending = pendingUpdates.current.get(currentWord?.id || '')
    if (pending) {
      onUpdateWord(pending.wordId, pending.updates)
      pendingUpdates.current.delete(currentWord?.id || '')
    }

    if (isLastWord) {
      onComplete(state.correct, totalWords)
      return
    }

    const nextIndex = state.currentIndex + 1
    const nextWord = sessionWords.current[nextIndex]
    const nextQuestion = generateQuestion(nextWord)

    setState(prev => ({
      ...prev,
      currentIndex: nextIndex,
      answer: "",
      showFeedback: false,
      feedback: "",
      quality: 0,
      completed: prev.completed + 1,
      lastAction: null,
    }))
    setQuestion(nextQuestion)
    setShowHint(false)

    // Try to replace with AI-generated question
    if (isAIConfigured()) {
      setIsLoadingQuestion(true)
      generateQuestionAsync(nextWord)
        .then(q => setQuestion(q))
        .catch(() => {})
        .finally(() => setIsLoadingQuestion(false))
    }
  }

  if (totalWords === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground mb-6">
            No words are due for review right now. Add more words or check back later.
          </p>
          <Button onClick={onExit} variant="outline">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!currentWord || !question) return null

  const qualityFeedback = getQualityFeedback(state.quality)

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{state.completed + 1} of {totalWords}</span>
        </div>
        <Progress value={progress} className="h-1.5 sm:h-2" />
      </div>

      {/* Question Card */}
      <Card className="overflow-hidden">
        <CardHeader className="gradient-primary text-primary-foreground py-3 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base sm:text-lg">
              Word: <span className="font-bold">{currentWord.word}</span>
            </CardTitle>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs sm:text-sm px-2 py-0.5">
              {currentWord.partOfSpeech}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Question */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              AI Question
            </div>
            <p className="text-base sm:text-lg">{question.prompt}</p>
          </div>

          {/* Grammar Structure (always visible when available) */}
          {!state.showFeedback && question.grammarStructure && (
            <div className="p-2.5 sm:p-3 rounded-lg bg-accent/5 border border-accent/15 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-accent">
                <BookOpenText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Required Grammar
              </div>
              <p className="text-xs sm:text-sm font-medium">{question.grammarStructure}</p>
              {question.grammarExample && (
                <p className="text-xs text-muted-foreground italic">
                  Example: &ldquo;{question.grammarExample}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Hint */}
          {!state.showFeedback && question.hint && (
            <div>
              {showHint ? (
                <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 text-xs sm:text-sm">
                  <span className="font-medium">Hint:</span> {question.hint}
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHint(true)}
                  className="text-muted-foreground h-8 px-2.5 text-xs sm:text-sm"
                >
                  <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Show Hint
                </Button>
              )}
            </div>
          )}

          {/* Answer Input */}
          {!state.showFeedback ? (
            <div className="space-y-3 sm:space-y-4">
              <Textarea
                placeholder={`Write your answer using "${currentWord.word}"...`}
                value={state.answer}
                onChange={(e) => setState(prev => ({ ...prev, answer: e.target.value }))}
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base"
              />
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={onExit} 
                  className="h-9 px-3 text-xs sm:text-sm shrink-0"
                >
                  Exit
                </Button>
                <div className="flex-1 min-w-0" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkip('unknown')}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-2.5 text-xs sm:text-sm shrink-0"
                  title="Skip — I don't know this word"
                >
                  <ThumbsDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                  <span className="hidden xs:inline">Don&apos;t Know</span>
                  <span className="xs:hidden">Skip</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkip('known')}
                  className="text-success hover:text-success hover:bg-success/10 h-9 px-2.5 text-xs sm:text-sm shrink-0"
                  title="Skip — I already know this word"
                >
                  <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                  <span className="hidden xs:inline">Know It</span>
                  <span className="xs:hidden">Known</span>
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!state.answer.trim() || isEvaluating}
                  variant="hero"
                  className="h-9 px-3 sm:px-4 text-xs sm:text-sm shrink-0"
                >
                  {isEvaluating ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" /> : null}
                  Submit
                </Button>
              </div>
            </div>
          ) : (
            /* Feedback */
            <div className="space-y-3 sm:space-y-4 animate-slide-up">
              {/* Skip indicator */}
              {(state.lastAction === 'skip-known' || state.lastAction === 'skip-unknown') && (
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Skipped
                </div>
              )}

              <div className={`p-3 sm:p-4 rounded-lg border-2 ${
                state.lastAction === 'skip-known'
                  ? 'bg-success/10 border-success/30'
                  : state.lastAction === 'skip-unknown'
                  ? 'bg-warning/10 border-warning/30'
                  : state.quality >= 3
                  ? 'bg-success/10 border-success/30'
                  : 'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {state.lastAction === 'skip-known' ? (
                    <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                  ) : state.lastAction === 'skip-unknown' ? (
                    <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                  ) : state.quality >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                  )}
                  <span className="font-semibold text-sm sm:text-base">
                    {state.lastAction === 'skip-known'
                      ? 'Already Known'
                      : state.lastAction === 'skip-unknown'
                      ? 'Needs Practice'
                      : `${qualityFeedback.emoji} ${qualityFeedback.message}`}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{state.feedback}</p>
              </div>

              {/* Your Answer (only for submitted answers) */}
              {state.lastAction === 'answer' && (
                <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your answer:</p>
                  <p className="text-xs sm:text-sm">{state.answer}</p>
                </div>
              )}

              {/* Definition (shown for skipped words) */}
              {(state.lastAction === 'skip-known' || state.lastAction === 'skip-unknown') && (
                <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Definition:</p>
                  <p className="text-xs sm:text-sm">{currentWord.definition}</p>
                </div>
              )}

              {/* Example */}
              {currentWord.example && (
                <div className="p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-1">Example usage:</p>
                  <p className="text-xs sm:text-sm italic">&ldquo;{currentWord.example}&rdquo;</p>
                </div>
              )}

              <Button onClick={handleNext} variant="hero" className="w-full h-10 sm:h-12 text-sm sm:text-base">
                {isLastWord ? 'Complete Session' : 'Next Word'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
