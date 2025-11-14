import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExportPageModalProps {
  isOpen: boolean
  onClose: () => void
  page: any // TemplatePage type
  siteCss?: string
  showPagevooOption?: boolean
  onExport: (data: {
    name: string
    description: string
    meta_description: string
    meta_keywords: string
    tags: string[]
    preview_image?: File
    is_pagevoo_official?: boolean
  }) => Promise<void>
}

export const ExportPageModal: React.FC<ExportPageModalProps> = ({
  isOpen,
  onClose,
  page,
  siteCss,
  showPagevooOption = false,
  onExport
}) => {
  const [name, setName] = useState(page?.name || '')
  const [description, setDescription] = useState('')
  const [metaDescription, setMetaDescription] = useState(page?.meta_description || '')
  const [metaKeywords, setMetaKeywords] = useState('')
  const [tags, setTags] = useState('')
  const [previewImage, setPreviewImage] = useState<File | null>(null)
  const [isPagevooOfficial, setIsPagevooOfficial] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Update form state when page prop changes
  useEffect(() => {
    if (page) {
      setName(page.name || '')
      setMetaDescription(page.meta_description || '')
    }
  }, [page])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage('')

    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

      const exportData: any = {
        name,
        description,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        tags: tagsArray
      }

      if (previewImage) {
        exportData.preview_image = previewImage
      }

      if (showPagevooOption) {
        exportData.is_pagevoo_official = isPagevooOfficial
      }

      await onExport(exportData)

      setSuccessMessage('Page exported successfully!')

      // Reset form after 1.5 seconds
      setTimeout(() => {
        setName(page?.name || '')
        setDescription('')
        setMetaDescription(page?.meta_description || '')
        setMetaKeywords('')
        setTags('')
        setPreviewImage(null)
        setIsPagevooOfficial(false)
        setSuccessMessage('')
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export page. Please try again.')
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

  const sectionCount = page?.sections?.length || 0

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
              <h2 className="text-xl font-semibold text-gray-200">Export Page to Library</h2>
              <p className="text-sm text-gray-400 mt-1">Save this page for reuse in other templates</p>
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
            {/* Section Count Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
              </span>
              {siteCss && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                  Includes Site CSS
                </span>
              )}
            </div>

            {/* Name Input */}
            <div>
              <Label htmlFor="page-name" className="text-gray-200">Page Name *</Label>
              <Input
                id="page-name"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
                placeholder="Enter page name"
                className="mt-1"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <Label htmlFor="page-description" className="text-gray-200">Description</Label>
              <textarea
                id="page-description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe this page (optional)"
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290] focus:border-transparent resize-none bg-gray-700 text-gray-200 placeholder:text-gray-400"
              />
            </div>

            {/* Meta Description */}
            <div>
              <Label htmlFor="page-meta-description" className="text-gray-200">Meta Description</Label>
              <textarea
                id="page-meta-description"
                value={metaDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMetaDescription(e.target.value)}
                placeholder="SEO meta description for this page"
                rows={2}
                className="mt-1 w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290] focus:border-transparent resize-none bg-gray-700 text-gray-200 placeholder:text-gray-400"
              />
            </div>

            {/* Meta Keywords */}
            <div>
              <Label htmlFor="page-meta-keywords" className="text-gray-200">Meta Keywords</Label>
              <Input
                id="page-meta-keywords"
                type="text"
                value={metaKeywords}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMetaKeywords(e.target.value)}
                placeholder="landing page, saas, pricing (comma-separated)"
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Separate keywords with commas</p>
            </div>

            {/* Tags Input */}
            <div>
              <Label htmlFor="page-tags" className="text-gray-200">Tags</Label>
              <Input
                id="page-tags"
                type="text"
                value={tags}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
                placeholder="saas, marketing, complete-site (comma-separated)"
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
            </div>

            {/* Preview Image Upload */}
            <div>
              <Label htmlFor="page-preview" className="text-gray-200">Preview Image</Label>
              <input
                id="page-preview"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 w-full px-3 py-2 border border-gray-600 rounded-md text-sm text-gray-200 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#98b290] file:text-white hover:file:bg-[#7a9274] file:cursor-pointer bg-gray-700"
              />
              {previewImage && (
                <p className="text-xs text-gray-400 mt-1">Selected: {previewImage.name}</p>
              )}
            </div>

            {/* Pagevoo Official Checkbox */}
            {showPagevooOption && (
              <div className="flex items-center gap-2 p-3 bg-purple-900 bg-opacity-30 border border-purple-600 rounded-md">
                <input
                  id="is-pagevoo-official"
                  type="checkbox"
                  checked={isPagevooOfficial}
                  onChange={(e) => setIsPagevooOfficial(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <Label htmlFor="is-pagevoo-official" className="text-gray-200 cursor-pointer">
                  <span>Mark as Pagevoo Official Page</span>
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
