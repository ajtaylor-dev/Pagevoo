import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableSectionItem } from './SortableSectionItem'
import { BottomDropZone } from './BottomDropZone'
import { generateContentCSS, extractFontsFromCSS } from '../../utils/cssUtils'

interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: any[]
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

interface CanvasDropZoneProps {
  currentPage: TemplatePage | null
  activeId: string | number | null
  activeDragData: any
  overId: string | number | null
  renderSection: (section: any, index: number) => React.ReactNode
  viewport: 'desktop' | 'tablet' | 'mobile'
  template: Template | null
  setSelectedSection: (section: any) => void
}

export const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({
  currentPage,
  activeId,
  activeDragData,
  overId,
  renderSection,
  viewport,
  template,
  setSelectedSection
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
    data: { type: 'canvas' }
  })

  // Generate content CSS for all sections
  // Generate complete CSS with proper cascade: site → page → section → row → column
  const contentCSS = currentPage?.sections
    ? generateContentCSS(currentPage.sections, currentPage.page_css, template?.custom_css)
    : ''

  // Extract fonts from all CSS for Google Fonts loading
  const allCSS = contentCSS
  const fonts = extractFontsFromCSS(allCSS)
  const googleFontsLink = fonts.length > 0
    ? `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f.replace(/ /g, '+'))}`).join('&')}&display=swap`
    : ''

  // Apply viewport class to simulate responsive breakpoints
  const viewportClass = viewport === 'mobile' ? 'viewport-mobile' : viewport === 'tablet' ? 'viewport-tablet' : ''

  return (
    <div
      id="template-canvas"
      ref={setNodeRef}
      onClick={() => setSelectedSection(null)}
      className={`text-gray-900 flex-1 min-h-0 ${viewportClass} ${activeId && activeDragData?.source === 'library' ? 'ring-2 ring-[#98b290] ring-offset-4 rounded-lg' : ''} ${isOver ? 'bg-[#e8f0e6]' : ''}`}
    >
      {/* Inject Google Fonts */}
      {googleFontsLink && (
        <link rel="stylesheet" href={googleFontsLink} />
      )}

      {/* Inject CSS with proper cascade: Site → Page → Section → Row → Column */}
      {contentCSS && (
        <style dangerouslySetInnerHTML={{ __html: contentCSS }} />
      )}

      {currentPage && currentPage.sections && currentPage.sections.length > 0 ? (
        <>
          <SortableContext
            items={currentPage.sections.filter((s: any) => s && s.id).map((s: any) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {currentPage.sections
              .filter((s: any) => s && s.id)
              .sort((a: any, b: any) => a.order - b.order)
              .map((section: any, index: number) => (
                <SortableSectionItem key={section.id} section={section} index={index} activeId={activeId} overId={overId}>
                  {renderSection(section, index)}
                </SortableSectionItem>
              ))
            }
          </SortableContext>
          <BottomDropZone currentPage={currentPage} activeId={activeId} activeDragData={activeDragData} />
        </>
      ) : (
        <div className={`text-center py-20 p-8 ${activeId && activeDragData?.source === 'library' ? 'bg-[#e8f0e6]' : ''}`}>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Empty Page</h2>
          <p className="text-gray-600">
            {activeId && activeDragData?.source === 'library'
              ? 'Drop section here to add it to the page'
              : 'This page has no sections yet. Drag sections from the left sidebar!'}
          </p>
        </div>
      )}
    </div>
  )
}
