import React from 'react'

interface Template {
  images?: Array<{
    id: string
    filename: string
    path: string
    size: number
    uploaded_at: string
  }>
}

interface InsertImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageInsertMode: 'url' | 'gallery'
  setImageInsertMode: (mode: 'url' | 'gallery') => void
  imageUrl: string
  setImageUrl: (url: string) => void
  selectedGalleryImage: string
  setSelectedGalleryImage: (url: string) => void
  template: Template | null
  onInsert: () => void
}

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  onClose,
  imageInsertMode,
  setImageInsertMode,
  imageUrl,
  setImageUrl,
  selectedGalleryImage,
  setSelectedGalleryImage,
  template,
  onInsert
}) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-4 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Insert Image</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setImageInsertMode('url')}
            className={`flex-1 px-4 py-2 rounded border transition ${
              imageInsertMode === 'url'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            URL
          </button>
          <button
            onClick={() => setImageInsertMode('gallery')}
            className={`flex-1 px-4 py-2 rounded border transition ${
              imageInsertMode === 'gallery'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Gallery
          </button>
        </div>

        {/* URL Mode */}
        {imageInsertMode === 'url' && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {imageUrl && (
              <div className="mt-2 p-2 border border-gray-200 rounded">
                <p className="text-xs text-gray-600 mb-1">Preview:</p>
                <img src={imageUrl} alt="Preview" className="max-w-full h-auto max-h-48 rounded" onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EInvalid%3C/text%3E%3C/svg%3E'
                }} />
              </div>
            )}
          </div>
        )}

        {/* Gallery Mode */}
        {imageInsertMode === 'gallery' && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Select an image from your gallery:</p>
            {template?.images && template.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {template.images.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => setSelectedGalleryImage(`http://localhost:8000/${image.path}`)}
                    className={`cursor-pointer border-2 rounded p-1 transition ${
                      selectedGalleryImage === `http://localhost:8000/${image.path}`
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={`http://localhost:8000/${image.path}`}
                      alt={image.filename}
                      className="w-full h-24 object-cover rounded"
                    />
                    <p className="text-xs text-gray-600 mt-1 truncate">{image.filename}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No images in gallery. Upload images first.
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onInsert}
            disabled={imageInsertMode === 'url' ? !imageUrl : !selectedGalleryImage}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  )
}
