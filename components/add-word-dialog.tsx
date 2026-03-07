"use client"

import * as React from "react"
import { Plus, Sparkles, Loader2, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VocabWord } from "@/lib/types"
import { createWord } from "@/lib/spaced-repetition"
import { lookupWord, DictionaryEntry } from "@/lib/dictionary-service"

interface AddWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWord: (word: VocabWord) => void
}

export function AddWordDialog({ open, onOpenChange, onAddWord }: AddWordDialogProps) {
  const [word, setWord] = React.useState("")
  const [definition, setDefinition] = React.useState("")
  const [example, setExample] = React.useState("")
  const [partOfSpeech, setPartOfSpeech] = React.useState("noun")
  
  // AI suggestion state
  const [isLookingUp, setIsLookingUp] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<DictionaryEntry[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [lookupError, setLookupError] = React.useState<string | null>(null)
  
  const lookupTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Debounced word lookup
  const handleWordChange = (value: string) => {
    setWord(value)
    setLookupError(null)
    
    // Clear previous timeout
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current)
    }
    
    // Reset suggestions if word is cleared
    if (!value.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    
    // Debounce lookup - wait 500ms after user stops typing
    lookupTimeoutRef.current = setTimeout(() => {
      handleLookup(value.trim())
    }, 500)
  }

  const handleLookup = async (searchWord: string) => {
    if (!searchWord || searchWord.length < 2) return
    
    setIsLookingUp(true)
    setLookupError(null)
    
    try {
      const result = await lookupWord(searchWord)
      
      if (result.success && result.entries.length > 0) {
        setSuggestions(result.entries)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        if (result.error) {
          setLookupError(result.error)
        }
      }
    } catch (error) {
      setLookupError('Failed to lookup word')
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleSelectSuggestion = (entry: DictionaryEntry) => {
    setDefinition(entry.definition)
    setPartOfSpeech(entry.partOfSpeech)
    if (entry.example) {
      setExample(entry.example)
    }
    setShowSuggestions(false)
  }

  const handleAutoFill = async () => {
    if (!word.trim()) return
    await handleLookup(word.trim())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (word.trim() && definition.trim()) {
      const newWord = createWord(word.trim(), definition.trim(), example.trim(), partOfSpeech)
      onAddWord(newWord)
      resetForm()
      onOpenChange(false)
    }
  }

  const resetForm = () => {
    setWord("")
    setDefinition("")
    setExample("")
    setPartOfSpeech("noun")
    setSuggestions([])
    setShowSuggestions(false)
    setLookupError(null)
  }

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current)
      }
    }
  }, [])

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient">Add New Word</DialogTitle>
          <DialogDescription>
            Add a vocabulary word - AI will help suggest definitions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Word Input with AI lookup */}
          <div className="space-y-2">
            <label htmlFor="word" className="text-sm font-medium">
              Word
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="word"
                  placeholder="Enter the word"
                  value={word}
                  onChange={(e) => handleWordChange(e.target.value)}
                  required
                  className="pr-10"
                />
                {isLookingUp && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAutoFill}
                disabled={!word.trim() || isLookingUp}
                title="Get AI suggestions"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Lookup error */}
            {lookupError && (
              <p className="text-xs text-muted-foreground">{lookupError}</p>
            )}
            
            {/* AI Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="border rounded-lg bg-card shadow-lg max-h-60 overflow-y-auto animate-slide-up">
                <div className="p-2 border-b bg-muted/50">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-primary" />
                    AI Suggestions - Click to apply
                  </div>
                </div>
                {suggestions.map((entry, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(entry)}
                    className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {entry.partOfSpeech}
                      </Badge>
                      {entry.phonetic && (
                        <span className="text-xs text-muted-foreground">
                          {entry.phonetic}
                        </span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{entry.definition}</p>
                    {entry.example && (
                      <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                        &ldquo;{entry.example}&rdquo;
                      </p>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="w-full p-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Close suggestions
                </button>
              </div>
            )}
          </div>

          {/* Part of Speech */}
          <div className="space-y-2">
            <label htmlFor="partOfSpeech" className="text-sm font-medium">
              Part of Speech
            </label>
            <input
              id="partOfSpeech"
              list="pos-options"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder="Select or type a part of speech"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <datalist id="pos-options">
              <option value="noun" />
              <option value="verb" />
              <option value="adjective" />
              <option value="adverb" />
              <option value="preposition" />
              <option value="conjunction" />
              <option value="interjection" />
              <option value="pronoun" />
              <option value="article" />
              <option value="determiner" />
              <option value="exclamation" />
              <option value="phrase" />
              <option value="abbreviation" />
            </datalist>
          </div>

          {/* Definition */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="definition" className="text-sm font-medium">
                Definition
              </label>
              {definition && (
                <Check className="w-4 h-4 text-success" />
              )}
            </div>
            <Textarea
              id="definition"
              placeholder="Enter the definition (or use AI suggestions above)"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
              className="min-h-[80px]"
            />
          </div>

          {/* Example Sentence */}
          <div className="space-y-2">
            <label htmlFor="example" className="text-sm font-medium">
              Example Sentence
              <span className="text-muted-foreground ml-1">(optional)</span>
            </label>
            <Textarea
              id="example"
              placeholder="Enter an example sentence"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={!word.trim() || !definition.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Word
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
