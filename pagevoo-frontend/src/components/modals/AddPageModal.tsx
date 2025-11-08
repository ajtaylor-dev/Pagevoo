import React from 'react'

interface AddPageModalProps {
  isOpen: boolean
  onClose: () => void
  newPageName: string
  setNewPageName: (name: string) => void
  onAdd: () => void
}

export const AddPageModal: React.FC<AddPageModalProps> = ({
  isOpen,
  onClose,
  newPageName,
  setNewPageName,
  onAdd
}) => {
  if (!isOpen) return null

  const handleAdd = () => {
    onAdd()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Page</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Name
            </label>
            <input
              type="text"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g., About Us, Services, Contact"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Slug will be auto-generated: {newPageName ? newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'page-slug'}
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                onClose()
                setNewPageName('')
              }}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newPageName.trim()}
              className="flex-1 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
