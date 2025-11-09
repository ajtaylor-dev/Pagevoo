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
import { useSectionHandlers } from '../hooks/useSectionHandlers'
import { usePageHandlers } from '../hooks/usePageHandlers'
import { useDragHandlers } from '../hooks/useDragHandlers'
import { useTextEditor } from '../hooks/useTextEditor'
import { useFileHandlers } from '../hooks/useFileHandlers'
import { useCodeHandlers } from '../hooks/useCodeHandlers'
import { useResizeHandlers } from '../hooks/useResizeHandlers'
import { useImageHandlers } from '../hooks/useImageHandlers'
import { useFormattingHandlers } from '../hooks/useFormattingHandlers'
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

  // Keep templateRef in sync with template state to avoid race conditions during save
  useEffect(() => {
    templateRef.current = template
  }, [template])

  // Load template data if ID is present, or create blank template
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) {
        // Create a blank template for new template creation with a default homepage
        const defaultHomepage: TemplatePage = {
          id: Date.now(),
          name: 'Home',
          slug: 'home',
          is_homepage: true,
          order: 0,
          sections: []
        }
        const newTemplate = {
          id: 0,
          name: 'Untitled Template',
          description: '',
          business_type: 'restaurant',
          is_active: true,
          pages: [defaultHomepage],
          preview_image: null,
          exclusive_to: null,
          technologies: [],
          features: []
        }
        setTemplate(newTemplate)
        setCurrentPage(defaultHomepage)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await api.getTemplate(parseInt(templateId))
        if (response.success && response.data) {
          const templateData = response.data

          // Ensure there's always at least one page and a homepage is designated
          if (!templateData.pages || templateData.pages.length === 0) {
            // No pages exist, create a default homepage
            templateData.pages = [{
              id: Date.now(),
              name: 'Home',
              slug: 'home',
              is_homepage: true,
              order: 0,
              sections: []
            }]
          } else {
            // Pages exist, ensure one is designated as homepage
            const hasHomepage = templateData.pages.some((p: TemplatePage) => p.is_homepage)
            if (!hasHomepage) {
              // No homepage designated, make the first page the homepage
              templateData.pages[0].is_homepage = true
            }
          }

          setTemplate(templateData)
          // Set current page to homepage or first page
          const homepage = templateData.pages.find((p: TemplatePage) => p.is_homepage) || templateData.pages[0]
          setCurrentPage(homepage)

          // Initialize history with loaded state
          setHistory([JSON.parse(JSON.stringify(templateData))])
          setHistoryIndex(0)
          setCanUndo(false)
          setCanRedo(false)

          // Set published status
          setIsPublished(templateData.is_active || false)

          // Template just loaded, so no unsaved changes
          setHasUnsavedChanges(false)
        }
      } catch (error) {
        console.error('Failed to load template:', error)
        alert('Failed to load template')
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [templateId])

  // Keyboard shortcuts for save, undo, redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N for New
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNew()
      }
      // Ctrl+S or Cmd+S for Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault()
        handleUndo()
      }
      // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z for Redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        if (canRedo) {
          e.preventDefault()
          handleRedo()
        }
      }
      // Ctrl+O or Cmd+O for Load
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        handleLoad()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, hasUnsavedChanges])

  // VSCode-style menu behavior: click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Check if click is inside a dropdown portal, color picker, or input field
      const targetElement = target as HTMLElement
      const isDropdownClick = targetElement.closest('[role="listbox"]') ||
                              targetElement.closest('[data-radix-popper-content-wrapper]') ||
                              targetElement.closest('[data-radix-select-content]') ||
                              targetElement.closest('.react-colorful') ||
                              targetElement.closest('input[type="text"]') ||
                              targetElement.tagName === 'INPUT'

      if (fileMenuRef.current && !fileMenuRef.current.contains(target) && !isDropdownClick) {
        setShowFileMenu(false)
      }
      if (editMenuRef.current && !editMenuRef.current.contains(target) && !isDropdownClick) {
        setShowEditMenu(false)
      }
      if (insertMenuRef.current && !insertMenuRef.current.contains(target) && !isDropdownClick) {
        setShowInsertMenu(false)
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(target) && !isDropdownClick) {
        setShowViewMenu(false)
      }
    }

    if (showFileMenu || showEditMenu || showInsertMenu || showViewMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFileMenu, showEditMenu, showInsertMenu, showViewMenu])

  // Reset CSS views when section changes
  useEffect(() => {
    setShowSectionCSS(false)
  }, [selectedSection?.id])

  // Debug: Track showImageGallery state changes
  useEffect(() => {
    console.log('showImageGallery state changed to:', showImageGallery)
    console.trace('Stack trace for showImageGallery change:')
  }, [showImageGallery])

  // Dynamically update HTML when template/page changes
  useEffect(() => {
    if (currentPage && showSourceCodeModal) {
      const generatedHTML = generatePageHTML()
      setEditableHTML(generatedHTML)
    }
  }, [currentPage, currentPage?.sections, JSON.stringify(currentPage?.sections?.map(s => ({ id: s.id, section_id: s.section_id, section_name: s.section_name }))), showSourceCodeModal])

  // Dynamically update CSS when template/page changes
  useEffect(() => {
    if (currentPage && template && showStylesheetModal) {
      const generatedCSS = generateStylesheet()
      setEditableCSS(generatedCSS)
    }
  }, [currentPage, currentPage?.sections, JSON.stringify(currentPage?.sections?.map(s => ({ id: s.id, section_id: s.section_id, section_name: s.section_name }))), template?.custom_css, currentPage?.page_css, showStylesheetModal])

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
    addToHistory,
    updateFormattingState,
    applyColor
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

  // Generate HTML source code from current page
  const generatePageHTML = (): string => {
    if (!currentPage || !currentPage.sections) return ''

    const sectionId = (section: TemplateSection) => section.section_id || `section-${section.id}`

    const generateSectionHTML = (section: TemplateSection): string => {
      const content = section.content || {}
      const id = sectionId(section)

      // Grid sections (1x1, 2x1, 3x1, etc.)
      if (section.type.startsWith('grid-')) {
        const columns = content.columns || []
        const columnsHTML = columns.map((col: any, idx: number) => {
          const colWidth = col.colWidth || 12
          return `    <div class="col-${colWidth}">\n      ${col.content || `Column ${idx + 1}`}\n    </div>`
        }).join('\n')

        return `  <section id="${id}">\n    <div class="row">\n${columnsHTML}\n    </div>\n  </section>`
      }

      // Hero sections
      if (section.type === 'hero') {
        return `  <section id="${id}" class="hero">
    <h1>${content.title || 'Welcome'}</h1>
    <p>${content.subtitle || 'Your subtitle here'}</p>
    <button>${content.cta_text || 'Get Started'}</button>
  </section>`
      }

      // Gallery sections
      if (section.type === 'gallery') {
        return `  <section id="${id}" class="gallery">
    <h2>${content.heading || 'Gallery'}</h2>
    <div class="gallery-grid">
      <!-- Gallery images here -->
    </div>
  </section>`
      }

      // Contact form
      if (section.type === 'contact-form') {
        return `  <section id="${id}" class="contact-form">
    <h2>${content.heading || 'Contact Us'}</h2>
    <form>
      <input type="text" placeholder="Name" required>
      <input type="email" placeholder="Email" required>
      <textarea placeholder="Message" required></textarea>
      <button type="submit">Send</button>
    </form>
  </section>`
      }

      // Booking form
      if (section.type === 'booking-form') {
        return `  <section id="${id}" class="booking-form">
    <h2>${content.heading || 'Book Now'}</h2>
    <form>
      <input type="text" placeholder="Name" required>
      <input type="date" placeholder="Date" required>
      <input type="time" placeholder="Time" required>
      <button type="submit">Book</button>
    </form>
  </section>`
      }

      // Login box
      if (section.type === 'login-box') {
        return `  <section id="${id}" class="login-box">
    <h2>${content.heading || 'Sign In'}</h2>
    <form>
      <input type="email" placeholder="Email" required>
      <input type="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  </section>`
      }

      // Testimonials
      if (section.type === 'testimonials') {
        return `  <section id="${id}" class="testimonials">
    <h2>${content.heading || 'What Our Customers Say'}</h2>
    <div class="testimonials-grid">
      <!-- Testimonials here -->
    </div>
  </section>`
      }

      // Navbar sections
      if (section.type === 'navbar' || section.type.startsWith('navbar-')) {
        const links = content.links || []
        const layoutConfig = content.layoutConfig || {}
        const logoPosition = layoutConfig.logoPosition || 'left'
        const linksPosition = layoutConfig.linksPosition || 'right'
        const logoWidth = layoutConfig.logoWidth || content.logoWidth || 25

        // Generate links HTML with dropdown support
        const generateLinksHTML = (linksList: any[], isSubMenu = false) => {
          return linksList.map((link: any, idx: number) => {
            if (typeof link === 'object') {
              const href = link.linkType === 'page' && link.pageId
                ? `#page-${link.pageId}`
                : link.url || '#'
              const label = link.label || 'Link'

              // Check for global button styling
              const hasButtonStyle = content.buttonStyling && content.buttonStyling.enabled
              const btnStyle = content.buttonStyling || {}

              // Check for sub-items (dropdown)
              if (link.subItems && link.subItems.length > 0) {
                const subItemsHTML = generateLinksHTML(link.subItems, true)
                const linkClass = hasButtonStyle ? 'nav-link nav-link-button' : 'nav-link'
                const buttonInlineStyles = hasButtonStyle ? ` style="background-color: ${btnStyle.backgroundColor}; color: ${btnStyle.textColor}; border: ${btnStyle.borderWidth || 0}px ${btnStyle.borderStyle || 'solid'} ${btnStyle.borderColor}; border-radius: ${btnStyle.borderRadius || 0}px; padding: ${btnStyle.paddingTop || 8}px ${btnStyle.paddingRight || 16}px ${btnStyle.paddingBottom || 8}px ${btnStyle.paddingLeft || 16}px; font-size: ${btnStyle.fontSize || 14}px; font-weight: ${btnStyle.fontWeight || '500'}; margin: ${btnStyle.marginTop || 5}px ${btnStyle.marginRight || 5}px ${btnStyle.marginBottom || 5}px ${btnStyle.marginLeft || 5}px; text-decoration: none; display: inline-block;"` : ''
                return `        <div class="nav-dropdown">
          <a href="${href}" class="${linkClass} dropdown-toggle"${buttonInlineStyles}>${label}</a>
          <div class="dropdown-menu">
${subItemsHTML}
          </div>
        </div>`
              }

              if (isSubMenu) {
                const linkClass = hasButtonStyle ? 'dropdown-item dropdown-item-button' : 'dropdown-item'
                const buttonInlineStyles = hasButtonStyle ? ` style="background-color: ${btnStyle.backgroundColor}; color: ${btnStyle.textColor}; border: ${btnStyle.borderWidth || 0}px ${btnStyle.borderStyle || 'solid'} ${btnStyle.borderColor}; border-radius: ${btnStyle.borderRadius || 0}px; padding: ${btnStyle.paddingTop || 8}px ${btnStyle.paddingRight || 16}px ${btnStyle.paddingBottom || 8}px ${btnStyle.paddingLeft || 16}px; font-size: ${btnStyle.fontSize || 14}px; font-weight: ${btnStyle.fontWeight || '500'}; margin: ${btnStyle.marginTop || 5}px ${btnStyle.marginRight || 5}px ${btnStyle.marginBottom || 5}px ${btnStyle.marginLeft || 5}px; text-decoration: none; display: inline-block;"` : ''
                return `            <a href="${href}" class="${linkClass}"${buttonInlineStyles}>${label}</a>`
              }

              const linkClass = hasButtonStyle ? 'nav-link nav-link-button' : 'nav-link'
              const buttonInlineStyles = hasButtonStyle ? ` style="background-color: ${btnStyle.backgroundColor}; color: ${btnStyle.textColor}; border: ${btnStyle.borderWidth || 0}px ${btnStyle.borderStyle || 'solid'} ${btnStyle.borderColor}; border-radius: ${btnStyle.borderRadius || 0}px; padding: ${btnStyle.paddingTop || 8}px ${btnStyle.paddingRight || 16}px ${btnStyle.paddingBottom || 8}px ${btnStyle.paddingLeft || 16}px; font-size: ${btnStyle.fontSize || 14}px; font-weight: ${btnStyle.fontWeight || '500'}; margin: ${btnStyle.marginTop || 0}px ${btnStyle.marginRight || 0}px ${btnStyle.marginBottom || 0}px ${btnStyle.marginLeft || 0}px; text-decoration: none; display: inline-block;"` : ''
              return `        <a href="${href}" class="${linkClass}"${buttonInlineStyles}>${label}</a>`
            }
            return isSubMenu
              ? `            <a href="#" class="dropdown-item">${link}</a>`
              : `        <a href="#" class="nav-link">${link}</a>`
          }).join('\n')
        }

        const linksHTML = generateLinksHTML(links)
        const logoHTML = `      <div class="nav-logo" style="width: ${logoPosition === 'center' ? '100%' : logoWidth + '%'}; text-align: ${logoPosition === 'center' ? 'center' : logoPosition === 'right' ? 'right' : 'left'};">${content.logo || 'Logo'}</div>`
        const navLinksHTML = `      <div class="nav-links" style="justify-content: ${linksPosition === 'center' ? 'center' : linksPosition === 'left' ? 'flex-start' : 'flex-end'};">
${linksHTML}
      </div>`

        // Arrange logo and links based on position
        let contentHTML = ''
        if (logoPosition === 'left' || logoPosition === 'center') {
          contentHTML = logoHTML + '\n' + navLinksHTML
        } else {
          contentHTML = navLinksHTML + '\n' + logoHTML
        }

        return `  <nav id="${id}" class="${section.type}">
    <div class="nav-container">
${contentHTML}
    </div>
  </nav>`
      }

      // Header sections
      if (section.type.startsWith('header-')) {
        const links = content.links || []
        let linksHTML = ''
        if (content.navigation !== false && links.length > 0) {
          linksHTML = links.map((link: any) => {
            if (typeof link === 'object') {
              const href = link.linkType === 'page' && link.pageId
                ? `#page-${link.pageId}`
                : link.url || '#'
              return `      <a href="${href}">${link.label || 'Link'}</a>`
            }
            return `      <a href="#">${link}</a>`
          }).join('\n')
        }

        if (section.type === 'header-centered') {
          return `  <header id="${id}" class="${section.type}">
    <div class="logo">${content.logo || 'Brand'}</div>
    ${content.tagline ? `<p class="tagline">${content.tagline}</p>` : ''}
    ${linksHTML ? `<div class="nav-links">\n${linksHTML}\n    </div>` : ''}
  </header>`
        } else if (section.type === 'header-split') {
          return `  <header id="${id}" class="${section.type}">
    <div class="logo">${content.logo || 'Logo'}</div>
    ${linksHTML ? `<div class="nav-links">\n${linksHTML}\n    </div>` : ''}
  </header>`
        } else {
          return `  <header id="${id}" class="${section.type}">
    <div class="logo">${content.logo || 'Company Name'}</div>
    ${content.tagline ? `<p class="tagline">${content.tagline}</p>` : ''}
  </header>`
        }
      }

      // Sidebar sections
      if (section.type.startsWith('sidebar-nav-')) {
        const links = content.links || ['Dashboard', 'Profile', 'Settings', 'Logout']
        const linksHTML = links.map((link: string) => `      <a href="#">${link}</a>`).join('\n')
        return `  <aside id="${id}" class="${section.type}">
    <nav>
${linksHTML}
    </nav>
  </aside>`
      }

      // Footer sections
      if (section.type.startsWith('footer-')) {
        if (section.type === 'footer-simple') {
          return `  <footer id="${id}" class="footer-simple">
    <p>${content.text || '© 2025 Company Name. All rights reserved.'}</p>
  </footer>`
        } else if (section.type === 'footer-columns') {
          const columns = content.columns || []
          const columnsHTML = columns.map((col: any) => {
            return `      <div class="footer-column">
        ${col.content || '<p>Column content</p>'}
      </div>`
          }).join('\n')
          const copyrightText = content.copyrightText || '© 2025 Company Name. All rights reserved.'
          return `  <footer id="${id}" class="footer-columns">
    <div class="footer-grid">
${columnsHTML}
    </div>
    <div class="footer-copyright">
      <p>${copyrightText}</p>
    </div>
  </footer>`
        }
      }

      // Default/unknown section type
      return `  <section id="${id}" class="${section.type}">
    <!-- ${section.type} section -->
  </section>`
    }

    // Generate HTML for all sections
    const sectionsHTML = currentPage.sections
      .sort((a, b) => a.order - b.order)
      .map(section => generateSectionHTML(section))
      .join('\n\n')

    // Generate complete HTML document
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentPage.name}</title>
  ${currentPage.meta_description ? `<meta name="description" content="${currentPage.meta_description}">` : ''}
  <style>
    /* Add your CSS styles here */
  </style>
