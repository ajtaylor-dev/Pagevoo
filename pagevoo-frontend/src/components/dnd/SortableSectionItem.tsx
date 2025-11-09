import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface SortableSectionItemProps {
  section: TemplateSection
  index: number
  children: React.ReactNode
  activeId: string | number | null
  overId: string | number | null
}

export const SortableSectionItem: React.FC<SortableSectionItemProps> = ({
  section,
  index,
  children,
  activeId,
  overId
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { section, index, source: 'canvas' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Check if this is a sidebar section for special drag handling
  const isSidebar = section.type.startsWith('sidebar-nav-')

  // Check if this section is being hovered over during drag
  const isOver = overId === String(section.id)

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drop indicator - shows where item will be inserted */}
      {isOver && activeId && (
        <div className="relative h-2 -mb-2">
          <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse"></div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-4 bg-[#98b290] text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg z-50">
            ↓ Insert here
          </div>
        </div>
      )}
      {/* Drag handle overlay for canvas sections */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2 left-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <div className="bg-[#98b290] text-white p-1.5 rounded shadow-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
      {children}
    </div>
  )
}
