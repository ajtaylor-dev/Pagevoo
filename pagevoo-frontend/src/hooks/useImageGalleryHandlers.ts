import { useRef } from 'react'
import { api } from '@/services/api'

interface Template {
  id: number
  name: string
  description: string
  business_type: string
  is_active: boolean
  pages: any[]
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

interface UseImageGalleryHandlersProps {
  template: Template | null
  setTemplate: (template: Template) => void
  imageGalleryRef: React.MutableRefObject<boolean>
  setShowImageGallery: (show: boolean) => void
}

export const useImageGalleryHandlers = ({
  template,
  setTemplate,
  imageGalleryRef,
  setShowImageGallery
}: UseImageGalleryHandlersProps) => {

  const handleImageGalleryClose = () => {
    imageGalleryRef.current = false
    setShowImageGallery(false)
  }

  const handleImageUpload = async (file: File) => {
    if (!template) {
      console.error('No template available for upload')
      return
    }

    // Auto-save template if it hasn't been saved yet
    let templateId = template.id
    if (templateId === 0) {
      try {
        const saveResponse = await api.createTemplate({
          name: template.name || 'Untitled Template',
          description: template.description || '',
          business_type: template.business_type || 'other',
          is_active: template.is_active,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
          custom_css: template.custom_css,
          pages: template.pages
        })
        if (saveResponse.success && saveResponse.data) {
          templateId = saveResponse.data.id
          setTemplate(saveResponse.data)
        } else {
          alert('Please save the template before uploading images.')
          return
        }
      } catch (error) {
        console.error('Auto-save error:', error)
        alert('Failed to save template. Please save manually before uploading images.')
        return
      }
    }

    try {
      const response = await api.uploadGalleryImage(templateId, file)
      if (response.success && response.data) {
        setTemplate({
          ...template,
          id: templateId,
          images: [...(template.images || []), response.data]
        })
      } else {
        console.error('Upload failed:', response)
        alert(`Failed to upload image: ${response.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Error uploading image: ${error}`)
    }
  }

  const handleImageDelete = async (imageId: string) => {
    if (!template) return
    await api.deleteGalleryImage(template.id, imageId)
    setTemplate({
      ...template,
      images: (template.images || []).filter(img => img.id !== imageId)
    })
  }

  const handleImageRename = async (imageId: string, newFilename: string) => {
    if (!template) return
    await api.renameGalleryImage(template.id, imageId, newFilename)
    setTemplate({
      ...template,
      images: (template.images || []).map(img =>
        img.id === imageId ? { ...img, filename: newFilename } : img
      )
    })
  }

  return {
    handleImageGalleryClose,
    handleImageUpload,
    handleImageDelete,
    handleImageRename
  }
}
