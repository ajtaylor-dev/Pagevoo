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
import { NavbarProperties } from '../components/properties/NavbarProperties'
import { FooterProperties } from '../components/properties/FooterProperties'
import { SectionThumbnail } from '../components/SectionThumbnail'
import { EditableText } from '../components/EditableText'
import {
  generateRandomString,
  sanitizeName,
  generateIdentifier,
  generateContainerStyle,
  generateLinkStyle,
  generateActiveIndicatorStyle
} from '../utils/helpers'
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
  arrayMove,
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

  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(320)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
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


  const handleSaveTemplate = async () => {
    if (!template) {
      alert('No template loaded')
      return
    }

    setLoading(true)
    try {
      if (template.id === 0) {
        // Create new template with pages and sections
        const response = await api.createTemplate({
          name: template.name,
          description: template.description,
          business_type: template.business_type,
          is_active: template.is_active,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
          custom_css: template.custom_css,
          pages: template.pages.map(page => ({
            name: page.name,
            slug: page.slug,
            meta_description: page.meta_description,
            page_css: page.page_css,
            is_homepage: page.is_homepage,
            order: page.order,
            sections: page.sections.map(section => ({
              type: section.type,
              content: section.content,
              order: section.order
            }))
          }))
        })
        if (response.success && response.data) {
          alert('Template created successfully!')
          // Redirect to the new template
          window.location.href = `/template-builder?id=${response.data.id}`
        }
      } else {
        // Update existing template (metadata and pages/sections)
        const response = await api.updateTemplate(template.id, {
          name: template.name,
          description: template.description,
          business_type: template.business_type,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
          custom_css: template.custom_css,
          pages: template.pages.map(page => ({
            id: page.id > 1000000000000 ? undefined : page.id, // Don't send temporary IDs (from Date.now())
            name: page.name,
            slug: page.slug,
            meta_description: page.meta_description,
            page_css: page.page_css,
            is_homepage: page.is_homepage,
            order: page.order,
            sections: page.sections.map(section => ({
              id: section.id > 1000000000000 ? undefined : section.id,
              type: section.type,
              content: section.content,
              order: section.order
            }))
          }))
        })
        if (response.success) {
          alert('Template saved successfully!')
          // Reload to get proper IDs from server
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !template) return

    // Check if template is saved first
    if (template.id === 0) {
      alert('Please save the template first before uploading an image')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('preview_image', file)

      const response = await api.uploadTemplateImage(template.id, formData)
      if (response.success && response.data) {
        setTemplate({ ...template, preview_image: response.data.preview_image })
        alert('Preview image uploaded successfully')
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload preview image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Page Management Functions
  const handleAddPage = () => {
    if (!template || !newPageName.trim()) return

    const slug = newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const newPage: TemplatePage = {
      id: Date.now(), // Temporary ID
      name: newPageName,
      slug: slug,
      page_id: generateIdentifier(newPageName),
      is_homepage: template.pages.length === 0, // First page is homepage
      order: template.pages.length,
      sections: []
    }

    setTemplate({
      ...template,
      pages: [...template.pages, newPage]
    })
    setCurrentPage(newPage)
    setNewPageName('')
    setShowAddPageModal(false)
  }

  const handleDeletePage = (pageId: number) => {
    if (!template) return
    if (template.pages.length === 1) {
      alert('Cannot delete the only page. Templates must have at least one homepage.')
      return
    }
    if (!confirm('Are you sure you want to delete this page?')) return

    const pageToDelete = template.pages.find(p => p.id === pageId)
    const updatedPages = template.pages.filter(p => p.id !== pageId)

    // If deleting the homepage, set the first remaining page as the new homepage
    if (pageToDelete?.is_homepage && updatedPages.length > 0) {
      updatedPages[0].is_homepage = true
    }
    setTemplate({ ...template, pages: updatedPages })

    // If current page was deleted, switch to first page
    if (currentPage?.id === pageId) {
      setCurrentPage(updatedPages[0] || null)
    }
  }

  const handleMovePage = (pageId: number, direction: 'up' | 'down') => {
    if (!template) return

    const index = template.pages.findIndex(p => p.id === pageId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === template.pages.length - 1) return

    const newPages = [...template.pages]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    // Swap
    ;[newPages[index], newPages[swapIndex]] = [newPages[swapIndex], newPages[index]]

    // Update order values
    newPages.forEach((page, idx) => {
      page.order = idx
    })

    setTemplate({ ...template, pages: newPages })
  }

  const handleSetHomepage = (pageId: number) => {
    if (!template) return

    const updatedPages = template.pages.map(p => ({
      ...p,
      is_homepage: p.id === pageId
    }))

    setTemplate({ ...template, pages: updatedPages })
  }

  const handleOpenEditPageModal = () => {
    if (!currentPage) return
    setEditPageName(currentPage.name)
    setEditPageSlug(currentPage.slug)
    setEditPageMetaDescription(currentPage.meta_description || '')
    setShowEditPageModal(true)
    setShowEditMenu(false)
  }

  const handleSaveEditPage = () => {
    if (!template || !currentPage || !editPageName.trim()) return

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return {
          ...p,
          name: editPageName,
          slug: editPageSlug,
          meta_description: editPageMetaDescription
        }
      }
      return p
    })

    const updatedTemplate = { ...template, pages: updatedPages }
    setTemplate(updatedTemplate)
    setCurrentPage({
      ...currentPage,
      name: editPageName,
      slug: editPageSlug,
      meta_description: editPageMetaDescription
    })
    addToHistory(updatedTemplate)
    setShowEditPageModal(false)
  }

  const handleCopyPage = () => {
    if (!template || !currentPage) return

    const copiedPage: TemplatePage = {
      id: Date.now(),
      name: `${currentPage.name} (Copy)`,
      slug: `${currentPage.slug}-copy`,
      is_homepage: false,
      order: template.pages.length,
      sections: currentPage.sections.map(section => ({
        ...section,
        id: Date.now() + Math.random() * 1000
      })),
      meta_description: currentPage.meta_description
    }

    setTemplate({
      ...template,
      pages: [...template.pages, copiedPage]
    })
    setCurrentPage(copiedPage)
    setShowEditMenu(false)
  }

  const handleAddPageFromTemplate = (templateType: string) => {
    if (!template) return

    let pageName = ''
    let sections: TemplateSection[] = []

    if (templateType === 'about') {
      pageName = 'About Us'
      sections = [
        { id: Date.now(), type: 'grid-2x1', section_name: 'Content Grid', section_id: generateIdentifier('Content Grid'), content: { columns: [] }, order: 0 },
        { id: Date.now() + 1, type: 'footer-simple', section_name: 'Footer', section_id: generateIdentifier('Footer'), content: {}, order: 1 }
      ]
    } else if (templateType === 'services') {
      pageName = 'Services'
      sections = [
        { id: Date.now(), type: 'grid-3x1', section_name: 'Services Grid', section_id: generateIdentifier('Services Grid'), content: { columns: [] }, order: 0 },
        { id: Date.now() + 1, type: 'footer-simple', section_name: 'Footer', section_id: generateIdentifier('Footer'), content: {}, order: 1 }
      ]
    } else if (templateType === 'contact') {
      pageName = 'Contact'
      sections = [
        { id: Date.now(), type: 'contact-form', section_name: 'Contact Form', section_id: generateIdentifier('Contact Form'), content: {}, order: 0 },
        { id: Date.now() + 1, type: 'footer-simple', section_name: 'Footer', section_id: generateIdentifier('Footer'), content: {}, order: 1 }
      ]
    }

    const slug = pageName.toLowerCase().replace(/\s+/g, '-')
    const newPage: TemplatePage = {
      id: Date.now(),
      name: pageName,
      slug: slug,
      page_id: generateIdentifier(pageName),
      is_homepage: false,
      order: template.pages.length,
      sections: sections
    }

    setTemplate({
      ...template,
      pages: [...template.pages, newPage]
    })
    setCurrentPage(newPage)
    setShowInsertMenu(false)
  }

  // Section Management Functions
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['core'])

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category))
    } else {
      setExpandedCategories([...expandedCategories, category])
    }
  }

  const getDefaultColumnCSS = () => `border: 2px dashed #d1d5db;
border-radius: 0.5rem;
min-height: 200px;
padding: 1rem;`

  const getDefaultSectionCSS = () => `padding: 2rem;`

  const createDefaultContentCSS = (numColumns: number) => {
    const columns: { [key: string]: string } = {}
    for (let i = 0; i < numColumns; i++) {
      columns[i] = getDefaultColumnCSS()
    }
    return { columns }
  }

  const coreSections = [
    {
      type: 'grid-1x1',
      label: '1 Column',
      description: 'Single full-width column',
      cols: 1,
      rows: 1,
      colWidths: [12], // col-12 (100%)
      defaultContent: {
        columns: [{ content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>', colWidth: 12 }],
        content_css: createDefaultContentCSS(1),
        section_css: getDefaultSectionCSS()
      }
    },
    {
      type: 'grid-2x1',
      label: '2 Columns',
      description: 'Two equal columns (50/50)',
      cols: 2,
      rows: 1,
      colWidths: [6, 6], // 2x col-6 (50% each)
      defaultContent: {
        columns: [
          { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>', colWidth: 6 },
          { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>', colWidth: 6 }
        ],
        content_css: createDefaultContentCSS(2),
        section_css: getDefaultSectionCSS()
      }
    },
    {
      type: 'grid-3x1',
      label: '3 Columns',
      description: 'Three equal columns (33/33/33)',
      cols: 3,
      rows: 1,
      colWidths: [4, 4, 4], // 3x col-4 (33.33% each)
      defaultContent: {
        columns: [
          { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.</p>', colWidth: 4 },
          { content: '<p>Ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 4 },
          { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.</p>', colWidth: 4 }
        ],
        content_css: createDefaultContentCSS(3),
        section_css: getDefaultSectionCSS()
      }
    },
    {
      type: 'grid-4x1',
      label: '4 Columns',
      description: 'Four equal columns (25% each)',
      cols: 4,
      rows: 1,
      colWidths: [3, 3, 3, 3], // 4x col-3 (25% each)
      defaultContent: {
        columns: [
          { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>', colWidth: 3 },
          { content: '<p>Sed do eiusmod tempor incididunt ut labore et dolore.</p>', colWidth: 3 },
          { content: '<p>Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 3 },
          { content: '<p>Duis aute irure dolor in reprehenderit in voluptate.</p>', colWidth: 3 }
        ],
        content_css: createDefaultContentCSS(4),
        section_css: getDefaultSectionCSS()
      }
    },
    {
      type: 'grid-2x2',
      label: '2x2 Grid',
      description: 'Four boxes in 2x2 layout',
      cols: 2,
      rows: 2,
      colWidths: [6, 6, 6, 6], // 4x col-6 (2 rows of 50/50)
      defaultContent: {
        columns: [
          { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.</p>', colWidth: 6 },
          { content: '<p>Ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 6 },
          { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.</p>', colWidth: 6 },
          { content: '<p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.</p>', colWidth: 6 }
        ],
        content_css: createDefaultContentCSS(4),
        section_css: getDefaultSectionCSS()
      }
    },
    {
      type: 'grid-3x2',
      label: '3x2 Grid',
      description: 'Six boxes in 3x2 layout',
      cols: 3,
      rows: 2,
      colWidths: [4, 4, 4, 4, 4, 4], // 6x col-4 (2 rows of 33/33/33)
      defaultContent: {
        columns: [
          { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>', colWidth: 4 },
          { content: '<p>Sed do eiusmod tempor incididunt ut labore et dolore.</p>', colWidth: 4 },
          { content: '<p>Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 4 },
          { content: '<p>Duis aute irure dolor in reprehenderit in voluptate.</p>', colWidth: 4 },
          { content: '<p>Excepteur sint occaecat cupidatat non proident sunt.</p>', colWidth: 4 },
          { content: '<p>Culpa qui officia deserunt mollit anim id est laborum.</p>', colWidth: 4 }
        ],
        content_css: createDefaultContentCSS(6),
        section_css: getDefaultSectionCSS()
      }
    },
  ]

  const headerNavigationSections = [
    {
      type: 'navbar',
      label: 'Navigation Bar',
      description: 'Simple navigation with logo and links',
      position: 'top',
      defaultContent: {
        logo: 'Logo',
        logoWidth: 25,
        links: ['Home', 'About', 'Services', 'Contact'],
        position: 'static',
        content_css: '',
        containerStyle: {
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '0px',
          paddingRight: '0px',
          marginTop: '0px',
          marginBottom: '0px',
          marginLeft: '0px',
          marginRight: '0px',
          width: '100%',
          height: 'auto',
          background: '#ffffff'
        }
      }
    }
  ]

  const footerSections = [
    { type: 'footer-simple', label: 'Simple Footer', description: 'Basic footer with copyright text', position: 'bottom', defaultContent: { text: '© 2025 Company Name. All rights reserved.' } },
    {
      type: 'footer-columns',
      label: 'Column Footer',
      description: 'Multi-column footer with copyright',
      position: 'bottom',
      defaultContent: {
        columns: [
          { content: '<h3 style="text-align: center;">Company</h3><p style="text-align: center;">About Us</p><p style="text-align: center;">Contact</p>', colWidth: 4 },
          { content: '<h3 style="text-align: center;">Services</h3><p style="text-align: center;">Service 1</p><p style="text-align: center;">Service 2</p>', colWidth: 4 },
          { content: '<h3 style="text-align: center;">Connect</h3><p style="text-align: center;">Email</p><p style="text-align: center;">Phone</p>', colWidth: 4 }
        ],
        copyrightText: '© 2025 Company Name. All rights reserved.',
        content_css: createDefaultContentCSS(3),
        section_css: 'background-color: #172554; color: white; padding: 2rem;'
      }
    },
  ]


  const handleAddPredefinedPage = (pageConfig: any) => {
    if (!template) return

    const slug = pageConfig.name.toLowerCase().replace(/\s+/g, '-')
    const newPage: TemplatePage = {
      id: Date.now(),
      name: pageConfig.name,
      slug: slug,
      is_homepage: template.pages.length === 0,
      order: template.pages.length,
      sections: pageConfig.sections.map((s: any, idx: number) => ({
        id: Date.now() + idx,
        type: s.type,
        content: s.content,
        order: idx
      }))
    }

    setTemplate({
      ...template,
      pages: [...template.pages, newPage]
    })
    setCurrentPage(newPage)
  }

  const handleAddSection = (sectionConfig: any) => {
    if (!template || !currentPage) {
      alert('Please create a page first')
      return
    }

    const sectionName = sectionConfig.name || sectionConfig.type
    const newSection: TemplateSection = {
      id: Date.now(),
      type: sectionConfig.type,
      section_name: sectionName,
      section_id: generateIdentifier(sectionName),
      content: sectionConfig.defaultContent,
      order: currentPage.sections.length
    }

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        // Simply add the new section at the end
        const newSections = [...p.sections, newSection]

        // Reorder all sections
        newSections.forEach((section, idx) => {
          section.order = idx
        })

        return {
          ...p,
          sections: newSections
        }
      }
      return p
    })

    const updatedCurrentPage = updatedPages.find(p => p.id === currentPage.id)
    if (updatedCurrentPage) {
      const updatedTemplate = { ...template, pages: updatedPages }
      setTemplate(updatedTemplate)
      setCurrentPage(updatedCurrentPage)
      setSelectedSection(newSection)
      addToHistory(updatedTemplate)
    }
  }

  const handleDeleteSection = (sectionId: number) => {
    if (!template || !currentPage) return
    if (!confirm('Are you sure you want to delete this section?')) return

    const updatedSections = currentPage.sections.filter(s => s.id !== sectionId)
    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    const updatedTemplate = { ...template, pages: updatedPages }
    setTemplate(updatedTemplate)
    setCurrentPage({ ...currentPage, sections: updatedSections })
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null)
    }
    addToHistory(updatedTemplate)
  }

  const handleMoveSection = (sectionId: number, direction: 'up' | 'down') => {
    if (!template || !currentPage) return

    const index = currentPage.sections.findIndex(s => s.id === sectionId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === currentPage.sections.length - 1) return

    const swapIndex = direction === 'up' ? index - 1 : index + 1

    const newSections = [...currentPage.sections]

    // Swap
    ;[newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]]

    // Update order values
    newSections.forEach((section, idx) => {
      section.order = idx
    })

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: newSections }
      }
      return p
    })

    const updatedTemplate = { ...template, pages: updatedPages }
    setTemplate(updatedTemplate)
    setCurrentPage({ ...currentPage, sections: newSections })
    addToHistory(updatedTemplate)
  }

  const handleToggleSectionLock = (sectionId: number) => {
    if (!template || !currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, is_locked: !s.is_locked }
      }
      return s
    })

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    const updatedTemplate = { ...template, pages: updatedPages }
    setTemplate(updatedTemplate)
    setCurrentPage({ ...currentPage, sections: updatedSections })
    addToHistory(updatedTemplate)
  }


  const handleUpdateSectionContent = (sectionId: number, newContent: any) => {
    if (!template || !currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, content: newContent }
      }
      return s
    })

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    const updatedTemplate = { ...template, pages: updatedPages }
    setTemplate(updatedTemplate)
    setCurrentPage({ ...currentPage, sections: updatedSections })
    setSelectedSection({ ...selectedSection!, content: newContent })
    addToHistory(updatedTemplate)
  }

  // Drag and Drop Event Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    setActiveDragData(active.data.current)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over ? String(over.id) : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveDragData(null)
    setOverId(null)

    if (!currentPage || !template) return

    const activeData = active.data.current

    // Case 1: Dragging from library to canvas
    if (activeData?.source === 'library') {
      const sectionConfig = activeData.section

      const sectionName = sectionConfig.name || sectionConfig.type
      const newSection: TemplateSection = {
        id: Date.now(),
        type: sectionConfig.type,
        section_name: sectionName,
        section_id: generateIdentifier(sectionName),
        content: sectionConfig.defaultContent,
        order: 0
      }

      let insertPosition = currentPage.sections.length // Default: end of list

      // Respect drop position for all section types
      if (over && over.data.current?.source === 'canvas') {
        const overIndex = over.data.current.index
        insertPosition = overIndex
      } else if (over && over.data.current?.type === 'bottom') {
        // Dropping on bottom drop zone - insert at end
        insertPosition = currentPage.sections.length
      }

      // Insert the new section at the calculated position
      const newSections = [
        ...currentPage.sections.slice(0, insertPosition),
        newSection,
        ...currentPage.sections.slice(insertPosition)
      ]

      // Update order values
      newSections.forEach((section, idx) => {
        section.order = idx
      })

      const updatedPages = template.pages.map(p => {
        if (p.id === currentPage.id) {
          return { ...p, sections: newSections }
        }
        return p
      })

      const updatedTemplate = { ...template, pages: updatedPages }
      setTemplate(updatedTemplate)
      setCurrentPage({ ...currentPage, sections: newSections })
      setSelectedSection(newSection)
      addToHistory(updatedTemplate)
      return
    }

    // If no over target for reordering, return
    if (!over) return

    const overData = over.data.current

    // Case 2: Reordering sections on canvas
    if (activeData?.source === 'canvas' && overData?.source === 'canvas') {
      const oldIndex = activeData.index
      const newIndex = overData.index

      if (oldIndex === newIndex) return

      // Perform the reorder - no restrictions, all sections can move anywhere
      const newSections = arrayMove(currentPage.sections, oldIndex, newIndex)

      // Update order values
      newSections.forEach((section, idx) => {
        section.order = idx
      })

      const updatedPages = template.pages.map(p => {
        if (p.id === currentPage.id) {
          return { ...p, sections: newSections }
        }
        return p
      })

      const updatedTemplate = { ...template, pages: updatedPages }
      setTemplate(updatedTemplate)
      setCurrentPage({ ...currentPage, sections: newSections })
      addToHistory(updatedTemplate)
    }

    // Case 3: Sidebar left/right drag (handled by modifier keys or special zones)
    // This is handled separately by the existing handleMoveSidebar function
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setActiveDragData(null)
    setOverId(null)
  }

  // Helper component for draggable section library items
  const DraggableSectionItem = ({ section, children }: { section: any; children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: `library-${section.type}`,
      data: { section, source: 'library' },
    })

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      >
        {children}
      </div>
    )
  }

  // Helper component for sortable canvas sections
  const SortableSectionItem = ({ section, index, children }: { section: TemplateSection; index: number; children: React.ReactNode }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: section.id,
      data: { section, index, source: 'canvas' },
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    // Check if this is a sidebar section for special drag handling
    const isSidebar = section.type.startsWith('sidebar-nav-')

    // Check if this section is being hovered over during drag
    const isOver = overId === String(section.id)

    return (
      <div ref={setNodeRef} style={style} className="relative group">
        {/* Drop indicator - shows where item will be inserted */}
        {isOver && activeId && (
          <div className="relative h-2 -mb-2">
            <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse"></div>
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 bg-[#98b290] text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg z-50">
              ↓ Insert here
            </div>
          </div>
        )}
        {/* Drag handle overlay for canvas sections */}
        <div
          {...listeners}
          {...attributes}
          className="absolute top-2 left-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <div className="bg-[#98b290] text-white p-1.5 rounded shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>
        {children}
      </div>
    )
  }

  // Bottom Drop Zone Component for inserting after last section
  const BottomDropZone = () => {
    const { setNodeRef, isOver } = useDroppable({
      id: 'bottom-drop-zone',
      data: { type: 'bottom', index: currentPage?.sections.length || 0 }
    })

    return (
      <div
        ref={setNodeRef}
        className={`min-h-[60px] transition-all ${activeId && activeDragData?.source === 'library' ? 'border-2 border-dashed border-[#b8ceb4]' : ''} ${isOver ? 'bg-[#e8f0e6]' : ''}`}
      >
        {isOver && activeId && (
          <div className="relative h-2">
            <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse"></div>
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 bg-[#98b290] text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg z-50">
              ↓ Insert here
            </div>
          </div>
        )}
      </div>
    )
  }

  // Helper to extract font families from CSS and generate Google Fonts link

  // Canvas Drop Zone Component
  const CanvasDropZone = ({ currentPage, activeId, activeDragData, renderSection, viewport }: any) => {
    const { setNodeRef, isOver } = useDroppable({
      id: 'canvas-drop-zone',
      data: { type: 'canvas' }
    })

    // Generate content CSS for all sections
    // Generate complete CSS with proper cascade: site → page → section → row → column
    console.log('[CanvasDropZone] Generating CSS with:', {
      siteCss: template?.custom_css,
      pageCss: currentPage.page_css
    })
    const contentCSS = currentPage?.sections
      ? generateContentCSS(currentPage.sections, currentPage.page_css, template?.custom_css)
      : ''
    console.log('[CanvasDropZone] Generated contentCSS:', contentCSS)

    // Extract fonts from all CSS for Google Fonts loading
    const allCSS = contentCSS
    const fonts = extractFontsFromCSS(allCSS)
    const googleFontsLink = fonts.length > 0
      ? `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f.replace(/ /g, '+'))}`).join('&')}&display=swap`
      : ''

    // Apply viewport class to simulate responsive breakpoints
    const viewportClass = viewport === 'mobile' ? 'viewport-mobile' : viewport === 'tablet' ? 'viewport-tablet' : ''

    return (
      <div
        id="template-canvas"
        ref={setNodeRef}
        onClick={() => setSelectedSection(null)}
        className={`text-gray-900 flex-1 min-h-0 ${viewportClass} ${activeId && activeDragData?.source === 'library' ? 'ring-2 ring-[#98b290] ring-offset-4 rounded-lg' : ''} ${isOver ? 'bg-[#e8f0e6]' : ''}`}
      >
        {/* Inject Google Fonts */}
        {googleFontsLink && (
          <link rel="stylesheet" href={googleFontsLink} />
        )}

        {/* Inject CSS with proper cascade: Site → Page → Section → Row → Column */}
        {contentCSS && (
          <style dangerouslySetInnerHTML={{ __html: contentCSS }} />
        )}

        {currentPage && currentPage.sections && currentPage.sections.length > 0 ? (
          <>
            <SortableContext
              items={currentPage.sections.map((s: any) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {currentPage.sections
                .sort((a: any, b: any) => a.order - b.order)
                .map((section: any, index: number) => (
                  <SortableSectionItem key={section.id} section={section} index={index}>
                    {renderSection(section, index)}
                  </SortableSectionItem>
                ))
              }
            </SortableContext>
            <BottomDropZone />
          </>
        ) : (
          <div className={`text-center py-20 p-8 ${activeId && activeDragData?.source === 'library' ? 'bg-[#e8f0e6]' : ''}`}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Empty Page</h2>
            <p className="text-gray-600">
              {activeId && activeDragData?.source === 'library'
                ? 'Drop section here to add it to the page'
                : 'This page has no sections yet. Drag sections from the left sidebar!'}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Helper to generate link href based on link data
  const getLinkHref = (link: any): string => {
    // Handle old string format
    if (typeof link === 'string') return '#'

    // Handle new object format
    if (link.linkType === 'url') {
      return link.url || '#'
    } else if (link.linkType === 'page' && link.pageId) {
      const page = template?.pages.find(p => p.id === link.pageId)
      if (page) {
        return page.is_homepage ? '/' : `/${page.slug || page.name.toLowerCase().replace(/\s+/g, '-')}`
      }
    }
    return '#'
  }

  // Helper to get link label
  const getLinkLabel = (link: any): string => {
    return typeof link === 'string' ? link : (link.label || 'Link')
  }

  // Helper function to handle inline text editing
  const handleTextEdit = (sectionId: number, field: string, value: string) => {
    if (!currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        // Handle grid columns (field format: column_0, column_1, etc.)
        if (field.startsWith('column_')) {
          const colIdx = parseInt(field.split('_')[1])
          const columns = s.content.columns || []
          const updatedColumns = [...columns]
          updatedColumns[colIdx] = { ...updatedColumns[colIdx], content: value }

          return {
            ...s,
            content: {
              ...s.content,
              columns: updatedColumns
            }
          }
        }

        // Handle regular content fields
        return {
          ...s,
          content: {
            ...s.content,
            [field]: value
          }
        }
      }
      return s
    })

    const updatedPages = template!.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    setTemplate({ ...template!, pages: updatedPages })
    setCurrentPage({ ...currentPage, sections: updatedSections })
  }

  const handleOpenTextEditor = (sectionId: number, field: string, currentValue: string) => {
    // Reset editor ref so it reinitializes with new content
    editorRef.current = null

    setEditingText({ sectionId, field, value: currentValue })
    setShowCodeView(false)

    // Wait for editor to render, then update formatting state
    setTimeout(() => {
      updateFormattingState()
    }, 50)
  }

  const handleTextEditorChange = (newValue: string) => {
    if (!editingText) return
    setEditingText({ ...editingText, value: newValue })
    handleTextEdit(editingText.sectionId, editingText.field, newValue)
  }

  const handleCloseTextEditor = () => {
    // Save current template state to history when closing editor
    // This captures all changes made during the editing session
    if (template) {
      addToHistory(template)
    }

    setEditingText(null)
    setShowCodeView(false)
    setShowColorPicker(false)
    setSavedSelection(null)
    setEditorHeight(300)
    setIsEditorFullscreen(false)
  }

  // Handle editor resize drag
  const handleEditorDragStart = (e: React.MouseEvent) => {
    setIsDraggingEditor(true)
    e.preventDefault()
  }

  const handleEditorDrag = (e: MouseEvent) => {
    if (!isDraggingEditor) return

    const newHeight = window.innerHeight - e.clientY
    if (newHeight >= 200 && newHeight <= window.innerHeight - 100) {
      setEditorHeight(newHeight)
    }
  }

  const handleEditorDragEnd = () => {
    setIsDraggingEditor(false)
  }

  // Toggle fullscreen
  const toggleEditorFullscreen = () => {
    if (isEditorFullscreen) {
      setEditorHeight(300)
      setIsEditorFullscreen(false)
    } else {
      setEditorHeight(window.innerHeight - 100)
      setIsEditorFullscreen(true)
    }
  }

  // Add/remove mouse event listeners for dragging
  useEffect(() => {
    if (isDraggingEditor) {
      window.addEventListener('mousemove', handleEditorDrag)
      window.addEventListener('mouseup', handleEditorDragEnd)
    } else {
      window.removeEventListener('mousemove', handleEditorDrag)
      window.removeEventListener('mouseup', handleEditorDragEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleEditorDrag)
      window.removeEventListener('mouseup', handleEditorDragEnd)
    }
  }, [isDraggingEditor])

  // Save current selection
  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange())
    }
  }

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelection && editorRef.current) {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedSelection)
      }
    }
  }

  // Open color picker and save selection
  const handleOpenColorPicker = () => {
    saveSelection()
    setTempColor(currentFormatting.color)
    setShowColorPicker(true)
  }

  // Apply color from picker
  const handleApplyColorFromPicker = () => {
    restoreSelection()
    applyColor(tempColor)
    setShowColorPicker(false)
  }

  // Open link modal
  const handleOpenLinkModal = () => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const selectedText = selection.toString()

    // Check if selection is inside a link
    let element = selection.anchorNode
    while (element && element !== editorRef.current) {
      if (element.nodeName === 'A') {
        const linkElement = element as HTMLAnchorElement
        setLinkUrl(linkElement.href)
        setLinkText(linkElement.textContent || '')
        break
      }
      element = element.parentNode
    }

    // If not editing existing link, use selected text
    if (!element || element === editorRef.current) {
      setLinkUrl('')
      setLinkText(selectedText)
    }

    saveSelection()
    setShowLinkModal(true)
  }

  // Apply link
  const handleApplyLink = () => {
    if (!linkUrl) return

    restoreSelection()

    if (!editorRef.current) return
    editorRef.current.focus()

    // If there's link text and no selection, insert the text first
    const selection = window.getSelection()
    if (selection && linkText && selection.toString() === '') {
      document.execCommand('insertText', false, linkText)
      // Select the inserted text
      const range = document.createRange()
      const textNode = selection.anchorNode
      if (textNode) {
        range.setStart(textNode, (selection.anchorOffset || 0) - linkText.length)
        range.setEnd(textNode, selection.anchorOffset || 0)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }

    // Create the link
    document.execCommand('createLink', false, linkUrl)

    setTimeout(() => {
      if (editorRef.current) {
        handleTextEditorChange(editorRef.current.innerHTML)
      }
    }, 10)

    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
  }

  // Remove link
  const handleRemoveLink = () => {
    restoreSelection()

    if (!editorRef.current) return
    editorRef.current.focus()

    document.execCommand('unlink')

    setTimeout(() => {
      if (editorRef.current) {
        handleTextEditorChange(editorRef.current.innerHTML)
      }
    }, 10)

    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
  }

  // Open insert image modal
  const handleOpenInsertImageModal = () => {
    saveSelection()
    setImageInsertMode('url')
    setImageUrl('')
    setSelectedGalleryImage(null)
    setShowInsertImageModal(true)
  }

  // Insert image from URL or gallery
  const handleInsertImage = () => {
    const imgSrc = imageInsertMode === 'url' ? imageUrl : selectedGalleryImage

    if (!imgSrc) {
      alert('Please provide an image URL or select from gallery')
      return
    }

    restoreSelection()

    if (!editorRef.current) return
    editorRef.current.focus()

    // Insert image using execCommand
    const img = `<img src="${imgSrc}" alt="Inserted image" style="max-width: 100%; height: auto;" />`
    document.execCommand('insertHTML', false, img)

    setTimeout(() => {
      if (editorRef.current) {
        handleTextEditorChange(editorRef.current.innerHTML)
      }
    }, 10)

    setShowInsertImageModal(false)
    setImageUrl('')
    setSelectedGalleryImage(null)
  }

  // Handle paste event for images
  const handleEditorPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    // Check if clipboard contains an image
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault() // Prevent default paste behavior

        const file = items[i].getAsFile()
        if (!file || !template) return

        try {
          // Auto-save template if needed
          let templateId = template.id
          if (templateId === 0) {
            alert('Please save the template before pasting images.')
            return
          }

          // Show loading indicator
          alert('Uploading image...')

          // Upload the image to gallery
          const response = await api.uploadGalleryImage(templateId, file)

          if (response.success && response.data) {
            // Insert the uploaded image at cursor position
            const imageUrl = `http://localhost:8000/${response.data.path}`

            if (editorRef.current) {
              editorRef.current.focus()

              // Insert image at cursor
              const img = `<img src="${imageUrl}" alt="Pasted image" style="max-width: 100%; height: auto;" />`
              document.execCommand('insertHTML', false, img)

              setTimeout(() => {
                if (editorRef.current) {
                  handleTextEditorChange(editorRef.current.innerHTML)
                }
              }, 10)

              // Refresh template to show new image in gallery
              if (response.data) {
                setTemplate({
                  ...template,
                  images: [...(template.images || []), response.data]
                })
              }

              alert('Image uploaded and inserted!')
            }
          }
        } catch (error) {
          console.error('Error uploading pasted image:', error)
          alert('Failed to upload image')
        }

        break
      }
    }
  }

  // Handle image click in editor
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement
      setSelectedImage(img)

      // Get current dimensions
      const width = img.width || img.naturalWidth
      const height = img.height || img.naturalHeight
      setImageWidth(width)
      setImageHeight(height)

      // Calculate aspect ratio
      const aspectRatio = width / height
      setImageAspectRatio(aspectRatio)

      // Get current alt text
      setImageAltText(img.alt || '')

      // Check if image is wrapped in a link
      const parentLink = img.parentElement
      if (parentLink && parentLink.tagName === 'A') {
        setImageLink((parentLink as HTMLAnchorElement).href)
        setImageLinkTarget((parentLink as HTMLAnchorElement).target as '_self' | '_blank' || '_self')
      } else {
        setImageLink('')
        setImageLinkTarget('_self')
      }

      // Add selected class for visual feedback
      const allImages = editorRef.current?.querySelectorAll('img')
      allImages?.forEach(i => i.classList.remove('selected-image'))
      img.classList.add('selected-image')
    } else {
      // Deselect image if clicking elsewhere
      setSelectedImage(null)
      setImageAltText('')
      setImageLink('')
      setImageLinkTarget('_self')
      const allImages = editorRef.current?.querySelectorAll('img')
      allImages?.forEach(i => i.classList.remove('selected-image'))
    }
  }

  // Handle width change
  const handleWidthChange = (value: number) => {
    setImageWidth(value)
    if (constrainProportions) {
      const newHeight = Math.round(value / imageAspectRatio)
      setImageHeight(newHeight)
    }
  }

  // Handle height change
  const handleHeightChange = (value: number) => {
    setImageHeight(value)
    if (constrainProportions) {
      const newWidth = Math.round(value * imageAspectRatio)
      setImageWidth(newWidth)
    }
  }

  // Apply link to image
  const applyImageLink = () => {
    if (!selectedImage || !editorRef.current) return

    const currentHtml = editorRef.current.innerHTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        const parentElement = img.parentElement

        // If imageLink is empty, remove link if it exists
        if (!imageLink.trim()) {
          if (parentElement && parentElement.tagName === 'A') {
            // Replace the <a> with just the <img>
            parentElement.replaceWith(img)
          }
        } else {
          // If image already has a link, update it
          if (parentElement && parentElement.tagName === 'A') {
            (parentElement as HTMLAnchorElement).href = imageLink
            (parentElement as HTMLAnchorElement).target = imageLinkTarget
          } else {
            // Wrap image in a new link
            const link = document.createElement('a')
            link.href = imageLink
            link.target = imageLinkTarget
            img.parentNode?.insertBefore(link, img)
            link.appendChild(img)
          }
        }
      }
    })

    // Update the editor content
    handleTextEditorChange(tempDiv.innerHTML)

    // Re-select the image after render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')
          }
        })
      }
    }, 100)
  }

  // Apply alt text to image
  const applyImageAltText = () => {
    if (!selectedImage || !editorRef.current) return

    // Update the image alt text directly in the HTML
    const currentHtml = editorRef.current.innerHTML

    // Find the image in the HTML and update its alt attribute
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        img.setAttribute('alt', imageAltText)
      }
    })

    // Update the editor content with the modified HTML
    handleTextEditorChange(tempDiv.innerHTML)

    // Update the selected image reference after re-render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')
          }
        })
      }
    }, 100)
  }

  // Apply image dimensions
  const applyImageDimensions = () => {
    if (!selectedImage) {
      alert('No image selected!')
      return
    }

    if (!imageWidth || !imageHeight || imageWidth < 10 || imageHeight < 10) {
      alert('Please enter valid dimensions (minimum 10px)')
      return
    }

    // Update the image styles directly in the HTML
    const currentHtml = editorRef.current?.innerHTML || ''

    // Find the image in the HTML and update its style
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        // Get current style and remove old width/height/max-width
        let styleStr = img.getAttribute('style') || ''
        styleStr = styleStr
          .replace(/width:\s*[^;]+;?/gi, '')
          .replace(/height:\s*[^;]+;?/gi, '')
          .replace(/max-width:\s*[^;]+;?/gi, '')
          .trim()

        // Add new dimensions
        if (styleStr && !styleStr.endsWith(';')) styleStr += ';'
        styleStr += ` width: ${imageWidth}px; height: ${imageHeight}px; max-width: none;`

        img.setAttribute('style', styleStr)
      }
    })

    // Update the editor content with the modified HTML
    if (editorRef.current) {
      handleTextEditorChange(tempDiv.innerHTML)
    }

    // Update the selected image reference after re-render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')
          }
        })
      }
    }, 100)

    // Show success feedback
    alert(`Image resized to ${imageWidth}px × ${imageHeight}px`)
  }

  // Set image width to 100%
  const setImageWidthTo100 = () => {
    if (!selectedImage) {
      alert('No image selected!')
      return
    }

    // Update the image styles directly in the HTML
    const currentHtml = editorRef.current?.innerHTML || ''

    // Find the image in the HTML and update its style
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        // Get current style and remove old width/height/max-width
        let styleStr = img.getAttribute('style') || ''
        styleStr = styleStr
          .replace(/width:\s*[^;]+;?/gi, '')
          .replace(/height:\s*[^;]+;?/gi, '')
          .replace(/max-width:\s*[^;]+;?/gi, '')
          .trim()

        // Add 100% width and auto height
        if (styleStr && !styleStr.endsWith(';')) styleStr += ';'
        styleStr += ` width: 100%; height: auto; max-width: 100%;`

        img.setAttribute('style', styleStr)
      }
    })

    // Update the editor content with the modified HTML
    if (editorRef.current) {
      handleTextEditorChange(tempDiv.innerHTML)
    }

    // Update the selected image reference and state after re-render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')

            // Update state to reflect actual rendered dimensions
            const parentWidth = img.parentElement?.offsetWidth || img.offsetWidth
            setImageWidth(parentWidth)
            const newHeight = Math.round(parentWidth / imageAspectRatio)
            setImageHeight(newHeight)
          }
        })
      }
    }, 100)

    alert('Image width set to 100%')
  }

  // Update formatting state based on current selection
  const updateFormattingState = () => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    let element = range.commonAncestorContainer as HTMLElement

    // If text node, get parent element
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement as HTMLElement
    }

    // Check formatting
    const bold = document.queryCommandState('bold')
    const italic = document.queryCommandState('italic')
    const underline = document.queryCommandState('underline')

    // Get computed styles
    const computedStyle = window.getComputedStyle(element)
    const fontSize = computedStyle.fontSize
    const color = rgbToHex(computedStyle.color)

    // Get alignment
    const alignment = element.style.textAlign || computedStyle.textAlign || 'left'

    setCurrentFormatting({
      bold,
      italic,
      underline,
      fontSize,
      color,
      alignment
    })
  }

  // Convert RGB to Hex
  const rgbToHex = (rgb: string): string => {
    if (rgb.startsWith('#')) return rgb

    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    if (!match) return '#000000'

    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])

    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  // Modern formatting functions for WYSIWYG editor
  const applyFormatting = (command: string, value?: string) => {
    if (!editorRef.current) return

    // Check if an image is selected and handle image alignment
    if (selectedImage && (command === 'justifyLeft' || command === 'justifyCenter' || command === 'justifyRight')) {
      applyImageAlignment(command)
      return
    }

    // Focus editor first
    editorRef.current.focus()

    // Small delay to ensure focus is set before executing command
    setTimeout(() => {
      if (!editorRef.current) return

      document.execCommand(command, false, value)

      // Trigger update to sync with canvas
      setTimeout(() => {
        if (editorRef.current) {
          handleTextEditorChange(editorRef.current.innerHTML)
          updateFormattingState()
        }
      }, 10)
    }, 5)
  }

  // Apply alignment to selected image
  const applyImageAlignment = (command: string) => {
    if (!selectedImage || !editorRef.current) return

    let displayStyle = 'block'
    let marginStyle = '0'

    if (command === 'justifyLeft') {
      displayStyle = 'block'
      marginStyle = '0 auto 0 0'
    } else if (command === 'justifyCenter') {
      displayStyle = 'block'
      marginStyle = '0 auto'
    } else if (command === 'justifyRight') {
      displayStyle = 'block'
      marginStyle = '0 0 0 auto'
    }

    // Update the image styles directly in the HTML
    const currentHtml = editorRef.current.innerHTML

    // Find the image in the HTML and update its style
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        // Get current style and remove old display/margin
        let styleStr = img.getAttribute('style') || ''
        styleStr = styleStr
          .replace(/display:\s*[^;]+;?/gi, '')
          .replace(/margin:\s*[^;]+;?/gi, '')
          .trim()

        // Add new alignment styles
        if (styleStr && !styleStr.endsWith(';')) styleStr += ';'
        styleStr += ` display: ${displayStyle}; margin: ${marginStyle};`

        img.setAttribute('style', styleStr)
      }
    })

    // Update the editor content with the modified HTML
    handleTextEditorChange(tempDiv.innerHTML)

    // Update the selected image reference after re-render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')
          }
        })
      }
    }, 100)
  }

  const applyFontSize = (size: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    editorRef.current.focus()

    // Use execCommand with fontSize, then replace with proper styles
    document.execCommand('fontSize', false, '7')

    setTimeout(() => {
      if (editorRef.current) {
        // Replace all font tags with styled spans
        const fontTags = editorRef.current.querySelectorAll('font[size="7"]')
        fontTags.forEach(font => {
          const span = document.createElement('span')
          span.style.fontSize = size
          span.innerHTML = font.innerHTML
          font.replaceWith(span)
        })

        handleTextEditorChange(editorRef.current.innerHTML)
        updateFormattingState()
      }
    }, 10)
  }

  const applyColor = (color: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    editorRef.current.focus()

    // Use foreColor first
    document.execCommand('foreColor', false, color)

    // Then ensure it's applied with inline styles by wrapping in span
    setTimeout(() => {
      if (editorRef.current) {
        // Find all font tags and convert to spans with color style
        const fontTags = editorRef.current.querySelectorAll('font[color]')
        fontTags.forEach(font => {
          const span = document.createElement('span')
          span.style.color = font.getAttribute('color') || color
          span.innerHTML = font.innerHTML
          font.replaceWith(span)
        })

        handleTextEditorChange(editorRef.current.innerHTML)
        updateFormattingState()
      }
    }, 10)
  }

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

  // Reset history after save - start fresh with just the saved state
  const resetHistory = (savedTemplate: Template) => {
    setHistory([JSON.parse(JSON.stringify(savedTemplate))])
    setHistoryIndex(0)
    setCanUndo(false)
    setCanRedo(false)
  }

  // Undo/Redo functions
  const handleUndo = () => {
    if (historyIndex > 0 && template) {
      const newIndex = historyIndex - 1
      const previousState = history[newIndex]

      setTemplate(JSON.parse(JSON.stringify(previousState)))

      // Find and set current page
      const currentPageInHistory = previousState.pages.find(p => p.id === currentPage?.id)
      if (currentPageInHistory) {
        setCurrentPage(currentPageInHistory)
      }

      setHistoryIndex(newIndex)
      setCanUndo(newIndex > 0)
      setCanRedo(true)
      setHasUnsavedChanges(true)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && template) {
      const newIndex = historyIndex + 1
      const nextState = history[newIndex]

      setTemplate(JSON.parse(JSON.stringify(nextState)))

      // Find and set current page
      const currentPageInHistory = nextState.pages.find(p => p.id === currentPage?.id)
      if (currentPageInHistory) {
        setCurrentPage(currentPageInHistory)
      }

      setHistoryIndex(newIndex)
      setCanUndo(true)
      setCanRedo(newIndex < history.length - 1)
      setHasUnsavedChanges(true)
    }
  }

  const handleSave = async () => {
    // Use templateRef.current to get the most recent template state (avoids race conditions)
    const currentTemplate = templateRef.current
    if (!currentTemplate) {
      alert('No template to save')
      return
    }

    // Debug: Log template ID
    console.log('Template ID:', currentTemplate.id, 'Type:', typeof currentTemplate.id)

    // If template.id === 0 or undefined (new template), prompt for name like Word
    if (!currentTemplate.id || currentTemplate.id === 0) {
      const templateName = prompt('Enter a template name:', currentTemplate.name || 'Untitled Template')
      if (!templateName || templateName.trim() === '') {
        return // User cancelled or entered empty name
      }

      // Check if a template with this name already exists
      try {
        const response = await api.getAllTemplatesAdmin()
        if (response.success && response.data) {
          const existingTemplate = response.data.find((t: any) =>
            t.name.toLowerCase() === templateName.trim().toLowerCase()
          )

          if (existingTemplate) {
            const confirmOverwrite = confirm(
              `A template named "${templateName.trim()}" already exists. Do you want to overwrite it?`
            )
            if (!confirmOverwrite) {
              return // User cancelled the overwrite
            }
          }
        }
      } catch (error) {
        console.error('Error checking for existing templates:', error)
        // Continue with save even if check fails
      }

      // Update template name
      const updatedTemplate = { ...currentTemplate, name: templateName.trim() }
      setTemplate(updatedTemplate)
      templateRef.current = updatedTemplate

      // Perform save as create
      return performSaveAsCreate(templateName.trim())
    }

    // Existing template - just save/overwrite
    // If template is published, show warning
    if (isPublished) {
      if (!confirm('This template is published. Saving will update the published version. Continue?')) {
        return
      }
    }

    try {
      // Make sure is_active stays false when saving (don't accidentally publish)
      const templateToSave = { ...currentTemplate, is_active: isPublished }
      const response = await api.updateTemplate(currentTemplate.id, templateToSave)

      if (response.success && response.data) {
        // Update template with fresh data from backend (includes all pages/sections with proper IDs)
        const freshTemplate = response.data
        setTemplate(freshTemplate)

        // Update current page reference to match the new data
        if (currentPage) {
          const updatedCurrentPage = freshTemplate.pages.find((p: TemplatePage) => p.slug === currentPage.slug)
          if (updatedCurrentPage) {
            setCurrentPage(updatedCurrentPage)
          }
        }

        // Reset history after save - start fresh with saved state
        resetHistory(freshTemplate)
        setHasUnsavedChanges(false)
        alert('Template saved successfully!')
      } else {
        alert('Failed to save template: ' + (response.message || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Save error:', error)
      alert('Failed to save template: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    }
  }

  const performSaveAsCreate = async (templateName: string) => {
    // Use templateRef.current to get the most recent template state (avoids race conditions)
    const currentTemplate = templateRef.current
    if (!currentTemplate) return

    try {
      // Prepare template data for creation
      const templateData = {
        name: templateName,
        description: currentTemplate.description || '',
        business_type: currentTemplate.business_type || 'other',
        preview_image: currentTemplate.preview_image || '',
        is_active: false, // Always save as unpublished (draft) - only "Export As > HTML Template" publishes
        exclusive_to: currentTemplate.exclusive_to || null,
        technologies: currentTemplate.technologies || [],
        features: currentTemplate.features || [],
        custom_css: currentTemplate.custom_css || '',
        pages: currentTemplate.pages.map(page => ({
          name: page.name,
          slug: page.slug,
          page_id: page.page_id || null,
          is_homepage: page.is_homepage || false,
          order: page.order || 0,
          sections: page.sections.map(section => ({
            section_name: section.section_name || section.type,
            section_id: section.section_id || null,
            type: section.type,
            content: section.content || {},
            css: section.css || {},
            order: section.order || 0
          }))
        }))
      }

      const response = await api.createTemplate(templateData)

      if (response.success && response.data) {
        // Update template with returned data (includes id, template_slug, etc.)
        const newTemplate = { ...currentTemplate, ...response.data }
        setTemplate(newTemplate)
        templateRef.current = newTemplate

        // Set published state to false (it's a draft)
        setIsPublished(false)

        // Reset history after save - start fresh with saved state
        resetHistory(newTemplate)
        setHasUnsavedChanges(false)

        alert('Template created successfully!')
      } else {
        alert('Failed to save template: ' + (response.message || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Save error:', error)
      alert('Failed to save template: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    }
  }

  const handleSaveAs = async () => {
    // Use templateRef.current to get the most recent template state (avoids race conditions)
    const currentTemplate = templateRef.current
    if (!currentTemplate) {
      alert('No template to save')
      return
    }

    const newName = prompt('Save template as:', currentTemplate.name ? currentTemplate.name + ' (Copy)' : 'Untitled Template')
    if (!newName || newName.trim() === '') {
      return // User cancelled
    }

    // Create a copy with the new name and id = 0 (force create)
    await performSaveAsCreate(newName.trim())
  }

  const handleLoad = async () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Loading will discard them. Continue?')) {
        return
      }
    }

    // Fetch all templates and show modal
    setLoadingTemplates(true)
    setShowLoadModal(true)

    try {
      const response = await api.getAllTemplatesAdmin()
      if (response.success && response.data) {
        setAvailableTemplates(response.data)
      } else {
        alert('Failed to load templates list')
        setShowLoadModal(false)
      }
    } catch (error) {
      console.error('Load templates error:', error)
      alert('Failed to load templates list')
      setShowLoadModal(false)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleLoadTemplate = async (templateId: number) => {
    try {
      const response = await api.getTemplate(templateId)

      if (response.success && response.data) {
        const templateData = response.data

        setTemplate(templateData)

        // Set current page to homepage or first page
        const homepage = templateData.pages.find((p: TemplatePage) => p.is_homepage) || templateData.pages[0]
        setCurrentPage(homepage)

        // Check if published
        setIsPublished(templateData.is_active || false)

        // Reset history
        setHistory([JSON.parse(JSON.stringify(templateData))])
        setHistoryIndex(0)
        setCanUndo(false)
        setCanRedo(false)
        setHasUnsavedChanges(false)

        // Close modal
        setShowLoadModal(false)

        alert('Template loaded successfully!')
      } else {
        alert('Failed to load template')
      }
    } catch (error) {
      console.error('Load error:', error)
      alert('Failed to load template')
    }
  }

  // New Template Handler
  const handleNew = () => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Creating a new template will discard them. Continue?')) {
        return
      }
    }

    // Create a blank template with default homepage
    const defaultHomepage: TemplatePage = {
      id: Date.now(),
      name: 'Home',
      slug: 'home',
      is_homepage: true,
      order: 0,
      sections: []
    }

    const newTemplate: Template = {
      id: 0,
      name: 'Untitled Template',
      description: '',
      business_type: 'restaurant',
      is_active: false,
      pages: [defaultHomepage],
      preview_image: null,
      exclusive_to: null,
      technologies: [],
      features: []
    }

    // Reset all states
    setTemplate(newTemplate)
    setCurrentPage(defaultHomepage)
    setSelectedSection(null)
    setHistory([JSON.parse(JSON.stringify(newTemplate))])
    setHistoryIndex(0)
    setCanUndo(false)
    setCanRedo(false)
    setHasUnsavedChanges(false)
    setIsPublished(false)

    // Clear URL parameter to remove template ID
    window.history.pushState({}, '', '/template-builder')
  }

  // Exit Handler
  const handleExit = () => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Exiting will discard them. Continue?')) {
        return
      }
    }

    // Close the browser tab/window
    window.close()

    // Fallback: If window.close() doesn't work (security restrictions),
    // navigate to dashboard or show message
    setTimeout(() => {
      alert('Please close this tab manually or use your browser\'s close button.')
    }, 100)
  }

  // Live Preview Handler
  const handleLivePreview = () => {
    if (!template || !template.template_slug) {
      alert('Please save your template first to generate live preview.')
      return
    }

    if (!currentPage) {
      alert('No page selected. Please select a page to preview.')
      return
    }

    // Open physical PHP file for the current page being edited
    const pageFile = currentPage.slug === 'home' ? 'index.php' : `${currentPage.slug}.php`
    const previewUrl = `http://localhost:8000/template_directory/${template.template_slug}/${pageFile}`
    window.open(previewUrl, '_blank')
  }

  const handleExportAsHTMLTemplate = async () => {
    if (!template) {
      alert('No template to export')
      return
    }

    // Check if already published
    if (isPublished) {
      if (!confirm('This template is already published. Exporting again will update the published version. Continue?')) {
        return
      }
    }

    // Check for unsaved changes
    if (hasUnsavedChanges) {
      alert('Please save your changes before publishing the template.')
      return
    }

    // Confirm export
    if (!confirm('Export this template as HTML Template? This will publish the template and make it available to users.')) {
      return
    }

    try {
      // Update template to set is_active = true (published)
      const updatedTemplate = {
        ...template,
        is_active: true
      }

      const response = await api.updateTemplate(template.id, updatedTemplate)

      if (response.success) {
        setTemplate(updatedTemplate)
        setIsPublished(true)
        alert('Template published successfully! It is now available in the templates list.')
      } else {
        alert('Failed to publish template: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to publish template')
    }
  }

  const handleExportReact = () => {
    console.log('Export as React - to be implemented')
    // TODO: Implement React export
  }

  const handleExportHTML = () => {
    console.log('Export as HTML - to be implemented')
    // TODO: Implement HTML export
  }

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

  // Handler for applying HTML changes
  const handleApplyHTMLChanges = () => {
    if (!currentPage || !template) return

    // Show confirmation dialog
    if (!confirm('Applying HTML changes will update your template structure. This may cause issues with the template builder if structural elements have been modified. Continue?')) {
      return
    }

    try {
      // For now, we'll implement a simplified parsing that extracts text content from columns
      // A full HTML parser would be more complex and is beyond the current scope

      // Parse the edited HTML to extract section content
      const parser = new DOMParser()
      const doc = parser.parseFromString(editableHTML, 'text/html')

      // Find all sections in the parsed HTML
      const sections = doc.querySelectorAll('section')

      // Update sections in currentPage
      const updatedSections = currentPage.sections.map((section, idx) => {
        const sectionElement = sections[idx]
        if (!sectionElement) return section

        // Update text content in columns for grid sections
        if (section.type.startsWith('grid-')) {
          const columns = sectionElement.querySelectorAll('[class*="col-"]')
          const updatedColumns = (section.content?.columns || []).map((col: any, colIdx: number) => {
            const columnElement = columns[colIdx]
            if (columnElement) {
              return {
                ...col,
                content: columnElement.innerHTML.trim()
              }
            }
            return col
          })

          return {
            ...section,
            content: {
              ...section.content,
              columns: updatedColumns
            }
          }
        }

        // Handle other section types (hero, etc.)
        // Extract text from heading and paragraph
        const heading = sectionElement.querySelector('h1, h2')
        const paragraph = sectionElement.querySelector('p')

        if (heading || paragraph) {
          return {
            ...section,
            content: {
              ...section.content,
              heading: heading?.textContent || section.content?.heading,
              text: paragraph?.textContent || section.content?.text
            }
          }
        }

        return section
      })

      // Update the page with modified sections
      const updatedPage = {
        ...currentPage,
        sections: updatedSections
      }

      // Update template with modified page
      const updatedPages = template.pages.map(p =>
        p.id === currentPage.id ? updatedPage : p
      )

      const updatedTemplate = {
        ...template,
        pages: updatedPages
      }
      setTemplate(updatedTemplate)
      setCurrentPage(updatedPage)
      addToHistory(updatedTemplate)
      setIsEditingHTML(false)

      alert('HTML changes applied successfully! Remember to save your template.')
    } catch (error) {
      console.error('Error parsing HTML:', error)
      alert('Failed to parse HTML. Please check your syntax and try again.')
    }
  }

  // Handler for applying CSS changes
  const handleApplyCSSChanges = () => {
    if (!currentPage || !template) return

    // Show confirmation dialog
    if (!confirm('Applying CSS changes will update your styles. Invalid CSS may cause display issues. Continue?')) {
      return
    }

    try {
      // Extract different CSS sections from the edited CSS
      const cssText = editableCSS

      // Split CSS by comments to identify different sections
      const siteCSSMatch = cssText.match(/\/\* Site-Wide Styles \*\/\s*\n([\s\S]*?)(?=\/\*|$)/)
      const pageCSSMatch = cssText.match(/\/\* Page-Specific Styles:.*?\*\/\s*\n([\s\S]*?)(?=\/\*|$)/)

      // Update site CSS if found
      if (siteCSSMatch && siteCSSMatch[1]) {
        const siteCSS = siteCSSMatch[1].trim()
        setTemplate({
          ...template,
          custom_css: siteCSS
        })
      }

      // Update page CSS if found
      if (pageCSSMatch && pageCSSMatch[1]) {
        const pageCSS = pageCSSMatch[1].trim()
        const updatedPage = {
          ...currentPage,
          page_css: pageCSS
        }

        const updatedPages = template.pages.map(p =>
          p.id === currentPage.id ? updatedPage : p
        )

        setTemplate({
          ...template,
          pages: updatedPages
        })
        setCurrentPage(updatedPage)
      }

      // Parse section-specific CSS
      const sectionCSSMatches = cssText.matchAll(/#(section-\d+|[\w-]+)\s*\{([^}]+)\}/g)
      const updatedSections = [...currentPage.sections]

      for (const match of sectionCSSMatches) {
        const sectionId = match[1]
        const cssContent = match[2].trim()

        // Find matching section
        const sectionIndex = updatedSections.findIndex(s => {
          const sid = s.section_id || `section-${s.id}`
          return sid === sectionId
        })

        if (sectionIndex !== -1) {
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            content: {
              ...updatedSections[sectionIndex].content,
              section_css: cssContent
            }
          }
        }
      }

      // Update page with modified sections
      const updatedPage = {
        ...currentPage,
        sections: updatedSections
      }

      const updatedPages = template.pages.map(p =>
        p.id === currentPage.id ? updatedPage : p
      )

      const updatedTemplate = {
        ...template,
        pages: updatedPages
      }
      setTemplate(updatedTemplate)
      setCurrentPage(updatedPage)
      addToHistory(updatedTemplate)
      setIsEditingCSS(false)

      alert('CSS changes applied successfully! Remember to save your template.')
    } catch (error) {
      console.error('Error parsing CSS:', error)
      alert('Failed to parse CSS. Please check your syntax and try again.')
    }
  }

  // Clickable text component that opens the editor

  const renderSection = (section: TemplateSection, index: number) => {
    const content = section.content || {}

    // Determine section behavior based on type
    const isTopLocked = section.type === 'navbar' || section.type.startsWith('navbar-') || section.type.startsWith('header-')
    const isBottomLocked = section.type.startsWith('footer-')
    const isSidebar = section.type.startsWith('sidebar-nav-')
    const isLeftSidebar = section.type === 'sidebar-nav-left'
    const isRightSidebar = section.type === 'sidebar-nav-right'
    const isPositionLocked = isTopLocked || isBottomLocked
    const isHovered = hoveredSection === section.id

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

    const sectionWrapper = (children: React.ReactNode) => (
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
          const hasAnyCss = sectionCss || hasRows || hasColumns || hasNavbarStyling

          // Parse CSS string into property map
          const parseCssString = (cssString: string): Record<string, string> => {
            if (!cssString) return {}
            const properties: Record<string, string> = {}
            // Match CSS property: value pairs
            const regex = /([a-z-]+)\s*:\s*([^;]+);?/gi
            let match
            while ((match = regex.exec(cssString)) !== null) {
              properties[match[1].trim()] = match[2].trim()
            }
            return properties
          }

          // Convert camelCase object to CSS properties
          const objectToCssProps = (obj: any): Record<string, string> => {
            if (!obj || typeof obj !== 'object') return {}
            const props: Record<string, string> = {}
            Object.entries(obj).forEach(([key, value]) => {
              if (value !== undefined && value !== '') {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
                props[cssKey] = String(value)
              }
            })
            return props
          }

          // Build inheritance chain for a specific property
          const buildInheritanceChain = (property: string) => {
            const chain: Array<{level: string, value: string | null, color: string}> = []

            // 1. Site CSS (lowest priority)
            const siteProps = parseCssString(template?.custom_css || '')
            chain.push({
              level: 'Site CSS',
              value: siteProps[property] || null,
              color: 'text-purple-300'
            })

            // 2. Page CSS
            const pageProps = parseCssString(currentPage?.page_css || '')
            chain.push({
              level: 'Page CSS',
              value: pageProps[property] || null,
              color: 'text-blue-300'
            })

            // 3. Section CSS
            const sectionProps = parseCssString(section.content?.section_css || '')
            const containerProps = objectToCssProps(section.content?.containerStyle || {})
            const mergedSectionProps = {...sectionProps, ...containerProps}
            chain.push({
              level: 'Section CSS',
              value: mergedSectionProps[property] || null,
              color: 'text-green-300'
            })

            return chain
          }

          // Get all unique properties across the cascade
          const getAllProperties = (): Set<string> => {
            const props = new Set<string>()
            const siteProps = parseCssString(template?.custom_css || '')
            const pageProps = parseCssString(currentPage?.page_css || '')
            const sectionProps = parseCssString(section.content?.section_css || '')
            const containerProps = objectToCssProps(section.content?.containerStyle || {})

            Object.keys(siteProps).forEach(p => props.add(p))
            Object.keys(pageProps).forEach(p => props.add(p))
            Object.keys(sectionProps).forEach(p => props.add(p))
            Object.keys(containerProps).forEach(p => props.add(p))

            return props
          }

          // Generate CSS representation from styling objects
          const generateCssFromStyle = (style: any, label: string) => {
            if (!style || Object.keys(style).length === 0) return null
            const cssLines = Object.entries(style)
              .filter(([_, value]) => value !== undefined && value !== '')
              .map(([key, value]) => {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
                return `  ${cssKey}: ${value};`
              })
            return cssLines.length > 0 ? `/* ${label} */\n${cssLines.join('\n')}` : null
          }

          return createPortal(
            <div
              className="builder-ui bg-gray-900 bg-opacity-95 text-white p-4 rounded-lg shadow-2xl overflow-y-auto"
              style={{
                position: 'fixed',
                top: '16px',
                right: '16px',
                width: '500px',
                maxHeight: 'calc(100vh - 32px)', // Full height minus top/bottom spacing
                zIndex: 9999,
                pointerEvents: 'auto' // Allow scrolling in tooltip
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-yellow-300">
                  {section.section_name || section.type} - CSS Inspector
                </span>
                <svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>

              {!hasAnyCss && (
                <div className="text-xs text-gray-400 italic">
                  No styling applied to this section
                </div>
              )}

              {/* Navigation Styling (from Navigation Styling Panel) */}
              {(section.type === 'navbar' || section.type.startsWith('navbar-')) && hasNavbarStyling && (
                <div className="mb-3">
                  <span className="text-xs font-bold text-cyan-300">Navigation Styling:</span>
                  <div className="mt-1 space-y-2">
                    {containerStyle && Object.keys(containerStyle).length > 0 && (
                      <div>
                        <span className="text-xs text-gray-400">Container:</span>
                        <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                          {generateCssFromStyle(containerStyle, 'Container')}
                        </pre>
                      </div>
                    )}
                    {linkStyling && Object.keys(linkStyling).length > 0 && (
                      <div>
                        <span className="text-xs text-gray-400">Links:</span>
                        <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                          {generateCssFromStyle(linkStyling, 'Links')}
                        </pre>
                      </div>
                    )}
                    {activeIndicator && Object.keys(activeIndicator).length > 0 && (
                      <div>
                        <span className="text-xs text-gray-400">Active Link:</span>
                        <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 ml-2">
                          {generateCssFromStyle(activeIndicator, 'Active Indicator')}
                        </pre>
                      </div>
                    )}
                    {dropdownConfig && section.type === 'navbar-dropdown' && (
                      <div>
                        <span className="text-xs text-gray-400">Dropdown Config:</span>
                        <pre className="text-xs font-mono whitespace-pre-wrap text-orange-300 ml-2">
                          {`Trigger: click (always)\nTransition: ${dropdownConfig.transitionDuration || 200}ms`}
                        </pre>
                      </div>
                    )}
                  </div>
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

    // Grid sections (1x1, 2x1, 3x1, etc.)
    if (section.type.startsWith('grid-')) {
      const [_, gridConfig] = section.type.split('-')
      const [cols, rows] = gridConfig.split('x').map(Number)
      const columns = content.columns || []

      const handleGridColumnEdit = (colIdx: number, e: React.FocusEvent<HTMLElement>) => {
        const value = e.currentTarget.innerHTML
        const updatedColumns = [...columns]
        updatedColumns[colIdx] = { ...updatedColumns[colIdx], content: value }

        if (!currentPage) return

        const updatedSections = currentPage.sections.map(s => {
          if (s.id === section.id) {
            return {
              ...s,
              content: {
                ...s.content,
                columns: updatedColumns
              }
            }
          }
          return s
        })

        const updatedPages = template!.pages.map(p => {
          if (p.id === currentPage.id) {
            return { ...p, sections: updatedSections }
          }
          return p
        })

        setTemplate({ ...template!, pages: updatedPages })
        setCurrentPage({ ...currentPage, sections: updatedSections })
      }

      return sectionWrapper(
        <div
          id={section.section_id || `section-${section.id}`}
          className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
        >
          <div className="row">
            {columns.map((col: any, idx: number) => (
              <div
                key={idx}
                className={`col-${col.colWidth || 12}`}
              >
                <EditableText
                  tag="div"
                  sectionId={section.id}
                  field={`column_${idx}`}
                  value={col.content || `Column ${idx + 1}`}
                  className="outline-none hover:bg-white/50 rounded transition"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    switch (section.type) {
      // Navigation and Header sections
      case 'navbar':
        const navPosition = content.position || 'static'
        const logoWidth = content.layoutConfig?.logoWidth || content.logoWidth || 25
        const links = content.links || []
        const layoutConfig = content.layoutConfig || {}
        const dropdownConfig = content.dropdownConfig || {}
        const linkStyling = content.linkStyling || {}

        // Layout positioning
        const logoPosition = layoutConfig.logoPosition || 'left'
        const linksPosition = layoutConfig.linksPosition || 'right'

        // Link styling
        const linkTextColor = linkStyling.textColor || '#000000'
        const linkTextColorHover = linkStyling.textColorHover || '#666666'

        // Dropdown styling
        const dropdownBg = dropdownConfig.dropdownBg || '#ffffff'
        const dropdownBorder = dropdownConfig.dropdownBorder || '1px solid #e5e7eb'
        const dropdownShadow = dropdownConfig.dropdownShadow || '0 4px 6px rgba(0,0,0,0.1)'
        const dropdownPadding = dropdownConfig.dropdownPadding || '8px'
        const dropdownItemHoverBg = dropdownConfig.dropdownItemHoverBg || '#f3f4f6'

        // Mobile menu button styling
        const mobileMenuButtonBg = dropdownConfig.mobileMenuButtonBg || 'transparent'
        const mobileMenuButtonColor = dropdownConfig.mobileMenuButtonColor || '#000000'
        const mobileMenuButtonHoverBg = dropdownConfig.mobileMenuButtonHoverBg || '#f3f4f6'

        // Dropdowns always use click behavior (hover option removed for simplicity)

        const DropdownNavItem = ({ link, currentPageId }: any) => {
          const [isOpen, setIsOpen] = useState(false)
          const [isHovered, setIsHovered] = useState(false)
          const hasSubItems = typeof link === 'object' && link.subItems && link.subItems.length > 0
          const isActive = isActivePage(link, currentPageId)
          const dropdownRef = useRef<HTMLDivElement>(null)

          // Check if global button styling is enabled
          const hasButtonStyle = content.buttonStyling?.enabled || false
          const btnStyle = content.buttonStyling || {}

          // Close dropdown when clicking outside
          useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
              if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
              }
            }

            if (isOpen) {
              document.addEventListener('mousedown', handleClickOutside)
              return () => {
                document.removeEventListener('mousedown', handleClickOutside)
              }
            }
          }, [isOpen])

          const handleMouseEnter = () => {
            setIsHovered(true)
          }

          const handleMouseLeave = () => {
            setIsHovered(false)
          }

          const handleClick = (e: any) => {
            if (hasSubItems) {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }

          return (
            <div ref={dropdownRef} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <a
                href={getLinkHref(link)}
                className={`cursor-pointer flex items-center gap-1 transition ${hasButtonStyle ? 'inline-block' : ''}`}
                onClick={handleClick}
                style={hasButtonStyle ? {
                  backgroundColor: isHovered ? btnStyle.hoverBackgroundColor : btnStyle.backgroundColor,
                  color: isHovered ? btnStyle.hoverTextColor : btnStyle.textColor,
                  borderWidth: `${btnStyle.borderWidth || 0}px`,
                  borderStyle: btnStyle.borderStyle || 'solid',
                  borderColor: btnStyle.borderColor || btnStyle.backgroundColor,
                  borderRadius: `${btnStyle.borderRadius || 0}px`,
                  paddingTop: `${btnStyle.paddingTop || 8}px`,
                  paddingRight: `${btnStyle.paddingRight || 16}px`,
                  paddingBottom: `${btnStyle.paddingBottom || 8}px`,
                  paddingLeft: `${btnStyle.paddingLeft || 16}px`,
                  fontSize: `${btnStyle.fontSize || 14}px`,
                  fontWeight: btnStyle.fontWeight || '500',
                  marginTop: `${btnStyle.marginTop || 5}px`,
                  marginRight: `${btnStyle.marginRight || 5}px`,
                  marginBottom: `${btnStyle.marginBottom || 5}px`,
                  marginLeft: `${btnStyle.marginLeft || 5}px`,
                  textDecoration: 'none'
                } : {
                  color: isHovered ? linkTextColorHover : linkTextColor,
                  fontWeight: isActive ? 'bold' : 'normal',
                  textDecoration: isActive ? 'underline' : 'none'
                }}
              >
                {getLinkLabel(link)}
              </a>
              {isOpen && hasSubItems && (
                <div
                  className="absolute top-full left-0 mt-1 min-w-[120px] z-10"
                  style={{
                    backgroundColor: dropdownBg,
                    border: dropdownBorder,
                    boxShadow: dropdownShadow,
                    padding: dropdownPadding,
                    borderRadius: '0.25rem'
                  }}
                >
                  {link.subItems.map((subItem: any, subIdx: number) => {
                    const DropdownSubItem = () => {
                      const [isSubHovered, setIsSubHovered] = useState(false)
                      const isSubItemActive = isActivePage(subItem, currentPageId)
                      return (
                        <a
                          href={getLinkHref(subItem)}
                          className="block text-sm py-1 px-2 rounded transition"
                          style={hasButtonStyle ? {
                            backgroundColor: isSubHovered ? btnStyle.hoverBackgroundColor : btnStyle.backgroundColor,
                            color: isSubHovered ? btnStyle.hoverTextColor : btnStyle.textColor,
                            borderWidth: `${btnStyle.borderWidth || 0}px`,
                            borderStyle: btnStyle.borderStyle || 'solid',
                            borderColor: btnStyle.borderColor || btnStyle.backgroundColor,
                            borderRadius: `${btnStyle.borderRadius || 0}px`,
                            paddingTop: `${btnStyle.paddingTop || 8}px`,
                            paddingRight: `${btnStyle.paddingRight || 16}px`,
                            paddingBottom: `${btnStyle.paddingBottom || 8}px`,
                            paddingLeft: `${btnStyle.paddingLeft || 16}px`,
                            fontSize: `${btnStyle.fontSize || 14}px`,
                            fontWeight: btnStyle.fontWeight || '500',
                            marginTop: `${btnStyle.marginTop || 5}px`,
                            marginRight: `${btnStyle.marginRight || 5}px`,
                            marginBottom: `${btnStyle.marginBottom || 5}px`,
                            marginLeft: `${btnStyle.marginLeft || 5}px`,
                            textDecoration: 'none'
                          } : {
                            color: isSubHovered ? linkTextColorHover : linkTextColor,
                            fontWeight: isSubItemActive ? 'bold' : 'normal',
                            backgroundColor: isSubHovered ? dropdownItemHoverBg : 'transparent'
                          }}
                          onMouseEnter={() => setIsSubHovered(true)}
                          onMouseLeave={() => setIsSubHovered(false)}
                          onClick={(e) => e.preventDefault()}
                        >
                          {getLinkLabel(subItem)}
                        </a>
                      )
                    }
                    return <DropdownSubItem key={subIdx} />
                  })}
                </div>
              )}
            </div>
          )
        }

        return sectionWrapper(
          <>
            {/* Custom CSS for navbar */}
            {content.content_css && (
              <style dangerouslySetInnerHTML={{ __html: `
                #${section.section_id || `section-${section.id}`} {
                  ${content.content_css}
                }
              ` }} />
            )}
            <div
              id={section.section_id || `section-${section.id}`}
              className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
              style={{
                // Base padding (matches backend CSS)
                paddingTop: '16px',
                paddingBottom: '16px',
                // Container style overrides (will override base padding if set)
                ...generateContainerStyle(content.containerStyle || {}),
                borderBottom: content.containerStyle?.borderWidth ? undefined : '2px solid #e5e7eb',
                borderRadius: content.containerStyle?.borderRadius || 0,
                // In canvas preview, always use relative positioning
                // (Fixed/sticky only applies in live preview and exported files)
                position: 'relative'
              }}
            >
              <div className="flex items-center" style={{
                width: '100%',
                padding: '0 16px',
                flexDirection: logoPosition === 'center' && linksPosition === 'center' ? 'column' : 'row',
                flexWrap: 'wrap',
                justifyContent:
                  logoPosition === 'center' && linksPosition === 'center' ? 'center' :
                  logoPosition === 'left' && linksPosition === 'right' ? 'space-between' :
                  logoPosition === 'right' && linksPosition === 'left' ? 'space-between' :
                  'space-between',
                gap: logoPosition === 'center' && linksPosition === 'center' ? '16px' : '8px'
              }}>
              {/* Render logo first if on left or center, last if on right */}
              {(logoPosition === 'left' || logoPosition === 'center') && (
                <div style={{
                  width: logoPosition === 'center' ? '100%' : `${logoWidth}%`,
                  minWidth: logoPosition === 'center' ? 'auto' : '120px',
                  textAlign: logoPosition === 'center' ? 'center' : 'left'
                }}>
                  <EditableText
                    tag="div"
                    sectionId={section.id}
                    field="logo"
                    value={(content.logo && content.logo.trim()) || 'Logo'}
                    className="text-xl font-bold outline-none hover:bg-gray-50 px-2 py-1 rounded transition"
                  
                  isEditing={editingText?.sectionId === section.id && editingText?.field === "logo"}
                  onOpenEditor={handleOpenTextEditor}/>
                </div>
              )}

              {/* Navigation Links - Desktop */}
              <div className={`hidden md:flex items-center flex-1 ${content.buttonStyling?.enabled ? '' : 'gap-6'}`} style={{
                flexWrap: 'wrap',
                justifyContent:
                  linksPosition === 'center' ? 'center' :
                  linksPosition === 'left' ? 'flex-start' :
                  'flex-end',
                order: logoPosition === 'right' && linksPosition === 'left' ? -1 : 0
              }}>
                {links.map((link: any, idx: number) => {
                  const hasSubItems = typeof link === 'object' && link.subItems && link.subItems.length > 0

                  if (hasSubItems) {
                    return <DropdownNavItem key={idx} link={link} currentPageId={currentPage?.id || 0} />
                  }

                  const LinkItem = () => {
                    const [isHovered, setIsHovered] = useState(false)
                    const isActive = isActivePage(link, currentPage?.id || 0)

                    // Check if global button styling is enabled
                    const hasButtonStyle = content.buttonStyling?.enabled || false
                    const btnStyle = content.buttonStyling || {}

                    if (hasButtonStyle) {
                      // Render as button
                      return (
                        <a
                          href={getLinkHref(link)}
                          className="transition inline-block"
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                          style={{
                            backgroundColor: isHovered ? btnStyle.hoverBackgroundColor : btnStyle.backgroundColor,
                            color: isHovered ? btnStyle.hoverTextColor : btnStyle.textColor,
                            borderWidth: `${btnStyle.borderWidth || 0}px`,
                            borderStyle: btnStyle.borderStyle || 'solid',
                            borderColor: btnStyle.borderColor || btnStyle.backgroundColor,
                            borderRadius: `${btnStyle.borderRadius || 0}px`,
                            paddingTop: `${btnStyle.paddingTop || 8}px`,
                            paddingRight: `${btnStyle.paddingRight || 16}px`,
                            paddingBottom: `${btnStyle.paddingBottom || 8}px`,
                            paddingLeft: `${btnStyle.paddingLeft || 16}px`,
                            fontSize: `${btnStyle.fontSize || 14}px`,
                            fontWeight: btnStyle.fontWeight || '500',
                            marginTop: `${btnStyle.marginTop || 5}px`,
                            marginRight: `${btnStyle.marginRight || 5}px`,
                            marginBottom: `${btnStyle.marginBottom || 5}px`,
                            marginLeft: `${btnStyle.marginLeft || 5}px`,
                            textDecoration: 'none'
                          }}
                          onClick={(e) => e.preventDefault()}
                        >
                          {getLinkLabel(link)}
                        </a>
                      )
                    }

                    // Render as text link
                    return (
                      <a
                        href={getLinkHref(link)}
                        className="transition"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        style={{
                          color: isHovered ? linkTextColorHover : linkTextColor,
                          fontWeight: isActive ? 'bold' : 'normal',
                          textDecoration: isActive ? 'underline' : 'none'
                        }}
                        onClick={(e) => e.preventDefault()}
                      >
                        {getLinkLabel(link)}
                      </a>
                    )
                  }
                  return <LinkItem key={idx} />
                })}
              </div>

              {/* Render logo last if on right */}
              {logoPosition === 'right' && (
                <div style={{ width: `${logoWidth}%`, minWidth: '120px', textAlign: 'right' }}>
                  <EditableText
                    tag="div"
                    sectionId={section.id}
                    field="logo"
                    value={(content.logo && content.logo.trim()) || 'Logo'}
                    className="text-xl font-bold outline-none hover:bg-gray-50 px-2 py-1 rounded transition"
                  
                  isEditing={editingText?.sectionId === section.id && editingText?.field === "logo"}
                  onOpenEditor={handleOpenTextEditor}/>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded transition"
                style={{
                  backgroundColor: mobileMenuButtonBg,
                  color: mobileMenuButtonColor
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = mobileMenuButtonHoverBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = mobileMenuButtonBg}
                onClick={() => setMobileMenuOpen({ ...mobileMenuOpen, [section.id]: true })}
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu */}
            <MobileMenu
              isOpen={!!mobileMenuOpen[section.id]}
              onClose={() => setMobileMenuOpen({ ...mobileMenuOpen, [section.id]: false })}
              links={links}
              linkStyling={linkStyling}
              activeIndicator={{}}
              mobileMenuBg={dropdownConfig.mobileMenuBg}
              currentPageId={currentPage?.id || 0}
              buttonStyling={content.buttonStyling}
              getLinkHref={getLinkHref}
              getLinkLabel={getLinkLabel}
              isActivePage={isActivePage}
              generateLinkStyle={generateLinkStyle}
              generateActiveIndicatorStyle={generateActiveIndicatorStyle}
            />
          </div>
          </>
        )

      // Legacy navbar types (deprecated)
      case 'navbar-basic':
      case 'navbar-sticky':
      case 'navbar-dropdown':
        return sectionWrapper(
          <div className="bg-yellow-50 border-2 border-yellow-400 p-4 text-center">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ This navbar type is deprecated. Please delete this section and add the new unified "Navigation Bar" instead.
            </p>
          </div>
        )

      // Footer sections
      case 'footer-simple':
        const simpleFooterStyle = content.sectionStyle || {}
        return sectionWrapper(
          <div
            id={section.section_id || `section-${section.id}`}
            className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
            style={{
              backgroundColor: simpleFooterStyle.background || '#1f2937',
              padding: simpleFooterStyle.padding || '32px',
              textAlign: (simpleFooterStyle.textAlign || 'center') as any
            }}
          >
            <EditableText
              tag="p"
              sectionId={section.id}
              field="text"
              value={content.text || '© 2025 Company Name. All rights reserved.'}
              className="outline-none hover:bg-white/10 px-2 py-1 rounded transition text-white text-sm"
            
                  isEditing={editingText?.sectionId === section.id && editingText?.field === "text"}
                  onOpenEditor={handleOpenTextEditor}/>
          </div>
        )

      case 'footer-columns':
        const columnsFooterStyle = content.sectionStyle || {}
        const copyrightStyle = content.copyrightStyle || {}
        return sectionWrapper(
          <div
            id={section.section_id || `section-${section.id}`}
            className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
            style={{
              backgroundColor: columnsFooterStyle.background || '#172554'
            }}
          >
            {/* 3-column grid */}
            <div className="grid grid-cols-3 gap-8 p-12 max-w-7xl mx-auto text-white">
              {(content.columns || []).map((col: any, idx: number) => (
                <div key={idx} className="min-h-[150px] text-center">
                  <EditableText
                    tag="div"
                    sectionId={section.id}
                    field={`column_${idx}`}
                    value={col.content || '<p>Column content</p>'}
                    className="outline-none hover:bg-white/10 px-2 py-1 rounded transition"
                  />
                </div>
              ))}
            </div>
            {/* Copyright row */}
            <div
              style={{
                backgroundColor: copyrightStyle.background || '#171717',
                padding: copyrightStyle.padding || '24px',
                borderTop: copyrightStyle.borderTop || '1px solid #374151'
              }}
            >
              <div className="max-w-7xl mx-auto px-12">
                <EditableText
                  tag="p"
                  sectionId={section.id}
                  field="copyrightText"
                  value={content.copyrightText || '© 2025 Company Name. All rights reserved.'}
                  className="text-center outline-none hover:bg-white/10 px-2 py-1 rounded transition text-white text-sm"
                
                  isEditing={editingText?.sectionId === section.id && editingText?.field === "copyrightText"}
                  onOpenEditor={handleOpenTextEditor}/>
              </div>
            </div>
          </div>
        )

      default:
        return sectionWrapper(
          <div className={`p-12 border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#98b290] transition ${selectedSection?.id === section.id ? 'border-[#98b290]' : ''}`}>
            <p className="text-gray-500 text-center">Section: {section.type}</p>
          </div>
        )
    }
  }

  const handleLeftMouseDown = () => setIsResizingLeft(true)
  const handleRightMouseDown = () => setIsResizingRight(true)

  const handleMouseUp = () => {
    setIsResizingLeft(false)
    setIsResizingRight(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 500) {
        setLeftWidth(newWidth)
      }
    }
    if (isResizingRight) {
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 250 && newWidth <= 600) {
        setRightWidth(newWidth)
      }
    }
  }

  const getCanvasWidth = () => {
    if (viewport === 'mobile') return '375px'
    if (viewport === 'tablet') return '768px'
    return '100%'
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

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-2 py-1 flex items-center justify-between h-10">
        {/* Left Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className={`p-1.5 rounded transition ${showLeftSidebar ? 'bg-[#d4e5d0] text-[#5a7a54]' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Components Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className={`p-1.5 rounded transition ${showRightSidebar ? 'bg-[#d4e5d0] text-[#5a7a54]' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Properties Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Center - Viewport Switcher */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded p-0.5">
          <button
            onClick={() => setViewport('desktop')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'desktop' ? 'bg-[#98b290] text-white' : 'hover:bg-gray-200 text-gray-700'}`}
            title="Desktop View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'tablet' ? 'bg-[#98b290] text-white' : 'hover:bg-gray-200 text-gray-700'}`}
            title="Tablet View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'mobile' ? 'bg-[#98b290] text-white' : 'hover:bg-gray-200 text-gray-700'}`}
            title="Mobile View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-600">Zoom: 100%</span>
        </div>
      </div>

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
            <aside
              ref={leftSidebarRef}
              style={{ width: leftWidth }}
              className="bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0"
            >
              <div className="p-3">
                {/* Section Library */}
                <h2 className="text-xs font-semibold text-[#5a7a54] uppercase mb-3">Section Library</h2>

                {/* Core Sections */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleCategory('core')}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] hover:from-[#d4e5d0] hover:to-[#c1d9bc] border border-[#98b290] rounded text-xs font-medium text-[#5a7a54] transition"
                  >
                    <span>Core Sections</span>
                    <svg
                      className={`w-3 h-3 transition-transform text-[#5a7a54] ${expandedCategories.includes('core') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expandedCategories.includes('core') && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {coreSections.map((section) => (
                        <DraggableSectionItem key={section.type} section={section}>
                          <div
                            className="group relative w-full cursor-grab active:cursor-grabbing"
                            title={section.description}
                          >
                            <SectionThumbnail section={section} />
                            <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-[#5a7a54] transition">
                              {section.label}
                            </div>
                          </div>
                        </DraggableSectionItem>
                      ))}
                    </div>
                  )}
                </div>

                {/* Header & Navigation Sections */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleCategory('headerNav')}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] hover:from-[#d4e5d0] hover:to-[#c1d9bc] border border-[#98b290] rounded text-xs font-medium text-[#5a7a54] transition"
                  >
                    <span>Header & Navigation</span>
                    <svg
                      className={`w-3 h-3 transition-transform text-[#5a7a54] ${expandedCategories.includes('headerNav') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expandedCategories.includes('headerNav') && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {headerNavigationSections.map((section) => (
                        <DraggableSectionItem key={section.type} section={section}>
                          <div
                            className="group relative w-full cursor-grab active:cursor-grabbing"
                            title={section.description}
                          >
                            <SectionThumbnail section={section} />
                            <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-[#5a7a54] transition">
                              {section.label}
                            </div>
                          </div>
                        </DraggableSectionItem>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Sections */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleCategory('footers')}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] hover:from-[#d4e5d0] hover:to-[#c1d9bc] border border-[#98b290] rounded text-xs font-medium text-[#5a7a54] transition"
                  >
                    <span>Footers</span>
                    <svg
                      className={`w-3 h-3 transition-transform text-[#5a7a54] ${expandedCategories.includes('footers') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expandedCategories.includes('footers') && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {footerSections.map((section) => (
                        <DraggableSectionItem key={section.type} section={section}>
                          <div
                            className="group relative w-full cursor-grab active:cursor-grabbing"
                            title={section.description}
                          >
                            <SectionThumbnail section={section} />
                            <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-[#5a7a54] transition">
                              {section.label}
                            </div>
                          </div>
                        </DraggableSectionItem>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </aside>

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
              width: getCanvasWidth(),
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
              renderSection={renderSection}
              viewport={viewport}
            />
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        {showRightSidebar && (
          <>
            {/* Right Resize Handle */}
            <div
              onMouseDown={handleRightMouseDown}
              className="w-1 bg-gray-200 hover:bg-[#98b290] cursor-col-resize transition flex-shrink-0"
            />

            <aside
              ref={rightSidebarRef}
              style={{ width: rightWidth }}
              className="bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0"
            >
              <div className="p-3">
                <h2 className="text-xs font-semibold text-[#5a7a54] uppercase mb-3">
                  {showCSSPanel ? 'CSS Editor' : 'Properties'}
                </h2>
                {showCSSPanel ? (
                  <div className="space-y-3">
                    {/* CSS Tabs */}
                    <div className="flex border-b border-gray-200">
                      <button
                        onClick={() => setCssTab('site')}
                        className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                          cssTab === 'site'
                            ? 'bg-[#e8f0e6] text-[#5a7a54] border-b-2 border-[#98b290]'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Site CSS
                      </button>
                      <button
                        onClick={() => setCssTab('page')}
                        className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                          cssTab === 'page'
                            ? 'bg-[#e8f0e6] text-[#5a7a54] border-b-2 border-[#98b290]'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Page CSS
                      </button>
                    </div>

                    {/* CSS Content */}
                    {cssTab === 'site' ? (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Global Stylesheet
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                          CSS applied to all pages in this template
                        </p>
                        <StyleEditor
                          value={template?.custom_css || ''}
                          onChange={(css) => {
                            console.log('[Site CSS onChange #2] New CSS:', css)
                            const updatedTemplate = { ...template!, custom_css: css }
                            setTemplate(updatedTemplate)
                            templateRef.current = updatedTemplate // Sync ref immediately to avoid race condition during save
                            addToHistory(updatedTemplate)
                          }}
                          context="page"
                          showFontSelector={true}
                          showBodyLabel={true}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Page-Specific CSS
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
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
                            templateRef.current = updatedTemplate // Sync ref immediately to avoid race condition during save
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
                      className="w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition"
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
                      <div className="text-xs text-gray-500 space-y-1">
                        <p><strong>Section:</strong> {selectedSection.section_name || selectedSection.type}</p>
                        <p><strong>ID:</strong> {selectedSection.section_id || 'Not set'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Section Name</label>
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
                            // Update in template
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
                              templateRef.current = updatedTemplate // Sync ref immediately to avoid race condition during save
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
                            // Update in template
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
                              templateRef.current = updatedTemplate // Sync ref immediately to avoid race condition during save
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
                      <p className="text-[9px] text-gray-500">Use this ID in CSS: #{selectedSection.section_id}</p>

                      {/* Section Styling button - hidden for navbar and footer sections (use custom CSS instead) */}
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
                      <div className="text-[10px] text-gray-500 mb-1">Section Type:</div>
                      <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                        {selectedSection.type}
                      </div>
                    </div>

                    {showSectionCSS ? (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Section-Specific CSS
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
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
                          className="w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition mt-3"
                        >
                          Back to Properties
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Grid Section Fields */}
                        {selectedSection.type.startsWith('grid-') && (() => {
                          const [_, gridConfig] = selectedSection.type.split('-')
                          const [cols, rows] = gridConfig.split('x').map(Number)
                          const totalColumns = cols * rows
                          const columns = selectedSection.content?.columns || []

                          return (
                            <>
                              {/* Row Style Button */}
                              <div className="mb-3">
                                <button
                                  onClick={() => {
                                    setShowRowStyle(!showRowStyle)
                                    setExpandedColumnIndex(null)
                                  }}
                                  className="w-full px-3 py-2 bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] hover:from-[#d4e5d0] hover:to-[#c1d9bc] border border-[#98b290] rounded text-sm font-medium text-[#5a7a54] transition flex items-center justify-between"
                                >
                                  <span>Row Container Style</span>
                                  <svg
                                    className={`w-3 h-3 transition-transform text-[#5a7a54] ${showRowStyle ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>

                                {showRowStyle && (
                                  <div className="mt-2 p-3 border border-[#d4e5d0] rounded bg-white">
                                    <p className="text-[9px] text-gray-400 mb-2">
                                      Target: <code className="bg-gray-100 px-1 rounded">.row</code>
                                    </p>
                                    <StyleEditor
                                      value={selectedSection.content?.content_css?.row || ''}
                                      onChange={(css) => {
                                        const currentContentCSS = selectedSection.content?.content_css || {}
                                        handleUpdateSectionContent(selectedSection.id, {
                                          ...selectedSection.content,
                                          content_css: {
                                            ...currentContentCSS,
                                            row: css
                                          }
                                        })
                                      }}
                                      context="row"
                                      galleryImages={template?.images}
                                      siteCSS={template?.custom_css || ''}
                                      pageCSS={currentPage?.page_css || ''}
                                      sectionCSS={selectedSection.content?.section_css || ''}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Column Style Buttons */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs font-medium text-gray-700">Column Styles</label>
                                  <button
                                    onClick={() => {
                                      // Remove borders from all columns
                                      const currentContentCSS = selectedSection.content?.content_css || {}
                                      const currentColumns = currentContentCSS.columns || {}
                                      const updatedColumns: { [key: string]: string } = {}

                                      // For each column, remove border properties
                                      for (let i = 0; i < totalColumns; i++) {
                                        const existingCSS = currentColumns[i] || getDefaultColumnCSS()
                                        // Remove border-related properties
                                        const cleanedCSS = existingCSS
                                          .replace(/border[^;]*;?/gi, '')
                                          .replace(/^\s*\n/gm, '') // Remove empty lines
                                          .trim()
                                        updatedColumns[i] = cleanedCSS
                                      }

                                      handleUpdateSectionContent(selectedSection.id, {
                                        ...selectedSection.content,
                                        content_css: {
                                          ...currentContentCSS,
                                          columns: updatedColumns
                                        }
                                      })
                                    }}
                                    className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition"
                                    title="Remove borders from all columns"
                                  >
                                    Remove Borders
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {Array.from({ length: totalColumns }, (_, idx) => {
                                    const colWidth = columns[idx]?.colWidth || 12
                                    const isExpanded = expandedColumnIndex === idx

                                    return (
                                      <div key={idx}>
                                        <button
                                          onClick={() => {
                                            setExpandedColumnIndex(isExpanded ? null : idx)
                                            setShowRowStyle(false)
                                          }}
                                          className={`w-full px-3 py-2 border rounded text-sm font-medium transition flex items-center justify-between ${
                                            isExpanded
                                              ? 'bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] border-[#98b290] text-[#5a7a54]'
                                              : 'bg-gradient-to-r from-[#f0f7ee] to-[#e1eedd] hover:from-[#e8f0e6] hover:to-[#d4e5d0] border-[#98b290] text-[#5a7a54]'
                                          }`}
                                        >
                                          <span>Column {idx + 1} <span className="text-xs text-gray-500">(col-{colWidth})</span></span>
                                          <svg
                                            className={`w-3 h-3 transition-transform text-[#5a7a54] ${isExpanded ? 'rotate-90' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        </button>

                                        {isExpanded && (
                                          <div className="mt-2 p-3 border border-[#d4e5d0] rounded bg-white">
                                            <p className="text-[9px] text-gray-400 mb-2">
                                              Target: <code className="bg-gray-100 px-1 rounded">.col-{colWidth}</code> or position-based
                                            </p>
                                            <StyleEditor
                                              value={selectedSection.content?.content_css?.columns?.[idx] || ''}
                                              onChange={(css) => {
                                                const currentContentCSS = selectedSection.content?.content_css || {}
                                                const currentColumns = currentContentCSS.columns || {}
                                                handleUpdateSectionContent(selectedSection.id, {
                                                  ...selectedSection.content,
                                                  content_css: {
                                                    ...currentContentCSS,
                                                    columns: {
                                                      ...currentColumns,
                                                      [idx]: css
                                                    }
                                                  }
                                                })
                                              }}
                                              context="column"
                                              galleryImages={template?.images}
                                              siteCSS={template?.custom_css || ''}
                                              pageCSS={currentPage?.page_css || ''}
                                              sectionCSS={selectedSection.content?.section_css || ''}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </>
                          )
                        })()}
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
        )}
      </div>

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Page</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Name
                </label>
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
                  placeholder="e.g., About Us, Services, Contact"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Slug will be auto-generated: {newPageName ? newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'page-slug'}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddPageModal(false)
                    setNewPageName('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPage}
                  disabled={!newPageName.trim()}
                  className="flex-1 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Page Modal */}
      {showEditPageModal && currentPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Page Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Name
                </label>
                <input
                  type="text"
                  value={editPageName}
                  onChange={(e) => setEditPageName(e.target.value)}
                  placeholder="e.g., About Us, Services, Contact"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Slug
                </label>
                <input
                  type="text"
                  value={editPageSlug}
                  onChange={(e) => setEditPageSlug(e.target.value)}
                  placeholder="e.g., about-us, services, contact"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The URL path for this page (e.g., /about-us)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  value={editPageMetaDescription}
                  onChange={(e) => setEditPageMetaDescription(e.target.value)}
                  placeholder="Brief description for search engines (150-160 characters recommended)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editPageMetaDescription.length} characters
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowEditPageModal(false)
                    setEditPageName('')
                    setEditPageSlug('')
                    setEditPageMetaDescription('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditPage}
                  disabled={!editPageName.trim() || !editPageSlug.trim()}
                  className="flex-1 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
          {showColorPicker && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
              onClick={() => setShowColorPicker(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Choose Text Color</h3>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Color Presets */}
                <div className="grid grid-cols-8 gap-2 mb-3">
                  {[
                    '#000000', '#FFFFFF', '#F3F4F6', '#D1D5DB', '#6B7280', '#374151', '#1F2937', '#111827',
                    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
                    '#DC2626', '#D97706', '#059669', '#2563EB', '#7C3AED', '#DB2777', '#0D9488', '#EA580C',
                    '#991B1B', '#92400E', '#065F46', '#1E40AF', '#5B21B6', '#9F1239', '#115E59', '#9A3412'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setTempColor(color)}
                      className={`w-8 h-8 rounded border-2 transition ${
                        tempColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Hex Input */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hex Code</label>
                  <input
                    type="text"
                    value={tempColor}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setTempColor(value)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>

                {/* Preview */}
                <div className="mb-3 p-3 border border-gray-300 rounded">
                  <div
                    className="w-full h-12 rounded flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: tempColor, color: tempColor }}
                  >
                    <span style={{
                      color: parseInt(tempColor.replace('#', ''), 16) > 0xffffff/2 ? '#000' : '#fff'
                    }}>
                      Preview
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyColorFromPicker}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Link Modal */}
          {showLinkModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
              onClick={() => setShowLinkModal(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl p-4 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Insert/Edit Link</h3>
                  <button
                    onClick={() => setShowLinkModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Link Text */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Link Text</label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter link text"
                  />
                </div>

                {/* Link URL */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Link URL</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLinkModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  {linkUrl && (
                    <button
                      onClick={handleRemoveLink}
                      className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition"
                    >
                      Remove Link
                    </button>
                  )}
                  <button
                    onClick={handleApplyLink}
                    disabled={!linkUrl}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Insert Image Modal */}
          {showInsertImageModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
              onClick={() => setShowInsertImageModal(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl p-4 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Insert Image</h3>
                  <button
                    onClick={() => setShowInsertImageModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setImageInsertMode('url')}
                    className={`flex-1 px-4 py-2 rounded border transition ${
                      imageInsertMode === 'url'
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    URL
                  </button>
                  <button
                    onClick={() => setImageInsertMode('gallery')}
                    className={`flex-1 px-4 py-2 rounded border transition ${
                      imageInsertMode === 'gallery'
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Gallery
                  </button>
                </div>

                {/* URL Mode */}
                {imageInsertMode === 'url' && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    {imageUrl && (
                      <div className="mt-2 p-2 border border-gray-200 rounded">
                        <p className="text-xs text-gray-600 mb-1">Preview:</p>
                        <img src={imageUrl} alt="Preview" className="max-w-full h-auto max-h-48 rounded" onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EInvalid%3C/text%3E%3C/svg%3E'
                        }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Gallery Mode */}
                {imageInsertMode === 'gallery' && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Select an image from your gallery:</p>
                    {template?.images && template.images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {template.images.map((image) => (
                          <div
                            key={image.id}
                            onClick={() => setSelectedGalleryImage(`http://localhost:8000/${image.path}`)}
                            className={`cursor-pointer border-2 rounded p-1 transition ${
                              selectedGalleryImage === `http://localhost:8000/${image.path}`
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <img
                              src={`http://localhost:8000/${image.path}`}
                              alt={image.filename}
                              className="w-full h-24 object-cover rounded"
                            />
                            <p className="text-xs text-gray-600 mt-1 truncate">{image.filename}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No images in gallery. Upload images first.
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInsertImageModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInsertImage}
                    disabled={imageInsertMode === 'url' ? !imageUrl : !selectedGalleryImage}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Insert Image
                  </button>
                </div>
              </div>
            </div>
          )}

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
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Load Template</h2>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Loading templates...</div>
                </div>
              ) : availableTemplates.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">No templates available</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {availableTemplates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#98b290] hover:shadow-md transition cursor-pointer"
                      onClick={() => handleLoadTemplate(tmpl.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{tmpl.name}</h3>
                          {tmpl.description && (
                            <p className="text-sm text-gray-600 mt-1">{tmpl.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {tmpl.business_type}
                            </span>
                            {tmpl.is_active && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                Published
                              </span>
                            )}
                            {tmpl.pages && (
                              <span className="text-xs text-gray-500">
                                {tmpl.pages.length} {tmpl.pages.length === 1 ? 'page' : 'pages'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <svg className="w-6 h-6 text-[#98b290]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Code Modal */}
      {showSourceCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[85vh] max-w-6xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Page Source Code</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    HTML source code for: <span className="font-medium">{currentPage?.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditingHTML ? (
                    <>
                      <button
                        onClick={() => {
                          setEditableHTML(generatePageHTML())
                          setIsEditingHTML(true)
                        }}
                        className="px-4 py-2 bg-[#98b290] text-white rounded hover:bg-[#7a9274] text-sm font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const html = generatePageHTML()
                          navigator.clipboard.writeText(html)
                          alert('Source code copied to clipboard!')
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          const html = generatePageHTML()
                          const blob = new Blob([html], { type: 'text/html' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${currentPage?.slug || 'page'}.html`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium transition"
                      >
                        Download
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleApplyHTMLChanges}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition"
                      >
                        Apply Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingHTML(false)
                          setEditableHTML(generatePageHTML())
                        }}
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowSourceCodeModal(false)
                      setIsEditingHTML(false)
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Warning Banner - Only show when editing */}
            {isEditingHTML && (
              <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Warning: Editing source code directly</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Modifying the HTML structure (especially deleting sections or columns) may cause issues with the template builder canvas. It's recommended to only edit text content and attributes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
                {!isEditingHTML ? (
                  <div className="h-full overflow-auto">
                    <pre className="text-green-400 font-mono text-sm p-4 whitespace-pre-wrap break-words">
                      <code>{editableHTML || generatePageHTML()}</code>
                    </pre>
                  </div>
                ) : (
                  <textarea
                    value={editableHTML}
                    onChange={(e) => setEditableHTML(e.target.value)}
                    className="w-full h-full p-4 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                    spellCheck={false}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Generated from {currentPage?.sections?.length || 0} section{(currentPage?.sections?.length || 0) !== 1 ? 's' : ''} • {isEditingHTML ? 'Editing mode - Changes will update template' : 'Dynamic preview - Updates as you build'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stylesheet Modal */}
      {showStylesheetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[85vh] max-w-6xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Compiled Stylesheet</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete CSS for: <span className="font-medium">{currentPage?.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditingCSS ? (
                    <>
                      <button
                        onClick={() => {
                          setEditableCSS(generateStylesheet())
                          setIsEditingCSS(true)
                        }}
                        className="px-4 py-2 bg-[#98b290] text-white rounded hover:bg-[#7a9274] text-sm font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const css = generateStylesheet()
                          navigator.clipboard.writeText(css)
                          alert('Stylesheet copied to clipboard!')
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          const css = generateStylesheet()
                          const blob = new Blob([css], { type: 'text/css' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'style.css'
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium transition"
                      >
                        Download
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleApplyCSSChanges}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition"
                      >
                        Apply Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingCSS(false)
                          setEditableCSS(generateStylesheet())
                        }}
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowStylesheetModal(false)
                      setIsEditingCSS(false)
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Warning Banner - Only show when editing */}
            {isEditingCSS && (
              <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Warning: Editing stylesheet directly</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Invalid CSS syntax may cause display issues in the template builder. Ensure your CSS is valid before applying changes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
                {!isEditingCSS ? (
                  <div className="h-full overflow-auto">
                    <pre className="text-cyan-400 font-mono text-sm p-4 whitespace-pre-wrap break-words">
                      <code>{editableCSS || generateStylesheet()}</code>
                    </pre>
                  </div>
                ) : (
                  <textarea
                    value={editableCSS}
                    onChange={(e) => setEditableCSS(e.target.value)}
                    className="w-full h-full p-4 bg-gray-900 text-cyan-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                    spellCheck={false}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                {isEditingCSS ? 'Editing mode - Changes will update template styles' : 'Dynamic preview - Updates as you build'} • Cascade Order: Grid System → Site CSS → Page CSS → Section CSS → Row CSS → Column CSS → Responsive Breakpoints
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sitemap Modal */}
      {showSitemapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Site Map</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage your site's page structure</p>
                </div>
                <button
                  onClick={() => setShowSitemapModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {template?.pages.map((page, index) => (
                  <div
                    key={page.id}
                    className={`group flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                      page.id === currentPage?.id
                        ? 'border-[#98b290] bg-[#f0f5ef]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {/* Tree Lines */}
                    <div className="flex-shrink-0 w-8 flex flex-col items-center">
                      {index === 0 && page.is_homepage ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>

                    {/* Page Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{page.name}</h3>
                        {page.is_homepage && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full">
                            HOME
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">/{page.slug}</p>
                      <p className="text-xs text-gray-400 mt-1">{page.sections?.length || 0} sections</p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          if (page.id !== currentPage?.id) {
                            setCurrentPage(page)
                          }
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title="View Page"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setEditPageId(page.id)
                          setEditPageName(page.name)
                          setEditPageSlug(page.slug)
                          setEditPageIsHomepage(page.is_homepage)
                          setEditPageMetaDescription(page.meta_description || '')
                          setShowEditPageModal(true)
                          setShowSitemapModal(false)
                        }}
                        className="p-1.5 hover:bg-blue-50 rounded transition"
                        title="Edit Page"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${page.name}"?`)) {
                            handleDeletePage(page.id)
                            if (page.id === currentPage?.id) {
                              setCurrentPage(template.pages[0])
                            }
                          }
                        }}
                        disabled={template.pages.length === 1}
                        className="p-1.5 hover:bg-red-50 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title={template.pages.length === 1 ? "Cannot delete the last page" : "Delete Page"}
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Page Button */}
              <button
                onClick={() => {
                  setShowAddPageModal(true)
                  setShowSitemapModal(false)
                }}
                className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#98b290] hover:bg-[#f0f5ef] transition flex items-center justify-center gap-2 text-gray-600 hover:text-[#98b290]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add New Page</span>
              </button>
            </div>
          </div>
        </div>
      )}
  </DndContext>
  )
}

