import React from 'react'
import { getAssetUrl } from '@/config/constants'
import { Image as ImageIcon, Grid, Columns, LayoutGrid } from 'lucide-react'

interface GalleryImage {
  id: string
  filename: string
  path: string
  thumbnail_path?: string
  title?: string
  description?: string
  alt_text?: string
}

interface GalleryConfig {
  name?: string
  albumId?: string | null
  layout: 'grid' | 'masonry' | 'carousel' | 'justified'
  columns: number
  gap: string
  enableLightbox: boolean
  showCaptions: 'hover' | 'below' | 'none'
  hoverEffect: 'none' | 'zoom' | 'darken' | 'brighten' | 'grayscale'
  borderRadius: string
  aspectRatio: 'square' | '4:3' | '16:9' | 'original'
  containerStyle?: {
    padding?: string
    background?: string
    borderRadius?: string
  }
}

interface GalleryWrapPreviewProps {
  section: {
    id: number
    type: string
    section_id?: string
    content: any
  }
  selectedSection: any
  images?: GalleryImage[]
  albumName?: string
}

export const GalleryWrapPreview: React.FC<GalleryWrapPreviewProps> = ({
  section,
  selectedSection,
  images = [],
  albumName
}) => {
  const content = section.content || {}
  const config: GalleryConfig = content.galleryConfig || {
    layout: 'grid',
    columns: 3,
    gap: '16px',
    enableLightbox: true,
    showCaptions: 'hover',
    hoverEffect: 'zoom',
    borderRadius: '8px',
    aspectRatio: 'square'
  }

  const isSelected = selectedSection?.id === section.id
  const displayImages = images.slice(0, 12) // Show max 12 images in preview

  // Get aspect ratio class
  const getAspectRatioClass = () => {
    switch (config.aspectRatio) {
      case 'square': return 'aspect-square'
      case '4:3': return 'aspect-[4/3]'
      case '16:9': return 'aspect-video'
      default: return ''
    }
  }

  // Get hover effect class
  const getHoverEffectClass = () => {
    switch (config.hoverEffect) {
      case 'zoom': return 'group-hover:scale-110'
      case 'darken': return 'group-hover:brightness-75'
      case 'brighten': return 'group-hover:brightness-125'
      case 'grayscale': return 'grayscale group-hover:grayscale-0'
      default: return ''
    }
  }

  // Get layout icon
  const getLayoutIcon = () => {
    switch (config.layout) {
      case 'grid': return <Grid className="w-5 h-5" />
      case 'masonry': return <LayoutGrid className="w-5 h-5" />
      case 'carousel': return <Columns className="w-5 h-5" />
      default: return <Grid className="w-5 h-5" />
    }
  }

  // Container styles
  const containerStyle: React.CSSProperties = {
    padding: config.containerStyle?.padding || '32px',
    background: config.containerStyle?.background || 'transparent',
    borderRadius: config.containerStyle?.borderRadius || '0'
  }

  // Render empty state
  if (displayImages.length === 0) {
    return (
      <div
        id={section.section_id || `section-${section.id}`}
        className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${
          isSelected ? 'ring-2 ring-[#98b290]' : ''
        }`}
        style={containerStyle}
      >
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="font-medium text-gray-600">Image Gallery</p>
              <p className="text-sm">
                {config.albumId
                  ? `Album: ${albumName || 'Selected'}`
                  : 'No album selected'}
              </p>
              <p className="text-xs mt-1">
                Configure in the sidebar to select an album
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-gray-100 px-3 py-1 rounded-full">
              {getLayoutIcon()}
              <span className="capitalize">{config.layout}</span>
              <span>•</span>
              <span>{config.columns} columns</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render grid layout
  const renderGridLayout = () => (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
        gap: config.gap
      }}
    >
      {displayImages.map((image, index) => (
        <div
          key={image.id || index}
          className={`group relative overflow-hidden ${getAspectRatioClass()}`}
          style={{ borderRadius: config.borderRadius }}
        >
          <img
            src={getAssetUrl(image.thumbnail_path || image.path)}
            alt={image.alt_text || image.title || image.filename}
            className={`w-full h-full object-cover transition-all duration-300 ${getHoverEffectClass()}`}
          />

          {/* Caption overlay on hover */}
          {config.showCaptions === 'hover' && (image.title || image.description) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              {image.title && (
                <p className="text-white text-sm font-medium truncate">{image.title}</p>
              )}
              {image.description && (
                <p className="text-white/80 text-xs truncate">{image.description}</p>
              )}
            </div>
          )}

          {/* Lightbox indicator */}
          {config.enableLightbox && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // Render masonry layout (simplified for preview)
  const renderMasonryLayout = () => (
    <div
      className="columns-1 md:columns-2 lg:columns-3"
      style={{
        columnCount: config.columns,
        columnGap: config.gap
      }}
    >
      {displayImages.map((image, index) => (
        <div
          key={image.id || index}
          className="group relative overflow-hidden mb-4 break-inside-avoid"
          style={{ borderRadius: config.borderRadius }}
        >
          <img
            src={getAssetUrl(image.thumbnail_path || image.path)}
            alt={image.alt_text || image.title || image.filename}
            className={`w-full h-auto object-cover transition-all duration-300 ${getHoverEffectClass()}`}
          />

          {config.showCaptions === 'hover' && image.title && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-sm font-medium truncate">{image.title}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // Render carousel layout (simplified for preview)
  const renderCarouselLayout = () => (
    <div className="relative">
      <div
        className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ gap: config.gap }}
      >
        {displayImages.map((image, index) => (
          <div
            key={image.id || index}
            className={`group relative flex-shrink-0 overflow-hidden snap-start ${getAspectRatioClass()}`}
            style={{
              borderRadius: config.borderRadius,
              width: `calc((100% - ${parseInt(config.gap) * (config.columns - 1)}px) / ${config.columns})`
            }}
          >
            <img
              src={getAssetUrl(image.thumbnail_path || image.path)}
              alt={image.alt_text || image.title || image.filename}
              className={`w-full h-full object-cover transition-all duration-300 ${getHoverEffectClass()}`}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows indicator */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-50">
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-50">
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )

  // Render based on layout type
  const renderGallery = () => {
    switch (config.layout) {
      case 'masonry':
        return renderMasonryLayout()
      case 'carousel':
        return renderCarouselLayout()
      case 'grid':
      case 'justified':
      default:
        return renderGridLayout()
    }
  }

  return (
    <div
      id={section.section_id || `section-${section.id}`}
      className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition bg-white ${
        isSelected ? 'ring-2 ring-[#98b290]' : ''
      }`}
      style={containerStyle}
    >
      {/* Gallery Header */}
      {content.title && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{content.title}</h3>
          {content.subtitle && (
            <p className="text-gray-600 mt-1">{content.subtitle}</p>
          )}
        </div>
      )}

      {/* Gallery Content */}
      {renderGallery()}

      {/* Caption below images */}
      {config.showCaptions === 'below' && displayImages.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          {displayImages.length} of {images.length} images
          {albumName && <span> • {albumName}</span>}
        </div>
      )}
    </div>
  )
}
