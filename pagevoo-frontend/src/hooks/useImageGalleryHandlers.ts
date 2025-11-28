import { api } from '@/services/api'
import type { ImageItem, Album } from '@/components/ImageGallery'

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
  images?: ImageItem[]
  albums?: Album[]
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

  // Ensure template is saved before operations
  const ensureTemplateSaved = async (): Promise<number | null> => {
    if (!template) return null

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
          setTemplate({ ...template, id: templateId })
          return templateId
        } else {
          alert('Please save the template first.')
          return null
        }
      } catch (error) {
        console.error('Auto-save error:', error)
        alert('Failed to save template. Please save manually first.')
        return null
      }
    }
    return templateId
  }

  // Image handlers
  const handleImageUpload = async (file: File, albumId: string | null = null) => {
    const templateId = await ensureTemplateSaved()
    if (!templateId || !template) return

    try {
      const response = await api.uploadGalleryImage(templateId, file, albumId)
      if (response.success && response.data) {
        const newImage: ImageItem = {
          ...response.data,
          album_id: albumId,
          order: (template.images || []).length
        }
        setTemplate({
          ...template,
          id: templateId,
          images: [...(template.images || []), newImage],
          // Update album image count
          albums: (template.albums || []).map(album =>
            album.id === albumId
              ? { ...album, image_count: album.image_count + 1 }
              : album
          )
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

    const image = (template.images || []).find(img => img.id === imageId)
    const albumId = image?.album_id

    try {
      await api.deleteGalleryImage(template.id, imageId)
      setTemplate({
        ...template,
        images: (template.images || []).filter(img => img.id !== imageId),
        // Update album image count
        albums: (template.albums || []).map(album =>
          album.id === albumId
            ? { ...album, image_count: Math.max(0, album.image_count - 1) }
            : album
        )
      })
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  const handleImageRename = async (imageId: string, newFilename: string) => {
    if (!template) return

    try {
      await api.renameGalleryImage(template.id, imageId, newFilename)
      setTemplate({
        ...template,
        images: (template.images || []).map(img =>
          img.id === imageId ? { ...img, filename: newFilename, title: newFilename } : img
        )
      })
    } catch (error) {
      console.error('Rename error:', error)
      throw error
    }
  }

  const handleImageUpdate = async (imageId: string, updates: Partial<ImageItem>) => {
    if (!template) return

    try {
      await api.updateGalleryImage(template.id, imageId, updates)
      setTemplate({
        ...template,
        images: (template.images || []).map(img =>
          img.id === imageId ? { ...img, ...updates } : img
        )
      })
    } catch (error) {
      console.error('Update error:', error)
      throw error
    }
  }

  const handleImageMove = async (imageId: string, targetAlbumId: string | null) => {
    if (!template) return

    const image = (template.images || []).find(img => img.id === imageId)
    if (!image) return

    const sourceAlbumId = image.album_id

    try {
      await api.moveGalleryImage(template.id, imageId, targetAlbumId)
      setTemplate({
        ...template,
        images: (template.images || []).map(img =>
          img.id === imageId ? { ...img, album_id: targetAlbumId } : img
        ),
        // Update album counts
        albums: (template.albums || []).map(album => {
          if (album.id === sourceAlbumId) {
            return { ...album, image_count: Math.max(0, album.image_count - 1) }
          }
          if (album.id === targetAlbumId) {
            return { ...album, image_count: album.image_count + 1 }
          }
          return album
        })
      })
    } catch (error) {
      console.error('Move error:', error)
      throw error
    }
  }

  // Album handlers
  const handleCreateAlbum = async (name: string, description?: string): Promise<Album> => {
    const templateId = await ensureTemplateSaved()
    if (!templateId || !template) throw new Error('Template not saved')

    try {
      const response = await api.createGalleryAlbum(templateId, name, description)
      if (response.success && response.data) {
        const newAlbum: Album = {
          ...response.data,
          image_count: 0,
          order: (template.albums || []).length
        }
        setTemplate({
          ...template,
          id: templateId,
          albums: [...(template.albums || []), newAlbum]
        })
        return newAlbum
      } else {
        throw new Error(response.message || 'Failed to create album')
      }
    } catch (error) {
      console.error('Create album error:', error)
      throw error
    }
  }

  const handleUpdateAlbum = async (albumId: string, updates: Partial<Album>) => {
    if (!template) return

    try {
      await api.updateGalleryAlbum(template.id, albumId, updates)
      setTemplate({
        ...template,
        albums: (template.albums || []).map(album =>
          album.id === albumId ? { ...album, ...updates } : album
        )
      })
    } catch (error) {
      console.error('Update album error:', error)
      throw error
    }
  }

  const handleDeleteAlbum = async (albumId: string) => {
    if (!template) return

    try {
      await api.deleteGalleryAlbum(template.id, albumId)
      // Move images from deleted album to uncategorized
      setTemplate({
        ...template,
        albums: (template.albums || []).filter(album => album.id !== albumId),
        images: (template.images || []).map(img =>
          img.album_id === albumId ? { ...img, album_id: null } : img
        )
      })
    } catch (error) {
      console.error('Delete album error:', error)
      throw error
    }
  }

  const handleSetAlbumCover = async (albumId: string, imageId: string) => {
    if (!template) return

    try {
      await api.setAlbumCover(template.id, albumId, imageId)
      setTemplate({
        ...template,
        albums: (template.albums || []).map(album =>
          album.id === albumId ? { ...album, cover_image_id: imageId } : album
        )
      })
    } catch (error) {
      console.error('Set cover error:', error)
      throw error
    }
  }

  return {
    handleImageGalleryClose,
    handleImageUpload,
    handleImageDelete,
    handleImageRename,
    handleImageUpdate,
    handleImageMove,
    handleCreateAlbum,
    handleUpdateAlbum,
    handleDeleteAlbum,
    handleSetAlbumCover
  }
}
