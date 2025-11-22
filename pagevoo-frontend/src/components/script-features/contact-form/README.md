# Contact Form Feature Documentation

## Overview

The Contact Form feature is a comprehensive form management system that allows users to create, configure, and manage contact forms on their websites. It supports three types of forms:

1. **General Contact Forms** - Standard contact forms for visitor inquiries
2. **Support Ticket Forms** - Automatic ticket generation with priority and category tracking
3. **Mass Mailer Forms** - Admin-only forms for sending mass emails (requires User Access System)

## Components

### 1. ContactFormConfigModal

A comprehensive configuration modal for creating and editing contact forms.

**Props:**
```typescript
interface ContactFormConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: ContactFormConfig) => void
  initialConfig?: Partial<ContactFormConfig>
}
```

**Features:**
- 4-tab interface (Basic Settings, Spam Protection, Storage & Email, Advanced)
- Form type selection with visual indicators
- Recipient email configuration
- Spam protection options:
  - Honeypot (invisible field trap)
  - reCAPTCHA v2 (checkbox)
  - reCAPTCHA v3 (invisible)
- Storage options (database and/or email)
- Auto-responder configuration
- File attachment settings with type restrictions
- Submit button customization
- Full validation before save

**Usage:**
```tsx
import { ContactFormConfigModal } from '@/components/script-features/contact-form'

<ContactFormConfigModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSave={handleSaveForm}
  initialConfig={existingForm}
/>
```

### 2. ContactFormSection

The actual form component that renders on the published website.

**Props:**
```typescript
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
```

**Features:**
- Dynamic field rendering (text, email, tel, textarea, select, file)
- Real-time form validation
- File upload with type and size validation (10MB max per file)
- Honeypot spam protection
- reCAPTCHA integration (v2 and v3)
- Support ticket specific fields (category, priority)
- Success/error state management
- Ticket number display for support forms
- Fully customizable styling via props

**Usage:**
```tsx
import { ContactFormSection } from '@/components/script-features/contact-form'

<ContactFormSection
  formId="123"
  formConfig={{
    name: "Contact Us",
    formType: "general",
    fields: [...],
    submitButtonText: "Send Message",
    allowAttachments: true,
    allowedFileTypes: ['pdf', 'doc', 'jpg'],
    styling: {
      containerBg: 'bg-gray-50',
      buttonBg: 'bg-[#98b290]',
      buttonText: 'text-white'
    }
  }}
/>
```

### 3. SubmissionViewer

Admin interface for viewing and managing form submissions.

**Props:**
```typescript
interface SubmissionViewerProps {
  formId: number
  isOpen: boolean
  onClose: () => void
}
```

**Features:**
- Paginated submission list
- Status filtering (all, new, read, archived, spam)
- Search by name or email
- Real-time status badges
- Support ticket information display
- Detailed submission view with:
  - Submitter information
  - All form field data
  - File attachments with download links
  - IP address and user agent tracking
  - Timestamp information
- Actions:
  - Mark as read (automatic on view)
  - Mark as spam
  - Delete submission
- Split-pane interface (list + details)

**Usage:**
```tsx
import { SubmissionViewer } from '@/components/script-features/contact-form'

<SubmissionViewer
  formId={123}
  isOpen={isViewerOpen}
  onClose={() => setIsViewerOpen(false)}
/>
```

## Service: contactFormService

Complete API integration service for all Contact Form operations.

### Methods

#### Form Management

```typescript
// Get all forms for current website
getForms(websiteId?: number): Promise<ContactFormConfig[]>

// Get specific form
getForm(formId: number): Promise<ContactFormConfig>

// Create new form
createForm(config: Omit<ContactFormConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ContactFormConfig>

// Update existing form
updateForm(formId: number, config: Partial<ContactFormConfig>): Promise<ContactFormConfig>

// Delete form
deleteForm(formId: number): Promise<void>
```

#### Submission Management

```typescript
// Get submissions with filtering and pagination
getSubmissions(
  formId: number,
  options?: {
    status?: 'new' | 'read' | 'archived' | 'spam'
    search?: string
    page?: number
    per_page?: number
  }
): Promise<SubmissionListResponse['data']>

// Mark submission as read
markSubmissionAsRead(formId: number, submissionId: number): Promise<void>

// Mark submission as spam
markSubmissionAsSpam(formId: number, submissionId: number): Promise<void>

// Delete submission
deleteSubmission(formId: number, submissionId: number): Promise<void>

// Submit form from frontend (public endpoint)
submitForm(
  formId: number,
  data: Record<string, any>,
  attachments?: File[]
): Promise<{ submission_id: number; ticket_number?: string }>
```

