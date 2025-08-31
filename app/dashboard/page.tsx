'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  Wand2,
  CreditCard,
  User,
  Palette,
  Clock,
  Plus
} from 'lucide-react'
import {
  useDashboardStats,
  useRecentGenerations,
  useUserPersonas
} from '@/hooks/useDashboard'
import type { DashboardStat, Generation } from '@/types/dashboard'
import Link from 'next/link'

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

function RecentActivity({ realData }: RecentActivityProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Recent Activity
      </h3>

      {!realData ? (
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
      ) : realData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No recent activity yet</p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
            Create Your First Thumbnail
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {realData.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  Generated "{activity.prompt.substring(0, 30)}..."
                </p>
                <p className="text-gray-400 text-xs">
                  {activity.dimensions?.width}×{activity.dimensions?.height} • {new Date(activity.createdAt).toLocaleDateString()}
                </p>
              </div>
              {activity.imageUrl && (
                <img
                  src={activity.imageUrl}
                  alt="Thumbnail"
                  className="w-8 h-8 object-cover rounded"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useUser()

  // Typed React Query hooks
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: generationsData, isLoading: generationsLoading } = useRecentGenerations()
  const { data: personasData } = useUserPersonas()

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
          <RecentActivity realData={generationsData?.generations} />
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
    </div>
  )
}
