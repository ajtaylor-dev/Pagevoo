import { generateIdentifier } from '../utils/helpers'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
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
  pages: TemplatePage[]
  global_css?: string
  global_fonts?: string[]
  favicon?: string
  navigation?: any
  footer?: any
}

interface UsePageHandlersProps {
  template: Template | null
  setTemplate: (template: Template) => void
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage | null) => void
  newPageName: string
  setNewPageName: (name: string) => void
  setShowAddPageModal: (show: boolean) => void
  editPageName: string
  setEditPageName: (name: string) => void
  editPageSlug: string
  setEditPageSlug: (slug: string) => void
  editPageMetaDescription: string
  setEditPageMetaDescription: (desc: string) => void
  setShowEditPageModal: (show: boolean) => void
  setShowEditMenu: (show: boolean) => void
  setShowInsertMenu: (show: boolean) => void
  addToHistory: (newTemplate: Template, markAsUnsaved?: boolean) => void
}

export const usePageHandlers = ({
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
}: UsePageHandlersProps) => {

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

  return {
    handleAddPage,
    handleDeletePage,
    handleMovePage,
    handleSetHomepage,
    handleOpenEditPageModal,
    handleSaveEditPage,
    handleCopyPage,
    handleAddPageFromTemplate
  }
}
