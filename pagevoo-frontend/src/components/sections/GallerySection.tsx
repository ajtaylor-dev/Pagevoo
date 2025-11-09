import React from 'react'
import { EditableText } from '../EditableText'

interface GallerySectionProps {
  section: {
    id: number
    section_id?: string
    content: any
  }
  selectedSection: any
  editingText: { sectionId: number; field: string; value: string } | null
  onOpenTextEditor: (sectionId: number, field: string, value: string) => void
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  section,
  selectedSection,
  editingText,
  onOpenTextEditor
}) => {
  const content = section.content || {}

  return (
    <div className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}>
      <EditableText
        tag="h2"
        sectionId={section.id}
        field="heading"
        value={content.heading || 'Gallery'}
        className="text-3xl font-bold mb-6 text-center outline-none hover:bg-white/50 px-2 py-1 rounded transition"
        isEditing={editingText?.sectionId === section.id && editingText?.field === "heading"}
        onOpenEditor={onOpenTextEditor}
      />
      <div className="grid grid-cols-3 gap-4">
        {Array(6).fill(null).map((_, idx) => (
          <div key={idx} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">Image {idx + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
