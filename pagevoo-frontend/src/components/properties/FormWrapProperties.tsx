import React, { useState } from 'react'
import {
  ChevronDown, ChevronRight, MessageSquare,
  Settings, Type, Plus, Trash2, GripVertical, Pencil,
  Palette
} from 'lucide-react'
import { HexColorPicker } from 'react-colorful'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface FormWrapPropertiesProps {
  selectedSection: TemplateSection
  onUpdateContent: (sectionId: number, content: any) => void
  onOpenTextEditor?: (sectionId: number, field: string, currentValue: string) => void
}

// Form field types that have options (checkbox, radio, dropdown)
const OPTION_FIELD_TYPES = ['contact-form-radio', 'contact-form-checkbox', 'contact-form-dropdown']

export const FormWrapProperties: React.FC<FormWrapPropertiesProps> = ({
  selectedSection,
  onUpdateContent,
  onOpenTextEditor
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    fields: true,
    autoResponder: false,
    formCSS: false
  })
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)

  const content = selectedSection.content || {}
  const formConfig = content.formConfig || {
    formId: null,
    name: '',
    formType: 'general',
    recipientEmail: '',
    spamProtection: { honeypot: false, recaptchaType: '' },
    storageOptions: { database: true, email: true },
    autoResponder: {
      enabled: false,
      subject: 'Thank you for contacting us',
      message: 'We have received your message and will get back to you soon.'
    },
    allowAttachments: false,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
    submitButtonText: 'Send Message',
    isConfigured: false,
    formTitle: 'Contact Us',
    formSubtitle: "We'd love to hear from you"
  }

  const formFields = content.formFields || []
  const formCSS = content.formCSS || {
    container: {},
    input: {},
    label: {},
    button: {}
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateFormConfig = (updates: Partial<typeof formConfig>) => {
    const newFormConfig = { ...formConfig, ...updates }
    onUpdateContent(selectedSection.id, {
      ...content,
      formConfig: newFormConfig
    })
  }

  const updateNestedConfig = (key: string, updates: any) => {
    updateFormConfig({
      [key]: { ...(formConfig[key as keyof typeof formConfig] as object), ...updates }
    })
  }

  const updateFormField = (index: number, updates: any) => {
    const updatedFields = formFields.map((field: any, i: number) =>
      i === index ? { ...field, ...updates } : field
    )
    onUpdateContent(selectedSection.id, {
      ...content,
      formFields: updatedFields
    })
  }

  const removeFormField = (index: number) => {
    const updatedFields = formFields.filter((_: any, i: number) => i !== index)
    onUpdateContent(selectedSection.id, {
      ...content,
      formFields: updatedFields
    })
    if (editingFieldIndex === index) setEditingFieldIndex(null)
  }

  const addFieldOption = (fieldIndex: number) => {
    const field = formFields[fieldIndex]
    const options = field.options || []
    const newOption = { value: `option${options.length + 1}`, label: `Option ${options.length + 1}` }
    updateFormField(fieldIndex, { options: [...options, newOption] })
  }

  const updateFieldOption = (fieldIndex: number, optionIndex: number, updates: any) => {
    const field = formFields[fieldIndex]
    const options = [...(field.options || [])]
    options[optionIndex] = { ...options[optionIndex], ...updates }
    updateFormField(fieldIndex, { options })
  }

  const removeFieldOption = (fieldIndex: number, optionIndex: number) => {
    const field = formFields[fieldIndex]
    const options = (field.options || []).filter((_: any, i: number) => i !== optionIndex)
    updateFormField(fieldIndex, { options })
  }

  const updateFormCSS = (category: string, property: string, value: string) => {
    const newFormCSS = {
      ...formCSS,
      [category]: {
        ...formCSS[category],
        [property]: value
      }
    }
    onUpdateContent(selectedSection.id, {
      ...content,
      formCSS: newFormCSS
    })
  }

  const SectionHeader = ({
    title,
    icon: Icon,
    sectionKey
  }: {
    title: string
    icon: React.ElementType
    sectionKey: string
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium text-gray-200 transition"
    >
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="flex-1 text-left">{title}</span>
      {expandedSections[sectionKey] ? (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )

  const ColorPickerField = ({
    label,
    value,
    category,
    property
  }: {
    label: string
    value: string
    category: string
    property: string
  }) => {
    const pickerId = `${category}-${property}`
    return (
      <div className="relative">
        <label className="text-[10px] text-gray-400 block mb-1">{label}</label>
        <div className="flex gap-2">
          <button
            onClick={() => setShowColorPicker(showColorPicker === pickerId ? null : pickerId)}
            className="w-8 h-8 rounded border border-gray-600 flex-shrink-0"
            style={{ backgroundColor: value || '#ffffff' }}
          />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateFormCSS(category, property, e.target.value)}
            placeholder="#ffffff"
            className="flex-1 px-2 py-1 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
          />
        </div>
        {showColorPicker === pickerId && (
          <div className="absolute z-50 mt-2 p-2 bg-gray-800 rounded-lg shadow-xl border border-gray-600">
            <HexColorPicker
              color={value || '#ffffff'}
              onChange={(color) => updateFormCSS(category, property, color)}
            />
            <button
              onClick={() => setShowColorPicker(null)}
              className="mt-2 w-full px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    )
  }

  const CSSInputField = ({
    label,
    value,
    category,
    property,
    placeholder = '0px'
  }: {
    label: string
    value: string
    category: string
    property: string
    placeholder?: string
  }) => (
    <div>
      <label className="text-[10px] text-gray-400 block mb-1">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => updateFormCSS(category, property, e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
      />
    </div>
  )

  return (
    <div className="space-y-3">
      {/* General Settings */}
      <div>
        <SectionHeader title="General Settings" icon={Settings} sectionKey="general" />
        {expandedSections.general && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Form Name</label>
              <input
                type="text"
                value={formConfig.name || ''}
                onChange={(e) => updateFormConfig({ name: e.target.value })}
                placeholder="Contact Form"
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Recipient Email</label>
              <input
                type="email"
                value={formConfig.recipientEmail || ''}
                onChange={(e) => updateFormConfig({ recipientEmail: e.target.value })}
                placeholder="admin@example.com"
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
              <p className="text-[10px] text-gray-500 mt-1">Where form submissions will be sent</p>
            </div>

            {/* Form Title - Editable */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Form Title</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={formConfig.formTitle || 'Contact Us'}
                  onChange={(e) => updateFormConfig({ formTitle: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                />
                {onOpenTextEditor && (
                  <button
                    onClick={() => onOpenTextEditor(selectedSection.id, 'formTitle', formConfig.formTitle || 'Contact Us')}
                    className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    title="Edit with WYSIWYG"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Form Subtitle - Editable */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Form Subtitle</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={formConfig.formSubtitle || "We'd love to hear from you"}
                  onChange={(e) => updateFormConfig({ formSubtitle: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                />
                {onOpenTextEditor && (
                  <button
                    onClick={() => onOpenTextEditor(selectedSection.id, 'formSubtitle', formConfig.formSubtitle || "We'd love to hear from you")}
                    className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    title="Edit with WYSIWYG"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Form Type</label>
              <select
                value={formConfig.formType || 'general'}
                onChange={(e) => updateFormConfig({ formType: e.target.value as 'general' | 'support' | 'mass_mailer' })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              >
                <option value="general">General Contact</option>
                <option value="support">Support Ticket</option>
                <option value="mass_mailer">Newsletter/Mass Mailer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Submit Button Text</label>
              <input
                type="text"
                value={formConfig.submitButtonText || 'Send Message'}
                onChange={(e) => updateFormConfig({ submitButtonText: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Fields Management */}
      <div>
        <SectionHeader title={`Form Fields (${formFields.length})`} icon={Type} sectionKey="fields" />
        {expandedSections.fields && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-600">
            {formFields.length > 0 ? (
              formFields.map((field: any, index: number) => (
                <div key={field.id || index} className="bg-gray-700 rounded overflow-hidden">
                  {/* Field Header */}
                  <div
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-650"
                    onClick={() => setEditingFieldIndex(editingFieldIndex === index ? null : index)}
                  >
                    <GripVertical className="w-3 h-3 text-gray-500" />
                    <span className="flex-1 text-xs text-gray-200 truncate">
                      {field.label || field.name}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-600 px-1.5 py-0.5 rounded">
                      {field.type?.replace('contact-form-', '') || field.fieldType}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFormField(index)
                      }}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                      title="Remove field"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${editingFieldIndex === index ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Field Editor (Expanded) */}
                  {editingFieldIndex === index && (
                    <div className="p-2 pt-0 space-y-2 border-t border-gray-600">
                      {/* Label */}
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Label</label>
                        <input
                          type="text"
                          value={field.label || ''}
                          onChange={(e) => updateFormField(index, { label: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
                        />
                      </div>

                      {/* Placeholder (not for checkbox/radio) */}
                      {!['contact-form-checkbox', 'contact-form-radio'].includes(field.type) && (
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateFormField(index, { placeholder: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
                          />
                        </div>
                      )}

                      {/* Field Name (for form submission) */}
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Field Name (ID)</label>
                        <input
                          type="text"
                          value={field.name || ''}
                          onChange={(e) => updateFormField(index, { name: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                          className="w-full px-2 py-1 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
                        />
                      </div>

                      {/* Required Toggle */}
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required || false}
                          onChange={(e) => updateFormField(index, { required: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-800"
                        />
                        Required field
                      </label>

                      {/* Options for Radio/Checkbox/Dropdown */}
                      {OPTION_FIELD_TYPES.includes(field.type) && (
                        <div className="pt-2 border-t border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] text-gray-400">Options</label>
                            <button
                              onClick={() => addFieldOption(index)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-[10px] text-white"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          <div className="space-y-1">
                            {(field.options || []).map((opt: any, optIndex: number) => (
                              <div key={optIndex} className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={opt.label || ''}
                                  onChange={(e) => updateFieldOption(index, optIndex, {
                                    label: e.target.value,
                                    value: e.target.value.replace(/\s/g, '_').toLowerCase()
                                  })}
                                  placeholder="Option label"
                                  className="flex-1 px-2 py-1 border border-gray-600 rounded text-[10px] bg-gray-800 text-gray-200"
                                />
                                <button
                                  onClick={() => removeFieldOption(index, optIndex)}
                                  className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                  title="Remove option"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {(!field.options || field.options.length === 0) && (
                              <p className="text-[10px] text-gray-500 italic">No options yet. Click Add to create options.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-500 py-2">
                Drag form fields from the sidebar into this form container
              </p>
            )}
          </div>
        )}
      </div>

      {/* Form CSS Styling */}
      <div>
        <SectionHeader title="Form Styling" icon={Palette} sectionKey="formCSS" />
        {expandedSections.formCSS && (
          <div className="mt-2 space-y-4 pl-2 border-l-2 border-gray-600">
            {/* Container Styles */}
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-2">Form Container</h4>
              <div className="grid grid-cols-2 gap-2">
                <CSSInputField label="Width" value={formCSS.container?.width} category="container" property="width" placeholder="600px" />
                <CSSInputField label="Max Width" value={formCSS.container?.maxWidth} category="container" property="maxWidth" placeholder="100%" />
                <CSSInputField label="Padding" value={formCSS.container?.padding} category="container" property="padding" placeholder="32px" />
                <CSSInputField label="Margin" value={formCSS.container?.margin} category="container" property="margin" placeholder="0 auto" />
                <CSSInputField label="Border Radius" value={formCSS.container?.borderRadius} category="container" property="borderRadius" placeholder="8px" />
                <CSSInputField label="Border Width" value={formCSS.container?.borderWidth} category="container" property="borderWidth" placeholder="0px" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <ColorPickerField label="Background" value={formCSS.container?.backgroundColor || '#f9fafb'} category="container" property="backgroundColor" />
                <ColorPickerField label="Border Color" value={formCSS.container?.borderColor || '#e5e7eb'} category="container" property="borderColor" />
              </div>
            </div>

            {/* Input Styles */}
            <div className="pt-3 border-t border-gray-600">
              <h4 className="text-xs font-medium text-gray-300 mb-2">Input Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                <CSSInputField label="Padding" value={formCSS.input?.padding} category="input" property="padding" placeholder="8px 12px" />
                <CSSInputField label="Font Size" value={formCSS.input?.fontSize} category="input" property="fontSize" placeholder="16px" />
                <CSSInputField label="Border Radius" value={formCSS.input?.borderRadius} category="input" property="borderRadius" placeholder="6px" />
                <CSSInputField label="Border Width" value={formCSS.input?.borderWidth} category="input" property="borderWidth" placeholder="1px" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <ColorPickerField label="Background" value={formCSS.input?.backgroundColor || '#ffffff'} category="input" property="backgroundColor" />
                <ColorPickerField label="Border Color" value={formCSS.input?.borderColor || '#d1d5db'} category="input" property="borderColor" />
                <ColorPickerField label="Text Color" value={formCSS.input?.color || '#374151'} category="input" property="color" />
                <ColorPickerField label="Focus Border" value={formCSS.input?.focusBorderColor || '#3b82f6'} category="input" property="focusBorderColor" />
              </div>
            </div>

            {/* Label Styles */}
            <div className="pt-3 border-t border-gray-600">
              <h4 className="text-xs font-medium text-gray-300 mb-2">Labels</h4>
              <div className="grid grid-cols-2 gap-2">
                <CSSInputField label="Font Size" value={formCSS.label?.fontSize} category="label" property="fontSize" placeholder="14px" />
                <CSSInputField label="Font Weight" value={formCSS.label?.fontWeight} category="label" property="fontWeight" placeholder="500" />
                <CSSInputField label="Margin Bottom" value={formCSS.label?.marginBottom} category="label" property="marginBottom" placeholder="8px" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <ColorPickerField label="Text Color" value={formCSS.label?.color || '#374151'} category="label" property="color" />
              </div>
            </div>

            {/* Button Styles */}
            <div className="pt-3 border-t border-gray-600">
              <h4 className="text-xs font-medium text-gray-300 mb-2">Submit Button</h4>
              <div className="grid grid-cols-2 gap-2">
                <CSSInputField label="Padding" value={formCSS.button?.padding} category="button" property="padding" placeholder="12px 16px" />
                <CSSInputField label="Font Size" value={formCSS.button?.fontSize} category="button" property="fontSize" placeholder="16px" />
                <CSSInputField label="Font Weight" value={formCSS.button?.fontWeight} category="button" property="fontWeight" placeholder="500" />
                <CSSInputField label="Border Radius" value={formCSS.button?.borderRadius} category="button" property="borderRadius" placeholder="6px" />
                <CSSInputField label="Width" value={formCSS.button?.width} category="button" property="width" placeholder="100%" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <ColorPickerField label="Background" value={formCSS.button?.backgroundColor || '#3b82f6'} category="button" property="backgroundColor" />
                <ColorPickerField label="Text Color" value={formCSS.button?.color || '#ffffff'} category="button" property="color" />
                <ColorPickerField label="Hover BG" value={formCSS.button?.hoverBackgroundColor || '#2563eb'} category="button" property="hoverBackgroundColor" />
              </div>
            </div>

            {/* Title Styles */}
            <div className="pt-3 border-t border-gray-600">
              <h4 className="text-xs font-medium text-gray-300 mb-2">Title & Subtitle</h4>
              <div className="grid grid-cols-2 gap-2">
                <CSSInputField label="Title Font Size" value={formCSS.title?.fontSize} category="title" property="fontSize" placeholder="24px" />
                <CSSInputField label="Title Weight" value={formCSS.title?.fontWeight} category="title" property="fontWeight" placeholder="700" />
                <CSSInputField label="Subtitle Size" value={formCSS.subtitle?.fontSize} category="subtitle" property="fontSize" placeholder="14px" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <ColorPickerField label="Title Color" value={formCSS.title?.color || '#111827'} category="title" property="color" />
                <ColorPickerField label="Subtitle Color" value={formCSS.subtitle?.color || '#6b7280'} category="subtitle" property="color" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto Responder */}
      <div>
        <SectionHeader title="Auto Responder" icon={MessageSquare} sectionKey="autoResponder" />
        {expandedSections.autoResponder && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.autoResponder?.enabled || false}
                onChange={(e) => updateNestedConfig('autoResponder', { enabled: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800"
              />
              Enable Auto-Response
            </label>
            {formConfig.autoResponder?.enabled && (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={formConfig.autoResponder?.subject || ''}
                    onChange={(e) => updateNestedConfig('autoResponder', { subject: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Message</label>
                  <textarea
                    value={formConfig.autoResponder?.message || ''}
                    onChange={(e) => updateNestedConfig('autoResponder', { message: e.target.value })}
                    rows={3}
                    className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290] resize-none"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Configuration Status */}
      <div className="pt-3 border-t border-gray-600">
        <button
          onClick={() => {
            const isConfigured = !!formConfig.name
            updateFormConfig({ isConfigured })
          }}
          className={`w-full px-3 py-2 rounded text-xs font-medium transition ${
            formConfig.isConfigured
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {formConfig.isConfigured ? 'Form Configured' : 'Mark as Configured'}
        </button>
        {!formConfig.name && (
          <p className="text-[10px] text-amber-400 mt-1">* Form name required</p>
        )}
      </div>
    </div>
  )
}
