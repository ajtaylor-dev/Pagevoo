import React, { useState } from 'react'

interface ContactFormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'file'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select fields
  rows?: number // For textarea
}

interface ContactFormSectionProps {
  formId: string
  formConfig: {
    name: string
    formType: 'general' | 'support' | 'mass_mailer'
    fields: ContactFormField[]
    submitButtonText: string
    allowAttachments: boolean
    allowedFileTypes?: string[]
    styling?: {
      containerBg?: string
      fieldBg?: string
      fieldBorder?: string
      fieldText?: string
      buttonBg?: string
      buttonText?: string
      labelText?: string
    }
    spamProtection?: {
      honeypot?: boolean
      recaptchaType?: 'v2' | 'v3'
      recaptchaSiteKey?: string
    }
  }
}

export const ContactFormSection: React.FC<ContactFormSectionProps> = ({ formId, formConfig }) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [attachments, setAttachments] = useState<File[]>([])
  const [honeypot, setHoneypot] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [ticketNumber, setTicketNumber] = useState<string | null>(null)

  const styling = formConfig.styling || {}

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)

      // Validate file types if specified
      if (formConfig.allowedFileTypes && formConfig.allowedFileTypes.length > 0) {
        const invalidFiles = files.filter(file => {
          const extension = file.name.split('.').pop()?.toLowerCase()
          return !formConfig.allowedFileTypes?.includes(extension || '')
        })

        if (invalidFiles.length > 0) {
          alert(`Invalid file types. Allowed: ${formConfig.allowedFileTypes.join(', ')}`)
          return
        }
      }

      // Validate file sizes (10MB max per file)
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        alert('Some files exceed the 10MB size limit')
        return
      }

      setAttachments(files)
    }
  }

  const validateForm = (): boolean => {
    // Check required fields
    for (const field of formConfig.fields) {
      if (field.required && !formData[field.id]) {
        setErrorMessage(`Please fill in ${field.label}`)
        return false
      }
    }

    // Validate email fields
    const emailFields = formConfig.fields.filter(f => f.type === 'email')
    for (const field of emailFields) {
      const email = formData[field.id]
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorMessage(`Please enter a valid email for ${field.label}`)
        return false
      }
    }

    // Check honeypot (should be empty)
    if (formConfig.spamProtection?.honeypot && honeypot) {
      setErrorMessage('Spam detected')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Prepare form data
      const submitData = new FormData()
      submitData.append('data', JSON.stringify(formData))

      // Add attachments if any
      if (formConfig.allowAttachments && attachments.length > 0) {
        attachments.forEach((file, index) => {
          submitData.append(`attachments[${index}]`, file)
        })
      }

      // Handle reCAPTCHA if enabled
      if (formConfig.spamProtection?.recaptchaType === 'v3') {
        // TODO: Get reCAPTCHA token and add to submitData
      }

      // Submit form
      const response = await fetch(`/api/v1/contact-forms/${formId}/submit`, {
        method: 'POST',
        body: submitData,
      })

      const result = await response.json()

      if (result.success) {
        setSubmitStatus('success')
        setFormData({})
        setAttachments([])

        // Store ticket number if this is a support form
        if (result.data?.ticket_number) {
          setTicketNumber(result.data.ticket_number)
        }
      } else {
        setSubmitStatus('error')
        setErrorMessage(result.message || 'Submission failed. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('An error occurred. Please try again.')
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: ContactFormField) => {
    const baseInputClasses = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
      styling.fieldBorder || 'border-gray-300'
    } ${styling.fieldBg || 'bg-white'} ${styling.fieldText || 'text-gray-900'}`

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 4}
            className={baseInputClasses}
          />
        )

      case 'select':
        return (
          <select
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className={baseInputClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'file':
        return (
          <input
            type="file"
            id={field.id}
            onChange={handleFileChange}
            required={field.required}
            multiple={formConfig.allowAttachments}
            accept={formConfig.allowedFileTypes?.map(type => `.${type}`).join(',')}
            className={baseInputClasses}
          />
        )

      default:
        return (
          <input
            type={field.type}
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={baseInputClasses}
          />
        )
    }
  }

  return (
    <div
      className={`contact-form-section w-full ${styling.containerBg || 'bg-gray-50'} p-6 rounded-lg`}
    >
      {submitStatus === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-2xl mb-2">✓</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Thank you for your submission!
          </h3>
          <p className="text-green-700">
            {formConfig.formType === 'support' && ticketNumber
              ? `Your support ticket ${ticketNumber} has been created. We'll get back to you soon.`
              : 'We have received your message and will respond shortly.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formConfig.fields.map(field => (
            <div key={field.id}>
              <label
                htmlFor={field.id}
                className={`block text-sm font-medium mb-1 ${styling.labelText || 'text-gray-700'}`}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

          {/* Support form specific fields */}
          {formConfig.formType === 'support' && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-1 ${styling.labelText || 'text-gray-700'}`}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                    styling.fieldBorder || 'border-gray-300'
                  } ${styling.fieldBg || 'bg-white'} ${styling.fieldText || 'text-gray-900'}`}
                >
                  <option value="">Select Category</option>
                  <option value="technical">Technical Support</option>
                  <option value="billing">Billing</option>
                  <option value="general">General Inquiry</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${styling.labelText || 'text-gray-700'}`}>
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority || 'medium'}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                    styling.fieldBorder || 'border-gray-300'
                  } ${styling.fieldBg || 'bg-white'} ${styling.fieldText || 'text-gray-900'}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </>
          )}

          {/* File attachments */}
          {formConfig.allowAttachments && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${styling.labelText || 'text-gray-700'}`}>
                Attachments (Optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                accept={formConfig.allowedFileTypes?.map(type => `.${type}`).join(',')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                  styling.fieldBorder || 'border-gray-300'
                } ${styling.fieldBg || 'bg-white'} ${styling.fieldText || 'text-gray-900'}`}
              />
              {formConfig.allowedFileTypes && (
                <p className="text-xs text-gray-500 mt-1">
                  Allowed types: {formConfig.allowedFileTypes.join(', ').toUpperCase()} (Max 10MB per file)
                </p>
              )}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center">
                      <span>📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Honeypot field (hidden from users, visible to bots) */}
          {formConfig.spamProtection?.honeypot && (
            <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
          )}

          {/* reCAPTCHA v2 */}
          {formConfig.spamProtection?.recaptchaType === 'v2' && formConfig.spamProtection.recaptchaSiteKey && (
            <div className="flex justify-center">
              <div
                className="g-recaptcha"
                data-sitekey={formConfig.spamProtection.recaptchaSiteKey}
              />
            </div>
          )}

          {/* Error message */}
          {submitStatus === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              styling.buttonBg || 'bg-[#98b290]'
            } ${styling.buttonText || 'text-white'} ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          >
            {isSubmitting ? 'Submitting...' : formConfig.submitButtonText}
          </button>
        </form>
      )}
    </div>
  )
}
