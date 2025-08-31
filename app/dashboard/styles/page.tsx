'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Palette, Plus, Edit2, Trash2, Upload, AlertCircle, X, Eye } from 'lucide-react'
import Link from 'next/link'
import { generateSharpThumbnail, ThumbnailPresets } from '@/utils/sharp-imagekit'

interface StyleImage {
  id: string
  imageUrl: string
  order: number
}

interface Style {
  id: string
  name: string
  description?: string
  images: StyleImage[]
  extractedMetadata?: any
  usageCount: number
  createdAt: string
  updatedAt: string
}

export default function StylesPage() {
  const { user } = useUser()
  const [styles, setStyles] = useState<Style[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStyle, setEditingStyle] = useState<Style | null>(null)
  const [viewingStyle, setViewingStyle] = useState<Style | null>(null)

  // Load styles on mount
  useEffect(() => {
    loadStyles()
  }, [])

  const loadStyles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/styles')
      const data = await response.json()

      if (response.ok) {
        setStyles(data.styles || [])
      } else {
        throw new Error(data.error || 'Failed to load styles')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteStyle = async (styleId: string) => {
    if (!confirm('Are you sure you want to delete this style? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/styles/${styleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setStyles(styles.filter(s => s.id !== styleId))
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete style')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Palette className="w-8 h-8 text-purple-400" />
            Your Styles
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your style references for consistent AI thumbnail generation
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Style
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
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

      {/* Styles Grid */}
      {styles.length === 0 ? (
        <div className="text-center py-16">
          <Palette className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No styles yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Upload reference images to create visual styles for your AI-generated thumbnails.
            Mix and match different aesthetics and visual themes.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Style
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {styles.map((style) => (
            <div
              key={style.id}
              className="bg-gray-800 border border-gray-600 rounded-xl p-6 hover:border-purple-500/50 transition-colors group"
            >
              {/* Style Images Preview */}
              <div className="relative mb-4">
                {style.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 aspect-square">
                    {style.images.slice(0, 4).map((img, index) => (
                      <img
                        key={img.id}
                        src={generateSharpThumbnail(img.imageUrl, {
                          width: 400,
                          height: 400,
                          quality: 100,
                          cropMode: 'auto'
                        })}
                        alt={`${style.name} reference ${index + 1}`}
                        className={`object-cover rounded-lg ${style.images.length === 1 ? 'col-span-2 w-full h-full' :
                          style.images.length === 2 && index < 2 ? 'w-full h-full' :
                            style.images.length === 3 && index === 0 ? 'col-span-2 w-full h-full' :
                              'w-full h-full'
                          }`}
                      />
                    ))}
                    {style.images.length > 4 && (
                      <div className="bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 text-sm font-medium">
                        +{style.images.length - 4}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                    <Palette className="w-8 h-8 text-gray-500" />
                  </div>
                )}

                {/* Action buttons overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {/* <button
                      onClick={() => setViewingStyle(style)}
                      className="p-2 bg-gray-900/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingStyle(style)}
                      className="p-2 bg-gray-900/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteStyle(style.id)}
                      className="p-2 bg-gray-900/80 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button> */}
                  </div>
                </div>
              </div>

              {/* Style Details */}
              <div className="space-y-2">
                <h3 className="font-semibold text-white truncate">{style.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {style.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{style.images.length} image{style.images.length !== 1 ? 's' : ''}</span>
                  <span>Used {style.usageCount} time{style.usageCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Added {new Date(style.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <StyleModal
        style={editingStyle}
        isOpen={showCreateModal || !!editingStyle}
        onClose={() => {
          setShowCreateModal(false)
          setEditingStyle(null)
        }}
        onSuccess={() => {
          setShowCreateModal(false)
          setEditingStyle(null)
          loadStyles()
        }}
      />

      {/* View Modal */}
      <StyleViewModal
        style={viewingStyle}
        isOpen={!!viewingStyle}
        onClose={() => setViewingStyle(null)}
        onEdit={(style) => {
          setViewingStyle(null)
          setEditingStyle(style)
        }}
      />
    </div>
  )
}

// Style Modal Component
interface StyleModalProps {
  style?: Style | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function StyleModal({ style, isOpen, onClose, onSuccess }: StyleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrls: [] as string[]
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when style changes
  useEffect(() => {
    if (style) {
      setFormData({
        name: style.name,
        description: style.description || '',
        imageUrls: style.images.map(img => img.imageUrl)
      })
    } else {
      setFormData({ name: '', description: '', imageUrls: [] })
    }
  }, [style])

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (formData.imageUrls.length + files.length > 5) {
      setError('Maximum 5 images allowed per style')
      return
    }

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'))
    if (invalidFiles.length > 0) {
      setError('All files must be images')
      return
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError('Each image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const uploadPromises = files.map(async (file, index) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = async () => {
            try {
              const base64Data = reader.result as string

              const response = await fetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  base64Data,
                  filename: `style-ref-${Date.now()}-${index}.png`,
                  folder: 'styles'
                })
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Upload failed')
              }

              const result = await response.json()
              resolve(result.url)
            } catch (error: any) {
              reject(error)
            }
          }
          reader.readAsDataURL(file)
        })
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setFormData({
        ...formData,
        imageUrls: [...formData.imageUrls, ...uploadedUrls]
      })

    } catch (err: any) {
      setError(err.message || 'Failed to upload images')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (indexToRemove: number) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, index) => index !== indexToRemove)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Style name is required')
      return
    }

    if (formData.imageUrls.length === 0) {
      setError('Please upload at least one reference image')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const url = style ? `/api/styles/${style.id}` : '/api/styles'
      const method = style ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUrls: formData.imageUrls
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${style ? 'update' : 'create'} style`)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-800 border border-purple-500/30 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {style ? 'Edit Style' : 'Add New Style'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Style Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Modern Gaming, Clean Tech"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the visual style..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Reference Images <span className="text-red-400">*</span> ({formData.imageUrls.length}/5)
            </label>

            {/* Uploaded Images Grid */}
            {formData.imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={generateSharpThumbnail(url, {
                        width: 400,
                        height: 400,
                        quality: 100,
                        cropMode: 'auto'
                      })}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-16 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {formData.imageUrls.length < 5 && (
              <label className="block w-full p-6 border border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-purple-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {isUploading
                    ? 'Uploading...'
                    : formData.imageUrls.length === 0
                      ? 'Upload reference images (1-5 images)'
                      : `Add more images (${5 - formData.imageUrls.length} remaining)`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
              </label>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || !formData.name.trim() || formData.imageUrls.length === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (style ? 'Updating...' : 'Creating...') : (style ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Style View Modal Component
interface StyleViewModalProps {
  style: Style | null
  isOpen: boolean
  onClose: () => void
  onEdit: (style: Style) => void
}

function StyleViewModal({ style, isOpen, onClose, onEdit }: StyleViewModalProps) {
  if (!isOpen || !style) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-800 border border-purple-500/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{style.name}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(style)}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Description */}
          {style.description && (
            <div>
              <h4 className="text-white font-medium mb-2">Description</h4>
              <p className="text-gray-400">{style.description}</p>
            </div>
          )}

          {/* Reference Images */}
          <div>
            <h4 className="text-white font-medium mb-3">
              Reference Images ({style.images.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {style.images.map((img, index) => (
                <img
                  key={img.id}
                  src={generateSharpThumbnail(img.imageUrl, {
                    width: 400,
                    height: 400,
                    quality: 100,
                    cropMode: 'auto'
                  })}
                  alt={`${style.name} reference ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
            <div>
              <p className="text-gray-400 text-sm">Usage Count</p>
              <p className="text-white font-semibold">{style.usageCount}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Created</p>
              <p className="text-white font-semibold">
                {new Date(style.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
