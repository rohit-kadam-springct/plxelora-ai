'use client'

import { useState } from 'react'
import { Palette, Plus, Upload, X, AlertCircle, Image } from 'lucide-react'
import { uploadToImageKit } from '@/lib/imagekit'

interface Style {
  id: string
  name: string
  description: string
  images: Array<{ imageUrl: string; order: number }>
}

interface Props {
  styles: Style[]
  selected: Style | null
  onSelect: (style: Style | null) => void
  onStyleCreated: () => void
}

export default function StyleSelector({ styles, selected, onSelect, onStyleCreated }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newStyle, setNewStyle] = useState({
    name: '',
    description: '',
    imageUrls: [] as string[]
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (newStyle.imageUrls.length + files.length > 5) {
      setError('Maximum 5 images allowed per style')
      return
    }

    // Validate files
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

              // ✅ Call our API route instead of direct ImageKit
              const response = await fetch('/api/upload-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
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

              if (result.success && result.url) {
                resolve(result.url)
              } else {
                reject(new Error('Upload failed'))
              }
            } catch (error) {
              reject(error)
            }
          }
          reader.onerror = () => reject(new Error('File read error'))
          reader.readAsDataURL(file)
        })
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setNewStyle({
        ...newStyle,
        imageUrls: [...newStyle.imageUrls, ...uploadedUrls]
      })

    } catch (err: any) {
      setError(err.message || 'Failed to upload one or more images')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (indexToRemove: number) => {
    const updatedUrls = newStyle.imageUrls.filter((_, index) => index !== indexToRemove)
    setNewStyle({ ...newStyle, imageUrls: updatedUrls })
  }

  const handleCreate = async () => {
    if (!newStyle.name.trim()) {
      setError('Style name is required')
      return
    }

    if (newStyle.imageUrls.length === 0) {
      setError('Please upload at least one reference image')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStyle.name.trim(),
          description: newStyle.description.trim(),
          imageUrls: newStyle.imageUrls
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create style')
      }

      // Reset form
      setNewStyle({ name: '', description: '', imageUrls: [] })
      setShowCreateModal(false)
      setError(null)

      // Refresh styles list and select new style
      onStyleCreated()
      onSelect(data.style)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setNewStyle({ name: '', description: '', imageUrls: [] })
    setError(null)
  }

  return (
    <div className="space-y-3">
      <label className="block text-white font-medium flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Style
      </label>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {/* No Style Option */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full p-3 rounded-lg border text-left transition-all ${!selected
            ? 'border-purple-500 bg-purple-500/20 text-white'
            : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-500/50'
            }`}
        >
          <div className="font-medium text-sm">No Style</div>
          <div className="text-xs text-gray-400 mt-1">Generate without style reference</div>
        </button>

        {/* Existing Styles */}
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style)}
            className={`w-full p-3 rounded-lg border text-left transition-all ${selected?.id === style.id
              ? 'border-purple-500 bg-purple-500/20 text-white'
              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-500/50'
              }`}
          >
            <div className="flex items-start gap-3">
              {/* Preview images */}
              <div className="flex -space-x-1 flex-shrink-0">
                {style.images?.slice(0, 3).map((img, index) => (
                  <img
                    key={index}
                    src={img.imageUrl}
                    alt={`${style.name} ${index + 1}`}
                    className="w-8 h-8 object-cover rounded border border-gray-500"
                  />
                ))}
                {style.images && style.images.length > 3 && (
                  <div className="w-8 h-8 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                    <span className="text-xs text-gray-300">+{style.images.length - 3}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{style.name}</div>
                <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {style.description || 'No description'}
                </div>
                <div className="text-xs text-purple-400 mt-1">
                  {style.images?.length || 0} reference image{(style.images?.length || 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Create New Style Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full p-3 rounded-lg border border-dashed border-gray-600 bg-gray-700/30 text-gray-400 hover:border-purple-500/50 hover:text-white transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="text-sm">Create New Style</span>
          </div>
        </button>
      </div>

      {/* Create Style Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative bg-gray-800 border border-purple-500/30 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create New Style</h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-2">
                  Style Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newStyle.name}
                  onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
                  placeholder="e.g., Modern Gaming, Clean Tech"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Description</label>
                <textarea
                  value={newStyle.description}
                  onChange={(e) => setNewStyle({ ...newStyle, description: e.target.value })}
                  placeholder="Describe the visual style..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  rows={2}
                  maxLength={300}
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">
                  Reference Images <span className="text-red-400">*</span> ({newStyle.imageUrls.length}/5)
                </label>

                {/* Uploaded Images Grid */}
                {newStyle.imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {newStyle.imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-16 object-cover rounded-lg"
                        />
                        <button
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
                {newStyle.imageUrls.length < 5 && (
                  <label className="block w-full p-6 border border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-purple-500/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div className="flex flex-col items-center">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-2"></div>
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      )}
                      <p className="text-gray-400 text-sm">
                        {isUploading
                          ? 'Uploading...'
                          : newStyle.imageUrls.length === 0
                            ? 'Upload reference images (1-5 images)'
                            : `Add more images (${5 - newStyle.imageUrls.length} remaining)`
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
                    </div>
                  </label>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || isUploading || !newStyle.name.trim() || newStyle.imageUrls.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating Style...' : 'Create Style'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
