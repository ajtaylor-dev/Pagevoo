import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
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

interface Template {
  id: number
  name: string
  template_slug?: string
  description: string
  business_type: string
  is_active: boolean
  pages: TemplatePage[]
  preview_image: string | null
  exclusive_to: 'pro' | 'niche' | null
  technologies: string[]
  features: string[]
  custom_css?: string
}

interface SectionWrapperProps {
  section: TemplateSection
  index: number
  children: React.ReactNode
  hoveredSection: number | null
  setHoveredSection: (id: number | null) => void
  setSelectedSection: (section: any) => void
  showCSSPanel: boolean
  setShowCSSPanel: (show: boolean) => void
  cssInspectorMode: boolean
  currentPage: TemplatePage | null
  template: Template | null
  handleMoveSidebar: (id: number, direction: 'left' | 'right') => void
  handleMoveSection: (id: number, direction: 'up' | 'down') => void
  handleToggleSectionLock: (id: number) => void
  handleExportSection: (section: TemplateSection) => void
  handleDeleteSection: (id: number) => void
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  section,
  index,
  children,
  hoveredSection,
  setHoveredSection,
  setSelectedSection,
  showCSSPanel,
  setShowCSSPanel,
  cssInspectorMode,
  currentPage,
  template,
  handleMoveSidebar,
  handleMoveSection,
  handleToggleSectionLock,
  handleExportSection,
  handleDeleteSection
}) => {
  const content = section.content || {}

  // Determine section behavior based on type
  const isTopLocked = section.type === 'navbar' || section.type.startsWith('navbar-') || section.type.startsWith('header-')
  const isBottomLocked = section.type.startsWith('footer-')
  const isSidebar = section.type.startsWith('sidebar-nav-')
  const isLeftSidebar = section.type === 'sidebar-nav-left'
  const isRightSidebar = section.type === 'sidebar-nav-right'
  const isPositionLocked = isTopLocked || isBottomLocked
  const isHovered = hoveredSection === section.id

  // Special sections that cannot be exported (contact form fields, navbars, footers, etc.)
  const isSpecialSection = section.type.startsWith('contact-form-') ||
    section.type === 'form-wrap' ||
    section.type === 'navbar' ||
    section.type.startsWith('navbar-') ||
    section.type.startsWith('footer-') ||
    section.type.startsWith('header-') ||
    section.type.startsWith('sidebar-nav-')

  // Track sidebar visibility for menu-click mode
  const [sidebarVisible, setSidebarVisible] = useState(content.positioned !== 'menu-click')

  // Ref for tooltip positioning
  const sectionContainerRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipHideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update tooltip visibility with delay on mouseout
  useEffect(() => {
    if (isHovered && cssInspectorMode) {
      // Clear any pending hide timeout
      if (tooltipHideTimeoutRef.current) {
        clearTimeout(tooltipHideTimeoutRef.current)
        tooltipHideTimeoutRef.current = null
      }
      // Show tooltip immediately
      setShowTooltip(true)
    } else {
      // Hide tooltip with 500ms delay
      tooltipHideTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false)
      }, 500)
    }

    // Cleanup timeout on unmount
    return () => {
      if (tooltipHideTimeoutRef.current) {
        clearTimeout(tooltipHideTimeoutRef.current)
      }
    }
  }, [isHovered, cssInspectorMode])

  // Helper to parse CSS string and extract all property names
  const getAllProperties = () => {
    const properties = new Set<string>()

    // Site-level CSS
    if (template?.custom_css) {
      const siteProps = extractCSSProperties(template.custom_css)
      siteProps.forEach(p => properties.add(p))
    }

    // Page-level CSS
    if (currentPage?.page_css) {
      const pageProps = extractCSSProperties(currentPage.page_css)
      pageProps.forEach(p => properties.add(p))
    }

    // Section-level CSS
    const contentCss = section.content?.content_css
    const sectionCss = typeof contentCss === 'string' ? contentCss : null
    if (sectionCss) {
      const sectionProps = extractCSSProperties(sectionCss)
      sectionProps.forEach(p => properties.add(p))
    }

    return properties
  }

  const extractCSSProperties = (css: string): string[] => {
    const properties: string[] = []
    const propRegex = /([a-z-]+)\s*:\s*([^;]+);/gi
    let match
    while ((match = propRegex.exec(css)) !== null) {
      properties.push(match[1])
    }
    return properties
  }

  const getCSSPropertyValue = (css: string | undefined | null, property: string): string | null => {
    if (!css) return null
    const regex = new RegExp(`${property}\\s*:\\s*([^;]+);`, 'i')
    const match = css.match(regex)
    return match ? match[1].trim() : null
  }

  const buildInheritanceChain = (property: string) => {
    const siteCss = template?.custom_css
    const pageCss = currentPage?.page_css
    const contentCss = section.content?.content_css
    const sectionCss = typeof contentCss === 'string' ? contentCss : null

    return [
      {
        level: 'Site',
        value: getCSSPropertyValue(siteCss, property),
        color: 'text-blue-300'
      },
      {
        level: 'Page',
        value: getCSSPropertyValue(pageCss, property),
        color: 'text-purple-300'
      },
      {
        level: 'Section',
        value: getCSSPropertyValue(sectionCss, property),
        color: 'text-green-300'
      }
    ]
  }

  return (
    <div
      ref={sectionContainerRef}
      key={section.id}
      className={`relative group ${isSidebar ? 'z-20' : ''} ${section.is_locked ? 'cursor-not-allowed' : ''}`}
      onMouseEnter={() => setHoveredSection(section.id)}
      onMouseLeave={() => setHoveredSection(null)}
      onClick={(e) => {
        e.stopPropagation()
        if (!section.is_locked) {
          setSelectedSection(section)
          // Auto-close CSS panel to show section properties
          if (showCSSPanel) {
            setShowCSSPanel(false)
          }
        }
      }}
    >
      {/* Position Indicator Badge */}
      {((section.type === 'navbar' && content.position && content.position !== 'static' && content.position !== 'relative') || section.type === 'navbar-sticky' || isTopLocked || isBottomLocked) && (
        <div className="builder-ui absolute top-1 left-1 z-30 flex gap-1">
          {((section.type === 'navbar' && content.position === 'sticky') || section.type === 'navbar-sticky') && (
            <span className="builder-ui px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-full border border-purple-300">
              STICKY
            </span>
          )}
          {(section.type === 'navbar' && content.position === 'fixed') && (
            <span className="builder-ui px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full border border-blue-300">
              FIXED
            </span>
          )}
          {(section.type === 'navbar' && content.position === 'absolute') && (
            <span className="builder-ui px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-semibold rounded-full border border-yellow-300">
              ABSOLUTE
            </span>
          )}
          {(isTopLocked && section.type !== 'navbar-sticky' && section.type !== 'navbar') && (
            <span className="builder-ui px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full border border-blue-300">
              FIXED TOP
            </span>
          )}
          {isBottomLocked && (
            <span className="builder-ui px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full border border-green-300">
              FIXED BOTTOM
            </span>
          )}
        </div>
      )}

      {children}

      {/* Locked Section Overlay */}
      {section.is_locked && (
        <div className="builder-ui absolute inset-0 bg-amber-500 bg-opacity-5 pointer-events-none border-2 border-amber-400 border-dashed rounded z-10">
          <div className="builder-ui absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            LOCKED
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && (
        <div className={`builder-ui absolute top-2 ${isLeftSidebar ? 'left-2' : 'right-2'} bg-white shadow-lg rounded-lg border border-gray-200 p-2 flex items-center gap-1 z-50`}>
          <span className="builder-ui text-xs font-medium text-gray-700 mr-2 capitalize">{section.section_name || section.type}</span>

          {/* Sidebar sections: show left/right controls */}
          {isSidebar && (
            <>
              {/* Menu-click mode: show expand/collapse toggle */}
              {content.positioned === 'menu-click' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSidebarVisible(!sidebarVisible)
                  }}
                  className={`builder-ui p-1 hover:bg-[#e8f0e6] rounded transition ${sidebarVisible ? 'bg-[#d4e5d0]' : ''}`}
                  title={sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
                >
                  <svg className="builder-ui w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sidebarVisible ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveSidebar(section.id, 'left')
                }}
                disabled={isLeftSidebar}
                className="builder-ui p-1 hover:bg-[#e8f0e6] rounded disabled:opacity-30 transition"
                title="Move to Left"
              >
                <svg className="builder-ui w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveSidebar(section.id, 'right')
                }}
                disabled={isRightSidebar}
                className="builder-ui p-1 hover:bg-[#e8f0e6] rounded disabled:opacity-30 transition"
                title="Move to Right"
              >
                <svg className="builder-ui w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Normal sections: show up/down controls */}
          {!isSidebar && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveSection(section.id, 'up')
                }}
                disabled={index === 0}
                className="builder-ui p-1 hover:bg-[#e8f0e6] rounded disabled:opacity-30 transition"
                title="Move Up"
              >
                <svg className="builder-ui w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveSection(section.id, 'down')
                }}
                disabled={index === (currentPage?.sections.length || 0) - 1}
                className="builder-ui p-1 hover:bg-[#e8f0e6] rounded disabled:opacity-30 transition"
                title="Move Down"
              >
                <svg className="builder-ui w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </>
          )}

          {/* Edit lock toggle - available for all sections */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleSectionLock(section.id)
            }}
            className={`builder-ui p-1 hover:bg-[#e8f0e6] rounded transition ${section.is_locked ? 'bg-amber-50' : ''}`}
            title={section.is_locked ? 'Unlock Editing' : 'Lock Editing'}
          >
            <svg className={`builder-ui w-4 h-4 ${section.is_locked ? 'text-amber-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {section.is_locked ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              )}
            </svg>
          </button>

          {/* Export to Library button - hidden for special sections */}
          {!isSpecialSection && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleExportSection(section)
              }}
              className="builder-ui p-1 hover:bg-[#e8f0e6] rounded transition"
              title="Export to Library"
            >
              <svg className="builder-ui w-4 h-4 text-[#98b290]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteSection(section.id)
            }}
            className="builder-ui p-1 hover:bg-red-50 rounded transition ml-1"
            title="Delete"
          >
            <svg className="builder-ui w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* CSS Inspector Tooltip - Rendered via Portal */}
      {cssInspectorMode && showTooltip && (() => {
        const contentCss = section.content?.content_css
        const sectionCss = typeof contentCss === 'string' ? contentCss : (contentCss && !contentCss.rows && !contentCss.columns ? JSON.stringify(contentCss, null, 2) : null)
        const hasRows = contentCss?.rows && Object.keys(contentCss.rows).length > 0
        const hasColumns = contentCss?.columns && Object.keys(contentCss.columns).length > 0

        // Check for navbar-specific styling
        const containerStyle = section.content?.containerStyle
        const linkStyling = section.content?.linkStyling
        const activeIndicator = section.content?.activeIndicator
        const dropdownConfig = section.content?.dropdownConfig

        const hasNavbarStyling = containerStyle || linkStyling || activeIndicator || dropdownConfig

        if (!sectionContainerRef.current) return null

        const rect = sectionContainerRef.current.getBoundingClientRect()
        const tooltipTop = rect.top + window.scrollY
        const tooltipLeft = rect.right + 10 + window.scrollX

        return createPortal(
          <div
            className="fixed bg-gray-900 bg-opacity-95 text-white p-4 rounded-lg shadow-2xl border border-gray-700 max-w-md overflow-auto z-[9999]"
            style={{
              top: `${tooltipTop}px`,
              left: `${tooltipLeft}px`,
              maxHeight: '600px'
            }}
          >
            <div className="text-xs font-bold text-yellow-400 mb-2">
              Section: {section.section_name || section.type}
            </div>

            {/* Navbar-specific styling sections */}
            {hasNavbarStyling && (
              <div className="mb-3 pb-3 border-b border-gray-700">
                <span className="text-xs font-bold text-cyan-300">Navbar Styling:</span>

                {containerStyle && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Container:</span>
                    <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                      {JSON.stringify(containerStyle, null, 2)}
                    </pre>
                  </div>
                )}

                {linkStyling && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Links:</span>
                    <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                      {JSON.stringify(linkStyling, null, 2)}
                    </pre>
                  </div>
                )}

                {activeIndicator && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Active Indicator:</span>
                    <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                      {`Type: ${activeIndicator.type || 'none'}\nColor: ${activeIndicator.color || 'transparent'}\n${activeIndicator.type === 'underline' ? `Thickness: ${activeIndicator.thickness || 2}px` : ''}`}
                    </pre>
                  </div>
                )}

                {dropdownConfig && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Dropdown:</span>
                    <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                      {`Trigger: click (always)\nTransition: ${dropdownConfig.transitionDuration || 200}ms`}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Custom Section CSS */}
            {sectionCss && (
              <div className={hasNavbarStyling ? 'pt-3 border-t border-gray-700' : ''}>
                <span className="text-xs font-bold text-yellow-300">Custom Section CSS:</span>
                <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 mt-1">
                  {sectionCss}
                </pre>
              </div>
            )}

            {hasRows && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <span className="text-xs font-bold text-blue-300">Row CSS:</span>
                {Object.entries(contentCss.rows).map(([rowIdx, css]: [string, any]) => (
                  <div key={rowIdx} className="mt-2">
                    <span className="text-xs text-gray-400">Row {parseInt(rowIdx) + 1}:</span>
                    <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                      {css || '/* No CSS */'}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {hasColumns && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <span className="text-xs font-bold text-purple-300">Column CSS:</span>
                {Object.entries(contentCss.columns).map(([colIdx, css]: [string, any]) => (
                  <div key={colIdx} className="mt-2">
                    <span className="text-xs text-gray-400">Column {parseInt(colIdx) + 1}:</span>
                    <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                      {css || '/* No CSS */'}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* CSS Cascade / Inheritance Chain */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <span className="text-xs font-bold text-orange-300">CSS Cascade (Inheritance Chain):</span>
              <div className="mt-2 text-[10px] text-gray-400 italic">
                Shows how properties cascade from Site → Page → Section
              </div>
              <div className="mt-3 space-y-3">
                {Array.from(getAllProperties()).sort().map(property => {
                  const chain = buildInheritanceChain(property)
                  // Find the effective value (last non-null in chain)
                  const effectiveValue = [...chain].reverse().find(c => c.value !== null)
                  const hasOverride = chain.filter(c => c.value !== null).length > 1

                  return (
                    <div key={property} className="bg-gray-800 bg-opacity-50 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">{property}:</span>
                        {hasOverride && (
                          <span className="text-[9px] bg-red-500 bg-opacity-20 text-red-300 px-1.5 py-0.5 rounded">
                            OVERRIDE
                          </span>
                        )}
                      </div>
                      {chain.map((item, idx) => {
                        const isEffective = item.value !== null && item.value === effectiveValue?.value
                        return (
                          <div key={idx} className={`flex items-center gap-2 text-[10px] ml-2 ${item.value === null ? 'opacity-40' : ''}`}>
                            <span className="text-gray-500 w-16">{item.level}:</span>
                            {item.value !== null ? (
                              <>
                                <span className={`${item.color} ${isEffective ? 'font-bold' : ''}`}>
                                  {item.value}
                                </span>
                                {isEffective && (
                                  <span className="text-green-400 text-[8px]">← APPLIED</span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-600 italic">—</span>
                            )}
                          </div>
                        )
                      })}
                      <div className="mt-1 pt-1 border-t border-gray-700 flex items-center gap-2 text-[10px]">
                        <span className="text-gray-500">Computed:</span>
                        <span className="text-yellow-400 font-bold">
                          {effectiveValue?.value || 'default'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body
        )
      })()}
    </div>
  )
}
