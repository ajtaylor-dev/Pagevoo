import React from 'react'
import { StyleEditor } from '@/components/StyleEditor'

interface Template {
  id: number
  name: string
  description: string
  business_type: string
  exclusive_to: 'pro' | 'niche' | null
  technologies?: string[]
  features?: string[]
  custom_css?: string
  preview_image?: string
  pages: TemplatePage[]
}

interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  meta_description?: string
}

interface User {
  name: string
}

interface HeaderProps {
  // Menu visibility state
  showFileMenu: boolean
  setShowFileMenu: (show: boolean) => void
  showEditMenu: boolean
  setShowEditMenu: (show: boolean) => void
  showViewMenu: boolean
  setShowViewMenu: (show: boolean) => void
  showInsertMenu: boolean
  setShowInsertMenu: (show: boolean) => void

  // Edit menu sub-tab
  editSubTab: 'settings' | 'css' | 'page'
  setEditSubTab: (tab: 'settings' | 'css' | 'page') => void

  // Undo/Redo state
  canUndo: boolean
  canRedo: boolean
  hasUnsavedChanges: boolean

  // Template and page data
  template: Template
  setTemplate: (template: Template) => void
  currentPage: TemplatePage | null

  // User data
  user: User | null

  // Refs
  fileMenuRef: React.RefObject<HTMLDivElement>
  editMenuRef: React.RefObject<HTMLDivElement>
  viewMenuRef: React.RefObject<HTMLDivElement>
  insertMenuRef: React.RefObject<HTMLDivElement>
  templateRef: React.MutableRefObject<Template | null>
  imageGalleryRef: React.MutableRefObject<boolean>

  // File menu handlers
  handleNew: () => void
  handleSave: () => void
  handleSaveAs: () => void
  handleLoad: () => void
  handleExportAsHTMLTemplate: () => void
  handleExit: () => void

  // Edit menu handlers
  handleUndo: () => void
  handleRedo: () => void
  handleOpenEditPageModal: () => void
  handleCopyPage: () => void
  handleDeletePage: (pageId: number) => void
  addToHistory: (template: Template) => void

  // View menu handlers
  handleLivePreview: () => void
  setShowSourceCodeModal: (show: boolean) => void
  setShowStylesheetModal: (show: boolean) => void
  setShowSitemapModal: (show: boolean) => void

  // Insert menu handlers
  setShowAddPageModal: (show: boolean) => void

