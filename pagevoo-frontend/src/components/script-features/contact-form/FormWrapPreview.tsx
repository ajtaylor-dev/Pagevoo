import React from 'react'
import { Mail, Settings, GripVertical, Type, AtSign, Phone, FileText, ListChecks, ToggleLeft, CircleDot, Paperclip } from 'lucide-react'

interface FormWrapPreviewProps {
  section: {
    id: number
    type: string
    section_id?: string
    content: any
  }
  selectedSection: any
}

// Helper to get icon for field type
const getFieldIcon = (type: string) => {
  switch (type) {
    case 'contact-form-input':
      return Type
    case 'contact-form-email':
      return AtSign
    case 'contact-form-phone':
      return Phone
    case 'contact-form-textarea':
      return FileText
    case 'contact-form-dropdown':
      return ListChecks
    case 'contact-form-checkbox':
      return ToggleLeft
    case 'contact-form-radio':
      return CircleDot
    case 'contact-form-file':
      return Paperclip
    default:
      return Type
  }
}

// Helper to get field type label
const getFieldTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'contact-form-input': 'Text',
    'contact-form-email': 'Email',
    'contact-form-phone': 'Phone',
    'contact-form-textarea': 'Message',
    'contact-form-dropdown': 'Dropdown',
    'contact-form-checkbox': 'Checkbox',
    'contact-form-radio': 'Radio',
    'contact-form-file': 'File'
  }
  return labels[type] || type
}

