import React from 'react'

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  linkText: string
  setLinkText: (text: string) => void
  linkUrl: string
  setLinkUrl: (url: string) => void
  onApply: () => void
  onRemove: () => void
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  linkText,
  setLinkText,
  linkUrl,
  setLinkUrl,
  onApply,
  onRemove
}) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-4 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Insert/Edit Link</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Link Text */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Link Text</label>
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter link text"
          />
        </div>

        {/* Link URL */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Link URL</label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          {linkUrl && (
            <button
              onClick={onRemove}
              className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition"
            >
              Remove Link
            </button>
          )}
          <button
            onClick={onApply}
            disabled={!linkUrl}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
