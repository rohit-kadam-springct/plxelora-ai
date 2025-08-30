'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { Wand2, Zap, History, Palette, User } from 'lucide-react'
import Link from 'next/link'

export default function TopBar() {
  const { user } = useUser()

  return (
    <header className="glass-morphism border-b border-dark-700 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">Pixelora</span>
        </div>

        {/* Quick Access */}
        <div className="flex items-center gap-4">
          {/* Credits */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">47</span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-2">
            <Link href="/history" className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
              <History className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/styles" className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
              <Palette className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/personas" className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
              <User className="w-4 h-4 text-gray-400" />
            </Link>
          </div>

          <UserButton />
        </div>
      </div>
    </header>
  )
}
