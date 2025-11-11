import React from 'react'

interface Template {
  id: number
  pages: TemplatePage[]
}

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

interface PageSelectorBarProps {
  currentPage: TemplatePage | null
  template: Template
  setCurrentPage: (page: TemplatePage) => void
  setShowCSSPanel: (show: boolean) => void
  setShowSectionCSS: (show: boolean) => void
  setSelectedSection: (section: any) => void
  setShowRightSidebar: (show: boolean) => void
  cssInspectorMode: boolean
  setCssInspectorMode: (mode: boolean) => void
  handleDeletePage: (pageId: number) => void
  setShowAddPageModal: (show: boolean) => void
}

export const PageSelectorBar: React.FC<PageSelectorBarProps> = ({
  currentPage,
  template,
  setCurrentPage,
  setShowCSSPanel,
  setShowSectionCSS,
  setSelectedSection,
  setShowRightSidebar,
  cssInspectorMode,
  setCssInspectorMode,
  handleDeletePage,
  setShowAddPageModal
}) => {
  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600">Viewing page:</span>
        <select
          value={currentPage?.id || ''}
          onChange={(e) => {
            const selectedPage = template.pages.find(p => p.id === parseInt(e.target.value))
            if (selectedPage) setCurrentPage(selectedPage)
          }}
          className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
        >
          {template.pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name} {page.is_homepage ? '(Home)' : ''}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setShowCSSPanel(true)
            setShowSectionCSS(false)
            setSelectedSection(null)
            setShowRightSidebar(true)
          }}
          className="p-1 hover:bg-gray-200 rounded transition"
          title="Edit Site/Page Styling"
        >
          <span className="text-xs font-bold text-blue-600">Site/Page Styling</span>
        </button>
        <button
          onClick={() => setCssInspectorMode(!cssInspectorMode)}
          className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
            cssInspectorMode
              ? 'bg-[#98b290] text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={cssInspectorMode ? 'Disable CSS Inspector' : 'Enable CSS Inspector - Hover over sections to see their CSS'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {cssInspectorMode ? 'CSS: ON' : 'CSS'}
        </button>
      </div>
      <div className="flex items-center gap-1">
        {currentPage && template.pages.length > 1 && !currentPage.is_homepage && (
          <button
            onClick={() => handleDeletePage(currentPage.id)}
            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
            title="Delete Page"
          >
            Delete Page
          </button>
        )}
        <button
          onClick={() => setShowAddPageModal(true)}
          className="px-2 py-1 text-xs bg-[#98b290] hover:bg-[#7a9274] text-white rounded transition"
          title="Add New Page"
        >
          + Add Page
        </button>
      </div>
    </div>
  )
}
