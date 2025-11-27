// Form Section Templates - Additional contact form components
import { createDefaultContentCSS, getDefaultSectionCSS } from './sectionTemplates'

// Form Container Template - the wrapper for building custom forms
export const formWrapSection = {
  type: 'form-wrap',
  label: 'Form Container',
  description: 'Container for form fields - drag fields inside',
  category: 'contact-form',
  isFormContainer: true,
  cols: 1,
  rows: 1,
  colWidths: [12],
  defaultContent: {
    columns: [{
      content: `<div class="form-wrap-container" style="max-width: 600px; margin: 0 auto; padding: 2rem; background: #f9fafb; border-radius: 0.5rem;">
  <h2 class="form-title" style="font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; text-align: center;">Contact Us</h2>
  <p class="form-subtitle" style="color: #6b7280; font-size: 0.875rem; text-align: center; margin-bottom: 1.5rem;">We'd love to hear from you</p>
  <div class="form-fields-area" data-form-fields="true">
    <!-- Form fields will be rendered here -->
  </div>
  <div class="form-submit-area" style="margin-top: 1.5rem;">
    <button type="submit" class="form-submit-btn" style="width: 100%; padding: 0.75rem; background-color: #3b82f6; color: white; border: none; border-radius: 0.375rem; font-size: 1rem; font-weight: 500; cursor: pointer;">
      Send Message
    </button>
  </div>
</div>`,
      colWidth: 12
    }],
    formConfig: {
      formId: null,
      name: '',
      formType: 'general' as const,
      recipientEmail: '',
      spamProtection: { honeypot: false, recaptchaType: '' as const },
      storageOptions: { database: true, email: true },
      autoResponder: {
        enabled: false,
        subject: 'Thank you for contacting us',
        message: 'We have received your message and will get back to you soon.'
      },
      allowAttachments: false,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
      submitButtonText: 'Send Message',
      isConfigured: false
    },
    formFields: [] as any[],
    content_css: createDefaultContentCSS(1),
    section_css: getDefaultSectionCSS()
  }
}

// Phone Input field
export const phoneInputSection = {
  type: 'contact-form-phone',
  label: 'Phone Input',
  description: 'Phone number input field',
  category: 'contact-form',
  isFormField: true,
  cols: 1,
  rows: 1,
  colWidths: [12],
  defaultContent: {
    columns: [{
      content: `<div style="margin-bottom: 1rem;">
  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Phone</label>
  <input type="tel" name="phone" placeholder="(555) 123-4567" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;" />
</div>`,
      colWidth: 12
    }],
    fieldConfig: {
      fieldType: 'tel',
      name: 'phone',
      label: 'Phone',
      placeholder: '(555) 123-4567',
      required: false,
      validation: 'phone'
    },
    content_css: createDefaultContentCSS(1),
    section_css: 'padding: 0.5rem 2rem;'
  }
}

// Radio Group field
export const radioGroupSection = {
  type: 'contact-form-radio',
  label: 'Radio Group',
  description: 'Radio button group for single selection',
  category: 'contact-form',
  isFormField: true,
  cols: 1,
  rows: 1,
  colWidths: [12],
  defaultContent: {
    columns: [{
      content: `<div style="margin-bottom: 1rem;">
  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Preferred Contact Method</label>
  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
    <label style="display: flex; align-items: center; cursor: pointer;">
      <input type="radio" name="contact_method" value="email" style="width: 1rem; height: 1rem; margin-right: 0.5rem;" />
      <span style="color: #374151;">Email</span>
    </label>
    <label style="display: flex; align-items: center; cursor: pointer;">
      <input type="radio" name="contact_method" value="phone" style="width: 1rem; height: 1rem; margin-right: 0.5rem;" />
      <span style="color: #374151;">Phone</span>
    </label>
  </div>
</div>`,
      colWidth: 12
    }],
    fieldConfig: {
      fieldType: 'radio',
      name: 'contact_method',
      label: 'Preferred Contact Method',
      required: false,
      validation: null,
      options: [
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' }
      ]
    },
    content_css: createDefaultContentCSS(1),
    section_css: 'padding: 0.5rem 2rem;'
  }
}

// File Upload field
export const fileUploadSection = {
  type: 'contact-form-file',
  label: 'File Upload',
  description: 'File attachment field',
  category: 'contact-form',
  isFormField: true,
  cols: 1,
  rows: 1,
  colWidths: [12],
  defaultContent: {
    columns: [{
      content: `<div style="margin-bottom: 1rem;">
  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Attachment</label>
  <input type="file" name="attachment" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; background: white;" />
  <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">Max file size: 10MB</p>
</div>`,
      colWidth: 12
    }],
    fieldConfig: {
      fieldType: 'file',
      name: 'attachment',
      label: 'Attachment',
      required: false,
      validation: null,
      accept: '.pdf,.doc,.docx,.jpg,.png',
      maxSize: 10485760 // 10MB
    },
    content_css: createDefaultContentCSS(1),
    section_css: 'padding: 0.5rem 2rem;'
  }
}

// Additional form sections to add to specialSections
export const additionalFormSections = [
  formWrapSection,
  phoneInputSection,
  radioGroupSection,
  fileUploadSection
]

// Export form field types for use in other components
export const formFieldTypes = [
  'contact-form-input',
  'contact-form-email',
  'contact-form-phone',
  'contact-form-textarea',
  'contact-form-dropdown',
  'contact-form-checkbox',
  'contact-form-radio',
  'contact-form-file'
]

// Type definitions for form configuration
export interface FormConfig {
  formId: number | null
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
  isConfigured: boolean
}

export interface FieldConfig {
  fieldType: string
  name: string
  label: string
  placeholder?: string
  required: boolean
  validation: string | null
  options?: Array<{ value: string; label: string }>
  rows?: number
  accept?: string
  maxSize?: number
}
