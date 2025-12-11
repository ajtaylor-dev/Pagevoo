import { useState, useRef, useEffect } from 'react'
import { getAssetUrl } from '../config/constants'
import {
  FolderPlus, Folder, FolderOpen, Image as ImageIcon, Trash2, Pencil,
  Upload, X, ChevronLeft, ArrowLeft, Plus, MoreVertical, Check,
  GripVertical, Move
} from 'lucide-react'

// Types
export interface ImageItem {
  id: string
  filename: string
  path: string
  thumbnail_path?: string
  size: number
  uploaded_at: string
  album_id: string | null
  title?: string
  description?: string
  alt_text?: string
  order: number
}

export interface Album {
  id: string
  name: string
  description?: string
  cover_image_id?: string
  image_count: number
  created_at: string
  updated_at: string
  order: number
}

interface ImageGalleryProps {
  isOpen: boolean
  onClose: () => void
  templateId?: number
  images?: ImageItem[]
  albums?: Album[]
  onUpload: (file: File, albumId: string | null) => Promise<void>
  onDelete: (imageId: string) => Promise<void>
  onRename: (imageId: string, newName: string) => Promise<void>
  onUpdateImage?: (imageId: string, updates: Partial<ImageItem>) => Promise<void>
  onMoveImage?: (imageId: string, albumId: string | null) => Promise<void>
  onCreateAlbum?: (name: string, description?: string) => Promise<Album>
  onUpdateAlbum?: (albumId: string, updates: Partial<Album>) => Promise<void>
  onDeleteAlbum?: (albumId: string) => Promise<void>
  onSetAlbumCover?: (albumId: string, imageId: string) => Promise<void>
}

