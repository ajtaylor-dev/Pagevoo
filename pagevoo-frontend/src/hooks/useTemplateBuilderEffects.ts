import { useEffect } from 'react'
import { api } from '@/services/api'
import { generatePageHTML as genPageHTML, generateStylesheet as genStylesheet } from '../utils/htmlCssGenerator'

interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: any[]
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
}

interface UseTemplateBuilderEffectsProps {
  templateRef: React.MutableRefObject<Template | null>
  template: Template | null
  setTemplate: (template: Template) => void
  templateId: string | null
  setCurrentPage: (page: TemplatePage) => void
  setLoading: (loading: boolean) => void
  setHistory: (history: Template[]) => void
  setHistoryIndex: (index: number) => void
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setIsPublished: (published: boolean) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  canUndo: boolean
  canRedo: boolean
  hasUnsavedChanges: boolean
  handleNew: () => void
  handleSave: () => void
  handleUndo: () => void
  handleRedo: () => void
  handleLoad: () => void
  showFileMenu: boolean
  setShowFileMenu: (show: boolean) => void
  showEditMenu: boolean
  setShowEditMenu: (show: boolean) => void
  showInsertMenu: boolean
  setShowInsertMenu: (show: boolean) => void
  showViewMenu: boolean
  setShowViewMenu: (show: boolean) => void
  fileMenuRef: React.RefObject<HTMLDivElement>
  editMenuRef: React.RefObject<HTMLDivElement>
  insertMenuRef: React.RefObject<HTMLDivElement>
  viewMenuRef: React.RefObject<HTMLDivElement>
  selectedSection: any
  setShowSectionCSS: (show: boolean) => void
  currentPage: TemplatePage | null
  showSourceCodeModal: boolean
  setEditableHTML: (html: string) => void
  showStylesheetModal: boolean
  setEditableCSS: (css: string) => void
}

export const useTemplateBuilderEffects = ({
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
}: UseTemplateBuilderEffectsProps) => {

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

  // Dynamically update HTML when template/page changes
  useEffect(() => {
    if (currentPage && showSourceCodeModal) {
      const generatedHTML = genPageHTML(currentPage)
      setEditableHTML(generatedHTML)
    }
  }, [currentPage, currentPage?.sections, JSON.stringify(currentPage?.sections?.map(s => ({ id: s.id, section_id: s.section_id, section_name: s.section_name }))), showSourceCodeModal])

  // Dynamically update CSS when template/page changes
  useEffect(() => {
    if (currentPage && template && showStylesheetModal) {
      const generatedCSS = genStylesheet(currentPage, template)
      setEditableCSS(generatedCSS)
    }
  }, [currentPage, currentPage?.sections, JSON.stringify(currentPage?.sections?.map(s => ({ id: s.id, section_id: s.section_id, section_name: s.section_name }))), template?.custom_css, currentPage?.page_css, showStylesheetModal])
}
