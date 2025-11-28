import React, { useState } from 'react'

interface ContactFormConfig {
  noreplyEmail: string
  defaultRecipientEmail: string
  spamProtection: {
    honeypot: boolean
    recaptchaType: '' | 'v2' | 'v3'
    recaptchaSiteKey?: string
    recaptchaSecretKey?: string
  }
  storageOptions: {
    database: boolean
    email: boolean
  }
  allowAttachments: boolean
  allowedFileTypes: string[]
  maxFileSize: number
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
    noreplyEmail: initialConfig?.noreplyEmail || '',
    defaultRecipientEmail: initialConfig?.defaultRecipientEmail || '',
    spamProtection: {
      honeypot: initialConfig?.spamProtection?.honeypot ?? true,
      recaptchaType: initialConfig?.spamProtection?.recaptchaType || '',
      recaptchaSiteKey: initialConfig?.spamProtection?.recaptchaSiteKey || '',
      recaptchaSecretKey: initialConfig?.spamProtection?.recaptchaSecretKey || ''
    },
    storageOptions: {
      database: initialConfig?.storageOptions?.database ?? true,
      email: initialConfig?.storageOptions?.email ?? true
    },
    allowAttachments: initialConfig?.allowAttachments ?? false,
    allowedFileTypes: initialConfig?.allowedFileTypes || ['pdf', 'doc', 'docx', 'jpg', 'png'],
    maxFileSize: initialConfig?.maxFileSize || 10
  })

  const [activeTab, setActiveTab] = useState<'email' | 'spam' | 'storage' | 'attachments'>('email')

  if (!isOpen) return null

  const handleSave = () => {
    // Validation
    if (!config.noreplyEmail) {
      alert('Please enter a noreply email address')
      return
    }
    if (!config.storageOptions.database && !config.storageOptions.email) {
      alert('Please select at least one storage option')
      return
    }
    if (config.spamProtection.recaptchaType && (!config.spamProtection.recaptchaSiteKey || !config.spamProtection.recaptchaSecretKey)) {
      alert('Please enter reCAPTCHA API keys or disable reCAPTCHA')
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Contact Form Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure global settings for all contact forms
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            {[
              { id: 'email', label: 'Email Settings' },
              { id: 'spam', label: 'Spam Protection' },
              { id: 'storage', label: 'Storage' },
              { id: 'attachments', label: 'Attachments' }
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
          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Configure the email addresses used for sending and receiving form submissions.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No-Reply Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={config.noreplyEmail}
                  onChange={(e) => updateConfig({ noreplyEmail: e.target.value })}
                  placeholder="noreply@yourdomain.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email will be used as the "From" address for auto-responder emails
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Recipient Email
                </label>
                <input
                  type="email"
                  value={config.defaultRecipientEmail}
                  onChange={(e) => updateConfig({ defaultRecipientEmail: e.target.value })}
                  placeholder="admin@yourdomain.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email will be auto-filled as the recipient for new forms. Can be overridden per form.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-amber-900 mb-1">Important</h4>
                <p className="text-sm text-amber-800">
                  Make sure your email domain's SPF and DKIM records are properly configured to prevent emails from being marked as spam.
                </p>
              </div>
            </div>
          )}

          {/* Spam Protection Tab */}
          {activeTab === 'spam' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Enable spam protection to reduce unwanted form submissions across all contact forms.
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
                    Enable Honeypot Protection
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Adds an invisible field that only bots will fill out. Recommended for all forms.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
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
                  <div className="space-y-3 mt-3 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={config.spamProtection.recaptchaSiteKey || ''}
                        onChange={(e) => updateNested('spamProtection', { recaptchaSiteKey: e.target.value })}
                        placeholder="Enter your reCAPTCHA site key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290] font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secret Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={config.spamProtection.recaptchaSecretKey || ''}
                        onChange={(e) => updateNested('spamProtection', { recaptchaSecretKey: e.target.value })}
                        placeholder="Enter your reCAPTCHA secret key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290] font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Get your keys from the <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google reCAPTCHA Admin Console</a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Storage Tab */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Choose how form submissions are stored and delivered.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Submission Storage <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={config.storageOptions.database}
                      onChange={(e) => updateNested('storageOptions', { database: e.target.checked })}
                      className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290] mt-0.5"
                    />
                    <div className="ml-2">
                      <span className="text-sm font-medium text-gray-700">Save to Database</span>
                      <p className="text-xs text-gray-500">
                        Store submissions in the database. View and manage them from the admin panel.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={config.storageOptions.email}
                      onChange={(e) => updateNested('storageOptions', { email: e.target.checked })}
                      className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290] mt-0.5"
                    />
                    <div className="ml-2">
                      <span className="text-sm font-medium text-gray-700">Send Email Notification</span>
                      <p className="text-xs text-gray-500">
                        Send an email notification to the recipient address configured on each form.
                      </p>
                    </div>
                  </label>
                </div>
                {!config.storageOptions.database && !config.storageOptions.email && (
                  <p className="text-xs text-red-500 mt-2">Please select at least one storage option</p>
                )}
              </div>
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
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
                    Allow file attachments on forms
                  </span>
                </label>

                {config.allowAttachments && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum File Size (MB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={config.maxFileSize}
                        onChange={(e) => updateConfig({ maxFileSize: parseInt(e.target.value) || 10 })}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allowed File Types
                      </label>
                      <div className="grid grid-cols-3 gap-2">
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
                  </div>
                )}
              </div>

              {config.allowAttachments && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-900 mb-1">Security Note</h4>
                  <p className="text-sm text-amber-800">
                    File uploads are scanned for malware. Only allow file types that are necessary for your use case.
                  </p>
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
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
