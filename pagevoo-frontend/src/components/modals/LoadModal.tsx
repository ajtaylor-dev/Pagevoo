import React from 'react'

interface Template {
  id: number
  name: string
  description: string
  business_type: string
  is_active: boolean
  pages?: any[]
}

interface LoadModalProps {
  isOpen: boolean
  onClose: () => void
  loadingTemplates: boolean
  availableTemplates: Template[]
  onLoadTemplate: (templateId: number) => void
}

export const LoadModal: React.FC<LoadModalProps> = ({
  isOpen,
  onClose,
  loadingTemplates,
  availableTemplates,
  onLoadTemplate
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Load Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading templates...</div>
            </div>
          ) : availableTemplates.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">No templates available</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {availableTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#98b290] hover:shadow-md transition cursor-pointer"
                  onClick={() => onLoadTemplate(tmpl.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{tmpl.name}</h3>
                      {tmpl.description && (
                        <p className="text-sm text-gray-600 mt-1">{tmpl.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {tmpl.business_type}
                        </span>
                        {tmpl.is_active && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                            Published
                          </span>
                        )}
                        {tmpl.pages && (
                          <span className="text-xs text-gray-500">
                            {tmpl.pages.length} {tmpl.pages.length === 1 ? 'page' : 'pages'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg className="w-6 h-6 text-[#98b290]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
