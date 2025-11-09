import { useEffect } from 'react'
import { api } from '@/services/api'

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

interface UseTextEditorProps {
  template: Template | null
  setTemplate: (template: Template) => void
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage) => void
  editingText: { sectionId: number; field: string; value: string } | null
  setEditingText: (editingText: { sectionId: number; field: string; value: string } | null) => void
  showCodeView: boolean
  setShowCodeView: (show: boolean) => void
  showColorPicker: boolean
  setShowColorPicker: (show: boolean) => void
  savedSelection: Range | null
  setSavedSelection: (selection: Range | null) => void
  editorHeight: number
  setEditorHeight: (height: number) => void
  isEditorFullscreen: boolean
  setIsEditorFullscreen: (fullscreen: boolean) => void
  isDraggingEditor: boolean
  setIsDraggingEditor: (dragging: boolean) => void
  tempColor: string
  setTempColor: (color: string) => void
  currentFormatting: {
    bold: boolean
    italic: boolean
    underline: boolean
    fontSize: string
    color: string
    alignment: string
  }
  setCurrentFormatting: (formatting: {
    bold: boolean
    italic: boolean
    underline: boolean
    fontSize: string
    color: string
    alignment: string
  }) => void
  showLinkModal: boolean
  setShowLinkModal: (show: boolean) => void
  linkUrl: string
  setLinkUrl: (url: string) => void
  linkText: string
  setLinkText: (text: string) => void
  showInsertImageModal: boolean
  setShowInsertImageModal: (show: boolean) => void
  imageInsertMode: 'url' | 'gallery'
  setImageInsertMode: (mode: 'url' | 'gallery') => void
  imageUrl: string
  setImageUrl: (url: string) => void
  selectedGalleryImage: string | null
  setSelectedGalleryImage: (image: string | null) => void
  selectedImage: HTMLImageElement | null
  setSelectedImage: (image: HTMLImageElement | null) => void
  imageWidth: number
  setImageWidth: (width: number) => void
  imageHeight: number
  setImageHeight: (height: number) => void
  constrainProportions: boolean
  imageAspectRatio: number
  setImageAspectRatio: (ratio: number) => void
  imageAltText: string
  setImageAltText: (text: string) => void
  imageLink: string
  setImageLink: (link: string) => void
  imageLinkTarget: '_self' | '_blank'
  setImageLinkTarget: (target: '_self' | '_blank') => void
  editorRef: React.RefObject<HTMLDivElement>
  addToHistory: (template: Template, markAsUnsaved?: boolean) => void
  updateFormattingState?: () => void
  applyColor?: (color: string) => void
}

