import { useState, useRef } from 'react'

console.log('ImageGallery module loaded!')

interface ImageItem {
  id: string
  filename: string
  path: string
  size: number
  uploaded_at: string
}

interface ImageGalleryProps {
  isOpen: boolean
  onClose: () => void
  templateId: number
  images: ImageItem[]
  onUpload: (file: File) => Promise<void>
  onDelete: (imageId: string) => Promise<void>
  onRename: (imageId: string, newName: string) => Promise<void>
}

export function ImageGallery({
  isOpen,
  onClose,
  images,
  onUpload,
  onDelete,
  onRename
}: ImageGalleryProps) {
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  console.log('ImageGallery render - isOpen:', isOpen, 'images count:', images?.length)

  if (!isOpen) return null

  console.log('ImageGallery rendering modal...')

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i])
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

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      await onDelete(imageId)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete image')
    }
  }

  const startEdit = (image: ImageItem) => {
    setEditingId(image.id)
    setEditName(image.filename)
  }

  const saveEdit = async (imageId: string) => {
    if (!editName.trim()) {
      alert('Filename cannot be empty')
      return
    }

    try {
      await onRename(imageId, editName.trim())
      setEditingId(null)
    } catch (error) {
      console.error('Rename error:', error)
      alert('Failed to rename image')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[80vh] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Image Gallery</h2>
          <div className="flex items-center gap-3">
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
              className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
            >
              {uploading ? 'Uploading...' : 'Upload Images'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium mb-2">No images uploaded yet</p>
              <p className="text-sm">Click "Upload Images" to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition group">
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={`http://localhost:8000/${image.path}`}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-3 bg-white">
                    {editingId === image.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(image.id)}
                            className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate flex-1" title={image.filename}>
                            {image.filename}
                          </p>
                          <button
                            onClick={() => startEdit(image)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded transition"
                            title="Rename"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {images.length} {images.length === 1 ? 'image' : 'images'} • Supported formats: JPG, PNG, GIF, SVG, WebP
          </p>
        </div>
      </div>
    </div>
  )
}
