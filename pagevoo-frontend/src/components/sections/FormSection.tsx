import React from 'react'
import { EditableText } from '../EditableText'

interface FormSectionProps {
  section: {
    id: number
    section_id?: string
    type: string
    content: any
  }
  selectedSection: any
  editingText: { sectionId: number; field: string; value: string } | null
  onOpenTextEditor: (sectionId: number, field: string, value: string) => void
}

export const FormSection: React.FC<FormSectionProps> = ({
  section,
  selectedSection,
  editingText,
  onOpenTextEditor
}) => {
  const content = section.content || {}

  return (
    <div className={`p-12 cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}>
      <EditableText
        tag="h2"
        sectionId={section.id}
        field="heading"
        value={content.heading || section.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        className="text-3xl font-bold mb-6 text-center outline-none hover:bg-gray-100 px-2 py-1 rounded transition"
        isEditing={editingText?.sectionId === section.id && editingText?.field === "heading"}
        onOpenEditor={onOpenTextEditor}
      />
      <div className="max-w-md mx-auto space-y-4">
        {(content.fields || ['name', 'email', 'message']).map((field: string, idx: number) => (
          <div key={idx} className="border-2 border-gray-300 rounded p-3 bg-gray-50">
            <span className="text-sm text-gray-600 capitalize">{field}</span>
          </div>
        ))}
        <button className="w-full px-6 py-3 bg-[#98b290] text-white rounded-lg font-semibold">
          Submit
        </button>
      </div>
    </div>
  )
}
