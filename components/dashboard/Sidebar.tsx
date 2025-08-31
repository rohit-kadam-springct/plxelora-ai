'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  Wand2,
  Home,
  History,
  Palette,
  User,
  CreditCard,
} from 'lucide-react'
import { useUserCredits } from '@/hooks/useUserCredits'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Create', href: '/dashboard/create', icon: Wand2 },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Personas', href: '/dashboard/personas', icon: User },
  { name: 'Styles', href: '/dashboard/styles', icon: Palette },
  { name: 'Credits', href: '/dashboard/credits', icon: CreditCard },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: creditsData, isLoading } = useUserCredits()

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-900/95 backdrop-blur-md border-r border-gray-700">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-700">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">Pixelora</span>
              <span className="text-sm text-purple-400 font-medium px-2 py-1 bg-purple-500/10 rounded-full">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Creator Plan</p>
              <p className="text-xs text-gray-400">
                {isLoading ? (
                  'Loading credits...'
                ) : (
                  `${creditsData?.credits || 0} credits left`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
