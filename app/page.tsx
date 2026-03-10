"use client"

import * as React from "react"
import { BookOpen, GraduationCap, Plus, Play, Library, Upload, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dashboard } from "@/components/dashboard"
import { WordList } from "@/components/word-list"
import { LearningMode } from "@/components/learning-mode"
import { AddWordDialog } from "@/components/add-word-dialog"
import { EditWordDialog } from "@/components/edit-word-dialog"
import { BulkImportDialog } from "@/components/bulk-import-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import { SessionComplete } from "@/components/session-complete"
import { VocabWord } from "@/lib/types"
import {
  loadDataAsync,
  addWordToDb,
  addWordsToDb,
  deleteWordFromDb,
  updateWordInDb,
  updateStatsInDb,
  calculateUpdatedStreak,
  fetchStats,
} from "@/lib/storage"
import { getWordsForReview, getStats } from "@/lib/spaced-repetition"

type View = 'dashboard' | 'words' | 'learning' | 'complete'

export default function VocabApp() {
  const [view, setView] = React.useState<View>('dashboard')
  const [words, setWords] = React.useState<VocabWord[]>([])
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [showBulkImportDialog, setShowBulkImportDialog] = React.useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = React.useState(false)
  const [showEditDialog, setShowEditDialog] = React.useState(false)
  const [editingWord, setEditingWord] = React.useState<VocabWord | null>(null)
  const [currentStreak, setCurrentStreak] = React.useState(0)
  const [longestStreak, setLongestStreak] = React.useState(0)
  const [sessionResult, setSessionResult] = React.useState({ correct: 0, total: 0 })
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Load data from DB on mount
  React.useEffect(() => {
    loadDataAsync()
      .then(data => {
        setWords(data.words)
        setCurrentStreak(data.stats.currentStreak)
        setLongestStreak(data.stats.longestStreak)
        setIsLoaded(true)
      })
      .catch(err => {
        console.error('Failed to load data:', err)
        setIsLoaded(true)
      })
  }, [])

  const handleAddWord = async (word: VocabWord) => {
    try {
      await addWordToDb(word)
      setWords(prev => [...prev, word])
    } catch (err) {
      console.error('Failed to add word:', err)
    }
  }

  const handleImportWords = async (importedWords: VocabWord[]) => {
    try {
      await addWordsToDb(importedWords)
      setWords(prev => [...prev, ...importedWords])
    } catch (err) {
      console.error('Failed to import words:', err)
    }
  }

  const handleDeleteWord = async (id: string) => {
    try {
      await deleteWordFromDb(id)
      setWords(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      console.error('Failed to delete word:', err)
    }
  }

  const handleOpenEditWord = (word: VocabWord) => {
    setEditingWord(word)
    setShowEditDialog(true)
  }

  const handleUpdateWord = async (wordId: string, updates: Partial<VocabWord>) => {
    try {
      await updateWordInDb(wordId, updates)
      setWords(prev => prev.map(w =>
        w.id === wordId ? { ...w, ...updates } : w
      ))
    } catch (err) {
      console.error('Failed to update word:', err)
    }
  }

  const handleStartLearning = () => {
    setView('learning')
  }

  const handleSessionComplete = async (correct: number, total: number) => {
    setSessionResult({ correct, total })
    try {
      const stats = await fetchStats()
      const updatedStats = calculateUpdatedStreak(stats)
      await updateStatsInDb(updatedStats)
      setCurrentStreak(updatedStats.currentStreak)
      setLongestStreak(updatedStats.longestStreak)
    } catch (err) {
      console.error('Failed to update streak:', err)
    }
    setView('complete')
  }

  const handleRestartSession = () => {
    setView('learning')
  }

  const handleExitSession = () => {
    setView('dashboard')
  }

  const wordsForReview = getWordsForReview(words)
  const stats = getStats(words)

  if (!isLoaded) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0"
              onClick={() => setView('dashboard')}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl gradient-primary flex items-center justify-center shadow-md shrink-0">
                <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gradient truncate">VocabMaster</h1>
                <p className="text-xs text-muted-foreground hidden xs:block">AI-Powered Learning</p>
              </div>
            </div>

            {view !== 'learning' && view !== 'complete' && (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  onClick={() => setShowSettingsDialog(true)}
                  title="AI Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBulkImportDialog(true)}
                  className="hidden sm:flex"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(true)}
                  className="hidden sm:flex"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Word
                </Button>
                <Button
                  variant="hero"
                  onClick={handleStartLearning}
                  disabled={wordsForReview.length === 0}
                  size="sm"
                  className="h-8 sm:h-10 px-3 sm:px-4"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Start Learning</span>
                  <span className="xs:hidden">Learn</span>
                  {stats.due > 0 && (
                    <Badge variant="secondary" className="ml-1 sm:ml-2 bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 text-xs">
                      {stats.due}
                    </Badge>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation (for non-learning views) */}
      {view !== 'learning' && view !== 'complete' && (
        <nav className="border-b bg-card/30">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setView('dashboard')}
                className={`px-3 py-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  view === 'dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setView('words')}
                className={`px-3 py-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  view === 'words'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Library className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
                My Words
                <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs px-1.5 py-0.5">
                  {words.length}
                </Badge>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {view === 'dashboard' && (
          <Dashboard
            words={words}
            streak={currentStreak}
            longestStreak={longestStreak}
          />
        )}

        {view === 'words' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold truncate">My Vocabulary</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Manage your word collection</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkImportDialog(true)}
                  className="hidden sm:flex"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button 
                  onClick={() => setShowAddDialog(true)} 
                  className="sm:hidden h-9 w-9 p-0"
                  size="icon"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <WordList words={words} onDeleteWord={handleDeleteWord} onEditWord={handleOpenEditWord} />
          </div>
        )}

        {view === 'learning' && (
          <LearningMode
            words={wordsForReview}
            onUpdateWord={handleUpdateWord}
            onComplete={handleSessionComplete}
            onExit={() => setView('dashboard')}
          />
        )}

        {view === 'complete' && (
          <SessionComplete
            correct={sessionResult.correct}
            total={sessionResult.total}
            onRestart={handleRestartSession}
            onExit={handleExitSession}
          />
        )}
      </main>

      {/* Floating Add Button (Mobile) */}
      {view !== 'learning' && view !== 'complete' && (
        <button
          onClick={() => setShowAddDialog(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary shadow-lg hover:shadow-glow transition-all duration-300 hover:-translate-y-1 flex items-center justify-center sm:hidden z-30"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
        </button>
      )}

      {/* Edit Word Dialog */}
      <EditWordDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        word={editingWord}
        onSave={handleUpdateWord}
      />

      {/* Add Word Dialog */}
      <AddWordDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddWord={handleAddWord}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
        onImportWords={handleImportWords}
        existingWords={words}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
    </div>
  )
}
