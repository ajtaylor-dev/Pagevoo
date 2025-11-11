import React, { useState, useEffect } from 'react'
import { pageLibraryApi, PageLibraryItem } from '@/services/libraryApi'
import { Input } from '@/components/ui/input'

interface PageLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (pageId: number, applySiteCSS: boolean) => Promise<void>
}

export const PageLibraryModal: React.FC<PageLibraryModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [pages, setPages] = useState<PageLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [importing, setImporting] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showCssDialog, setShowCssDialog] = useState<{ pageId: number; pageName: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPages()
    }
  }, [isOpen])

  const fetchPages = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (searchQuery) {
        filters.search = searchQuery
      }

      const data = await pageLibraryApi.getAll(filters)
      setPages(data)
    } catch (error) {
      console.error('Failed to fetch pages:', error)
      alert('Failed to load page library. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImportClick = async (pageId: number, pageName: string) => {
    setImporting(pageId)
    try {
      // Fetch full page data to check if it has site CSS
      const pageData = await pageLibraryApi.getById(pageId)

      if (pageData.site_css) {
        // Show CSS confirmation dialog
        setShowCssDialog({ pageId, pageName })
        setImporting(null)
      } else {
        // No CSS, import directly
        await onImport(pageId, false)
        console.log('Page imported successfully')
        setImporting(null)
      }
    } catch (error) {
      console.error('Failed to import page:', error)
      alert('Failed to import page. Please try again.')
      setImporting(null)
    }
  }

  const handleCssDialogResponse = async (applyCss: boolean) => {
    if (!showCssDialog) return

    const { pageId } = showCssDialog
    setShowCssDialog(null)
    setImporting(pageId)

    try {
      await onImport(pageId, applyCss)
      console.log('Page imported successfully with CSS choice:', applyCss)
    } catch (error) {
      console.error('Failed to import page:', error)
      alert('Failed to import page. Please try again.')
    } finally {
      setImporting(null)
    }
  }

  const handleDelete = async (pageId: number, pageName: string) => {
    if (!confirm(`Are you sure you want to delete "${pageName}" from your library?`)) {
      return
    }

    setDeleting(pageId)
    try {
      await pageLibraryApi.delete(pageId)
      console.log('Page deleted successfully')
      // Refresh the list
      fetchPages()
    } catch (error) {
      console.error('Failed to delete page:', error)
      alert('Failed to delete page. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleSearch = () => {
    fetchPages()
  }

  const filteredPages = pages.filter(page => {
    return searchQuery === '' ||
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div
          className="bg-white rounded-lg shadow-xl w-[1000px] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Page Library</h2>
                <p className="text-sm text-gray-600 mt-1">Import complete pages from your personal library</p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition"
              >
                Close
              </button>
            </div>

            {/* Search */}
            <div className="mt-4 flex gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search pages by name or description..."
                  className="w-full"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded transition"
              >
                Search
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-[#98b290]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600">Loading pages...</p>
                </div>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pages found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Start by exporting pages to your library'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Preview Image */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {page.preview_image ? (
                        <img
                          src={page.preview_image}
                          alt={page.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">{page.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 h-10">
                        {page.description || 'No description'}
                      </p>

                      {/* Section Count Badge */}
                      <div className="mt-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {page.section_count} {page.section_count === 1 ? 'section' : 'sections'}
                        </span>
                      </div>

                      {/* Tags */}
                      {page.tags && page.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {page.tags.slice(0, 4).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {page.tags.length > 4 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                              +{page.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleImportClick(page.id, page.name)}
                          disabled={importing === page.id}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {importing === page.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Importing...
                            </>
                          ) : (
                            'Import'
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(page.id, page.name)}
                          disabled={deleting === page.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition disabled:opacity-50"
                          title="Delete from library"
                        >
                          {deleting === page.id ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Confirmation Dialog */}
      {showCssDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000]">
          <div
            className="bg-white rounded-lg shadow-2xl w-[500px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Site-wide CSS Detected</h3>
                <p className="text-sm text-gray-600 mt-2">
                  This page includes site-wide CSS styles. Would you like to apply these styles to your template?
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Applying CSS will affect the entire template, not just this page.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleCssDialogResponse(true)}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition"
              >
                Yes, Apply CSS
              </button>
              <button
                onClick={() => handleCssDialogResponse(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition"
              >
                No, Just Import Page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
