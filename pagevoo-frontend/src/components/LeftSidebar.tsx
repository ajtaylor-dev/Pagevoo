import React from 'react'
import type { ThemeColors } from '@/config/themes'

interface Section {
  type: string
  label: string
  description: string
}

interface ImportedSection {
  id: number
  name: string
  section_type: string
  preview_image?: string
  section_data: any
}

interface LeftSidebarProps {
  sidebarRef: React.RefObject<HTMLElement>
  width: number
  expandedCategories: string[]
  onToggleCategory: (category: string) => void
  coreSections: Section[]
  headerNavigationSections: Section[]
  footerSections: Section[]
  importedSections?: ImportedSection[]
  renderSectionThumbnail: (section: Section) => React.ReactNode
  renderImportedSectionThumbnail?: (section: ImportedSection) => React.ReactNode
  DraggableSectionItem: React.ComponentType<{ section: Section; children: React.ReactNode }>
  DraggableImportedSectionItem?: React.ComponentType<{ section: ImportedSection; children: React.ReactNode }>
  onRemoveImportedSection?: (sectionId: number) => void
  onMouseDown: (e: React.MouseEvent) => void
  theme: ThemeColors
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  sidebarRef,
  width,
  expandedCategories,
  onToggleCategory,
  coreSections,
  headerNavigationSections,
  footerSections,
  importedSections = [],
  renderSectionThumbnail,
  renderImportedSectionThumbnail,
  DraggableSectionItem,
  DraggableImportedSectionItem,
  onRemoveImportedSection,
  onMouseDown,
  theme
}) => {
  return (
    <>
      <aside
        ref={sidebarRef}
        style={{ width }}
        className={`${theme.sidebarBg} border-r ${theme.sidebarBorder} overflow-y-auto flex-shrink-0`}
      >
        <div className="p-3">
          {/* Section Library */}
          <h2 className={`text-xs font-semibold ${theme.sidebarHeading} uppercase mb-3`}>Section Library</h2>

          {/* Imported Sections */}
          {importedSections.length > 0 && DraggableImportedSectionItem && renderImportedSectionThumbnail && onRemoveImportedSection && (
            <div className="mb-3">
              <button
                onClick={() => onToggleCategory('imported')}
                className="w-full flex items-center justify-between px-2 py-1.5 bg-blue-700 hover:bg-blue-600 border border-blue-400 rounded text-xs font-medium text-blue-100 transition"
              >
                <span>Imported Sections ({importedSections.length})</span>
                <svg
                  className={`w-3 h-3 transition-transform text-blue-100 ${expandedCategories.includes('imported') ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {expandedCategories.includes('imported') && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {importedSections.map((section) => (
                    <DraggableImportedSectionItem key={section.id} section={section}>
                      <div className="group relative w-full">
                        <div className="cursor-grab active:cursor-grabbing" title={section.name}>
                          {renderImportedSectionThumbnail(section)}
                          <div className={`mt-1 text-[10px] ${theme.sidebarText} text-center group-hover:text-blue-400 transition truncate`}>
                            {section.name}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveImportedSection(section.id)
                          }}
                          className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          title="Remove from sidebar"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </DraggableImportedSectionItem>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Core Sections */}
          <div className="mb-3">
            <button
              onClick={() => onToggleCategory('core')}
              className={`w-full flex items-center justify-between px-2 py-1.5 ${theme.categoryBg} ${theme.categoryHover} border ${theme.sidebarBorder} rounded text-xs font-medium ${theme.categoryText} transition`}
            >
              <span>Core Sections</span>
              <svg
                className={`w-3 h-3 transition-transform ${theme.categoryIcon} ${expandedCategories.includes('core') ? 'rotate-90' : ''}`}
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
                      <div className={`mt-1 text-[10px] ${theme.sidebarText} text-center group-hover:${theme.categoryIcon} transition`}>
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
              className={`w-full flex items-center justify-between px-2 py-1.5 ${theme.categoryBg} ${theme.categoryHover} border ${theme.sidebarBorder} rounded text-xs font-medium ${theme.categoryText} transition`}
            >
              <span>Header & Navigation</span>
              <svg
                className={`w-3 h-3 transition-transform ${theme.categoryIcon} ${expandedCategories.includes('headerNav') ? 'rotate-90' : ''}`}
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
                      <div className={`mt-1 text-[10px] ${theme.sidebarText} text-center group-hover:${theme.categoryIcon} transition`}>
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
              className={`w-full flex items-center justify-between px-2 py-1.5 ${theme.categoryBg} ${theme.categoryHover} border ${theme.sidebarBorder} rounded text-xs font-medium ${theme.categoryText} transition`}
            >
              <span>Footers</span>
              <svg
                className={`w-3 h-3 transition-transform ${theme.categoryIcon} ${expandedCategories.includes('footers') ? 'rotate-90' : ''}`}
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
                      <div className={`mt-1 text-[10px] ${theme.sidebarText} text-center group-hover:${theme.categoryIcon} transition`}>
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
        className={`w-1 bg-gray-200 hover:${theme.categoryIcon} cursor-col-resize transition flex-shrink-0`}
      />
    </>
  )
}