export function ImageGallery({
  isOpen,
  onClose,
  images = [],
  albums = [],
  onUpload,
  onDelete,
  onRename,
  onUpdateImage,
  onMoveImage,
  onCreateAlbum,
  onUpdateAlbum,
  onDeleteAlbum,
  onSetAlbumCover
}: ImageGalleryProps) {
  // State
  const [uploading, setUploading] = useState(false)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [imageDimensions, setImageDimensions] = useState<{[key: string]: {width: number, height: number}}>({})
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(null)
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [imageMenuOpen, setImageMenuOpen] = useState<string | null>(null)
  const [showImageDetails, setShowImageDetails] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentAlbumId(null)
      setSelectedImages(new Set())
      setSearchQuery('')
      setShowCreateAlbum(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Helpers
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getCurrentAlbum = () => albums.find(a => a.id === currentAlbumId)

  // Get images for current view (all images or album images)
  const getDisplayImages = () => {
    let filtered = currentAlbumId === null
      ? images.filter(img => img.album_id === null) // Root level (uncategorized)
      : images.filter(img => img.album_id === currentAlbumId)

    if (searchQuery) {
      filtered = filtered.filter(img =>
        img.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered.sort((a, b) => a.order - b.order)
  }

  const filteredImages = getDisplayImages()
  const uncategorizedCount = images.filter(img => img.album_id === null).length

  // Load image dimensions
  const loadImageDimensions = (imageId: string, imagePath: string) => {
    if (imageDimensions[imageId]) return
    const img = new Image()
    img.onload = () => {
      setImageDimensions(prev => ({
        ...prev,
        [imageId]: { width: img.width, height: img.height }
      }))
    }
    img.src = getAssetUrl(imagePath)
  }

  // Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i], currentAlbumId)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    try {
      await onDelete(imageId)
      setSelectedImages(prev => {
        const next = new Set(prev)
        next.delete(imageId)
        return next
      })
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete image')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)) return

    try {
      for (const imageId of selectedImages) {
        await onDelete(imageId)
      }
      setSelectedImages(new Set())
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete some images')
    }
  }

  const handleMoveSelected = async (targetAlbumId: string | null) => {
    if (selectedImages.size === 0 || !onMoveImage) return

    try {
      for (const imageId of selectedImages) {
        await onMoveImage(imageId, targetAlbumId)
      }
      setSelectedImages(new Set())
      setShowMoveModal(false)
    } catch (error) {
      console.error('Move error:', error)
      alert('Failed to move some images')
    }
  }

  const startEditImage = (image: ImageItem) => {
    setEditingImageId(image.id)
    setEditName(image.title || image.filename)
    setEditDescription(image.description || '')
  }

  const saveImageEdit = async (imageId: string) => {
    if (!editName.trim()) {
      alert('Name cannot be empty')
      return
    }
    try {
      if (onUpdateImage) {
        await onUpdateImage(imageId, { title: editName.trim(), description: editDescription.trim() })
      } else {
        await onRename(imageId, editName.trim())
      }
      setEditingImageId(null)
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update image')
    }
  }

  const startEditAlbum = (album: Album) => {
    setEditingAlbumId(album.id)
    setEditName(album.name)
    setEditDescription(album.description || '')
  }

  const saveAlbumEdit = async (albumId: string) => {
    if (!editName.trim()) {
      alert('Album name cannot be empty')
      return
    }
    if (!onUpdateAlbum) return
    try {
      await onUpdateAlbum(albumId, { name: editName.trim(), description: editDescription.trim() })
      setEditingAlbumId(null)
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update album')
    }
  }

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      alert('Album name cannot be empty')
      return
    }
    if (!onCreateAlbum) return
    setCreatingAlbum(true)
    try {
      await onCreateAlbum(newAlbumName.trim(), newAlbumDescription.trim())
      setNewAlbumName('')
      setNewAlbumDescription('')
      setShowCreateAlbum(false)
    } catch (error) {
      console.error('Create album error:', error)
      alert('Failed to create album')
    } finally {
      setCreatingAlbum(false)
    }
  }

  const handleDeleteAlbum = async (albumId: string) => {
    const album = albums.find(a => a.id === albumId)
    if (!album) return
    if (!onDeleteAlbum) return

    const hasImages = images.some(img => img.album_id === albumId)
    const message = hasImages
      ? `Are you sure you want to delete "${album.name}"? Images in this album will be moved to Uncategorized.`
      : `Are you sure you want to delete "${album.name}"?`

    if (!confirm(message)) return

    try {
      await onDeleteAlbum(albumId)
      if (currentAlbumId === albumId) {
        setCurrentAlbumId(null)
      }
    } catch (error) {
      console.error('Delete album error:', error)
      alert('Failed to delete album')
    }
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev)
      if (next.has(imageId)) {
        next.delete(imageId)
      } else {
        next.add(imageId)
      }
      return next
    })
  }

  const selectAllImages = () => {
    const allIds = filteredImages.map(img => img.id)
    setSelectedImages(new Set(allIds))
  }

  const clearSelection = () => {
    setSelectedImages(new Set())
  }

  // Get album cover image
  const getAlbumCover = (album: Album) => {
    if (album.cover_image_id) {
      const coverImg = images.find(img => img.id === album.cover_image_id)
      if (coverImg) return getAssetUrl(coverImg.thumbnail_path || coverImg.path)
    }
    // Fall back to first image in album
    const firstImg = images.find(img => img.album_id === album.id)
    if (firstImg) return getAssetUrl(firstImg.thumbnail_path || firstImg.path)
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-gray-800 rounded-lg shadow-xl w-[90vw] h-[85vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentAlbumId !== null && (
                <button
                  onClick={() => setCurrentAlbumId(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition"
                  title="Back to all albums"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-300" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-200">
                  {currentAlbumId === null ? 'Image Gallery' : getCurrentAlbum()?.name || 'Album'}
                </h2>
                <p className="text-sm text-gray-400">
                  {currentAlbumId === null
                    ? `${albums.length} albums • ${uncategorizedCount} uncategorized images`
                    : `${filteredImages.length} images`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedImages.size > 0 && (
                <>
                  <span className="text-sm text-gray-400">{selectedImages.size} selected</span>
                  {onMoveImage && (
                    <button
                      onClick={() => setShowMoveModal(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition flex items-center gap-1"
                    >
                      <Move className="w-4 h-4" /> Move
                    </button>
                  )}
                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm font-medium transition"
                  >
                    Clear
                  </button>
                  <div className="w-px h-6 bg-gray-600 mx-2" />
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>

              {currentAlbumId === null && (
                <button
                  onClick={() => setShowCreateAlbum(true)}
                  className="px-4 py-2 bg-[#98b290] text-white rounded hover:bg-[#7a9072] text-sm font-medium transition flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" /> New Album
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {(filteredImages.length > 0 || searchQuery) && (
            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search images..."
                  className="w-full px-4 py-2 pl-10 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-gray-700 text-gray-200 placeholder-gray-400"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {filteredImages.length > 0 && (
                <button
                  onClick={selectedImages.size === filteredImages.length ? clearSelection : selectAllImages}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition"
                >
                  {selectedImages.size === filteredImages.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Albums Grid (when at root level) */}
          {currentAlbumId === null && albums.length > 0 && !searchQuery && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Albums</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albums.map(album => {
                  const coverUrl = getAlbumCover(album)
                  const isEditing = editingAlbumId === album.id

                  return (
                    <div
                      key={album.id}
                      className="group relative bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#98b290] transition cursor-pointer"
                    >
                      {isEditing ? (
                        <div className="p-4 space-y-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Album name"
                            className="w-full px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800 text-gray-200"
                            autoFocus
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800 text-gray-200 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveAlbumEdit(album.id)}
                              className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingAlbumId(null)}
                              className="flex-1 px-2 py-1 bg-gray-600 text-gray-200 rounded text-xs hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className="aspect-square bg-gray-600 flex items-center justify-center"
                            onClick={() => setCurrentAlbumId(album.id)}
                          >
                            {coverUrl ? (
                              <img src={coverUrl} alt={album.name} className="w-full h-full object-cover" />
                            ) : (
                              <Folder className="w-16 h-16 text-gray-500" />
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium text-gray-200 truncate">{album.name}</p>
                            <p className="text-xs text-gray-400">{album.image_count} images</p>
                          </div>

                          {/* Album Actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditAlbum(album); }}
                              className="p-1.5 bg-gray-800/80 rounded hover:bg-gray-700 transition"
                              title="Edit album"
                            >
                              <Pencil className="w-4 h-4 text-gray-300" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                              className="p-1.5 bg-gray-800/80 rounded hover:bg-red-600 transition"
                              title="Delete album"
                            >
                              <Trash2 className="w-4 h-4 text-gray-300" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Uncategorized Images Header (when at root level) */}
          {currentAlbumId === null && !searchQuery && (
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
              {albums.length > 0 ? 'Uncategorized Images' : 'All Images'}
            </h3>
          )}

          {/* Images Grid */}
          {filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {searchQuery ? 'No images found' : 'No images yet'}
              </p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Click "Upload" to add images'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredImages.map((image) => {
                loadImageDimensions(image.id, image.path)
                const dims = imageDimensions[image.id]
                const isSelected = selectedImages.has(image.id)
                const isEditing = editingImageId === image.id

                return (
                  <div
                    key={image.id}
                    className={`relative bg-gray-700 rounded-lg overflow-hidden group transition ${
                      isSelected ? 'ring-2 ring-amber-500' : 'hover:ring-2 hover:ring-gray-500'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <button
                      onClick={() => toggleImageSelection(image.id)}
                      className={`absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500'
                          : 'bg-gray-800/60 border-gray-500 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {/* Image */}
                    <div className="aspect-square bg-gray-600">
                      <img
                        src={getAssetUrl(image.thumbnail_path || image.path)}
                        alt={image.title || image.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition pointer-events-none" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                      <button
                        onClick={() => setShowImageDetails(image.id)}
                        className="p-1.5 bg-gray-800/80 rounded hover:bg-gray-700 transition"
                        title="Edit details"
                      >
                        <Pencil className="w-4 h-4 text-gray-300" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="p-1.5 bg-gray-800/80 rounded hover:bg-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gray-300" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-2 bg-gray-700">
                      <p className="text-xs font-medium text-gray-200 truncate" title={image.title || image.filename}>
                        {image.title || image.filename}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatFileSize(image.size)}
                        {dims && ` • ${dims.width}×${dims.height}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">
            {images.length} total images • {albums.length} albums • Supported: JPG, PNG, GIF, SVG, WebP
          </p>
        </div>
      </div>

      {/* Create Album Modal */}
      {showCreateAlbum && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Create New Album</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Album Name *</label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="e.g., Portfolio, Products, Team"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description (optional)</label>
                <textarea
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  placeholder="Brief description of this album"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#98b290] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowCreateAlbum(false); setNewAlbumName(''); setNewAlbumDescription(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlbum}
                disabled={creatingAlbum || !newAlbumName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#98b290] rounded-lg hover:bg-[#7a9072] disabled:opacity-50"
              >
                {creatingAlbum ? 'Creating...' : 'Create Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Images Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
              Move {selectedImages.size} image(s) to...
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleMoveSelected(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                  currentAlbumId === null ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                disabled={currentAlbumId === null}
              >
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-200">Uncategorized</span>
              </button>
              {albums.map(album => (
                <button
                  key={album.id}
                  onClick={() => handleMoveSelected(album.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    currentAlbumId === album.id ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  disabled={currentAlbumId === album.id}
                >
                  <Folder className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-200">{album.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{album.image_count} images</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Details Modal */}
      {showImageDetails && (
        <ImageDetailsModal
          image={images.find(img => img.id === showImageDetails)!}
          onClose={() => setShowImageDetails(null)}
          onSave={async (updates) => {
            if (onUpdateImage) {
              await onUpdateImage(showImageDetails, updates)
            }
            setShowImageDetails(null)
          }}
          onSetAsCover={currentAlbumId && onSetAlbumCover ? async () => {
            await onSetAlbumCover(currentAlbumId, showImageDetails)
            setShowImageDetails(null)
          } : undefined}
        />
      )}
    </div>
  )
}

// Image Details Modal Component
function ImageDetailsModal({
  image,
  onClose,
  onSave,
  onSetAsCover
}: {
  image: ImageItem
  onClose: () => void
  onSave: (updates: Partial<ImageItem>) => Promise<void>
  onSetAsCover?: () => Promise<void>
}) {
  const [title, setTitle] = useState(image.title || image.filename)
  const [description, setDescription] = useState(image.description || '')
  const [altText, setAltText] = useState(image.alt_text || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ title, description, alt_text: altText })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex overflow-hidden">
        {/* Image Preview */}
        <div className="w-1/2 bg-gray-900 flex items-center justify-center p-4">
          <img
            src={getAssetUrl(image.path)}
            alt={image.title || image.filename}
            className="max-w-full max-h-80 object-contain rounded"
          />
        </div>

        {/* Details Form */}
        <div className="w-1/2 p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Image Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#98b290] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Alt Text (for accessibility)</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image for screen readers"
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Filename: {image.filename}</p>
              <p>Uploaded: {new Date(image.uploaded_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            {onSetAsCover && (
              <button
                onClick={onSetAsCover}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Set as Album Cover
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#98b290] rounded-lg hover:bg-[#7a9072] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
