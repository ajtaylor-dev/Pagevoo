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

interface SourceCodeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPage: TemplatePage | null
  isEditingHTML: boolean
  setIsEditingHTML: (value: boolean) => void
  editableHTML: string
  setEditableHTML: (value: string) => void
  onApplyChanges: () => void
  generatePageHTML: (page: TemplatePage | null) => string
}

export const SourceCodeModal: React.FC<SourceCodeModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  isEditingHTML,
  setIsEditingHTML,
  editableHTML,
  setEditableHTML,
  onApplyChanges,
  generatePageHTML
}) => {
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setIsEditingHTML(false)
  }

  const handleEdit = () => {
    setEditableHTML(generatePageHTML(currentPage))
    setIsEditingHTML(true)
  }

  const handleCopy = () => {
    const html = generatePageHTML(currentPage)
    navigator.clipboard.writeText(html)
    alert('Source code copied to clipboard!')
  }

  const handleDownload = () => {
    const html = generatePageHTML(currentPage)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentPage?.slug || 'page'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCancel = () => {
    setIsEditingHTML(false)
    setEditableHTML(generatePageHTML(currentPage))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[85vh] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Page Source Code</h2>
              <p className="text-sm text-gray-600 mt-1">
                HTML source code for: <span className="font-medium">{currentPage?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditingHTML ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-[#98b290] text-white rounded hover:bg-[#7a9274] text-sm font-medium transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition"
                  >
                    Copy
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium transition"
                  >
                    Download
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onApplyChanges}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Warning Banner - Only show when editing */}
        {isEditingHTML && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Warning: Editing source code directly</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Modifying the HTML structure (especially deleting sections or columns) may cause issues with the template builder canvas. It's recommended to only edit text content and attributes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
            {!isEditingHTML ? (
              <div className="h-full overflow-auto">
                <pre className="text-green-400 font-mono text-sm p-4 whitespace-pre-wrap break-words">
                  <code>{editableHTML || generatePageHTML(currentPage)}</code>
                </pre>
              </div>
            ) : (
              <textarea
                value={editableHTML}
                onChange={(e) => setEditableHTML(e.target.value)}
                className="w-full h-full p-4 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Generated from {currentPage?.sections?.length || 0} section{(currentPage?.sections?.length || 0) !== 1 ? 's' : ''} • {isEditingHTML ? 'Editing mode - Changes will update template' : 'Dynamic preview - Updates as you build'}
          </p>
        </div>
      </div>
    </div>
  )
}
