import React from 'react'
import { EditableText } from '../EditableText'

interface GridSectionProps {
  section: {
    id: number
    type: string
    section_id?: string
    content: any
  }
  selectedSection: any
  editingText: { sectionId: number; field: string; value: string } | null
  onOpenTextEditor: (sectionId: number, field: string, value: string) => void
  onUpdateColumn: (sectionId: number, columnIndex: number, newContent: string) => void
}

export const GridSection: React.FC<GridSectionProps> = ({
  section,
  selectedSection,
  editingText,
  onOpenTextEditor,
  onUpdateColumn
}) => {
  const content = section.content || {}
  const columns = content.columns || []

  const handleGridColumnEdit = (colIdx: number, e: React.FocusEvent<HTMLElement>) => {
    const value = e.currentTarget.innerHTML
    onUpdateColumn(section.id, colIdx, value)
  }

  return (
    <div
      id={section.section_id || `section-${section.id}`}
      className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
    >
      <div className="row">
        {columns.map((col: any, idx: number) => (
          <div
            key={idx}
            className={`col-${col.colWidth || 12}`}
          >
            <EditableText
              tag="div"
              sectionId={section.id}
              field={`column_${idx}`}
              value={col.content || `Column ${idx + 1}`}
              className="outline-none hover:bg-white/50 rounded transition"
              isEditing={editingText?.sectionId === section.id && editingText?.field === `column_${idx}`}
              onOpenEditor={onOpenTextEditor}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
