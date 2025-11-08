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

interface ButtonStyleModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSection: TemplateSection | null
  onUpdateContent: (sectionId: number, content: any) => void
}

export const ButtonStyleModal: React.FC<ButtonStyleModalProps> = ({
  isOpen,
  onClose,
  selectedSection,
  onUpdateContent
}) => {
  if (!isOpen || !selectedSection) return null

  const handleUpdateSectionContent = (sectionId: number, content: any) => {
    onUpdateContent(sectionId, content)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customize Button Style</h2>

        {/* Live Preview */}
        <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-3">Preview:</p>
          <div className="flex items-center justify-center">
            <button
              style={{
                backgroundColor: selectedSection.content?.buttonStyling?.backgroundColor || '#3b82f6',
                color: selectedSection.content?.buttonStyling?.textColor || '#ffffff',
                borderWidth: `${selectedSection.content?.buttonStyling?.borderWidth || 0}px`,
                borderStyle: selectedSection.content?.buttonStyling?.borderStyle || 'solid',
                borderColor: selectedSection.content?.buttonStyling?.borderColor || '#3b82f6',
                borderRadius: `${selectedSection.content?.buttonStyling?.borderRadius || 4}px`,
                paddingTop: `${selectedSection.content?.buttonStyling?.paddingTop || 8}px`,
                paddingRight: `${selectedSection.content?.buttonStyling?.paddingRight || 16}px`,
                paddingBottom: `${selectedSection.content?.buttonStyling?.paddingBottom || 8}px`,
                paddingLeft: `${selectedSection.content?.buttonStyling?.paddingLeft || 16}px`,
                fontSize: `${selectedSection.content?.buttonStyling?.fontSize || 14}px`,
                fontWeight: selectedSection.content?.buttonStyling?.fontWeight || '500',
                marginTop: `${selectedSection.content?.buttonStyling?.marginTop || 5}px`,
                marginRight: `${selectedSection.content?.buttonStyling?.marginRight || 5}px`,
                marginBottom: `${selectedSection.content?.buttonStyling?.marginBottom || 5}px`,
                marginLeft: `${selectedSection.content?.buttonStyling?.marginLeft || 5}px`,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sample Button
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedSection.content?.buttonStyling?.backgroundColor || '#3b82f6'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      backgroundColor: e.target.value
                    }
                  })
                }}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={selectedSection.content?.buttonStyling?.backgroundColor || '#3b82f6'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      backgroundColor: e.target.value
                    }
                  })
                }}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedSection.content?.buttonStyling?.textColor || '#ffffff'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      textColor: e.target.value
                    }
                  })
                }}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={selectedSection.content?.buttonStyling?.textColor || '#ffffff'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      textColor: e.target.value
                    }
                  })
                }}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hover Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedSection.content?.buttonStyling?.hoverBackgroundColor || '#2563eb'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      hoverBackgroundColor: e.target.value
                    }
                  })
                }}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={selectedSection.content?.buttonStyling?.hoverBackgroundColor || '#2563eb'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      hoverBackgroundColor: e.target.value
                    }
                  })
                }}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hover Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedSection.content?.buttonStyling?.hoverTextColor || '#ffffff'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      hoverTextColor: e.target.value
                    }
                  })
                }}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={selectedSection.content?.buttonStyling?.hoverTextColor || '#ffffff'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      hoverTextColor: e.target.value
                    }
                  })
                }}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
          </div>

          {/* Border */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Width (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.borderWidth || 0}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    borderWidth: parseInt(e.target.value) || 0
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Style</label>
            <select
              value={selectedSection.content?.buttonStyling?.borderStyle || 'solid'}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    borderStyle: e.target.value
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedSection.content?.buttonStyling?.borderColor || '#3b82f6'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      borderColor: e.target.value
                    }
                  })
                }}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={selectedSection.content?.buttonStyling?.borderColor || '#3b82f6'}
                onChange={(e) => {
                  handleUpdateSectionContent(selectedSection.id, {
                    ...selectedSection.content,
                    buttonStyling: {
                      ...selectedSection.content?.buttonStyling,
                      borderColor: e.target.value
                    }
                  })
                }}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.borderRadius || 4}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    borderRadius: parseInt(e.target.value) || 0
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          {/* Padding */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Padding Top (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.paddingTop || 8}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    paddingTop: parseInt(e.target.value) || 0
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Padding Right (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.paddingRight || 16}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    paddingRight: parseInt(e.target.value) || 0
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Padding Bottom (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.paddingBottom || 8}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    paddingBottom: parseInt(e.target.value) || 0
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Padding Left (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.paddingLeft || 16}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    paddingLeft: parseInt(e.target.value) || 0
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          {/* Typography */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Size (px)</label>
            <input
              type="number"
              min="8"
              value={selectedSection.content?.buttonStyling?.fontSize || 14}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    fontSize: parseInt(e.target.value) || 14
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
            <select
              value={selectedSection.content?.buttonStyling?.fontWeight || '500'}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    fontWeight: e.target.value
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            >
              <option value="300">Light (300)</option>
              <option value="400">Normal (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semibold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">Extra Bold (800)</option>
            </select>
          </div>

          {/* Margin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Margin Top (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.marginTop || 5}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    marginTop: parseInt(e.target.value) || 5
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Margin Right (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.marginRight || 5}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    marginRight: parseInt(e.target.value) || 5
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Margin Bottom (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.marginBottom || 5}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    marginBottom: parseInt(e.target.value) || 5
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Margin Left (px)</label>
            <input
              type="number"
              min="0"
              value={selectedSection.content?.buttonStyling?.marginLeft || 5}
              onChange={(e) => {
                handleUpdateSectionContent(selectedSection.id, {
                  ...selectedSection.content,
                  buttonStyling: {
                    ...selectedSection.content?.buttonStyling,
                    marginLeft: parseInt(e.target.value) || 5
                  }
                })
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
