import React from 'react'

interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: any[]
  meta_description?: string
  page_css?: string
  page_id?: string
}

interface Template {
  id: number
  name: string
  description: string
  business_type: string
  is_active: boolean
  pages: any[]
  preview_image: string | null
  exclusive_to: 'pro' | 'niche' | null
  technologies: string[]
  features: string[]
  custom_css?: string
  images?: Array<{
    id: string
    filename: string
    path: string
    size: number
    uploaded_at: string
  }>
}

interface SitemapModalProps {
  isOpen: boolean
  onClose: () => void
  template: Template | null
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage) => void
  onOpenAddPageModal: () => void
  onOpenEditPageModal: (page: TemplatePage) => void
  onDeletePage: (pageId: number) => void
}

export const SitemapModal: React.FC<SitemapModalProps> = ({
  isOpen,
  onClose,
  template,
  currentPage,
  setCurrentPage,
  onOpenAddPageModal,
  onOpenEditPageModal,
  onDeletePage
}) => {
  if (!isOpen) return null

  const handleViewPage = (page: TemplatePage) => {
    if (page.id !== currentPage?.id) {
      setCurrentPage(page)
    }
  }

  const handleEditPage = (page: TemplatePage) => {
    onOpenEditPageModal(page)
    onClose()
  }

  const handleDeletePage = (page: TemplatePage) => {
    if (confirm(`Are you sure you want to delete "${page.name}"?`)) {
      onDeletePage(page.id)
      if (page.id === currentPage?.id && template?.pages.length) {
        setCurrentPage(template.pages[0])
      }
    }
  }

  const handleAddPage = () => {
    onOpenAddPageModal()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Site Map</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your site's page structure</p>
            </div>
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
          <div className="space-y-2">
            {template?.pages.map((page, index) => (
              <div
                key={page.id}
                className={`group flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                  page.id === currentPage?.id
                    ? 'border-[#98b290] bg-[#f0f5ef]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Tree Lines */}
                <div className="flex-shrink-0 w-8 flex flex-col items-center">
                  {index === 0 && page.is_homepage ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>

                {/* Page Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{page.name}</h3>
                    {page.is_homepage && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full">
                        HOME
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">/{page.slug}</p>
                  <p className="text-xs text-gray-400 mt-1">{page.sections?.length || 0} sections</p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleViewPage(page)}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="View Page"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEditPage(page)}
                    className="p-1.5 hover:bg-blue-50 rounded transition"
                    title="Edit Page"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePage(page)}
                    disabled={template?.pages.length === 1}
                    className="p-1.5 hover:bg-red-50 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={template?.pages.length === 1 ? "Cannot delete the last page" : "Delete Page"}
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Page Button */}
          <button
            onClick={handleAddPage}
            className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#98b290] hover:bg-[#f0f5ef] transition flex items-center justify-center gap-2 text-gray-600 hover:text-[#98b290]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Add New Page</span>
          </button>
        </div>
      </div>
    </div>
  )
}
