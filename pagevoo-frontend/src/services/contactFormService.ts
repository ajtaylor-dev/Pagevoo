import axios from 'axios'

const API_BASE = '/api/v1'

export interface ContactFormConfig {
  id?: number
  website_id: number
  name: string
  form_type: 'general' | 'support' | 'mass_mailer'
  recipient_email: string
  spam_protection?: {
    honeypot?: boolean
    recaptcha_type?: '' | 'v2' | 'v3'
    recaptcha_site_key?: string
    recaptcha_secret_key?: string
  }
  storage_options: {
    database: boolean
    email: boolean
  }
  auto_responder?: {
    enabled: boolean
    subject?: string
    message?: string
  }
  allow_attachments?: boolean
  allowed_file_types?: string[]
  submit_button_text?: string
  styling?: {
    containerBg?: string
    fieldBg?: string
    fieldBorder?: string
    fieldText?: string
    buttonBg?: string
    buttonText?: string
    labelText?: string
  }
  created_at?: string
  updated_at?: string
  submissions_count?: number
}

export interface FormSubmission {
  id: number
  contact_form_id: number
  data: Record<string, any>
  attachments: string[]
  ip_address: string
  user_agent: string
  status: 'new' | 'read' | 'archived' | 'spam'
  created_at: string
  updated_at: string
  support_ticket?: {
    id: number
    ticket_number: string
    category: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    assigned_to: number | null
  }
}

