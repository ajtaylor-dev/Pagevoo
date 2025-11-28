import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/services/api'
import { sectionLibraryApi, pageLibraryApi, fileToBase64 } from '@/services/libraryApi'
import { databaseService } from '@/services/databaseService'
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
import { DatabaseManagementModal } from '@/components/database/DatabaseManagementModal'
import { FeatureInstallModal } from '@/components/features/FeatureInstallModal'
import { ManageFeaturesModal } from '@/components/features/ManageFeaturesModal'
import { ContactFormConfigModal } from '@/components/script-features/contact-form'
import { BlogManager } from '@/components/BlogManager'
import { EventsManager } from '@/components/EventsManager'
import { contactFormService } from '@/services/contactFormService'
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
import { useTheme } from '../hooks/useTheme'
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
import { coreSections, headerNavigationSections, footerSections, specialSections } from '../constants/sectionTemplates'
import { additionalFormSections } from '../constants/formSectionTemplates'
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
  exclusive_to: 'pro' | 'niche' | 'brochure' | null
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
  const { theme, currentTheme, changeTheme } = useTheme()

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

  // Database & Features
  const [showDatabaseModal, setShowDatabaseModal] = useState(false)
  const [showFeatureInstallModal, setShowFeatureInstallModal] = useState(false)
  const [showManageFeaturesModal, setShowManageFeaturesModal] = useState(false)
  const [showContactFormModal, setShowContactFormModal] = useState(false)
  const [showBlogManager, setShowBlogManager] = useState(false)
  const [showEventsManager, setShowEventsManager] = useState(false)
  const [installedFeatures, setInstalledFeatures] = useState<string[]>([])

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

  // Section Library states
  const [showSectionLibraryModal, setShowSectionLibraryModal] = useState(false)
  const [showExportSectionModal, setShowExportSectionModal] = useState(false)
  const [exportingSection, setExportingSection] = useState<TemplateSection | null>(null)
  const [importedSections, setImportedSections] = useState<any[]>([])

  // Page Library states
  const [showPageLibraryModal, setShowPageLibraryModal] = useState(false)
  const [showExportPageModal, setShowExportPageModal] = useState(false)
  const [exportingPage, setExportingPage] = useState<TemplatePage | null>(null)

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

  // Reset history helper function (must be before useFileHandlers)
  const resetHistory = (savedTemplate: Template) => {
    setHistory([JSON.parse(JSON.stringify(savedTemplate))])
    setHistoryIndex(0)
    setCanUndo(false)
    setCanRedo(false)
  }

  // File handlers hook (must be before useTemplateBuilderEffects)
  const {
    handleSaveTemplate,
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

  // Load installed features when template is available
  useEffect(() => {
    if (template?.id) {
      loadInstalledFeatures()
    }
  }, [template?.id])

  const loadInstalledFeatures = async () => {
    if (!template?.id) return

    try {
      // Get database instance for this template
      const database = await databaseService.getInstance('template', template.id)

      if (!database) {
        setInstalledFeatures([])
        return
      }

      // Get installed features
      const features = await databaseService.getInstalledFeatures(database.id)
      setInstalledFeatures(features.map(f => f.type))
    } catch (error) {
      console.error('Failed to load installed features:', error)
      setInstalledFeatures([])
    }
  }

  // Merge special sections with additional form sections (form-wrap first)
  const allSpecialSections = useMemo(() => {
    return [...additionalFormSections, ...specialSections]
  }, [])

  // Filter special sections based on installed features
  const filteredSpecialSections = useMemo(() => {
    return allSpecialSections.filter((section: any) => {
      if (!section.category) return false
      // Convert category hyphen format to underscore format for comparison
      // e.g., 'contact-form' becomes 'contact_form'
      const categoryAsFeature = section.category.replace(/-/g, '_')
      return installedFeatures.includes(categoryAsFeature)
    })
  }, [installedFeatures, allSpecialSections])

  // Check if current page has a form container
  const hasFormContainer = useMemo(() => {
    return currentPage?.sections?.some((section: any) => section.type === 'form-wrap') || false
  }, [currentPage?.sections])

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
    handleImageRename,
    handleImageUpdate,
    handleImageMove,
    handleCreateAlbum,
    handleUpdateAlbum,
    handleDeleteAlbum,
    handleSetAlbumCover
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
    handleGridColumnUpdate,
    handleRemoveFeatureSections
  } = useSectionHandlers({
    template,
    setTemplate,
    currentPage,
    setCurrentPage,
    selectedSection,
    setSelectedSection,
    addToHistory
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

  // Section Library Handlers
  // Handle exporting a section to the library
  const handleExportSection = (section: TemplateSection) => {
    setExportingSection(section)
    setShowExportSectionModal(true)
  }

  // Handle the actual export after user fills the form
  const handleSectionExport = async (data: {
    name: string
    description: string
    section_type: string
    tags: string[]
    preview_image?: File
    is_pagevoo_official?: boolean
  }) => {
    try {
      // Convert preview image to base64 if provided
      let previewImageBase64: string | undefined
      if (data.preview_image) {
        previewImageBase64 = await fileToBase64(data.preview_image)
      }

      const exportPayload = {
        name: data.name,
        description: data.description,
        section_type: data.section_type || 'standard',
        section_data: exportingSection || {},
        tags: data.tags,
        preview_image: previewImageBase64,
        is_pagevoo_official: data.is_pagevoo_official || false
      }

      // Export to library
      await sectionLibraryApi.export(exportPayload)

      // Success - the modal will show success message and close itself
    } catch (error) {
      console.error('TemplateBuilder: Error exporting section:', error)
      console.error('TemplateBuilder: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      })
      // Re-throw so the modal can catch and display the error
      throw error
    }
  }

  // Handle importing a section from the library to sidebar
  const handleImportSection = async (sectionId: number) => {
    try {
      // Fetch full section data from library
      const sectionData = await sectionLibraryApi.getById(sectionId)

      // Check if already imported
      if (importedSections.find(s => s.id === sectionId)) {
        alert('Section already imported to sidebar!')
        return
      }

      // Add to imported sections
      setImportedSections(prev => [...prev, sectionData])

      // Expand imported sections category
      if (!expandedCategories.includes('imported')) {
        setExpandedCategories(prev => [...prev, 'imported'])
      }
    } catch (error) {
      console.error('Error importing section:', error)
      alert('Failed to import section. Please try again.')
    }
  }

  // Remove imported section from sidebar
  const handleRemoveImportedSection = (sectionId: number) => {
    setImportedSections(prev => prev.filter(s => s.id !== sectionId))
  }

  // Page Library Handlers
  // Handle exporting a page to the library
  const handleExportPage = (page: TemplatePage) => {
    setExportingPage(page)
    setShowExportPageModal(true)
  }

  // Handle the actual export after user fills the form
  const handlePageExport = async (data: {
    name: string
    description: string
    meta_description: string
    meta_keywords: string
    tags: string[]
    preview_image?: File
    is_pagevoo_official?: boolean
  }) => {
    try {
      // Convert preview image to base64 if provided
      let previewImageBase64: string | undefined
      if (data.preview_image) {
        previewImageBase64 = await fileToBase64(data.preview_image)
      }

      // Export to library
      await pageLibraryApi.export({
        name: data.name,
        description: data.description,
        meta_description: data.meta_description,
        meta_keywords: data.meta_keywords,
        page_data: exportingPage || {},
        site_css: template?.custom_css || '',
        tags: data.tags,
        preview_image: previewImageBase64,
        is_pagevoo_official: data.is_pagevoo_official
      })

      alert('Page exported to library successfully!')
      setShowExportPageModal(false)
      setExportingPage(null)
    } catch (error) {
      console.error('Error exporting page:', error)
      alert('Failed to export page. Please try again.')
    }
  }

  // Handle importing a page from the library
  const handleImportPage = async (pageId: number, applySiteCSS: boolean) => {
    if (!template) return

    try {
      // Fetch full page data from library
      const pageData = await pageLibraryApi.getById(pageId)

      // Generate new IDs for page and all sections
      const newPageId = Date.now()
      const newPage = {
        ...pageData.page_data,
        id: newPageId,
        page_id: `imported-page-${newPageId}`,
        is_homepage: false, // Imported pages are never the homepage
        order: template.pages.length,
        sections: pageData.page_data.sections.map((section: any, index: number) => ({
          ...section,
          id: newPageId + index + 1,
          section_id: `imported-section-${newPageId}-${index}`,
          order: index
        }))
      }

      // Update template with new page
      let updatedTemplate = {
        ...template,
        pages: [...template.pages, newPage]
      }

      // Optionally apply site CSS
      if (applySiteCSS && pageData.site_css) {
        updatedTemplate = {
          ...updatedTemplate,
          custom_css: pageData.site_css
        }
      }

      setTemplate(updatedTemplate)
      setCurrentPage(newPage)
      addToHistory(updatedTemplate)

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
    handleDeleteSection,
    handleExportSection
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
        className={`h-screen flex flex-col ${theme.mainBg} ${theme.mainText} select-none`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
      {/* Compact VSCode-style Header */}
      <Header
        builderType="template"
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
        setHasUnsavedChanges={setHasUnsavedChanges}
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
        setShowFeatureInstallModal={setShowFeatureInstallModal}
        setShowDatabaseModal={setShowDatabaseModal}
        setShowManageFeaturesModal={setShowManageFeaturesModal}
        setShowImageGallery={setShowImageGallery}
        uploadingImage={uploadingImage}
        handleImageUpload={handleImageUpload}
        setShowSectionLibraryModal={setShowSectionLibraryModal}
        setShowPageLibraryModal={setShowPageLibraryModal}
        theme={theme}
        currentTheme={currentTheme}
        onThemeChange={changeTheme}
      />

      {/* Toolbar */}
      <Toolbar
        showLeftSidebar={showLeftSidebar}
        setShowLeftSidebar={setShowLeftSidebar}
        showRightSidebar={showRightSidebar}
        setShowRightSidebar={setShowRightSidebar}
        viewport={viewport}
        setViewport={setViewport}
        builderType="template"
        itemId={template?.id}
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
              specialSections={filteredSpecialSections}
              importedSections={importedSections}
              renderSectionThumbnail={(section) => <SectionThumbnail section={section} />}
              renderImportedSectionThumbnail={(section) => (
                <div className="h-16 bg-gray-700 rounded border border-blue-400 flex items-center justify-center">
                  {section.preview_image ? (
                    <img src={section.preview_image} alt={section.name} className="w-full h-full object-cover rounded" />
                  ) : (
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              )}
              DraggableSectionItem={DraggableSectionItem}
              DraggableImportedSectionItem={({ section, children }) => {
                const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
                  id: `imported-${section.id}`,
                  data: { section: section.section_data, source: 'imported-library' },
                })
                return (
                  <div
                    ref={setNodeRef}
                    {...listeners}
                    {...attributes}
                    className={`${isDragging ? 'opacity-50' : ''}`}
                  >
                    {children}
                  </div>
                )
              }}
              onRemoveImportedSection={handleRemoveImportedSection}
              onMouseDown={handleLeftMouseDown}
              theme={theme}
              hasFormContainer={hasFormContainer}
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
              theme={theme}
              onOpenGallery={() => setShowImageGallery(true)}
              onOpenBlogManager={() => setShowBlogManager(true)}
              onOpenEventsManager={() => setShowEventsManager(true)}
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
        showPagevooOption={true}
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
        siteCss={template?.custom_css}
        showPagevooOption={true}
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
          images={(template?.images || []).map(img => ({
            ...img,
            album_id: img.album_id || null,
            order: img.order || 0
          }))}
          albums={template?.albums || []}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          onRename={handleImageRename}
          onUpdateImage={handleImageUpdate}
          onMoveImage={handleImageMove}
          onCreateAlbum={handleCreateAlbum}
          onUpdateAlbum={handleUpdateAlbum}
          onDeleteAlbum={handleDeleteAlbum}
          onSetAlbumCover={handleSetAlbumCover}
        />
      )}

      {/* Blog Manager Modal */}
      {showBlogManager && (
        <BlogManager
          isOpen={showBlogManager}
          onClose={() => setShowBlogManager(false)}
          type="template"
          referenceId={template?.id || 0}
        />
      )}

      {/* Events Manager Modal */}
      {showEventsManager && (
        <EventsManager
          isOpen={showEventsManager}
          onClose={() => setShowEventsManager(false)}
          type="template"
          referenceId={template?.id || 0}
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
        template={template}
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
        template={template}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onOpenAddPageModal={() => {
          setShowAddPageModal(true)
          setShowSitemapModal(false)
        }}
        onOpenEditPageModal={(page: TemplatePage) => {
          setEditPageName(page.name)
          setEditPageSlug(page.slug)
          setEditPageMetaDescription(page.meta_description || '')
          setShowEditPageModal(true)
          setShowSitemapModal(false)
        }}
        onDeletePage={(pageId: number) => {
          handleDeletePage(pageId)
          if (pageId === currentPage?.id && template?.pages.length > 0) {
            setCurrentPage(template.pages[0])
          }
        }}
        onExportPage={handleExportPage}
      />

      {/* Database Management Modal */}
      <DatabaseManagementModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        type="template"
        referenceId={template?.id || 0}
      />

      {/* Feature Installation Modal */}
      <FeatureInstallModal
        isOpen={showFeatureInstallModal}
        onClose={() => {
          setShowFeatureInstallModal(false)
          loadInstalledFeatures() // Reload features when modal closes
        }}
        onFeatureInstalled={(featureType) => {
          loadInstalledFeatures() // Reload features after installation
          if (featureType === 'contact_form') {
            setShowContactFormModal(true)
          }
        }}
        onOpenDatabaseManagement={() => setShowDatabaseModal(true)}
        type="template"
        referenceId={template?.id || 0}
      />

      {/* Manage Features Modal */}
      {showManageFeaturesModal && (
        <ManageFeaturesModal
          onClose={() => {
            setShowManageFeaturesModal(false)
            loadInstalledFeatures() // Reload features when modal closes
          }}
          referenceId={template?.id || 0}
          referenceType="template"
          onConfigureFeature={(featureType) => {
            if (featureType === 'contact_form') {
              setShowContactFormModal(true)
            }
          }}
          onFeatureUninstalled={(featureType) => {
            // Remove all sections related to this feature from all pages
            handleRemoveFeatureSections(featureType)
          }}
        />
      )}

      {/* Contact Form Config Modal */}
      <ContactFormConfigModal
        isOpen={showContactFormModal}
        onClose={() => setShowContactFormModal(false)}
        onSave={async (config) => {
          try {
            // Convert frontend config to backend format and save
            const backendConfig = contactFormService.convertToBackendFormat({
              ...config,
              websiteId: template?.id || 0 // Use template ID for now
            })
            await contactFormService.createForm(backendConfig)
            alert('Contact form created successfully!')
            setShowContactFormModal(false)
          } catch (error) {
            console.error('Failed to save contact form:', error)
            alert('Failed to save contact form. Please try again.')
          }
        }}
      />
  </DndContext>
  )
}


