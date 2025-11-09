import React from 'react'
import { EditableText } from '../EditableText'

interface FooterSectionProps {
  section: {
    id: number
    type: string
    section_id?: string
    content: any
  }
  selectedSection: any
  editingText: { sectionId: number; field: string; value: string } | null
  onOpenTextEditor: (sectionId: number, field: string, value: string) => void
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  section,
  selectedSection,
  editingText,
  onOpenTextEditor
}) => {
  const content = section.content || {}

  // Simple footer rendering
  if (section.type === 'footer-simple') {
    const simpleFooterStyle = content.sectionStyle || {}

    return (
      <div
        id={section.section_id || `section-${section.id}`}
        className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
        style={{
          backgroundColor: simpleFooterStyle.background || '#1f2937',
          padding: simpleFooterStyle.padding || '32px',
          textAlign: (simpleFooterStyle.textAlign || 'center') as any
        }}
      >
        <EditableText
          tag="p"
          sectionId={section.id}
          field="text"
          value={content.text || '© 2025 Company Name. All rights reserved.'}
          className="outline-none hover:bg-white/10 px-2 py-1 rounded transition text-white text-sm"
          isEditing={editingText?.sectionId === section.id && editingText?.field === "text"}
          onOpenEditor={onOpenTextEditor}
        />
      </div>
    )
  }

  // Column footer rendering
  if (section.type === 'footer-columns') {
    const columnsFooterStyle = content.sectionStyle || {}
    const copyrightStyle = content.copyrightStyle || {}

    return (
      <div
        id={section.section_id || `section-${section.id}`}
        className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
        style={{
          backgroundColor: columnsFooterStyle.background || '#172554'
        }}
      >
        {/* 3-column grid */}
        <div className="grid grid-cols-3 gap-8 p-12 max-w-7xl mx-auto text-white">
          {(content.columns || []).map((col: any, idx: number) => (
            <div key={idx} className="min-h-[150px] text-center">
              <EditableText
                tag="div"
                sectionId={section.id}
                field={`column_${idx}`}
                value={col.content || '<p>Column content</p>'}
                className="outline-none hover:bg-white/10 px-2 py-1 rounded transition"
                isEditing={editingText?.sectionId === section.id && editingText?.field === `column_${idx}`}
                onOpenEditor={onOpenTextEditor}
              />
            </div>
          ))}
        </div>
        {/* Copyright row */}
        <div
          style={{
            backgroundColor: copyrightStyle.background || '#171717',
            padding: copyrightStyle.padding || '24px',
            borderTop: copyrightStyle.borderTop || '1px solid #374151'
          }}
        >
          <div className="max-w-7xl mx-auto px-12">
            <EditableText
              tag="p"
              sectionId={section.id}
              field="copyrightText"
              value={content.copyrightText || '© 2025 Company Name. All rights reserved.'}
              className="text-center outline-none hover:bg-white/10 px-2 py-1 rounded transition text-white text-sm"
              isEditing={editingText?.sectionId === section.id && editingText?.field === "copyrightText"}
              onOpenEditor={onOpenTextEditor}
            />
          </div>
        </div>
      </div>
    )
  }

  return null
}
