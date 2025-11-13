import React from 'react'

// Local type definition to avoid import issues
interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface FooterPropertiesProps {
  selectedSection: TemplateSection
  onUpdateContent: (sectionId: number, content: any) => void
}

export const FooterProperties: React.FC<FooterPropertiesProps> = ({
  selectedSection,
  onUpdateContent
}) => {
  return (
    <>
      {/* Footer Section Controls */}
      {selectedSection.type === 'footer-simple' && (
        <>
          <div className="mb-3">
            <label className="text-xs text-gray-300 block mb-1">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedSection.content?.sectionStyle?.background || '#1f2937'}
                onChange={(e) => {
                  onUpdateContent(selectedSection.id, {
                    ...selectedSection.content,
                    sectionStyle: {
                      ...selectedSection.content?.sectionStyle,
                      background: e.target.value
                    }
                  })
                }}
                className="w-10 h-8 rounded border border-gray-600"
              />
              <input
                type="text"
                value={selectedSection.content?.sectionStyle?.background || '#1f2937'}
                onChange={(e) => {
                  onUpdateContent(selectedSection.id, {
                    ...selectedSection.content,
                    sectionStyle: {
                      ...selectedSection.content?.sectionStyle,
                      background: e.target.value
                    }
                  })
                }}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                placeholder="#1f2937"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-300 block mb-1">Padding</label>
            <input
              type="text"
              value={selectedSection.content?.sectionStyle?.padding || '32px'}
              onChange={(e) => {
                onUpdateContent(selectedSection.id, {
                  ...selectedSection.content,
                  sectionStyle: {
                    ...selectedSection.content?.sectionStyle,
                    padding: e.target.value
                  }
                })
              }}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              placeholder="32px"
            />
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-300 block mb-1">Text Align</label>
            <select
              value={selectedSection.content?.sectionStyle?.textAlign || 'center'}
              onChange={(e) => {
                onUpdateContent(selectedSection.id, {
                  ...selectedSection.content,
                  sectionStyle: {
                    ...selectedSection.content?.sectionStyle,
                    textAlign: e.target.value
                  }
                })
              }}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </>
      )}

      {selectedSection.type === 'footer-columns' && (
        <>
          <div className="mb-3">
            <label className="text-xs text-gray-300 block mb-1">Footer Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedSection.content?.sectionStyle?.background || '#172554'}
                onChange={(e) => {
                  onUpdateContent(selectedSection.id, {
                    ...selectedSection.content,
                    sectionStyle: {
                      ...selectedSection.content?.sectionStyle,
                      background: e.target.value
                    }
                  })
                }}
                className="w-10 h-8 rounded border border-gray-600"
              />
              <input
                type="text"
                value={selectedSection.content?.sectionStyle?.background || '#172554'}
                onChange={(e) => {
                  onUpdateContent(selectedSection.id, {
                    ...selectedSection.content,
                    sectionStyle: {
                      ...selectedSection.content?.sectionStyle,
                      background: e.target.value
                    }
                  })
                }}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                placeholder="#172554"
              />
            </div>
          </div>

          <div className="mb-3 border-t border-gray-600 pt-3">
            <label className="text-xs text-gray-300 block mb-1">Copyright Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedSection.content?.copyrightStyle?.background || '#171717'}
                onChange={(e) => {
                  onUpdateContent(selectedSection.id, {
                    ...selectedSection.content,
                    copyrightStyle: {
                      ...selectedSection.content?.copyrightStyle,
                      background: e.target.value
                    }
                  })
                }}
                className="w-10 h-8 rounded border border-gray-600"
              />
              <input
                type="text"
                value={selectedSection.content?.copyrightStyle?.background || '#171717'}
                onChange={(e) => {
                  onUpdateContent(selectedSection.id, {
                    ...selectedSection.content,
                    copyrightStyle: {
                      ...selectedSection.content?.copyrightStyle,
                      background: e.target.value
                    }
                  })
                }}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                placeholder="#171717"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-300 block mb-1">Copyright Padding</label>
            <input
              type="text"
              value={selectedSection.content?.copyrightStyle?.padding || '24px'}
              onChange={(e) => {
                onUpdateContent(selectedSection.id, {
                  ...selectedSection.content,
                  copyrightStyle: {
                    ...selectedSection.content?.copyrightStyle,
                    padding: e.target.value
                  }
                })
              }}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              placeholder="24px"
            />
          </div>
        </>
      )}

      {/* Legacy navbar controls */}
      {selectedSection.type.startsWith('navbar-') && (
        <div className="p-3 bg-yellow-50 border border-yellow-400 rounded text-xs text-yellow-800">
          ⚠️ This navbar type has been removed. Please delete this section.
        </div>
      )}
    </>
  )
}