  // Image gallery
  setShowImageGallery: (show: boolean | ((prev: boolean) => boolean)) => void
  uploadingImage: boolean
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const Header: React.FC<HeaderProps> = ({
  showFileMenu,
  setShowFileMenu,
  showEditMenu,
  setShowEditMenu,
  showViewMenu,
  setShowViewMenu,
  showInsertMenu,
  setShowInsertMenu,
  editSubTab,
  setEditSubTab,
  canUndo,
  canRedo,
  hasUnsavedChanges,
  template,
  setTemplate,
  currentPage,
  user,
  fileMenuRef,
  editMenuRef,
  viewMenuRef,
  insertMenuRef,
  templateRef,
  imageGalleryRef,
  handleNew,
  handleSave,
  handleSaveAs,
  handleLoad,
  handleExportAsHTMLTemplate,
  handleExit,
  handleUndo,
  handleRedo,
  handleOpenEditPageModal,
  handleCopyPage,
  handleDeletePage,
  addToHistory,
  handleLivePreview,
  setShowSourceCodeModal,
  setShowStylesheetModal,
  setShowSitemapModal,
  setShowAddPageModal,
  setShowImageGallery,
  uploadingImage,
  handleImageUpload
}) => {
  return (
    <header className="bg-white border-b border-gray-200 flex items-center h-9 shadow-sm">
      {/* Left Section - Logo & Menus */}
      <div className="flex items-center h-full">
        <div className="px-3 flex items-center space-x-2 border-r border-gray-200 h-full">
          <img src="/Pagevoo_logo_500x200.png" alt="Pagevoo" className="h-4" />
        </div>
        <div className="flex items-center h-full text-xs relative">
          <div className="relative" ref={fileMenuRef}>
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              onMouseEnter={() => {
                if (showEditMenu || showInsertMenu) {
                  setShowEditMenu(false)
                  setShowInsertMenu(false)
                  setShowFileMenu(true)
                }
              }}
              className="px-3 h-full hover:bg-[#e8f0e6] transition"
            >
              File
            </button>
            {showFileMenu && (
              <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-48">
                <button
                  onClick={() => {
                    handleNew()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs flex items-center justify-between"
                >
                  <span>New</span>
                  <span className="text-gray-400 text-[10px]">Ctrl+N</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    handleSave()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs flex items-center justify-between"
                >
                  <span>Save</span>
                  <span className="text-gray-400 text-[10px]">Ctrl+S</span>
                </button>
                <button
                  onClick={() => {
                    handleSaveAs()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
                >
                  Save As...
                </button>
                <button
                  onClick={() => {
                    handleLoad()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs flex items-center justify-between"
                >
                  <span>Load</span>
                  <span className="text-gray-400 text-[10px]">Ctrl+O</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="relative group">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs flex items-center justify-between">
                    <span>Export As</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute left-full top-0 ml-0 bg-white border border-gray-200 shadow-lg z-50 w-48 hidden group-hover:block">
                    <button
                      onClick={() => {
                        handleExportAsHTMLTemplate()
                        setShowFileMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#e8f0e6] text-xs font-medium text-[#5a7a54]"
                    >
                      HTML Template (Publish)
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        alert('ZIP Website export coming soon!')
                        setShowFileMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs text-gray-500"
                    >
                      .ZIP Website
                    </button>
                    <button
                      onClick={() => {
                        alert('React Website export coming soon!')
                        setShowFileMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs text-gray-500"
                    >
                      React Website
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    handleExit()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
                >
                  Exit
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={editMenuRef}>
            <button
              onClick={() => setShowEditMenu(!showEditMenu)}
              onMouseEnter={() => {
                if (showFileMenu || showInsertMenu) {
                  setShowFileMenu(false)
                  setShowInsertMenu(false)
                  setShowEditMenu(true)
                }
              }}
              className="px-3 h-full hover:bg-[#e8f0e6] transition"
            >
              Edit
            </button>
            {showEditMenu && template && (
              <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-80">
                {/* Undo/Redo buttons */}
                <div className="flex items-center gap-1 px-2 py-2 border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      handleUndo()
                      setShowEditMenu(false)
                    }}
                    disabled={!canUndo}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 text-xs rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition"
                    title="Undo (Ctrl+Z)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={() => {
                      handleRedo()
                      setShowEditMenu(false)
                    }}
                    disabled={!canRedo}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 text-xs rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition"
                    title="Redo (Ctrl+Y)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                    </svg>
                    <span>Redo</span>
                  </button>
                </div>
                {/* Sub-navigation Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setEditSubTab('settings')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                      editSubTab === 'settings'
                        ? 'bg-[#e8f0e6] text-[#5a7a54] border-b-2 border-[#98b290]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Template Settings
                  </button>
                  <button
                    onClick={() => setEditSubTab('css')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                      editSubTab === 'css'
                        ? 'bg-[#e8f0e6] text-[#5a7a54] border-b-2 border-[#98b290]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Site CSS
                  </button>
                  <button
                    onClick={() => setEditSubTab('page')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                      editSubTab === 'page'
                        ? 'bg-[#e8f0e6] text-[#5a7a54] border-b-2 border-[#98b290]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Edit Page
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {editSubTab === 'page' ? (
                    <>
                      {/* Edit Page Tab */}
                      {currentPage ? (
                        <>
                          <div className="text-xs text-gray-600 mb-3">
                            Current Page: <span className="font-medium">{currentPage.name}</span>
                          </div>
                          <button
                            onClick={handleOpenEditPageModal}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-xs rounded border border-gray-200"
                          >
                            Rename Page & Edit Meta
                          </button>
                          <button
                            onClick={handleCopyPage}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-xs rounded border border-gray-200"
                          >
                            Copy Page
                          </button>
                          {template.pages.length > 1 && (
                            <button
                              onClick={() => {
                                handleDeletePage(currentPage.id)
                                setShowEditMenu(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-xs rounded border border-red-200"
                            >
                              Delete Page
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-500">No page selected</div>
                      )}
                    </>
                  ) : editSubTab === 'settings' ? (
                  <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Preview Image
                    </label>
                    {template.preview_image && (
                      <div className="mb-2">
                        <img
                          src={`http://localhost:8000/storage/${template.preview_image}`}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded border border-gray-300"
                        />
                      </div>
                    )}
                    <label className="block w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                      <div className={`w-full px-3 py-2 border border-gray-300 rounded text-xs text-center cursor-pointer transition ${
                        uploadingImage
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-50 text-gray-700'
                      }`}>
                        {uploadingImage ? 'Uploading...' : template.preview_image ? 'Change Image' : 'Upload Image'}
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={template.description}
                      onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                      rows={3}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                      placeholder="Template description..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Business Type
                    </label>
                    <select
                      value={template.business_type}
                      onChange={(e) => setTemplate({ ...template, business_type: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="barber">Barber</option>
                      <option value="pizza">Pizza Shop</option>
                      <option value="cafe">Cafe</option>
                      <option value="gym">Gym</option>
                      <option value="salon">Salon</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Exclusive To
                    </label>
                    <select
                      value={template.exclusive_to || ''}
                      onChange={(e) => setTemplate({ ...template, exclusive_to: e.target.value as 'pro' | 'niche' | null })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                    >
                      <option value="">None (All Users)</option>
                      <option value="niche">Niche Package</option>
                      <option value="pro">Pro Package</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Template Type
                    </label>
                    <select
                      value={template.technologies?.includes('react') ? 'react' : 'html5'}
                      onChange={(e) => {
                        const type = e.target.value;
                        setTemplate({ ...template, technologies: [type] });
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                    >
                      <option value="html5">HTML5</option>
                      <option value="react">React</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Features
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {['shopping-cart', 'booking', 'blog', 'marketplace', 'forum', 'contact-form'].map((feature) => (
                        <label key={feature} className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={template.features?.includes(feature) || false}
                            onChange={(e) => {
                              const feats = template.features || [];
                              if (e.target.checked) {
                                setTemplate({ ...template, features: [...feats, feature] });
                              } else {
                                setTemplate({ ...template, features: feats.filter(f => f !== feature) });
                              }
                            }}
                            className="rounded border-gray-300 text-[#5a7a54] focus:ring-[#98b290]"
                          />
                          <span className="capitalize">{feature.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  </>
                ) : (
                  <>
                    {/* Site CSS Tab */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Custom CSS
                      </label>
                      <p className="text-[10px] text-gray-500 mb-2">
                        Add custom CSS styles for your template. This CSS will be applied to all pages.
                      </p>
                      <StyleEditor
                        value={template.custom_css || ''}
                        onChange={(css) => {
                          console.log('[Site CSS onChange] New CSS:', css)
                          const updatedTemplate = { ...template, custom_css: css }
                          setTemplate(updatedTemplate)
                          templateRef.current = updatedTemplate // Sync ref immediately to avoid race condition during save
                          addToHistory(updatedTemplate)
                        }}
                        context="page"
                        showFontSelector={true}
                        showBodyLabel={true}
                      />
                    </div>
                  </>
                )}

                  <button
                    onClick={() => setShowEditMenu(false)}
                    className="w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition mt-3"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={viewMenuRef}>
            <button
              onClick={() => setShowViewMenu(!showViewMenu)}
              onMouseEnter={() => {
                if (showFileMenu || showEditMenu || showInsertMenu) {
                  setShowFileMenu(false)
                  setShowEditMenu(false)
                  setShowInsertMenu(false)
                  setShowViewMenu(true)
                }
              }}
              className="px-3 h-full hover:bg-[#e8f0e6] transition"
            >
              View
            </button>
            {showViewMenu && (
              <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-48">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleLivePreview()
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
                  >
                    Live Preview
                  </button>
                  <button
                    onClick={() => {
                      setShowSourceCodeModal(true)
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
                  >
                    Source Code
                  </button>
                  <button
                    onClick={() => {
                      setShowStylesheetModal(true)
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
                  >
                    Stylesheet
                  </button>
                  <button
                    onClick={() => {
                      setShowSitemapModal(true)
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
                  >
                    Sitemap
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={insertMenuRef}>
            <button
              onClick={() => setShowInsertMenu(!showInsertMenu)}
              onMouseEnter={() => {
                if (showFileMenu || showEditMenu) {
                  setShowFileMenu(false)
                  setShowEditMenu(false)
                  setShowInsertMenu(true)
                }
              }}
              className="px-3 h-full hover:bg-[#e8f0e6] transition"
            >
              Insert
            </button>
            {showInsertMenu && template && (
              <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-48">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowAddPageModal(true)
                      setShowInsertMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
                  >
                    New Page
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className="px-3 h-full hover:bg-[#e8f0e6] transition"
            onMouseEnter={() => {
              if (showFileMenu || showEditMenu || showInsertMenu) {
                setShowFileMenu(false)
                setShowEditMenu(false)
                setShowInsertMenu(false)
              }
            }}
          >
            Help
          </button>
        </div>

        {/* Undo/Redo Toolbar Buttons */}
        <div className="flex items-center h-full border-l border-gray-200 pl-2 ml-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition"
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Save Icon */}
        <div className="flex items-center h-full border-l border-gray-200 pl-2 ml-2">
          <button
            onClick={handleSave}
            className={`p-1.5 hover:bg-gray-100 rounded transition relative ${hasUnsavedChanges ? 'text-red-500' : 'text-green-500'}`}
            title={hasUnsavedChanges ? 'Save (Ctrl+S) - Unsaved changes' : 'Save (Ctrl+S) - All changes saved'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>

          {/* Image Gallery Button */}
          <button
            onClick={() => {
              if (!template) {
                alert('Please create a template first.')
                return
              }
              console.log('Image Gallery button clicked')
              imageGalleryRef.current = true
              setShowImageGallery(prev => {
                console.log('setShowImageGallery called, prev:', prev, 'setting to true')
                return true
              })
            }}
            disabled={!template}
            className={`p-1.5 rounded transition ml-1 ${
              !template
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={!template ? 'Create a template first' : 'Image Gallery'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center Section - Template Name */}
      <div className="flex-1 flex justify-center">
        <input
          type="text"
          value={template.name}
          onChange={(e) => {
            const updatedTemplate = { ...template, name: e.target.value }
            setTemplate(updatedTemplate)
            templateRef.current = updatedTemplate // Sync ref immediately to avoid race condition during save
            addToHistory(updatedTemplate)
          }}
          className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290] text-center w-64"
        />
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center h-full text-xs space-x-1 pr-2">
        <button
          onClick={handleLivePreview}
          className="px-3 py-1 bg-[#98b290] hover:bg-[#7a9274] text-white rounded transition flex items-center gap-1"
          title="Open Live Preview in New Tab"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </button>
        <div className="ml-2 px-2 text-gray-600 border-l border-gray-200">
          {user?.name}
        </div>
      </div>
    </header>
  )
}
