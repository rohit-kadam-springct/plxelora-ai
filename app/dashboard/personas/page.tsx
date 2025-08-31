'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { User, Plus, Edit2, Trash2, Upload, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'
import { generateSharpThumbnail } from '@/utils/sharp-imagekit'

interface Persona {
  id: string
  name: string
  description?: string
  imageUrl: string
  createdAt: string
  updatedAt: string
}

export default function PersonaPage() {
  const { user } = useUser()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)

  // Load personas on mount
  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/personas')
      const data = await response.json()

      if (response.ok) {
        setPersonas(data.personas || [])
      } else {
        throw new Error(data.error || 'Failed to load personas')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deletePersona = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return

    try {
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPersonas(personas.filter(p => p.id !== personaId))
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete persona')
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
            <User className="w-8 h-8 text-purple-400" />
            Your Personas
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your persona images for AI thumbnail generation
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Persona
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

      {/* Personas Grid */}
      {personas.length === 0 ? (
        <div className="text-center py-16">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No personas yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Upload persona images to use as references for AI-generated thumbnails.
            Perfect for maintaining consistent character representation.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            <Plus className="w-5 h-5" />
            Upload Your First Persona
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="bg-gray-800 border border-gray-600 rounded-xl p-6 hover:border-purple-500/50 transition-colors group"
            >
              {/* Persona Image */}
              <div className="relative mb-4">
                <img
                  src={generateSharpThumbnail(persona.imageUrl, {
                    width: 400,
                    height: 400,
                    quality: 100,
                    hasFace: true,
                    cropMode: 'face'
                  })}
                  alt={persona.name}
                  className="w-full aspect-square object-cover rounded-lg"
                />

                {/* Action buttons overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {/* <button
                      onClick={() => setEditingPersona(persona)}
                      className="p-2 bg-gray-900/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button> */}
                    {/* <button
                      onClick={() => deletePersona(persona.id)}
                      className="p-2 bg-gray-900/80 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button> */}
                  </div>
                </div>
              </div>

              {/* Persona Details */}
              <div className="space-y-2">
                <h3 className="font-semibold text-white truncate">{persona.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {persona.description || 'No description provided'}
                </p>
                <div className="text-xs text-gray-500">
                  Added {new Date(persona.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <PersonaModal
        persona={editingPersona}
        isOpen={showCreateModal || !!editingPersona}
        onClose={() => {
          setShowCreateModal(false)
          setEditingPersona(null)
        }}
        onSuccess={() => {
          setShowCreateModal(false)
          setEditingPersona(null)
          loadPersonas()
        }}
      />
    </div>
  )
}

// Persona Modal Component
interface PersonaModalProps {
  persona?: Persona | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function PersonaModal({ persona, isOpen, onClose, onSuccess }: PersonaModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: ''
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when persona changes
  useEffect(() => {
    if (persona) {
      setFormData({
        name: persona.name,
        description: persona.description || '',
        imageUrl: persona.imageUrl
      })
    } else {
      setFormData({ name: '', description: '', imageUrl: '' })
    }
  }, [persona])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string

          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data,
              filename: `persona-${Date.now()}.png`,
              folder: 'personas'
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Upload failed')
          }

          const result = await response.json()
          setFormData({ ...formData, imageUrl: result.url })
        } catch (error: any) {
          setError(error.message)
        } finally {
          setIsUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setError('Failed to read file')
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Persona name is required')
      return
    }

    if (!formData.imageUrl) {
      setError('Please upload a persona image')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const url = persona ? `/api/personas/${persona.id}` : '/api/personas'
      const method = persona ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${persona ? 'update' : 'create'} persona`)
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

      <div className="relative bg-gray-800 border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {persona ? 'Edit Persona' : 'Add New Persona'}
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
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., John Doe, Jane Smith"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              maxLength={100}
            />
          </div>

          {/* <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description for reference..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
              maxLength={300}
            />
          </div> */}

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Persona Image <span className="text-red-400">*</span>
            </label>

            {formData.imageUrl ? (
              <div className="relative">
                <img
                  src={generateSharpThumbnail(formData.imageUrl, {
                    width: 400,
                    height: 400,
                    quality: 100,
                    hasFace: true
                  })}
                  alt="Persona preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block w-full p-6 border border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-purple-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {isUploading ? 'Uploading...' : 'Upload persona image'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
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
              disabled={isSubmitting || isUploading || !formData.name.trim() || !formData.imageUrl}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (persona ? 'Updating...' : 'Creating...') : (persona ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
