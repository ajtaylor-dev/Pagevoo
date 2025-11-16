import { api } from '@/services/api'

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

interface UseFileHandlersProps {
  template: Template | null
  setTemplate: (template: Template) => void
  templateRef: React.MutableRefObject<Template | null>
  currentPage: TemplatePage | null
  setCurrentPage: (page: TemplatePage) => void
  setLoading: (loading: boolean) => void
  setUploadingImage: (uploading: boolean) => void
  history: Template[]
  setHistory: (history: Template[] | ((prev: Template[]) => Template[])) => void
  historyIndex: number
  setHistoryIndex: (index: number) => void
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  isPublished: boolean
  setIsPublished: (published: boolean) => void
  hasUnsavedChanges: boolean
  setShowLoadModal: (show: boolean) => void
  setAvailableTemplates: (templates: any[]) => void
  setLoadingTemplates: (loading: boolean) => void
  setSelectedSection: (section: TemplateSection | null) => void
  resetHistory: (template: Template) => void
}

export const useFileHandlers = ({
  template,
  setTemplate,
  templateRef,
  currentPage,
  setCurrentPage,
  setLoading,
  setUploadingImage,
  history,
  setHistory,
  historyIndex,
  setHistoryIndex,
  setCanUndo,
  setCanRedo,
  setHasUnsavedChanges,
  isPublished,
  setIsPublished,
  hasUnsavedChanges,
  setShowLoadModal,
  setAvailableTemplates,
  setLoadingTemplates,
  setSelectedSection,
  resetHistory
}: UseFileHandlersProps) => {
  const handleSaveTemplate = async () => {
    if (!template) {
      alert('No template loaded')
      return
    }

    setLoading(true)
    try {
      if (template.id === 0) {
        // Create new template with pages and sections
        const response = await api.createTemplate({
          name: template.name,
          description: template.description,
          business_type: template.business_type,
          is_active: template.is_active,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
          custom_css: template.custom_css,
          preview_image: template.preview_image,
          pages: template.pages.map(page => ({
            name: page.name,
            slug: page.slug,
            meta_description: page.meta_description,
            page_css: page.page_css,
            is_homepage: page.is_homepage,
            order: page.order,
            sections: page.sections.map(section => ({
              type: section.type,
              content: section.content,
              order: section.order
            }))
          }))
        })
        if (response.success && response.data) {
          alert('Template created successfully!')
          // Redirect to the new template
          window.location.href = `/template-builder?id=${response.data.id}`
        }
      } else {
        // Update existing template (metadata and pages/sections)
        const response = await api.updateTemplate(template.id, {
          name: template.name,
          description: template.description,
          business_type: template.business_type,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
          custom_css: template.custom_css,
          preview_image: template.preview_image,
          pages: template.pages.map(page => ({
            id: page.id > 1000000000000 ? undefined : page.id, // Don't send temporary IDs (from Date.now())
            name: page.name,
            slug: page.slug,
            meta_description: page.meta_description,
            page_css: page.page_css,
            is_homepage: page.is_homepage,
            order: page.order,
            sections: page.sections.map(section => ({
              id: section.id > 1000000000000 ? undefined : section.id,
              type: section.type,
              content: section.content,
              order: section.order
            }))
          }))
        })
        if (response.success) {
          alert('Template saved successfully!')
          // Reload to get proper IDs from server
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !template) return

    // Check if template is saved first
    if (template.id === 0) {
      alert('Please save the template first before uploading an image')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('preview_image', file)

      const response = await api.uploadTemplateImage(template.id, formData)
      if (response.success && response.data) {
        setTemplate({ ...template, preview_image: response.data.preview_image })
        alert('Preview image uploaded successfully')
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload preview image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleUndo = () => {
    if (historyIndex > 0 && template) {
      const newIndex = historyIndex - 1
      const previousState = history[newIndex]

      setTemplate(JSON.parse(JSON.stringify(previousState)))

      // Find and set current page
      const currentPageInHistory = previousState.pages.find(p => p.id === currentPage?.id)
      if (currentPageInHistory) {
        setCurrentPage(currentPageInHistory)
      }

      setHistoryIndex(newIndex)
      setCanUndo(newIndex > 0)
      setCanRedo(true)
      setHasUnsavedChanges(true)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && template) {
      const newIndex = historyIndex + 1
      const nextState = history[newIndex]

      setTemplate(JSON.parse(JSON.stringify(nextState)))

      // Find and set current page
      const currentPageInHistory = nextState.pages.find(p => p.id === currentPage?.id)
      if (currentPageInHistory) {
        setCurrentPage(currentPageInHistory)
      }

      setHistoryIndex(newIndex)
      setCanUndo(true)
      setCanRedo(newIndex < history.length - 1)
      setHasUnsavedChanges(true)
    }
  }

  const performSaveAsCreate = async (templateName: string) => {
    // Use templateRef.current to get the most recent template state (avoids race conditions)
    const currentTemplate = templateRef.current
    if (!currentTemplate) return

    try {
      // Prepare template data for creation
      const templateData = {
        name: templateName,
        description: currentTemplate.description || '',
        business_type: currentTemplate.business_type || 'other',
        preview_image: currentTemplate.preview_image || '',
        is_active: false, // Always save as unpublished (draft) - only "Export As > HTML Template" publishes
        exclusive_to: currentTemplate.exclusive_to || null,
        technologies: currentTemplate.technologies || [],
        features: currentTemplate.features || [],
        custom_css: currentTemplate.custom_css || '',
        pages: currentTemplate.pages.map(page => ({
          name: page.name,
          slug: page.slug,
          page_id: page.page_id || null,
          is_homepage: page.is_homepage || false,
          order: page.order || 0,
          sections: page.sections.map(section => ({
            section_name: section.section_name || section.type,
            section_id: section.section_id || null,
            type: section.type,
            content: section.content || {},
            css: section.css || {},
            order: section.order || 0
          }))
        }))
      }

      const response = await api.createTemplate(templateData)

      if (response.success && response.data) {
        // Update template with returned data (includes id, template_slug, etc.)
        const newTemplate = { ...currentTemplate, ...response.data }
        setTemplate(newTemplate)
        templateRef.current = newTemplate

        // Set published state to false (it's a draft)
        setIsPublished(false)

        // Reset history after save - start fresh with saved state
        resetHistory(newTemplate)
        setHasUnsavedChanges(false)

        alert('Template created successfully!')
      } else {
        alert('Failed to save template: ' + (response.message || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Save error:', error)
      alert('Failed to save template: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    }
  }

  const handleSave = async () => {
    // Use templateRef.current to get the most recent template state (avoids race conditions)
    const currentTemplate = templateRef.current
    if (!currentTemplate) {
      alert('No template to save')
      return
    }

    // Debug: Log template ID
    console.log('Template ID:', currentTemplate.id, 'Type:', typeof currentTemplate.id)

    // If template.id === 0 or undefined (new template), prompt for name like Word
    if (!currentTemplate.id || currentTemplate.id === 0) {
      const templateName = prompt('Enter a template name:', currentTemplate.name || 'Untitled Template')
      if (!templateName || templateName.trim() === '') {
        return // User cancelled or entered empty name
      }

      // Check if a template with this name already exists
      try {
        const response = await api.getAllTemplatesAdmin()
        if (response.success && response.data) {
          const existingTemplate = response.data.find((t: any) =>
            t.name.toLowerCase() === templateName.trim().toLowerCase()
          )

          if (existingTemplate) {
            const confirmOverwrite = confirm(
              `A template named "${templateName.trim()}" already exists. Do you want to overwrite it?`
            )
            if (!confirmOverwrite) {
              return // User cancelled the overwrite
            }
          }
        }
      } catch (error) {
        console.error('Error checking for existing templates:', error)
        // Continue with save even if check fails
      }

      // Update template name
      const updatedTemplate = { ...currentTemplate, name: templateName.trim() }
      setTemplate(updatedTemplate)
      templateRef.current = updatedTemplate

      // Perform save as create
      return performSaveAsCreate(templateName.trim())
    }

    // Existing template - just save/overwrite
    // If template is published, show warning
    if (isPublished) {
      if (!confirm('This template is published. Saving will update the published version. Continue?')) {
        return
      }
    }

    try {
      // Make sure is_active stays false when saving (don't accidentally publish)
      const templateToSave = { ...currentTemplate, is_active: isPublished }
      const response = await api.updateTemplate(currentTemplate.id, templateToSave)

      if (response.success && response.data) {
        // Update template with fresh data from backend (includes all pages/sections with proper IDs)
        const freshTemplate = response.data
        setTemplate(freshTemplate)

        // Update current page reference to match the new data
        if (currentPage) {
          const updatedCurrentPage = freshTemplate.pages.find((p: TemplatePage) => p.slug === currentPage.slug)
          if (updatedCurrentPage) {
            setCurrentPage(updatedCurrentPage)
          }
        }

        // Reset history after save - start fresh with saved state
        resetHistory(freshTemplate)
        setHasUnsavedChanges(false)
        alert('Template saved successfully!')
      } else {
        alert('Failed to save template: ' + (response.message || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Save error:', error)
      alert('Failed to save template: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    }
  }

  const handleSaveAs = async () => {
    // Use templateRef.current to get the most recent template state (avoids race conditions)
    const currentTemplate = templateRef.current
    if (!currentTemplate) {
      alert('No template to save')
      return
    }

    const newName = prompt('Save template as:', currentTemplate.name ? currentTemplate.name + ' (Copy)' : 'Untitled Template')
    if (!newName || newName.trim() === '') {
      return // User cancelled
    }

    // Create a copy with the new name and id = 0 (force create)
    await performSaveAsCreate(newName.trim())
  }

  const handleLoad = async () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Loading will discard them. Continue?')) {
        return
      }
    }

    // Fetch all templates and show modal
    setLoadingTemplates(true)
    setShowLoadModal(true)

    try {
      const response = await api.getAllTemplatesAdmin()
      if (response.success && response.data) {
        setAvailableTemplates(response.data)
      } else {
        alert('Failed to load templates list')
        setShowLoadModal(false)
      }
    } catch (error) {
      console.error('Load templates error:', error)
      alert('Failed to load templates list')
      setShowLoadModal(false)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleLoadTemplate = async (templateId: number) => {
    try {
      const response = await api.getTemplate(templateId)

      if (response.success && response.data) {
        const templateData = response.data

        setTemplate(templateData)

        // Set current page to homepage or first page
        const homepage = templateData.pages.find((p: TemplatePage) => p.is_homepage) || templateData.pages[0]
        setCurrentPage(homepage)

        // Check if published
        setIsPublished(templateData.is_active || false)

        // Reset history
        setHistory([JSON.parse(JSON.stringify(templateData))])
        setHistoryIndex(0)
        setCanUndo(false)
        setCanRedo(false)
        setHasUnsavedChanges(false)

        // Close modal
        setShowLoadModal(false)

        alert('Template loaded successfully!')
      } else {
        alert('Failed to load template')
      }
    } catch (error) {
      console.error('Load error:', error)
      alert('Failed to load template')
    }
  }

  const handleNew = () => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Creating a new template will discard them. Continue?')) {
        return
      }
    }

    // Create a blank template with default homepage
    const defaultHomepage: TemplatePage = {
      id: Date.now(),
      name: 'Home',
      slug: 'home',
      is_homepage: true,
      order: 0,
      sections: []
    }

    const newTemplate: Template = {
      id: 0,
      name: 'Untitled Template',
      description: '',
      business_type: 'restaurant',
      is_active: false,
      pages: [defaultHomepage],
      preview_image: null,
      exclusive_to: null,
      technologies: [],
      features: []
    }

    // Reset all states
    setTemplate(newTemplate)
    setCurrentPage(defaultHomepage)
    setSelectedSection(null)
    setHistory([JSON.parse(JSON.stringify(newTemplate))])
    setHistoryIndex(0)
    setCanUndo(false)
    setCanRedo(false)
    setHasUnsavedChanges(false)
    setIsPublished(false)

    // Clear URL parameter to remove template ID
    window.history.pushState({}, '', '/template-builder')
  }

  const handleExit = () => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Exiting will discard them. Continue?')) {
        return
      }
    }

    // Close the browser tab/window
    window.close()

    // Fallback: If window.close() doesn't work (security restrictions),
    // navigate to dashboard or show message
    setTimeout(() => {
      alert('Please close this tab manually or use your browser\'s close button.')
    }, 100)
  }

  const handleLivePreview = () => {
    if (!template || !template.template_slug) {
      alert('Please save your template first to generate live preview.')
      return
    }

    if (!currentPage) {
      alert('No page selected. Please select a page to preview.')
      return
    }

    // Open physical PHP file for the current page being edited
    const pageFile = currentPage.slug === 'home' ? 'index.php' : `${currentPage.slug}.php`
    const previewUrl = `http://localhost:8000/template_directory/${template.template_slug}/${pageFile}`
    window.open(previewUrl, '_blank')
  }

  const handleExportAsHTMLTemplate = async () => {
    if (!template) {
      alert('No template to export')
      return
    }

    // Check if already published
    if (isPublished) {
      if (!confirm('This template is already published. Exporting again will update the published version. Continue?')) {
        return
      }
    }

    // Check for unsaved changes
    if (hasUnsavedChanges) {
      alert('Please save your changes before publishing the template.')
      return
    }

    // Confirm export
    if (!confirm('Export this template as HTML Template? This will publish the template and make it available to users.')) {
      return
    }

    try {
      // Update template to set is_active = true (published)
      const updatedTemplate = {
        ...template,
        is_active: true
      }

      const response = await api.updateTemplate(template.id, updatedTemplate)

      if (response.success) {
        setTemplate(updatedTemplate)
        setIsPublished(true)
        alert('Template published successfully! It is now available in the templates list.')
      } else {
        alert('Failed to publish template: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to publish template')
    }
  }

  const handleExportReact = () => {
    console.log('Export as React - to be implemented')
    // TODO: Implement React export
  }

  const handleExportHTML = () => {
    console.log('Export as HTML - to be implemented')
    // TODO: Implement HTML export
  }

  return {
    handleSaveTemplate,
    handleImageUpload,
    handleUndo,
    handleRedo,
    handleSave,
    handleSaveAs,
    handleLoad,
    handleLoadTemplate,
    handleNew,
    handleExit,
    handleLivePreview,
    handleExportAsHTMLTemplate,
    handleExportReact,
    handleExportHTML
  }
}
