import React from 'react'
import { StyleEditor } from '../StyleEditor'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
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

interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: TemplateSection[]
  meta_description?: string
  page_css?: string
  page_id?: string
}

interface GridPropertiesProps {
  selectedSection: TemplateSection
  template: Template | null
  currentPage: TemplatePage | null
  showRowStyle: boolean
  setShowRowStyle: (value: boolean) => void
  expandedColumnIndex: number | null
  setExpandedColumnIndex: (value: number | null) => void
  onUpdateContent: (sectionId: number, content: any) => void
}

const GridProperties: React.FC<GridPropertiesProps> = ({
  selectedSection,
  template,
  currentPage,
  showRowStyle,
  setShowRowStyle,
  expandedColumnIndex,
  setExpandedColumnIndex,
  onUpdateContent
}) => {
  // Helper function for default column CSS
  const getDefaultColumnCSS = () => `border: 2px dashed #d1d5db;
border-radius: 0.5rem;
min-height: 200px;
padding: 1rem;`

  // Extract grid configuration from section type (e.g., "grid-2x1" => 2 cols, 1 row)
  const [_, gridConfig] = selectedSection.type.split('-')
  const [cols, rows] = gridConfig.split('x').map(Number)
  const totalColumns = cols * rows
  const columns = selectedSection.content?.columns || []

  return (
    <>
      {/* Row Style Button */}
      <div className="mb-3">
        <button
          onClick={() => {
            setShowRowStyle(!showRowStyle)
            setExpandedColumnIndex(null)
          }}
          className="w-full px-3 py-2 bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] hover:from-[#d4e5d0] hover:to-[#c1d9bc] border border-[#98b290] rounded text-sm font-medium text-[#5a7a54] transition flex items-center justify-between"
        >
          <span>Row Container Style</span>
          <svg
            className={`w-3 h-3 transition-transform text-[#5a7a54] ${showRowStyle ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {showRowStyle && (
          <div className="mt-2 p-3 border border-[#d4e5d0] rounded bg-white">
            <p className="text-[9px] text-gray-400 mb-2">
              Target: <code className="bg-gray-100 px-1 rounded">.row</code>
            </p>
            <StyleEditor
              value={selectedSection.content?.content_css?.row || ''}
              onChange={(css) => {
                const currentContentCSS = selectedSection.content?.content_css || {}
                onUpdateContent(selectedSection.id, {
                  ...selectedSection.content,
                  content_css: {
                    ...currentContentCSS,
                    row: css
                  }
                })
              }}
              context="row"
              galleryImages={template?.images}
              siteCSS={template?.custom_css || ''}
              pageCSS={currentPage?.page_css || ''}
              sectionCSS={selectedSection.content?.section_css || ''}
            />
          </div>
        )}
      </div>

      {/* Column Style Buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-200">Column Styles</label>
          <button
            onClick={() => {
              // Remove borders from all columns
              const currentContentCSS = selectedSection.content?.content_css || {}
              const currentColumns = currentContentCSS.columns || {}
              const updatedColumns: { [key: string]: string } = {}

              // For each column, remove border properties
              for (let i = 0; i < totalColumns; i++) {
                const existingCSS = currentColumns[i] || getDefaultColumnCSS()
                // Remove border-related properties
                const cleanedCSS = existingCSS
                  .replace(/border[^;]*;?/gi, '')
                  .replace(/^\s*\n/gm, '') // Remove empty lines
                  .trim()
                updatedColumns[i] = cleanedCSS
              }

              onUpdateContent(selectedSection.id, {
                ...selectedSection.content,
                content_css: {
                  ...currentContentCSS,
                  columns: updatedColumns
                }
              })
            }}
            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition"
            title="Remove borders from all columns"
          >
            Remove Borders
          </button>
        </div>
        <div className="space-y-2">
          {Array.from({ length: totalColumns }, (_, idx) => {
            const colWidth = columns[idx]?.colWidth || 12
            const isExpanded = expandedColumnIndex === idx

            return (
              <div key={idx}>
                <button
                  onClick={() => {
                    setExpandedColumnIndex(isExpanded ? null : idx)
                    setShowRowStyle(false)
                  }}
                  className={`w-full px-3 py-2 border rounded text-sm font-medium transition flex items-center justify-between ${
                    isExpanded
                      ? 'bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] border-[#98b290] text-[#5a7a54]'
                      : 'bg-gradient-to-r from-[#f0f7ee] to-[#e1eedd] hover:from-[#e8f0e6] hover:to-[#d4e5d0] border-[#98b290] text-[#5a7a54]'
                  }`}
                >
                  <span>Column {idx + 1} <span className="text-xs text-gray-400">(col-{colWidth})</span></span>
                  <svg
                    className={`w-3 h-3 transition-transform text-[#5a7a54] ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="mt-2 p-3 border border-[#d4e5d0] rounded bg-white">
                    <p className="text-[9px] text-gray-400 mb-2">
                      Target: <code className="bg-gray-100 px-1 rounded">.col-{colWidth}</code> or position-based
                    </p>
                    <StyleEditor
                      value={selectedSection.content?.content_css?.columns?.[idx] || ''}
                      onChange={(css) => {
                        const currentContentCSS = selectedSection.content?.content_css || {}
                        const currentColumns = currentContentCSS.columns || {}
                        onUpdateContent(selectedSection.id, {
                          ...selectedSection.content,
                          content_css: {
                            ...currentContentCSS,
                            columns: {
                              ...currentColumns,
                              [idx]: css
                            }
                          }
                        })
                      }}
                      context="column"
                      galleryImages={template?.images}
                      siteCSS={template?.custom_css || ''}
                      pageCSS={currentPage?.page_css || ''}
                      sectionCSS={selectedSection.content?.section_css || ''}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default GridProperties
