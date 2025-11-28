import React from 'react'

interface ContactFormPreviewProps {
  section: {
    id: number
    type: string
    section_id?: string
    content: any
  }
  selectedSection: any
}

export const ContactFormPreview: React.FC<ContactFormPreviewProps> = ({
  section,
  selectedSection
}) => {
  const content = section.content || {}
  const isSelected = selectedSection?.id === section.id

  // Render based on section type
  const renderPreview = () => {
    switch (section.type) {
      case 'contact-form-input':
        return (
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {content.label || 'Text Input'}
            </label>
            <input
              type="text"
              placeholder={content.placeholder || 'Enter text...'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        )

      case 'contact-form-email':
        return (
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {content.label || 'Email'}
            </label>
            <input
              type="email"
              placeholder={content.placeholder || 'your@email.com'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        )

      case 'contact-form-textarea':
        return (
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {content.label || 'Message'}
            </label>
            <textarea
              placeholder={content.placeholder || 'Enter your message...'}
              rows={content.rows || 4}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 resize-none"
            />
          </div>
        )

      case 'contact-form-dropdown':
        return (
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {content.label || 'Select Option'}
            </label>
            <select
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            >
              <option>Select an option</option>
              {(content.options || ['Option 1', 'Option 2', 'Option 3']).map((opt: string, idx: number) => (
                <option key={idx}>{opt}</option>
              ))}
            </select>
          </div>
        )

      case 'contact-form-checkbox':
        return (
          <div className="p-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                disabled
                className="rounded border-gray-300"
              />
              {content.label || 'I agree to the terms and conditions'}
            </label>
          </div>
        )

      case 'contact-form-submit':
        return (
          <div className="p-4">
            <button
              disabled
              className="w-full bg-[#98b290] text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed"
            >
              {content.buttonText || 'Submit'}
            </button>
          </div>
        )

      case 'contact-form-phone':
        return (
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {content.label || 'Phone'}
            </label>
            <input
              type="tel"
              placeholder={content.placeholder || '(555) 123-4567'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        )

      case 'contact-form-radio':
        return (
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {content.label || 'Select Option'}
            </label>
            <div className="space-y-2">
              {(content.options || [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }]).map((opt: any, idx: number) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" disabled name={`radio-${section.id}`} className="border-gray-300" />
                  {typeof opt === 'string' ? opt : opt.label}
                </label>
              ))}
            </div>
          </div>
        )

      case 'contact-form-file':
        return (
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {content.label || 'Attachment'}
            </label>
            <input
              type="file"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
          </div>
        )

      default:
        return (
          <div className="p-4 text-gray-500 text-center">
            Contact Form Element
          </div>
        )
    }
  }

  return (
    <div
      id={section.section_id || `section-${section.id}`}
      className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition bg-white ${
        isSelected ? 'ring-2 ring-[#98b290]' : ''
      }`}
    >
      {renderPreview()}
    </div>
  )
}
