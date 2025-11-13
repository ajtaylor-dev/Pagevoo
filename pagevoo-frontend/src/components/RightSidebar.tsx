import React from 'react'
import { StyleEditor } from './StyleEditor'
import GridProperties from './properties/GridProperties'
import { NavbarProperties } from './properties/NavbarProperties'
import { FooterProperties } from './properties/FooterProperties'

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
  sections: TemplateSection[]
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
  pages: TemplatePage[]
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

interface RightSidebarProps {
  sidebarRef: React.RefObject<HTMLElement>
  width: number
  onMouseDown: (e: React.MouseEvent) => void
  showCSSPanel: boolean
  cssTab: 'site' | 'page'
  setCssTab: (tab: 'site' | 'page') => void
  template: Template | null
  setTemplate: (template: Template) => void
  templateRef: React.MutableRefObject<Template | null>
  addToHistory: (template: Template) => void
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage) => void
  setShowCSSPanel: (show: boolean) => void
  selectedSection: TemplateSection | null
  setSelectedSection: (section: TemplateSection | null) => void
  handleToggleSectionLock: (sectionId: number) => void
  generateIdentifier: (name: string) => string
  showSectionCSS: boolean
  setShowSectionCSS: (show: boolean) => void
  setShowContentStyle: (show: boolean) => void
  handleUpdateSectionContent: (sectionId: number, content: any) => void
  showRowStyle: boolean
  setShowRowStyle: (show: boolean) => void
  expandedColumnIndex: number | null
  setExpandedColumnIndex: (index: number | null) => void
  setShowNavButtonStyleModal: (show: boolean) => void
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  sidebarRef,
  width,
  onMouseDown,
  showCSSPanel,
  cssTab,
  setCssTab,
  template,
  setTemplate,
  templateRef,
  addToHistory,
  currentPage,
  setCurrentPage,
  setShowCSSPanel,
  selectedSection,
  setSelectedSection,
  handleToggleSectionLock,
  generateIdentifier,
  showSectionCSS,
  setShowSectionCSS,
  setShowContentStyle,
  handleUpdateSectionContent,
  showRowStyle,
  setShowRowStyle,
  expandedColumnIndex,
  setExpandedColumnIndex,
  setShowNavButtonStyleModal
}) => {
  return (
    <>
      {/* Right Resize Handle */}
      <div
        onMouseDown={onMouseDown}
        className="w-1 bg-gray-200 hover:bg-[#98b290] cursor-col-resize transition flex-shrink-0"
      />

      <aside
        ref={sidebarRef}
        style={{ width }}
        className="bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0"
      >
        <div className="p-3">
          <h2 className="text-xs font-semibold text-[#98b290] uppercase mb-3">
            {showCSSPanel ? 'CSS Editor' : 'Properties'}
          </h2>
          {showCSSPanel ? (
            <div className="space-y-3">
              {/* CSS Tabs */}
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setCssTab('site')}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                    cssTab === 'site'
                      ? 'bg-gray-700 text-[#98b290] border-b-2 border-[#98b290]'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Site CSS
                </button>
                <button
                  onClick={() => setCssTab('page')}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                    cssTab === 'page'
                      ? 'bg-gray-700 text-[#98b290] border-b-2 border-[#98b290]'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Page CSS
                </button>
              </div>

              {/* CSS Content */}
              {cssTab === 'site' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">
                    Global Stylesheet
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">
                    CSS applied to all pages in this template
                  </p>
                  <StyleEditor
                    value={template?.custom_css || ''}
                    onChange={(css) => {
                      console.log('[Site CSS onChange #2] New CSS:', css)
                      const updatedTemplate = { ...template!, custom_css: css }
                      setTemplate(updatedTemplate)
                      templateRef.current = updatedTemplate
                      addToHistory(updatedTemplate)
                    }}
                    context="page"
                    showFontSelector={true}
                    showBodyLabel={true}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">
                    Page-Specific CSS
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">
                    CSS applied only to {currentPage?.name || 'this page'}
                  </p>
                  <StyleEditor
                    value={currentPage?.page_css || ''}
                    onChange={(css) => {
                      if (!template || !currentPage) return
                      const updatedPages = template.pages.map(p =>
                        p.id === currentPage.id ? { ...p, page_css: css } : p
                      )
                      const updatedTemplate = { ...template, pages: updatedPages }
                      setTemplate(updatedTemplate)
                      templateRef.current = updatedTemplate
                      setCurrentPage({ ...currentPage, page_css: css })
                      addToHistory(updatedTemplate)
                    }}
                    context="page"
                    showBodyLabel={true}
                    galleryImages={template?.images}
                    siteCSS={template?.custom_css || ''}
                  />
                </div>
              )}

              <button
                onClick={() => setShowCSSPanel(false)}
                className="w-full px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs transition"
              >
                Close CSS Editor
              </button>
            </div>
          ) : selectedSection ? (
            selectedSection.is_locked ? (
              <div className="space-y-3">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 text-center">
                  <svg className="w-12 h-12 text-amber-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-amber-800 mb-1">Section Locked</h3>
                  <p className="text-xs text-amber-600 mb-3">
                    This section is locked and cannot be edited.
                  </p>
                  <button
                    onClick={() => handleToggleSectionLock(selectedSection.id)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs transition"
                  >
                    Unlock Section
                  </button>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p><strong>Section:</strong> {selectedSection.section_name || selectedSection.type}</p>
                  <p><strong>ID:</strong> {selectedSection.section_id || 'Not set'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Section Name</label>
                  <div className="flex gap-1 mb-2">
                    <input
                      type="text"
                      value={selectedSection.section_name || selectedSection.type}
                      onChange={(e) => {
                      const newName = e.target.value
                      const updatedSection = {
                        ...selectedSection,
                        section_name: newName,
                        section_id: selectedSection.section_id || generateIdentifier(newName)
                      }
                      setSelectedSection(updatedSection)
                      if (template && currentPage) {
                        const updatedPages = template.pages.map(p => {
                          if (p.id === currentPage.id) {
                            return {
                              ...p,
                              sections: p.sections.map(s =>
                                s.id === selectedSection.id ? updatedSection : s
                              )
                            }
                          }
                          return p
                        })
                        const updatedTemplate = { ...template, pages: updatedPages }
                        setTemplate(updatedTemplate)
                        templateRef.current = updatedTemplate
                        setCurrentPage({
                          ...currentPage,
                          sections: currentPage.sections.map(s =>
                            s.id === selectedSection.id ? updatedSection : s
                          )
                        })
                        addToHistory(updatedTemplate)
                      }
                    }}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                    placeholder="Enter section name"
                  />
                  <button
                    onClick={() => {
                      const newId = generateIdentifier(selectedSection.section_name || selectedSection.type)
                      const updatedSection = {
                        ...selectedSection,
                        section_id: newId
                      }
                      setSelectedSection(updatedSection)
                      if (template && currentPage) {
                        const updatedPages = template.pages.map(p => {
                          if (p.id === currentPage.id) {
                            return {
                              ...p,
                              sections: p.sections.map(s =>
                                s.id === selectedSection.id ? updatedSection : s
                              )
                            }
                          }
                          return p
                        })
                        const updatedTemplate = { ...template, pages: updatedPages }
                        setTemplate(updatedTemplate)
                        templateRef.current = updatedTemplate
                        setCurrentPage({
                          ...currentPage,
                          sections: currentPage.sections.map(s =>
                            s.id === selectedSection.id ? updatedSection : s
                          )
                        })
                        addToHistory(updatedTemplate)
                      }
                    }}
                    className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition"
                    title="Generate new ID from section name"
                  >
                    Apply
                  </button>
                </div>
                <div className="px-2 py-1 bg-blue-50 rounded text-[10px] font-mono text-blue-700">
                  <span className="font-semibold">ID:</span> {selectedSection.section_id || 'Not set'}
                </div>
                <p className="text-[9px] text-gray-400">Use this ID in CSS: #{selectedSection.section_id}</p>

                {/* Section Styling button - hidden for navbar and footer sections */}
                {selectedSection.type !== 'navbar' && !selectedSection.type.startsWith('footer-') && (
                  <button
                    onClick={() => {
                      setShowSectionCSS(!showSectionCSS)
                      setShowContentStyle(false)
                      setShowCSSPanel(false)
                    }}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                    title="Edit Section Styling"
                  >
                    Section Styling
                  </button>
                )}
              </div>

              <div className="border-t border-gray-200 pt-2">
                <div className="text-[10px] text-gray-400 mb-1">Section Type:</div>
                <div className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-gray-200">
                  {selectedSection.type}
                </div>
              </div>

              {showSectionCSS ? (
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">
                    Section-Specific CSS
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">
                    CSS applied only to this {selectedSection.type} section
                  </p>
                  <StyleEditor
                    value={selectedSection.content?.section_css || ''}
                    onChange={(css) =>
                      handleUpdateSectionContent(selectedSection.id, {
                        ...selectedSection.content,
                        section_css: css
                      })
                    }
                    context="section"
                    galleryImages={template?.images}
                    siteCSS={template?.custom_css || ''}
                    pageCSS={currentPage?.page_css || ''}
                  />
                  <button
                    onClick={() => setShowSectionCSS(false)}
                    className="w-full px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs transition mt-3"
                  >
                    Back to Properties
                  </button>
                </div>
              ) : (
                <>
                  {/* Grid Section Fields */}
                  {selectedSection.type.startsWith('grid-') && (
                    <GridProperties
                      selectedSection={selectedSection}
                      template={template}
                      currentPage={currentPage}
                      showRowStyle={showRowStyle}
                      setShowRowStyle={setShowRowStyle}
                      expandedColumnIndex={expandedColumnIndex}
                      setExpandedColumnIndex={setExpandedColumnIndex}
                      onUpdateContent={handleUpdateSectionContent}
                    />
                  )}
              {/* Navigation Section Controls */}
              {selectedSection.type === 'navbar' && (
                <NavbarProperties
                  selectedSection={selectedSection}
                  template={template}
                  onUpdateContent={handleUpdateSectionContent}
                  onOpenButtonStyleModal={() => setShowNavButtonStyleModal(true)}
                />
              )}

              {/* Footer Section Controls */}
              {(selectedSection.type === 'footer-simple' || selectedSection.type === 'footer-columns' || selectedSection.type.startsWith('navbar-')) && (
                <FooterProperties
                  selectedSection={selectedSection}
                  onUpdateContent={handleUpdateSectionContent}
                />
              )}
                </>
              )}
            </div>
            )
          ) : (
            <div className="text-xs text-gray-500 text-center py-8">
              Click a section in the canvas to edit its properties
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
