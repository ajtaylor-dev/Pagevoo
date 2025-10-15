import React, { useState, useRef, useEffect, memo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/services/api'
import { StyleEditor } from '@/components/StyleEditor'
import { ImageGallery } from '@/components/ImageGallery'
import { NavigationStylingPanel } from '@/components/NavigationStylingPanel'
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
const generateRandomString = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Helper function to sanitize name for identifier
const sanitizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
}

// Helper function to generate unique identifier
const generateIdentifier = (name: string): string => {
  const sanitized = sanitizeName(name)
  const random = generateRandomString(6)
  return `${sanitized}_${random}`
}

// Helper functions for navigation styling
const generateContainerStyle = (containerStyle: any): React.CSSProperties => {
  if (!containerStyle) return {}

  return {
    background: containerStyle.background,
    backgroundImage: containerStyle.backgroundImage,
    paddingTop: containerStyle.paddingTop,
    paddingRight: containerStyle.paddingRight,
    paddingBottom: containerStyle.paddingBottom,
    paddingLeft: containerStyle.paddingLeft,
    marginTop: containerStyle.marginTop,
    marginRight: containerStyle.marginRight,
    marginBottom: containerStyle.marginBottom,
    marginLeft: containerStyle.marginLeft,
    borderWidth: containerStyle.borderWidth,
    borderStyle: containerStyle.borderStyle,
    borderColor: containerStyle.borderColor,
    borderRadius: containerStyle.borderRadius,
    boxShadow: containerStyle.shadow,
    opacity: containerStyle.opacity
  }
}

const generateLinkStyle = (linkStyling: any, isHover: boolean = false): React.CSSProperties => {
  if (!linkStyling) return {}

  return {
    color: isHover ? linkStyling.textColorHover : linkStyling.textColor,
    backgroundColor: isHover ? linkStyling.bgColorHover : linkStyling.bgColor,
    fontSize: linkStyling.fontSize,
    fontWeight: linkStyling.fontWeight,
    letterSpacing: linkStyling.letterSpacing,
    padding: linkStyling.padding,
    margin: linkStyling.margin,
    border: linkStyling.border,
    borderRadius: linkStyling.borderRadius,
    transition: linkStyling.transition
  }
}

const generateActiveIndicatorStyle = (activeIndicator: any): React.CSSProperties => {
  if (!activeIndicator) return {}

  const { type, color, thickness, customCSS } = activeIndicator

  if (type === 'custom' && customCSS) {
    // Parse custom CSS string into object (simplified)
    return {}
  }

  switch (type) {
    case 'underline':
      return {
        borderBottom: `${thickness || '2px'} solid ${color || '#f59e0b'}`,
        paddingBottom: '4px'
      }
    case 'background':
      return {
        backgroundColor: color || 'rgba(251, 191, 36, 0.2)',
        borderRadius: '4px'
      }
    case 'border':
      return {
        border: `2px solid ${color || '#f59e0b'}`,
        borderRadius: '4px'
      }
    default:
      return {}
  }
}

const isActivePage = (link: any, currentPageId: number): boolean => {
  if (typeof link !== 'object') return false
  return link.linkType === 'page' && link.pageId === currentPageId
}

// Helper function to generate CSS from section content_css and section_css
const generateContentCSS = (sections: TemplateSection[], pageCSS?: string, siteCSS?: string): string => {
  let css = ''

  // Helper to scope CSS to canvas and transform body selector
  const scopeToCanvas = (inputCSS: string): string => {
    if (!inputCSS || inputCSS.trim() === '') return ''

    console.log('[generateContentCSS] Input CSS:', inputCSS)

    // Extract body selector styles
    const bodyMatch = inputCSS.match(/body\s*\{([^}]+)\}/i)
    let processedCSS = inputCSS
    let bodyStyles = ''

    if (bodyMatch) {
      bodyStyles = bodyMatch[1]
      // Remove body block from original CSS
      processedCSS = inputCSS.replace(/body\s*\{[^}]+\}/gi, '')
    }

    // Scope any remaining standalone CSS properties to canvas
    const lines = processedCSS.split('\n')
    let result = ''
    let inBlock = false
    let standaloneProps = ''

    for (let line of lines) {
      const trimmed = line.trim()
      if (trimmed.includes('{')) {
        inBlock = true
        result += line + '\n'
      } else if (trimmed.includes('}')) {
        inBlock = false
        result += line + '\n'
      } else if (!inBlock && trimmed.includes(':') && trimmed.includes(';')) {
        standaloneProps += '  ' + trimmed + '\n'
      } else {
        result += line + '\n'
      }
    }

    // Separate typography styles from layout/box model styles
    const allStyles = (bodyStyles + standaloneProps).trim()

    if (allStyles) {
      // Typography properties that should apply to all text elements
      const typographyProps = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'color']

      // Layout/box model properties that should only apply to the canvas container
      const layoutProps = ['background-color', 'background', 'padding', 'margin', 'border', 'border-radius', 'background-image', 'position', 'display', 'width', 'height']

      const styleLines = allStyles.split('\n').filter(l => l.trim())
      let typographyCSS = ''
      let layoutCSS = ''

      styleLines.forEach(line => {
        const trimmed = line.trim()
        const prop = trimmed.split(':')[0].trim()

        if (typographyProps.some(p => prop.startsWith(p))) {
          typographyCSS += '  ' + trimmed + '\n'
        } else if (layoutProps.some(p => prop.startsWith(p))) {
          layoutCSS += '  ' + trimmed + '\n'
        } else {
          // Unknown properties go to layout by default
          layoutCSS += '  ' + trimmed + '\n'
        }
      })

      // Apply typography to all text elements and canvas itself
      if (typographyCSS.trim()) {
        result = `#template-canvas,\n#template-canvas * {\n${typographyCSS}}\n\n` + result
      }

      // Apply layout/box properties only to canvas container
      if (layoutCSS.trim()) {
        result = `#template-canvas {\n${layoutCSS}}\n\n` + result
      }
    }

    console.log('[generateContentCSS] Scoped CSS:', result)
    return result
  }

  // 1. Site CSS - Applied globally within canvas (lowest specificity)
  if (siteCSS) {
    css += `/* Site-wide styles */\n${scopeToCanvas(siteCSS)}\n\n`
  }

  // 2. Page CSS - Applied to all elements on the page (higher specificity than site)
  if (pageCSS) {
    css += `/* Page-specific styles */\n${scopeToCanvas(pageCSS)}\n\n`
  }

  // 3. Section, Row, and Column CSS - Applied with specific selectors (highest specificity)
  sections.forEach(section => {
    const sectionId = section.section_id || `section-${section.id}`

    // Section CSS (applied to section wrapper) - scoped to canvas
    if (section.content?.section_css) {
      css += `/* Section ${sectionId} styles */\n#template-canvas #${sectionId} {\n${section.content.section_css}\n}\n\n`
    }

    // Content CSS (row and columns)
    const contentCSS = section.content?.content_css
    if (!contentCSS) return

    // Row CSS - scoped to canvas and specific section
    if (contentCSS.row) {
      css += `/* Section ${sectionId} row styles */\n#template-canvas #${sectionId} .row {\n${contentCSS.row}\n}\n\n`
    }

    // Column CSS - scoped to canvas with specific selectors for maximum specificity
    if (contentCSS.columns) {
      const columns = section.content?.columns || []
      Object.entries(contentCSS.columns).forEach(([colIdx, colCSS]) => {
        if (colCSS) {
          const colWidth = columns[parseInt(colIdx)]?.colWidth || 12

          // Separate typography from layout properties for better targeting
          const lines = colCSS.split('\n').filter(l => l.trim())
          let typographyCSS = ''
          let layoutCSS = ''

          const typographyProps = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'color', 'text-align', 'text-decoration']

          lines.forEach(line => {
            const trimmed = line.trim()
            const prop = trimmed.split(':')[0].trim()
            if (typographyProps.some(p => prop.startsWith(p))) {
              typographyCSS += trimmed + '\n'
            } else {
              layoutCSS += trimmed + '\n'
            }
          })

          // Apply layout properties to the column container
          if (layoutCSS.trim()) {
            css += `/* Section ${sectionId} column ${parseInt(colIdx) + 1} layout styles */\n#template-canvas #${sectionId} .row > [class*="col-"]:nth-of-type(${parseInt(colIdx) + 1}) {\n${layoutCSS}}\n\n`
          }

          // Apply typography properties to text elements inside the column
          if (typographyCSS.trim()) {
            css += `/* Section ${sectionId} column ${parseInt(colIdx) + 1} typography styles */\n#template-canvas #${sectionId} .row > [class*="col-"]:nth-of-type(${parseInt(colIdx) + 1}),\n#template-canvas #${sectionId} .row > [class*="col-"]:nth-of-type(${parseInt(colIdx) + 1}) * {\n${typographyCSS}}\n\n`
          }
        }
      })
    }
  })

  return css
}

