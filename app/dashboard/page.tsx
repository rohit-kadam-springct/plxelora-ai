'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Wand2, Zap, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface UserStats {
  credits: number
  totalGenerations: number
  styles: number
  personas: number
}

interface Generation {
  id: string
  prompt: string
  status: string
  createdAt: string
  imageUrl?: string
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [stats, setStats] = useState<UserStats>({
    credits: 0,
    totalGenerations: 0,
    styles: 0,
    personas: 0,
  })
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!isLoaded || !user) return

      try {
        // Fetch user profile and stats
        const profileResponse = await fetch('/api/user/profile')
        const profileData = await profileResponse.json()

        if (profileData.stats) {
          setStats(profileData.stats)
        }

        // Fetch recent generations
        const generationsResponse = await fetch('/api/generations/history?limit=5')
        const generationsData = await generationsResponse.json()

        if (generationsData.generations) {
          setRecentGenerations(generationsData.generations)
        }
      } catch (error) {
        console.error('Error fetching dashboard ', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isLoaded, user])

  if (!isLoaded || loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="glass-morphism rounded-xl p-6 animate-pulse">
          <div className="h-20 bg-dark-700/30 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-6">
      {/* Welcome Section */}
      <div className="glass-morphism rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img
                src={user?.imageUrl}
                alt={user?.fullName || ''}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white mb-1">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  {stats.credits} credits available
                </span>
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  {stats.totalGenerations} thumbnails created
                </span>
              </div>
            </div>
          </div>

          <Link href="/dashboard/create">
            <button className="btn-base btn-primary px-6 py-3 text-sm font-medium">
              <Wand2 className="w-4 h-4 mr-2" />
              Create Thumbnail
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Creations */}
      <div className="glass-morphism rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Recent Creations</h2>
          <Link href="/dashboard/history" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
            View All History →
          </Link>
        </div>

        {recentGenerations.length > 0 ? (
          <div className="space-y-3">
            {recentGenerations.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-dark-700/20 hover:bg-dark-700/40 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Wand2 className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">
                      {item.prompt.length > 50 ? `${item.prompt.substring(0, 50)}...` : item.prompt}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'COMPLETED'
                      ? 'bg-green-500/20 text-green-400'
                      : item.status === 'PENDING'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                    {item.status}
                  </span>
                  {item.imageUrl && (
                    <button className="btn-base btn-outline btn-sm text-xs px-3 py-1.5">
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-base font-medium text-white mb-2">No creations yet</h3>
            <p className="text-sm text-gray-400 mb-4">Start creating your first AI thumbnail</p>
            <Link href="/dashboard/create">
              <button className="btn-base btn-primary btn-sm">
                <Wand2 className="w-4 h-4 mr-2" />
                Create First Thumbnail
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
