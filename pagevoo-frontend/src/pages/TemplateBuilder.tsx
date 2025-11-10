import React, { useState, useRef, useEffect, memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/services/api'
import { StyleEditor } from '@/components/StyleEditor'
import { ImageGallery } from '@/components/ImageGallery'
import { NavigationStylingPanel } from '@/components/NavigationStylingPanel'
import NavigationTreeManager from '@/components/NavigationTreeManager'
import { MobileMenu } from '@/components/MobileMenu'
import { ButtonStyleModal } from '@/components/modals/ButtonStyleModal'
import { AddPageModal } from '@/components/modals/AddPageModal'
import { EditPageModal } from '@/components/modals/EditPageModal'
import { LoadModal } from '@/components/modals/LoadModal'
import { SourceCodeModal } from '@/components/modals/SourceCodeModal'
import { StylesheetModal } from '@/components/modals/StylesheetModal'
import { SitemapModal } from '@/components/modals/SitemapModal'
import { ColorPickerModal } from '@/components/modals/ColorPickerModal'
import { LinkModal } from '@/components/modals/LinkModal'
import { InsertImageModal } from '@/components/modals/InsertImageModal'
import { NavbarProperties } from '../components/properties/NavbarProperties'
import { FooterProperties } from '../components/properties/FooterProperties'
import { SectionThumbnail } from '../components/SectionThumbnail'
import { EditableText } from '../components/EditableText'
import { GridSection } from '../components/sections/GridSection'
import { NavbarSection } from '../components/sections/NavbarSection'
import { FooterSection } from '../components/sections/FooterSection'
import { SectionWrapper } from '../components/sections/SectionWrapper'
import { Header } from '../components/layout/Header'
import { LeftSidebar } from '../components/LeftSidebar'
import { RightSidebar } from '../components/RightSidebar'
import { DraggableSectionItem } from '../components/dnd/DraggableSectionItem'
import { SortableSectionItem } from '../components/dnd/SortableSectionItem'
import { BottomDropZone } from '../components/dnd/BottomDropZone'
import { CanvasDropZone } from '../components/dnd/CanvasDropZone'
import { Toolbar } from '../components/Toolbar'
import { FloatingTextEditor } from '../components/layout/FloatingTextEditor'
import { PageSelectorBar } from '../components/layout/PageSelectorBar'
import { PublishedTemplateBanner } from '../components/layout/PublishedTemplateBanner'
import { useSectionHandlers } from '../hooks/useSectionHandlers'
import { usePageHandlers } from '../hooks/usePageHandlers'
import { useDragHandlers } from '../hooks/useDragHandlers'
import { useTextEditor } from '../hooks/useTextEditor'
import { useFileHandlers } from '../hooks/useFileHandlers'
import { useCodeHandlers } from '../hooks/useCodeHandlers'
import { useResizeHandlers } from '../hooks/useResizeHandlers'
import { useImageHandlers } from '../hooks/useImageHandlers'
import { useFormattingHandlers } from '../hooks/useFormattingHandlers'
import { useImageGalleryHandlers } from '../hooks/useImageGalleryHandlers'
import { useRenderSection } from '../hooks/useRenderSection'
import { useTemplateBuilderEffects } from '../hooks/useTemplateBuilderEffects'
import {
  generateRandomString,
  sanitizeName,
  generateIdentifier,
  generateContainerStyle,
  generateLinkStyle,
  generateActiveIndicatorStyle
} from '../utils/helpers'
import { getLinkHref, getLinkLabel, getCanvasWidth, handleAddPredefinedPage as addPredefinedPage } from '../utils/templateHelpers'
import { coreSections, headerNavigationSections, footerSections } from '../constants/sectionTemplates'
import {
  isActivePage,
  generateContentCSS,
  extractFontsFromCSS
} from '../utils/cssUtils'
import { generatePageHTML as genPageHTML, generateStylesheet as genStylesheet } from '../utils/htmlCssGenerator'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface ContentCSS {
  row?: string
  columns?: { [key: string]: string } // e.g., { '0': 'col-1 css', '1': 'col-2 css' }
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
  images?: Array<{
    id: string
    filename: string
    path: string
    size: number
    uploaded_at: string
  }>
}

// Helper function to generate random string

export default function TemplateBuilder() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('id')

  const [template, setTemplate] = useState<Template | null>(null)
  const templateRef = useRef<Template | null>(null) // Track latest template to avoid race conditions
  const [currentPage, setCurrentPage] = useState<TemplatePage | null>(null)
  const [selectedSection, setSelectedSection] = useState<TemplateSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editSubTab, setEditSubTab] = useState<'settings' | 'css' | 'page'>('settings')
  const [showAddPageModal, setShowAddPageModal] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [editingText, setEditingText] = useState<{ sectionId: number; field: string; value: string } | null>(null)
  const [showCodeView, setShowCodeView] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [tempColor, setTempColor] = useState('#000000')
  const [savedSelection, setSavedSelection] = useState<Range | null>(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [showInsertImageModal, setShowInsertImageModal] = useState(false)
  const [imageInsertMode, setImageInsertMode] = useState<'url' | 'gallery'>('url')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [imageWidth, setImageWidth] = useState<number>(0)
  const [imageHeight, setImageHeight] = useState<number>(0)
  const [constrainProportions, setConstrainProportions] = useState(true)
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<{ [key: number]: boolean }>({})
  const [imageAltText, setImageAltText] = useState<string>('')
  const [imageLink, setImageLink] = useState<string>('')
  const [imageLinkTarget, setImageLinkTarget] = useState<'_self' | '_blank'>('_self')
  const [editorHeight, setEditorHeight] = useState(300)
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false)
  const [isDraggingEditor, setIsDraggingEditor] = useState(false)
  const [currentFormatting, setCurrentFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: '16px',
    color: '#000000',
    alignment: 'left'
  })
  const editorRef = useRef<HTMLDivElement>(null)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showEditPageModal, setShowEditPageModal] = useState(false)
  const [editPageName, setEditPageName] = useState('')
  const [editPageSlug, setEditPageSlug] = useState('')
  const [editPageMetaDescription, setEditPageMetaDescription] = useState('')
  const [showCSSPanel, setShowCSSPanel] = useState(false)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const imageGalleryRef = useRef(false)
  const [cssInspectorMode, setCssInspectorMode] = useState(false)
  const [hoveredSectionId, setHoveredSectionId] = useState<number | null>(null)
  const [showSourceCodeModal, setShowSourceCodeModal] = useState(false)
  const [showStylesheetModal, setShowStylesheetModal] = useState(false)
  const [showSitemapModal, setShowSitemapModal] = useState(false)
  const [editableHTML, setEditableHTML] = useState('')
  const [editableCSS, setEditableCSS] = useState('')
  const [isEditingHTML, setIsEditingHTML] = useState(false)
  const [isEditingCSS, setIsEditingCSS] = useState(false)
  const [cssTab, setCssTab] = useState<'site' | 'page'>('site')
  const [showSectionCSS, setShowSectionCSS] = useState(false)
  const [showContentStyle, setShowContentStyle] = useState(false)
  const [expandedColumnIndex, setExpandedColumnIndex] = useState<number | null>(null)
  const [showRowStyle, setShowRowStyle] = useState(false)
  const [hoveredSection, setHoveredSection] = useState<number | null>(null)

  // Undo/Redo and Save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [history, setHistory] = useState<Template[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isPublished, setIsPublished] = useState(false)

  // Template selector modal
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Drag and Drop state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDragData, setActiveDragData] = useState<any>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Resize handlers hook
  const {
    leftWidth,
    rightWidth,
    isResizingLeft,
    isResizingRight,
    setLeftWidth,
    setRightWidth,
    handleLeftMouseDown,
    handleRightMouseDown,
    handleMouseUp,
    handleMouseMove
  } = useResizeHandlers({ initialLeftWidth: 280, initialRightWidth: 320 })

  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showNavButtonStyleModal, setShowNavButtonStyleModal] = useState(false)

  const leftSidebarRef = useRef<HTMLDivElement>(null)
  const rightSidebarRef = useRef<HTMLDivElement>(null)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const editMenuRef = useRef<HTMLDivElement>(null)
  const insertMenuRef = useRef<HTMLDivElement>(null)
  const viewMenuRef = useRef<HTMLDivElement>(null)

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  )


  // Template Builder Effects (useEffects)
  useTemplateBuilderEffects({
    templateRef,
    template,
    setTemplate,
    templateId,
    setCurrentPage,
    setLoading,
    setHistory,
    setHistoryIndex,
    setCanUndo,
    setCanRedo,
    setIsPublished,
    setHasUnsavedChanges,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    handleNew,
    handleSave,
    handleUndo,
    handleRedo,
    handleLoad,
    showFileMenu,
    setShowFileMenu,
    showEditMenu,
    setShowEditMenu,
    showInsertMenu,
    setShowInsertMenu,
    showViewMenu,
    setShowViewMenu,
    fileMenuRef,
    editMenuRef,
    insertMenuRef,
    viewMenuRef,
    selectedSection,
    setShowSectionCSS,
    currentPage,
    showSourceCodeModal,
    setEditableHTML,
    showStylesheetModal,
    setEditableCSS
  })


  // History management helper function
  const addToHistory = (newTemplate: Template, markAsUnsaved: boolean = true) => {
    setHistory(prev => {
      // Remove any history after current index (if user made changes after undo)
      const newHistory = prev.slice(0, historyIndex + 1)

      // Add new state
      newHistory.push(JSON.parse(JSON.stringify(newTemplate))) // Deep clone

      // Limit to 10 steps
      if (newHistory.length > 10) {
        newHistory.shift() // Remove oldest
        setHistoryIndex(9)
      } else {
        setHistoryIndex(newHistory.length - 1)
      }

      // Update undo/redo availability
      setCanUndo(true)
      setCanRedo(false)

      return newHistory
    })

    if (markAsUnsaved) {
      setHasUnsavedChanges(true)
    }
  }

  // Page Management Functions (using custom hook)
  const {
    handleAddPage,
    handleDeletePage,
    handleMovePage,
    handleSetHomepage,
    handleOpenEditPageModal,
    handleSaveEditPage,
    handleCopyPage,
    handleAddPageFromTemplate
  } = usePageHandlers({
    template,
    setTemplate,
    currentPage,
    setCurrentPage,
    newPageName,
    setNewPageName,
    setShowAddPageModal,
    editPageName,
    setEditPageName,
    editPageSlug,
    setEditPageSlug,
    editPageMetaDescription,
    setEditPageMetaDescription,
    setShowEditPageModal,
    setShowEditMenu,
    setShowInsertMenu,
    addToHistory
  })

  // Section Management Functions
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['core'])

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category))
    } else {
      setExpandedCategories([...expandedCategories, category])
    }
  }


  const handleAddPredefinedPage = (pageConfig: any) => {
    addPredefinedPage(pageConfig, template, setTemplate, setCurrentPage)
  }

  // Drag and Drop Event Handlers
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel
  } = useDragHandlers({
    currentPage,
    setCurrentPage,
    template,
    setTemplate,
    setActiveId,
    setActiveDragData,
    setOverId,
    addToHistory,
    setSelectedSection
  })

  // Text Editor Handlers
  const {
    handleTextEdit,
    handleOpenTextEditor,
    handleTextEditorChange,
    handleCloseTextEditor,
    handleEditorDragStart,
    handleEditorDrag,
    handleEditorDragEnd,
    toggleEditorFullscreen,
    handleOpenColorPicker,
    handleApplyColorFromPicker,
    handleOpenLinkModal,
    handleApplyLink,
    handleRemoveLink,
    handleOpenInsertImageModal,
    handleInsertImage,
    handleEditorPaste,
    handleEditorClick,
    handleWidthChange,
    handleHeightChange
  } = useTextEditor({
    template,
    setTemplate,
    currentPage,
    setCurrentPage,
    editingText,
    setEditingText,
    showCodeView,
    setShowCodeView,
    showColorPicker,
    setShowColorPicker,
    savedSelection,
    setSavedSelection,
    editorHeight,
    setEditorHeight,
    isEditorFullscreen,
    setIsEditorFullscreen,
    isDraggingEditor,
    setIsDraggingEditor,
    tempColor,
    setTempColor,
    currentFormatting,
    setCurrentFormatting,
    showLinkModal,
    setShowLinkModal,
    linkUrl,
    setLinkUrl,
    linkText,
    setLinkText,
    showInsertImageModal,
    setShowInsertImageModal,
    imageInsertMode,
    setImageInsertMode,
    imageUrl,
    setImageUrl,
    selectedGalleryImage,
    setSelectedGalleryImage,
    selectedImage,
    setSelectedImage,
    imageWidth,
    setImageWidth,
    imageHeight,
    setImageHeight,
    constrainProportions,
    imageAspectRatio,
    setImageAspectRatio,
    imageAltText,
    setImageAltText,
    imageLink,
    setImageLink,
    imageLinkTarget,
    setImageLinkTarget,
    editorRef,
    addToHistory
  })


  // Image handlers hook
  const {
    applyImageLink,
    applyImageAltText,
    applyImageDimensions,
    setImageWidthTo100,
    applyImageAlignment
  } = useImageHandlers({
    editorRef,
    selectedImage,
    setSelectedImage,
    imageLink,
    imageLinkTarget,
    imageAltText,
    imageWidth,
    imageHeight,
    setImageWidth,
    setImageHeight,
    imageAspectRatio,
    handleTextEditorChange
  })

  // Formatting handlers hook
  const {
    applyFormatting,
    applyFontSize,
    applyColor,
    updateFormattingState,
    rgbToHex
  } = useFormattingHandlers({
    editorRef,
    selectedImage,
    setCurrentFormatting,
    handleTextEditorChange,
    applyImageAlignment
  })

  // Image Gallery Handlers
  const {
    handleImageGalleryClose,
    handleImageUpload,
    handleImageDelete,
    handleImageRename
  } = useImageGalleryHandlers({
    template,
    setTemplate,
    imageGalleryRef,
    setShowImageGallery
  })

  // Section handlers hook
  const {
    handleAddSection,
    handleDeleteSection,
    handleMoveSection,
    handleToggleSectionLock,
    handleMoveSidebar,
    handleUpdateSectionContent,
    handleGridColumnUpdate
  } = useSectionHandlers({
    template,
    setTemplate,
    currentPage,
    setCurrentPage,
    selectedSection,
    setSelectedSection,
    addToHistory
  })

  // Reset history after save - start fresh with just the saved state
  const resetHistory = (savedTemplate: Template) => {
    setHistory([JSON.parse(JSON.stringify(savedTemplate))])
    setHistoryIndex(0)
    setCanUndo(false)
    setCanRedo(false)
  }

  // File handlers hook
  const {
    handleSaveTemplate,
    handleImageUpload,
    handleUndo,
    handleRedo,
    handleSave,
    handleSaveAs,
    handleLoad,
    handleLoadTemplate,
    handleNew,
    handleExit,
    handleLivePreview,
    handleExportAsHTMLTemplate,
    handleExportReact,
    handleExportHTML
  } = useFileHandlers({
    template,
    setTemplate,
    templateRef,
    currentPage,
    setCurrentPage,
    setLoading,
    setUploadingImage,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    setCanUndo,
    setCanRedo,
    setHasUnsavedChanges,
    isPublished,
    setIsPublished,
    hasUnsavedChanges,
    setShowLoadModal,
    setAvailableTemplates,
    setLoadingTemplates,
    setSelectedSection,
    resetHistory
  })

  // Code handlers hook
  const {
    handleApplyHTMLChanges,
    handleApplyCSSChanges
  } = useCodeHandlers({
    template,
    setTemplate,
    currentPage,
    setCurrentPage,
    editableHTML,
    editableCSS,
    setIsEditingHTML,
    setIsEditingCSS,
    addToHistory
  })



  // Render Section Hook
  const { renderSection } = useRenderSection({
    selectedSection,
    editingText,
    handleOpenTextEditor,
    handleGridColumnUpdate,
    currentPage,
    template,
    mobileMenuOpen,
    setMobileMenuOpen,
    hoveredSection,
    setHoveredSection,
    setSelectedSection,
    showCSSPanel,
    setShowCSSPanel,
    cssInspectorMode,
    handleMoveSidebar,
    handleMoveSection,
    handleToggleSectionLock,
    handleDeleteSection
  })


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading template...</div>
          <div className="text-gray-400">Please wait</div>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-center">
          <div className="text-2xl mb-2">Error loading template</div>
          <p className="text-gray-600">Please try again</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="h-screen flex flex-col bg-gray-50 text-gray-900 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
      {/* Compact VSCode-style Header */}
      <Header
        showFileMenu={showFileMenu}
        setShowFileMenu={setShowFileMenu}
        showEditMenu={showEditMenu}
        setShowEditMenu={setShowEditMenu}
        showViewMenu={showViewMenu}
        setShowViewMenu={setShowViewMenu}
        showInsertMenu={showInsertMenu}
        setShowInsertMenu={setShowInsertMenu}
        editSubTab={editSubTab}
        setEditSubTab={setEditSubTab}
        canUndo={canUndo}
        canRedo={canRedo}
        hasUnsavedChanges={hasUnsavedChanges}
        template={template!}
        setTemplate={setTemplate}
        currentPage={currentPage}
        user={user}
        fileMenuRef={fileMenuRef}
        editMenuRef={editMenuRef}
        viewMenuRef={viewMenuRef}
        insertMenuRef={insertMenuRef}
        templateRef={templateRef}
        imageGalleryRef={imageGalleryRef}
        handleNew={handleNew}
        handleSave={handleSave}
        handleSaveAs={handleSaveAs}
        handleLoad={handleLoad}
        handleExportAsHTMLTemplate={handleExportAsHTMLTemplate}
        handleExit={handleExit}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        handleOpenEditPageModal={handleOpenEditPageModal}
        handleCopyPage={handleCopyPage}
        handleDeletePage={handleDeletePage}
        addToHistory={addToHistory}
        handleLivePreview={handleLivePreview}
        setShowSourceCodeModal={setShowSourceCodeModal}
        setShowStylesheetModal={setShowStylesheetModal}
        setShowSitemapModal={setShowSitemapModal}
        setShowAddPageModal={setShowAddPageModal}
        setShowImageGallery={setShowImageGallery}
        uploadingImage={uploadingImage}
        handleImageUpload={handleImageUpload}
      />

      {/* Toolbar */}
      <Toolbar
        showLeftSidebar={showLeftSidebar}
        setShowLeftSidebar={setShowLeftSidebar}
        showRightSidebar={showRightSidebar}
        setShowRightSidebar={setShowRightSidebar}
        viewport={viewport}
        setViewport={setViewport}
      />

      {/* Published Template Indicator Banner */}
      {isPublished && (
        <PublishedTemplateBanner
          template={template!}
          setTemplate={setTemplate}
          setIsPublished={setIsPublished}
        />
      )}


      {/* Builder Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Sections & Pages */}
        {showLeftSidebar && (
          <>
            <LeftSidebar
              sidebarRef={leftSidebarRef}
              width={leftWidth}
              expandedCategories={expandedCategories}
              onToggleCategory={toggleCategory}
              coreSections={coreSections}
              headerNavigationSections={headerNavigationSections}
              footerSections={footerSections}
              renderSectionThumbnail={(section) => <SectionThumbnail section={section} />}
              DraggableSectionItem={DraggableSectionItem}
              onMouseDown={handleLeftMouseDown}
            />

            {/* Left Resize Handle */}
            <div
              onMouseDown={handleLeftMouseDown}
              className="w-1 bg-gray-200 hover:bg-[#98b290] cursor-col-resize transition flex-shrink-0"
            />
          </>
        )}

        {/* Center - Canvas */}
        <main className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-8">
          <div
            style={{
              width: getCanvasWidth(viewport),
              maxWidth: '100%',
              transition: 'width 0.3s ease'
            }}
            className="bg-white min-h-full shadow-xl mx-auto ring-1 ring-gray-200 flex flex-col"
          >
            {/* Page Selector */}
            <PageSelectorBar
              currentPage={currentPage}
              template={template}
              setCurrentPage={setCurrentPage}
              setShowCSSPanel={setShowCSSPanel}
              setShowSectionCSS={setShowSectionCSS}
              setSelectedSection={setSelectedSection}
              setShowRightSidebar={setShowRightSidebar}
              cssInspectorMode={cssInspectorMode}
              setCssInspectorMode={setCssInspectorMode}
              handleSetHomepage={handleSetHomepage}
              handleDeletePage={handleDeletePage}
              setShowAddPageModal={setShowAddPageModal}
            />


            {/* Canvas Preview Area */}
            <CanvasDropZone
              currentPage={currentPage}
              activeId={activeId}
              activeDragData={activeDragData}
              overId={overId}
              renderSection={renderSection}
              viewport={viewport}
              template={template}
              setSelectedSection={setSelectedSection}
            />
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        {showRightSidebar && (
          <>
            <RightSidebar
              sidebarRef={rightSidebarRef}
              width={rightWidth}
              onMouseDown={handleRightMouseDown}
              showCSSPanel={showCSSPanel}
              cssTab={cssTab}
              setCssTab={setCssTab}
              template={template}
              setTemplate={setTemplate}
              templateRef={templateRef}
              addToHistory={addToHistory}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setShowCSSPanel={setShowCSSPanel}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
              handleToggleSectionLock={handleToggleSectionLock}
              generateIdentifier={generateIdentifier}
              showSectionCSS={showSectionCSS}
              setShowSectionCSS={setShowSectionCSS}
              setShowContentStyle={setShowContentStyle}
              handleUpdateSectionContent={handleUpdateSectionContent}
              showRowStyle={showRowStyle}
              setShowRowStyle={setShowRowStyle}
              expandedColumnIndex={expandedColumnIndex}
              setExpandedColumnIndex={setExpandedColumnIndex}
              setShowNavButtonStyleModal={setShowNavButtonStyleModal}
            />
          </>
        )}
      </div>

      {/* Add Page Modal */}
      <AddPageModal
        isOpen={showAddPageModal}
        onClose={() => setShowAddPageModal(false)}
        newPageName={newPageName}
        setNewPageName={setNewPageName}
        onAdd={handleAddPage}
      />

      {/* Edit Page Modal */}
      <EditPageModal
        isOpen={showEditPageModal && !!currentPage}
        onClose={() => setShowEditPageModal(false)}
        editPageName={editPageName}
        setEditPageName={setEditPageName}
        editPageSlug={editPageSlug}
        setEditPageSlug={setEditPageSlug}
        editPageMetaDescription={editPageMetaDescription}
        setEditPageMetaDescription={setEditPageMetaDescription}
        onSave={handleSaveEditPage}
      />
      {/* Button Style Customization Modal */}
      <ButtonStyleModal
        isOpen={showNavButtonStyleModal}
        onClose={() => setShowNavButtonStyleModal(false)}
        selectedSection={selectedSection}
        onUpdateContent={handleUpdateSectionContent}
      />
    </div>

    {/* Drag Overlay */}
    <DragOverlay>
      {activeId && activeDragData && (
        <div className="bg-white shadow-2xl rounded-lg p-4 border-2 border-[#98b290] opacity-90">
          <div className="text-sm font-semibold text-gray-700 capitalize">
            {activeDragData.source === 'library'
              ? `Adding: ${activeDragData.section.label || activeDragData.section.type}`
              : `Moving: ${activeDragData.section.type}`
            }
          </div>
        </div>
      )}
    </DragOverlay>

    {/* Floating Rich Text Editor */}
    <FloatingTextEditor
      editingText={editingText}
      editorHeight={editorHeight}
      handleEditorDragStart={handleEditorDragStart}
      handleCloseTextEditor={handleCloseTextEditor}
      toggleEditorFullscreen={toggleEditorFullscreen}
      isEditorFullscreen={isEditorFullscreen}
      showCodeView={showCodeView}
      setEditingText={setEditingText}
      handleTextEdit={handleTextEdit}
      editorRef={editorRef}
      handleTextEditorChange={handleTextEditorChange}
      updateFormattingState={updateFormattingState}
      handleEditorClick={handleEditorClick}
      handleEditorPaste={handleEditorPaste}
      applyFormatting={applyFormatting}
      currentFormatting={currentFormatting}
      applyFontSize={applyFontSize}
      handleOpenColorPicker={handleOpenColorPicker}
      handleOpenLinkModal={handleOpenLinkModal}
      handleOpenInsertImageModal={handleOpenInsertImageModal}
      setShowCodeView={setShowCodeView}
      showColorPicker={showColorPicker}
      setShowColorPicker={setShowColorPicker}
      tempColor={tempColor}
      setTempColor={setTempColor}
      handleApplyColorFromPicker={handleApplyColorFromPicker}
      showLinkModal={showLinkModal}
      setShowLinkModal={setShowLinkModal}
      linkText={linkText}
      setLinkText={setLinkText}
      linkUrl={linkUrl}
      setLinkUrl={setLinkUrl}
      handleApplyLink={handleApplyLink}
      handleRemoveLink={handleRemoveLink}
      showInsertImageModal={showInsertImageModal}
      setShowInsertImageModal={setShowInsertImageModal}
      imageInsertMode={imageInsertMode}
      setImageInsertMode={setImageInsertMode}
      imageUrl={imageUrl}
      setImageUrl={setImageUrl}
      selectedGalleryImage={selectedGalleryImage}
      setSelectedGalleryImage={setSelectedGalleryImage}
      template={template}
      handleInsertImage={handleInsertImage}
      selectedImage={selectedImage}
      setSelectedImage={setSelectedImage}
      imageAltText={imageAltText}
      setImageAltText={setImageAltText}
      applyImageAltText={applyImageAltText}
      imageLink={imageLink}
      setImageLink={setImageLink}
      imageLinkTarget={imageLinkTarget}
      setImageLinkTarget={setImageLinkTarget}
      applyImageLink={applyImageLink}
      imageAspectRatio={imageAspectRatio}
      constrainProportions={constrainProportions}
      setConstrainProportions={setConstrainProportions}
      imageWidth={imageWidth}
      handleWidthChange={handleWidthChange}
      imageHeight={imageHeight}
      handleHeightChange={handleHeightChange}
      setImageWidthTo100={setImageWidthTo100}
      applyImageDimensions={applyImageDimensions}
    />

      {/* Image Gallery Modal */}
      {(showImageGallery || imageGalleryRef.current) && (
        <ImageGallery
          isOpen={true}
          onClose={handleImageGalleryClose}
          templateId={template?.id || 0}
          images={template?.images || []}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          onRename={handleImageRename}
        />
      )}

      {/* Load Template Modal */}
      <LoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        loadingTemplates={loadingTemplates}
        availableTemplates={availableTemplates}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* Source Code Modal */}
      <SourceCodeModal
        isOpen={showSourceCodeModal}
        onClose={() => {
          setShowSourceCodeModal(false)
          setIsEditingHTML(false)
        }}
        currentPage={currentPage}
        isEditingHTML={isEditingHTML}
        setIsEditingHTML={setIsEditingHTML}
        editableHTML={editableHTML}
        setEditableHTML={setEditableHTML}
        onApplyChanges={handleApplyHTMLChanges}
        generatePageHTML={generatePageHTML}
      />

      {/* Stylesheet Modal */}
      <StylesheetModal
        isOpen={showStylesheetModal}
        onClose={() => {
          setShowStylesheetModal(false)
          setIsEditingCSS(false)
        }}
        currentPage={currentPage}
        template={template}
        isEditingCSS={isEditingCSS}
        setIsEditingCSS={setIsEditingCSS}
        editableCSS={editableCSS}
        setEditableCSS={setEditableCSS}
        onApplyChanges={handleApplyCSSChanges}
        generateStylesheet={generateStylesheet}
      />

      {/* Sitemap Modal */}
      <SitemapModal
        isOpen={showSitemapModal}
        onClose={() => setShowSitemapModal(false)}
        template={template}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onOpenAddPageModal={() => {
          setShowAddPageModal(true)
          setShowSitemapModal(false)
        }}
        onOpenEditPageModal={(page) => {
          setEditPageId(page.id)
          setEditPageName(page.name)
          setEditPageSlug(page.slug)
          setEditPageIsHomepage(page.is_homepage)
          setEditPageMetaDescription(page.meta_description || '')
          setShowEditPageModal(true)
          setShowSitemapModal(false)
        }}
        onDeletePage={(pageId) => {
          handleDeletePage(pageId)
          if (pageId === currentPage?.id && template?.pages.length > 0) {
            setCurrentPage(template.pages[0])
          }
        }}
      />
  </DndContext>
  )
}

