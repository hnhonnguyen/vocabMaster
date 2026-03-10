"use client"

import * as React from "react"
import { Check, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VocabWord } from "@/lib/types"

interface EditWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  word: VocabWord | null
  onSave: (wordId: string, updates: Partial<VocabWord>) => void
}

export function EditWordDialog({ open, onOpenChange, word, onSave }: EditWordDialogProps) {
  const [wordText, setWordText] = React.useState("")
  const [definition, setDefinition] = React.useState("")
  const [example, setExample] = React.useState("")
  const [partOfSpeech, setPartOfSpeech] = React.useState("noun")

  // Populate fields when word changes or dialog opens
  React.useEffect(() => {
    if (open && word) {
      setWordText(word.word)
      setDefinition(word.definition)
      setExample(word.example ?? "")
      setPartOfSpeech(word.partOfSpeech)
    }
  }, [open, word])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!word || !wordText.trim() || !definition.trim()) return
    onSave(word.id, {
      word: wordText.trim(),
      definition: definition.trim(),
      example: example.trim(),
      partOfSpeech,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient">Edit Word</DialogTitle>
          <DialogDescription>
            Update the details for this vocabulary word.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Word */}
          <div className="space-y-2">
            <label htmlFor="edit-word" className="text-sm font-medium">
              Word
            </label>
            <Input
              id="edit-word"
              placeholder="Enter the word"
              value={wordText}
              onChange={(e) => setWordText(e.target.value)}
              required
            />
          </div>

          {/* Part of Speech */}
          <div className="space-y-2">
            <label htmlFor="edit-partOfSpeech" className="text-sm font-medium">
              Part of Speech
            </label>
            <input
              id="edit-partOfSpeech"
              list="edit-pos-options"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder="Select or type a part of speech"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <datalist id="edit-pos-options">
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
              <label htmlFor="edit-definition" className="text-sm font-medium">
                Definition
              </label>
              {definition && (
                <Check className="w-4 h-4 text-success" />
              )}
            </div>
            <Textarea
              id="edit-definition"
              placeholder="Enter the definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
              className="min-h-[80px]"
            />
          </div>

          {/* Example Sentence */}
          <div className="space-y-2">
            <label htmlFor="edit-example" className="text-sm font-medium">
              Example Sentence
              <span className="text-muted-foreground ml-1">(optional)</span>
            </label>
            <Textarea
              id="edit-example"
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
            <Button type="submit" variant="hero" className="flex-1" disabled={!wordText.trim() || !definition.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
