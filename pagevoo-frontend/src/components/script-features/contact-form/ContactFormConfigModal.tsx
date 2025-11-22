import React, { useState } from 'react'

interface ContactFormConfig {
  name: string
  formType: 'general' | 'support' | 'mass_mailer'
  recipientEmail: string
  spamProtection: {
    honeypot: boolean
    recaptchaType: '' | 'v2' | 'v3'
  }
  storageOptions: {
    database: boolean
    email: boolean
  }
  autoResponder: {
    enabled: boolean
    subject: string
    message: string
  }
  allowAttachments: boolean
  allowedFileTypes: string[]
  submitButtonText: string
}

interface ContactFormConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: ContactFormConfig) => void
  initialConfig?: Partial<ContactFormConfig>
}

export const ContactFormConfigModal: React.FC<ContactFormConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<ContactFormConfig>({
    name: initialConfig?.name || '',
    formType: initialConfig?.formType || 'general',
    recipientEmail: initialConfig?.recipientEmail || '',
    spamProtection: {
      honeypot: initialConfig?.spamProtection?.honeypot || false,
      recaptchaType: initialConfig?.spamProtection?.recaptchaType || ''
    },
    storageOptions: {
      database: initialConfig?.storageOptions?.database ?? true,
      email: initialConfig?.storageOptions?.email ?? true
    },
    autoResponder: {
      enabled: initialConfig?.autoResponder?.enabled || false,
      subject: initialConfig?.autoResponder?.subject || 'Thank you for contacting us',
      message: initialConfig?.autoResponder?.message || 'We have received your message and will get back to you soon.'
    },
    allowAttachments: initialConfig?.allowAttachments || false,
    allowedFileTypes: initialConfig?.allowedFileTypes || ['pdf', 'doc', 'docx', 'jpg', 'png'],
    submitButtonText: initialConfig?.submitButtonText || 'Send Message'
  })

  const [activeTab, setActiveTab] = useState<'basic' | 'spam' | 'storage' | 'advanced'>('basic')

  if (!isOpen) return null

  const handleSave = () => {
    // Validation
    if (!config.name) {
      alert('Please enter a form name')
      return
    }
    if (!config.recipientEmail) {
      alert('Please enter a recipient email')
      return
    }
    if (!config.storageOptions.database && !config.storageOptions.email) {
      alert('Please select at least one storage option')
      return
    }

    onSave(config)
    onClose()
  }

  const updateConfig = (updates: Partial<ContactFormConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateNested = <K extends keyof ContactFormConfig>(
    key: K,
    updates: Partial<ContactFormConfig[K]>
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialConfig ? 'Edit Contact Form' : 'Create Contact Form'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure your contact form settings
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            {[
              { id: 'basic', label: 'Basic Settings' },
              { id: 'spam', label: 'Spam Protection' },
              { id: 'storage', label: 'Storage & Email' },
              { id: 'advanced', label: 'Advanced' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#98b290] text-[#98b290]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  placeholder="e.g., Main Contact Form, Support Request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <p className="text-xs text-gray-500 mt-1">Internal name for admin reference</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={config.formType}
                  onChange={(e) => updateConfig({ formType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                >
                  <option value="general">General Contact</option>
                  <option value="support">Support Tickets</option>
                  <option value="mass_mailer">Mass Mailer (Admin Only)</option>
                </select>
                {config.formType === 'mass_mailer' && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Requires User Access System and admin login
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={config.recipientEmail}
                  onChange={(e) => updateConfig({ recipientEmail: e.target.value })}
                  placeholder="contact@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <p className="text-xs text-gray-500 mt-1">Where form submissions will be sent</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submit Button Text
                </label>
                <input
                  type="text"
                  value={config.submitButtonText}
                  onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
                  placeholder="Send Message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
              </div>
            </div>
          )}

          {/* Spam Protection Tab */}
          {activeTab === 'spam' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Enable spam protection to reduce unwanted submissions
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.spamProtection.honeypot}
                    onChange={(e) => updateNested('spamProtection', { honeypot: e.target.checked })}
                    className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Enable Honeypot (invisible field)
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Adds an invisible field that only bots will fill out
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  reCAPTCHA Protection
                </label>
                <select
                  value={config.spamProtection.recaptchaType}
                  onChange={(e) => updateNested('spamProtection', { recaptchaType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                >
                  <option value="">None</option>
                  <option value="v2">reCAPTCHA v2 (Checkbox)</option>
                  <option value="v3">reCAPTCHA v3 (Invisible)</option>
                </select>
                {config.spamProtection.recaptchaType && (
                  <p className="text-xs text-gray-500">
                    Requires reCAPTCHA API keys configured in settings
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Storage & Email Tab */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Submission Storage <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.storageOptions.database}
                      onChange={(e) => updateNested('storageOptions', { database: e.target.checked })}
                      className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Save to database (admin can view submissions)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.storageOptions.email}
                      onChange={(e) => updateNested('storageOptions', { email: e.target.checked })}
                      className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Send via email
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Select at least one option</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={config.autoResponder.enabled}
                    onChange={(e) => updateNested('autoResponder', { enabled: e.target.checked })}
                    className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Send auto-responder to submitter
                  </span>
                </label>

                {config.autoResponder.enabled && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={config.autoResponder.subject}
                        onChange={(e) => updateNested('autoResponder', { subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        value={config.autoResponder.message}
                        onChange={(e) => updateNested('autoResponder', { message: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={config.allowAttachments}
                    onChange={(e) => updateConfig({ allowAttachments: e.target.checked })}
                    className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Allow file attachments (max 10MB per file)
                  </span>
                </label>

                {config.allowAttachments && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed file types
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png', 'gif', 'zip'].map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={config.allowedFileTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateConfig({ allowedFileTypes: [...config.allowedFileTypes, type] })
                              } else {
                                updateConfig({ allowedFileTypes: config.allowedFileTypes.filter(t => t !== type) })
                              }
                            }}
                            className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                          />
                          <span className="ml-2 text-sm text-gray-700 uppercase">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {config.formType === 'support' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Support Ticket Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Auto-generates unique ticket numbers</li>
                    <li>• Includes category and priority fields</li>
                    <li>• Status tracking (open, in progress, resolved, closed)</li>
                    <li>• Assignment to team members (requires User Access System)</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#98b290] rounded-lg hover:bg-[#7a9072]"
          >
            {initialConfig ? 'Update Form' : 'Create Form'}
          </button>
        </div>
      </div>
    </div>
  )
}
