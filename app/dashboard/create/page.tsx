'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Wand2, Sparkles, Loader2, AlertCircle, Download, Edit3, RefreshCw } from 'lucide-react'
import PersonaSelector, { Persona } from '@/components/create/PersonaSelector'
import StyleSelector from '@/components/create/StyleSelector'
import EnhancedPromptModal from '@/components/create/EnhancedPromptModal'
import { IMAGE_DIMENSIONS, type AspectRatio } from '@/lib/image-dimensions'
import { EnhancedPrompt } from '@/lib/openai'

const MIN_PROMPT_CHARS = 15
const MAX_PROMPT_CHARS = 600


interface Style {
  id: string
  name: string
  description: string
  images: Array<{ imageUrl: string; order: number }>
}

interface GenerationResult {
  imageUrl: string
  prompt: string
  status: string
  generationId: string
  dimensions?: {
    width: number
    height: number
    aspectRatio: string
    name: string
  }
  persona?: { name: string }
  style?: { name: string }
}


export default function CreatePage() {
  const { user } = useUser()

  // State
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [styles, setStyles] = useState<Style[]>([])
  const [enhancedPrompt, setEnhancedPrompt] = useState<EnhancedPrompt | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEnhancedModal, setShowEnhancedModal] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  // Load data on mount
  useEffect(() => {
    loadPersonas()
    loadStyles()
  }, [])

  const loadPersonas = async () => {
    try {
      const response = await fetch('/api/personas')
      const data = await response.json()
      if (data.personas) {
        setPersonas(data.personas)
      }
    } catch (error) {
      console.error('Failed to load personas:', error)
    }
  }

  const loadStyles = async () => {
    try {
      const response = await fetch('/api/styles')
      const data = await response.json()
      if (data.styles) {
        setStyles(data.styles)
      }
    } catch (error) {
      console.error('Failed to load styles:', error)
    }
  }

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
          aspectRatio,
          personaId: selectedPersona?.id,
          styleId: selectedStyle?.id,
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

      const enhanced = await response.json()
      setEnhancedPrompt(enhanced)
      setShowEnhancedModal(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsEnhancing(false)
    }
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
          aspectRatio,
          personaId: selectedPersona?.id,
          styleId: selectedStyle?.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          setError(`Insufficient credits. You need ${result.creditsRequired || 2} credits but only have ${result.creditsAvailable || 0}.`)
        } else {
          setError(result.error || 'Failed to generate thumbnail')
        }
        return
      }

      setGenerationResult(result)

    } catch (err: any) {
      setError(err.message || 'Failed to generate thumbnail')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generationResult?.imageUrl) return

    try {
      // Background download
      const response = await fetch(generationResult.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `pixelora-thumbnail-${generationResult.generationId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(generationResult.imageUrl, '_blank')
    }
  }

  const handleEdit = () => {
    if (generationResult) {
      setPrompt(generationResult.prompt)
      setGenerationResult(null)
    }
  }

  const handleUseEnhancedPrompt = (enhancedText: string) => {
    setPrompt(enhancedText)
    setEnhancedPrompt(null)
    setShowEnhancedModal(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Create Your Thumbnail</h1>
        <p className="text-gray-400">Choose a persona, style, and describe your vision</p>
      </div>

      {/* Generation Result */}
      {generationResult && (
        <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-6">Your Generated Thumbnail</h2>

          {generationResult.status === 'completed' && generationResult.imageUrl ? (
            <div className="space-y-6">
              <div className="relative inline-block">
                <img
                  src={generationResult.imageUrl}
                  alt="Generated thumbnail"
                  className="max-w-full h-auto rounded-xl shadow-2xl border border-purple-500/20"
                  style={{ maxHeight: '400px' }}
                />

                {/* Dimension info overlay */}
                <div className="absolute top-2 right-2 bg-black/80 text-white px-3 py-1 rounded-full text-xs">
                  {generationResult.dimensions?.width}×{generationResult.dimensions?.height}
                </div>

                {/* Persona/Style badges */}
                <div className="absolute bottom-2 left-2 flex gap-2">
                  {generationResult.persona && (
                    <div className="bg-blue-500/80 text-white px-2 py-1 rounded-full text-xs">
                      👤 {generationResult.persona.name}
                    </div>
                  )}
                  {generationResult.style && (
                    <div className="bg-purple-500/80 text-white px-2 py-1 rounded-full text-xs">
                      🎨 {generationResult.style.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={handleDownload}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleEdit}
                  className="border border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setGenerationResult(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Create New
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">Generation failed</p>
              <button
                onClick={() => setGenerationResult(null)}
                className="border border-gray-600 hover:border-red-500 text-gray-300 hover:text-red-400 px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Creation Form */}
      {!generationResult && (
        <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 space-y-6">
          {/* Aspect Ratio Selection */}
          <div>
            <label className="block text-white font-medium mb-3">
              Dimensions & Format
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(IMAGE_DIMENSIONS) as AspectRatio[]).map((ratio) => {
                const dims = IMAGE_DIMENSIONS[ratio]
                return (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`p-4 rounded-lg border text-center transition-all ${aspectRatio === ratio
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-500/50'
                      }`}
                  >
                    <div className="font-medium text-sm">{dims.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{dims.width}×{dims.height}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Persona & Style Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <PersonaSelector
              personas={personas}
              selected={selectedPersona}
              onSelect={setSelectedPersona}
              onPersonaCreated={loadPersonas}
            />
            <StyleSelector
              styles={styles}
              selected={selectedStyle}
              onSelect={setSelectedStyle}
              onStyleCreated={loadStyles}
            />
          </div>

          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-white font-medium">
                Describe your thumbnail idea
              </label>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value)
                if (error) setError(null)
              }}
              placeholder="e.g., A gaming setup with RGB lights, mechanical keyboard, and multiple monitors showing a battle royale game..."
              className="w-full h-32 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none transition-colors"
              maxLength={MAX_PROMPT_CHARS}
            />

            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">
                {prompt.length}/{MAX_PROMPT_CHARS} characters
              </span>

              <button
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || prompt.trim().length < MIN_PROMPT_CHARS}
                className="border border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || prompt.trim().length < MIN_PROMPT_CHARS}
              className={`bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${!isGenerating && prompt.trim().length >= MIN_PROMPT_CHARS
                ? 'hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25'
                : ''
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
      )}

      {/* Enhanced Prompt Modal */}
      {showEnhancedModal && enhancedPrompt && (
        <EnhancedPromptModal
          enhancedPrompt={enhancedPrompt}
          isOpen={showEnhancedModal}
          onClose={() => setShowEnhancedModal(false)}
          onUsePrompt={handleUseEnhancedPrompt}
        />
      )}
    </div>
  )
}
