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
  is_system?: boolean
  system_type?: string
  feature_type?: string
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
  theme?: 'light' | 'dark'
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
  setShowAddPageModal,
  theme = 'light'
}) => {
  const isDark = theme === 'dark'

  // Separate regular pages from system pages
  const regularPages = template.pages.filter(p => !p.is_system)
  const systemPages = template.pages.filter(p => p.is_system)

  return (
    <div className={`border-b px-4 py-2 flex items-center justify-between ${
      isDark
        ? 'border-gray-700 bg-gray-800'
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
          Viewing page:
        </span>
        <select
          value={currentPage?.id || ''}
          onChange={(e) => {
            const selectedPage = template.pages.find(p => p.id === parseInt(e.target.value))
            if (selectedPage) setCurrentPage(selectedPage)
          }}
          className={`px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290] ${
            isDark
              ? 'border-gray-600 bg-gray-700 text-gray-200'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          {regularPages.length > 0 && (
            <optgroup label="Pages">
              {regularPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name} {page.is_homepage ? '(Home)' : ''}
                </option>
              ))}
            </optgroup>
          )}
          {systemPages.length > 0 && (
            <optgroup label="System Pages">
              {systemPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <button
          onClick={() => {
            setShowCSSPanel(true)
            setShowSectionCSS(false)
            setSelectedSection(null)
            setShowRightSidebar(true)
          }}
          className={`p-1 rounded transition ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          title="Edit Site/Page Styling"
        >
          <span className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            Site/Page Styling
          </span>
        </button>
        <button
          onClick={() => setCssInspectorMode(!cssInspectorMode)}
          className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
            cssInspectorMode
              ? 'bg-[#98b290] text-white'
              : isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
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
        {currentPage && template.pages.length > 1 && !currentPage.is_homepage && !currentPage.is_system && (
          <button
            onClick={() => handleDeletePage(currentPage.id)}
            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
            title="Delete Page"
          >
            Delete Page
          </button>
        )}
        {currentPage?.is_system && (
          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded flex items-center gap-1" title="System pages cannot be deleted">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            System Page
          </span>
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
