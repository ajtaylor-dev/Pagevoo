import React from 'react'

interface UserWebsite {
  id: number
  name: string | null
  is_published: boolean
  published_at: string | null
  updated_at: string
  created_at: string
  template_id: number | null
}

interface LoadWebsiteModalProps {
  isOpen: boolean
  onClose: () => void
  loadingWebsites: boolean
  availableWebsites: UserWebsite[]
  onLoadWebsite: (website: UserWebsite) => void
  onDeleteWebsite: (websiteId: number) => void
}

export const LoadWebsiteModal: React.FC<LoadWebsiteModalProps> = ({
  isOpen,
  onClose,
  loadingWebsites,
  availableWebsites,
  onLoadWebsite,
  onDeleteWebsite
}) => {
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-200">Load Saved Website</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Select a saved website to load and continue editing
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingWebsites ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading your saved websites...</div>
            </div>
          ) : availableWebsites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-center">No saved websites found</p>
              <p className="text-gray-500 text-sm mt-2">Create a new website to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableWebsites.map((website) => (
                <div
                  key={website.id}
                  className="bg-gray-700 border border-gray-600 rounded-lg transition group relative"
                >
                  <div className="flex items-stretch">
                    {/* Main clickable area */}
                    <div
                      onClick={() => onLoadWebsite(website)}
                      className="flex-1 cursor-pointer hover:bg-gray-600/50 p-4 rounded-l-lg transition"
                    >
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-gray-200 group-hover:text-white">
                              {website.name || 'Untitled Website'}
                            </h3>
                            {website.is_published && (
                              <span className="px-2 py-0.5 bg-green-900/30 border border-green-700 text-green-400 rounded text-xs font-medium">
                                Published
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span>
                              Last modified: {formatDate(website.updated_at)}
                            </span>
                            {website.published_at && (
                              <span>
                                Published: {formatDate(website.published_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-200 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Are you sure you want to delete "${website.name || 'Untitled Website'}"? This action cannot be undone.`)) {
                          onDeleteWebsite(website.id)
                        }
                      }}
                      className="flex items-center justify-center px-3 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-r-lg transition border-l border-gray-600"
                      title="Delete website"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
