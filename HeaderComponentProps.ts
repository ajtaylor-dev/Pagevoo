// Complete TypeScript Interface for Header Component
// Extracted from TemplateBuilder.tsx lines 4472-5059 (587 lines)

import React from 'react'

// Assumed existing types from your codebase
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

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface User {
  name: string
  // ... other user properties
}

// ============================================
// HEADER COMPONENT PROPS INTERFACE
// ============================================

export interface HeaderComponentProps {
  // ===== MENU VISIBILITY STATES (4) =====
  showFileMenu: boolean
  setShowFileMenu: (value: boolean) => void
  
  showEditMenu: boolean
  setShowEditMenu: (value: boolean) => void
  
  showInsertMenu: boolean
  setShowInsertMenu: (value: boolean) => void
  
  showViewMenu: boolean
  setShowViewMenu: (value: boolean) => void

  // ===== EDIT MENU TAB STATE (1) =====
  editSubTab: 'settings' | 'css' | 'page'
  setEditSubTab: (tab: 'settings' | 'css' | 'page') => void

  // ===== MODAL/PANEL VISIBILITY STATES (7) =====
  showAddPageModal: boolean
  setShowAddPageModal: (value: boolean) => void
  
  showEditPageModal: boolean
  setShowEditPageModal: (value: boolean) => void
  
  showSourceCodeModal: boolean
  setShowSourceCodeModal: (value: boolean) => void
  
  showStylesheetModal: boolean
  setShowStylesheetModal: (value: boolean) => void
  
  showSitemapModal: boolean
  setShowSitemapModal: (value: boolean) => void
  
  showImageGallery: boolean
  setShowImageGallery: (value: boolean | ((prev: boolean) => boolean)) => void
  
  uploadingImage: boolean
  setUploadingImage: (value: boolean) => void

  // ===== UNDO/REDO STATES (2) =====
  canUndo: boolean
  canRedo: boolean

  // ===== CHANGE TRACKING (1) =====
  hasUnsavedChanges: boolean

  // ===== DATA STATES (2) =====
  template: Template
  setTemplate: (template: Template) => void
  
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage | null) => void

  // ===== FORM INPUT STATES (4) =====
  newPageName: string
  setNewPageName: (value: string) => void
  
  editPageName: string
  setEditPageName: (value: string) => void
  
  editPageSlug: string
  setEditPageSlug: (value: string) => void
  
  editPageMetaDescription: string
  setEditPageMetaDescription: (value: string) => void

  // ===== REFS (6) =====
  fileMenuRef: React.RefObject<HTMLDivElement>
  editMenuRef: React.RefObject<HTMLDivElement>
  insertMenuRef: React.RefObject<HTMLDivElement>
  viewMenuRef: React.RefObject<HTMLDivElement>
  templateRef: React.RefObject<Template | null>
  imageGalleryRef: React.RefObject<boolean>

  // ===== FILE MENU HANDLERS (6) =====
  handleNew: () => void
  handleSave: () => Promise<void>
  handleSaveAs: () => Promise<void>
  handleLoad: () => Promise<void>
  handleExportAsHTMLTemplate: () => Promise<void>
  handleExit: () => void

  // ===== EDIT MENU HANDLERS (6) =====
  handleUndo: () => void
  handleRedo: () => void
  handleOpenEditPageModal: () => void
  handleSaveEditPage: () => void
  handleCopyPage: () => void
  handleDeletePage: (pageId: number) => void

  // ===== OTHER HANDLERS (3) =====
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleLivePreview: () => void
  addToHistory: (newTemplate: Template, markAsUnsaved?: boolean) => void

  // ===== OTHER DEPENDENCIES =====
  user: User | null | undefined
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
import { HeaderComponentProps, Header } from '@/components/Header'

export function TemplateBuilder() {
  // States
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [editSubTab, setEditSubTab] = useState<'settings' | 'css' | 'page'>('settings')
  
  // ... all other state declarations
  
  // Refs
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const editMenuRef = useRef<HTMLDivElement>(null)
  const insertMenuRef = useRef<HTMLDivElement>(null)
  const viewMenuRef = useRef<HTMLDivElement>(null)
  const templateRef = useRef<Template | null>(null)
  const imageGalleryRef = useRef(false)
  
  // ... handler functions
  
  const headerProps: HeaderComponentProps = {
    // Menu visibility
    showFileMenu,
    setShowFileMenu,
    showEditMenu,
    setShowEditMenu,
    showInsertMenu,
    setShowInsertMenu,
    showViewMenu,
    setShowViewMenu,
    
    // Edit tab
    editSubTab,
    setEditSubTab,
    
    // Modal states
    showAddPageModal,
    setShowAddPageModal,
    showEditPageModal,
    setShowEditPageModal,
    showSourceCodeModal,
    setShowSourceCodeModal,
    showStylesheetModal,
    setShowStylesheetModal,
    showSitemapModal,
    setShowSitemapModal,
    showImageGallery,
    setShowImageGallery,
    uploadingImage,
    setUploadingImage,
    
    // Undo/Redo
    canUndo,
    canRedo,
    
    // Change tracking
    hasUnsavedChanges,
    
    // Data
    template,
    setTemplate,
    currentPage,
    setCurrentPage,
    
    // Form inputs
    newPageName,
    setNewPageName,
    editPageName,
    setEditPageName,
    editPageSlug,
    setEditPageSlug,
    editPageMetaDescription,
    setEditPageMetaDescription,
    
    // Refs
    fileMenuRef,
    editMenuRef,
    insertMenuRef,
    viewMenuRef,
    templateRef,
    imageGalleryRef,
    
    // Handlers
    handleNew,
    handleSave,
    handleSaveAs,
    handleLoad,
    handleExportAsHTMLTemplate,
    handleExit,
    handleUndo,
    handleRedo,
    handleOpenEditPageModal,
    handleSaveEditPage,
    handleCopyPage,
    handleDeletePage,
    handleImageUpload,
    handleLivePreview,
    addToHistory,
    
    // User
    user,
  }
  
  return <Header {...headerProps} />
}
*/

// ============================================
// COMPONENT STRUCTURE
// ============================================

/*
Header Component Sections:
1. Left Section
   - Logo
   - File Menu (with Export As submenu)
   - Edit Menu (with 3 tabs: Settings, CSS, Page)
   - View Menu
   - Insert Menu
   - Help Menu (placeholder)
   - Undo/Redo Toolbar Buttons

2. Center Section
   - Template Name Input (editable)

3. Right Section
   - Preview Button
   - User Name Display

Additional Components:
- StyleEditor (embedded in Edit Menu CSS tab)
*/
