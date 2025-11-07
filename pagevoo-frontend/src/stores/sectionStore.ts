import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TemplateSection } from '@/types/template'
import { useTemplateStore } from './templateStore'

interface SectionStore {
  // State
  selectedSection: TemplateSection | null
  draggedSection: TemplateSection | null

  // Actions
  selectSection: (section: TemplateSection | null) => void
  setDraggedSection: (section: TemplateSection | null) => void

  // CRUD operations (modifies current page sections)
  addSection: (section: TemplateSection) => void
  updateSection: (sectionId: number, updates: Partial<TemplateSection>) => void
  updateSectionContent: (sectionId: number, newContent: any) => void
  deleteSection: (sectionId: number) => void
  duplicateSection: (sectionId: number) => void
  moveSection: (fromIndex: number, toIndex: number) => void
  lockSection: (sectionId: number) => void
  unlockSection: (sectionId: number) => void
}

export const useSectionStore = create<SectionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedSection: null,
      draggedSection: null,

      // Simple setters
      selectSection: (section) => set({ selectedSection: section }),
      setDraggedSection: (section) => set({ draggedSection: section }),

      // Add section to current page
      addSection: (section) => {
        const currentPage = useTemplateStore.getState().currentPage
        if (!currentPage) return

        const updatedSections = [...currentPage.sections, section]
        useTemplateStore.getState().updateCurrentPage({ sections: updatedSections })
      },

      // Update section
      updateSection: (sectionId, updates) => {
        const currentPage = useTemplateStore.getState().currentPage
        if (!currentPage) return

        const updatedSections = currentPage.sections.map(s =>
          s.id === sectionId ? { ...s, ...updates } : s
        )

        useTemplateStore.getState().updateCurrentPage({ sections: updatedSections })

        // Update selected section if it's the one being modified
        const state = get()
        if (state.selectedSection?.id === sectionId) {
          set({ selectedSection: updatedSections.find(s => s.id === sectionId) || null })
        }
      },

      // Update section content specifically
      updateSectionContent: (sectionId, newContent) => {
        const currentPage = useTemplateStore.getState().currentPage
        if (!currentPage) return

        const updatedSections = currentPage.sections.map(s =>
          s.id === sectionId ? { ...s, content: newContent } : s
        )

        useTemplateStore.getState().updateCurrentPage({ sections: updatedSections })

        // Update selected section
        const state = get()
        if (state.selectedSection?.id === sectionId) {
          set({ selectedSection: { ...state.selectedSection, content: newContent } })
        }
      },

      // Delete section
      deleteSection: (sectionId) => {
        const currentPage = useTemplateStore.getState().currentPage
        if (!currentPage) return

        const updatedSections = currentPage.sections.filter(s => s.id !== sectionId)
        useTemplateStore.getState().updateCurrentPage({ sections: updatedSections })

        // Clear selection if deleted
        const state = get()
        if (state.selectedSection?.id === sectionId) {
          set({ selectedSection: null })
        }
      },

      // Duplicate section
      duplicateSection: (sectionId) => {
        const currentPage = useTemplateStore.getState().currentPage
        if (!currentPage) return

        const sectionToDupe = currentPage.sections.find(s => s.id === sectionId)
        if (!sectionToDupe) return

        const maxId = Math.max(...currentPage.sections.map(s => s.id), 0)
        const duplicated: TemplateSection = {
          ...sectionToDupe,
          id: maxId + 1,
          order: currentPage.sections.length,
          section_name: sectionToDupe.section_name ? `${sectionToDupe.section_name} (copy)` : undefined
        }

        const updatedSections = [...currentPage.sections, duplicated]
        useTemplateStore.getState().updateCurrentPage({ sections: updatedSections })
      },

      // Move section (reorder)
      moveSection: (fromIndex, toIndex) => {
        const currentPage = useTemplateStore.getState().currentPage
        if (!currentPage) return

        const sections = [...currentPage.sections]
        const [removed] = sections.splice(fromIndex, 1)
        sections.splice(toIndex, 0, removed)

        // Update order property
        const reorderedSections = sections.map((s, index) => ({
          ...s,
          order: index
        }))

        useTemplateStore.getState().updateCurrentPage({ sections: reorderedSections })
      },

      // Lock section
      lockSection: (sectionId) => {
        get().updateSection(sectionId, { is_locked: true })
      },

      // Unlock section
      unlockSection: (sectionId) => {
        get().updateSection(sectionId, { is_locked: false })
      }
    }),
    { name: 'SectionStore' }
  )
)