export default function TemplateBuilder() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('id')

  const [template, setTemplate] = useState<Template | null>(null)
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
  const [showSourceCodeModal, setShowSourceCodeModal] = useState(false)
  const [showStylesheetModal, setShowStylesheetModal] = useState(false)
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

      if (fileMenuRef.current && !fileMenuRef.current.contains(target)) {
        setShowFileMenu(false)
      }
      if (editMenuRef.current && !editMenuRef.current.contains(target)) {
        setShowEditMenu(false)
      }
      if (insertMenuRef.current && !insertMenuRef.current.contains(target)) {
        setShowInsertMenu(false)
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(target)) {
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
  }, [currentPage, currentPage?.sections, showSourceCodeModal])

  // Dynamically update CSS when template/page changes
  useEffect(() => {
    if (currentPage && template && showStylesheetModal) {
      const generatedCSS = generateStylesheet()
      setEditableCSS(generatedCSS)
    }
  }, [currentPage, currentPage?.sections, template?.custom_css, currentPage?.page_css, showStylesheetModal])


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

    setTemplate({ ...template, pages: updatedPages })
    setCurrentPage({
      ...currentPage,
      name: editPageName,
      slug: editPageSlug,
      meta_description: editPageMetaDescription
    })
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
        { id: Date.now(), type: 'header-simple', section_name: 'Header', section_id: generateIdentifier('Header'), content: { title: 'About Us' }, order: 0 },
        { id: Date.now() + 1, type: 'grid-2x1', section_name: 'Content Grid', section_id: generateIdentifier('Content Grid'), content: { columns: [] }, order: 1 },
        { id: Date.now() + 2, type: 'footer-simple', section_name: 'Footer', section_id: generateIdentifier('Footer'), content: {}, order: 2 }
      ]
    } else if (templateType === 'services') {
      pageName = 'Services'
      sections = [
        { id: Date.now(), type: 'header-simple', section_name: 'Header', section_id: generateIdentifier('Header'), content: { title: 'Our Services' }, order: 0 },
        { id: Date.now() + 1, type: 'grid-3x1', section_name: 'Services Grid', section_id: generateIdentifier('Services Grid'), content: { columns: [] }, order: 1 },
        { id: Date.now() + 2, type: 'footer-simple', section_name: 'Footer', section_id: generateIdentifier('Footer'), content: {}, order: 2 }
      ]
    } else if (templateType === 'contact') {
      pageName = 'Contact'
      sections = [
        { id: Date.now(), type: 'header-simple', section_name: 'Header', section_id: generateIdentifier('Header'), content: { title: 'Contact Us' }, order: 0 },
        { id: Date.now() + 1, type: 'contact-form', section_name: 'Contact Form', section_id: generateIdentifier('Contact Form'), content: {}, order: 1 },
        { id: Date.now() + 2, type: 'footer-simple', section_name: 'Footer', section_id: generateIdentifier('Footer'), content: {}, order: 2 }
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
        columns: [{ content: 'Column content', colWidth: 12 }],
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
          { content: 'Column 1', colWidth: 6 },
          { content: 'Column 2', colWidth: 6 }
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
          { content: 'Column 1', colWidth: 4 },
          { content: 'Column 2', colWidth: 4 },
          { content: 'Column 3', colWidth: 4 }
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
          { content: 'Col 1', colWidth: 3 },
          { content: 'Col 2', colWidth: 3 },
          { content: 'Col 3', colWidth: 3 },
          { content: 'Col 4', colWidth: 3 }
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
          { content: 'Box 1', colWidth: 6 },
          { content: 'Box 2', colWidth: 6 },
          { content: 'Box 3', colWidth: 6 },
          { content: 'Box 4', colWidth: 6 }
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
        columns: Array(6).fill(null).map((_, i) => ({ content: `Box ${i + 1}`, colWidth: 4 })),
        content_css: createDefaultContentCSS(6),
        section_css: getDefaultSectionCSS()
      }
    },
  ]

  const headerNavigationSections = [
    // Top-locked navigation bars
    { type: 'navbar-basic', label: 'Basic Navbar', description: 'Simple horizontal navigation bar with links', position: 'top', defaultContent: { logo: 'Logo', links: ['Home', 'About', 'Services', 'Contact'] } },
    { type: 'navbar-dropdown', label: 'Dropdown Nav', description: 'Navigation bar with dropdown menus', position: 'top', defaultContent: { logo: 'Logo', links: ['Home', 'Services', 'About', 'Contact'] } },
    { type: 'navbar-sticky', label: 'Sticky Navbar', description: 'Navigation that sticks to top on scroll', position: 'top', defaultContent: { logo: 'Logo', links: ['Home', 'About', 'Contact'] } },
    { type: 'header-simple', label: 'Simple Header', description: 'Clean header with logo and tagline', position: 'top', defaultContent: { logo: 'Company Name', tagline: 'Your tagline here' } },
    { type: 'header-centered', label: 'Centered Header', description: 'Centered logo with navigation below', position: 'top', defaultContent: { logo: 'Brand', navigation: true } },
    { type: 'header-split', label: 'Split Header', description: 'Logo left, navigation right layout', position: 'top', defaultContent: { logo: 'Logo', links: ['Home', 'About', 'Contact'] } },
    // Sidebar navigation (can move left/right)
    { type: 'sidebar-nav-left', label: 'Sidebar Nav (Left)', description: 'Left-side vertical navigation menu', position: 'left', defaultContent: { links: ['Dashboard', 'Profile', 'Settings', 'Logout'], positioned: 'permanently-fixed', fullHeight: true } },
    { type: 'sidebar-nav-right', label: 'Sidebar Nav (Right)', description: 'Right-side vertical navigation menu', position: 'right', defaultContent: { links: ['Dashboard', 'Profile', 'Settings', 'Logout'], positioned: 'permanently-fixed', fullHeight: true } },
  ]

  const footerSections = [
    { type: 'footer-simple', label: 'Simple Footer', description: 'Basic footer with copyright text', position: 'bottom', defaultContent: { text: '© 2025 Company Name. All rights reserved.' } },
    { type: 'footer-columns', label: 'Column Footer', description: 'Multi-column footer with links', position: 'bottom', defaultContent: { columns: [{ title: 'Company', links: ['About', 'Contact'] }, { title: 'Services', links: ['Service 1', 'Service 2'] }] } },
    { type: 'footer-social', label: 'Social Footer', description: 'Footer with social media icons', position: 'bottom', defaultContent: { text: '© 2025 Company', socials: ['Facebook', 'Twitter', 'Instagram'] } },
  ]

  const specialSections = [
    { type: 'hero', label: 'Hero Banner', description: 'Large banner with heading and call-to-action', defaultContent: { title: 'Welcome', subtitle: 'Your subtitle here', cta_text: 'Get Started' } },
    { type: 'gallery', label: 'Image Gallery', description: 'Grid of images with lightbox', defaultContent: { heading: 'Gallery', images: [] } },
    { type: 'contact-form', label: 'Contact Form', description: 'Form with name, email, and message fields', defaultContent: { heading: 'Contact Us', fields: ['name', 'email', 'message'] } },
    { type: 'booking-form', label: 'Booking Form', description: 'Appointment booking form with date/time', defaultContent: { heading: 'Book Now', fields: ['name', 'date', 'time'] } },
    { type: 'login-box', label: 'Login Box', description: 'User authentication login form', defaultContent: { heading: 'Sign In' } },
    { type: 'testimonials', label: 'Testimonials', description: 'Customer reviews and feedback display', defaultContent: { heading: 'What Our Customers Say', testimonials: [] } },
  ]

  const predefinedPages = [
    { name: 'About Us', description: 'Standard about page with company info', sections: [{ type: 'hero', content: { title: 'About Us', subtitle: 'Learn more about our company' } }, { type: 'grid-2x1', content: { columns: [{ content: 'Our Story' }, { content: 'Our Mission' }] } }] },
    { name: 'Contact', description: 'Contact page with form and info', sections: [{ type: 'hero', content: { title: 'Contact Us', subtitle: 'Get in touch' } }, { type: 'contact-form', content: { heading: 'Send us a message' } }] },
    { name: 'Services', description: 'Services overview page', sections: [{ type: 'hero', content: { title: 'Our Services', subtitle: 'What we offer' } }, { type: 'grid-3x1', content: { columns: [{ content: 'Service 1' }, { content: 'Service 2' }, { content: 'Service 3' }] } }] },
  ]

  const renderSectionThumbnail = (section: any) => {
    if (section.cols) {
      // Core grid section - render visual thumbnail
      const gridItems = Array(section.cols * section.rows).fill(null)
      return (
        <div className="w-full aspect-video bg-white rounded border border-gray-300 p-1 flex items-center justify-center">
          <div
            className="grid gap-0.5 w-full h-full"
            style={{ gridTemplateColumns: `repeat(${section.cols}, 1fr)` }}
          >
            {gridItems.map((_, idx) => (
              <div key={idx} className="bg-amber-100 rounded-sm border border-amber-200"></div>
            ))}
          </div>
        </div>
      )
    } else {
      // Special section - show icon placeholder
      return (
        <div className="w-full aspect-video bg-gradient-to-br from-amber-50 to-amber-100 rounded border border-amber-200 flex items-center justify-center">
          <div className="text-2xl font-bold text-amber-600">
            {section.label.charAt(0)}
          </div>
        </div>
      )
    }
  }

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

    // Check if this is a top-positioned section (navbar/header/sidebar)
    const isTopSection = sectionConfig.type.startsWith('navbar-') ||
                        sectionConfig.type.startsWith('header-') ||
                        sectionConfig.type.startsWith('sidebar-nav-')

    // Check if this is a footer section
    const isFooterSection = sectionConfig.type.startsWith('footer-')

    const sectionName = sectionConfig.name || sectionConfig.type
    const newSection: TemplateSection = {
      id: Date.now(),
      type: sectionConfig.type,
      section_name: sectionName,
      section_id: generateIdentifier(sectionName),
      content: sectionConfig.defaultContent,
      order: isTopSection ? 0 : currentPage.sections.length
    }

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        if (isTopSection) {
          // Find the position after existing navbars/headers/sidebars
          let insertPosition = 0
          for (let i = 0; i < p.sections.length; i++) {
            const section = p.sections[i]
            if (section.type.startsWith('navbar-') ||
                section.type.startsWith('header-') ||
                section.type.startsWith('sidebar-nav-')) {
              insertPosition = i + 1
            } else {
              break
            }
          }

          // Insert at the calculated position
          const newSections = [
            ...p.sections.slice(0, insertPosition),
            newSection,
            ...p.sections.slice(insertPosition)
          ]

          // Reorder all sections
          newSections.forEach((section, idx) => {
            section.order = idx
          })

          return {
            ...p,
            sections: newSections
          }
        } else if (isFooterSection) {
          // Find the position before existing footers (to insert at end but before other footers)
          let insertPosition = p.sections.length
          for (let i = p.sections.length - 1; i >= 0; i--) {
            const section = p.sections[i]
            if (section.type.startsWith('footer-')) {
              insertPosition = i
            } else {
              break
            }
          }

          // Insert at the calculated position
          const newSections = [
            ...p.sections.slice(0, insertPosition),
            newSection,
            ...p.sections.slice(insertPosition)
          ]

          // Reorder all sections
          newSections.forEach((section, idx) => {
            section.order = idx
          })

          return {
            ...p,
            sections: newSections
          }
        } else {
          // Insert before footers for regular sections
          let insertPosition = p.sections.length
          for (let i = 0; i < p.sections.length; i++) {
            const section = p.sections[i]
            if (section.type.startsWith('footer-')) {
              insertPosition = i
              break
            }
          }

          const newSections = [
            ...p.sections.slice(0, insertPosition),
            newSection,
            ...p.sections.slice(insertPosition)
          ]

          newSections.forEach((section, idx) => {
            section.order = idx
          })

          return {
            ...p,
            sections: newSections
          }
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

    const currentSection = currentPage.sections[index]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const targetSection = currentPage.sections[swapIndex]

    // Check if current section is a navigation section
    const isCurrentNavSection = currentSection.type.startsWith('navbar-') ||
                                currentSection.type.startsWith('header-') ||
                                currentSection.type.startsWith('sidebar-nav-')

    // Check if target section is a navigation section
    const isTargetNavSection = targetSection.type.startsWith('navbar-') ||
                               targetSection.type.startsWith('header-') ||
                               targetSection.type.startsWith('sidebar-nav-')

    // Check if current section is a footer section
    const isCurrentFooterSection = currentSection.type.startsWith('footer-')

    // Check if target section is a footer section
    const isTargetFooterSection = targetSection.type.startsWith('footer-')

    // Prevent non-nav sections from moving above nav sections
    if (direction === 'up' && !isCurrentNavSection && isTargetNavSection) {
      alert('Regular sections cannot be moved above navigation sections')
      return
    }

    // Prevent nav sections from moving below non-nav sections
    if (direction === 'down' && isCurrentNavSection && !isTargetNavSection && !isTargetFooterSection) {
      alert('Navigation sections cannot be moved below regular sections')
      return
    }

    // Prevent non-footer sections from moving below footer sections
    if (direction === 'down' && !isCurrentFooterSection && isTargetFooterSection) {
      alert('Regular sections cannot be moved below footer sections')
      return
    }

    // Prevent footer sections from moving above non-footer sections
    if (direction === 'up' && isCurrentFooterSection && !isTargetFooterSection) {
      alert('Footer sections cannot be moved above regular sections')
      return
    }

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

  const handleMoveSidebar = (sectionId: number, direction: 'left' | 'right') => {
    if (!template || !currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        // Toggle sidebar position
        const newType = direction === 'left' ? 'sidebar-nav-left' : 'sidebar-nav-right'
        return { ...s, type: newType }
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

    // Update selected section if this was the selected one
    if (selectedSection?.id === sectionId) {
      const updatedSection = updatedSections.find(s => s.id === sectionId)
      if (updatedSection) {
        setSelectedSection(updatedSection)
      }
    }
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

      // Check if this is a top-positioned section (navbar/header/sidebar)
      const isTopSection = sectionConfig.type.startsWith('navbar-') ||
                          sectionConfig.type.startsWith('header-') ||
                          sectionConfig.type.startsWith('sidebar-nav-')

      // Check if this is a footer section
      const isFooterSection = sectionConfig.type.startsWith('footer-')

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

      // Headers and nav ALWAYS insert at top, regardless of drop position
      if (isTopSection) {
        // Find the position after existing navbars/headers/sidebars
        insertPosition = 0
        for (let i = 0; i < currentPage.sections.length; i++) {
          const section = currentPage.sections[i]
          if (section.type.startsWith('navbar-') ||
              section.type.startsWith('header-') ||
              section.type.startsWith('sidebar-nav-')) {
            insertPosition = i + 1
          } else {
            break
          }
        }
      } else if (isFooterSection) {
        // Find the position before existing footers
        insertPosition = currentPage.sections.length
        for (let i = currentPage.sections.length - 1; i >= 0; i--) {
          const section = currentPage.sections[i]
          if (section.type.startsWith('footer-')) {
            insertPosition = i
          } else {
            break
          }
        }
      } else {
        // Regular sections: respect drop position
        if (over && over.data.current?.source === 'canvas') {
          const overIndex = over.data.current.index
          insertPosition = overIndex
        } else if (over && over.data.current?.type === 'bottom') {
          // Dropping on bottom drop zone - insert at end
          insertPosition = currentPage.sections.length
        }
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

      setTemplate({ ...template, pages: updatedPages })
      setCurrentPage({ ...currentPage, sections: newSections })
      setSelectedSection(newSection)
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

      const section = activeData.section
      const targetSection = overData.section

      // Check movement restrictions
      const isNavSection = section.type.startsWith('navbar-') ||
                          section.type.startsWith('header-') ||
                          section.type.startsWith('sidebar-nav-')
      const isTargetNavSection = targetSection.type.startsWith('navbar-') ||
                                 targetSection.type.startsWith('header-') ||
                                 targetSection.type.startsWith('sidebar-nav-')
      const isFooterSection = section.type.startsWith('footer-')
      const isTargetFooterSection = targetSection.type.startsWith('footer-')

      // Prevent non-nav sections from moving into nav area
      if (!isNavSection && isTargetNavSection) {
        alert('Regular sections cannot be moved into the navigation area')
        return
      }

      // Prevent nav sections from moving into content area
      if (isNavSection && !isTargetNavSection && !isTargetFooterSection) {
        alert('Navigation sections cannot be moved into the content area')
        return
      }

      // Prevent non-footer sections from moving into footer area
      if (!isFooterSection && isTargetFooterSection) {
        alert('Regular sections cannot be moved into the footer area')
        return
      }

      // Prevent footer sections from moving into content area
      if (isFooterSection && !isTargetFooterSection) {
        alert('Footer sections cannot be moved into the content area')
        return
      }

      // Perform the reorder
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

      setTemplate({ ...template, pages: updatedPages })
      setCurrentPage({ ...currentPage, sections: newSections })
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
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg z-50">
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
          <div className="bg-amber-500 text-white p-1.5 rounded shadow-lg">
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
        className={`min-h-[60px] transition-all ${activeId && activeDragData?.source === 'library' ? 'border-2 border-dashed border-amber-300' : ''} ${isOver ? 'bg-amber-50' : ''}`}
      >
        {isOver && activeId && (
          <div className="relative h-2">
            <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse"></div>
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg z-50">
              ↓ Insert here
            </div>
          </div>
        )}
      </div>
    )
  }

  // Helper to extract font families from CSS and generate Google Fonts link
  const extractFontsFromCSS = (css: string): string[] => {
    const fonts: Set<string> = new Set()
    const fontFamilyRegex = /font-family:\s*['"]?([^'";\n]+)['"]?/gi
    let match

    while ((match = fontFamilyRegex.exec(css)) !== null) {
      const fontName = match[1].split(',')[0].trim().replace(/['"]/g, '')
      // Only include Google Fonts (not system fonts)
      const googleFonts = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Ubuntu']
      if (googleFonts.includes(fontName)) {
        fonts.add(fontName)
      }
    }

    return Array.from(fonts)
  }

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
        className={`text-gray-900 min-h-[200px] ${viewportClass} ${activeId && activeDragData?.source === 'library' ? 'ring-2 ring-amber-400 ring-offset-4 rounded-lg' : ''} ${isOver ? 'bg-amber-50' : ''}`}
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
          <div className={`text-center py-20 p-8 ${activeId && activeDragData?.source === 'library' ? 'bg-amber-50' : ''}`}>
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
  const addToHistory = (newTemplate: Template) => {
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

    setHasUnsavedChanges(true)
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
    if (!template) {
      alert('No template to save')
      return
    }

    // If template.id === 0 (new template), prompt for name like Word
    if (template.id === 0) {
      const templateName = prompt('Enter a template name:', template.name || 'Untitled Template')
      if (!templateName || templateName.trim() === '') {
        return // User cancelled or entered empty name
      }

      // Update template name
      setTemplate({ ...template, name: templateName.trim() })

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
      const templateToSave = { ...template, is_active: isPublished }
      const response = await api.updateTemplate(template.id, templateToSave)

      if (response.success) {
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
    if (!template) return

    try {
      // Prepare template data for creation
      const templateData = {
        name: templateName,
        description: template.description || '',
        business_type: template.business_type || 'other',
        preview_image: template.preview_image || '',
        is_active: false, // Always save as unpublished (draft) - only "Export As > HTML Template" publishes
        exclusive_to: template.exclusive_to || null,
        technologies: template.technologies || [],
        features: template.features || [],
        custom_css: template.custom_css || '',
        pages: template.pages.map(page => ({
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
        // Update template with returned ID and name
        const newTemplate = { ...template, id: response.data.id, name: templateName, is_active: false }
        setTemplate(newTemplate)

        // Set published state to false (it's a draft)
        setIsPublished(false)

        // Update history with new template
        setHistory([JSON.parse(JSON.stringify(newTemplate))])
        setHistoryIndex(0)
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
    if (!template) {
      alert('No template to save')
      return
    }

    const newName = prompt('Save template as:', template.name ? template.name + ' (Copy)' : 'Untitled Template')
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
      if (section.type.startsWith('navbar-')) {
        const links = content.links || ['Home', 'About', 'Services', 'Contact']
        const linksHTML = links.map((link: string) => `      <a href="#">${link}</a>`).join('\n')
        return `  <nav id="${id}" class="${section.type}">
    <div class="logo">${content.logo || 'Logo'}</div>
    <div class="nav-links">
${linksHTML}
    </div>
  </nav>`
      }

      // Header sections
      if (section.type.startsWith('header-')) {
        return `  <header id="${id}" class="${section.type}">
    <div class="logo">${content.logo || 'Company Name'}</div>
    ${content.tagline ? `<p class="tagline">${content.tagline}</p>` : ''}
  </header>`
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
            const linksHTML = (col.links || []).map((link: string) => `        <li><a href="#">${link}</a></li>`).join('\n')
            return `      <div class="footer-column">
        <h3>${col.title}</h3>
        <ul>
${linksHTML}
        </ul>
      </div>`
          }).join('\n')
          return `  <footer id="${id}" class="footer-columns">
${columnsHTML}
  </footer>`
        } else if (section.type === 'footer-social') {
          const socials = content.socials || ['Facebook', 'Twitter', 'Instagram']
          const socialsHTML = socials.map((social: string) => `      <a href="#">${social}</a>`).join('\n')
          return `  <footer id="${id}" class="footer-social">
    <p>${content.text || '© 2025 Company'}</p>
    <div class="social-links">
${socialsHTML}
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

    // 1. Responsive Grid System (Base - Mobile First)
    css += `/* Responsive Grid System - Mobile First */\n\n`
    css += `[class*="col-"] {\n`
    css += `  float: left;\n`
    css += `  padding: 20px;\n`
    css += `  width: 100%;\n`
    css += `}\n\n`

    css += `.row::after {\n`
    css += `  content: "";\n`
    css += `  clear: both;\n`
    css += `  display: table;\n`
    css += `}\n\n`

    css += `*, *::after, *::before {\n`
    css += `  -webkit-box-sizing: border-box;\n`
    css += `  -moz-box-sizing: border-box;\n`
    css += `  box-sizing: border-box;\n`
    css += `}\n\n`

    // 2. Site CSS (Global styles)
    if (template.custom_css && template.custom_css.trim()) {
      css += `/* Site-Wide Styles */\n\n`
      css += template.custom_css + '\n\n'
    }

    // 3. Page CSS (Page-specific styles)
    if (currentPage.page_css && currentPage.page_css.trim()) {
      css += `/* Page-Specific Styles: ${currentPage.name} */\n\n`
      css += currentPage.page_css + '\n\n'
    }

    // 4. Section, Row, and Column CSS
    if (currentPage.sections && currentPage.sections.length > 0) {
      css += `/* Section, Row, and Column Styles */\n\n`

      currentPage.sections
        .sort((a, b) => a.order - b.order)
        .forEach(section => {
          const sectionId = section.section_id || `section-${section.id}`

          // Section CSS
          if (section.content?.section_css) {
            css += `/* Section: ${section.section_name || section.type} */\n`
            css += `#${sectionId} {\n`
            css += section.content.section_css
            if (!section.content.section_css.trim().endsWith(';')) css += ';'
            css += `\n}\n\n`
          }

          // Content CSS (row and columns)
          const contentCSS = section.content?.content_css
          if (contentCSS) {
            // Row CSS
            if (contentCSS.row) {
              css += `/* Section ${sectionId} - Row Styles */\n`
              css += `#${sectionId} .row {\n`
              css += contentCSS.row
              if (!contentCSS.row.trim().endsWith(';')) css += ';'
              css += `\n}\n\n`
            }

            // Column CSS
            if (contentCSS.columns) {
              const columns = section.content?.columns || []
              Object.entries(contentCSS.columns).forEach(([colIdx, colCSS]) => {
                if (colCSS) {
                  const colWidth = columns[parseInt(colIdx)]?.colWidth || 12
                  css += `/* Section ${sectionId} - Column ${parseInt(colIdx) + 1} */\n`
                  css += `#${sectionId} .col-${colWidth}:nth-of-type(${parseInt(colIdx) + 1}) {\n`
                  css += colCSS
                  if (!(colCSS as string).trim().endsWith(';')) css += ';'
                  css += `\n}\n\n`
                }
              })
            }
          }
        })
    }

    // 5. Responsive Breakpoints - Tablet Landscape
    css += `/* Tablet Landscape (768px - 1024px) */\n`
    css += `@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {\n`
    css += `  .col-1 {width: 8.33%;}\n`
    css += `  .col-2 {width: 16.66%;}\n`
    css += `  .col-3 {width: 25%;}\n`
    css += `  .col-4 {width: 33.33%;}\n`
    css += `  .col-5 {width: 41.66%;}\n`
    css += `  .col-6 {width: 50%;}\n`
    css += `  .col-7 {width: 58.33%;}\n`
    css += `  .col-8 {width: 66.66%;}\n`
    css += `  .col-9 {width: 75%;}\n`
    css += `  .col-10 {width: 83.33%;}\n`
    css += `  .col-11 {width: 91.66%;}\n`
    css += `  .col-12 {width: 100%;}\n`
    css += `}\n\n`

    // 6. Responsive Breakpoints - Desktop
    css += `/* Desktop and High-Res Devices (1025px+) */\n`
    css += `@media only screen and (min-width: 1025px) {\n`
    css += `  .col-1 {width: 8.33%;}\n`
    css += `  .col-2 {width: 16.66%;}\n`
    css += `  .col-3 {width: 25%;}\n`
    css += `  .col-4 {width: 33.33%;}\n`
    css += `  .col-5 {width: 41.66%;}\n`
    css += `  .col-6 {width: 50%;}\n`
    css += `  .col-7 {width: 58.33%;}\n`
    css += `  .col-8 {width: 66.66%;}\n`
    css += `  .col-9 {width: 75%;}\n`
    css += `  .col-10 {width: 83.33%;}\n`
    css += `  .col-11 {width: 91.66%;}\n`
    css += `  .col-12 {width: 100%;}\n`
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

      setTemplate({
        ...template,
        pages: updatedPages
      })
      setCurrentPage(updatedPage)
      setHasUnsavedChanges(true)
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

      setTemplate({
        ...template,
        pages: updatedPages
      })
      setCurrentPage(updatedPage)
      setHasUnsavedChanges(true)
      setIsEditingCSS(false)

      alert('CSS changes applied successfully! Remember to save your template.')
    } catch (error) {
      console.error('Error parsing CSS:', error)
      alert('Failed to parse CSS. Please check your syntax and try again.')
    }
  }

  // Clickable text component that opens the editor
  const EditableText = ({
    value,
    className,
    tag = 'div',
    sectionId,
    field
  }: {
    value: string
    onSave?: (e: React.FocusEvent<HTMLElement>) => void
    className?: string
    tag?: 'div' | 'h1' | 'h2' | 'p' | 'button'
    sectionId: number
    field: string
  }) => {
    const Component = tag as any
    const isEditing = editingText?.sectionId === sectionId && editingText?.field === field

    return (
      <Component
        className={`${className} ${isEditing ? 'ring-2 ring-blue-500' : ''} cursor-pointer hover:bg-blue-50 hover:bg-opacity-20 transition`}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          handleOpenTextEditor(sectionId, field, value)
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    )
  }

  const renderSection = (section: TemplateSection, index: number) => {
    const content = section.content || {}

    // Determine section behavior based on type
    const isTopLocked = section.type.startsWith('navbar-') || section.type.startsWith('header-')
    const isBottomLocked = section.type.startsWith('footer-')
    const isSidebar = section.type.startsWith('sidebar-nav-')
    const isLeftSidebar = section.type === 'sidebar-nav-left'
    const isRightSidebar = section.type === 'sidebar-nav-right'
    const isPositionLocked = isTopLocked || isBottomLocked
    const isHovered = hoveredSection === section.id

    // Track sidebar visibility for menu-click mode
    const [sidebarVisible, setSidebarVisible] = useState(content.positioned !== 'menu-click')

    const sectionWrapper = (children: React.ReactNode) => (
      <div
        key={section.id}
        className={`relative group ${isSidebar ? 'z-20' : ''}`}
        onMouseEnter={() => setHoveredSection(section.id)}
        onMouseLeave={() => setHoveredSection(null)}
        onClick={() => setSelectedSection(section)}
      >
        {/* Position Indicator Badge */}
        {(section.type === 'navbar-sticky' || isTopLocked || isBottomLocked) && (
          <div className="absolute top-1 left-1 z-30 flex gap-1">
            {section.type === 'navbar-sticky' && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-full border border-purple-300">
                STICKY
              </span>
            )}
            {isTopLocked && section.type !== 'navbar-sticky' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full border border-blue-300">
                FIXED TOP
              </span>
            )}
            {isBottomLocked && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full border border-green-300">
                FIXED BOTTOM
              </span>
            )}
          </div>
        )}

        {children}

        {/* Hover Overlay */}
        {isHovered && (
          <div className={`absolute top-2 ${isLeftSidebar ? 'left-2' : 'right-2'} bg-white shadow-lg rounded-lg border border-gray-200 p-2 flex items-center gap-1 z-50`}>
            <span className="text-xs font-medium text-gray-700 mr-2 capitalize">{section.section_name || section.type}</span>

            {/* Dropdown nav: show expanded toggle */}
            {section.type === 'navbar-dropdown' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpdateSectionContent(section.id, {
                    ...content,
                    expanded: !content.expanded
                  })
                }}
                className={`p-1 hover:bg-amber-50 rounded transition ${content.expanded ? 'bg-amber-100' : ''}`}
                title={content.expanded ? 'Collapse Dropdowns' : 'Expand Dropdowns'}
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {content.expanded ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}

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
                    className={`p-1 hover:bg-amber-50 rounded transition ${sidebarVisible ? 'bg-amber-100' : ''}`}
                    title={sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="p-1 hover:bg-amber-50 rounded disabled:opacity-30 transition"
                  title="Move to Left"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSidebar(section.id, 'right')
                  }}
                  disabled={isRightSidebar}
                  className="p-1 hover:bg-amber-50 rounded disabled:opacity-30 transition"
                  title="Move to Right"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Normal sections: show up/down controls */}
            {!isPositionLocked && !isSidebar && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSection(section.id, 'up')
                  }}
                  disabled={index === 0}
                  className="p-1 hover:bg-amber-50 rounded disabled:opacity-30 transition"
                  title="Move Up"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSection(section.id, 'down')
                  }}
                  disabled={index === (currentPage?.sections.length || 0) - 1}
                  className="p-1 hover:bg-amber-50 rounded disabled:opacity-30 transition"
                  title="Move Down"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            )}

            {/* Position-locked sections: show lock icon */}
            {isPositionLocked && (
              <div className="p-1 text-gray-400" title="Position locked">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteSection(section.id)
              }}
              className="p-1 hover:bg-red-50 rounded transition ml-1"
              title="Delete"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
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
          className={`cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
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
                  onSave={(e) => handleGridColumnEdit(idx, e)}
                  className="outline-none hover:bg-white/50 px-2 py-1 rounded transition"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    switch (section.type) {
      case 'hero':
        return sectionWrapper(
          <div className={`relative min-h-[400px] bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="text-center max-w-3xl">
              <EditableText
                tag="h1"
                sectionId={section.id}
                field="title"
                value={content.title || 'Welcome'}
                onSave={(e) => handleInlineTextEdit(section.id, 'title', e)}
                className="text-5xl font-bold mb-4 outline-none hover:bg-white/10 px-2 py-1 rounded transition"
              />
              <EditableText
                tag="p"
                sectionId={section.id}
                field="subtitle"
                value={content.subtitle || 'Your subtitle here'}
                onSave={(e) => handleInlineTextEdit(section.id, 'subtitle', e)}
                className="text-xl mb-6 outline-none hover:bg-white/10 px-2 py-1 rounded transition"
              />
              <EditableText
                tag="button"
                sectionId={section.id}
                field="cta_text"
                value={content.cta_text || 'Get Started'}
                onSave={(e) => handleInlineTextEdit(section.id, 'cta_text', e)}
                className="px-8 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition outline-none"
              />
            </div>
          </div>
        )

      case 'gallery':
        return sectionWrapper(
          <div className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <EditableText
              tag="h2"
              sectionId={section.id}
              field="heading"
              value={content.heading || 'Gallery'}
              onSave={(e) => handleInlineTextEdit(section.id, 'heading', e)}
              className="text-3xl font-bold mb-6 text-center outline-none hover:bg-white/50 px-2 py-1 rounded transition"
            />
            <div className="grid grid-cols-3 gap-4">
              {Array(6).fill(null).map((_, idx) => (
                <div key={idx} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Image {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'contact-form':
      case 'booking-form':
        return sectionWrapper(
          <div className={`p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <EditableText
              tag="h2"
              sectionId={section.id}
              field="heading"
              value={content.heading || section.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              onSave={(e) => handleInlineTextEdit(section.id, 'heading', e)}
              className="text-3xl font-bold mb-6 text-center outline-none hover:bg-gray-100 px-2 py-1 rounded transition"
            />
            <div className="max-w-md mx-auto space-y-4">
              {(content.fields || ['name', 'email', 'message']).map((field: string, idx: number) => (
                <div key={idx} className="border-2 border-gray-300 rounded p-3 bg-gray-50">
                  <span className="text-sm text-gray-600 capitalize">{field}</span>
                </div>
              ))}
              <button className="w-full px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold">
                Submit
              </button>
            </div>
          </div>
        )

      case 'login-box':
        return sectionWrapper(
          <div className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="max-w-sm mx-auto bg-white rounded-lg shadow-lg p-8">
              <EditableText
                tag="h2"
                sectionId={section.id}
                field="heading"
                value={content.heading || 'Sign In'}
                onSave={(e) => handleInlineTextEdit(section.id, 'heading', e)}
                className="text-2xl font-bold mb-6 text-center outline-none hover:bg-gray-100 px-2 py-1 rounded transition"
              />
              <div className="space-y-4">
                <div className="border-2 border-gray-300 rounded p-3">
                  <span className="text-sm text-gray-600">Email</span>
                </div>
                <div className="border-2 border-gray-300 rounded p-3">
                  <span className="text-sm text-gray-600">Password</span>
                </div>
                <button className="w-full px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold">
                  Login
                </button>
              </div>
            </div>
          </div>
        )

      case 'testimonials':
        return sectionWrapper(
          <div className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <EditableText
              tag="h2"
              sectionId={section.id}
              field="heading"
              value={content.heading || 'What Our Customers Say'}
              onSave={(e) => handleInlineTextEdit(section.id, 'heading', e)}
              className="text-3xl font-bold mb-8 text-center outline-none hover:bg-white/50 px-2 py-1 rounded transition"
            />
            <div className="grid md:grid-cols-2 gap-6">
              {Array(2).fill(null).map((_, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600 italic mb-4">"Great service and experience!"</p>
                  <p className="font-semibold">Customer {idx + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )

      // Navigation and Header sections
      case 'navbar-basic':
      case 'navbar-sticky':
        return sectionWrapper(
          <div
            className={`cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
            style={{
              backgroundColor: '#ffffff',
              borderBottom: '2px solid #e5e7eb',
              padding: '1rem',
              ...generateContainerStyle(content.containerStyle)
            }}
          >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <EditableText
                tag="div"
                sectionId={section.id}
                field="logo"
                value={content.logo || 'Logo'}
                onSave={(e) => handleInlineTextEdit(section.id, 'logo', e)}
                className="text-xl font-bold text-amber-600 outline-none hover:bg-amber-50 px-2 py-1 rounded transition"
              />
              <div className="flex gap-6">
                {(content.links || []).map((link: any, idx: number) => {
                  const isActive = isActivePage(link, currentPage?.id || 0)
                  return (
                    <a
                      key={idx}
                      href={getLinkHref(link)}
                      className="transition"
                      style={{
                        ...generateLinkStyle(content.linkStyling),
                        ...(isActive ? generateActiveIndicatorStyle(content.activeIndicator) : {})
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {getLinkLabel(link)}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'navbar-dropdown':
        const DropdownNavItem = ({ link, linkStyling, dropdownConfig, activeIndicator, currentPageId }: any) => {
          const [isOpen, setIsOpen] = useState(false)
          const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
          const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)

          const hasSubItems = typeof link === 'object' && link.subItems && link.subItems.length > 0
          const trigger = dropdownConfig?.trigger || 'click'
          const hoverDelay = dropdownConfig?.hoverDelay || 0
          const autoCloseDelay = dropdownConfig?.autoCloseDelay ?? 0
          const transitionDuration = dropdownConfig?.transitionDuration || 200
          const isActive = isActivePage(link, currentPageId)

          const handleMouseEnter = () => {
            if (trigger === 'click') return

            // Clear any existing close timeout
            if (closeTimeout) clearTimeout(closeTimeout)

            // Set hover delay before opening
            const timeout = setTimeout(() => {
              setIsOpen(true)

              // Set auto-close timer if configured
              if (autoCloseDelay > 0) {
                const closeTimer = setTimeout(() => setIsOpen(false), autoCloseDelay)
                setCloseTimeout(closeTimer)
              }
            }, hoverDelay)

            setHoverTimeout(timeout)
          }

          const handleMouseLeave = () => {
            if (trigger === 'click') return

            // Clear hover timeout
            if (hoverTimeout) clearTimeout(hoverTimeout)

            // Close immediately on mouse leave
            setIsOpen(false)

            // Clear auto-close timeout
            if (closeTimeout) clearTimeout(closeTimeout)
          }

          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault()

            if (trigger === 'hover') return

            setIsOpen(!isOpen)

            // Set auto-close timer if configured
            if (!isOpen && autoCloseDelay > 0) {
              const closeTimer = setTimeout(() => setIsOpen(false), autoCloseDelay)
              setCloseTimeout(closeTimer)
            }
          }

          return (
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href={getLinkHref(link)}
                className="cursor-pointer flex items-center gap-1"
                style={{
                  ...generateLinkStyle(linkStyling),
                  ...(isActive ? generateActiveIndicatorStyle(activeIndicator) : {})
                }}
                onClick={handleClick}
              >
                {getLinkLabel(link)}
                {hasSubItems && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </a>
              {isOpen && hasSubItems && (
                <div
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg p-2 min-w-[120px] z-10"
                  style={{
                    animation: `fadeIn ${transitionDuration}ms ease-in-out`
                  }}
                >
                  {link.subItems.map((subItem: any, subIdx: number) => {
                    const isSubItemActive = isActivePage(subItem, currentPageId)
                    return (
                      <a
                        key={subIdx}
                        href={getLinkHref(subItem)}
                        className="block text-xs transition py-1 px-2 rounded"
                        style={{
                          ...generateLinkStyle(linkStyling),
                          ...(isSubItemActive ? generateActiveIndicatorStyle(activeIndicator) : {})
                        }}
                        onClick={(e) => e.preventDefault()}
                      >
                        {getLinkLabel(subItem)}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        return sectionWrapper(
          <div
            className={`cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
            style={{
              backgroundColor: '#ffffff',
              borderBottom: '2px solid #e5e7eb',
              padding: '1rem',
              ...generateContainerStyle(content.containerStyle)
            }}
          >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <EditableText
                tag="div"
                sectionId={section.id}
                field="logo"
                value={content.logo || 'Logo'}
                onSave={(e) => handleInlineTextEdit(section.id, 'logo', e)}
                className="text-xl font-bold text-amber-600 outline-none hover:bg-amber-50 px-2 py-1 rounded transition"
              />
              <div className="flex gap-6">
                {(content.links || []).map((link: any, idx: number) => (
                  <DropdownNavItem
                    key={idx}
                    link={link}
                    linkStyling={content.linkStyling}
                    dropdownConfig={content.dropdownConfig}
                    activeIndicator={content.activeIndicator}
                    currentPageId={currentPage?.id || 0}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 'header-simple':
        return sectionWrapper(
          <div
            className={`text-center cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
            style={{
              background: 'linear-gradient(to right, #fef3c7, #fde68a)',
              padding: '3rem',
              ...generateContainerStyle(content.containerStyle)
            }}
          >
            <EditableText
              tag="h1"
              sectionId={section.id}
              field="logo"
              value={content.logo || 'Company Name'}
              onSave={(e) => handleInlineTextEdit(section.id, 'logo', e)}
              className="text-4xl font-bold text-gray-800 mb-2 outline-none hover:bg-white/50 px-2 py-1 rounded transition"
            />
            <EditableText
              tag="p"
              sectionId={section.id}
              field="tagline"
              value={content.tagline || 'Your tagline here'}
              onSave={(e) => handleInlineTextEdit(section.id, 'tagline', e)}
              className="text-gray-600 outline-none hover:bg-white/50 px-2 py-1 rounded transition"
            />
          </div>
        )

      case 'header-centered':
        return sectionWrapper(
          <div
            className={`text-center cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
            style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderBottom: '2px solid #e5e7eb',
              ...generateContainerStyle(content.containerStyle)
            }}
          >
            <EditableText
              tag="h1"
              sectionId={section.id}
              field="logo"
              value={content.logo || 'Brand'}
              onSave={(e) => handleInlineTextEdit(section.id, 'logo', e)}
              className="text-3xl font-bold text-amber-600 mb-4 outline-none hover:bg-amber-50 px-2 py-1 rounded transition"
            />
            {content.navigation && (
              <div className="flex gap-6 justify-center">
                {(content.links || ['Home', 'About', 'Services', 'Contact']).map((link: any, idx: number) => {
                  const isActive = isActivePage(link, currentPage?.id || 0)
                  return (
                    <a
                      key={idx}
                      href={getLinkHref(link)}
                      className="transition"
                      style={{
                        ...generateLinkStyle(content.linkStyling),
                        ...(isActive ? generateActiveIndicatorStyle(content.activeIndicator) : {})
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {getLinkLabel(link)}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'header-split':
        return sectionWrapper(
          <div
            className={`cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
            style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderBottom: '2px solid #e5e7eb',
              ...generateContainerStyle(content.containerStyle)
            }}
          >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <EditableText
                tag="h1"
                sectionId={section.id}
                field="logo"
                value={content.logo || 'Logo'}
                onSave={(e) => handleInlineTextEdit(section.id, 'logo', e)}
                className="text-2xl font-bold text-amber-600 outline-none hover:bg-amber-50 px-2 py-1 rounded transition"
              />
              <div className="flex gap-6">
                {(content.links || []).map((link: any, idx: number) => {
                  const isActive = isActivePage(link, currentPage?.id || 0)
                  return (
                    <a
                      key={idx}
                      href={getLinkHref(link)}
                      className="transition"
                      style={{
                        ...generateLinkStyle(content.linkStyling),
                        ...(isActive ? generateActiveIndicatorStyle(content.activeIndicator) : {})
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {getLinkLabel(link)}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        )

      // Footer sections
      case 'footer-simple':
        return sectionWrapper(
          <div className={`bg-gray-800 text-white p-8 text-center cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <EditableText
              tag="p"
              sectionId={section.id}
              field="text"
              value={content.text || '© 2025 Company Name. All rights reserved.'}
              onSave={(e) => handleInlineTextEdit(section.id, 'text', e)}
              className="text-sm outline-none hover:bg-white/10 px-2 py-1 rounded transition"
            />
          </div>
        )

      case 'footer-columns':
        return sectionWrapper(
          <div className={`bg-gray-800 text-white p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="grid grid-cols-4 gap-8 max-w-7xl mx-auto">
              {(content.columns || []).map((col: any, idx: number) => (
                <div key={idx}>
                  <h3 className="font-bold mb-3">{col.title}</h3>
                  {col.links?.map((link: string, linkIdx: number) => (
                    <p key={linkIdx} className="text-sm text-gray-400 mb-1">{link}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )

      case 'footer-social':
        return sectionWrapper(
          <div className={`bg-gray-800 text-white p-8 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="text-center">
              <EditableText
                tag="p"
                sectionId={section.id}
                field="text"
                value={content.text || '© 2025 Company'}
                onSave={(e) => handleInlineTextEdit(section.id, 'text', e)}
                className="text-sm mb-4 outline-none hover:bg-white/10 px-2 py-1 rounded transition"
              />
              <div className="flex gap-4 justify-center">
                {(content.socials || []).map((social: string, idx: number) => (
                  <span key={idx} className="text-amber-500 hover:text-amber-400 cursor-pointer">{social}</span>
                ))}
              </div>
            </div>
          </div>
        )

      // Sidebar navigation sections
      case 'sidebar-nav-left':
      case 'sidebar-nav-right':
        const sidebarPosition = section.type === 'sidebar-nav-left' ? 'left' : 'right'
        const positionType = content.positioned || 'permanently-fixed'
        const fullHeight = content.fullHeight !== false
        const heightClass = fullHeight ? 'min-h-[600px]' : 'min-h-[300px]'

        // Different visual indicators based on position type
        if (positionType === 'menu-click') {
          return sectionWrapper(
            <div className="relative min-h-[100px]">
              {/* Sidebar panel (shown when visible in builder) */}
              {sidebarVisible && (
                <div className={`absolute top-0 ${sidebarPosition === 'left' ? 'left-0' : 'right-0'} w-64 bg-gray-100 border-2 border-amber-400 border-dashed rounded-lg p-6 shadow-xl ${heightClass}`} style={{zIndex: 35}}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Navigation</h3>
                    <div className="text-xs text-amber-600 font-medium">Menu-click mode</div>
                  </div>
                  {fullHeight && <div className="text-[10px] text-gray-500 mb-2">Full height</div>}
                  <div className="space-y-2">
                    {(content.links || []).map((link: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded hover:bg-amber-50 transition">
                        <a
                          href={getLinkHref(link)}
                          className="text-gray-700 block"
                          onClick={(e) => e.preventDefault()}
                        >
                          {getLinkLabel(link)}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content placeholder */}
              <div className={`cursor-pointer hover:ring-2 hover:ring-amber-500 transition border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[120px] ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
                <p className="text-sm text-gray-500 text-center">
                  {sidebarVisible ? 'Content appears here (sidebar visible in overlay)' : 'Hover section and click menu icon to show sidebar'}
                </p>
              </div>
            </div>
          )
        } else if (positionType === 'permanently-fixed') {
          return sectionWrapper(
            <div className="relative min-h-[400px]">
              {/* Fixed sidebar */}
              <div className={`absolute top-0 ${sidebarPosition === 'left' ? 'left-0' : 'right-0'} w-64 bg-gray-800 text-white p-6 shadow-xl ${heightClass}`} style={{zIndex: 30}}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Navigation</h3>
                  <div className="text-xs text-blue-400 font-medium">📌 Fixed</div>
                </div>
                {fullHeight && <div className="text-[10px] text-gray-400 mb-2">Full height (100vh)</div>}
                <div className="space-y-2">
                  {(content.links || []).map((link: any, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition">
                      <a
                        href={getLinkHref(link)}
                        className="text-gray-200 block"
                        onClick={(e) => e.preventDefault()}
                      >
                        {getLinkLabel(link)}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content area with margin */}
              <div className={`cursor-pointer hover:ring-2 hover:ring-amber-500 transition border-2 border-dashed border-gray-300 rounded-lg p-8 ${sidebarPosition === 'left' ? 'ml-72' : 'mr-72'} min-h-[400px] ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
                <p className="text-sm text-gray-500 text-center">
                  Content appears beside the permanently fixed sidebar
                </p>
              </div>
            </div>
          )
        } else {
          // static
          return sectionWrapper(
            <div className="relative min-h-[400px]">
              {/* Static sidebar */}
              <div className={`absolute top-0 ${sidebarPosition === 'left' ? 'left-0' : 'right-0'} w-64 bg-gray-200 border-l-4 border-amber-500 p-6 ${heightClass}`} style={{zIndex: 30}}>
                <h3 className="font-bold text-lg mb-4 text-gray-800">Navigation</h3>
                <div className="text-xs text-gray-600 mb-2">Static position</div>
                {fullHeight && <div className="text-[10px] text-gray-500 mb-2">Full height</div>}
                <div className="space-y-2">
                  {(content.links || []).map((link: any, idx: number) => (
                    <div key={idx} className="p-2 bg-white rounded hover:bg-amber-50 transition">
                      <a
                        href={getLinkHref(link)}
                        className="text-gray-700 block"
                        onClick={(e) => e.preventDefault()}
                      >
                        {getLinkLabel(link)}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content area with margin */}
              <div className={`cursor-pointer hover:ring-2 hover:ring-amber-500 transition border-2 border-dashed border-gray-300 rounded-lg p-8 ${sidebarPosition === 'left' ? 'ml-72' : 'mr-72'} min-h-[400px] ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
                <p className="text-sm text-gray-500 text-center">
                  Content appears beside the static sidebar
                </p>
              </div>
            </div>
          )
        }

      default:
        return sectionWrapper(
          <div className={`p-12 border-2 border-dashed border-gray-300 cursor-pointer hover:border-amber-500 transition ${selectedSection?.id === section.id ? 'border-amber-500' : ''}`}>
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
                className="px-3 h-full hover:bg-amber-50 transition"
              >
                File
              </button>
              {showFileMenu && (
                <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-48">
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
                        className="w-full text-left px-4 py-2 hover:bg-amber-50 text-xs font-medium text-amber-700"
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
                    onClick={() => setShowFileMenu(false)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
                  >
                    Close
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
                className="px-3 h-full hover:bg-amber-50 transition"
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
                          ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Template Settings
                    </button>
                    <button
                      onClick={() => setEditSubTab('css')}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                        editSubTab === 'css'
                          ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Site CSS
                    </button>
                    <button
                      onClick={() => setEditSubTab('page')}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                        editSubTab === 'page'
                          ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
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
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
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
                            setTemplate({ ...template, custom_css: css })
                          }}
                          context="page"
                          showFontSelector={true}
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
                className="px-3 h-full hover:bg-amber-50 transition"
              >
                View
              </button>
              {showViewMenu && (
                <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-48">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        alert('Live Preview - Coming Soon!')
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
                className="px-3 h-full hover:bg-amber-50 transition"
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
              className="px-3 h-full hover:bg-amber-50 transition"
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
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-center w-64"
          />
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center h-full text-xs space-x-1 pr-2">
          <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition">
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
            className={`p-1.5 rounded transition ${showLeftSidebar ? 'bg-amber-100 text-amber-700' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Components Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className={`p-1.5 rounded transition ${showRightSidebar ? 'bg-amber-100 text-amber-700' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
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
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'desktop' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
            title="Desktop View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'tablet' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
            title="Tablet View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'mobile' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-amber-800">Published Template</span>
              <p className="text-xs text-amber-700">This template is published and available to users. Changes will update the published version.</p>
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
            className="px-3 py-1 bg-white border border-amber-300 text-amber-700 rounded text-xs hover:bg-amber-50 transition"
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
                <h2 className="text-xs font-semibold text-amber-600 uppercase mb-3">Section Library</h2>

                {/* Core Sections */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleCategory('core')}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                  >
                    <span>Core Sections</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategories.includes('core') ? 'rotate-90' : ''}`}
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
                            {renderSectionThumbnail(section)}
                            <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-amber-700 transition">
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
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                  >
                    <span>Header & Navigation</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategories.includes('headerNav') ? 'rotate-90' : ''}`}
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
                            {renderSectionThumbnail(section)}
                            <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-amber-700 transition">
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
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                  >
                    <span>Footers</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategories.includes('footers') ? 'rotate-90' : ''}`}
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
                            {renderSectionThumbnail(section)}
                            <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-amber-700 transition">
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
              className="w-1 bg-gray-200 hover:bg-amber-400 cursor-col-resize transition flex-shrink-0"
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
            className="bg-white min-h-full shadow-xl mx-auto ring-1 ring-gray-200"
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
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                  title="Edit CSS"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                    <path d="M5 3L3 9L5 21H19L21 9L19 3H5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M7 15L9 13L11 15L13 13L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <text x="12" y="10" fontSize="8" fill="currentColor" textAnchor="middle" fontWeight="bold">CSS</text>
                  </svg>
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
                  className="px-2 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded transition"
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
              className="w-1 bg-gray-200 hover:bg-amber-400 cursor-col-resize transition flex-shrink-0"
            />

            <aside
              ref={rightSidebarRef}
              style={{ width: rightWidth }}
              className="bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0"
            >
              <div className="p-3">
                <h2 className="text-xs font-semibold text-amber-600 uppercase mb-3">
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
                            ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Site CSS
                      </button>
                      <button
                        onClick={() => setCssTab('page')}
                        className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                          cssTab === 'page'
                            ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
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
                            setTemplate({ ...template!, custom_css: css })
                          }}
                          context="page"
                          showFontSelector={true}
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
                            setTemplate({ ...template, pages: updatedPages })
                            setCurrentPage({ ...currentPage, page_css: css })
                          }}
                          context="page"
                          galleryImages={template?.images}
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Section Name</label>
                        <div className="flex gap-1">
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
                                setTemplate({ ...template, pages: updatedPages })
                                setCurrentPage({
                                  ...currentPage,
                                  sections: currentPage.sections.map(s =>
                                    s.id === selectedSection.id ? updatedSection : s
                                  )
                                })
                              }
                            }}
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                                setTemplate({ ...template, pages: updatedPages })
                                setCurrentPage({
                                  ...currentPage,
                                  sections: currentPage.sections.map(s =>
                                    s.id === selectedSection.id ? updatedSection : s
                                  )
                                })
                              }
                            }}
                            className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition"
                            title="Generate new ID from section name"
                          >
                            Apply
                          </button>
                        </div>
                        <div className="mt-1 px-2 py-1 bg-blue-50 rounded text-[10px] font-mono text-blue-700">
                          <span className="font-semibold">ID:</span> {selectedSection.section_id || 'Not set'}
                        </div>
                        <p className="text-[9px] text-gray-500 mt-0.5">Use this ID in CSS: #{selectedSection.section_id}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setShowSectionCSS(!showSectionCSS)
                            setShowContentStyle(false)
                            setShowCSSPanel(false)
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition"
                          title="Edit Section CSS"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                            <path d="M5 3L3 9L5 21H19L21 9L19 3H5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                            <path d="M7 15L9 13L11 15L13 13L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <text x="12" y="10" fontSize="8" fill="currentColor" textAnchor="middle" fontWeight="bold">CSS</text>
                          </svg>
                        </button>
                      </div>
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
                              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                                <p className="text-xs text-blue-700">
                                  <strong>💡 Tip:</strong> Click on any text in the columns to edit it using the floating editor at the bottom.
                                </p>
                              </div>

                              {/* Row Style Button */}
                              <div className="mb-3">
                                <button
                                  onClick={() => {
                                    setShowRowStyle(!showRowStyle)
                                    setExpandedColumnIndex(null)
                                  }}
                                  className="w-full px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-300 rounded text-sm font-medium text-purple-700 transition flex items-center justify-between"
                                >
                                  <span>Row Container Style</span>
                                  <span className="text-xs">{showRowStyle ? '▼' : '▶'}</span>
                                </button>

                                {showRowStyle && (
                                  <div className="mt-2 p-3 border border-purple-200 rounded bg-white">
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
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Column Style Buttons */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Column Styles</label>
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
                                              ? 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-400 text-amber-700'
                                              : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300 text-gray-700'
                                          }`}
                                        >
                                          <span>Column {idx + 1} <span className="text-xs text-gray-500">(col-{colWidth})</span></span>
                                          <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                                        </button>

                                        {isExpanded && (
                                          <div className="mt-2 p-3 border border-amber-200 rounded bg-white">
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

                    {/* Navigation Section Fields */}
                    {(selectedSection.type.startsWith('navbar-') || selectedSection.type.startsWith('header-') || selectedSection.type.startsWith('sidebar-nav-')) && (
                      <>
                        {/* Info about text editing */}
                        {(selectedSection.content?.logo !== undefined || selectedSection.content?.tagline !== undefined) && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                            <p className="text-xs text-blue-700">
                              <strong>💡 Tip:</strong> Click on the logo or tagline text in the section to edit it.
                            </p>
                          </div>
                        )}

                        {/* Navigation Links Manager */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-700">Navigation Links</label>
                            <div className="flex gap-1">
                              {/* Convert old links button */}
                              {selectedSection.content?.links?.some((link: any) => typeof link === 'string') && (
                                <button
                                  onClick={() => {
                                    const currentLinks = selectedSection.content?.links || []
                                    const convertedLinks = currentLinks.map((link: any) => {
                                      if (typeof link === 'string') {
                                        return selectedSection.type === 'navbar-dropdown'
                                          ? { label: link, linkType: 'page', pageId: null, url: '', subItems: [] }
                                          : { label: link, linkType: 'page', pageId: null, url: '' }
                                      }
                                      return link
                                    })
                                    handleUpdateSectionContent(selectedSection.id, {
                                      ...selectedSection.content,
                                      links: convertedLinks
                                    })
                                  }}
                                  className="px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded hover:bg-blue-600 transition"
                                  title="Convert old links to new format"
                                >
                                  Convert
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const currentLinks = selectedSection.content?.links || []
                                  const newLink = selectedSection.type === 'navbar-dropdown'
                                    ? { label: 'New Link', linkType: 'page', pageId: null, url: '', subItems: [] }
                                    : { label: 'New Link', linkType: 'page', pageId: null, url: '' }
                                  handleUpdateSectionContent(selectedSection.id, {
                                    ...selectedSection.content,
                                    links: [...currentLinks, newLink]
                                  })
                                }}
                                className="px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded hover:bg-amber-600 transition"
                              >
                                + Add Link
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {((selectedSection.content?.links || []) as any[]).map((link: any, idx: number) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                                {/* Link Label */}
                                <div className="mb-2">
                                  <label className="text-[10px] text-gray-500 block mb-1">Label</label>
                                  <input
                                    type="text"
                                    value={typeof link === 'string' ? link : link.label || ''}
                                    onChange={(e) => {
                                      const newLinks = [...(selectedSection.content?.links || [])]
                                      if (typeof newLinks[idx] === 'string') {
                                        newLinks[idx] = { label: e.target.value, linkType: 'page', pageId: null, url: '' }
                                      } else {
                                        newLinks[idx] = { ...newLinks[idx], label: e.target.value }
                                      }
                                      handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    placeholder="Link text"
                                  />
                                </div>

                                {/* Link Type Selection */}
                                {typeof link === 'object' && (
                                  <>
                                    <div className="mb-2">
                                      <label className="text-[10px] text-gray-500 block mb-1">Link Type</label>
                                      <select
                                        value={link.linkType || 'page'}
                                        onChange={(e) => {
                                          const newLinks = [...(selectedSection.content?.links || [])]
                                          newLinks[idx] = { ...newLinks[idx], linkType: e.target.value, pageId: null, url: '' }
                                          handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                        }}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      >
                                        <option value="page">Link to Page</option>
                                        <option value="url">External URL</option>
                                      </select>
                                    </div>

                                    {/* Page Selector */}
                                    {link.linkType === 'page' && (
                                      <div className="mb-2">
                                        <label className="text-[10px] text-gray-500 block mb-1">Select Page</label>
                                        <select
                                          value={link.pageId || ''}
                                          onChange={(e) => {
                                            const newLinks = [...(selectedSection.content?.links || [])]
                                            newLinks[idx] = { ...newLinks[idx], pageId: e.target.value ? parseInt(e.target.value) : null }
                                            handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                          }}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        >
                                          <option value="">Select a page...</option>
                                          {template?.pages.map(page => (
                                            <option key={page.id} value={page.id}>
                                              {page.name} {page.is_homepage ? '(Home)' : ''}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    {/* URL Input */}
                                    {link.linkType === 'url' && (
                                      <div className="mb-2">
                                        <label className="text-[10px] text-gray-500 block mb-1">URL</label>
                                        <input
                                          type="text"
                                          value={link.url || ''}
                                          onChange={(e) => {
                                            const newLinks = [...(selectedSection.content?.links || [])]
                                            newLinks[idx] = { ...newLinks[idx], url: e.target.value }
                                            handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                          }}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                          placeholder="https://example.com"
                                        />
                                      </div>
                                    )}

                                    {/* Sub-items for dropdown nav */}
                                    {selectedSection.type === 'navbar-dropdown' && link.subItems !== undefined && (
                                      <div className="mb-2 pl-2 border-l-2 border-amber-300">
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-[10px] text-gray-500">Sub-items</label>
                                          <button
                                            onClick={() => {
                                              const newLinks = [...(selectedSection.content?.links || [])]
                                              const newSubItem = { label: 'Sub-item', linkType: 'page', pageId: null, url: '' }
                                              newLinks[idx] = {
                                                ...newLinks[idx],
                                                subItems: [...(newLinks[idx].subItems || []), newSubItem]
                                              }
                                              handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                            }}
                                            className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded hover:bg-amber-200 transition"
                                          >
                                            + Sub
                                          </button>
                                        </div>
                                        <div className="space-y-2">
                                          {(link.subItems || []).map((subItem: any, subIdx: number) => (
                                            <div key={subIdx} className="bg-white border border-gray-200 rounded p-1.5">
                                              <input
                                                type="text"
                                                value={subItem.label || ''}
                                                onChange={(e) => {
                                                  const newLinks = [...(selectedSection.content?.links || [])]
                                                  const newSubItems = [...(newLinks[idx].subItems || [])]
                                                  newSubItems[subIdx] = { ...newSubItems[subIdx], label: e.target.value }
                                                  newLinks[idx] = { ...newLinks[idx], subItems: newSubItems }
                                                  handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                                }}
                                                className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-[10px] mb-1"
                                                placeholder="Sub-item label"
                                              />
                                              <select
                                                value={subItem.linkType || 'page'}
                                                onChange={(e) => {
                                                  const newLinks = [...(selectedSection.content?.links || [])]
                                                  const newSubItems = [...(newLinks[idx].subItems || [])]
                                                  newSubItems[subIdx] = { ...newSubItems[subIdx], linkType: e.target.value }
                                                  newLinks[idx] = { ...newLinks[idx], subItems: newSubItems }
                                                  handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                                }}
                                                className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-[10px] mb-1"
                                              >
                                                <option value="page">Page</option>
                                                <option value="url">URL</option>
                                              </select>
                                              {subItem.linkType === 'page' ? (
                                                <select
                                                  value={subItem.pageId || ''}
                                                  onChange={(e) => {
                                                    const newLinks = [...(selectedSection.content?.links || [])]
                                                    const newSubItems = [...(newLinks[idx].subItems || [])]
                                                    newSubItems[subIdx] = { ...newSubItems[subIdx], pageId: e.target.value ? parseInt(e.target.value) : null }
                                                    newLinks[idx] = { ...newLinks[idx], subItems: newSubItems }
                                                    handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                                  }}
                                                  className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-[10px] mb-1"
                                                >
                                                  <option value="">Select page...</option>
                                                  {template?.pages.map(page => (
                                                    <option key={page.id} value={page.id}>{page.name}</option>
                                                  ))}
                                                </select>
                                              ) : (
                                                <input
                                                  type="text"
                                                  value={subItem.url || ''}
                                                  onChange={(e) => {
                                                    const newLinks = [...(selectedSection.content?.links || [])]
                                                    const newSubItems = [...(newLinks[idx].subItems || [])]
                                                    newSubItems[subIdx] = { ...newSubItems[subIdx], url: e.target.value }
                                                    newLinks[idx] = { ...newLinks[idx], subItems: newSubItems }
                                                    handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                                  }}
                                                  className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-[10px] mb-1"
                                                  placeholder="URL"
                                                />
                                              )}
                                              <button
                                                onClick={() => {
                                                  const newLinks = [...(selectedSection.content?.links || [])]
                                                  const newSubItems = (newLinks[idx].subItems || []).filter((_: any, i: number) => i !== subIdx)
                                                  newLinks[idx] = { ...newLinks[idx], subItems: newSubItems }
                                                  handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                                }}
                                                className="w-full px-1.5 py-0.5 bg-red-50 text-red-600 text-[9px] rounded hover:bg-red-100 transition"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}

                                {/* Remove Link Button */}
                                <button
                                  onClick={() => {
                                    const newLinks = (selectedSection.content?.links || []).filter((_: any, i: number) => i !== idx)
                                    handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                  }}
                                  className="w-full mt-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded hover:bg-red-100 transition"
                                >
                                  Remove Link
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Navigation Styling Panel */}
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <h3 className="text-xs font-semibold text-gray-900 mb-3">Navigation Styling</h3>
                          <NavigationStylingPanel
                            content={selectedSection.content || {}}
                            onUpdate={(updatedContent) => {
                              handleUpdateSectionContent(selectedSection.id, updatedContent)
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* Section-specific info message */}
                    {(selectedSection.type === 'hero' || selectedSection.type === 'gallery' || selectedSection.type === 'contact-form' || selectedSection.type === 'booking-form' || selectedSection.type === 'login-box' || selectedSection.type === 'testimonials') && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs text-blue-700">
                          <strong>💡 Tip:</strong> Click on any text in the section to edit it using the floating editor at the bottom.
                        </p>
                      </div>
                    )}

                    {/* Sidebar Navigation Fields */}
                    {(selectedSection.type === 'sidebar-nav-left' || selectedSection.type === 'sidebar-nav-right') && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">Position Behavior</label>
                          <select
                            value={selectedSection.content?.positioned || 'permanently-fixed'}
                            onChange={(e) => handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, positioned: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="menu-click">Appear on menu click</option>
                            <option value="permanently-fixed">Permanently fixed</option>
                            <option value="static">Static</option>
                          </select>
                          <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                            {selectedSection.content?.positioned === 'menu-click' && 'Sidebar appears when user clicks menu button'}
                            {selectedSection.content?.positioned === 'permanently-fixed' && 'Sidebar stays visible and fixed to viewport'}
                            {selectedSection.content?.positioned === 'static' && 'Sidebar scrolls with page content'}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-700 flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={selectedSection.content?.fullHeight !== false}
                              onChange={(e) => handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, fullHeight: e.target.checked })}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span>Full Height (100vh)</span>
                          </label>
                          <p className="text-[10px] text-gray-500 ml-5 leading-tight">
                            {selectedSection.content?.fullHeight !== false
                              ? 'Sidebar extends to full viewport height'
                              : 'Sidebar height adjusts to content'}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-2">Navigation Links</label>
                          <div className="space-y-2">
                            {(selectedSection.content?.links || []).map((link: string, idx: number) => (
                              <input
                                key={idx}
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(selectedSection.content?.links || [])]
                                  newLinks[idx] = e.target.value
                                  handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                placeholder={`Link ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                      </>
                    )}
                  </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Drag Overlay - Shows preview of dragged item */}
    <DragOverlay>
      {activeId && activeDragData ? (
        <div className="bg-white shadow-2xl rounded-lg p-4 border-2 border-amber-500 opacity-90">
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
                  }
                }, 10)
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-white transition"
              title="Heading Level"
              defaultValue=""
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
                        className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm font-medium transition"
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
                    className="w-full h-full p-4 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                        className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm font-medium transition"
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
                    className="w-full h-full p-4 bg-gray-900 text-cyan-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
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
  </DndContext>
  )
}
