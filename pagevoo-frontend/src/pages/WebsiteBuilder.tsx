import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { getAssetUrl } from '@/config/constants'
import { sectionLibraryApi, pageLibraryApi, fileToBase64 } from '@/services/libraryApi'
import { databaseService, type SystemPageDefinition } from '@/services/databaseService'
import * as systemPageService from '@/services/systemPageService'
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
import { SaveWebsiteModal } from '@/components/modals/SaveWebsiteModal'
import { LoadWebsiteModal } from '@/components/modals/LoadWebsiteModal'
import { DatabaseManagementModal } from '@/components/database/DatabaseManagementModal'
import { FeatureInstallModal } from '@/components/features/FeatureInstallModal'
import { ManageFeaturesModal } from '@/components/features/ManageFeaturesModal'
import { ContactFormConfigModal } from '@/components/script-features/contact-form'
import { BlogManager } from '@/components/BlogManager'
import { EventsManager } from '@/components/EventsManager'
import { BookingManager } from '@/components/BookingManager'
import UasManager from '@/components/UasManager'
import { VooPressSetupWizard, VooPressDashboard } from '@/components/voopress'
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
import { PublishedWebsiteBanner } from '../components/layout/PublishedWebsiteBanner'
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
import { useTheme } from '../hooks/useTheme'
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

interface UserSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
  lock_type?: string
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
  is_system?: boolean
  system_type?: string
  feature_type?: string
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
  site_css?: string
  default_title?: string
  default_description?: string
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
  tier_category: 'trial' | 'brochure' | 'niche' | 'pro'
}