export interface SubmissionListResponse {
  success: boolean
  data: {
    data: FormSubmission[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

class ContactFormService {
  /**
   * Get all contact forms for current website
   */
  async getForms(websiteId?: number): Promise<ContactFormConfig[]> {
    const params = websiteId ? { website_id: websiteId } : {}
    const response = await axios.get<ApiResponse<ContactFormConfig[]>>(
      `${API_BASE}/script-features/contact-forms`,
      { params }
    )
    return response.data.data || []
  }

  /**
   * Get a specific contact form
   */
  async getForm(formId: number): Promise<ContactFormConfig> {
    const response = await axios.get<ApiResponse<ContactFormConfig>>(
      `${API_BASE}/script-features/contact-forms/${formId}`
    )
    if (!response.data.data) {
      throw new Error('Form not found')
    }
    return response.data.data
  }

  /**
   * Create a new contact form
   */
  async createForm(config: Omit<ContactFormConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ContactFormConfig> {
    const response = await axios.post<ApiResponse<ContactFormConfig>>(
      `${API_BASE}/script-features/contact-forms`,
      config
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create form')
    }
    return response.data.data
  }

  /**
   * Update an existing contact form
   */
  async updateForm(formId: number, config: Partial<ContactFormConfig>): Promise<ContactFormConfig> {
    const response = await axios.put<ApiResponse<ContactFormConfig>>(
      `${API_BASE}/script-features/contact-forms/${formId}`,
      config
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update form')
    }
    return response.data.data
  }

  /**
   * Delete a contact form
   */
  async deleteForm(formId: number): Promise<void> {
    const response = await axios.delete<ApiResponse>(
      `${API_BASE}/script-features/contact-forms/${formId}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete form')
    }
  }

  /**
   * Get submissions for a form
   */
  async getSubmissions(
    formId: number,
    options?: {
      status?: 'new' | 'read' | 'archived' | 'spam'
      search?: string
      page?: number
      per_page?: number
    }
  ): Promise<SubmissionListResponse['data']> {
    const response = await axios.get<SubmissionListResponse>(
      `${API_BASE}/script-features/contact-forms/${formId}/submissions`,
      { params: options }
    )
    return response.data.data
  }

  /**
   * Mark a submission as read
   */
  async markSubmissionAsRead(formId: number, submissionId: number): Promise<void> {
    const response = await axios.post<ApiResponse>(
      `${API_BASE}/script-features/contact-forms/${formId}/submissions/${submissionId}/read`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark as read')
    }
  }

  /**
   * Mark a submission as spam
   */
  async markSubmissionAsSpam(formId: number, submissionId: number): Promise<void> {
    const response = await axios.post<ApiResponse>(
      `${API_BASE}/script-features/contact-forms/${formId}/submissions/${submissionId}/spam`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark as spam')
    }
  }

  /**
   * Delete a submission
   */
  async deleteSubmission(formId: number, submissionId: number): Promise<void> {
    const response = await axios.delete<ApiResponse>(
      `${API_BASE}/script-features/contact-forms/${formId}/submissions/${submissionId}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete submission')
    }
  }

  /**
   * Submit a form from the frontend (public endpoint)
   */
  async submitForm(
    formId: number,
    data: Record<string, any>,
    attachments?: File[]
  ): Promise<{ submission_id: number; ticket_number?: string }> {
    const formData = new FormData()
    formData.append('data', JSON.stringify(data))

    if (attachments && attachments.length > 0) {
      attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file)
      })
    }

    const response = await axios.post<ApiResponse<{ submission_id: number; ticket_number?: string }>>(
      `/api/v1/contact-forms/${formId}/submit`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Submission failed')
    }

    return response.data.data
  }

  /**
   * Convert frontend config format to backend format
   */
  convertToBackendFormat(frontendConfig: any): Omit<ContactFormConfig, 'id' | 'created_at' | 'updated_at'> {
    return {
      website_id: frontendConfig.websiteId,
      name: frontendConfig.name,
      form_type: frontendConfig.formType,
      recipient_email: frontendConfig.recipientEmail,
      spam_protection: {
        honeypot: frontendConfig.spamProtection?.honeypot || false,
        recaptcha_type: frontendConfig.spamProtection?.recaptchaType || '',
        recaptcha_site_key: frontendConfig.spamProtection?.recaptchaSiteKey,
        recaptcha_secret_key: frontendConfig.spamProtection?.recaptchaSecretKey,
      },
      storage_options: {
        database: frontendConfig.storageOptions?.database ?? true,
        email: frontendConfig.storageOptions?.email ?? true,
      },
      auto_responder: frontendConfig.autoResponder?.enabled
        ? {
            enabled: true,
            subject: frontendConfig.autoResponder.subject,
            message: frontendConfig.autoResponder.message,
          }
        : { enabled: false },
      allow_attachments: frontendConfig.allowAttachments || false,
      allowed_file_types: frontendConfig.allowedFileTypes || [],
      submit_button_text: frontendConfig.submitButtonText || 'Send Message',
      styling: frontendConfig.styling,
    }
  }

  /**
   * Convert backend config format to frontend format
   */
  convertToFrontendFormat(backendConfig: ContactFormConfig): any {
    return {
      id: backendConfig.id,
      websiteId: backendConfig.website_id,
      name: backendConfig.name,
      formType: backendConfig.form_type,
      recipientEmail: backendConfig.recipient_email,
      spamProtection: {
        honeypot: backendConfig.spam_protection?.honeypot || false,
        recaptchaType: backendConfig.spam_protection?.recaptcha_type || '',
        recaptchaSiteKey: backendConfig.spam_protection?.recaptcha_site_key,
        recaptchaSecretKey: backendConfig.spam_protection?.recaptcha_secret_key,
      },
      storageOptions: {
        database: backendConfig.storage_options?.database ?? true,
        email: backendConfig.storage_options?.email ?? true,
      },
      autoResponder: {
        enabled: backendConfig.auto_responder?.enabled || false,
        subject: backendConfig.auto_responder?.subject || 'Thank you for contacting us',
        message:
          backendConfig.auto_responder?.message ||
          'We have received your message and will get back to you soon.',
      },
      allowAttachments: backendConfig.allow_attachments || false,
      allowedFileTypes: backendConfig.allowed_file_types || ['pdf', 'doc', 'docx', 'jpg', 'png'],
      submitButtonText: backendConfig.submit_button_text || 'Send Message',
      styling: backendConfig.styling,
      createdAt: backendConfig.created_at,
      updatedAt: backendConfig.updated_at,
      submissionsCount: backendConfig.submissions_count,
    }
  }
}

export const contactFormService = new ContactFormService()