#### Helper Methods

```typescript
// Convert frontend config to backend format
convertToBackendFormat(frontendConfig: any): Omit<ContactFormConfig, 'id' | 'created_at' | 'updated_at'>

// Convert backend config to frontend format
convertToFrontendFormat(backendConfig: ContactFormConfig): any
```

### Usage Example

```typescript
import { contactFormService } from '@/services/contactFormService'

// Create a new form
const newForm = await contactFormService.createForm({
  website_id: 1,
  name: "Support Form",
  form_type: "support",
  recipient_email: "support@example.com",
  storage_options: {
    database: true,
    email: true
  },
  spam_protection: {
    honeypot: true,
    recaptcha_type: 'v3'
  }
})

// Get submissions
const submissions = await contactFormService.getSubmissions(newForm.id, {
  status: 'new',
  page: 1,
  per_page: 15
})

// Submit a form (from website visitor)
const result = await contactFormService.submitForm(
  formId,
  {
    name: "John Doe",
    email: "john@example.com",
    message: "I need help!"
  },
  attachmentFiles
)
```

## Backend Integration

### API Endpoints

All endpoints are prefixed with `/api/v1/script-features/contact-forms`

**Authenticated Endpoints:**
- `GET /` - List all forms for website
- `POST /` - Create new form
- `GET /{id}` - Get specific form
- `PUT /{id}` - Update form
- `DELETE /{id}` - Delete form
- `GET /{id}/submissions` - Get submissions (paginated, filterable)
- `POST /{formId}/submissions/{submissionId}/read` - Mark as read
- `POST /{formId}/submissions/{submissionId}/spam` - Mark as spam
- `DELETE /{formId}/submissions/{submissionId}` - Delete submission

**Public Endpoint:**
- `POST /api/v1/contact-forms/{id}/submit` - Submit form (no auth required)

### Database Schema

**contact_forms table:**
```sql
id, website_id, name, form_type, recipient_email,
spam_protection (JSON), storage_options (JSON),
auto_responder (JSON), allow_attachments,
allowed_file_types (JSON), styling (JSON),
created_at, updated_at
```

**form_submissions table:**
```sql
id, contact_form_id, data (JSON), attachments (JSON),
ip_address, user_agent, status,
created_at, updated_at
```

**support_tickets table:**
```sql
id, form_submission_id, ticket_number, category,
priority, status, assigned_to,
created_at, updated_at
```

## Form Types

### 1. General Contact Form

Standard contact form for general inquiries.

**Default Fields:**
- Name (required)
- Email (required)
- Subject (optional)
- Message (required, textarea)

**Use Cases:**
- Contact Us pages
- General inquiries
- Feedback forms
- Quote requests

### 2. Support Ticket Form

Automatically creates support tickets with tracking numbers.

**Additional Fields:**
- Category (required): Technical, Billing, General, Bug, Feature Request
- Priority (required): Low, Medium, High, Urgent

**Features:**
- Auto-generated ticket numbers (format: TICK-YYYYMMDD-XXXX)
- Status tracking (open, in progress, resolved, closed)
- Assignment to team members
- Priority-based organization

**Use Cases:**
- Customer support portals
- Help desk systems
- Bug reporting
- Feature requests

### 3. Mass Mailer Form

Admin-only form for sending bulk emails.

**Requirements:**
- User Access System must be installed
- User must be logged in as admin
- Restricted to authorized users only

**Use Cases:**
- Newsletter campaigns
- Announcement emails
- Marketing campaigns
- Customer notifications

## Spam Protection

### Honeypot

An invisible field that only bots will fill out. If filled, the submission is rejected.

**How it works:**
- Field is positioned off-screen using CSS
- Has `tabindex="-1"` to prevent accidental focus
- Legitimate users never see or interact with it
- Bots typically fill all fields automatically

### reCAPTCHA v2

Checkbox-based verification.

**Setup:**
1. Get reCAPTCHA site key and secret key from Google
2. Add site key to form configuration
3. Add secret key to backend settings
4. Checkbox appears above submit button

### reCAPTCHA v3

Invisible, score-based verification.

**Setup:**
1. Get reCAPTCHA v3 keys from Google
2. Add site key to form configuration
3. Add secret key to backend settings
4. Verification happens automatically on submit

## File Attachments