export const FormWrapPreview: React.FC<FormWrapPreviewProps> = ({
  section,
  selectedSection
}) => {
  const content = section.content || {}
  const isSelected = selectedSection?.id === section.id
  const formConfig = content.formConfig || {}
  const formFields = content.formFields || []
  const formCSS = content.formCSS || {}

  // Get form title from config or default
  const getFormTitle = () => {
    return formConfig.formTitle || formConfig.name || 'Contact Us'
  }

  const getFormSubtitle = () => {
    return formConfig.formSubtitle || "We'd love to hear from you"
  }

  const getSubmitButtonText = () => {
    return formConfig.submitButtonText || 'Send Message'
  }

  // Build inline styles from formCSS
  const containerStyle: React.CSSProperties = {
    maxWidth: formCSS.container?.maxWidth || formCSS.container?.width || '600px',
    width: formCSS.container?.width || '100%',
    margin: formCSS.container?.margin || '0 auto',
    padding: formCSS.container?.padding || '32px',
    backgroundColor: formCSS.container?.backgroundColor || '#f9fafb',
    borderRadius: formCSS.container?.borderRadius || '8px',
    borderWidth: formCSS.container?.borderWidth,
    borderColor: formCSS.container?.borderColor,
    borderStyle: formCSS.container?.borderWidth ? 'solid' : undefined
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: formCSS.input?.padding || '8px 12px',
    fontSize: formCSS.input?.fontSize || '16px',
    backgroundColor: formCSS.input?.backgroundColor || '#ffffff',
    borderRadius: formCSS.input?.borderRadius || '6px',
    borderWidth: formCSS.input?.borderWidth || '1px',
    borderColor: formCSS.input?.borderColor || '#d1d5db',
    borderStyle: 'solid',
    color: formCSS.input?.color || '#374151'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: formCSS.label?.fontSize || '14px',
    fontWeight: formCSS.label?.fontWeight || '500',
    color: formCSS.label?.color || '#374151',
    marginBottom: formCSS.label?.marginBottom || '8px'
  }

  const buttonStyle: React.CSSProperties = {
    width: formCSS.button?.width || '100%',
    padding: formCSS.button?.padding || '12px 16px',
    fontSize: formCSS.button?.fontSize || '16px',
    fontWeight: formCSS.button?.fontWeight || '500',
    backgroundColor: formCSS.button?.backgroundColor || '#3b82f6',
    color: formCSS.button?.color || '#ffffff',
    borderRadius: formCSS.button?.borderRadius || '6px',
    border: 'none',
    cursor: 'not-allowed',
    opacity: 0.9
  }

  const titleStyle: React.CSSProperties = {
    fontSize: formCSS.title?.fontSize || '24px',
    fontWeight: formCSS.title?.fontWeight || '700',
    color: formCSS.title?.color || '#111827',
    marginBottom: '8px',
    textAlign: 'center' as const
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: formCSS.subtitle?.fontSize || '14px',
    color: formCSS.subtitle?.color || '#6b7280',
    textAlign: 'center' as const,
    marginBottom: '24px'
  }

  return (
    <div
      id={section.section_id || `section-${section.id}`}
      className={`cursor-pointer transition ${
        isSelected ? 'ring-2 ring-[#98b290]' : 'hover:ring-2 hover:ring-[#98b290]/50'
      }`}
    >
      <div style={containerStyle} className="my-4">
        {/* Form Header */}
        <div className="text-center mb-6">
          <h2 style={titleStyle}>{getFormTitle()}</h2>
          <p style={subtitleStyle}>{getFormSubtitle()}</p>
        </div>

        {/* Form Fields Area */}
        <div className={`space-y-4 min-h-[100px] border-2 border-dashed rounded-lg p-4 transition-colors ${
          isSelected ? 'border-[#98b290] bg-[#98b290]/5' : 'border-gray-300/50 bg-white/30'
        }`}>
          {formFields.length > 0 ? (
            // Render existing form fields as form inputs preview
            formFields.map((field: any, index: number) => {
              const FieldIcon = getFieldIcon(field.type)
              return (
                <div key={field.id || index} className="group">
                  <div className="flex items-center gap-2 mb-1">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab opacity-0 group-hover:opacity-100 transition" />
                    <label style={labelStyle} className="flex-1 !mb-0">
                      {field.label || field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                      <FieldIcon className="w-3 h-3" />
                      {getFieldTypeLabel(field.type)}
                    </span>
                  </div>
                  {/* Render a preview of the field */}
                  {field.type === 'contact-form-textarea' ? (
                    <textarea
                      disabled
                      placeholder={field.placeholder || 'Enter text...'}
                      rows={3}
                      style={{...inputStyle, resize: 'none'}}
                      className="cursor-not-allowed"
                    />
                  ) : field.type === 'contact-form-dropdown' ? (
                    <select disabled style={inputStyle} className="cursor-not-allowed">
                      <option>{field.placeholder || 'Select an option'}</option>
                      {(field.options || []).map((opt: any, idx: number) => (
                        <option key={idx} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'contact-form-checkbox' ? (
                    <div className="space-y-1">
                      {(field.options || [{ value: 'checked', label: field.label || 'Checkbox' }]).map((opt: any, idx: number) => (
                        <label key={idx} className="flex items-center gap-2 text-sm cursor-not-allowed" style={{ color: labelStyle.color }}>
                          <input type="checkbox" disabled className="rounded border-gray-300" />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'contact-form-radio' ? (
                    <div className="space-y-1">
                      {(field.options || [{ value: 'opt1', label: 'Option 1' }, { value: 'opt2', label: 'Option 2' }]).map((opt: any, idx: number) => (
                        <label key={idx} className="flex items-center gap-2 text-sm cursor-not-allowed" style={{ color: labelStyle.color }}>
                          <input type="radio" disabled name={`radio-${section.id}-${index}`} className="border-gray-300" />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'contact-form-file' ? (
                    <input
                      type="file"
                      disabled
                      style={inputStyle}
                      className="cursor-not-allowed"
                    />
                  ) : (
                    <input
                      type={field.type === 'contact-form-email' ? 'email' : field.type === 'contact-form-phone' ? 'tel' : 'text'}
                      disabled
                      placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || 'text'}...`}
                      style={inputStyle}
                      className="cursor-not-allowed"
                    />
                  )}
                </div>
              )
            })
          ) : (
            // Empty state - prompt to add fields
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Mail className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium text-gray-500">No form fields yet</p>
              <p className="text-xs mt-1">Drag form fields here from the sidebar</p>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
                <Type className="w-3 h-3" />
                <AtSign className="w-3 h-3" />
                <Phone className="w-3 h-3" />
                <FileText className="w-3 h-3" />
                <ListChecks className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button Preview */}
        <div className="mt-4">
          <button disabled style={buttonStyle}>
            {getSubmitButtonText()}
          </button>
        </div>

        {/* Configuration Status */}
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-gray-400" />
              <span className={formConfig.isConfigured ? 'text-green-600' : 'text-amber-600'}>
                {formConfig.isConfigured ? 'Form configured' : 'Click to configure form settings'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {formFields.length > 0 && (
                <span className="text-gray-400">{formFields.length} field{formFields.length !== 1 ? 's' : ''}</span>
              )}
              {formConfig.recipientEmail && (
                <span className="text-gray-400 truncate max-w-[100px]" title={formConfig.recipientEmail}>
                  {formConfig.recipientEmail}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
