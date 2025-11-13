import React, { useState, useRef, useEffect, memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { sectionLibraryApi, pageLibraryApi, fileToBase64 } from '@/services/libraryApi'
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
import { ExportSectionModal } from '@/components/modals/ExportSectionModal'
import { SectionLibraryModal } from '@/components/modals/SectionLibraryModal'
import { ExportPageModal } from '@/components/modals/ExportPageModal'
import { PageLibraryModal } from '@/components/modals/PageLibraryModal'
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
import { usePermissions } from '@/hooks/usePermissions'
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

interface UserSection {
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

interface UserPage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: UserSection[]
  meta_description?: string
  page_css?: string
  page_id?: string
}

interface UserWebsite {
  id: number
  template_id: number
  name: string
  description: string
  business_type: string
  is_active: boolean
  pages: UserPage[]
  preview_image: string | null
  published_at: string | null
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

interface Template {
  id: number
  name: string
  description: string
  business_type: string
  preview_image?: string
  is_active: boolean
}

export default function WebsiteBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { can, tier } = usePermissions()

  const [website, setWebsite] = useState<UserWebsite | null>(null)
  const websiteRef = useRef<UserWebsite | null>(null) // Track latest website to avoid race conditions
  const [currentPage, setCurrentPage] = useState<UserPage | null>(null)
  const [selectedSection, setSelectedSection] = useState<UserSection | null>(null)
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
  const [history, setHistory] = useState<UserWebsite[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isPublished, setIsPublished] = useState(false)

  // Welcome screen states
  const [showWelcome, setShowWelcome] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [initializingWebsite, setInitializingWebsite] = useState(false)

  // Template selector modal
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([])

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

  // Section Library states
  const [showSectionLibraryModal, setShowSectionLibraryModal] = useState(false)
  const [showExportSectionModal, setShowExportSectionModal] = useState(false)
  const [exportingSection, setExportingSection] = useState<UserSection | null>(null)

  // Page Library states
  const [showPageLibraryModal, setShowPageLibraryModal] = useState(false)
  const [showExportPageModal, setShowExportPageModal] = useState(false)
  const [exportingPage, setExportingPage] = useState<UserPage | null>(null)

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

  // Load website on mount
  useEffect(() => {
    loadWebsite()
  }, [])

  const loadWebsite = async () => {
    try {
      const response = await api.getUserWebsite()
      if (response.success && response.data) {
        setWebsite(response.data)
        websiteRef.current = response.data
        // Set current page to homepage or first page
        const homepage = response.data.pages.find((p: UserPage) => p.is_homepage) || response.data.pages[0]
        setCurrentPage(homepage)
        setShowWelcome(false)
        setIsPublished(!!response.data.published_at)

        // Initialize history
        setHistory([JSON.parse(JSON.stringify(response.data))])
        setHistoryIndex(0)
      }
    } catch (error) {
      console.error('Failed to load website:', error)
      // User doesn't have a website yet, show welcome screen
      setShowWelcome(true)
      loadTemplates()
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await api.getAllTemplates()
      if (response.success && response.data) {
        // API already filters by is_active, so just set the data
        setTemplates(response.data)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSelectTemplate = async (templateId: number) => {
    setInitializingWebsite(true)
    try {
      const response = await api.initializeWebsiteFromTemplate(templateId)
      if (response.success && response.data) {
        setWebsite(response.data)
        websiteRef.current = response.data
        const homepage = response.data.pages.find((p: UserPage) => p.is_homepage) || response.data.pages[0]
        setCurrentPage(homepage)
        setShowWelcome(false)

        // Initialize history
        setHistory([JSON.parse(JSON.stringify(response.data))])
        setHistoryIndex(0)
        setCanUndo(false)
        setCanRedo(false)
      }
    } catch (error) {
      console.error('Failed to initialize website:', error)
      alert('Failed to initialize website from template')
    } finally {
      setInitializingWebsite(false)
    }
  }

  const handleCreateBlank = async () => {
    setInitializingWebsite(true)
    try {
      const response = await api.createBlankWebsite()
      if (response.success && response.data) {
        setWebsite(response.data)
        websiteRef.current = response.data
        const homepage = response.data.pages.find((p: UserPage) => p.is_homepage) || response.data.pages[0]
        setCurrentPage(homepage)
        setShowWelcome(false)

        // Initialize history
        setHistory([JSON.parse(JSON.stringify(response.data))])
        setHistoryIndex(0)
        setCanUndo(false)
        setCanRedo(false)
      }
    } catch (error) {
      console.error('Failed to create blank website:', error)
      alert('Failed to create blank website')
    } finally {
      setInitializingWebsite(false)
    }
  }

  // Reset history helper function (must be before useFileHandlers)
  const resetHistory = (savedWebsite: UserWebsite) => {
    setHistory([JSON.parse(JSON.stringify(savedWebsite))])
    setHistoryIndex(0)
    setCanUndo(false)
    setCanRedo(false)
  }

  // File handlers hook (adapted for UserWebsite)
  const {
    handleSaveTemplate: handleSaveWebsite,
    handleUndo,
    handleRedo,
    handleSave,
    handleSaveAs,
    handleLoad,
    handleLoadTemplate: handleLoadWebsite,
    handleNew,
    handleExit,
    handleLivePreview,
    handleExportAsHTMLTemplate,
    handleExportReact,
    handleExportHTML
  } = useFileHandlers({
    template: website as any, // Cast to work with existing hook
    setTemplate: setWebsite as any,
    templateRef: websiteRef as any,
    currentPage,
    setCurrentPage,
    setLoading,
    setUploadingImage,
    history: history as any,
    setHistory: setHistory as any,
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
    resetHistory: resetHistory as any
  })

  // Override handleNew to show welcome screen
  const handleNewWebsite = async () => {
    if (confirm('Start a new website? Your current website will be deleted.')) {
      // Delete existing website if it exists
      if (website) {
        try {
          await api.deleteUserWebsite()
        } catch (error) {
          console.error('Failed to delete website:', error)
        }
      }

      setWebsite(null)
      websiteRef.current = null
      setCurrentPage(null)
      setSelectedSection(null)
      setShowWelcome(true)
      setShowFileMenu(false)
      setHistory([])
      setHistoryIndex(-1)
      setCanUndo(false)
      setCanRedo(false)
      setHasUnsavedChanges(false)
      loadTemplates()
    }
  }

  // Template Builder Effects (useEffects)
  useTemplateBuilderEffects({
    templateRef: websiteRef as any,
    template: website as any,
    setTemplate: setWebsite as any,
    templateId: null, // User websites don't use URL params
    setCurrentPage,
    setLoading,
    setHistory: setHistory as any,
    setHistoryIndex,
    setCanUndo,
    setCanRedo,
    setIsPublished,
    setHasUnsavedChanges,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    handleNew: handleNewWebsite,
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
  const addToHistory = (newWebsite: UserWebsite, markAsUnsaved: boolean = true) => {
    setHistory(prev => {
      // Remove any history after current index (if user made changes after undo)
      const newHistory = prev.slice(0, historyIndex + 1)

      // Add new state
      newHistory.push(JSON.parse(JSON.stringify(newWebsite))) // Deep clone

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
    handleOpenEditPageModal,
    handleSaveEditPage,
    handleCopyPage,
    handleAddPageFromTemplate
  } = usePageHandlers({
    template: website as any,
    setTemplate: setWebsite as any,
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
    addToHistory: addToHistory as any
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
    addPredefinedPage(pageConfig, website as any, setWebsite as any, setCurrentPage)
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
    template: website as any,
    setTemplate: setWebsite as any,
    setActiveId,
    setActiveDragData,
    setOverId,
    addToHistory: addToHistory as any,
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
    template: website as any,
    setTemplate: setWebsite as any,
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
    addToHistory: addToHistory as any
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
    template: website as any,
    setTemplate: setWebsite as any,
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
    template: website as any,
    setTemplate: setWebsite as any,
    currentPage,
    setCurrentPage,
    selectedSection,
    setSelectedSection,
    addToHistory: addToHistory as any
  })

  // Code handlers hook
  const {
    handleApplyHTMLChanges,
    handleApplyCSSChanges
  } = useCodeHandlers({
    template: website as any,
    setTemplate: setWebsite as any,
    currentPage,
    setCurrentPage,
    editableHTML,
    editableCSS,
    setIsEditingHTML,
    setIsEditingCSS,
    addToHistory: addToHistory as any
  })

  // Section Library Handlers
  const handleExportSection = (section: UserSection) => {
    setExportingSection(section)
    setShowExportSectionModal(true)
  }

  const handleSectionExport = async (data: {
    name: string
    description: string
    tags: string[]
    preview_image?: File
  }) => {
    try {
      let previewImageBase64: string | undefined
      if (data.preview_image) {
        previewImageBase64 = await fileToBase64(data.preview_image)
      }

      await sectionLibraryApi.export({
        name: data.name,
        description: data.description,
        section_type: exportingSection?.type || 'custom',
        section_data: exportingSection || {},
        tags: data.tags,
        preview_image: previewImageBase64
      })

      alert('Section exported to library successfully!')
      setShowExportSectionModal(false)
      setExportingSection(null)
    } catch (error) {
      console.error('Error exporting section:', error)
      alert('Failed to export section. Please try again.')
    }
  }

  const handleImportSection = async (sectionId: number) => {
    if (!currentPage || !website) return

    try {
      const sectionData = await sectionLibraryApi.getById(sectionId)

      const newSectionId = Date.now()
      const newSection = {
        ...sectionData.section_data,
        id: newSectionId,
        section_id: `imported-section-${newSectionId}`,
        order: currentPage.sections.length
      }

      const updatedSections = [...currentPage.sections, newSection]
      const updatedPage = {
        ...currentPage,
        sections: updatedSections
      }

      const updatedWebsite = {
        ...website,
        pages: website.pages.map(p =>
          p.id === currentPage.id ? updatedPage : p
        )
      }

      setWebsite(updatedWebsite)
      setCurrentPage(updatedPage)
      addToHistory(updatedWebsite)

      alert('Section imported successfully!')
      setShowSectionLibraryModal(false)
    } catch (error) {
      console.error('Error importing section:', error)
      alert('Failed to import section. Please try again.')
    }
  }

  // Page Library Handlers
  const handleExportPage = (page: UserPage) => {
    setExportingPage(page)
    setShowExportPageModal(true)
  }

  const handlePageExport = async (data: {
    name: string
    description: string
    meta_description: string
    meta_keywords: string
    tags: string[]
    preview_image?: File
  }) => {
    try {
      let previewImageBase64: string | undefined
      if (data.preview_image) {
        previewImageBase64 = await fileToBase64(data.preview_image)
      }

      await pageLibraryApi.export({
        name: data.name,
        description: data.description,
        meta_description: data.meta_description,
        meta_keywords: data.meta_keywords,
        page_data: exportingPage || {},
        site_css: website?.custom_css || '',
        tags: data.tags,
        preview_image: previewImageBase64
      })

      alert('Page exported to library successfully!')
      setShowExportPageModal(false)
      setExportingPage(null)
    } catch (error) {
      console.error('Error exporting page:', error)
      alert('Failed to export page. Please try again.')
    }
  }

  const handleImportPage = async (pageId: number, applySiteCSS: boolean) => {
    if (!website) return

    try {
      const pageData = await pageLibraryApi.getById(pageId)

      const newPageId = Date.now()
      const newPage = {
        ...pageData.page_data,
        id: newPageId,
        page_id: `imported-page-${newPageId}`,
        is_homepage: false,
        order: website.pages.length,
        sections: pageData.page_data.sections.map((section: any, index: number) => ({
          ...section,
          id: newPageId + index + 1,
          section_id: `imported-section-${newPageId}-${index}`,
          order: index
        }))
      }

      let updatedWebsite = {
        ...website,
        pages: [...website.pages, newPage]
      }

      if (applySiteCSS && pageData.site_css) {
        updatedWebsite = {
          ...updatedWebsite,
          custom_css: pageData.site_css
        }
      }

      setWebsite(updatedWebsite)
      setCurrentPage(newPage)
      addToHistory(updatedWebsite)

      alert('Page imported successfully!')
      setShowPageLibraryModal(false)
    } catch (error) {
      console.error('Error importing page:', error)
      alert('Failed to import page. Please try again.')
    }
  }

  // Render Section Hook
  const { renderSection } = useRenderSection({
    selectedSection,
    editingText,
    handleOpenTextEditor,
    handleGridColumnUpdate,
    currentPage,
    template: website as any,
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
    handleDeleteSection,
    handleExportSection
  })

  // Publish/Unpublish handlers
  const handlePublish = async () => {
    try {
      const response = await api.publishWebsite()
      if (response.success) {
        setWebsite(response.data)
        websiteRef.current = response.data
        setIsPublished(true)
        alert('Website published successfully!')
      }
    } catch (error) {
      console.error('Failed to publish:', error)
      alert('Failed to publish website')
    }
  }

  const handleUnpublish = async () => {
    try {
      const response = await api.unpublishWebsite()
      if (response.success) {
        setWebsite(response.data)
        websiteRef.current = response.data
        setIsPublished(false)
        alert('Website unpublished')
      }
    } catch (error) {
      console.error('Failed to unpublish:', error)
      alert('Failed to unpublish website')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading website...</div>
          <div className="text-gray-400">Please wait</div>
        </div>
      </div>
    )
  }

  // Welcome screen for users without a website
  if (showWelcome) {
    return (
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/Pagevoo_logo_500x500.png" alt="Pagevoo" className="w-[60px] h-[60px]" />
              <div>
                <h1 className="text-xl font-semibold">Website Builder</h1>
                <p className="text-sm text-gray-400">{user?.business_name}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/my-dashboard')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Message */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Welcome to Your Website Builder!</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Get started by selecting a professionally designed template or create your website from scratch.
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Create Blank Option */}
              <button
                onClick={handleCreateBlank}
                disabled={initializingWebsite}
                className="bg-gray-800 border-2 border-dashed border-gray-600 hover:border-[#98b290] rounded-lg p-8 text-left transition group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gray-700 group-hover:bg-[#98b290] rounded-lg mb-4 transition">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Create New</h3>
                <p className="text-gray-400">Start with a blank canvas and build your website from the ground up</p>
              </button>

              {/* Select Template Option */}
              <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-[#98b290] rounded-lg mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Select a Template</h3>
                <p className="text-gray-400 mb-4">Choose from our professionally designed templates below</p>
              </div>
            </div>

            {/* Templates Section */}
            <div>
              <h3 className="text-2xl font-semibold mb-6">Available Templates</h3>

              {loadingTemplates ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#98b290]"></div>
                  <p className="mt-4 text-gray-400">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-xl text-gray-400 mb-2">No templates available yet</p>
                  <p className="text-gray-500">Check back later or contact support</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                      disabled={initializingWebsite}
                      className="bg-gray-800 border border-gray-700 hover:border-[#98b290] rounded-lg overflow-hidden text-left transition group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Template Preview Image */}
                      <div className="aspect-video bg-gray-700 flex items-center justify-center relative overflow-hidden">
                        {template.preview_image ? (
                          <img
                            src={template.preview_image}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition font-semibold">
                            Select Template
                          </span>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-1">{template.name}</h4>
                        <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                        <span className="inline-block px-2 py-1 bg-gray-700 text-xs rounded capitalize">
                          {template.business_type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {initializingWebsite && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#98b290] mb-4"></div>
                    <p className="text-lg">Initializing your website...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-2xl mb-2">Error loading website</div>
          <p className="text-gray-400">Please try again</p>
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
        className="h-screen flex flex-col bg-gray-900 text-white select-none"
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
        template={website as any}
        setTemplate={setWebsite as any}
        currentPage={currentPage}
        user={user}
        fileMenuRef={fileMenuRef}
        editMenuRef={editMenuRef}
        viewMenuRef={viewMenuRef}
        insertMenuRef={insertMenuRef}
        templateRef={websiteRef as any}
        imageGalleryRef={imageGalleryRef}
        handleNew={handleNewWebsite}
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
        addToHistory={addToHistory as any}
        handleLivePreview={handleLivePreview}
        setShowSourceCodeModal={setShowSourceCodeModal}
        setShowStylesheetModal={setShowStylesheetModal}
        setShowSitemapModal={setShowSitemapModal}
        setShowAddPageModal={setShowAddPageModal}
        setShowImageGallery={setShowImageGallery}
        uploadingImage={uploadingImage}
        handleImageUpload={handleImageUpload}
        setShowSectionLibraryModal={setShowSectionLibraryModal}
        setShowPageLibraryModal={setShowPageLibraryModal}
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

      {/* Published Website Indicator Banner */}
      {isPublished && website.published_at && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800 font-medium">
              Website is published
            </span>
            <span className="text-xs text-green-600">
              (Last published: {new Date(website.published_at).toLocaleDateString()})
            </span>
          </div>
          <button
            onClick={handleUnpublish}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition"
          >
            Unpublish
          </button>
        </div>
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
              template={website as any}
              setCurrentPage={setCurrentPage}
              setShowCSSPanel={setShowCSSPanel}
              setShowSectionCSS={setShowSectionCSS}
              setSelectedSection={setSelectedSection}
              setShowRightSidebar={setShowRightSidebar}
              cssInspectorMode={cssInspectorMode}
              setCssInspectorMode={setCssInspectorMode}
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
              template={website as any}
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
              template={website as any}
              setTemplate={setWebsite as any}
              templateRef={websiteRef as any}
              addToHistory={addToHistory as any}
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

      {/* Section Library Modals */}
      <ExportSectionModal
        isOpen={showExportSectionModal}
        onClose={() => {
          setShowExportSectionModal(false)
          setExportingSection(null)
        }}
        section={exportingSection}
        onExport={handleSectionExport}
      />

      <SectionLibraryModal
        isOpen={showSectionLibraryModal}
        onClose={() => setShowSectionLibraryModal(false)}
        onImport={handleImportSection}
      />

      {/* Page Library Modals */}
      <ExportPageModal
        isOpen={showExportPageModal}
        onClose={() => {
          setShowExportPageModal(false)
          setExportingPage(null)
        }}
        page={exportingPage}
        siteCss={website?.custom_css}
        onExport={handlePageExport}
      />

      <PageLibraryModal
        isOpen={showPageLibraryModal}
        onClose={() => setShowPageLibraryModal(false)}
        onImport={handleImportPage}
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
      setLinkUrl={linkUrl}
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
      template={website as any}
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
          templateId={website?.id || 0}
          images={website?.images || []}
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
        onLoadTemplate={handleLoadWebsite}
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
        generatePageHTML={genPageHTML}
      />

      {/* Stylesheet Modal */}
      <StylesheetModal
        isOpen={showStylesheetModal}
        onClose={() => {
          setShowStylesheetModal(false)
          setIsEditingCSS(false)
        }}
        currentPage={currentPage}
        template={website as any}
        isEditingCSS={isEditingCSS}
        setIsEditingCSS={setIsEditingCSS}
        editableCSS={editableCSS}
        setEditableCSS={setEditableCSS}
        onApplyChanges={handleApplyCSSChanges}
        generateStylesheet={genStylesheet}
      />

      {/* Sitemap Modal */}
      <SitemapModal
        isOpen={showSitemapModal}
        onClose={() => setShowSitemapModal(false)}
        template={website as any}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onOpenAddPageModal={() => {
          setShowAddPageModal(true)
          setShowSitemapModal(false)
        }}
        onOpenEditPageModal={(page: UserPage) => {
          setEditPageName(page.name)
          setEditPageSlug(page.slug)
          setEditPageMetaDescription(page.meta_description || '')
          setShowEditPageModal(true)
          setShowSitemapModal(false)
        }}
        onDeletePage={(pageId: number) => {
          handleDeletePage(pageId)
          if (pageId === currentPage?.id && website?.pages.length > 0) {
            setCurrentPage(website.pages[0])
          }
        }}
        onExportPage={handleExportPage}
      />
  </DndContext>
  )
}
