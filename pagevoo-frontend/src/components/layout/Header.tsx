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
  setShowSectionLibraryModal: (show: boolean) => void
  setShowPageLibraryModal: (show: boolean) => void

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
  setShowSectionLibraryModal,
  setShowPageLibraryModal,
  setShowAddPageModal,
  setShowImageGallery,
  uploadingImage,
  handleImageUpload
}) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 flex items-center h-9 shadow-sm">
      {/* Left Section - Logo & Menus */}
      <div className="flex items-center h-full">
        <div className="px-3 flex items-center space-x-2 border-r border-gray-700 h-full">
          <img src="/Pagevoo_logo_500x500.png" alt="Pagevoo" className="w-[60px] h-[60px]" />
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
              className="px-3 h-full hover:bg-gray-700 transition text-gray-200"
            >
              File
            </button>
            {showFileMenu && (
              <div className="absolute top-full left-0 mt-0 bg-gray-800 border border-gray-700 shadow-lg z-50 w-48">
                <button
                  onClick={() => {
                    handleNew()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs flex items-center justify-between text-gray-200"
                >
                  <span>New</span>
                  <span className="text-gray-400 text-[10px]">Ctrl+N</span>
                </button>
                <div className="border-t border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    handleSave()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs flex items-center justify-between text-gray-200"
                >
                  <span>Save</span>
                  <span className="text-gray-400 text-[10px]">Ctrl+S</span>
                </button>
                <button
                  onClick={() => {
                    handleSaveAs()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
                >
                  Save As...
                </button>
                <button
                  onClick={() => {
                    handleLoad()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs flex items-center justify-between text-gray-200"
                >
                  <span>Load</span>
                  <span className="text-gray-400 text-[10px]">Ctrl+O</span>
                </button>
                <div className="border-t border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    handleExportAsHTMLTemplate()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-600 text-xs font-medium text-[#98b290]"
                >
                  Publish
                </button>
                <div className="border-t border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    handleExit()
                    setShowFileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
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
              className="px-3 h-full hover:bg-gray-700 transition text-gray-200"
            >
              Edit
            </button>
            {showEditMenu && template && (
              <div className="absolute top-full left-0 mt-0 bg-gray-800 border border-gray-700 shadow-lg z-50 w-80">
                {/* Undo/Redo buttons */}
                <div className="flex items-center gap-1 px-2 py-2 border-b border-gray-700 bg-gray-700">
                  <button
                    onClick={() => {
                      handleUndo()
                      setShowEditMenu(false)
                    }}
                    disabled={!canUndo}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-600 text-xs rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition text-gray-200"
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
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-600 text-xs rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition text-gray-200"
                    title="Redo (Ctrl+Y)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                    </svg>
                    <span>Redo</span>
                  </button>
                </div>
                {/* Sub-navigation Tabs */}
                <div className="flex border-b border-gray-600">
                  <button
                    onClick={() => setEditSubTab('settings')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                      editSubTab === 'settings'
                        ? 'bg-gray-700 text-[#98b290] border-b-2 border-[#98b290]'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Website Settings
                  </button>
                  <button
                    onClick={() => setEditSubTab('css')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                      editSubTab === 'css'
                        ? 'bg-gray-700 text-[#98b290] border-b-2 border-[#98b290]'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Site CSS
                  </button>
                  <button
                    onClick={() => setEditSubTab('page')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                      editSubTab === 'page'
                        ? 'bg-gray-700 text-[#98b290] border-b-2 border-[#98b290]'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
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
                          <div className="text-xs text-gray-300 mb-3">
                            Current Page: <span className="font-medium">{currentPage.name}</span>
                          </div>
                          <button
                            onClick={handleOpenEditPageModal}
                            className="w-full text-left px-3 py-2 hover:bg-gray-700 text-xs rounded border border-gray-600 text-gray-200"
                          >
                            Rename Page & Edit Meta
                          </button>
                          <button
                            onClick={handleCopyPage}
                            className="w-full text-left px-3 py-2 hover:bg-gray-700 text-xs rounded border border-gray-600 text-gray-200"
                          >
                            Copy Page
                          </button>
                          {template.pages.length > 1 && (
                            <button
                              onClick={() => {
                                handleDeletePage(currentPage.id)
                                setShowEditMenu(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-red-900 text-red-400 text-xs rounded border border-red-800"
                            >
                              Delete Page
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">No page selected</div>
                      )}
                    </>
                  ) : editSubTab === 'settings' ? (
                  <>
                  {/* Website Settings */}
                  <div className="space-y-3">
                    {/* Default Meta Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-200 mb-1">
                        Default Site Title
                      </label>
                      <input
                        type="text"
                        value={(template as any).default_title || ''}
                        onChange={(e) => setTemplate({ ...template, default_title: e.target.value } as any)}
                        className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290] bg-gray-700 text-gray-200"
                        placeholder="My Awesome Website"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        This title will be used for all pages unless overridden individually
                      </p>
                    </div>

                    {/* Default Meta Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-200 mb-1">
                        Default Meta Description
                      </label>
                      <textarea
                        value={(template as any).default_description || ''}
                        onChange={(e) => setTemplate({ ...template, default_description: e.target.value } as any)}
                        rows={3}
                        className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290] bg-gray-700 text-gray-200"
                        placeholder="A brief description of your website..."
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        This description will be used for all pages unless overridden individually
                      </p>
                    </div>

                    {/* Status Information */}
                    <div className="border-t border-gray-600 pt-3">
                      <label className="block text-xs font-medium text-gray-200 mb-2">
                        Website Status
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Status:</span>
                          <span className={`px-2 py-0.5 rounded ${
                            (template as any).is_published || (template as any).published_at
                              ? 'bg-green-900/30 border border-green-700 text-green-400'
                              : 'bg-gray-700 border border-gray-600 text-gray-300'
                          }`}>
                            {(template as any).is_published || (template as any).published_at ? 'Published' : 'Unpublished'}
                          </span>
                        </div>
                        {(template as any).updated_at && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Last Modified:</span>
                            <span className="text-gray-300">
                              {new Date((template as any).updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {(template as any).published_at && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Published:</span>
                            <span className="text-gray-300">
                              {new Date((template as any).published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {(template as any).created_at && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Created:</span>
                            <span className="text-gray-300">
                              {new Date((template as any).created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  </>
                ) : (
                  <>
                    {/* Site CSS Tab */}
                    <div>
                      <label className="block text-xs font-medium text-gray-200 mb-1">
                        Custom CSS
                      </label>
                      <p className="text-[10px] text-gray-400 mb-2">
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
                    className="w-full px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs transition mt-3"
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
              className="px-3 h-full hover:bg-gray-700 transition text-gray-200"
            >
              View
            </button>
            {showViewMenu && (
              <div className="absolute top-full left-0 mt-0 bg-gray-800 border border-gray-700 shadow-lg z-50 w-48">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleLivePreview()
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
                  >
                    Live Preview
                  </button>
                  <button
                    onClick={() => {
                      setShowSourceCodeModal(true)
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
                  >
                    Source Code
                  </button>
                  <button
                    onClick={() => {
                      setShowStylesheetModal(true)
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
                  >
                    Stylesheet
                  </button>
                  <button
                    onClick={() => {
                      setShowSitemapModal(true)
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
                  >
                    Sitemap
                  </button>
                  <button
                    onClick={() => {
                      setShowSectionLibraryModal(true)
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
                  >
                    Section Library
                  </button>
                  <button
                    onClick={() => {
                      setShowPageLibraryModal(true)
                      setShowViewMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
                  >
                    Page Library
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
              className="px-3 h-full hover:bg-gray-700 transition text-gray-200"
            >
              Insert
            </button>
            {showInsertMenu && template && (
              <div className="absolute top-full left-0 mt-0 bg-gray-800 border border-gray-700 shadow-lg z-50 w-48">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowAddPageModal(true)
                      setShowInsertMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs text-gray-200"
                  >
                    New Page
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className="px-3 h-full hover:bg-gray-700 transition text-gray-200"
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
        <div className="flex items-center h-full border-l border-gray-600 pl-2 ml-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition text-gray-200"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition text-gray-200"
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Save Icon */}
        <div className="flex items-center h-full border-l border-gray-600 pl-2 ml-2">
          <button
            onClick={handleSave}
            className={`p-1.5 hover:bg-gray-700 rounded transition relative ${hasUnsavedChanges ? 'text-red-400' : 'text-green-400'}`}
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
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-gray-300 hover:bg-gray-700'
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
      <div className="flex-1 flex justify-center items-center">
        <input
          type="text"
          value={template.name || ''}
          onChange={(e) => {
            const updatedTemplate = { ...template, name: e.target.value }
            setTemplate(updatedTemplate)
            templateRef.current = updatedTemplate // Sync ref immediately to avoid race condition during save
            addToHistory(updatedTemplate)
          }}
          placeholder="Untitled"
          className="px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290] text-center w-64 text-gray-200 placeholder:text-gray-400"
        />
        {hasUnsavedChanges && (
          <span className="ml-1 text-gray-400 text-xs">*</span>
        )}
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
        <div className="ml-2 px-2 text-gray-300 border-l border-gray-600">
          {user?.name}
        </div>
      </div>
    </header>
  )
}