</head>
<body>

${sectionsHTML}

</body>
</html>`
  }

  // Generate complete stylesheet (style.css)
  const generateStylesheet = (): string => {
    if (!currentPage || !template) return ''

    let css = ''

    // Header comment
    css += `/*\n * Generated Stylesheet for ${currentPage.name}\n * Generated by Pagevoo Template Builder\n */\n\n`

    // 1. Base Reset and Box Sizing
    css += `/* Base Reset */\n\n`
    css += `*, *::after, *::before {\n`
    css += `  box-sizing: border-box;\n`
    css += `  margin: 0;\n`
    css += `  padding: 0;\n`
    css += `  border-radius: 0;\n`
    css += `}\n\n`

    // Check if first section is a fixed/sticky navbar
    const firstSection = currentPage.sections && currentPage.sections.length > 0
      ? currentPage.sections.sort((a, b) => a.order - b.order)[0]
      : null
    const hasFixedNavbar = firstSection &&
      (firstSection.type === 'navbar' || firstSection.type.startsWith('navbar-')) &&
      firstSection.content?.position &&
      (firstSection.content.position === 'fixed' || firstSection.content.position === 'sticky')

    css += `body {\n`
    css += `  margin: 0;\n`
    css += `  padding: 0;\n`
    css += `  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n`
    css += `  line-height: 1.6;\n`
    // Add padding-top if there's a fixed/sticky navbar
    if (hasFixedNavbar) {
      css += `  padding-top: 80px; /* Space for fixed/sticky navbar */\n`
    }
    css += `}\n\n`

    // Remove top margin from first element to prevent gap at top of page
    css += `body > *:first-child {\n`
    css += `  margin-top: 0;\n`
    css += `}\n\n`

    // 2. Default link styles
    css += `a {\n`
    css += `  color: inherit;\n`
    css += `  text-decoration: none;\n`
    css += `}\n\n`

    // 3. Navigation Base Styles
    css += `/* Navigation Base Styles */\n\n`
    css += `nav.navbar, nav[class*="navbar-"], header[class*="header-"] {\n`
    css += `  padding: 16px 0;\n`
    css += `  background-color: #ffffff;\n`
    css += `  border-bottom: 2px solid #e5e7eb;\n`
    css += `  border-radius: 0;\n`
    css += `  position: relative;\n`
    css += `}\n\n`

    css += `.nav-container {\n`
    css += `  display: flex;\n`
    css += `  align-items: center;\n`
    css += `  justify-content: space-between;\n`
    css += `  flex-wrap: wrap;\n`
    css += `  gap: 8px;\n`
    css += `  width: 100%;\n`
    css += `  padding: 0 16px;\n`
    css += `}\n\n`

    css += `.nav-logo, .logo {\n`
    css += `  font-size: 1.25rem;\n`
    css += `  font-weight: bold;\n`
    css += `  min-width: 120px;\n`
    css += `}\n\n`

    css += `.nav-links {\n`
    css += `  display: flex;\n`
    css += `  gap: 1.5rem;\n`
    css += `  align-items: center;\n`
    css += `  flex-wrap: wrap;\n`
    css += `  flex: 1;\n`
    css += `}\n\n`

    css += `.nav-link {\n`
    css += `  text-decoration: none;\n`
    css += `  color: inherit;\n`
    css += `  transition: opacity 0.2s;\n`
    css += `}\n\n`

    css += `.nav-link:hover {\n`
    css += `  opacity: 0.75;\n`
    css += `}\n\n`

    css += `.nav-dropdown {\n`
    css += `  position: relative;\n`
    css += `}\n\n`

    css += `.dropdown-toggle {\n`
    css += `  cursor: pointer;\n`
    css += `  display: flex;\n`
    css += `  align-items: center;\n`
    css += `  gap: 0.25rem;\n`
    css += `}\n\n`

    css += `.dropdown-menu {\n`
    css += `  display: none;\n`
    css += `  position: absolute;\n`
    css += `  top: 100%;\n`
    css += `  left: 0;\n`
    css += `  margin-top: 0.25rem;\n`
    css += `  background-color: #ffffff;\n`
    css += `  border: 1px solid #e5e7eb;\n`
    css += `  border-radius: 0.25rem;\n`
    css += `  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n`
    css += `  padding: 0.5rem;\n`
    css += `  min-width: 150px;\n`
    css += `  z-index: 10;\n`
    css += `}\n\n`

    css += `.nav-dropdown.active .dropdown-menu {\n`
    css += `  display: block;\n`
    css += `}\n\n`

    css += `.dropdown-item {\n`
    css += `  display: block;\n`
    css += `  padding: 0.5rem 0.75rem;\n`
    css += `  text-decoration: none;\n`
    css += `  color: inherit;\n`
    css += `  border-radius: 0.25rem;\n`
    css += `  transition: background-color 0.2s;\n`
    css += `}\n\n`

    css += `.dropdown-item:hover {\n`
    css += `  background-color: #f3f4f6;\n`
    css += `}\n\n`

    css += `.mobile-menu-btn {\n`
    css += `  display: none;\n`
    css += `  background: none;\n`
    css += `  border: none;\n`
    css += `  cursor: pointer;\n`
    css += `  padding: 0.5rem;\n`
    css += `}\n\n`

    css += `.menu-icon {\n`
    css += `  width: 1.5rem;\n`
    css += `  height: 1.5rem;\n`
    css += `  color: #374151;\n`
    css += `}\n\n`

    css += `.mobile-menu {\n`
    css += `  display: none;\n`
    css += `  width: 100%;\n`
    css += `  background-color: #ffffff;\n`
    css += `  border-top: 1px solid #e5e7eb;\n`
    css += `  padding: 1rem;\n`
    css += `}\n\n`

    css += `.mobile-menu.active {\n`
    css += `  display: block;\n`
    css += `}\n\n`

    css += `.mobile-menu a {\n`
    css += `  display: block;\n`
    css += `  padding: 0.75rem;\n`
    css += `  border-radius: 0.375rem;\n`
    css += `}\n\n`

    css += `.mobile-menu a:hover {\n`
    css += `  background-color: #f3f4f6;\n`
    css += `}\n\n`

    // 4. Mobile Navigation
    css += `/* Mobile Navigation */\n\n`
    css += `@media (max-width: 767px) {\n`
    css += `  .desktop-menu {\n`
    css += `    display: none;\n`
    css += `  }\n\n`
    css += `  .mobile-menu-btn {\n`
    css += `    display: block;\n`
    css += `  }\n`
    css += `}\n\n`

    // 5. Responsive Grid System
    css += `/* Responsive Grid System */\n\n`
    css += `[class*="col-"] {\n`
    css += `  float: left;\n`
    css += `  width: 100%;\n`
    css += `}\n\n`

    css += `.row::after {\n`
    css += `  content: "";\n`
    css += `  clear: both;\n`
    css += `  display: table;\n`
    css += `}\n\n`

    // 6. Text Content Styles
    css += `/* Text Content Styles */\n\n`

    // Extract H1-H4 styles from Site CSS if they exist (custom header settings)
    let hasCustomHeaders = false
    if (template.custom_css) {
      const h1Match = template.custom_css.match(/(?:\.row\s+)?h1\s*\{([^}]+)\}/i)
      const h2Match = template.custom_css.match(/(?:\.row\s+)?h2\s*\{([^}]+)\}/i)
      const h3Match = template.custom_css.match(/(?:\.row\s+)?h3\s*\{([^}]+)\}/i)
      const h4Match = template.custom_css.match(/(?:\.row\s+)?h4\s*\{([^}]+)\}/i)

      if (h1Match) {
        const selector = h1Match[0].match(/^[^{]+/)[0].trim()
        css += `${selector} {\n${h1Match[1]}\n}\n\n`
        hasCustomHeaders = true
      }
      if (h2Match) {
        const selector = h2Match[0].match(/^[^{]+/)[0].trim()
        css += `${selector} {\n${h2Match[1]}\n}\n\n`
        hasCustomHeaders = true
      }
      if (h3Match) {
        const selector = h3Match[0].match(/^[^{]+/)[0].trim()
        css += `${selector} {\n${h3Match[1]}\n}\n\n`
        hasCustomHeaders = true
      }
      if (h4Match) {
        const selector = h4Match[0].match(/^[^{]+/)[0].trim()
        css += `${selector} {\n${h4Match[1]}\n}\n\n`
        hasCustomHeaders = true
      }
    }

    // If no custom header styles, use browser defaults (no hardcoded styles)
    // This allows the browser's natural heading hierarchy to work
    if (!hasCustomHeaders) {
      // Only add margin for spacing, let browser handle font-size and font-weight
      css += `.row h1, .row h2, .row h3, .row h4 {\n`
      css += `  margin: 0.67em 0;\n`
      css += `}\n\n`
    }

    // Extract Paragraph styles from Site CSS if they exist (custom paragraph settings)
    let hasCustomParagraph = false
    if (template.custom_css) {
      const pMatch = template.custom_css.match(/(?:\.row\s+)?p\s*\{([^}]+)\}/i)
      if (pMatch) {
        const selector = pMatch[0].match(/^[^{]+/)[0].trim()
        css += `${selector} {\n${pMatch[1]}\n}\n\n`
        hasCustomParagraph = true
      }
    }

    // If no custom paragraph styles, use default margin
    if (!hasCustomParagraph) {
      css += `.row p {\n`
      css += `  margin: 1em 0;\n`
      css += `}\n\n`
    }

    css += `.row ul, .row ol {\n`
    css += `  margin: 1em 0;\n`
    css += `  padding-left: 2.5em;\n`
    css += `  list-style-position: outside;\n`
    css += `}\n\n`

    css += `.row ul {\n`
    css += `  list-style-type: disc;\n`
    css += `}\n\n`

    css += `.row ol {\n`
    css += `  list-style-type: decimal;\n`
    css += `}\n\n`

    css += `.row li {\n`
    css += `  margin: 0.5em 0;\n`
    css += `  display: list-item;\n`
    css += `}\n\n`

    // 7. Site CSS (Global styles)
    if (template.custom_css && template.custom_css.trim()) {
      css += `/* Site-Wide Styles */\n\n`
      css += template.custom_css + '\n\n'
    }

    // 8. Page CSS (Page-specific styles)
    if (currentPage.page_css && currentPage.page_css.trim()) {
      css += `/* Page: ${currentPage.name} */\n\n`
      css += currentPage.page_css + '\n\n'
    }

    // 9. Section, Row, and Column CSS
    if (currentPage.sections && currentPage.sections.length > 0) {

      currentPage.sections
        .sort((a, b) => a.order - b.order)
        .forEach(section => {
          const sectionId = section.section_id || `section-${section.id}`

          // Section CSS
          if (section.content?.section_css) {
            css += `/* Section: ${section.section_name || section.type} */\n`
            css += `#${sectionId} {\n`
            css += `  ${section.content.section_css.trim()}\n`
            css += `}\n\n`
          }

          // Content CSS (row and columns)
          const contentCSS = section.content?.content_css
          if (contentCSS) {
            // Row CSS
            if (contentCSS.row) {
              css += `/* ${section.section_name || section.type} - Row */\n`
              css += `#${sectionId} .row {\n`
              css += `  ${contentCSS.row.trim()}\n`
              css += `}\n\n`
            }

            // Column CSS
            if (contentCSS.columns) {
              const columns = section.content?.columns || []
              Object.entries(contentCSS.columns).forEach(([colIdx, colCSS]) => {
                if (colCSS) {
                  const colWidth = columns[parseInt(colIdx)]?.colWidth || 12
                  css += `/* ${section.section_name || section.type} - Column ${parseInt(colIdx) + 1} */\n`
                  css += `#${sectionId} .col-${colWidth}:nth-of-type(${parseInt(colIdx) + 1}) {\n`
                  css += `  ${(colCSS as string).trim()}\n`
                  css += `}\n\n`
                }
              })
            }
          }

          // Navigation/Header Styling (containerStyle, linkStyling)
          if (section.type === 'navbar' || section.type.startsWith('navbar-') || section.type.startsWith('header-')) {
            const content = section.content || {}

            // Container Style
            if (content.containerStyle || content.position) {
              const cs = content.containerStyle || {}
              const navPosition = content.position || 'static'
              css += `/* ${section.section_name || section.type} - Container */\n`
              css += `#${sectionId} {\n`
              if (cs.background) css += `  background: ${cs.background};\n`
              if (cs.paddingTop) css += `  padding-top: ${cs.paddingTop};\n`
              if (cs.paddingRight) css += `  padding-right: ${cs.paddingRight};\n`
              if (cs.paddingBottom) css += `  padding-bottom: ${cs.paddingBottom};\n`
              if (cs.paddingLeft) css += `  padding-left: ${cs.paddingLeft};\n`
              if (cs.marginTop) css += `  margin-top: ${cs.marginTop};\n`
              if (cs.marginRight) css += `  margin-right: ${cs.marginRight};\n`
              if (cs.marginBottom) css += `  margin-bottom: ${cs.marginBottom};\n`
              if (cs.marginLeft) css += `  margin-left: ${cs.marginLeft};\n`
              if (cs.width) css += `  width: ${cs.width};\n`
              if (cs.height) css += `  height: ${cs.height};\n`
              if (cs.borderWidth) css += `  border-width: ${cs.borderWidth}px;\n`
              if (cs.borderStyle && cs.borderStyle !== 'none') css += `  border-style: ${cs.borderStyle};\n`
              if (cs.borderColor) css += `  border-color: ${cs.borderColor};\n`
              if (cs.borderRadius) css += `  border-radius: ${cs.borderRadius}px;\n`
              // Add position property
              if (navPosition && navPosition !== 'static') {
                css += `  position: ${navPosition};\n`
                if (navPosition === 'fixed' || navPosition === 'sticky') {
                  css += `  top: 0;\n`
                  css += `  left: 0;\n`
                  css += `  right: 0;\n`
                  css += `  z-index: 1000;\n`
                }
              }
              css += `}\n\n`
            }

            // Link Styling
            if (content.linkStyling) {
              const ls = content.linkStyling
              css += `/* ${section.section_name || section.type} - Links */\n`
              css += `#${sectionId} a {\n`
              if (ls.textColor) css += `  color: ${ls.textColor};\n`
              if (ls.bgColor) css += `  background-color: ${ls.bgColor};\n`
              if (ls.fontSize) css += `  font-size: ${ls.fontSize}px;\n`
              css += `  text-decoration: none;\n`
              css += `}\n\n`

              css += `#${sectionId} a:hover {\n`
              if (ls.textColorHover) css += `  color: ${ls.textColorHover};\n`
              if (ls.bgColorHover) css += `  background-color: ${ls.bgColorHover};\n`
              css += `}\n\n`
            }

            // Button-styled links hover states (global)
            if (content.buttonStyling && content.buttonStyling.enabled) {
              const btnStyle = content.buttonStyling
              css += `/* ${section.section_name || section.type} - Button Links Hover */\n`
              css += `#${sectionId} .nav-link-button:hover,\n`
              css += `#${sectionId} .dropdown-item-button:hover {\n`
              css += `  background-color: ${btnStyle.hoverBackgroundColor} !important;\n`
              css += `  color: ${btnStyle.hoverTextColor} !important;\n`
              css += `  transition: all 0.2s;\n`
              css += `}\n\n`

              // Remove gap when button styling is enabled (margin controls the spacing)
              css += `/* ${section.section_name || section.type} - Remove Default Gap */\n`
              css += `#${sectionId} .nav-links {\n`
              css += `  gap: 0;\n`
              css += `}\n\n`
            }
          }

          // Footer styling
          if (section.type.startsWith('footer-')) {
            const sectionId = section.section_id || `section-${section.id}`
            const content = section.content || {}

            if (section.type === 'footer-simple') {
              const sectionStyle = content.sectionStyle || {}
              css += `/* ${section.section_name || section.type} - Footer Simple */\n`
              css += `#${sectionId} {\n`
              if (sectionStyle.background) css += `  background-color: ${sectionStyle.background};\n`
              else css += `  background-color: #1f2937;\n`
              if (sectionStyle.textColor) css += `  color: ${sectionStyle.textColor};\n`
              else css += `  color: white;\n`
              if (sectionStyle.padding) css += `  padding: ${sectionStyle.padding};\n`
              else css += `  padding: 2rem;\n`
              if (sectionStyle.textAlign) css += `  text-align: ${sectionStyle.textAlign};\n`
              else css += `  text-align: center;\n`
              css += `}\n\n`

              css += `#${sectionId} p {\n`
              if (sectionStyle.fontSize) css += `  font-size: ${sectionStyle.fontSize};\n`
              else css += `  font-size: 0.875rem;\n`
              css += `}\n\n`
            }

            if (section.type === 'footer-columns') {
              const sectionStyle = content.sectionStyle || {}
              const copyrightStyle = content.copyrightStyle || {}

              css += `/* ${section.section_name || section.type} - Footer Columns */\n`
              css += `#${sectionId} {\n`
              if (sectionStyle.background) css += `  background-color: ${sectionStyle.background};\n`
              else css += `  background-color: #172554;\n`
              if (sectionStyle.textColor) css += `  color: ${sectionStyle.textColor};\n`
              else css += `  color: white;\n`
              css += `}\n\n`

              css += `#${sectionId} .footer-grid {\n`
              css += `  display: grid;\n`
              css += `  grid-template-columns: repeat(3, 1fr);\n`
              css += `  gap: 2rem;\n`
              css += `  padding: 3rem;\n`
              css += `  max-width: 1280px;\n`
              css += `  margin: 0 auto;\n`
              css += `}\n\n`

              css += `#${sectionId} .footer-column {\n`
              css += `  min-height: 150px;\n`
              css += `  text-align: center;\n`
              css += `}\n\n`

              css += `#${sectionId} .footer-copyright {\n`
              if (copyrightStyle.background) css += `  background-color: ${copyrightStyle.background};\n`
              else css += `  background-color: #171717;\n`
              if (copyrightStyle.padding) css += `  padding: ${copyrightStyle.padding};\n`
              else css += `  padding: 1.5rem;\n`
              if (copyrightStyle.borderTop) css += `  border-top: ${copyrightStyle.borderTop};\n`
              else css += `  border-top: 1px solid #374151;\n`
              css += `}\n\n`

              css += `#${sectionId} .footer-copyright p {\n`
              if (copyrightStyle.fontSize) css += `  font-size: ${copyrightStyle.fontSize};\n`
              else css += `  font-size: 0.875rem;\n`
              css += `  text-align: center;\n`
              css += `  max-width: 1280px;\n`
              css += `  margin: 0 auto;\n`
              css += `  padding: 0 3rem;\n`
              css += `}\n\n`
            }
          }
        })
    }

    // 10. Responsive Breakpoints
    css += `/* Responsive Breakpoints */\n\n`
    css += `@media (min-width: 768px) {\n`
    css += `  .col-1 { width: 8.33%; }\n`
    css += `  .col-2 { width: 16.67%; }\n`
    css += `  .col-3 { width: 25%; }\n`
    css += `  .col-4 { width: 33.33%; }\n`
    css += `  .col-5 { width: 41.67%; }\n`
    css += `  .col-6 { width: 50%; }\n`
    css += `  .col-7 { width: 58.33%; }\n`
    css += `  .col-8 { width: 66.67%; }\n`
    css += `  .col-9 { width: 75%; }\n`
    css += `  .col-10 { width: 83.33%; }\n`
    css += `  .col-11 { width: 91.67%; }\n`
    css += `  .col-12 { width: 100%; }\n`
    css += `}\n\n`

    css += `@media (min-width: 1025px) {\n`
    css += `  .col-1 { width: 8.33%; }\n`
    css += `  .col-2 { width: 16.67%; }\n`
    css += `  .col-3 { width: 25%; }\n`
    css += `  .col-4 { width: 33.33%; }\n`
    css += `  .col-5 { width: 41.67%; }\n`
    css += `  .col-6 { width: 50%; }\n`
    css += `  .col-7 { width: 58.33%; }\n`
    css += `  .col-8 { width: 66.67%; }\n`
    css += `  .col-9 { width: 75%; }\n`
    css += `  .col-10 { width: 83.33%; }\n`
    css += `  .col-11 { width: 91.67%; }\n`
    css += `  .col-12 { width: 100%; }\n`
    css += `}\n`

    return css
  }

  // Clickable text component that opens the editor

  const renderSection = (section: TemplateSection, index: number) => {
    // Determine which section component to render
    let sectionContent: React.ReactNode

    // Grid sections (1x1, 2x1, 3x1, etc.)
    if (section.type.startsWith('grid-')) {
      sectionContent = (
        <GridSection
          section={section}
          selectedSection={selectedSection}
          editingText={editingText}
          onOpenTextEditor={handleOpenTextEditor}
          onUpdateColumn={handleGridColumnUpdate}
        />
      )
    } else {
      switch (section.type) {
        // Navigation and Header sections
        case 'navbar':
          sectionContent = (
            <NavbarSection
              section={section}
              selectedSection={selectedSection}
              editingText={editingText}
              currentPage={currentPage}
              template={template}
              mobileMenuOpen={!!mobileMenuOpen[section.id]}
              onSetMobileMenuOpen={(open) => setMobileMenuOpen({ ...mobileMenuOpen, [section.id]: open })}
              onOpenTextEditor={handleOpenTextEditor}
            />
          )
          break

        // Legacy navbar types (deprecated)
        case 'navbar-basic':
        case 'navbar-sticky':
        case 'navbar-dropdown':
          sectionContent = (
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 text-center">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ This navbar type is deprecated. Please delete this section and add the new unified "Navigation Bar" instead.
              </p>
            </div>
          )
          break

        // Footer sections
        case 'footer-simple':
        case 'footer-columns':
          sectionContent = (
            <FooterSection
              section={section}
              selectedSection={selectedSection}
              editingText={editingText}
              onOpenTextEditor={handleOpenTextEditor}
            />
          )
          break

        default:
          sectionContent = (
            <div className={`p-12 border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#98b290] transition ${selectedSection?.id === section.id ? 'border-[#98b290]' : ''}`}>
              <p className="text-gray-500 text-center">Section: {section.type}</p>
            </div>
          )
      }
    }

    // Wrap the section content with the SectionWrapper component
    return (
      <SectionWrapper
        section={section}
        index={index}
        hoveredSection={hoveredSection}
        setHoveredSection={setHoveredSection}
        setSelectedSection={setSelectedSection}
        showCSSPanel={showCSSPanel}
        setShowCSSPanel={setShowCSSPanel}
        cssInspectorMode={cssInspectorMode}
        currentPage={currentPage}
        template={template}
        handleMoveSidebar={handleMoveSidebar}
        handleMoveSection={handleMoveSection}
        handleToggleSectionLock={handleToggleSectionLock}
        handleDeleteSection={handleDeleteSection}
      >
        {sectionContent}
      </SectionWrapper>
    )
  }


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

  console.log('🔴 TemplateBuilder RENDER - showImageGallery:', showImageGallery, 'template ID:', template?.id)

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
        <div className="bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] border-b border-[#d4e5d0] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#5a7a54]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-[#4a6344]">Published Template</span>
              <p className="text-xs text-[#5a7a54]">This template is published and available to users. Changes will update the published version.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Unpublish this template? It will no longer be available to users.')) {
                const updatedTemplate = { ...template!, is_active: false }
                api.updateTemplate(template!.id, updatedTemplate).then(response => {
                  if (response.success) {
                    setTemplate(updatedTemplate)
                    setIsPublished(false)
                  }
                })
              }
            }}
            className="px-3 py-1 bg-white border border-[#b8ceb4] text-[#5a7a54] rounded text-xs hover:bg-[#e8f0e6] transition"
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
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Viewing page:</span>
                <select
                  value={currentPage?.id || ''}
                  onChange={(e) => {
                    const selectedPage = template.pages.find(p => p.id === parseInt(e.target.value))
                    if (selectedPage) setCurrentPage(selectedPage)
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                >
                  {template.pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name} {page.is_homepage ? '(Home)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setShowCSSPanel(true)
                    setShowSectionCSS(false)
                    setSelectedSection(null)
                    setShowRightSidebar(true)
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition"
                  title="Edit Site/Page Styling"
                >
                  <span className="text-xs font-bold text-blue-600">Site/Page Styling</span>
                </button>
                <button
                  onClick={() => setCssInspectorMode(!cssInspectorMode)}
                  className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                    cssInspectorMode
                      ? 'bg-[#98b290] text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={cssInspectorMode ? 'Disable CSS Inspector' : 'Enable CSS Inspector - Hover over sections to see their CSS'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {cssInspectorMode ? 'CSS: ON' : 'CSS'}
                </button>
              </div>
              <div className="flex items-center gap-1">
                {currentPage && !currentPage.is_homepage && (
                  <button
                    onClick={() => handleSetHomepage(currentPage.id)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                    title="Set as Homepage"
                  >
                    Set as Home
                  </button>
                )}
                {currentPage && template.pages.length > 1 && (
                  <button
                    onClick={() => handleDeletePage(currentPage.id)}
                    className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
                    title="Delete Page"
                  >
                    Delete Page
                  </button>
                )}
                <button
                  onClick={() => setShowAddPageModal(true)}
                  className="px-2 py-1 text-xs bg-[#98b290] hover:bg-[#7a9274] text-white rounded transition"
                  title="Add New Page"
                >
                  + Add Page
                </button>
              </div>
            </div>

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

    {/* Drag Overlay - Shows preview of dragged item */}
    <DragOverlay>
      {activeId && activeDragData ? (
        <div className="bg-white shadow-2xl rounded-lg p-4 border-2 border-[#98b290] opacity-90">
          <div className="text-sm font-semibold text-gray-700 capitalize">
            {activeDragData.source === 'library'
              ? `Adding: ${activeDragData.section.label || activeDragData.section.type}`
              : `Moving: ${activeDragData.section.type}`
            }
          </div>
        </div>
      ) : null}
    </DragOverlay>

    {/* Floating Rich Text Editor */}
    {editingText && (
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-2xl z-50 animate-slide-up"
        style={{ height: `${editorHeight}px` }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleEditorDragStart}
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-400 bg-blue-500 transition flex items-center justify-center group"
        >
          <div className="w-12 h-1 bg-white rounded-full opacity-60 group-hover:opacity-100 transition"></div>
        </div>

        <div className="max-w-7xl mx-auto p-4 h-full flex flex-col" style={{ paddingTop: '12px' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Text Editor - {editingText.field}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleEditorFullscreen}
                className="text-gray-400 hover:text-gray-600 transition"
                title={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isEditorFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleCloseTextEditor}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex-wrap">
            {/* Bold */}
            <button
              onClick={() => applyFormatting('bold')}
              className={`px-3 py-1.5 rounded border transition ${
                currentFormatting.bold
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'hover:bg-white border-transparent hover:border-gray-300'
              }`}
              title="Bold (Ctrl+B)"
            >
              <strong className="text-sm">B</strong>
            </button>

            {/* Italic */}
            <button
              onClick={() => applyFormatting('italic')}
              className={`px-3 py-1.5 rounded border transition ${
                currentFormatting.italic
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'hover:bg-white border-transparent hover:border-gray-300'
              }`}
              title="Italic (Ctrl+I)"
            >
              <em className="text-sm">I</em>
            </button>

            {/* Underline */}
            <button
              onClick={() => applyFormatting('underline')}
              className={`px-3 py-1.5 rounded border transition ${
                currentFormatting.underline
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'hover:bg-white border-transparent hover:border-gray-300'
              }`}
              title="Underline (Ctrl+U)"
            >
              <span className="text-sm underline">U</span>
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Font Family */}
            <select
              onChange={(e) => {
                if (!editorRef.current) return
                editorRef.current.focus()
                document.execCommand('fontName', false, e.target.value)
                setTimeout(() => {
                  if (editorRef.current) {
                    handleTextEditorChange(editorRef.current.innerHTML)
                    updateFormattingState()
                  }
                }, 10)
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-white transition max-w-[120px]"
              title="Font Family"
              defaultValue=""
            >
              <option value="" disabled>Font</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
            </select>

            {/* Heading Level */}
            <select
              onChange={(e) => {
                if (!editorRef.current) return
                editorRef.current.focus()
                document.execCommand('formatBlock', false, e.target.value)
                setTimeout(() => {
                  if (editorRef.current) {
                    handleTextEditorChange(editorRef.current.innerHTML)
                    updateFormattingState()
                    // Force canvas update by triggering state change
                    if (template && editingText) {
                      setTemplate({ ...template })
                    }
                  }
                }, 10)
                // Reset select to default after applying
                e.target.value = ''
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-white transition"
              title="Heading Level"
              value=""
            >
              <option value="" disabled>Heading</option>
              <option value="p">Normal</option>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
            </select>

            {/* Text Color */}
            <button
              onClick={handleOpenColorPicker}
              className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-white transition"
              title="Text Color"
            >
              <div
                className="w-6 h-6 rounded border border-gray-400"
                style={{ backgroundColor: currentFormatting.color }}
              />
              <span className="text-xs text-gray-600 font-mono">{currentFormatting.color}</span>
            </button>

            {/* Font Size */}
            <select
              value={currentFormatting.fontSize}
              onChange={(e) => applyFontSize(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-white transition"
              title="Font Size"
            >
              <option value="10px">10px</option>
              <option value="12px">12px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
              <option value="28px">28px</option>
              <option value="32px">32px</option>
              <option value="36px">36px</option>
              <option value="48px">48px</option>
              <option value="64px">64px</option>
            </select>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Alignment */}
            <button
              onClick={() => applyFormatting('justifyLeft')}
              className={`px-2 py-1.5 rounded border transition ${
                currentFormatting.alignment === 'left'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'hover:bg-white border-transparent hover:border-gray-300'
              }`}
              title="Align Left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => applyFormatting('justifyCenter')}
              className={`px-2 py-1.5 rounded border transition ${
                currentFormatting.alignment === 'center'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'hover:bg-white border-transparent hover:border-gray-300'
              }`}
              title="Align Center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => applyFormatting('justifyRight')}
              className={`px-2 py-1.5 rounded border transition ${
                currentFormatting.alignment === 'right'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'hover:bg-white border-transparent hover:border-gray-300'
              }`}
              title="Align Right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M14 12h6M4 18h16" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Lists */}
            <button
              onClick={() => applyFormatting('insertUnorderedList')}
              className="px-2 py-1.5 hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
              title="Bullet List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                <circle cx="2" cy="6" r="1" fill="currentColor" />
                <circle cx="2" cy="12" r="1" fill="currentColor" />
                <circle cx="2" cy="18" r="1" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={() => applyFormatting('insertOrderedList')}
              className="px-2 py-1.5 hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
              title="Numbered List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Link */}
            <button
              onClick={handleOpenLinkModal}
              className="px-2 py-1.5 hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
              title="Insert/Edit Link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>

            {/* Insert Image */}
            <button
              onClick={handleOpenInsertImageModal}
              className="px-2 py-1.5 hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
              title="Insert Image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Clear Formatting */}
            <button
              onClick={() => applyFormatting('removeFormat')}
              className="px-3 py-1.5 text-xs hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
              title="Clear Formatting"
            >
              Clear
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Code View Toggle */}
            <button
              onClick={() => setShowCodeView(!showCodeView)}
              className={`px-3 py-1.5 text-xs rounded border transition ${
                showCodeView
                  ? 'bg-gray-700 text-white border-gray-800'
                  : 'hover:bg-white border-transparent hover:border-gray-300'
              }`}
              title="Toggle Code View"
            >
              {'</>'}
            </button>
          </div>

          {showCodeView ? (
            <textarea
              value={editingText.value}
              onChange={(e) => {
                setEditingText({ ...editingText, value: e.target.value })
                handleTextEdit(editingText.sectionId, editingText.field, e.target.value)
              }}
              className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs overflow-y-auto bg-gray-900 text-green-400"
              spellCheck={false}
            />
          ) : (
            <div
              ref={(el) => {
                if (el) {
                  editorRef.current = el
                  // Always sync the innerHTML with current editingText.value
                  if (el.innerHTML !== editingText.value) {
                    el.innerHTML = editingText.value
                  }
                }
              }}
              contentEditable
              onInput={(e) => handleTextEditorChange(e.currentTarget.innerHTML)}
              onMouseUp={updateFormattingState}
              onKeyUp={updateFormattingState}
              onFocus={updateFormattingState}
              onClick={handleEditorClick}
              onPaste={handleEditorPaste}
              className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-base overflow-y-auto bg-white wysiwyg-editor"
              suppressContentEditableWarning
            />
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {showCodeView
                ? 'Edit HTML directly. Switch back to visual mode to see formatted preview.'
                : 'Use the toolbar to format your text. Changes are applied live to the canvas above.'
              }
            </span>
            <span className="font-mono text-[10px]">
              {showCodeView ? 'HTML' : 'WYSIWYG'}
            </span>
          </div>

          {/* Color Picker Modal */}
          <ColorPickerModal
            isOpen={showColorPicker}
            onClose={() => setShowColorPicker(false)}
            tempColor={tempColor}
            setTempColor={setTempColor}
            onApply={handleApplyColorFromPicker}
          />

          {/* Link Modal */}
          <LinkModal
            isOpen={showLinkModal}
            onClose={() => setShowLinkModal(false)}
            linkText={linkText}
            setLinkText={setLinkText}
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
            onApply={handleApplyLink}
            onRemove={handleRemoveLink}
          />

          {/* Insert Image Modal */}
          <InsertImageModal
            isOpen={showInsertImageModal}
            onClose={() => setShowInsertImageModal(false)}
            imageInsertMode={imageInsertMode}
            setImageInsertMode={setImageInsertMode}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            selectedGalleryImage={selectedGalleryImage}
            setSelectedGalleryImage={setSelectedGalleryImage}
            template={template}
            onInsert={handleInsertImage}
          />

          {/* Image Resize Controls */}
          {selectedImage && (
            <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-[9998] w-80 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Image Settings</h4>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {/* Alt Text Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={imageAltText}
                    onChange={(e) => setImageAltText(e.target.value)}
                    onBlur={applyImageAltText}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe this image..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Helps screen readers and SEO
                  </p>
                </div>

                {/* Link Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={imageLink}
                    onChange={(e) => setImageLink(e.target.value)}
                    onBlur={applyImageLink}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="link-new-tab"
                      checked={imageLinkTarget === '_blank'}
                      onChange={(e) => {
                        setImageLinkTarget(e.target.checked ? '_blank' : '_self')
                        if (imageLink) applyImageLink()
                      }}
                      className="w-3 h-3 text-blue-600 rounded"
                    />
                    <label htmlFor="link-new-tab" className="text-xs text-gray-600 cursor-pointer select-none">
                      Open in new tab
                    </label>
                  </div>
                  {imageLink && (
                    <button
                      onClick={() => {
                        setImageLink('')
                        setImageLinkTarget('_self')
                        applyImageLink()
                      }}
                      className="text-xs text-red-600 hover:text-red-700 mt-1"
                    >
                      Remove Link
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-200 my-3"></div>

                {/* Width Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={imageWidth}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="50"
                  />
                </div>

                {/* Height Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={imageHeight}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="50"
                  />
                </div>

                {/* Constrain Proportions Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="constrain-proportions"
                    checked={constrainProportions}
                    onChange={(e) => setConstrainProportions(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="constrain-proportions" className="text-xs text-gray-700 cursor-pointer select-none">
                    Constrain Proportions
                  </label>
                </div>

                {/* Aspect Ratio Info */}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <p>Aspect Ratio: {imageAspectRatio.toFixed(2)}</p>
                </div>

                {/* Buttons */}
                <div className="space-y-2 mt-3">
                  {/* Set to 100% Button */}
                  <button
                    onClick={setImageWidthTo100}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                  >
                    Set Width to 100%
                  </button>

                  {/* Apply Button */}
                  <button
                    onClick={applyImageDimensions}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                  >
                    Apply Custom Size
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Image Gallery Modal */}
      {console.log('About to render ImageGallery conditional, showImageGallery:', showImageGallery, 'ref:', imageGalleryRef.current, 'template ID:', template?.id)}
      {(showImageGallery || imageGalleryRef.current) ? (
        <>
          {console.log('Rendering ImageGallery component NOW')}
          <ImageGallery
            isOpen={true}
            onClose={() => {
              console.log('ImageGallery onClose called')
              imageGalleryRef.current = false
              setShowImageGallery(false)
            }}
            templateId={template?.id || 0}
            images={template?.images || []}
            onUpload={async (file) => {
            if (!template) {
              console.error('No template available for upload')
              return
            }

            // Auto-save template if it hasn't been saved yet
            let templateId = template.id
            if (templateId === 0) {
              console.log('Template not saved yet, auto-saving before upload...')
              try {
                const saveResponse = await api.createTemplate({
                  name: template.name || 'Untitled Template',
                  description: template.description || '',
                  business_type: template.business_type || 'other',
                  is_active: template.is_active,
                  exclusive_to: template.exclusive_to,
                  technologies: template.technologies,
                  features: template.features,
                  custom_css: template.custom_css,
                  pages: template.pages
                })
                if (saveResponse.success && saveResponse.data) {
                  templateId = saveResponse.data.id
                  setTemplate(saveResponse.data)
                  console.log('Template auto-saved with ID:', templateId)
                } else {
                  alert('Please save the template before uploading images.')
                  return
                }
              } catch (error) {
                console.error('Auto-save error:', error)
                alert('Failed to save template. Please save manually before uploading images.')
                return
              }
            }

            console.log('Starting image upload for template:', templateId, 'file:', file.name)
            try {
              const response = await api.uploadGalleryImage(templateId, file)
              console.log('Upload response:', response)
              if (response.success && response.data) {
                console.log('Upload successful, adding image to template')
                setTemplate({
                  ...template,
                  id: templateId,
                  images: [...(template.images || []), response.data]
                })
              } else {
                console.error('Upload failed:', response)
                alert(`Failed to upload image: ${response.message || 'Unknown error'}`)
              }
            } catch (error) {
              console.error('Upload error:', error)
              alert(`Error uploading image: ${error}`)
            }
          }}
          onDelete={async (imageId) => {
            if (!template) return
            await api.deleteGalleryImage(template.id, imageId)
            setTemplate({
              ...template,
              images: (template.images || []).filter(img => img.id !== imageId)
            })
          }}
          onRename={async (imageId, newFilename) => {
            if (!template) return
            await api.renameGalleryImage(template.id, imageId, newFilename)
            setTemplate({
              ...template,
              images: (template.images || []).map(img =>
                img.id === imageId ? { ...img, filename: newFilename } : img
              )
            })
          }}
        />
        </>
      ) : null}

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

