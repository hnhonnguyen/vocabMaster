"use client"

import * as React from "react"
import { Upload, FileText, Clipboard, Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VocabWord } from "@/lib/types"
import { createWord } from "@/lib/spaced-repetition"
import { parseImportText, lookupWord, ParsedWord } from "@/lib/dictionary-service"

interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportWords: (words: VocabWord[]) => void
  existingWords: VocabWord[]
}

type ImportStep = 'input' | 'preview' | 'importing' | 'complete'

interface PreviewWord extends ParsedWord {
  isValid: boolean
  isDuplicate: boolean
  status: 'pending' | 'fetching' | 'ready' | 'error'
  selected: boolean
}

export function BulkImportDialog({ open, onOpenChange, onImportWords, existingWords }: BulkImportDialogProps) {
  const [step, setStep] = React.useState<ImportStep>('input')
  const [inputText, setInputText] = React.useState("")
  const [previewWords, setPreviewWords] = React.useState<PreviewWord[]>([])
  const [parseErrors, setParseErrors] = React.useState<string[]>([])
  const [importProgress, setImportProgress] = React.useState(0)
  const [importResults, setImportResults] = React.useState({ success: 0, failed: 0, skipped: 0 })
  const [isEnrichingWithAI, setIsEnrichingWithAI] = React.useState(false)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const existingWordSet = React.useMemo(() => 
    new Set(existingWords.map(w => w.word.toLowerCase())), 
    [existingWords]
  )

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInputText(text)
    }
    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInputText(text)
    } catch (error) {
      console.error('Failed to read clipboard:', error)
    }
  }

  const handleParse = () => {
    if (!inputText.trim()) return

    const result = parseImportText(inputText)
    setParseErrors(result.errors)

    const preview: PreviewWord[] = result.words.map(w => ({
      ...w,
      isValid: !!w.word,
      isDuplicate: existingWordSet.has(w.word.toLowerCase()),
      status: w.definition ? 'ready' : 'pending',
      selected: !existingWordSet.has(w.word.toLowerCase()),
    }))

    setPreviewWords(preview)
    setStep('preview')
  }

  const handleEnrichWithAI = async () => {
    const wordsNeedingDefinition = previewWords.filter(
      w => w.selected && !w.definition && w.status === 'pending'
    )

    if (wordsNeedingDefinition.length === 0) return

    setIsEnrichingWithAI(true)

    // Process words one by one with rate limiting
    for (let i = 0; i < wordsNeedingDefinition.length; i++) {
      const word = wordsNeedingDefinition[i]
      const wordIndex = previewWords.findIndex(w => w.word === word.word)

      // Update status to fetching
      setPreviewWords(prev => prev.map((w, idx) => 
        idx === wordIndex ? { ...w, status: 'fetching' as const } : w
      ))

      try {
        const result = await lookupWord(word.word)
        
        if (result.success && result.entries.length > 0) {
          const entry = result.entries[0]
          setPreviewWords(prev => prev.map((w, idx) => 
            idx === wordIndex ? {
              ...w,
              definition: entry.definition,
              partOfSpeech: entry.partOfSpeech,
              example: entry.example,
              status: 'ready' as const,
            } : w
          ))
        } else {
          setPreviewWords(prev => prev.map((w, idx) => 
            idx === wordIndex ? { ...w, status: 'error' as const } : w
          ))
        }
      } catch (error) {
        setPreviewWords(prev => prev.map((w, idx) => 
          idx === wordIndex ? { ...w, status: 'error' as const } : w
        ))
      }

      // Small delay between API calls to avoid rate limiting
      if (i < wordsNeedingDefinition.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    setIsEnrichingWithAI(false)
  }

  const handleToggleWord = (index: number) => {
    setPreviewWords(prev => prev.map((w, i) => 
      i === index ? { ...w, selected: !w.selected } : w
    ))
  }

  const handleSelectAll = (selected: boolean) => {
    setPreviewWords(prev => prev.map(w => ({
      ...w,
      selected: w.isDuplicate ? false : selected
    })))
  }

  const handleImport = async () => {
    const wordsToImport = previewWords.filter(
      w => w.selected && w.definition && !w.isDuplicate
    )

    if (wordsToImport.length === 0) return

    setStep('importing')
    setImportProgress(0)

    const importedWords: VocabWord[] = []
    let success = 0
    let failed = 0
    const skipped = previewWords.filter(w => !w.selected || w.isDuplicate).length

    for (let i = 0; i < wordsToImport.length; i++) {
      const word = wordsToImport[i]
      
      try {
        const newWord = createWord(
          word.word,
          word.definition!,
          word.example || '',
          word.partOfSpeech || 'noun'
        )
        importedWords.push(newWord)
        success++
      } catch (error) {
        failed++
      }

      setImportProgress(((i + 1) / wordsToImport.length) * 100)
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    setImportResults({ success, failed, skipped })
    onImportWords(importedWords)
    setStep('complete')
  }

  const handleClose = () => {
    setStep('input')
    setInputText('')
    setPreviewWords([])
    setParseErrors([])
    setImportProgress(0)
    setImportResults({ success: 0, failed: 0, skipped: 0 })
    onOpenChange(false)
  }

  const selectedCount = previewWords.filter(w => w.selected && !w.isDuplicate).length
  const readyCount = previewWords.filter(w => w.selected && w.definition && !w.isDuplicate).length
  const needsDefinitionCount = previewWords.filter(w => w.selected && !w.definition && !w.isDuplicate).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-gradient flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Import Words
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Import multiple words at once from text, CSV, or JSON'}
            {step === 'preview' && 'Review and edit words before importing'}
            {step === 'importing' && 'Importing words...'}
            {step === 'complete' && 'Import complete!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4 mt-4">
              {/* Quick actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePasteFromClipboard}
                >
                  <Clipboard className="w-4 h-4 mr-2" />
                  Paste from Clipboard
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Text input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Enter words (one per line)
                </label>
                <Textarea
                  placeholder={`Supported formats:
• word - definition
• word: definition
• word, definition, example, partOfSpeech (CSV)
• JSON array: [{"word": "...", "definition": "..."}]
• Just words (AI will fetch definitions)`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              {/* Format examples */}
              <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
                <p className="font-medium text-muted-foreground">Example formats:</p>
                <code className="block text-muted-foreground">ephemeral - lasting for a short time</code>
                <code className="block text-muted-foreground">ubiquitous: found everywhere</code>
                <code className="block text-muted-foreground">resilient</code>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="hero" 
                  onClick={handleParse}
                  disabled={!inputText.trim()}
                  className="flex-1"
                >
                  Continue to Preview
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4 mt-4">
              {/* Parse errors */}
              {parseErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-2">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Parse warnings:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {parseErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parseErrors.length > 5 && (
                      <li>...and {parseErrors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Summary and actions */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} selected, {readyCount} ready
                  </span>
                  {needsDefinitionCount > 0 && (
                    <Badge variant="warning" className="text-xs">
                      {needsDefinitionCount} need definitions
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(false)}
                  >
                    Deselect All
                  </Button>
                  {needsDefinitionCount > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEnrichWithAI}
                      disabled={isEnrichingWithAI}
                    >
                      {isEnrichingWithAI ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Fetch Definitions
                    </Button>
                  )}
                </div>
              </div>

              {/* Word list */}
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {previewWords.map((word, index) => (
                  <div
                    key={index}
                    className={`p-3 border-b last:border-b-0 ${
                      word.isDuplicate ? 'bg-muted/50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={word.selected}
                        onChange={() => handleToggleWord(index)}
                        disabled={word.isDuplicate}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{word.word}</span>
                          {word.partOfSpeech && (
                            <Badge variant="outline" className="text-xs">
                              {word.partOfSpeech}
                            </Badge>
                          )}
                          {word.isDuplicate && (
                            <Badge variant="secondary" className="text-xs">
                              Duplicate
                            </Badge>
                          )}
                          {word.status === 'fetching' && (
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          )}
                          {word.status === 'error' && (
                            <XCircle className="w-3 h-3 text-destructive" />
                          )}
                          {word.status === 'ready' && word.definition && (
                            <CheckCircle2 className="w-3 h-3 text-success" />
                          )}
                        </div>
                        {word.definition ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {word.definition}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No definition - click &quot;Fetch Definitions&quot; to get from AI
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep('input')} className="flex-1">
                  Back
                </Button>
                <Button 
                  type="button" 
                  variant="hero" 
                  onClick={handleImport}
                  disabled={readyCount === 0}
                  className="flex-1"
                >
                  Import {readyCount} Words
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="py-12 space-y-6 text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Importing words...</p>
                <Progress value={importProgress} className="w-64 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(importProgress)}% complete
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="py-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold">Import Complete!</p>
                <div className="flex justify-center gap-4 text-sm">
                  <span className="text-success">
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    {importResults.success} imported
                  </span>
                  {importResults.failed > 0 && (
                    <span className="text-destructive">
                      <XCircle className="w-4 h-4 inline mr-1" />
                      {importResults.failed} failed
                    </span>
                  )}
                  {importResults.skipped > 0 && (
                    <span className="text-muted-foreground">
                      {importResults.skipped} skipped
                    </span>
                  )}
                </div>
              </div>
              <Button type="button" variant="hero" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
