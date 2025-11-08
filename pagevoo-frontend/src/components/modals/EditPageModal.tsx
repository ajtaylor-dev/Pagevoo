import React from 'react'

interface EditPageModalProps {
  isOpen: boolean
  onClose: () => void
  editPageName: string
  setEditPageName: (name: string) => void
  editPageSlug: string
  setEditPageSlug: (slug: string) => void
  editPageMetaDescription: string
  setEditPageMetaDescription: (desc: string) => void
  onSave: () => void
}

export const EditPageModal: React.FC<EditPageModalProps> = ({
  isOpen,
  onClose,
  editPageName,
  setEditPageName,
  editPageSlug,
  setEditPageSlug,
  editPageMetaDescription,
  setEditPageMetaDescription,
  onSave
}) => {
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setEditPageName('')
    setEditPageSlug('')
    setEditPageMetaDescription('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Page Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Name
            </label>
            <input
              type="text"
              value={editPageName}
              onChange={(e) => setEditPageName(e.target.value)}
              placeholder="e.g., About Us, Services, Contact"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Slug
            </label>
            <input
              type="text"
              value={editPageSlug}
              onChange={(e) => setEditPageSlug(e.target.value)}
              placeholder="e.g., about-us, services, contact"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
            <p className="text-xs text-gray-500 mt-1">
              The URL path for this page (e.g., /about-us)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={editPageMetaDescription}
              onChange={(e) => setEditPageMetaDescription(e.target.value)}
              placeholder="Brief description for search engines (150-160 characters recommended)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
            <p className="text-xs text-gray-500 mt-1">
              {editPageMetaDescription.length} characters
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!editPageName.trim() || !editPageSlug.trim()}
              className="flex-1 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
