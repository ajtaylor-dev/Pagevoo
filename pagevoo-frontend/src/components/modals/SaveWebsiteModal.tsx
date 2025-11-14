import React from 'react'

interface SaveWebsiteModalProps {
  isOpen: boolean
  onClose: () => void
  websiteName: string
  setWebsiteName: (name: string) => void
  onSave: () => void
  loading?: boolean
}

export const SaveWebsiteModal: React.FC<SaveWebsiteModalProps> = ({
  isOpen,
  onClose,
  websiteName,
  setWebsiteName,
  onSave,
  loading = false
}) => {
  if (!isOpen) return null

  const handleSave = () => {
    if (websiteName.trim()) {
      onSave()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Save Website</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website Name *
            </label>
            <input
              type="text"
              value={websiteName}
              onChange={(e) => setWebsiteName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g., My Business Website, Portfolio Site"
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290] bg-gray-700 text-gray-200 placeholder:text-gray-400"
              autoFocus
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Give your website a memorable name
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                onClose()
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!websiteName.trim() || loading}
              className="flex-1 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Website'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
