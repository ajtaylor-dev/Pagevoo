import React from 'react'
import { useDraggable } from '@dnd-kit/core'

interface DraggableSectionItemProps {
  section: any
  children: React.ReactNode
}

export const DraggableSectionItem: React.FC<DraggableSectionItemProps> = ({ section, children }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${section.type}`,
    data: { section, source: 'library' },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      {children}
    </div>
  )
}
