import React from 'react'
import { useDroppable } from '@dnd-kit/core'

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

interface BottomDropZoneProps {
  currentPage: TemplatePage | null
  activeId: string | number | null
  activeDragData: any
}

export const BottomDropZone: React.FC<BottomDropZoneProps> = ({
  currentPage,
  activeId,
  activeDragData
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'bottom-drop-zone',
    data: { type: 'bottom', index: currentPage?.sections.length || 0 }
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] transition-all ${activeId && activeDragData?.source === 'library' ? 'border-2 border-dashed border-[#b8ceb4]' : ''} ${isOver ? 'bg-[#e8f0e6]' : ''}`}
    >
      {isOver && activeId && (
        <div className="relative h-2">
          <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse"></div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-4 bg-[#98b290] text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg z-50">
            ↓ Insert here
          </div>
        </div>
      )}
    </div>
  )
}
