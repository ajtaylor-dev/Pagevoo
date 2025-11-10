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

  // Parse section CSS string into style object
  const parseCSSString = (cssString: string): React.CSSProperties => {
    if (!cssString || typeof cssString !== 'string') return {}

    const style: any = {}
    const declarations = cssString.split(';').filter(d => d.trim())

    declarations.forEach(declaration => {
      const [property, value] = declaration.split(':').map(s => s.trim())
      if (property && value) {
        // Convert kebab-case to camelCase
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        style[camelProperty] = value
      }
    })

    return style
  }

  // Get section-level CSS
  const sectionStyle = parseCSSString(content.section_css || '')

  // Get column-level CSS from content_css.columns object
  const getColumnStyle = (idx: number): React.CSSProperties => {
    const contentCss = content.content_css
    if (contentCss && typeof contentCss === 'object' && contentCss.columns && contentCss.columns[idx]) {
      return parseCSSString(contentCss.columns[idx])
    }
    return {}
  }

  return (
    <div
      id={section.section_id || `section-${section.id}`}
      className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
      style={sectionStyle}
    >
      <div className="row">
        {columns.map((col: any, idx: number) => (
          <div
            key={idx}
            className={`col-${col.colWidth || 12}`}
            style={getColumnStyle(idx)}
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
