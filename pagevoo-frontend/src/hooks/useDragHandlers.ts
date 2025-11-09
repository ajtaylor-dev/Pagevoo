import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
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

interface UseDragHandlersProps {
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage) => void
  template: Template | null
  setTemplate: (template: Template) => void
  setActiveId: (id: string | null) => void
  setActiveDragData: (data: any) => void
  setOverId: (id: string | null) => void
  addToHistory: (template: Template) => void
  setSelectedSection: (section: TemplateSection | null) => void
}

export const useDragHandlers = ({
  currentPage,
  setCurrentPage,
  template,
  setTemplate,
  setActiveId,
  setActiveDragData,
  setOverId,
  addToHistory,
  setSelectedSection
}: UseDragHandlersProps) => {
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

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel
  }
}
