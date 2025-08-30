'use client'

import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { TooltipRoot, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip'

const tips = [
  "Be specific: 'Modern gaming setup with RGB lighting' vs 'Gaming setup'",
  "Include emotions: 'Exciting', 'Professional', 'Epic' set the mood",
  "Mention colors: 'Blue and orange', 'Neon purple', 'Warm golden lighting'",
  "Add context: 'Tech review', 'Gaming stream', 'Tutorial', 'Podcast episode'",
  "Include composition: 'Close-up shot', 'Wide angle', 'Dramatic lighting'"
]

export default function TipsTooltip() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <TooltipRoot open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        <button
          className="p-2 rounded-full hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors"
          aria-label="Show prompt tips"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
        >
          <Lightbulb className="w-5 h-5 text-yellow-400 hover:text-yellow-300 transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        align="start"
        className="max-w-sm bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm border border-purple-500/30"
        onPointerDownOutside={() => setIsOpen(false)}
        onEscapeKeyDown={() => setIsOpen(false)}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-yellow-400 text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Tips for Better Prompts
          </h4>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs text-gray-200 flex items-start gap-2">
                <span className="text-purple-400 mt-1 flex-shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 border-t border-purple-500/20">
            <p className="text-xs text-purple-300">
              💡 The AI will enhance your prompt automatically
            </p>
          </div>
        </div>
      </TooltipContent>
    </TooltipRoot>
  )
}
