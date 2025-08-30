'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Wand2, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/Tooltip'
import TipsTooltip from '@/components/create/TipsTooltip'
import EnhancedPromptModal from '@/components/create/EnhancedPromptModal'
import { type EnhancedPrompt } from '@/lib/openai'

const MIN_PROMPT_CHARS = 15
const MAX_PROMPT_CHARS = 600

export default function CreatePage() {
  const { user } = useUser()
  const [prompt, setPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState<EnhancedPrompt | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEnhancedModal, setShowEnhancedModal] = useState(false)

  const handleEnhancePrompt = async () => {
    const trimmedPrompt = prompt.trim()

    // Validate on button press
    if (trimmedPrompt.length < MIN_PROMPT_CHARS) {
      setError(`Please enter at least ${MIN_PROMPT_CHARS} characters to enhance your prompt`)
      return
    }

    setIsEnhancing(true)
    setError(null)

    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          context: {
            type: 'thumbnail',
            style: 'modern'
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enhance prompt')
      }

      const enhanced: EnhancedPrompt = await response.json()
      setEnhancedPrompt(enhanced)
      setShowEnhancedModal(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleUseEnhanced = (enhancedText: string) => {
    setPrompt(enhancedText)
    setEnhancedPrompt(null)
  }

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim()

    // Validate on button press
    if (trimmedPrompt.length < MIN_PROMPT_CHARS) {
      setError(`Please enter at least ${MIN_PROMPT_CHARS} characters to generate a thumbnail`)
      return
    }

    setIsGenerating(true)
    setError(null)

    // TODO: Implement generation logic
    setTimeout(() => {
      setIsGenerating(false)
    }, 3000)
  }

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Thumbnail</h1>
          <p className="text-gray-400">Describe your vision and let AI enhance it into the perfect prompt</p>
        </div>

        {/* Main Creation Form */}
        <div className="glass-morphism rounded-2xl p-8">
          <div className="space-y-6">
            {/* Prompt Input */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-white font-medium">
                  Describe your thumbnail idea
                </label>
                <TipsTooltip />
              </div>

              {/* Increased textarea height to h-48 (192px) */}
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value)
                  // Clear error when user starts typing
                  if (error) setError(null)
                }}
                placeholder="e.g., A gaming setup with RGB lights, mechanical keyboard, and multiple monitors showing a battle royale game..."
                className="w-full h-48 bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none transition-colors"
                maxLength={MAX_PROMPT_CHARS}
              />

              {/* Simple character count - no validation hints */}
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {prompt.length}/{MAX_PROMPT_CHARS} characters
                </span>

                <button
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing}
                  className="btn-base btn-outline btn-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Enhance with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Display - Only shown on button press */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Generate Button - Always enabled */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`btn-base btn-primary btn-lg px-8 py-4 flex items-center gap-3 transition-all ${isGenerating
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-lg font-semibold">Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    <span className="text-lg font-semibold">Generate Thumbnail</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Enhanced Prompt Modal */}
      <EnhancedPromptModal
        enhancedPrompt={enhancedPrompt}
        isOpen={showEnhancedModal}
        onClose={() => setShowEnhancedModal(false)}
        onUsePrompt={handleUseEnhanced}
      />
    </TooltipProvider>
  )
}
