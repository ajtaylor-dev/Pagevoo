import type { Template, TemplatePage } from '../types/template'

interface UseCodeHandlersProps {
  template: Template | null
  setTemplate: (template: Template) => void
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage) => void
  editableHTML: string
  editableCSS: string
  setIsEditingHTML: (editing: boolean) => void
  setIsEditingCSS: (editing: boolean) => void
  addToHistory: (newTemplate: Template, markAsUnsaved?: boolean) => void
}

export const useCodeHandlers = ({
  template,
  setTemplate,
  currentPage,
  setCurrentPage,
  editableHTML,
  editableCSS,
  setIsEditingHTML,
  setIsEditingCSS,
  addToHistory
}: UseCodeHandlersProps) => {

  const handleApplyHTMLChanges = () => {
    if (!currentPage || !template) return

    // Show confirmation dialog
    if (!confirm('Applying HTML changes will update your template structure. This may cause issues with the template builder if structural elements have been modified. Continue?')) {
      return
    }

    try {
      // For now, we'll implement a simplified parsing that extracts text content from columns
      // A full HTML parser would be more complex and is beyond the current scope

      // Parse the edited HTML to extract section content
      const parser = new DOMParser()
      const doc = parser.parseFromString(editableHTML, 'text/html')

      // Find all sections in the parsed HTML
      const sections = doc.querySelectorAll('section')

      // Update sections in currentPage
      const updatedSections = currentPage.sections.map((section, idx) => {
        const sectionElement = sections[idx]
        if (!sectionElement) return section

        // Update text content in columns for grid sections
        if (section.type.startsWith('grid-')) {
          const columns = sectionElement.querySelectorAll('[class*="col-"]')
          const updatedColumns = (section.content?.columns || []).map((col: any, colIdx: number) => {
            const columnElement = columns[colIdx]
            if (columnElement) {
              return {
                ...col,
                content: columnElement.innerHTML.trim()
              }
            }
            return col
          })

          return {
            ...section,
            content: {
              ...section.content,
              columns: updatedColumns
            }
          }
        }

        // Handle other section types (hero, etc.)
        // Extract text from heading and paragraph
        const heading = sectionElement.querySelector('h1, h2')
        const paragraph = sectionElement.querySelector('p')

        if (heading || paragraph) {
          return {
            ...section,
            content: {
              ...section.content,
              heading: heading?.textContent || section.content?.heading,
              text: paragraph?.textContent || section.content?.text
            }
          }
        }

        return section
      })

      // Update the page with modified sections
      const updatedPage = {
        ...currentPage,
        sections: updatedSections
      }

      // Update template with modified page
      const updatedPages = template.pages.map(p =>
        p.id === currentPage.id ? updatedPage : p
      )

      const updatedTemplate = {
        ...template,
        pages: updatedPages
      }
      setTemplate(updatedTemplate)
      setCurrentPage(updatedPage)
      addToHistory(updatedTemplate)
      setIsEditingHTML(false)

      alert('HTML changes applied successfully! Remember to save your template.')
    } catch (error) {
      console.error('Error parsing HTML:', error)
      alert('Failed to parse HTML. Please check your syntax and try again.')
    }
  }

  const handleApplyCSSChanges = () => {
    if (!currentPage || !template) return

    // Show confirmation dialog
    if (!confirm('Applying CSS changes will update your styles. Invalid CSS may cause display issues. Continue?')) {
      return
    }

    try {
      // Extract different CSS sections from the edited CSS
      const cssText = editableCSS

      // Split CSS by comments to identify different sections
      const siteCSSMatch = cssText.match(/\/\* Site-Wide Styles \*\/\s*\n([\s\S]*?)(?=\/\*|$)/)
      const pageCSSMatch = cssText.match(/\/\* Page-Specific Styles:.*?\*\/\s*\n([\s\S]*?)(?=\/\*|$)/)

      // Update site CSS if found
      if (siteCSSMatch && siteCSSMatch[1]) {
        const siteCSS = siteCSSMatch[1].trim()
        setTemplate({
          ...template,
          custom_css: siteCSS
        })
      }

      // Update page CSS if found
      if (pageCSSMatch && pageCSSMatch[1]) {
        const pageCSS = pageCSSMatch[1].trim()
        const updatedPage = {
          ...currentPage,
          page_css: pageCSS
        }

        const updatedPages = template.pages.map(p =>
          p.id === currentPage.id ? updatedPage : p
        )

        setTemplate({
          ...template,
          pages: updatedPages
        })
        setCurrentPage(updatedPage)
      }

      // Parse section-specific CSS
      const sectionCSSMatches = cssText.matchAll(/#(section-\d+|[\w-]+)\s*\{([^}]+)\}/g)
      const updatedSections = [...currentPage.sections]

      for (const match of sectionCSSMatches) {
        const sectionId = match[1]
        const cssContent = match[2].trim()

        // Find matching section
        const sectionIndex = updatedSections.findIndex(s => {
          const sid = s.section_id || `section-${s.id}`
          return sid === sectionId
        })

        if (sectionIndex !== -1) {
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            content: {
              ...updatedSections[sectionIndex].content,
              section_css: cssContent
            }
          }
        }
      }

      // Update page with modified sections
      const updatedPage = {
        ...currentPage,
        sections: updatedSections
      }

      const updatedPages = template.pages.map(p =>
        p.id === currentPage.id ? updatedPage : p
      )

      const updatedTemplate = {
        ...template,
        pages: updatedPages
      }
      setTemplate(updatedTemplate)
      setCurrentPage(updatedPage)
      addToHistory(updatedTemplate)
      setIsEditingCSS(false)

      alert('CSS changes applied successfully! Remember to save your template.')
    } catch (error) {
      console.error('Error parsing CSS:', error)
      alert('Failed to parse CSS. Please check your syntax and try again.')
    }
  }

  return {
    handleApplyHTMLChanges,
    handleApplyCSSChanges
  }
}
