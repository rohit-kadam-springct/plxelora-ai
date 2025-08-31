'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  Wand2,
  CreditCard,
  User,
  Palette,
  Clock,
  Plus,
  Download,
  Eye,
  X
} from 'lucide-react'
import {
  useDashboardStats,
  useRecentGenerations,
  useUserPersonas
} from '@/hooks/useDashboard'
import type { DashboardStat, Generation } from '@/types/dashboard'
import Link from 'next/link'
import { generateSharpThumbnail, ThumbnailPresets } from '@/utils/sharp-imagekit'

// Static data that shows immediately
const STATIC_DASHBOARD_DATA: {
  quickStats: DashboardStat[]
  recentActivity: Array<{ type: string; time: string; description: string }>
} = {
  quickStats: [
    { label: 'Credits', value: '---', icon: CreditCard, color: 'text-green-400' },
    { label: 'Generated', value: '---', icon: Wand2, color: 'text-purple-400' },
    { label: 'Personas', value: '---', icon: User, color: 'text-blue-400' },
    { label: 'Styles', value: '---', icon: Palette, color: 'text-pink-400' },
  ],
  recentActivity: [
    { type: 'placeholder', time: 'Loading...', description: 'Fetching your recent activity' }
  ]
}

// Component Props Types
interface StatCardProps {
  stat: DashboardStat
  realData?: DashboardStat
}

interface RecentActivityProps {
  realData?: Generation[]
}

function StatCard({ stat, realData }: StatCardProps) {
  const displayValue = realData?.value ?? stat.value
  const isLoaded = !!realData

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
          <p className={`text-2xl font-bold ${isLoaded ? stat.color : 'text-gray-500'} transition-colors`}>
            {displayValue}
          </p>
        </div>
        {stat.icon && (
          <stat.icon className={`w-8 h-8 ${isLoaded ? stat.color : 'text-gray-600'} transition-colors`} />
        )}
      </div>
    </div>
  )
}

interface RecentActivityProps {
  realData?: Generation[]
  onActivityClick: (generation: Generation) => void
}

function RecentActivity({ realData, onActivityClick }: RecentActivityProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </h3>
        <Link
          href="/dashboard/history"
          className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
        >
          View All
        </Link>
      </div>

      {!realData ? (
        <ActivitySkeleton />
      ) : realData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No recent activity yet</p>
          <Link
            href="/dashboard/create"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create Your First Thumbnail
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {realData.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              onClick={() => onActivityClick(activity)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onActivityClick(activity)
                }
              }}
              className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-600/50 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium group-hover:text-purple-200 transition-colors">
                  Generated "{activity.prompt.substring(0, 30)}..."
                </p>
                <p className="text-gray-400 text-xs">
                  {activity.dimensions?.width}×{activity.dimensions?.height} • {new Date(activity.createdAt).toLocaleDateString()}
                </p>
              </div>
              {activity.imageUrl && (
                <img
                  src={ThumbnailPresets.avatar(activity.imageUrl)}
                  alt="Thumbnail"
                  className="w-8 h-8 object-cover rounded group-hover:ring-2 group-hover:ring-purple-400 transition-all"
                />
              )}
              {/* Click indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Generation Modal Component
interface GenerationModalProps {
  generation: Generation
  onClose: () => void
  onDownload: (generation: Generation) => void
}

function GenerationModal({ generation, onClose, onDownload }: GenerationModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400'
      case 'PROCESSING': return 'text-yellow-400'
      case 'PENDING': return 'text-blue-400'
      case 'FAILED': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-gray-800 border border-purple-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">View Generation</h3>
          <div className="flex items-center gap-2">
            {generation.status === 'COMPLETED' && (
              <button
                onClick={() => onDownload(generation)}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="text-center">
            {generation.status === 'COMPLETED' && generation.imageUrl ? (
              <img
                src={generation.imageUrl}
                alt={generation.prompt}
                className="max-w-full max-h-96 object-contain rounded-lg mx-auto"
              />
            ) : (
              <div className="max-w-full max-h-96 bg-gray-700 rounded-lg mx-auto flex items-center justify-center py-24">
                <div className={`text-center ${getStatusColor(generation.status)}`}>
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">{generation.status}</p>
                  <p className="text-sm text-gray-400 mt-2">Generation in progress...</p>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">Prompt</h4>
              <p className="text-gray-300 text-sm bg-gray-700 p-3 rounded-lg">
                {generation.prompt}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Generation Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={getStatusColor(generation.status)}>
                      {generation.status}
                    </span>
                  </div>
                  {generation.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dimensions:</span>
                      <span className="text-white">
                        {generation.dimensions.width}×{generation.dimensions.height}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Credits Used:</span>
                    <span className="text-white">{generation.creditsUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Generated:</span>
                    <span className="text-white">
                      {new Date(generation.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* References */}
              {(generation.persona || generation.style) && (
                <div>
                  <h4 className="text-white font-medium mb-2">Used References</h4>
                  <div className="space-y-2">
                    {generation.persona && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-400">👤 Persona:</span>
                        <span className="text-white">{generation.persona.name}</span>
                      </div>
                    )}
                    {generation.style && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-purple-400">🎨 Style:</span>
                        <span className="text-white">{generation.style.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton
function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-gray-700 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-700 rounded"></div>
            <div className="h-3 w-48 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useUser()

  // Typed React Query hooks
  const { data: statsData } = useDashboardStats()
  const { data: generationsData } = useRecentGenerations()

  // Modal state
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)

  // Handle activity click - opens modal instead of navigating
  const handleActivityClick = (generation: Generation) => {
    setSelectedGeneration(generation)
  }

  const closeModal = () => {
    setSelectedGeneration(null)
  }

  const downloadImage = async (generation: Generation) => {
    if (!generation.imageUrl) return
    try {
      const response = await fetch(generation.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pixelora-${generation.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      window.open(generation.imageUrl, '_blank')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.firstName || 'Creator'}! 👋
          </h1>
          <p className="text-gray-400 mt-1">Let's create some amazing thumbnails today</p>
        </div>
        <Link
          href="/dashboard/create"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          <Plus className="w-5 h-5" />
          Create Thumbnail
        </Link>
      </div>

      {/* Quick Stats with progressive loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATIC_DASHBOARD_DATA.quickStats.map((stat, index) => (
          <StatCard
            key={stat.label}
            stat={stat}
            realData={statsData?.stats?.[index]}
          />
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity
            realData={generationsData?.generations}
            onActivityClick={handleActivityClick}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/dashboard/create"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <div className="flex items-center gap-3">
                <Wand2 className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Create Thumbnail</p>
                  <p className="text-xs text-purple-200">Generate your next viral thumbnail</p>
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard/personas"
              className="block w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Manage Personas</p>
                  <p className="text-xs text-gray-300">Create content personalities</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/styles"
              className="block w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Add Styles</p>
                  <p className="text-xs text-gray-300">Upload reference images</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Generation View Modal */}
      {selectedGeneration && (
        <GenerationModal
          generation={selectedGeneration}
          onClose={closeModal}
          onDownload={downloadImage}
        />
      )}

    </div>
  )
}

