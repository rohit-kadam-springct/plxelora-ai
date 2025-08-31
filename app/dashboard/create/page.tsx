'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Wand2, Sparkles, Loader2, AlertCircle, Download, RefreshCw } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/Tooltip'
import TipsTooltip from '@/components/create/TipsTooltip'
import EnhancedPromptModal from '@/components/create/EnhancedPromptModal'
import { type EnhancedPrompt } from '@/lib/openai'
import { type GenerationResult } from '@/lib/gemini'

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
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')

  const handleEnhancePrompt = async () => {
    const trimmedPrompt = prompt.trim()

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
            style: 'modern',
            aspectRatio
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

    if (trimmedPrompt.length < MIN_PROMPT_CHARS) {
      setError(`Please enter at least ${MIN_PROMPT_CHARS} characters to generate a thumbnail`)
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationResult(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          aspectRatio
        }),
      })

      const result: GenerationResult = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          setError(`Insufficient credits. You need ${(result as any)?.creditsRequired || 2} credits but only have ${(result as any)?.creditsAvailable || 0}.`)
        } else {
          setError(result.error || 'Failed to generate thumbnail')
        }
        return
      }

      setGenerationResult(result)

      if (result.status === 'failed') {
        setError(result.error || 'Generation failed')
      }

    } catch (err: any) {
      setError(err.message || 'Failed to generate thumbnail')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (generationResult?.imageUrl) {
      const link = document.createElement('a')
      link.href = generationResult.imageUrl
      link.download = `thumbnail-${generationResult.generationId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleNewGeneration = () => {
    setGenerationResult(null)
    setError(null)
  }

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Thumbnail</h1>
          <p className="text-gray-400">Describe your vision and let AI create the perfect thumbnail</p>
        </div>

        {/* Generation Result */}
        {generationResult && (
          <div className="glass-morphism rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-6">Your Generated Thumbnail</h2>

            {generationResult.status === 'completed' && generationResult.imageUrl ? (
              <div className="space-y-6">
                <div className="relative inline-block">
                  <img
                    src={`${generationResult.imageUrl}?tr=w-800,h-450,q-80,f-auto`} // Auto-optimized!
                    alt="Generated thumbnail"
                    className="max-w-full h-auto rounded-xl shadow-2xl border border-purple-500/20"
                    style={{ maxHeight: '400px' }}
                    onLoad={() => console.log('Optimized image loaded')}
                    onError={(e) => console.error('Image load failed:', e)}
                  />
                  <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                    Auto-Optimized ✨
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleDownload}
                    className="btn-base btn-primary btn-md flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Image
                  </button>
                  <button
                    onClick={handleNewGeneration}
                    className="btn-base btn-outline btn-md flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-4">Generation failed</p>
                <button
                  onClick={handleNewGeneration}
                  className="btn-base btn-outline btn-sm"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Creation Form */}
        {!generationResult && (
          <div className="glass-morphism rounded-2xl p-8">
            <div className="space-y-6">
              {/* Aspect Ratio Selection */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Aspect Ratio
                </label>
                <div className="flex gap-3">
                  {[
                    { value: '16:9', label: 'YouTube (16:9)', desc: 'Landscape' },
                    { value: '9:16', label: 'Stories (9:16)', desc: 'Portrait' },
                    { value: '1:1', label: 'Square (1:1)', desc: 'Instagram' }
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value as any)}
                      className={`p-4 rounded-lg border text-center transition-all ${aspectRatio === ratio.value
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-dark-600 bg-dark-700/50 text-gray-300 hover:border-purple-500/50'
                        }`}
                    >
                      <div className="font-medium text-sm">{ratio.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-white font-medium">
                    Describe your thumbnail idea
                  </label>
                  <TipsTooltip />
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="e.g., A gaming setup with RGB lights, mechanical keyboard, and multiple monitors showing a battle royale game..."
                  className="w-full h-48 bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none transition-colors"
                  maxLength={MAX_PROMPT_CHARS}
                />

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

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 overflow-auto">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Generate Button */}
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
        )}
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
