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

interface StylesheetModalProps {
  isOpen: boolean
  onClose: () => void
  currentPage: TemplatePage | null
  template: Template | null
  isEditingCSS: boolean
  setIsEditingCSS: (value: boolean) => void
  editableCSS: string
  setEditableCSS: (value: string) => void
  onApplyChanges: () => void
  generateStylesheet: (page: TemplatePage | null, template: Template | null) => string
}

export const StylesheetModal: React.FC<StylesheetModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  template,
  isEditingCSS,
  setIsEditingCSS,
  editableCSS,
  setEditableCSS,
  onApplyChanges,
  generateStylesheet
}) => {
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setIsEditingCSS(false)
  }

  const handleEdit = () => {
    setEditableCSS(generateStylesheet(currentPage, template))
    setIsEditingCSS(true)
  }

  const handleCopy = () => {
    const css = generateStylesheet(currentPage, template)
    navigator.clipboard.writeText(css)
    alert('Stylesheet copied to clipboard!')
  }

  const handleDownload = () => {
    const css = generateStylesheet(currentPage, template)
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'style.css'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCancel = () => {
    setIsEditingCSS(false)
    setEditableCSS(generateStylesheet(currentPage, template))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[85vh] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Compiled Stylesheet</h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete CSS for: <span className="font-medium">{currentPage?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditingCSS ? (
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
        {isEditingCSS && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Warning: Editing stylesheet directly</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Invalid CSS syntax may cause display issues in the template builder. Ensure your CSS is valid before applying changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
            {!isEditingCSS ? (
              <div className="h-full overflow-auto">
                <pre className="text-cyan-400 font-mono text-sm p-4 whitespace-pre-wrap break-words">
                  <code>{editableCSS || generateStylesheet(currentPage, template)}</code>
                </pre>
              </div>
            ) : (
              <textarea
                value={editableCSS}
                onChange={(e) => setEditableCSS(e.target.value)}
                className="w-full h-full p-4 bg-gray-900 text-cyan-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {isEditingCSS ? 'Editing mode - Changes will update template styles' : 'Dynamic preview - Updates as you build'} • Cascade Order: Grid System → Site CSS → Page CSS → Section CSS → Row CSS → Column CSS → Responsive Breakpoints
          </p>
        </div>
      </div>
    </div>
  )
}
