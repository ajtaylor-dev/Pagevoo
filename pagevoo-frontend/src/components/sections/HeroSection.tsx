import React from 'react'
import { EditableText } from '../EditableText'

interface HeroSectionProps {
  section: {
    id: number
    section_id?: string
    content: any
  }
  selectedSection: any
  editingText: { sectionId: number; field: string; value: string } | null
  onOpenTextEditor: (sectionId: number, field: string, value: string) => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  section,
  selectedSection,
  editingText,
  onOpenTextEditor
}) => {
  const content = section.content || {}

  return (
    <div className={`relative min-h-[400px] bg-gradient-to-br from-[#98b290] to-[#7a9274] flex items-center justify-center text-white p-12 cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}>
      <div className="text-center max-w-3xl">
        <EditableText
          tag="h1"
          sectionId={section.id}
          field="title"
          value={content.title || 'Welcome'}
          className="text-5xl font-bold mb-4 outline-none hover:bg-white/10 px-2 py-1 rounded transition"
          isEditing={editingText?.sectionId === section.id && editingText?.field === "title"}
          onOpenEditor={onOpenTextEditor}
        />
        <EditableText
          tag="p"
          sectionId={section.id}
          field="subtitle"
          value={content.subtitle || 'Your subtitle here'}
          className="text-xl mb-6 outline-none hover:bg-white/10 px-2 py-1 rounded transition"
          isEditing={editingText?.sectionId === section.id && editingText?.field === "subtitle"}
          onOpenEditor={onOpenTextEditor}
        />
        <EditableText
          tag="button"
          sectionId={section.id}
          field="cta_text"
          value={content.cta_text || 'Get Started'}
          className="px-8 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition outline-none"
          isEditing={editingText?.sectionId === section.id && editingText?.field === "cta_text"}
          onOpenEditor={onOpenTextEditor}
        />
      </div>
    </div>
  )
}
