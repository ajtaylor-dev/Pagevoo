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
import { Header } from '../components/layout/Header'
import { LeftSidebar } from '../components/LeftSidebar'
import { RightSidebar } from '../components/RightSidebar'
import { DraggableSectionItem } from '../components/dnd/DraggableSectionItem'
import { SortableSectionItem } from '../components/dnd/SortableSectionItem'
import { BottomDropZone } from '../components/dnd/BottomDropZone'
import { Toolbar } from '../components/Toolbar'
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

  // Grid section column update handler
  const handleGridColumnUpdate = (sectionId: number, columnIndex: number, newContent: string) => {
    if (!template || !currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        const updatedColumns = [...(s.content.columns || [])]
        updatedColumns[columnIndex] = { ...updatedColumns[columnIndex], content: newContent }
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

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    setTemplate({ ...template, pages: updatedPages })
    setCurrentPage({ ...currentPage, sections: updatedSections })
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
                  <SortableSectionItem key={section.id} section={section} index={index} activeId={activeId} overId={overId}>
                    {renderSection(section, index)}
                  </SortableSectionItem>
                ))
              }
            </SortableContext>
            <BottomDropZone currentPage={currentPage} activeId={activeId} activeDragData={activeDragData} />
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
      return sectionWrapper(
        <GridSection
          section={section}
          selectedSection={selectedSection}
          editingText={editingText}
          onOpenTextEditor={handleOpenTextEditor}
          onUpdateColumn={handleGridColumnUpdate}
        />
      )
    }

    switch (section.type) {
      // Navigation and Header sections
      case 'navbar':
        return sectionWrapper(
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
      case 'footer-columns':
        return sectionWrapper(
          <FooterSection
            section={section}
            selectedSection={selectedSection}
            editingText={editingText}
            onOpenTextEditor={handleOpenTextEditor}
          />
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