export default function WebsiteBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { can, tier } = usePermissions()
  const { theme, currentTheme, changeTheme } = useTheme()

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

  // Template filtering states
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all')
  const [showRecommended, setShowRecommended] = useState(true)

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

  // Save Website Modal states
  const [showSaveWebsiteModal, setShowSaveWebsiteModal] = useState(false)
  const [websiteName, setWebsiteName] = useState('')

  // Load Website Modal states
  const [showLoadWebsiteModal, setShowLoadWebsiteModal] = useState(false)
  const [availableWebsites, setAvailableWebsites] = useState<any[]>([])
  const [loadingWebsites, setLoadingWebsites] = useState(false)

  // Database & Features states
  const [showDatabaseModal, setShowDatabaseModal] = useState(false)
  const [showFeatureInstallModal, setShowFeatureInstallModal] = useState(false)
  const [showManageFeaturesModal, setShowManageFeaturesModal] = useState(false)
  const [showContactFormModal, setShowContactFormModal] = useState(false)
  const [showBlogManager, setShowBlogManager] = useState(false)
  const [showEventsManager, setShowEventsManager] = useState(false)
  const [showBookingManager, setShowBookingManager] = useState(false)
  const [showVooPressSetup, setShowVooPressSetup] = useState(false)
  const [showVooPressDashboard, setShowVooPressDashboard] = useState(false)
  const [voopressStatus, setVoopressStatus] = useState<{
    is_voopress: boolean;
    voopress_theme: string | null;
    voopress_config: any;
  } | null>(null)
  const [showUasManager, setShowUasManager] = useState(false)
  const [bookingType, setBookingType] = useState<'appointments' | 'restaurant' | 'classes' | 'events' | 'rentals'>('appointments')
  const [bookingServices, setBookingServices] = useState<Array<{
    id: number
    name: string
    duration_minutes: number
    price: number
    pricing_type: string
  }>>([])

  // Installed features state
  const [installedFeatures, setInstalledFeatures] = useState<string[]>([])

  // Persistent system pages (stored independently in database)
  const [persistentSystemPages, setPersistentSystemPages] = useState<systemPageService.SystemPage[]>([])

  // Imported sections state (sections imported from library to sidebar)
  const [importedSections, setImportedSections] = useState<any[]>([])

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

  // Always show welcome screen on mount
  useEffect(() => {
    setShowWelcome(true)
    loadTemplates()
    setLoading(false)
  }, [])

  // Load installed features and VooPress status when user is available
  useEffect(() => {
    if (user) {
      loadInstalledFeatures()
      // Also load booking settings directly (in case features check fails)
      loadBookingSettings()
      // Load VooPress status
      loadVooPressStatus()
    }
  }, [user])

  // Load VooPress status
  const loadVooPressStatus = async () => {
    try {
      const response = await api.get('/v1/script-features/voopress/status')
      if (response.success && response.data) {
        setVoopressStatus(response.data)
      }
    } catch (error) {
      console.error('Failed to load VooPress status:', error)
    }
  }

  const loadWebsite = async (websiteId: number) => {
    try {
      setLoading(true)
      const response = await api.getUserWebsite(websiteId)
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

        // Load booking settings if booking feature might be installed
        loadBookingSettings()
      }
    } catch (error) {
      console.error('Failed to load website:', error)
      alert('Failed to load website: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const loadInstalledFeatures = async () => {
    if (!user?.id) return

    try {
      // Get database instance for this user
      const database = await databaseService.getInstance('website', user.id)

      if (!database) {
        setInstalledFeatures([])
        setPersistentSystemPages([])
        return
      }

      // Get installed features
      const features = await databaseService.getInstalledFeatures(database.id)
      const featureTypes = features.map(f => f.type)
      setInstalledFeatures(featureTypes)

      // If booking is installed, load booking settings to get the type
      if (featureTypes.includes('booking')) {
        loadBookingSettings()
      }

      // Load persistent system pages from database (these persist independently of website save state)
      try {
        const systemPages = await systemPageService.getSystemPagesForFeatures()
        setPersistentSystemPages(systemPages)
      } catch (systemPagesError) {
        console.error('Failed to load persistent system pages:', systemPagesError)
        setPersistentSystemPages([])
      }
    } catch (error) {
      console.error('Failed to load installed features:', error)
      setInstalledFeatures([])
      setPersistentSystemPages([])
    }
  }

  // Load booking settings and services to sync booking type and display
  const loadBookingSettings = async () => {
    if (!user?.id) return
    try {
      // Load settings
      const response = await api.get('/v1/script-features/booking/settings', {
        type: 'website',
        reference_id: user.id
      })
      const settings = response.data || response || {}
      if (settings.booking_type) {
        setBookingType(settings.booking_type)
      }

      // Also load services
      const servicesResponse = await api.get('/v1/script-features/booking/services/all', {
        type: 'website',
        reference_id: user.id
      })
      if (servicesResponse.success && servicesResponse.data) {
        setBookingServices(servicesResponse.data)
      }
    } catch (error) {
      // Settings or services might not exist yet, that's okay
    }
  }

  // Reload website data from server (used after installing features with system pages)
  const reloadWebsite = async () => {
    if (!website?.id) return

    try {
      const response = await api.getUserWebsite(website.id)
      if (response.success && response.data) {
        setWebsite(response.data)
        websiteRef.current = response.data

        // Update current page if it still exists, otherwise default to homepage
        const updatedCurrentPage = response.data.pages.find((p: UserPage) => p.id === currentPage?.id)
        if (updatedCurrentPage) {
          setCurrentPage(updatedCurrentPage)
        } else {
          const homepage = response.data.pages.find((p: UserPage) => p.is_homepage) || response.data.pages[0]
          setCurrentPage(homepage)
        }
      }
    } catch (error) {
      console.error('Failed to reload website:', error)
    }
  }

  // Add system pages to in-memory website state (for unsaved websites)
  const addSystemPagesToWebsite = (systemPages: SystemPageDefinition[], featureType: string) => {
    if (!website || !systemPages || systemPages.length === 0) return

    // Check if system pages already exist
    const existingSystemTypes = website.pages
      .filter((p: UserPage) => p.is_system)
      .map((p: UserPage) => p.system_type)

    // Get the max order from existing pages
    const maxOrder = Math.max(0, ...website.pages.map((p: UserPage) => p.order || 0))

    // Convert system page definitions to UserPage format
    const newPages: UserPage[] = systemPages
      .filter(pageDef => !existingSystemTypes.includes(pageDef.system_type))
      .map((pageDef, index) => {
        // Generate temp IDs for in-memory pages
        const tempPageId = -Date.now() - index
        const tempSectionIds = pageDef.sections.map((_, sIdx) => -Date.now() - index * 100 - sIdx)

        return {
          id: tempPageId,
          user_website_id: website.id || 0,
          name: pageDef.name,
          slug: pageDef.slug,
          page_id: `page_${Math.random().toString(36).substr(2, 8)}`,
          is_homepage: false,
          order: maxOrder + index + 1,
          is_system: true,
          system_type: pageDef.system_type,
          feature_type: featureType,
          meta_description: null,
          page_css: null,
          sections: pageDef.sections.map((sectionDef, sIdx) => ({
            id: tempSectionIds[sIdx],
            user_page_id: tempPageId,
            section_name: sectionDef.section_name,
            section_id: `section_${Math.random().toString(36).substr(2, 8)}`,
            type: sectionDef.type,
            content: sectionDef.content,
            css: {},
            order: sIdx,
            is_locked: false,
            lock_type: null,
          })),
        } as UserPage
      })

    if (newPages.length > 0) {
      const updatedWebsite = {
        ...website,
        pages: [...website.pages, ...newPages]
      }
      setWebsite(updatedWebsite)
      websiteRef.current = updatedWebsite
    }
  }

  // Remove system pages from in-memory website state by feature type
  const removeSystemPagesFromWebsite = (featureType: string) => {
    if (!website) return

    const updatedPages = website.pages.filter((p: UserPage) => p.feature_type !== featureType)

    if (updatedPages.length !== website.pages.length) {
      const updatedWebsite = {
        ...website,
        pages: updatedPages
      }
      setWebsite(updatedWebsite)
      websiteRef.current = updatedWebsite

      // If current page was removed, switch to homepage
      if (currentPage && !updatedPages.find((p: UserPage) => p.id === currentPage.id)) {
        const homepage = updatedPages.find((p: UserPage) => p.is_homepage) || updatedPages[0]
        setCurrentPage(homepage)
      }
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

  // Merge website pages with persistent system pages for display
  // Persistent system pages (including VooPress) are loaded independently and persist regardless of website save state
  const effectivePages = useMemo(() => {
    // Convert persistent system pages to UserPage format (includes VooPress, UAS, etc.)
    const systemPagesAsUserPages = persistentSystemPages.map(sp => ({
      id: sp.id,
      name: sp.name,
      slug: sp.slug,
      page_id: sp.page_id,
      is_homepage: sp.is_homepage,
      order: sp.order,
      meta_description: sp.meta_description,
      page_css: sp.page_css,
      is_system: true,
      system_type: sp.system_type,
      feature_type: sp.feature_type,
      sections: (sp.sections || []).map(s => ({
        id: s.id,
        section_name: s.section_name,
        section_id: s.section_id,
        type: s.type,
        content: s.content,
        css: s.css,
        order: s.order,
        is_locked: s.is_locked,
        lock_type: s.lock_type
      }))
    })) as UserPage[]

    // If no website is loaded, just return system pages
    if (!website?.pages) {
      return systemPagesAsUserPages.sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    // Get website pages that are NOT system pages (regular user-created pages)
    const regularPages = website.pages.filter((p: UserPage) => !p.is_system)

    // Get IDs of system pages already in persistentSystemPages to avoid duplicates
    const persistentSystemPageIds = new Set(persistentSystemPages.map(sp => sp.id))

    // Get any system pages from website.pages that aren't already in persistentSystemPages
    // (this handles edge cases where pages might be in website.pages but not yet synced)
    const additionalSystemPages = website.pages.filter((p: UserPage) =>
      p.is_system && !persistentSystemPageIds.has(p.id)
    )

    // Combine: regular pages + system pages from persistentSystemPages + any additional system pages
    return [...regularPages, ...systemPagesAsUserPages, ...additionalSystemPages].sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [website?.pages, persistentSystemPages])

  const loadAvailableWebsites = async () => {
    setLoadingWebsites(true)
    try {
      const response = await api.getUserWebsites()

      if (response.success) {
        // Even if data is an empty array, that's still success
        setAvailableWebsites(response.data || [])
        return true
      } else {
        console.error('Failed to load websites:', response.message)
        setAvailableWebsites([])
        return true // Still return true to show the modal (it will show "no websites" message)
      }
    } catch (error) {
      console.error('Failed to load websites error:', error)
      alert('Failed to load websites: ' + (error as any).message)
      setAvailableWebsites([])
      return false
    } finally {
      setLoadingWebsites(false)
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
        // Generate temporary IDs for pages and sections (they don't have IDs until saved)
        let tempPageId = Date.now()
        let tempSectionId = Date.now() + 1000

        const websiteData = {
          ...response.data,
          pages: response.data.pages.map((page: any) => ({
            ...page,
            id: page.id || tempPageId++,
            sections: (page.sections || []).map((section: any) => ({
              ...section,
              id: section.id || tempSectionId++
            }))
          }))
        }

        setWebsite(websiteData)
        websiteRef.current = websiteData
        const homepage = websiteData.pages.find((p: UserPage) => p.is_homepage) || websiteData.pages[0]
        setCurrentPage(homepage)
        setShowWelcome(false)

        // Initialize history
        setHistory([JSON.parse(JSON.stringify(websiteData))])
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
    handleSave: _handleSave, // Don't use this one - we override it below for user-website endpoint
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

  // Override handleNew to show welcome screen without deleting current website
  const handleNewWebsite = async () => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const result = confirm('You have unsaved changes. Do you want to save before starting a new website?')
      if (result) {
        // User wants to save first
        await handleSave()
        // After save completes, continue with new
      } else {
        // User chose not to save
        const continueAnyway = confirm('Are you sure? Your unsaved changes will be lost.')
        if (!continueAnyway) {
          return // User cancelled
        }
      }
    }

    // Clear current state and show welcome screen (don't delete the website from DB)
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

  // Override handleLoad to show load website modal
  const handleLoadFromServer = async () => {
    if (hasUnsavedChanges) {
      if (!confirm('Discard unsaved changes and load a different website?')) {
        return
      }
    }

    setShowFileMenu(false)
    await loadAvailableWebsites()
    setShowLoadWebsiteModal(true)
  }

  // Handler for when user selects a website to load from the modal
  const handleLoadWebsiteFromModal = async (selectedWebsite: any) => {
    setShowLoadWebsiteModal(false)
    await loadWebsite(selectedWebsite.id)
  }

  // Handler for deleting a website from the modal
  const handleDeleteWebsite = async (websiteId: number) => {
    try {
      const response = await api.deleteUserWebsite(websiteId)
      if (response.success) {
        // Remove from available websites list
        setAvailableWebsites(prev => prev.filter(w => w.id !== websiteId))
        alert('Website deleted successfully')
      } else {
        alert('Failed to delete website: ' + response.message)
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      alert('Failed to delete website: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    }
  }

  // Override handleSave to use user-website endpoint instead of template endpoint
  const handleSave = async () => {
    if (!website) return

    // Check if website has a name, if not show the SaveWebsiteModal
    if (!website.name) {
      setWebsiteName('')
      setShowSaveWebsiteModal(true)
      return
    }

    // If website has a name, save directly
    await handleSaveWithName()
  }

  // Actual save function that saves the website with name
  const handleSaveWithName = async () => {
    if (!website) return

    try {
      setLoading(true)

      // Prepare website data for saving
      const websiteData = {
        name: websiteName || website.name, // Use the new name if provided, otherwise use existing name
        template_id: website.template_id || null, // Include template_id for first save
        site_css: website.site_css || '',
        pages: website.pages.map(page => ({
          id: page.id,
          template_page_id: page.template_page_id || null,
          name: page.name,
          slug: page.slug,
          is_homepage: page.is_homepage,
          order: page.order,
          meta_description: page.meta_description || '',
          page_css: page.page_css || '',
          is_system: page.is_system,
          system_type: page.system_type,
          feature_type: page.feature_type,
          sections: page.sections.map(section => ({
            id: section.id,
            template_section_id: section.template_section_id || null,
            section_id: section.section_id,
            section_name: section.section_name || section.type,
            type: section.type,
            content: section.content,
            css: section.css || {},
            order: section.order,
            is_locked: section.is_locked,
            lock_type: section.lock_type
          }))
        })),
        images: [] // Images are handled separately via upload endpoint
      }

      const response = await api.saveWebsite(website.id, websiteData)

      if (response.success) {
        // Update website with the saved data
        const updatedWebsite = response.data.website
        setWebsite(updatedWebsite)
        websiteRef.current = updatedWebsite

        // Reset history with the saved website (including new ID if first save)
        resetHistory(updatedWebsite)

        setHasUnsavedChanges(false)
        setShowSaveWebsiteModal(false)
        setWebsiteName('')
        alert('Website saved successfully!')
      } else {
        alert('Failed to save website: ' + (response.message || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Save error:', error)
      alert('Failed to save website: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    } finally {
      setLoading(false)
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
    handleGridColumnUpdate,
    handleRemoveFeatureSections
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

  // Auto-save system page section changes to database
  const autoSaveSystemPageSection = useCallback(async (pageId: number, sectionId: number, updates: any) => {
    // Find if this is a persistent system page
    const systemPage = persistentSystemPages.find(p => p.id === pageId)
    if (!systemPage) return

    try {
      await systemPageService.updateSystemPageSection(pageId, sectionId, updates)

      // Update local state
      setPersistentSystemPages(prev => prev.map(p => {
        if (p.id !== pageId) return p
        return {
          ...p,
          sections: p.sections.map(s => {
            if (s.id !== sectionId) return s
            return { ...s, ...updates }
          })
        }
      }))
    } catch (error) {
      console.error('Failed to auto-save system page section:', error)
    }
  }, [persistentSystemPages])

  // Auto-save system page metadata changes to database
  const autoSaveSystemPage = useCallback(async (pageId: number, updates: systemPageService.SystemPageUpdateData) => {
    // Find if this is a persistent system page
    const systemPage = persistentSystemPages.find(p => p.id === pageId)
    if (!systemPage) return

    try {
      await systemPageService.updateSystemPage(pageId, updates)

      // Update local state
      setPersistentSystemPages(prev => prev.map(p => {
        if (p.id !== pageId) return p
        return { ...p, ...updates }
      }))
    } catch (error) {
      console.error('Failed to auto-save system page:', error)
    }
  }, [persistentSystemPages])

  // Wrapper for section content updates that auto-saves system page changes
  const handleUpdateSectionContentWithAutoSave = useCallback((sectionId: number, content: any) => {
    // First update via the standard handler
    handleUpdateSectionContent(sectionId, content)

    // Check if this is a system page section
    if (currentPage?.is_system) {
      const section = currentPage.sections.find(s => s.id === sectionId)
      if (section) {
        autoSaveSystemPageSection(currentPage.id, sectionId, { content })
      }
    }
  }, [handleUpdateSectionContent, currentPage, autoSaveSystemPageSection])

  // Wrapper for grid column updates that auto-saves system page changes
  const handleGridColumnUpdateWithAutoSave = useCallback((sectionId: number, columnIndex: number, updates: any) => {
    // First update via the standard handler
    handleGridColumnUpdate(sectionId, columnIndex, updates)

    // Check if this is a system page section
    if (currentPage?.is_system) {
      const section = currentPage.sections.find(s => s.id === sectionId)
      if (section) {
        // The grid column update changes the section content
        const updatedContent = { ...section.content }
        if (updatedContent.columns && updatedContent.columns[columnIndex]) {
          updatedContent.columns[columnIndex] = { ...updatedContent.columns[columnIndex], ...updates }
        }
        autoSaveSystemPageSection(currentPage.id, sectionId, { content: updatedContent })
      }
    }
  }, [handleGridColumnUpdate, currentPage, autoSaveSystemPageSection])

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
        section_type: data.section_type || 'standard',
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

      // Add to imported sections sidebar
      setImportedSections(prev => [...prev, sectionData])

      // Auto-expand imported category
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
        site_css: website?.site_css || '',
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
          site_css: pageData.site_css
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
    handleGridColumnUpdate: handleGridColumnUpdateWithAutoSave,
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
    handleExportSection,
    bookingType,
    bookingServices
  })

  // Publish/Unpublish handlers
  const handlePublish = async () => {
    if (!website) return

    try {
      const response = await api.publishWebsite(website.id)
      if (response.success) {
        setWebsite(response.data.website)
        websiteRef.current = response.data.website
        setIsPublished(true)
        alert('Website published successfully!')
      }
    } catch (error) {
      console.error('Failed to publish:', error)
      alert('Failed to publish website')
    }
  }

  const handleUnpublish = async () => {
    if (!website) return

    try {
      const response = await api.unpublishWebsite(website.id)
      if (response.success) {
        setWebsite(response.data.website)
        websiteRef.current = response.data.website
        setIsPublished(false)
        alert('Website unpublished')
      }
    } catch (error) {
      console.error('Failed to unpublish:', error)
      alert('Failed to unpublish website')
    }
  }

  // Custom live preview for user websites
  const handleWebsiteLivePreview = async () => {
    if (!website) {
      alert('Please create a website first.')
      return
    }

    if (!currentPage) {
      alert('No page selected. Please select a page to preview.')
      return
    }

    // Save the website first to generate preview files
    try {
      setLoading(true)

      // Prepare website data for saving
      const websiteData = {
        name: website.name || 'Untitled Website',
        site_css: website.site_css || '',
        pages: website.pages.map(page => ({
          id: page.id,
          name: page.name,
          slug: page.slug,
          is_homepage: page.is_homepage,
          order: page.order,
          meta_description: page.meta_description || '',
          page_css: page.page_css || '',
          is_system: page.is_system,
          system_type: page.system_type,
          feature_type: page.feature_type,
          sections: page.sections.map(section => ({
            id: section.id,
            type: section.type,
            content: section.content,
            order: section.order,
            is_locked: section.is_locked,
            lock_type: section.lock_type
          }))
        })),
        images: []
      }

      const response = await api.saveWebsite(website.id, websiteData)

      if (response.success && response.data.preview_url) {
        // Open the preview URL
        // Backend returns full URL to index.php, we need to replace with current page
        const baseUrl = response.data.preview_url.replace(/\/[^\/]+\.php$/, '') // Remove filename from URL
        const pageFile = currentPage.is_homepage ? 'index.php' : `${currentPage.slug}.php`
        const previewUrl = `${baseUrl}/${pageFile}`
        window.open(previewUrl, '_blank')
        setHasUnsavedChanges(false)
      } else {
        alert('Preview not available. The website was saved but preview generation failed.')
      }
    } catch (error: any) {
      console.error('Preview error:', error)
      alert('Failed to generate preview: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    } finally {
      setLoading(false)
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
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/Pagevoo_logo_500x500.png" alt="Pagevoo" className="w-[60px] h-[60px]" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Website Builder</h1>
                <p className="text-sm text-gray-600">{user?.business_name}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/my-dashboard')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm transition"
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
              <h2 className="text-4xl font-bold mb-4 text-gray-900">Welcome to Your Website Builder!</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get started by selecting a professionally designed template or create your website from scratch.
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Load Save Option */}
              <button
                onClick={async (e) => {
                  e.preventDefault()
                  const success = await loadAvailableWebsites()
                  if (success) {
                    setShowLoadWebsiteModal(true)
                  }
                }}
                disabled={loadingWebsites}
                className="bg-white border-2 border-gray-300 hover:border-[#98b290] hover:shadow-lg rounded-lg p-6 text-left transition group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 group-hover:bg-[#98b290] rounded-lg mb-4 transition">
                  {loadingWebsites ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                  ) : (
                    <svg className="w-8 h-8 text-gray-700 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Load Save</h3>
                <p className="text-gray-600 text-sm">
                  {loadingWebsites ? 'Loading...' : 'Continue working on a previously saved website'}
                </p>
              </button>

              {/* Create Blank Option */}
              <button
                onClick={handleCreateBlank}
                disabled={initializingWebsite}
                className="bg-white border-2 border-dashed border-gray-300 hover:border-[#98b290] hover:shadow-lg rounded-lg p-6 text-left transition group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 group-hover:bg-[#98b290] rounded-lg mb-4 transition">
                  <svg className="w-8 h-8 text-gray-700 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Create New</h3>
                <p className="text-gray-600 text-sm">Start with a blank canvas and build from scratch</p>
              </button>

              {/* Select Template Option */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 bg-[#98b290] rounded-lg mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Select Template</h3>
                <p className="text-gray-600 text-sm mb-4">Choose from professionally designed templates below</p>
              </div>
            </div>

            {/* Templates Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Browse Templates</h3>
                <div className="text-sm text-gray-600">
                  {templates.length} template{templates.length !== 1 ? 's' : ''} available
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="mb-6 space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates by name or description..."
                    className="w-full px-4 py-3 pl-12 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290] text-gray-900 placeholder:text-gray-400"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setShowRecommended(!showRecommended)
                      setSelectedBusinessType('all')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      showRecommended
                        ? 'bg-[#98b290] text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Recommended for {user?.business_type || 'You'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedBusinessType('all')
                      setShowRecommended(false)
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedBusinessType === 'all' && !showRecommended
                        ? 'bg-gray-800 text-white border border-gray-800 shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    All Types
                  </button>

                  {['restaurant', 'barber', 'cafe', 'gym', 'salon', 'pizza'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedBusinessType(type)
                        setShowRecommended(false)
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                        selectedBusinessType === type && !showRecommended
                          ? 'bg-gray-800 text-white border border-gray-800 shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {loadingTemplates ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#98b290]"></div>
                  <p className="mt-4 text-gray-600">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="bg-white border border-gray-300 rounded-lg p-12 text-center shadow-sm">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-xl text-gray-700 mb-2">No templates available yet</p>
                  <p className="text-gray-500">Check back later or contact support</p>
                </div>
              ) : (() => {
                // Filter templates based on search, business type, and recommended
                const filteredTemplates = templates.filter(template => {
                  // Search filter
                  const matchesSearch = !templateSearch ||
                    template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                    template.description.toLowerCase().includes(templateSearch.toLowerCase())

                  // Business type filter
                  const matchesBusinessType = selectedBusinessType === 'all' ||
                    template.business_type === selectedBusinessType

                  // Recommended filter
                  const isRecommended = !showRecommended ||
                    template.business_type === user?.business_type

                  return matchesSearch && matchesBusinessType && isRecommended
                })

                return filteredTemplates.length === 0 ? (
                  <div className="bg-white border border-gray-300 rounded-lg p-12 text-center shadow-sm">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-xl text-gray-700 mb-2">No templates found</p>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                      disabled={initializingWebsite}
                      className="bg-white border border-gray-300 hover:border-[#98b290] hover:shadow-lg rounded-lg overflow-hidden text-left transition group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Template Preview Image */}
                      <div className="w-full h-48 bg-gray-200 overflow-hidden relative">
                        {template.preview_image ? (
                          <img
                            src={getAssetUrl(template.preview_image.startsWith('template_directory/') ? template.preview_image : `storage/${template.preview_image}`)}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {/* Tier Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${
                            template.tier_category === 'trial'
                              ? 'bg-gradient-to-b from-[#a8c2a0] to-[#98b290] text-white'
                              : template.tier_category === 'brochure'
                              ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-white'
                              : template.tier_category === 'niche'
                              ? 'bg-gradient-to-b from-gray-200 to-gray-400 text-gray-900'
                              : 'bg-gradient-to-b from-yellow-300 to-yellow-500 text-gray-900'
                          }`}>
                            {template.tier_category === 'trial' && 'Trial'}
                            {template.tier_category === 'brochure' && 'Brochure'}
                            {template.tier_category === 'niche' && 'Niche'}
                            {template.tier_category === 'pro' && 'Pro'}
                          </span>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="p-4 bg-white">
                        <h4 className="font-semibold text-lg mb-1 text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                          {template.business_type}
                        </span>
                      </div>
                    </button>
                    ))}
                  </div>
                )
              })()}

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

        {/* Load Website Modal - rendered even on welcome screen */}
        <LoadWebsiteModal
          isOpen={showLoadWebsiteModal}
          onClose={() => setShowLoadWebsiteModal(false)}
          loadingWebsites={loadingWebsites}
          availableWebsites={availableWebsites}
          onLoadWebsite={handleLoadWebsiteFromModal}
          onDeleteWebsite={handleDeleteWebsite}
        />
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
        className={`h-screen flex flex-col ${theme.mainBg} ${theme.mainText} select-none`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
      {/* Compact VSCode-style Header */}
      <Header
        builderType="website"
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
        handleLoad={handleLoadFromServer}
        handleExportAsHTMLTemplate={handleExportAsHTMLTemplate}
        handleExit={handleExit}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        handleOpenEditPageModal={handleOpenEditPageModal}
        handleCopyPage={handleCopyPage}
        handleDeletePage={handleDeletePage}
        addToHistory={addToHistory as any}
        handleLivePreview={handleWebsiteLivePreview}
        setShowSourceCodeModal={setShowSourceCodeModal}
        setShowStylesheetModal={setShowStylesheetModal}
        setShowSitemapModal={setShowSitemapModal}
        setShowAddPageModal={setShowAddPageModal}
        setShowImageGallery={setShowImageGallery}
        uploadingImage={uploadingImage}
        handleImageUpload={handleImageUpload}
        setShowSectionLibraryModal={setShowSectionLibraryModal}
        setShowPageLibraryModal={setShowPageLibraryModal}
        setShowFeatureInstallModal={setShowFeatureInstallModal}
        setShowDatabaseModal={setShowDatabaseModal}
        setShowManageFeaturesModal={setShowManageFeaturesModal}
        theme={theme}
        currentTheme={currentTheme}
        onThemeChange={changeTheme}
        setShowUasManager={setShowUasManager}
        isUasInstalled={installedFeatures.includes('user_access_system')}
        setShowBookingManager={setShowBookingManager}
        isBookingInstalled={installedFeatures.includes('booking')}
        setShowVooPressSetup={setShowVooPressSetup}
        setShowVooPressDashboard={setShowVooPressDashboard}
        isVooPress={voopressStatus?.is_voopress || false}
        isVooPressInstalled={installedFeatures.includes('voopress')}
      />

      {/* Toolbar */}
      <Toolbar
        showLeftSidebar={showLeftSidebar}
        setShowLeftSidebar={setShowLeftSidebar}
        showRightSidebar={showRightSidebar}
        setShowRightSidebar={setShowRightSidebar}
        viewport={viewport}
        setViewport={setViewport}
        builderType="website"
        itemId={website.id}
      />

      {/* Published Website Banner */}
      {isPublished && website.published_at && (
        <PublishedWebsiteBanner
          website={website}
          setWebsite={setWebsite}
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
              template={website ? { ...website, pages: effectivePages } as any : { pages: effectivePages } as any}
              setCurrentPage={setCurrentPage}
              setShowCSSPanel={setShowCSSPanel}
              setShowSectionCSS={setShowSectionCSS}
              setSelectedSection={setSelectedSection}
              setShowRightSidebar={setShowRightSidebar}
              cssInspectorMode={cssInspectorMode}
              setCssInspectorMode={setCssInspectorMode}
              handleDeletePage={handleDeletePage}
              setShowAddPageModal={setShowAddPageModal}
              theme="dark"
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
              handleUpdateSectionContent={handleUpdateSectionContentWithAutoSave}
              showRowStyle={showRowStyle}
              setShowRowStyle={setShowRowStyle}
              expandedColumnIndex={expandedColumnIndex}
              setExpandedColumnIndex={setExpandedColumnIndex}
              setShowNavButtonStyleModal={setShowNavButtonStyleModal}
              theme={theme}
              onOpenGallery={() => setShowImageGallery(true)}
              onOpenBlogManager={() => setShowBlogManager(true)}
              onOpenEventsManager={() => setShowEventsManager(true)}
              onOpenBookingManager={() => setShowBookingManager(true)}
              onOpenVooPressDashboard={() => setShowVooPressDashboard(true)}
              bookingType={bookingType}
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
        onUpdateContent={handleUpdateSectionContentWithAutoSave}
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
        siteCss={website?.site_css}
        onExport={handlePageExport}
      />

      <PageLibraryModal
        isOpen={showPageLibraryModal}
        onClose={() => setShowPageLibraryModal(false)}
        onImport={handleImportPage}
      />

      {/* Save Website Modal */}
      <SaveWebsiteModal
        isOpen={showSaveWebsiteModal}
        onClose={() => {
          setShowSaveWebsiteModal(false)
          setWebsiteName('')
        }}
        websiteName={websiteName}
        setWebsiteName={setWebsiteName}
        onSave={handleSaveWithName}
        loading={loading}
      />

      {/* Load Website Modal - Now rendered on welcome screen */}
      <LoadWebsiteModal
        isOpen={showLoadWebsiteModal}
        onClose={() => setShowLoadWebsiteModal(false)}
        loadingWebsites={loadingWebsites}
        availableWebsites={availableWebsites}
        onLoadWebsite={handleLoadWebsiteFromModal}
        onDeleteWebsite={handleDeleteWebsite}
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

      {/* Blog Manager Modal */}
      {showBlogManager && (
        <BlogManager
          isOpen={showBlogManager}
          onClose={() => setShowBlogManager(false)}
          type="website"
          referenceId={user?.id || 0}
        />
      )}

      {/* Events Manager Modal */}
      {showEventsManager && (
        <EventsManager
          isOpen={showEventsManager}
          onClose={() => setShowEventsManager(false)}
          type="website"
          referenceId={user?.id || 0}
        />
      )}

      {/* Booking Manager Modal */}
      {showBookingManager && (
        <BookingManager
          isOpen={showBookingManager}
          onClose={() => setShowBookingManager(false)}
          type="website"
          referenceId={user?.id || 0}
          onBookingTypeChange={setBookingType}
          onServicesChange={loadBookingSettings}
          installedFeatures={installedFeatures}
        />
      )}

      {/* UAS Manager Modal */}
      {showUasManager && (
        <UasManager
          isOpen={showUasManager}
          onClose={() => setShowUasManager(false)}
          type="website"
          referenceId={user?.id || 0}
        />
      )}

      {/* VooPress Setup Wizard */}
      <VooPressSetupWizard
        isOpen={showVooPressSetup}
        onClose={() => setShowVooPressSetup(false)}
        onComplete={(websiteId) => {
          setShowVooPressSetup(false)
          loadVooPressStatus()
          loadWebsite(websiteId)
        }}
      />

      {/* VooPress Dashboard */}
      {voopressStatus?.is_voopress && (
        <VooPressDashboard
          isOpen={showVooPressDashboard}
          onClose={() => setShowVooPressDashboard(false)}
          websiteId={website?.id || 0}
          voopressConfig={voopressStatus?.voopress_config || {}}
          voopressTheme={voopressStatus?.voopress_theme || 'classic'}
          onConfigChange={(config) => {
            setVoopressStatus(prev => prev ? { ...prev, voopress_config: config } : null)
          }}
          onThemeChanged={async () => {
            // Reload VooPress status and website pages after theme change
            await loadVooPressStatus()
            await reloadWebsite()
          }}
          onOpenBlogManager={() => {
            setShowVooPressDashboard(false)
            setShowBlogManager(true)
          }}
          onOpenUasManager={() => {
            setShowVooPressDashboard(false)
            setShowUasManager(true)
          }}
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

      {/* Database Management Modal */}
      <DatabaseManagementModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        type="website"
        referenceId={user?.id || 0}
      />

      {/* Feature Installation Modal */}
      <FeatureInstallModal
        isOpen={showFeatureInstallModal}
        onClose={() => {
          setShowFeatureInstallModal(false)
          loadInstalledFeatures() // Reload features when modal closes
        }}
        onFeatureInstalled={async (featureType, _systemPages) => {
          // Reload features and persistent system pages from database
          // System pages are now stored independently and loaded via loadInstalledFeatures
          await loadInstalledFeatures()

          if (featureType === 'contact_form') {
            setShowContactFormModal(true)
          } else if (featureType === 'voopress') {
            // Reload VooPress status and show setup wizard
            await loadVooPressStatus()
            setShowVooPressSetup(true)
          }
        }}
        onConfigureFeature={(featureType) => {
          if (featureType === 'contact_form') {
            setShowContactFormModal(true)
          } else if (featureType === 'blog') {
            setShowBlogManager(true)
          } else if (featureType === 'events') {
            setShowEventsManager(true)
          } else if (featureType === 'user_access_system') {
            setShowUasManager(true)
          } else if (featureType === 'booking') {
            setShowBookingManager(true)
          } else if (featureType === 'voopress') {
            // Show dashboard if already set up, otherwise show wizard
            if (voopressStatus?.is_voopress) {
              setShowVooPressDashboard(true)
            } else {
              setShowVooPressSetup(true)
            }
          }
        }}
        onOpenDatabaseManagement={() => setShowDatabaseModal(true)}
        type="website"
        referenceId={user?.id || 0}
      />

      {/* Manage Features Modal */}
      {showManageFeaturesModal && (
        <ManageFeaturesModal
          onClose={async () => {
            setShowManageFeaturesModal(false)
            loadInstalledFeatures() // Reload features when modal closes
            await reloadWebsite() // Reload website to refresh system pages
          }}
          referenceId={user?.id || 0}
          referenceType="website"
          onConfigureFeature={(featureType) => {
            if (featureType === 'contact_form') {
              setShowContactFormModal(true)
            } else if (featureType === 'blog') {
              setShowBlogManager(true)
            } else if (featureType === 'events') {
              setShowEventsManager(true)
            } else if (featureType === 'user_access_system') {
              setShowUasManager(true)
            } else if (featureType === 'booking') {
              setShowBookingManager(true)
            } else if (featureType === 'voopress') {
              // Show dashboard if already set up, otherwise show wizard
              if (voopressStatus?.is_voopress) {
                setShowVooPressDashboard(true)
              } else {
                setShowVooPressSetup(true)
              }
            }
          }}
          onFeatureUninstalled={async (featureType) => {
            // Remove all sections related to this feature from all pages
            handleRemoveFeatureSections(featureType)

            // Features that have system pages need removal from database
            const featuresWithSystemPages = ['user_access_system', 'booking', 'shop', 'voopress']
            if (featuresWithSystemPages.includes(featureType)) {
              try {
                // Delete system pages from database
                await systemPageService.deleteSystemPagesForFeature(featureType)
                // Reload to refresh the persistent system pages state
                await loadInstalledFeatures()
              } catch (error) {
                console.error('Failed to delete system pages for feature:', error)
              }
            }

            // Reload VooPress status when VooPress is uninstalled
            if (featureType === 'voopress') {
              await loadVooPressStatus()
            }
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
              websiteId: user?.id || 0 // Use user ID for website
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
