'use client'

import { useState } from 'react'
import { X, Copy, Lightbulb, ArrowRight, Check } from 'lucide-react'
import { type EnhancedPrompt } from '@/lib/openai'

interface Props {
  enhancedPrompt: EnhancedPrompt | null
  isOpen: boolean
  onClose: () => void
  onUsePrompt: (prompt: string) => void
}

export default function EnhancedPromptModal({ enhancedPrompt, isOpen, onClose, onUsePrompt }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (enhancedPrompt) {
      await navigator.clipboard.writeText(enhancedPrompt.enhanced)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen || !enhancedPrompt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-800 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-yellow-400" />
            Enhanced Prompt
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Confidence & Credits */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
            {Math.round(enhancedPrompt.confidence * 100)}% confidence
          </span>
          <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
            ~{enhancedPrompt.estimatedCredits} credits
          </span>
        </div>

        {/* Enhanced Text */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">Enhanced Description:</h4>
            <button
              onClick={handleCopy}
              className="btn-base btn-ghost btn-sm flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600">
            <p className="text-gray-200 leading-relaxed text-sm">
              {enhancedPrompt.enhanced}
            </p>
          </div>
        </div>

        {/* Improvements */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white mb-3">Improvements made:</h4>
          <ul className="space-y-2">
            {enhancedPrompt.improvements.map((improvement, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <ArrowRight className="w-3 h-3 text-purple-400 mt-1 flex-shrink-0" />
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn-base btn-ghost btn-md"
          >
            Keep Original
          </button>
          <button
            onClick={() => {
              onUsePrompt(enhancedPrompt.enhanced)
              onClose()
            }}
            className="btn-base btn-primary btn-md"
          >
            Use Enhanced Prompt
          </button>
        </div>
      </div>
    </div>
  )
}
