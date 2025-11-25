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
      case 'contact-form-full':
        return (
          <div className="max-w-xl mx-auto p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Us</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="Your name"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Subject"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  placeholder="Your message..."
                  rows={4}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 resize-none"
                />
              </div>

              <button
                disabled
                className="w-full bg-[#98b290] text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed"
              >
                Send Message
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Click to configure this contact form
            </p>
          </div>
        )

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
