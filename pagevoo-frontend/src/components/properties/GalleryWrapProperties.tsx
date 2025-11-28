import React, { useState } from 'react'
import {
  ChevronDown, ChevronRight, Settings, Layout, Image as ImageIcon,
  Palette, Grid, Columns, LayoutGrid, Eye, MousePointer
} from 'lucide-react'
import type { Album } from '@/components/ImageGallery'

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
  autoPlay?: boolean
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  containerStyle?: {
    padding?: string
    background?: string
    borderRadius?: string
  }
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

interface GalleryWrapPropertiesProps {
  selectedSection: TemplateSection
  onUpdateContent: (sectionId: number, content: any) => void
  albums: Album[]
  onOpenGallery?: () => void
}

export const GalleryWrapProperties: React.FC<GalleryWrapPropertiesProps> = ({
  selectedSection,
  onUpdateContent,
  albums,
  onOpenGallery
}) => {
  const content = selectedSection.content || {}
  const galleryConfig: GalleryConfig = content.galleryConfig || {
    layout: 'grid',
    columns: 3,
    gap: '16px',
    enableLightbox: true,
    showCaptions: 'hover',
    hoverEffect: 'zoom',
    borderRadius: '8px',
    aspectRatio: 'square',
    autoPlay: false,
    autoPlayInterval: 5000,
    showDots: true,
    showArrows: true
  }

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    layout: true,
    appearance: false,
    carousel: false,
    containerCSS: false
  })

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateGalleryConfig = (updates: Partial<GalleryConfig>) => {
    onUpdateContent(selectedSection.id, {
      ...content,
      galleryConfig: { ...galleryConfig, ...updates }
    })
  }

  const updateContainerStyle = (updates: Partial<GalleryConfig['containerStyle']>) => {
    updateGalleryConfig({
      containerStyle: { ...galleryConfig.containerStyle, ...updates }
    })
  }

  const SectionHeader = ({
    title,
    icon: Icon,
    sectionKey
  }: {
    title: string
    icon: React.ElementType
    sectionKey: string
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-200 hover:text-white"
    >
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </span>
      {expandedSections[sectionKey] ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>
  )

  const selectedAlbum = albums.find(a => a.id === galleryConfig.albumId)

  return (
    <div className="space-y-4 text-sm">
      {/* Header */}
      <div className="pb-3 border-b border-gray-600">
        <h3 className="text-base font-semibold text-gray-200">Gallery Settings</h3>
        <p className="text-xs text-gray-400 mt-1">Configure your image gallery display</p>
      </div>

      {/* General Settings */}
      <div>
        <SectionHeader title="General Settings" icon={Settings} sectionKey="general" />
        {expandedSections.general && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Gallery Name</label>
              <input
                type="text"
                value={galleryConfig.name || ''}
                onChange={(e) => updateGalleryConfig({ name: e.target.value })}
                placeholder="My Gallery"
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Select Album</label>
              <select
                value={galleryConfig.albumId || ''}
                onChange={(e) => updateGalleryConfig({ albumId: e.target.value || null })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              >
                <option value="">-- Select an album --</option>
                {albums.map(album => (
                  <option key={album.id} value={album.id}>
                    {album.name} ({album.image_count} images)
                  </option>
                ))}
              </select>
              {selectedAlbum && (
                <p className="text-[10px] text-gray-500 mt-1">
                  {selectedAlbum.image_count} images in this album
                </p>
              )}
            </div>

            {onOpenGallery && (
              <button
                onClick={onOpenGallery}
                className="w-full px-3 py-2 text-xs font-medium text-white bg-[#98b290] rounded hover:bg-[#7a9072] transition flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Open Image Gallery Manager
              </button>
            )}

            <div>
              <label className="text-xs text-gray-400 block mb-1">Title (optional)</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => onUpdateContent(selectedSection.id, { ...content, title: e.target.value })}
                placeholder="Gallery Title"
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Subtitle (optional)</label>
              <input
                type="text"
                value={content.subtitle || ''}
                onChange={(e) => onUpdateContent(selectedSection.id, { ...content, subtitle: e.target.value })}
                placeholder="Gallery description"
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Layout Settings */}
      <div>
        <SectionHeader title="Layout" icon={Layout} sectionKey="layout" />
        {expandedSections.layout && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-2">Layout Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'grid', label: 'Grid', icon: Grid },
                  { value: 'masonry', label: 'Masonry', icon: LayoutGrid },
                  { value: 'carousel', label: 'Carousel', icon: Columns },
                  { value: 'justified', label: 'Justified', icon: Grid }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateGalleryConfig({ layout: value as any })}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs border transition ${
                      galleryConfig.layout === value
                        ? 'bg-[#98b290] border-[#98b290] text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Columns</label>
              <select
                value={galleryConfig.columns}
                onChange={(e) => updateGalleryConfig({ columns: parseInt(e.target.value) })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                {[2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} columns</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Gap Between Images</label>
              <select
                value={galleryConfig.gap}
                onChange={(e) => updateGalleryConfig({ gap: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="4px">Extra Small (4px)</option>
                <option value="8px">Small (8px)</option>
                <option value="16px">Medium (16px)</option>
                <option value="24px">Large (24px)</option>
                <option value="32px">Extra Large (32px)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Aspect Ratio</label>
              <select
                value={galleryConfig.aspectRatio}
                onChange={(e) => updateGalleryConfig({ aspectRatio: e.target.value as any })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="square">Square (1:1)</option>
                <option value="4:3">Landscape (4:3)</option>
                <option value="16:9">Widescreen (16:9)</option>
                <option value="original">Original</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Appearance Settings */}
      <div>
        <SectionHeader title="Appearance" icon={Palette} sectionKey="appearance" />
        {expandedSections.appearance && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Border Radius</label>
              <select
                value={galleryConfig.borderRadius}
                onChange={(e) => updateGalleryConfig({ borderRadius: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="0">None</option>
                <option value="4px">Small (4px)</option>
                <option value="8px">Medium (8px)</option>
                <option value="12px">Large (12px)</option>
                <option value="16px">Extra Large (16px)</option>
                <option value="9999px">Rounded</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Hover Effect</label>
              <select
                value={galleryConfig.hoverEffect}
                onChange={(e) => updateGalleryConfig({ hoverEffect: e.target.value as any })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="none">None</option>
                <option value="zoom">Zoom In</option>
                <option value="darken">Darken</option>
                <option value="brighten">Brighten</option>
                <option value="grayscale">Grayscale to Color</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Show Captions</label>
              <select
                value={galleryConfig.showCaptions}
                onChange={(e) => updateGalleryConfig({ showCaptions: e.target.value as any })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="none">Don't Show</option>
                <option value="hover">Show on Hover</option>
                <option value="below">Show Below Image</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={galleryConfig.enableLightbox}
                onChange={(e) => updateGalleryConfig({ enableLightbox: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800"
              />
              Enable Lightbox on Click
            </label>
          </div>
        )}
      </div>

      {/* Carousel Settings (only show if carousel layout selected) */}
      {galleryConfig.layout === 'carousel' && (
        <div>
          <SectionHeader title="Carousel Options" icon={Columns} sectionKey="carousel" />
          {expandedSections.carousel && (
            <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={galleryConfig.autoPlay || false}
                  onChange={(e) => updateGalleryConfig({ autoPlay: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800"
                />
                Auto Play
              </label>

              {galleryConfig.autoPlay && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Auto Play Interval</label>
                  <select
                    value={galleryConfig.autoPlayInterval || 5000}
                    onChange={(e) => updateGalleryConfig({ autoPlayInterval: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
                  >
                    <option value={2000}>2 seconds</option>
                    <option value={3000}>3 seconds</option>
                    <option value={5000}>5 seconds</option>
                    <option value={7000}>7 seconds</option>
                    <option value={10000}>10 seconds</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={galleryConfig.showArrows !== false}
                  onChange={(e) => updateGalleryConfig({ showArrows: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800"
                />
                Show Navigation Arrows
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={galleryConfig.showDots !== false}
                  onChange={(e) => updateGalleryConfig({ showDots: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800"
                />
                Show Dot Indicators
              </label>
            </div>
          )}
        </div>
      )}

      {/* Container CSS */}
      <div>
        <SectionHeader title="Container Styling" icon={Palette} sectionKey="containerCSS" />
        {expandedSections.containerCSS && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Padding</label>
              <select
                value={galleryConfig.containerStyle?.padding || '32px'}
                onChange={(e) => updateContainerStyle({ padding: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="0">None</option>
                <option value="16px">Small (16px)</option>
                <option value="32px">Medium (32px)</option>
                <option value="48px">Large (48px)</option>
                <option value="64px">Extra Large (64px)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={galleryConfig.containerStyle?.background || '#ffffff'}
                  onChange={(e) => updateContainerStyle({ background: e.target.value })}
                  className="w-10 h-8 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={galleryConfig.containerStyle?.background || 'transparent'}
                  onChange={(e) => updateContainerStyle({ background: e.target.value })}
                  placeholder="transparent"
                  className="flex-1 px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Container Border Radius</label>
              <select
                value={galleryConfig.containerStyle?.borderRadius || '0'}
                onChange={(e) => updateContainerStyle({ borderRadius: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="0">None</option>
                <option value="8px">Small (8px)</option>
                <option value="16px">Medium (16px)</option>
                <option value="24px">Large (24px)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
