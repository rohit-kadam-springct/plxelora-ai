'use client'

import { useUser } from '@clerk/nextjs'
import { Zap, Crown } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function UserProfile() {
  const { user } = useUser()

  if (!user) return null

  // Mock data - will be replaced with database
  const userPlan = {
    name: 'Creator',
    credits: 47,
    maxCredits: 50,
  }

  const creditPercentage = (userPlan.credits / userPlan.maxCredits) * 100

  return (
    <div className="glass-morphism rounded-xl p-6 max-w-sm">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={user.imageUrl}
          alt={user.fullName || 'User'}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <p className="font-semibold text-white">{user.fullName}</p>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-400">{userPlan.name} Plan</span>
          </div>
        </div>
      </div>

      {/* Credits Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Credits</span>
          </div>
          <span className="text-sm text-gray-300">
            {userPlan.credits}/{userPlan.maxCredits}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-dark-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${creditPercentage}%` }}
          />
        </div>
      </div>

      {/* Buy Credits Button */}
      <Button variant="outline" size="sm" className="w-full">
        <Zap className="w-4 h-4 mr-2" />
        Buy More Credits
      </Button>
    </div>
  )
}
