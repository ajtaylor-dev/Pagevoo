# PAGEVOO PHASE 2 - DETAILED FEATURE SPECIFICATIONS
**Created:** November 22, 2025
**Status:** Requirements Gathering
**Deadline:** December 9, 2025

---

## FEATURE #1: CONTACT FORM ✅ SPECIFIED

### Implementation Approach
**Special Section Type** - Users insert "Contact Form" section like any other section

### Form Types (Pre-configured)
User selects form purpose from modal:

1. **General Contact**
   - Fields: Name, Email, Phone (optional), Subject, Message
   - Use: Main contact form on website

2. **Support Tickets/Requests**
   - Fields: Name, Email, Issue Category (dropdown), Priority (dropdown), Message
   - Use: Customer support, help desk
   - Extra: Ticket number generation, status tracking

3. **Mass Mailer** ⚠️ ADMIN ONLY
   - Requires: User Access System installed + user logged in as admin
   - Fields: Subject, Message, Recipient List (select all users, by role, by tag)
   - Use: Newsletter, announcements to registered users
   - Security: Strict permission check (website owner only)

### Configuration Options (Modal)

**Form Settings:**
- Form Type: [General Contact | Support Ticket | Mass Mailer]
- Form Name: (custom label for admin reference)
- Submit Button Text: (default: "Send Message")

**Spam Protection:**
- ☐ Honeypot (invisible field)
- ☐ reCAPTCHA v2
- ☐ reCAPTCHA v3
- ☐ Both Honeypot + reCAPTCHA

**Submission Storage:**
- ☐ Save to database (admin can view submissions)
- ☐ Email only (no database storage)
- ✓ Both (save to database AND send email)

**Email Settings:**
- Recipient Email: (where to send submissions)
- ☐ Send auto-responder to submitter
- Auto-responder Subject: (if enabled)
- Auto-responder Message: (if enabled)

**Optional Features:**
- ☐ Allow file attachments (max 10MB)
- Allowed file types: (PDF, DOC, JPG, PNG)

**Styling:**
- All standard CSS controls (background, padding, border, etc.)
- Form field styling (border color, focus color, etc.)
- Button styling (same as existing button controls)

### Database Schema

```sql
contact_forms
  - id
  - website_id
  - name (admin reference)
  - form_type (enum: general, support, mass_mailer)
  - recipient_email
  - spam_protection (JSON: {honeypot: bool, recaptcha_type: string})
  - storage_options (JSON: {database: bool, email: bool})
  - auto_responder (JSON: {enabled: bool, subject: string, message: text})
  - allow_attachments (boolean)
  - allowed_file_types (JSON array)
  - styling (JSON: CSS properties)
  - created_at, updated_at

form_submissions
  - id
  - contact_form_id
  - data (JSON: submitted field values)
  - attachments (JSON: file paths if applicable)
  - ip_address
  - user_agent
  - status (enum: new, read, archived, spam)
  - created_at

support_tickets (extends form_submissions for support forms)
  - id
  - form_submission_id
  - ticket_number (generated: TICK-YYYYMMDD-XXXX)
  - category
  - priority (low, medium, high, urgent)
  - status (open, in_progress, resolved, closed)
  - assigned_to (user_id, nullable)
  - created_at, updated_at
```

### Section Component
```typescript
interface ContactFormSection {
  type: 'contact_form'
  contact_form_id: number // references contact_forms table
  section_css: string
  section_name: string
}
```

### Restrictions
- **Mass Mailer form:**
  - Only visible if User Access System installed
  - Only functional if user logged in as admin (website owner)
  - Shows error if non-admin tries to use it

### Files to Create
**Frontend:**
- `src/components/script-features/contact-form/ContactFormSection.tsx`
- `src/components/script-features/contact-form/ContactFormConfigModal.tsx`
- `src/components/script-features/contact-form/SubmissionViewer.tsx` (admin panel)

**Backend:**
- `app/Http/Controllers/Api/V1/ScriptFeatures/ContactFormController.php`
- `app/Models/ScriptFeatures/ContactForm.php`
- `app/Models/ScriptFeatures/FormSubmission.php`
- `app/Models/ScriptFeatures/SupportTicket.php`
- `app/Services/ScriptFeatures/ContactFormService.php`
- `app/Services/ScriptFeatures/SpamProtectionService.php`
- `database/migrations/xxxx_create_contact_forms_tables.php`

### Implementation Notes
- reCAPTCHA API keys stored in `.env` (global for all websites)
- File uploads stored in `storage/form_attachments/{website_id}/{form_id}/`
- Email templates use Laravel Blade views
- Spam detection logs to prevent abuse

---

## FEATURE #2: IMAGE GALLERY

### Questions:

**1. Gallery Creation**
- Should users create **named galleries** (e.g., "Portfolio", "Products", "Team Photos")?
- OR just insert **gallery sections** and manage images per-section?

**2. Gallery Display Options**
- **Grid layout** (rows and columns)? (YES/NO)
- **Masonry layout** (Pinterest-style)? (YES/NO)
- **Carousel/Slider**? (YES/NO)
- **Lightbox viewer** (click image to view full-screen)? (YES/NO)

**3. Image Management**
- Upload images **directly to gallery section**? (YES/NO)
- OR create **gallery library** then insert gallery references? (YES/NO)

**4. Image Organization**
- Support **categories/albums** within a gallery? (YES/NO)
- OR just **one flat list** of images per gallery? (YES/NO)

**5. Image Captions**
- Allow **title and description** per image? (YES/NO)

**6. Lazy Loading**
- Implement **lazy loading** for performance (load images as user scrolls)? (YES/NO)

**7. Image Limitations**
- **Trial tier:** Limit to 10 images total per website? (YES/NO)
- **Other tiers:** Unlimited images? (YES/NO)

---

Please answer these 7 questions for Image Gallery!