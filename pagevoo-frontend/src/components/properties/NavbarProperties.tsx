import React from 'react'
import NavigationTreeManager from '../NavigationTreeManager'

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
}

interface Template {
  pages?: TemplatePage[]
}

interface NavbarPropertiesProps {
  selectedSection: TemplateSection
  template: Template | null
  onUpdateContent: (sectionId: number, content: any) => void
  onOpenButtonStyleModal: () => void
}

export const NavbarProperties: React.FC<NavbarPropertiesProps> = ({
  selectedSection,
  template,
  onUpdateContent,
  onOpenButtonStyleModal
}) => {
  const handleUpdateSectionContent = (sectionId: number, content: any) => {
    onUpdateContent(sectionId, content)
  }

  return (
    <>
                        {/* Background Color */}
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Background Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedSection.content?.containerStyle?.background || '#ffffff'}
                              onChange={(e) => {
                                handleUpdateSectionContent(selectedSection.id, {
                                  ...selectedSection.content,
                                  containerStyle: {
                                    ...selectedSection.content?.containerStyle,
                                    background: e.target.value
                                  }
                                })
                              }}
                              className="w-10 h-8 rounded border border-gray-600"
                            />
                            <input
                              type="text"
                              value={selectedSection.content?.containerStyle?.background || '#ffffff'}
                              onChange={(e) => {
                                handleUpdateSectionContent(selectedSection.id, {
                                  ...selectedSection.content,
                                  containerStyle: {
                                    ...selectedSection.content?.containerStyle,
                                    background: e.target.value
                                  }
                                })
                              }}
                              className="flex-1 text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>

                        {/* Padding Controls */}
                        <div className="mb-4 border-t border-gray-600 pt-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Padding</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Top (px)</label>
                              <input
                                type="number"
                                min="0"
                                value={selectedSection.content?.containerStyle?.paddingTop?.replace('px', '') || '16'}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    containerStyle: {
                                      ...selectedSection.content?.containerStyle,
                                      paddingTop: e.target.value + 'px'
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Right (px)</label>
                              <input
                                type="number"
                                min="0"
                                value={selectedSection.content?.containerStyle?.paddingRight?.replace('px', '') || '0'}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    containerStyle: {
                                      ...selectedSection.content?.containerStyle,
                                      paddingRight: e.target.value + 'px'
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Bottom (px)</label>
                              <input
                                type="number"
                                min="0"
                                value={selectedSection.content?.containerStyle?.paddingBottom?.replace('px', '') || '16'}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    containerStyle: {
                                      ...selectedSection.content?.containerStyle,
                                      paddingBottom: e.target.value + 'px'
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Left (px)</label>
                              <input
                                type="number"
                                min="0"
                                value={selectedSection.content?.containerStyle?.paddingLeft?.replace('px', '') || '0'}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    containerStyle: {
                                      ...selectedSection.content?.containerStyle,
                                      paddingLeft: e.target.value + 'px'
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Margin Controls */}
                        <div className="mb-4 border-t border-gray-600 pt-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Margin</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Top (px)</label>
                              <input
                                type="number"
                                value={selectedSection.content?.containerStyle?.marginTop?.replace('px', '') || '0'}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    containerStyle: {
                                      ...selectedSection.content?.containerStyle,
                                      marginTop: e.target.value + 'px'
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Right (px)</label>
                              <input
                                type="number"
                                value={selectedSection.content?.containerStyle?.marginRight?.replace('px', '') || '0'}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    containerStyle: {
                                      ...selectedSection.content?.containerStyle,
                                      marginRight: e.target.value + 'px'
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Bottom (px)</label>
                              <input
                                type="number"
                                value={selectedSection.content?.containerStyle?.marginBottom?.replace('px', '') || '0'}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    containerStyle: {
                                      ...selectedSection.content?.containerStyle,
                                      marginBottom: e.target.value + 'px'
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Left (px)</label>
                              <input
                                type="number"
                                value={selectedSection.content?.containerStyle?.marginLeft?.replace('px', '') || '0'}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    containerStyle: {
                                      ...selectedSection.content?.containerStyle,
                                      marginLeft: e.target.value + 'px'
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Width Control */}
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Width</label>
                          <input
                            type="text"
                            value={selectedSection.content?.containerStyle?.width || '100%'}
                            onChange={(e) => {
                              handleUpdateSectionContent(selectedSection.id, {
                                ...selectedSection.content,
                                containerStyle: {
                                  ...selectedSection.content?.containerStyle,
                                  width: e.target.value
                                }
                              })
                            }}
                            className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                            placeholder="100% or auto or 1280px"
                          />
                        </div>

                        {/* Height Control */}
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Height</label>
                          <input
                            type="text"
                            value={selectedSection.content?.containerStyle?.height || 'auto'}
                            onChange={(e) => {
                              handleUpdateSectionContent(selectedSection.id, {
                                ...selectedSection.content,
                                containerStyle: {
                                  ...selectedSection.content?.containerStyle,
                                  height: e.target.value
                                }
                              })
                            }}
                            className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                            placeholder="auto or 80px"
                          />
                        </div>

                        {/* Position Control */}
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Position</label>
                          <select
                            value={selectedSection.content?.position || 'static'}
                            onChange={(e) => {
                              handleUpdateSectionContent(selectedSection.id, {
                                ...selectedSection.content,
                                position: e.target.value
                              })
                            }}
                            className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                          >
                            <option value="static">Static</option>
                            <option value="relative">Relative</option>
                            <option value="sticky">Sticky (stays on scroll)</option>
                            <option value="fixed">Fixed</option>
                            <option value="absolute">Absolute</option>
                          </select>
                        </div>

                        {/* Layout Controls */}
                        <div className="mb-4 border-t border-gray-600 pt-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Layout</label>

                          {/* Logo Position */}
                          <div className="mb-3">
                            <label className="text-xs text-gray-300 block mb-1">Logo Position</label>
                            <select
                              value={selectedSection.content?.layoutConfig?.logoPosition || 'left'}
                              onChange={(e) => {
                                handleUpdateSectionContent(selectedSection.id, {
                                  ...selectedSection.content,
                                  layoutConfig: {
                                    ...selectedSection.content?.layoutConfig,
                                    logoPosition: e.target.value
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

                          {/* Links Position */}
                          <div className="mb-3">
                            <label className="text-xs text-gray-300 block mb-1">Links Position</label>
                            <select
                              value={selectedSection.content?.layoutConfig?.linksPosition || 'right'}
                              onChange={(e) => {
                                handleUpdateSectionContent(selectedSection.id, {
                                  ...selectedSection.content,
                                  layoutConfig: {
                                    ...selectedSection.content?.layoutConfig,
                                    linksPosition: e.target.value
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

                          {/* Logo Width */}
                          {!(selectedSection.content?.layoutConfig?.logoPosition === 'center' &&
                             selectedSection.content?.layoutConfig?.linksPosition === 'center') && (
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Logo Width (%)</label>
                              <input
                                type="number"
                                min="10"
                                max="90"
                                value={selectedSection.content?.layoutConfig?.logoWidth || selectedSection.content?.logoWidth || 25}
                                onChange={(e) => {
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    layoutConfig: {
                                      ...selectedSection.content?.layoutConfig,
                                      logoWidth: parseInt(e.target.value)
                                    }
                                  })
                                }}
                                className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                              />
                            </div>
                          )}
                        </div>

                        {/* Link Styling */}
                        <div className="mb-4 border-t border-gray-600 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-medium text-gray-200">Link Style</label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-300">
                                {selectedSection.content?.buttonStyling?.enabled ? 'Buttons' : 'Text Links'}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedSection.content?.buttonStyling?.enabled || false}
                                  onChange={(e) => {
                                    const currentButtonStyling = selectedSection.content?.buttonStyling || {}
                                    handleUpdateSectionContent(selectedSection.id, {
                                      ...selectedSection.content,
                                      buttonStyling: {
                                        enabled: e.target.checked,
                                        backgroundColor: currentButtonStyling.backgroundColor || '#3b82f6',
                                        textColor: currentButtonStyling.textColor || '#ffffff',
                                        hoverBackgroundColor: currentButtonStyling.hoverBackgroundColor || '#2563eb',
                                        hoverTextColor: currentButtonStyling.hoverTextColor || '#ffffff',
                                        borderWidth: currentButtonStyling.borderWidth || 0,
                                        borderStyle: currentButtonStyling.borderStyle || 'solid',
                                        borderColor: currentButtonStyling.borderColor || '#3b82f6',
                                        borderRadius: currentButtonStyling.borderRadius || 4,
                                        paddingTop: currentButtonStyling.paddingTop || 8,
                                        paddingRight: currentButtonStyling.paddingRight || 16,
                                        paddingBottom: currentButtonStyling.paddingBottom || 8,
                                        paddingLeft: currentButtonStyling.paddingLeft || 16,
                                        fontSize: currentButtonStyling.fontSize || 14,
                                        fontWeight: currentButtonStyling.fontWeight || '500',
                                        marginTop: currentButtonStyling.marginTop || 5,
                                        marginRight: currentButtonStyling.marginRight || 5,
                                        marginBottom: currentButtonStyling.marginBottom || 5,
                                        marginLeft: currentButtonStyling.marginLeft || 5
                                      }
                                    })
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#98b290] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#98b290]"></div>
                              </label>
                            </div>
                          </div>

                          {selectedSection.content?.buttonStyling?.enabled && (
                            <button
                              onClick={() => onOpenButtonStyleModal()}
                              className="w-full px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded text-purple-700 text-xs font-medium transition flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                              Customize Button Style
                            </button>
                          )}

                          {!selectedSection.content?.buttonStyling?.enabled && (
                            <>
                              <div className="mb-3">
                                <label className="text-xs text-gray-300 block mb-1">Text Color</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={selectedSection.content?.linkStyling?.textColor || '#000000'}
                                    onChange={(e) => {
                                      handleUpdateSectionContent(selectedSection.id, {
                                        ...selectedSection.content,
                                        linkStyling: {
                                          ...selectedSection.content?.linkStyling,
                                          textColor: e.target.value
                                        }
                                      })
                                    }}
                                    className="w-10 h-8 rounded border border-gray-600"
                                  />
                                  <input
                                    type="text"
                                    value={selectedSection.content?.linkStyling?.textColor || '#000000'}
                                    onChange={(e) => {
                                      handleUpdateSectionContent(selectedSection.id, {
                                        ...selectedSection.content,
                                        linkStyling: {
                                          ...selectedSection.content?.linkStyling,
                                          textColor: e.target.value
                                        }
                                      })
                                    }}
                                    className="flex-1 text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>

                              <div className="mb-3">
                                <label className="text-xs text-gray-300 block mb-1">Hover Color</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={selectedSection.content?.linkStyling?.textColorHover || '#666666'}
                                    onChange={(e) => {
                                      handleUpdateSectionContent(selectedSection.id, {
                                        ...selectedSection.content,
                                        linkStyling: {
                                          ...selectedSection.content?.linkStyling,
                                          textColorHover: e.target.value
                                        }
                                      })
                                    }}
                                    className="w-10 h-8 rounded border border-gray-600"
                                  />
                                  <input
                                    type="text"
                                    value={selectedSection.content?.linkStyling?.textColorHover || '#666666'}
                                    onChange={(e) => {
                                      handleUpdateSectionContent(selectedSection.id, {
                                        ...selectedSection.content,
                                        linkStyling: {
                                          ...selectedSection.content?.linkStyling,
                                          textColorHover: e.target.value
                                        }
                                      })
                                    }}
                                    className="flex-1 text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                                    placeholder="#666666"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Navigation Links Manager */}
                        <div className="mb-4 border-t border-gray-600 pt-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Navigation Links</label>
                          <NavigationTreeManager
                            links={selectedSection.content?.links || []}
                            pages={template?.pages || []}
                            sectionType={selectedSection.type}
                            onChange={(newLinks) => {
                              handleUpdateSectionContent(selectedSection.id, {
                                ...selectedSection.content,
                                links: newLinks
                              })
                            }}
                          />
                        </div>

                        {/* Generated CSS Preview */}
                        <div className="mb-4 border-t border-gray-600 pt-4">
                          <label className="text-xs font-medium text-gray-200 block mb-2">Generated CSS Preview</label>
                          <p className="text-xs text-gray-400 mb-2">This shows the CSS generated from your settings above</p>
                          <pre className="bg-gray-700 border border-gray-600 rounded p-3 text-xs overflow-auto max-h-64 font-mono">
{(() => {
  const sectionId = selectedSection.section_id || `section-${selectedSection.id}`
  const content = selectedSection.content || {}
  let css = ''

  // Position
  if (content.position && content.position !== 'static') {
    css += `#${sectionId} {\n`
    css += `  position: ${content.position};\n`
    if (content.position === 'sticky' || content.position === 'fixed') {
      css += `  top: 0;\n`
      css += `  z-index: 100;\n`
    }
    css += `}\n\n`
  }

  // Container styling
  if (content.containerStyle) {
    const cs = content.containerStyle
    if (cs.background || cs.paddingTop || cs.paddingRight || cs.paddingBottom || cs.paddingLeft || cs.borderWidth) {
      css += `#${sectionId} {\n`
      if (cs.background) css += `  background: ${cs.background};\n`
      if (cs.paddingTop) css += `  padding-top: ${cs.paddingTop};\n`
      if (cs.paddingRight) css += `  padding-right: ${cs.paddingRight};\n`
      if (cs.paddingBottom) css += `  padding-bottom: ${cs.paddingBottom};\n`
      if (cs.paddingLeft) css += `  padding-left: ${cs.paddingLeft};\n`
      if (cs.borderWidth) css += `  border-width: ${cs.borderWidth};\n`
      if (cs.borderStyle && cs.borderStyle !== 'none') css += `  border-style: ${cs.borderStyle};\n`
      if (cs.borderColor) css += `  border-color: ${cs.borderColor};\n`
      if (cs.borderRadius) css += `  border-radius: ${cs.borderRadius};\n`
      css += `}\n\n`
    }
  }

  // Link styling
  if (content.linkStyling) {
    const ls = content.linkStyling
    if (ls.textColor || ls.bgColor) {
      css += `#${sectionId} a {\n`
      if (ls.textColor) css += `  color: ${ls.textColor};\n`
      if (ls.bgColor) css += `  background-color: ${ls.bgColor};\n`
      css += `  text-decoration: none;\n`
      css += `}\n\n`
    }
    if (ls.textColorHover || ls.bgColorHover) {
      css += `#${sectionId} a:hover {\n`
      if (ls.textColorHover) css += `  color: ${ls.textColorHover};\n`
      if (ls.bgColorHover) css += `  background-color: ${ls.bgColorHover};\n`
      css += `}\n\n`
    }
  }

  return css || '/* No custom CSS generated yet */\n/* Adjust the controls above to see CSS appear here */'
})()}
                          </pre>
                        </div>
                      </>
  )
}
