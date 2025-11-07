import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIStore {
  // Panel states
  showCSSPanel: boolean
  showImageGallery: boolean

  // Modal states
  showNavButtonStyleModal: boolean
  showAddSectionModal: boolean

  // CSS Inspector
  showCSSInspector: boolean
  cssInspectorTimeout: number | null

  // Other UI state
  isDragging: boolean

  // Actions
  setShowCSSPanel: (show: boolean) => void
  setShowImageGallery: (show: boolean) => void
  setShowNavButtonStyleModal: (show: boolean) => void
  setShowAddSectionModal: (show: boolean) => void
  setShowCSSInspector: (show: boolean) => void
  setCSSInspectorTimeout: (timeout: number | null) => void
  setIsDragging: (isDragging: boolean) => void

  // Complex actions
  toggleCSSPanel: () => void
  toggleImageGallery: () => void
  closeAllModals: () => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      showCSSPanel: false,
      showImageGallery: false,
      showNavButtonStyleModal: false,
      showAddSectionModal: false,
      showCSSInspector: false,
      cssInspectorTimeout: null,
      isDragging: false,

      // Simple setters
      setShowCSSPanel: (show) => set({ showCSSPanel: show }),
      setShowImageGallery: (show) => set({ showImageGallery: show }),
      setShowNavButtonStyleModal: (show) => set({ showNavButtonStyleModal: show }),
      setShowAddSectionModal: (show) => set({ showAddSectionModal: show }),
      setShowCSSInspector: (show) => set({ showCSSInspector: show }),
      setCSSInspectorTimeout: (timeout) => set({ cssInspectorTimeout: timeout }),
      setIsDragging: (isDragging) => set({ isDragging: isDragging }),

      // Toggles
      toggleCSSPanel: () => set((state) => ({ showCSSPanel: !state.showCSSPanel })),
      toggleImageGallery: () => set((state) => ({ showImageGallery: !state.showImageGallery })),

      // Close all modals
      closeAllModals: () => set({
        showNavButtonStyleModal: false,
        showAddSectionModal: false,
        showCSSPanel: false,
        showImageGallery: false
      })
    }),
    { name: 'UIStore' }
  )
)
