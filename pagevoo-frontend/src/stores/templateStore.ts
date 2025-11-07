import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Template, TemplatePage } from '@/types/template'

interface TemplateStore {
  // State
  template: Template | null
  currentPage: TemplatePage | null
  hasUnsavedChanges: boolean
  isPublished: boolean

  // Actions
  setTemplate: (template: Template | null) => void
  setCurrentPage: (page: TemplatePage | null) => void
  setHasUnsavedChanges: (has: boolean) => void
  setIsPublished: (published: boolean) => void

  // Complex actions
  updateTemplate: (updates: Partial<Template>) => void
  updateCurrentPage: (updates: Partial<TemplatePage>) => void
  updatePage: (pageId: number, updates: Partial<TemplatePage>) => void
  addPage: (page: TemplatePage) => void
  deletePage: (pageId: number) => void
  reorderPages: (fromIndex: number, toIndex: number) => void
}

export const useTemplateStore = create<TemplateStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      template: null,
      currentPage: null,
      hasUnsavedChanges: false,
      isPublished: false,

      // Simple setters
      setTemplate: (template) => set({ template }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setHasUnsavedChanges: (has) => set({ hasUnsavedChanges: has }),
      setIsPublished: (published) => set({ isPublished: published }),

      // Update template
      updateTemplate: (updates) => set((state) => ({
        template: state.template ? { ...state.template, ...updates } : null,
        hasUnsavedChanges: true
      })),

      // Update current page
      updateCurrentPage: (updates) => set((state) => {
        if (!state.currentPage || !state.template) return state

        const updatedPage = { ...state.currentPage, ...updates }
        const updatedPages = state.template.pages.map(p =>
          p.id === updatedPage.id ? updatedPage : p
        )

        return {
          currentPage: updatedPage,
          template: { ...state.template, pages: updatedPages },
          hasUnsavedChanges: true
        }
      }),

      // Update any page
      updatePage: (pageId, updates) => set((state) => {
        if (!state.template) return state

        const updatedPages = state.template.pages.map(p =>
          p.id === pageId ? { ...p, ...updates } : p
        )

        const newState: any = {
          template: { ...state.template, pages: updatedPages },
          hasUnsavedChanges: true
        }

        // Update currentPage if it's the one being updated
        if (state.currentPage?.id === pageId) {
          newState.currentPage = updatedPages.find(p => p.id === pageId) || state.currentPage
        }

        return newState
      }),

      // Add page
      addPage: (page) => set((state) => {
        if (!state.template) return state

        return {
          template: {
            ...state.template,
            pages: [...state.template.pages, page]
          },
          hasUnsavedChanges: true
        }
      }),

      // Delete page
      deletePage: (pageId) => set((state) => {
        if (!state.template) return state

        const updatedPages = state.template.pages.filter(p => p.id !== pageId)

        return {
          template: { ...state.template, pages: updatedPages },
          currentPage: state.currentPage?.id === pageId ? null : state.currentPage,
          hasUnsavedChanges: true
        }
      }),

      // Reorder pages
      reorderPages: (fromIndex, toIndex) => set((state) => {
        if (!state.template) return state

        const pages = [...state.template.pages]
        const [removed] = pages.splice(fromIndex, 1)
        pages.splice(toIndex, 0, removed)

        // Update order property
        const reorderedPages = pages.map((p, index) => ({
          ...p,
          order: index
        }))

        return {
          template: { ...state.template, pages: reorderedPages },
          hasUnsavedChanges: true
        }
      })
    }),
    { name: 'TemplateStore' }
  )
)
