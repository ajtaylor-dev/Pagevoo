import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExportSectionModalProps {
  isOpen: boolean
  onClose: () => void
  section: any // TemplateSection type
  onExport: (data: { name: string; description: string; section_type: string; tags: string[]; preview_image?: File; is_pagevoo_official?: boolean }) => Promise<void>
  showPagevooOption?: boolean // Only show in TemplateBuilder
}

export const ExportSectionModal: React.FC<ExportSectionModalProps> = ({
  isOpen,
  onClose,
  section,
  onExport,
  showPagevooOption = false
}) => {
  const [name, setName] = useState(section?.section_name || section?.type || '')
  const [description, setDescription] = useState('')
  const [sectionType, setSectionType] = useState('standard')
  const [tags, setTags] = useState('')
  const [previewImage, setPreviewImage] = useState<File | null>(null)
  const [isPagevooOfficial, setIsPagevooOfficial] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Update form state when section prop changes
  useEffect(() => {
    if (section) {
      setName(section.section_name || section.type || '')
    }
  }, [section])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage('')

    try {
      console.log('ExportSectionModal: Starting export...', {
        name,
        description,
        tags,
        hasPreviewImage: !!previewImage,
        section
      })

      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

      const exportData: any = {
        name,
        description,
        section_type: sectionType,
        tags: tagsArray
      }

      if (showPagevooOption) {
        exportData.is_pagevoo_official = isPagevooOfficial
      }

      if (previewImage) {
        exportData.preview_image = previewImage
      }

      console.log('ExportSectionModal: Calling onExport with data:', {
        ...exportData,
        preview_image: previewImage ? 'File object present' : 'No preview image'
      })

      await onExport(exportData)

      console.log('ExportSectionModal: Export completed successfully!')
      setSuccessMessage('Section exported successfully!')

      // Reset form after 1.5 seconds
      setTimeout(() => {
        setName(section?.section_name || section?.type || '')
        setDescription('')
        setSectionType('standard')
        setTags('')
        setPreviewImage(null)
        setIsPagevooOfficial(false)
        setSuccessMessage('')
        onClose()
      }, 1500)
    } catch (error) {
      console.error('ExportSectionModal: Export failed with error:', error)
      console.error('ExportSectionModal: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      alert('Failed to export section. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewImage(file)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-[600px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-200">Export Section to Library</h2>
              <p className="text-sm text-gray-400 mt-1">Save this section for reuse in other templates</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm font-medium transition disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <Label htmlFor="section-name" className="text-gray-200">Section Name *</Label>
              <Input
                id="section-name"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
                placeholder="Enter section name"
                className="mt-1"
              />
            </div>

            {/* Section Type Dropdown */}
            <div>
              <Label htmlFor="section-type" className="text-gray-200">Section Type *</Label>
              <select
                id="section-type"
                value={sectionType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSectionType(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290] focus:border-transparent bg-gray-700 text-gray-200"
              >
                <option value="header">Header/Banners</option>
                <option value="navigation">Navigation</option>
                <option value="hero">Hero</option>
                <option value="gallery">Gallery</option>
                <option value="informative">Informative</option>
                <option value="table">Table/Grid</option>
                <option value="features">Features</option>
                <option value="testimonials">Testimonials</option>
                <option value="standard">Standard</option>
                <option value="misc">Misc</option>
              </select>
            </div>

            {/* Description Textarea */}
            <div>
              <Label htmlFor="section-description" className="text-gray-200">Description</Label>
              <textarea
                id="section-description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe this section (optional)"
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290] focus:border-transparent resize-none bg-gray-700 text-gray-200 placeholder:text-gray-400"
              />
            </div>

            {/* Tags Input */}
            <div>
              <Label htmlFor="section-tags" className="text-gray-200">Tags</Label>
              <Input
                id="section-tags"
                type="text"
                value={tags}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
                placeholder="modern, responsive, dark-mode (comma-separated)"
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
            </div>

            {/* Preview Image Upload */}
            <div>
              <Label htmlFor="section-preview" className="text-gray-200">Preview Image</Label>
              <input
                id="section-preview"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 w-full px-3 py-2 border border-gray-600 rounded-md text-sm text-gray-200 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#98b290] file:text-white hover:file:bg-[#7a9274] file:cursor-pointer bg-gray-700"
              />
              {previewImage && (
                <p className="text-xs text-gray-400 mt-1">Selected: {previewImage.name}</p>
              )}
            </div>

            {/* Pagevoo Official Checkbox (only in TemplateBuilder) */}
            {showPagevooOption && (
              <div className="flex items-center gap-2 p-3 bg-purple-900 bg-opacity-30 border border-purple-600 rounded-md">
                <input
                  id="is-pagevoo-official"
                  type="checkbox"
                  checked={isPagevooOfficial}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPagevooOfficial(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <Label htmlFor="is-pagevoo-official" className="text-gray-200 cursor-pointer flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Mark as Pagevoo Official Section</span>
                </Label>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                {successMessage}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-600 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-600 text-gray-200 rounded hover:bg-gray-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              'Export to Library'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
