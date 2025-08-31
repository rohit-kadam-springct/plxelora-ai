'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Clock, Eye, Trash2, Download, X, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { generateSharpThumbnail } from '@/utils/sharp-imagekit'

interface Generation {
  id: string
  prompt: string
  imageUrl: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  creditsUsed: number
  dimensions?: {
    width: number
    height: number
    aspectRatio: string
    name: string
  }
  persona?: {
    id: string
    name: string
  }
  style?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export default function HistoryPage() {
  const { user } = useUser()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set()) // Track multiple deleting items
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadGenerations(currentPage)
  }, [currentPage])

  const loadGenerations = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/generations/history?page=${page}&limit=12`)
      const data = await response.json()

      if (response.ok) {
        setGenerations(data.generations || [])
      } else {
        throw new Error(data.error || 'Failed to load generation history')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteGeneration = async (generationId: string) => {
    if (!confirm('Are you sure you want to delete this generation? This action cannot be undone.')) return

    // Add to deleting set
    setDeletingIds(prev => new Set([...prev, generationId]))

    try {
      const response = await fetch(`/api/generations/history/${generationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from state after successful deletion
        setGenerations(prev => prev.filter(g => g.id !== generationId))
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete generation')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(generationId)
        return newSet
      })
    }
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
      console.error('Download failed:', error)
      window.open(generation.imageUrl, '_blank')
    }
  }

  const filteredGenerations = generations.filter(gen =>
    gen.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gen.persona?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gen.style?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400'
      case 'PROCESSING': return 'text-yellow-400'
      case 'PENDING': return 'text-blue-400'
      case 'FAILED': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-gray-800 border border-gray-600 rounded-xl overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-700"></div>
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  )

  // Deleting Card Component
  const DeletingCard = ({ generation }: { generation: Generation }) => (
    <div className="bg-gray-800 border border-red-500/50 rounded-xl overflow-hidden opacity-75">
      <div className="aspect-video bg-gray-700 flex items-center justify-center">
        <div className="text-center text-red-400">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">Deleting...</p>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-500 text-sm line-clamp-2">
          {generation.prompt}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Removing from history</span>
        </div>
      </div>
    </div>
  )

  if (loading && generations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-700 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-gray-800 border border-gray-600 rounded-lg p-4 animate-pulse">
              <div className="h-4 w-20 bg-gray-700 rounded mb-2"></div>
              <div className="h-8 w-12 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>

        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-400" />
            Generation History
          </h1>
          <p className="text-gray-400 mt-2">
            View and manage your AI-generated thumbnails
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search generations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Generations</div>
          <div className="text-2xl font-bold text-white">{generations.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Deleting</div>
          <div className="text-2xl font-bold text-red-400">{deletingIds.size}</div>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Completed</div>
          <div className="text-2xl font-bold text-green-400">
            {generations.filter(g => g.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Credits Used</div>
          <div className="text-2xl font-bold text-purple-400">
            {generations.reduce((sum, g) => sum + g.creditsUsed, 0)}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-200 text-xs mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Generations Grid */}
      {filteredGenerations.length === 0 && !loading ? (
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No matching generations' : 'No generations yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Start creating AI thumbnails to see your history here'
            }
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/create"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              Create Your First Thumbnail
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGenerations.map((generation) => {
            const isDeleting = deletingIds.has(generation.id)

            // Show deleting placeholder instead of the actual card
            if (isDeleting) {
              return <DeletingCard key={generation.id} generation={generation} />
            }

            return (
              <div
                key={generation.id}
                className="bg-gray-800 border border-gray-600 rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors group"
              >
                {/* Image */}
                <div className="relative aspect-video">
                  {generation.imageUrl && generation.status === 'COMPLETED' ? (
                    <img
                      src={generateSharpThumbnail(generation.imageUrl, {
                        width: 300,
                        height: 200,
                        quality: 85,
                        cropMode: 'auto'
                      })}
                      alt={generation.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <div className={`text-center ${getStatusColor(generation.status)}`}>
                        <Clock className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">{generation.status}</p>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-black/80 ${getStatusColor(generation.status)}`}>
                      {generation.status}
                    </span>
                  </div>

                  {/* Action buttons overlay */}

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      {generation.status === 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => setSelectedGeneration(generation)}
                            disabled={isDeleting}
                            className="p-2 bg-black/80 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadImage(generation)}
                            disabled={isDeleting}
                            className="p-2 bg-black/80 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteGeneration(generation.id)}
                        disabled={isDeleting}
                        className="p-2 bg-black/80 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-white text-sm line-clamp-2" title={generation.prompt}>
                    {generation.prompt}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {generation.dimensions && (
                      <span>{generation.dimensions.width}×{generation.dimensions.height}</span>
                    )}
                    <span>•</span>
                    <span>{generation.creditsUsed} credits</span>
                  </div>

                  {(generation.persona || generation.style) && (
                    <div className="flex gap-1 flex-wrap">
                      {generation.persona && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          👤 {generation.persona.name}
                        </span>
                      )}
                      {generation.style && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                          🎨 {generation.style.name}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    {new Date(generation.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Modal */}
      {selectedGeneration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedGeneration(null)} />

          <div className="relative bg-gray-800 border border-purple-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white">View Generation</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(selectedGeneration)}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedGeneration(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <img
                  src={selectedGeneration.imageUrl}
                  alt={selectedGeneration.prompt}
                  className="max-w-full max-h-96 object-contain rounded-lg mx-auto"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Prompt</h4>
                  <p className="text-gray-300 text-sm bg-gray-700 p-3 rounded-lg">
                    {selectedGeneration.prompt}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Generation Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={getStatusColor(selectedGeneration.status)}>
                          {selectedGeneration.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dimensions:</span>
                        <span className="text-white">
                          {selectedGeneration.dimensions?.width}×{selectedGeneration.dimensions?.height}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Credits Used:</span>
                        <span className="text-white">{selectedGeneration.creditsUsed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
