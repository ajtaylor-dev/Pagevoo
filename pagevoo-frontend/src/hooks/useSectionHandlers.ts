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

interface UseSectionHandlersProps {
  template: Template | null
  setTemplate: (template: Template) => void
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage) => void
  selectedSection: TemplateSection | null
  setSelectedSection: (section: TemplateSection | null) => void
  addToHistory: (template: Template) => void
}

export const useSectionHandlers = ({
  template,
  setTemplate,
  currentPage,
  setCurrentPage,
  selectedSection,
  setSelectedSection,
  addToHistory
}: UseSectionHandlersProps) => {
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

  const handleMoveSidebar = (sectionId: number, direction: 'left' | 'right') => {
    if (!template || !currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        // Change sidebar type based on direction
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

  return {
    handleAddSection,
    handleDeleteSection,
    handleMoveSection,
    handleToggleSectionLock,
    handleMoveSidebar,
    handleUpdateSectionContent,
    handleGridColumnUpdate
  }
}
