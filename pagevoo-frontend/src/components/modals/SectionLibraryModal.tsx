import React, { useState, useEffect } from 'react'
import { sectionLibraryApi, SectionLibraryItem } from '@/services/libraryApi'
import { Input } from '@/components/ui/input'

interface SectionLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (sectionId: number) => Promise<void>
}

export const SectionLibraryModal: React.FC<SectionLibraryModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [sections, setSections] = useState<SectionLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [importing, setImporting] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchSections()
    }
  }, [isOpen])

  const fetchSections = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (typeFilter !== 'all') {
        filters.type = typeFilter
      }
      if (searchQuery) {
        filters.search = searchQuery
      }

      const data = await sectionLibraryApi.getAll(filters)
      setSections(data)
    } catch (error) {
      console.error('Failed to fetch sections:', error)
      alert('Failed to load section library. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (sectionId: number) => {
    setImporting(sectionId)
    try {
      const sectionData = await sectionLibraryApi.getById(sectionId)
      await onImport(sectionData.section_data)
      console.log('Section imported successfully')
      // Optionally close modal after import
      // onClose()
    } catch (error) {
      console.error('Failed to import section:', error)
      alert('Failed to import section. Please try again.')
    } finally {
      setImporting(null)
    }
  }

  const handleDelete = async (sectionId: number, sectionName: string) => {
    if (!confirm(`Are you sure you want to delete "${sectionName}" from your library?`)) {
      return
    }

    setDeleting(sectionId)
    try {
      await sectionLibraryApi.delete(sectionId)
      console.log('Section deleted successfully')
      // Refresh the list
      fetchSections()
    } catch (error) {
      console.error('Failed to delete section:', error)
      alert('Failed to delete section. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleSearch = () => {
    fetchSections()
  }

  const filteredSections = sections.filter(section => {
    const matchesSearch = searchQuery === '' ||
      section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || section.section_type === typeFilter

    return matchesSearch && matchesType
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div
        className="bg-white rounded-lg shadow-xl w-[1000px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Section Library</h2>
              <p className="text-sm text-gray-600 mt-1">Import sections from your personal library</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition"
            >
              Close
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                placeholder="Search sections by name or description..."
                className="w-full"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            >
              <option value="all">All Types</option>
              <option value="hero">Hero</option>
              <option value="pricing">Pricing</option>
              <option value="testimonial">Testimonial</option>
              <option value="cta">CTA</option>
              <option value="features">Features</option>
              <option value="footer">Footer</option>
              <option value="header">Header</option>
            </select>
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
                <p className="text-gray-600">Loading sections...</p>
              </div>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sections found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by exporting sections to your library'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredSections.map((section) => (
                <div
                  key={section.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  {/* Preview Image */}
                  <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {section.preview_image ? (
                      <img
                        src={section.preview_image}
                        alt={section.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">{section.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">
                      {section.description || 'No description'}
                    </p>

                    {/* Tags */}
                    {section.tags && section.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {section.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {section.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                            +{section.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full uppercase">
                        {section.section_type}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleImport(section.id)}
                        disabled={importing === section.id}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {importing === section.id ? (
                          <>
                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                        onClick={() => handleDelete(section.id, section.name)}
                        disabled={deleting === section.id}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition disabled:opacity-50"
                        title="Delete from library"
                      >
                        {deleting === section.id ? (
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  )
}
