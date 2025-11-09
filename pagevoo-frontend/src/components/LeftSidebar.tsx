import React from 'react'

interface Section {
  type: string
  label: string
  description: string
}

interface LeftSidebarProps {
  sidebarRef: React.RefObject<HTMLElement>
  width: number
  expandedCategories: string[]
  onToggleCategory: (category: string) => void
  coreSections: Section[]
  headerNavigationSections: Section[]
  footerSections: Section[]
  renderSectionThumbnail: (section: Section) => React.ReactNode
  DraggableSectionItem: React.ComponentType<{ section: Section; children: React.ReactNode }>
  onMouseDown: (e: React.MouseEvent) => void
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  sidebarRef,
  width,
  expandedCategories,
  onToggleCategory,
  coreSections,
  headerNavigationSections,
  footerSections,
  renderSectionThumbnail,
  DraggableSectionItem,
  onMouseDown
}) => {
  return (
    <>
      <aside
        ref={sidebarRef}
        style={{ width }}
        className="bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0"
      >
        <div className="p-3">
          {/* Section Library */}
          <h2 className="text-xs font-semibold text-[#5a7a54] uppercase mb-3">Section Library</h2>

          {/* Core Sections */}
          <div className="mb-3">
            <button
              onClick={() => onToggleCategory('core')}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] hover:from-[#d4e5d0] hover:to-[#c1d9bc] border border-[#98b290] rounded text-xs font-medium text-[#5a7a54] transition"
            >
              <span>Core Sections</span>
              <svg
                className={`w-3 h-3 transition-transform text-[#5a7a54] ${expandedCategories.includes('core') ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {expandedCategories.includes('core') && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {coreSections.map((section) => (
                  <DraggableSectionItem key={section.type} section={section}>
                    <div
                      className="group relative w-full cursor-grab active:cursor-grabbing"
                      title={section.description}
                    >
                      {renderSectionThumbnail(section)}
                      <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-[#5a7a54] transition">
                        {section.label}
                      </div>
                    </div>
                  </DraggableSectionItem>
                ))}
              </div>
            )}
          </div>

          {/* Header & Navigation Sections */}
          <div className="mb-3">
            <button
              onClick={() => onToggleCategory('headerNav')}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] hover:from-[#d4e5d0] hover:to-[#c1d9bc] border border-[#98b290] rounded text-xs font-medium text-[#5a7a54] transition"
            >
              <span>Header & Navigation</span>
              <svg
                className={`w-3 h-3 transition-transform text-[#5a7a54] ${expandedCategories.includes('headerNav') ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {expandedCategories.includes('headerNav') && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {headerNavigationSections.map((section) => (
                  <DraggableSectionItem key={section.type} section={section}>
                    <div
                      className="group relative w-full cursor-grab active:cursor-grabbing"
                      title={section.description}
                    >
                      {renderSectionThumbnail(section)}
                      <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-[#5a7a54] transition">
                        {section.label}
                      </div>
                    </div>
                  </DraggableSectionItem>
                ))}
              </div>
            )}
          </div>

          {/* Footer Sections */}
          <div className="mb-3">
            <button
              onClick={() => onToggleCategory('footers')}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] hover:from-[#d4e5d0] hover:to-[#c1d9bc] border border-[#98b290] rounded text-xs font-medium text-[#5a7a54] transition"
            >
              <span>Footers</span>
              <svg
                className={`w-3 h-3 transition-transform text-[#5a7a54] ${expandedCategories.includes('footers') ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {expandedCategories.includes('footers') && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {footerSections.map((section) => (
                  <DraggableSectionItem key={section.type} section={section}>
                    <div
                      className="group relative w-full cursor-grab active:cursor-grabbing"
                      title={section.description}
                    >
                      {renderSectionThumbnail(section)}
                      <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-[#5a7a54] transition">
                        {section.label}
                      </div>
                    </div>
                  </DraggableSectionItem>
                ))}
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* Left Resize Handle */}
      <div
        onMouseDown={onMouseDown}
        className="w-1 bg-gray-200 hover:bg-[#98b290] cursor-col-resize transition flex-shrink-0"
      />
    </>
  )
}