### Allowed File Types

Pre-configured options:
- pdf, doc, docx (documents)
- xls, xlsx (spreadsheets)
- jpg, png, gif (images)
- zip (archives)

### Validation

**Client-side:**
- File type validation against allowed types
- File size validation (10MB max per file)
- Visual feedback for selected files

**Server-side:**
- Additional type and size validation
- Secure file storage
- Organized by form and website

### Storage Path

Files are stored at:
```
storage/form_attachments/{website_id}/{form_id}/{filename}
```

## Styling Customization

All visual aspects can be customized:

```typescript
styling: {
  containerBg: 'bg-gray-50',      // Form container background
  fieldBg: 'bg-white',            // Input field background
  fieldBorder: 'border-gray-300', // Input field border
  fieldText: 'text-gray-900',     // Input field text color
  buttonBg: 'bg-[#98b290]',       // Submit button background
  buttonText: 'text-white',        // Submit button text
  labelText: 'text-gray-700'      // Field label text color
}
```

**Note:** Uses Tailwind CSS classes for consistent styling across the application.

## Auto-Responder

Automatically sends a confirmation email to form submitters.

### Configuration

```typescript
autoResponder: {
  enabled: true,
  subject: "Thank you for contacting us",
  message: "We have received your message and will get back to you soon."
}
```

### Features

- Customizable subject line
- Customizable message body
- Sent to submitter's email address
- Only sent when email storage option is enabled

## Workflow

### Admin Workflow

1. **Create Form**
   - Click Insert > Feature > Contact Form
   - Configure form in ContactFormConfigModal
   - Set form type, spam protection, storage options
   - Save configuration

2. **Add to Page**
   - Drag Contact Form section to page
   - Select which form to use
   - Customize styling if needed
   - Publish website

3. **Manage Submissions**
   - Open SubmissionViewer from Edit > Manage Features
   - Filter and search submissions
   - View submission details
   - Mark as read/spam or delete

### Visitor Workflow

1. **Fill Form**
   - Enter required information
   - Attach files if allowed
   - Complete reCAPTCHA if enabled

2. **Submit**
   - Click submit button
   - See loading state while processing
   - Receive success/error feedback

3. **Confirmation**
   - See success message
   - Receive auto-responder email (if enabled)
   - Get ticket number (for support forms)

## Best Practices

### Form Design

- Keep forms short and simple
- Only ask for necessary information
- Use clear, descriptive labels
- Provide helpful placeholder text
- Group related fields together

### Spam Prevention

- Always enable honeypot (no user impact)
- Use reCAPTCHA v3 for seamless protection
- Only use reCAPTCHA v2 if v3 isn't sufficient
- Monitor spam submissions and adjust as needed

### Submission Management

- Check new submissions regularly
- Respond promptly to support tickets
- Archive old submissions periodically
- Delete spam submissions to keep database clean

### File Attachments

- Only enable when necessary
- Limit allowed file types to what you need
- Monitor storage usage
- Regularly clean up old attachments

### Performance

- Use pagination for large submission lists
- Enable database indexes for faster queries
- Archive old submissions to improve performance
- Consider email-only storage for high-volume forms

## Troubleshooting

### Forms Not Submitting

1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check authentication if required
4. Verify reCAPTCHA keys are correct
5. Check file size limits

### Submissions Not Appearing

1. Verify storage options are enabled
2. Check database connection
3. Verify website_id is correct
4. Check for validation errors
5. Review server logs

### Emails Not Sending

1. Verify email storage option is enabled
2. Check SMTP configuration
3. Verify recipient email is correct
4. Check spam folders
5. Review mail server logs

### File Uploads Failing

1. Check file size (must be under 10MB)
2. Verify file type is allowed
3. Check storage permissions
4. Verify disk space available
5. Review upload_max_filesize in php.ini

## Future Enhancements

Potential improvements for future versions:

1. **Form Builder**
   - Drag-and-drop field builder
   - Custom field types
   - Conditional logic

2. **Advanced Features**
   - Multi-page forms
   - Save and resume
   - Field prefilling from URL params

3. **Integrations**
   - CRM integration
   - Marketing automation
   - Third-party email services

4. **Analytics**
   - Submission tracking
   - Conversion rates
   - Form abandonment analysis

5. **Additional Spam Protection**
   - Custom spam filters
   - IP blocking
   - Rate limiting
   - Custom blacklists

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses
3. Check browser console logs
4. Review Laravel logs
5. Contact development team
