import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { HistoryState } from '@/types/template'
import { useTemplateStore } from './templateStore'

interface HistoryStore {
  // State
  history: HistoryState[]
  historyIndex: number

  // Actions
  addToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      history: [],
      historyIndex: -1,

      // Add current state to history
      addToHistory: () => {
        const templateStore = useTemplateStore.getState()
        if (!templateStore.template) return

        const state = get()
        const newHistoryItem: HistoryState = {
          template: JSON.parse(JSON.stringify(templateStore.template)), // Deep clone
          currentPageId: templateStore.currentPage?.id || null
        }

        // Remove any history items after current index (if we're not at the end)
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(newHistoryItem)

        // Limit history to 50 items
        const limitedHistory = newHistory.slice(-50)

        set({
          history: limitedHistory,
          historyIndex: limitedHistory.length - 1
        })
      },

      // Undo to previous state
      undo: () => {
        const state = get()
        if (!state.canUndo()) return

        const newIndex = state.historyIndex - 1
        const historyItem = state.history[newIndex]

        // Restore state
        const templateStore = useTemplateStore.getState()
        templateStore.setTemplate(historyItem.template)

        // Restore current page
        if (historyItem.currentPageId) {
          const page = historyItem.template.pages.find(p => p.id === historyItem.currentPageId)
          if (page) {
            templateStore.setCurrentPage(page)
          }
        }

        set({ historyIndex: newIndex })
        templateStore.setHasUnsavedChanges(true)
      },

      // Redo to next state
      redo: () => {
        const state = get()
        if (!state.canRedo()) return

        const newIndex = state.historyIndex + 1
        const historyItem = state.history[newIndex]

        // Restore state
        const templateStore = useTemplateStore.getState()
        templateStore.setTemplate(historyItem.template)

        // Restore current page
        if (historyItem.currentPageId) {
          const page = historyItem.template.pages.find(p => p.id === historyItem.currentPageId)
          if (page) {
            templateStore.setCurrentPage(page)
          }
        }

        set({ historyIndex: newIndex })
        templateStore.setHasUnsavedChanges(true)
      },

      // Check if can undo
      canUndo: () => {
        const state = get()
        return state.historyIndex > 0
      },

      // Check if can redo
      canRedo: () => {
        const state = get()
        return state.historyIndex < state.history.length - 1
      },

      // Clear history
      clearHistory: () => set({ history: [], historyIndex: -1 })
    }),
    { name: 'HistoryStore' }
  )
)