export const useTextEditor = ({
  template,
  setTemplate,
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
  addToHistory,
  updateFormattingState,
  applyColor
}: UseTextEditorProps) => {
  // Helper function to handle inline text editing
  const handleTextEdit = (sectionId: number, field: string, value: string) => {
    if (!currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        // Handle grid columns (field format: column_0, column_1, etc.)
        if (field.startsWith('column_')) {
          const colIdx = parseInt(field.split('_')[1])
          const columns = s.content.columns || []
          const updatedColumns = [...columns]
          updatedColumns[colIdx] = { ...updatedColumns[colIdx], content: value }

          return {
            ...s,
            content: {
              ...s.content,
              columns: updatedColumns
            }
          }
        }

        // Handle regular content fields
        return {
          ...s,
          content: {
            ...s.content,
            [field]: value
          }
        }
      }
      return s
    })

    const updatedPages = template!.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    setTemplate({ ...template!, pages: updatedPages })
    setCurrentPage({ ...currentPage, sections: updatedSections })
  }

  const handleOpenTextEditor = (sectionId: number, field: string, currentValue: string) => {
    // Reset editor ref so it reinitializes with new content
    editorRef.current = null

    setEditingText({ sectionId, field, value: currentValue })
    setShowCodeView(false)

    // Wait for editor to render, then update formatting state
    setTimeout(() => {
      updateFormattingState?.()
    }, 50)
  }

  const handleTextEditorChange = (newValue: string) => {
    if (!editingText) return
    setEditingText({ ...editingText, value: newValue })
    handleTextEdit(editingText.sectionId, editingText.field, newValue)
  }

  const handleCloseTextEditor = () => {
    // Save current template state to history when closing editor
    // This captures all changes made during the editing session
    if (template) {
      addToHistory(template)
    }

    setEditingText(null)
    setShowCodeView(false)
    setShowColorPicker(false)
    setSavedSelection(null)
    setEditorHeight(300)
    setIsEditorFullscreen(false)
  }

  // Handle editor resize drag
  const handleEditorDragStart = (e: React.MouseEvent) => {
    setIsDraggingEditor(true)
    e.preventDefault()
  }

  const handleEditorDrag = (e: MouseEvent) => {
    if (!isDraggingEditor) return

    const newHeight = window.innerHeight - e.clientY
    if (newHeight >= 200 && newHeight <= window.innerHeight - 100) {
      setEditorHeight(newHeight)
    }
  }

  const handleEditorDragEnd = () => {
    setIsDraggingEditor(false)
  }

  // Toggle fullscreen
  const toggleEditorFullscreen = () => {
    if (isEditorFullscreen) {
      setEditorHeight(300)
      setIsEditorFullscreen(false)
    } else {
      setEditorHeight(window.innerHeight - 100)
      setIsEditorFullscreen(true)
    }
  }

  // Add/remove mouse event listeners for dragging
  useEffect(() => {
    if (isDraggingEditor) {
      window.addEventListener('mousemove', handleEditorDrag)
      window.addEventListener('mouseup', handleEditorDragEnd)
    } else {
      window.removeEventListener('mousemove', handleEditorDrag)
      window.removeEventListener('mouseup', handleEditorDragEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleEditorDrag)
      window.removeEventListener('mouseup', handleEditorDragEnd)
    }
  }, [isDraggingEditor])

  // Save current selection
  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange())
    }
  }

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelection && editorRef.current) {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedSelection)
      }
    }
  }

  // Open color picker and save selection
  const handleOpenColorPicker = () => {
    saveSelection()
    setTempColor(currentFormatting.color)
    setShowColorPicker(true)
  }

  // Apply color from picker
  const handleApplyColorFromPicker = () => {
    restoreSelection()
    applyColor(tempColor)
    setShowColorPicker(false)
  }

  // Open link modal
  const handleOpenLinkModal = () => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const selectedText = selection.toString()

    // Check if selection is inside a link
    let element = selection.anchorNode
    while (element && element !== editorRef.current) {
      if (element.nodeName === 'A') {
        const linkElement = element as HTMLAnchorElement
        setLinkUrl(linkElement.href)
        setLinkText(linkElement.textContent || '')
        break
      }
      element = element.parentNode
    }

    // If not editing existing link, use selected text
    if (!element || element === editorRef.current) {
      setLinkUrl('')
      setLinkText(selectedText)
    }

    saveSelection()
    setShowLinkModal(true)
  }

  // Apply link
  const handleApplyLink = () => {
    if (!linkUrl) return

    restoreSelection()

    if (!editorRef.current) return
    editorRef.current.focus()

    // If there's link text and no selection, insert the text first
    const selection = window.getSelection()
    if (selection && linkText && selection.toString() === '') {
      document.execCommand('insertText', false, linkText)
      // Select the inserted text
      const range = document.createRange()
      const textNode = selection.anchorNode
      if (textNode) {
        range.setStart(textNode, (selection.anchorOffset || 0) - linkText.length)
        range.setEnd(textNode, selection.anchorOffset || 0)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }

    // Create the link
    document.execCommand('createLink', false, linkUrl)

    setTimeout(() => {
      if (editorRef.current) {
        handleTextEditorChange(editorRef.current.innerHTML)
      }
    }, 10)

    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
  }

  // Remove link
  const handleRemoveLink = () => {
    restoreSelection()

    if (!editorRef.current) return
    editorRef.current.focus()

    document.execCommand('unlink')

    setTimeout(() => {
      if (editorRef.current) {
        handleTextEditorChange(editorRef.current.innerHTML)
      }
    }, 10)

    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
  }

  // Open insert image modal
  const handleOpenInsertImageModal = () => {
    saveSelection()
    setImageInsertMode('url')
    setImageUrl('')
    setSelectedGalleryImage(null)
    setShowInsertImageModal(true)
  }

  // Insert image from URL or gallery
  const handleInsertImage = () => {
    const imgSrc = imageInsertMode === 'url' ? imageUrl : selectedGalleryImage

    if (!imgSrc) {
      alert('Please provide an image URL or select from gallery')
      return
    }

    restoreSelection()

    if (!editorRef.current) return
    editorRef.current.focus()

    // Insert image using execCommand
    const img = `<img src="${imgSrc}" alt="Inserted image" style="max-width: 100%; height: auto;" />`
    document.execCommand('insertHTML', false, img)

    setTimeout(() => {
      if (editorRef.current) {
        handleTextEditorChange(editorRef.current.innerHTML)
      }
    }, 10)

    setShowInsertImageModal(false)
    setImageUrl('')
    setSelectedGalleryImage(null)
  }

  // Handle paste event for images
  const handleEditorPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    // Check if clipboard contains an image
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault() // Prevent default paste behavior

        const file = items[i].getAsFile()
        if (!file || !template) return

        try {
          // Auto-save template if needed
          let templateId = template.id
          if (templateId === 0) {
            alert('Please save the template before pasting images.')
            return
          }

          // Show loading indicator
          alert('Uploading image...')

          // Upload the image to gallery
          const response = await api.uploadGalleryImage(templateId, file)

          if (response.success && response.data) {
            // Insert the uploaded image at cursor position
            const imageUrl = `http://localhost:8000/${response.data.path}`

            if (editorRef.current) {
              editorRef.current.focus()

              // Insert image at cursor
              const img = `<img src="${imageUrl}" alt="Pasted image" style="max-width: 100%; height: auto;" />`
              document.execCommand('insertHTML', false, img)

              setTimeout(() => {
                if (editorRef.current) {
                  handleTextEditorChange(editorRef.current.innerHTML)
                }
              }, 10)

              // Refresh template to show new image in gallery
              if (response.data) {
                setTemplate({
                  ...template,
                  images: [...(template.images || []), response.data]
                })
              }

              alert('Image uploaded and inserted!')
            }
          }
        } catch (error) {
          console.error('Error uploading pasted image:', error)
          alert('Failed to upload image')
        }

        break
      }
    }
  }

  // Handle image click in editor
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement
      setSelectedImage(img)

      // Get current dimensions
      const width = img.width || img.naturalWidth
      const height = img.height || img.naturalHeight
      setImageWidth(width)
      setImageHeight(height)

      // Calculate aspect ratio
      const aspectRatio = width / height
      setImageAspectRatio(aspectRatio)

      // Get current alt text
      setImageAltText(img.alt || '')

      // Check if image is wrapped in a link
      const parentLink = img.parentElement
      if (parentLink && parentLink.tagName === 'A') {
        setImageLink((parentLink as HTMLAnchorElement).href)
        setImageLinkTarget((parentLink as HTMLAnchorElement).target as '_self' | '_blank' || '_self')
      } else {
        setImageLink('')
        setImageLinkTarget('_self')
      }

      // Add selected class for visual feedback
      const allImages = editorRef.current?.querySelectorAll('img')
      allImages?.forEach(i => i.classList.remove('selected-image'))
      img.classList.add('selected-image')
    } else {
      // Deselect image if clicking elsewhere
      setSelectedImage(null)
      setImageAltText('')
      setImageLink('')
      setImageLinkTarget('_self')
      const allImages = editorRef.current?.querySelectorAll('img')
      allImages?.forEach(i => i.classList.remove('selected-image'))
    }
  }

  // Handle width change
  const handleWidthChange = (value: number) => {
    setImageWidth(value)
    if (constrainProportions) {
      const newHeight = Math.round(value / imageAspectRatio)
      setImageHeight(newHeight)
    }
  }

  // Handle height change
  const handleHeightChange = (value: number) => {
    setImageHeight(value)
    if (constrainProportions) {
      const newWidth = Math.round(value * imageAspectRatio)
      setImageWidth(newWidth)
    }
  }

  return {
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
  }
}
