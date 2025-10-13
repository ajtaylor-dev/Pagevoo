import { useState, useEffect } from 'react'
import { api } from '@/services/api'

interface UploadSettingsData {
  upload_max_gallery_image_size: {
    key: string
    value: string
    type: string
    description: string
  }
  upload_max_preview_image_size: {
    key: string
    value: string
    type: string
    description: string
  }
  upload_allowed_gallery_formats: {
    key: string
    value: string
    type: string
    description: string
  }
  upload_allowed_preview_formats: {
    key: string
    value: string
    type: string
    description: string
  }
}

export function UploadSettings() {
  const [settings, setSettings] = useState<UploadSettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    upload_max_gallery_image_size: 2048,
    upload_max_preview_image_size: 5120,
    upload_allowed_gallery_formats: 'jpeg,png,jpg,gif,svg,webp',
    upload_allowed_preview_formats: 'jpeg,png,jpg,gif,webp'
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await api.getUploadSettings()
      if (response.success && response.data) {
        setSettings(response.data)
        // Parse the settings data
        setFormData({
          upload_max_gallery_image_size: parseInt(response.data.upload_max_gallery_image_size?.value || '2048'),
          upload_max_preview_image_size: parseInt(response.data.upload_max_preview_image_size?.value || '5120'),
          upload_allowed_gallery_formats: response.data.upload_allowed_gallery_formats?.value || 'jpeg,png,jpg,gif,svg,webp',
          upload_allowed_preview_formats: response.data.upload_allowed_preview_formats?.value || 'jpeg,png,jpg,gif,webp'
        })
      }
    } catch (error: any) {
      console.error('Error loading upload settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.includes('max_')) {
      // For size fields, convert to number
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      })
    } else {
      // For format fields, keep as string
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validate sizes
    if (formData.upload_max_gallery_image_size < 100 || formData.upload_max_gallery_image_size > 10240) {
      setMessage({ type: 'error', text: 'Gallery image size must be between 100 KB and 10240 KB (10 MB)' })
      return
    }
    if (formData.upload_max_preview_image_size < 100 || formData.upload_max_preview_image_size > 10240) {
      setMessage({ type: 'error', text: 'Preview image size must be between 100 KB and 10240 KB (10 MB)' })
      return
    }

    // Validate formats
    if (!formData.upload_allowed_gallery_formats.trim()) {
      setMessage({ type: 'error', text: 'Gallery formats cannot be empty' })
      return
    }
    if (!formData.upload_allowed_preview_formats.trim()) {
      setMessage({ type: 'error', text: 'Preview formats cannot be empty' })
      return
    }

    try {
      setIsSaving(true)
      const response = await api.updateUploadSettings(formData)
      if (response.success) {
        setMessage({ type: 'success', text: 'Upload settings updated successfully' })
        await loadSettings()
      }
    } catch (error: any) {
      console.error('Error updating settings:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update settings'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Configuration</h3>
        <p className="text-sm text-gray-600">
          Configure upload limits and allowed file formats for both template and website builders.
          These settings are applied universally across the platform.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gallery Image Settings */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Gallery Images</h4>
          <p className="text-sm text-gray-600 mb-4">
            Used in the image gallery for both template and website builders
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum File Size (KB)
              </label>
              <input
                type="number"
                name="upload_max_gallery_image_size"
                value={formData.upload_max_gallery_image_size}
                onChange={handleInputChange}
                min="100"
                max="10240"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min: 100 KB, Max: 10240 KB (10 MB)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Formats
              </label>
              <input
                type="text"
                name="upload_allowed_gallery_formats"
                value={formData.upload_allowed_gallery_formats}
                onChange={handleInputChange}
                required
                placeholder="jpeg,png,jpg,gif,svg,webp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated (e.g., jpeg,png,jpg,gif)
              </p>
            </div>
          </div>
        </div>

        {/* Preview Image Settings */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Preview Images</h4>
          <p className="text-sm text-gray-600 mb-4">
            Used for template preview/thumbnail images in the template manager
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum File Size (KB)
              </label>
              <input
                type="number"
                name="upload_max_preview_image_size"
                value={formData.upload_max_preview_image_size}
                onChange={handleInputChange}
                min="100"
                max="10240"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min: 100 KB, Max: 10240 KB (10 MB)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Formats
              </label>
              <input
                type="text"
                name="upload_allowed_preview_formats"
                value={formData.upload_allowed_preview_formats}
                onChange={handleInputChange}
                required
                placeholder="jpeg,png,jpg,gif,webp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated (e.g., jpeg,png,jpg,gif)
              </p>
            </div>
          </div>
        </div>

        {/* Current Settings Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex">
            <svg
              className="w-5 h-5 text-blue-700 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Changes apply immediately to all future uploads</li>
                <li>File size limits are enforced server-side</li>
                <li>Existing uploaded files are not affected</li>
                <li>SVG format is only available for gallery images</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
