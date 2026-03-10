"use client"

import * as React from "react"
import { Settings, Eye, EyeOff, Loader2, CheckCircle2, XCircle, RotateCcw, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getAIConfig, saveAIConfig, resetAIConfig, isAIConfigured, isGoogleTTSConfigured, type AIConfig } from "@/lib/config"
import { testConnection } from "@/lib/ai-service"
import { speakText } from "@/lib/tts-service"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [config, setConfig] = React.useState<AIConfig>(() => getAIConfig())
  const [showKey, setShowKey] = React.useState(false)
  const [showGoogleKey, setShowGoogleKey] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [isTestingTTS, setIsTestingTTS] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ success: boolean; error?: string } | null>(null)
  const [ttsTestResult, setTtsTestResult] = React.useState<{ success: boolean; error?: string } | null>(null)
  const [saved, setSaved] = React.useState(false)

  // Reload config when dialog opens
  React.useEffect(() => {
    if (open) {
      setConfig(getAIConfig())
      setTestResult(null)
      setSaved(false)
      setTtsTestResult(null)
    }
  }, [open])

  const handleSave = () => {
    saveAIConfig(config)
    setSaved(true)
    setTestResult(null)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTestConnection = async () => {
    if (!config.apiKey.trim()) return

    // Save first so the test uses current values
    saveAIConfig(config)
    setIsTesting(true)
    setTestResult(null)

    const result = await testConnection()
    setTestResult(result)
    setIsTesting(false)
  }

  const handleReset = () => {
    resetAIConfig()
    setConfig(getAIConfig())
    setTestResult(null)
    setTtsTestResult(null)
  }

  const handleTestTTS = async () => {
    // Save first so the test uses current values
    saveAIConfig(config)
    setIsTestingTTS(true)
    setTtsTestResult(null)
    try {
      await speakText('Hello! Text-to-speech is working correctly.')
      setTtsTestResult({ success: true })
    } catch (err: any) {
      setTtsTestResult({ success: false, error: err?.message || 'TTS test failed' })
    } finally {
      setIsTestingTTS(false)
    }
  }

  const handleChange = (field: keyof AIConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setSaved(false)
    setTestResult(null)
  }

  const maskedKey = config.apiKey
    ? `${config.apiKey.substring(0, 7)}${'*'.repeat(Math.max(0, config.apiKey.length - 11))}${config.apiKey.substring(config.apiKey.length - 4)}`
    : ''

  const maskedGoogleKey = config.googleApiKey
    ? `${config.googleApiKey.substring(0, 7)}${'*'.repeat(Math.max(0, config.googleApiKey.length - 11))}${config.googleApiKey.substring(config.googleApiKey.length - 4)}`
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            AI Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your OpenAI-compatible API for AI-powered features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {isAIConfigured() ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="secondary">Not configured</Badge>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={showKey ? config.apiKey : maskedKey}
                  onChange={(e) => {
                    if (showKey) handleChange('apiKey', e.target.value)
                    else {
                      setShowKey(true)
                      handleChange('apiKey', e.target.value)
                    }
                  }}
                  onFocus={() => {
                    if (!showKey) {
                      setShowKey(true)
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">API Base URL</label>
            <Input
              placeholder="https://api.openai.com/v1"
              value={config.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use any OpenAI-compatible endpoint (OpenAI, Azure, local LLM, etc.)
            </p>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Input
              placeholder="gpt-4o-mini"
              value={config.model}
              onChange={(e) => handleChange('model', e.target.value)}
            />
          </div>

          {/* Advanced settings row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Tokens</label>
              <Input
                type="number"
                min={64}
                max={4096}
                value={config.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 512)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature</label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={config.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || 0.7)}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-2">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Text-to-Speech (TTS)</span>
              {isGoogleTTSConfigured() ? (
                <Badge variant="success" className="text-xs">Google GenAI</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Browser built-in</Badge>
              )}
            </div>

            {/* Google API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Google API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showGoogleKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={showGoogleKey ? config.googleApiKey : maskedGoogleKey}
                    onChange={(e) => {
                      if (showGoogleKey) handleChange('googleApiKey', e.target.value)
                      else {
                        setShowGoogleKey(true)
                        handleChange('googleApiKey', e.target.value)
                      }
                    }}
                    onFocus={() => {
                      if (!showGoogleKey) setShowGoogleKey(true)
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowGoogleKey(!showGoogleKey)}
                >
                  {showGoogleKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Google AI Studio key for high-quality TTS. Leave blank to use the browser&apos;s built-in speech.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestTTS}
                disabled={isTestingTTS}
                className="gap-2"
              >
                {isTestingTTS
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : ttsTestResult?.success
                  ? <CheckCircle2 className="w-3 h-3 text-success" />
                  : ttsTestResult && !ttsTestResult.success
                  ? <XCircle className="w-3 h-3 text-destructive" />
                  : <Volume2 className="w-3 h-3" />}
                Test TTS
              </Button>
              {ttsTestResult && (
                <p className={`text-xs mt-1 ${ttsTestResult.success ? 'text-success' : 'text-destructive'}`}>
                  {ttsTestResult.success ? 'TTS is working!' : (ttsTestResult.error || 'TTS test failed')}
                </p>
              )}
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`p-3 rounded-lg border text-sm animate-slide-up ${
              testResult.success
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Connection successful
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    {testResult.error || 'Connection failed'}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={!config.apiKey.trim() || isTesting}
              className="gap-2"
            >
              {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Test Connection
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="hero"
              size="sm"
              onClick={handleSave}
              className="gap-2"
            >
              {saved ? <CheckCircle2 className="w-3 h-3" /> : null}
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">When AI is configured:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Word definitions are fetched via AI (richer results)</li>
              <li>Questions are dynamically generated by AI</li>
              <li>Answer evaluation uses AI for nuanced feedback</li>
              <li>Falls back to built-in mode if API call fails</li>
            </ul>
            <p className="font-medium mt-2">Text-to-Speech:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>With Google API key: high-quality neural TTS (Google GenAI)</li>
              <li>Without key: browser built-in speech synthesis (free)</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
