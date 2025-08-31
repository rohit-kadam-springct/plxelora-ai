'use client'

import { useState } from 'react'
import { User, Plus, Upload, X, AlertCircle } from 'lucide-react'

export interface Persona {
  id: string
  name: string
  description?: string
  imageUrl: string // ✅ This is the persona image that goes to the model
}

interface Props {
  personas: Persona[]
  selected: Persona | null
  onSelect: (persona: Persona | null) => void
  onPersonaCreated: () => void
}

export default function PersonaSelector({ personas, selected, onSelect, onPersonaCreated }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPersona, setNewPersona] = useState({
    name: '',
    description: '',
    imageUrl: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

          // Upload to your image service
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
          setNewPersona({ ...newPersona, imageUrl: result.url })
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

  const handleCreate = async () => {
    if (!newPersona.name.trim()) {
      setError('Persona name is required')
      return
    }

    if (!newPersona.imageUrl) {
      setError('Please upload a persona image')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPersona.name.trim(),
          description: newPersona.description.trim(),
          imageUrl: newPersona.imageUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create persona')
      }

      // Reset and close
      setNewPersona({ name: '', description: '', imageUrl: '' })
      setShowCreateModal(false)
      setError(null)

      onPersonaCreated()
      onSelect(data.persona)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-white font-medium flex items-center gap-2">
        <User className="w-4 h-4" />
        Persona Image
      </label>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {/* No Persona Option */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full p-3 rounded-lg border text-left transition-all ${!selected
            ? 'border-purple-500 bg-purple-500/20 text-white'
            : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-500/50'
            }`}
        >
          <div className="font-medium text-sm">No Persona</div>
          <div className="text-xs text-gray-400 mt-1">Generate without persona image</div>
        </button>

        {/* Existing Personas */}
        {personas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => onSelect(persona)}
            className={`w-full p-3 rounded-lg border text-left transition-all ${selected?.id === persona.id
              ? 'border-purple-500 bg-purple-500/20 text-white'
              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-500/50'
              }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={persona.imageUrl}
                alt={persona.name}
                className="w-10 h-10 object-cover rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{persona.name}</div>
                <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {persona.description || 'Persona image'}
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Create New Persona */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full p-3 rounded-lg border border-dashed border-gray-600 bg-gray-700/30 text-gray-400 hover:border-purple-500/50 hover:text-white transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="text-sm">Upload New Persona</span>
          </div>
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />

          <div className="relative bg-gray-800 border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Upload Persona Image</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newPersona.name}
                  onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                  placeholder="e.g., John Doe, Jane Smith"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* <div>
                <label className="block text-white text-sm mb-2">Description</label>
                <textarea
                  value={newPersona.description}
                  onChange={(e) => setNewPersona({ ...newPersona, description: e.target.value })}
                  placeholder="Optional description for reference"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  rows={2}
                />
              </div> */}

              <div>
                <label className="block text-white text-sm mb-2">
                  Persona Image <span className="text-red-400">*</span>
                </label>

                {newPersona.imageUrl ? (
                  <div className="relative">
                    <img
                      src={newPersona.imageUrl}
                      alt="Persona preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setNewPersona({ ...newPersona, imageUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
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
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || isUploading || !newPersona.name.trim() || !newPersona.imageUrl}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Persona'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
