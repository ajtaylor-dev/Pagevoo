import React from 'react'

interface EditableTextProps {
  value: string
  className?: string
  tag?: 'div' | 'h1' | 'h2' | 'p' | 'button'
  sectionId: number
  field: string
  isEditing: boolean
  onOpenEditor: (sectionId: number, field: string, value: string) => void
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  className,
  tag = 'div',
  sectionId,
  field,
  isEditing,
  onOpenEditor
}) => {
  const Component = tag as any

  return (
    <Component
      className={`${className} ${isEditing ? 'ring-2 ring-blue-500' : ''} cursor-pointer hover:bg-blue-50 hover:bg-opacity-20 transition`}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        onOpenEditor(sectionId, field, value)
      }}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  )
}
