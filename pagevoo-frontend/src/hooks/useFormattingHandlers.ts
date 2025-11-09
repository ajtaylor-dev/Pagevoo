import { RefObject } from 'react'

interface FormattingState {
  bold: boolean
  italic: boolean
  underline: boolean
  fontSize: string
  color: string
  alignment: string
}

interface UseFormattingHandlersProps {
  editorRef: RefObject<HTMLDivElement>
  selectedImage: HTMLImageElement | null
  setCurrentFormatting: (formatting: FormattingState) => void
  handleTextEditorChange: (html: string) => void
  applyImageAlignment: (command: string) => void
}

export const useFormattingHandlers = ({
  editorRef,
  selectedImage,
  setCurrentFormatting,
  handleTextEditorChange,
  applyImageAlignment
}: UseFormattingHandlersProps) => {

  // Convert RGB to Hex
  const rgbToHex = (rgb: string): string => {
    if (rgb.startsWith('#')) return rgb

    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    if (!match) return '#000000'

    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])

    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  // Update formatting state based on current selection
  const updateFormattingState = () => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    let element = range.commonAncestorContainer as HTMLElement

    // If text node, get parent element
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement as HTMLElement
    }

    // Check formatting
    const bold = document.queryCommandState('bold')
    const italic = document.queryCommandState('italic')
    const underline = document.queryCommandState('underline')

    // Get computed styles
    const computedStyle = window.getComputedStyle(element)
    const fontSize = computedStyle.fontSize
    const color = rgbToHex(computedStyle.color)

    // Get alignment
    const alignment = element.style.textAlign || computedStyle.textAlign || 'left'

    setCurrentFormatting({
      bold,
      italic,
      underline,
      fontSize,
      color,
      alignment
    })
  }

  // Modern formatting functions for WYSIWYG editor
  const applyFormatting = (command: string, value?: string) => {
    if (!editorRef.current) return

    // Check if an image is selected and handle image alignment
    if (selectedImage && (command === 'justifyLeft' || command === 'justifyCenter' || command === 'justifyRight')) {
      applyImageAlignment(command)
      return
    }

    // Focus editor first
    editorRef.current.focus()

    // Small delay to ensure focus is set before executing command
    setTimeout(() => {
      if (!editorRef.current) return

      document.execCommand(command, false, value)

      // Trigger update to sync with canvas
      setTimeout(() => {
        if (editorRef.current) {
          handleTextEditorChange(editorRef.current.innerHTML)
          updateFormattingState()
        }
      }, 10)
    }, 10)
  }

  const applyFontSize = (size: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    editorRef.current.focus()

    // Use execCommand with fontSize, then replace with proper styles
    document.execCommand('fontSize', false, '7')

    setTimeout(() => {
      if (editorRef.current) {
        // Replace all font tags with styled spans
        const fontTags = editorRef.current.querySelectorAll('font[size="7"]')
        fontTags.forEach(font => {
          const span = document.createElement('span')
          span.style.fontSize = size
          span.innerHTML = font.innerHTML
          font.replaceWith(span)
        })

        handleTextEditorChange(editorRef.current.innerHTML)
        updateFormattingState()
      }
    }, 10)
  }

  const applyColor = (color: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    editorRef.current.focus()

    // Use foreColor first
    document.execCommand('foreColor', false, color)

    // Then ensure it's applied with inline styles by wrapping in span
    setTimeout(() => {
      if (editorRef.current) {
        // Find all font tags and convert to spans with color style
        const fontTags = editorRef.current.querySelectorAll('font[color]')
        fontTags.forEach(font => {
          const span = document.createElement('span')
          span.style.color = font.getAttribute('color') || color
          span.innerHTML = font.innerHTML
          font.replaceWith(span)
        })

        handleTextEditorChange(editorRef.current.innerHTML)
        updateFormattingState()
      }
    }, 10)
  }

  return {
    applyFormatting,
    applyFontSize,
    applyColor,
    updateFormattingState,
    rgbToHex
  }
}
