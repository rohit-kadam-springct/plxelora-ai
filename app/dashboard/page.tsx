import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Wand2, Zap, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/')
  }

  const userStats = {
    credits: 47,
    totalGenerations: 23,
  }

  const recentGenerations = [
    { id: 1, title: 'Gaming Thumbnail', createdAt: '2 hours ago', status: 'ready' },
    { id: 2, title: 'Tech Review Cover', createdAt: '1 day ago', status: 'ready' },
    { id: 3, title: 'Podcast Episode Art', createdAt: '3 days ago', status: 'ready' },
    { id: 4, title: 'YouTube Short Cover', createdAt: '5 days ago', status: 'ready' },
    { id: 5, title: 'Tutorial Thumbnail', createdAt: '1 week ago', status: 'ready' },
  ]

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
                  {userStats.credits} credits available
                </span>
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  {userStats.totalGenerations} thumbnails created
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
                    <Wand2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {item.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="btn-base btn-outline btn-sm text-xs px-3 py-1.5">
                    View
                  </button>
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
