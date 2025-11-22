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

## FEATURE #2: IMAGE GALLERY ✅ SPECIFIED

### Implementation Approach
**Special Section Type** - Users insert "Image Gallery" section like any other section

### Gallery Structure
- **Per-section management** - Each gallery section is independent
- **Flexible library approach** - Gallery can reference shared image libraries OR use section-specific images
- **Category-based organization** - Images organized by categories within each gallery

### Display Layouts (User Selectable)
User chooses layout style from modal configuration:

1. **Grid Layout** - Traditional rows and columns
2. **Masonry Layout** - Pinterest-style dynamic grid
3. **Carousel/Slider** - Horizontal scrolling slideshow
4. **Lightbox Viewer** - Click-to-expand full-screen view

### Configuration Options (Modal)

**Gallery Settings:**
- Gallery Name: (admin reference)
- Display Layout: [Grid | Masonry | Carousel | Lightbox]
- Columns (for Grid): [2 | 3 | 4 | 6]
- Image Source: [Upload New | Link to Library | Mixed]

**Image Management:**
- ☐ Use shared image library (references existing images)
- ☐ Upload images directly to this section
- ☐ Mixed (both library references and unique uploads)

**Categories/Organization:**
- Enable image categories: (YES/NO)
- Category List: (if enabled, comma-separated)
- Default category: (for uncategorized images)
- Show category filter on frontend: (YES/NO)

**Image Display:**
- ☐ Show image captions
- Caption Style: [Below Image | Overlay on Hover | Lightbox Only]
- ☐ Show image titles
- ☐ Show image descriptions

**Performance:**
- ☐ Enable lazy loading (load images as user scrolls)
- Images per load: [10 | 20 | 50 | All]

**Styling:**
- All standard CSS controls (background, padding, border, etc.)
- Image spacing (gap between images)
- Image border radius
- Hover effects (zoom, darken, lift, etc.)

### Database Schema

```sql
image_galleries (in pagevoo_website_{user_id})
  - id
  - website_id
  - section_id (nullable, if tied to specific section)
  - name (admin reference)
  - display_layout (enum: grid, masonry, carousel, lightbox)
  - columns (int, for grid layout)
  - image_source (enum: upload, library, mixed)
  - enable_categories (boolean)
  - categories (JSON array)
  - show_captions (boolean)
  - caption_style (enum: below, overlay, lightbox)
  - lazy_loading (boolean)
  - images_per_load (int)
  - styling (JSON: CSS properties)
  - created_at, updated_at

gallery_images
  - id
  - image_gallery_id
  - image_path (or reference to shared library)
  - is_library_reference (boolean)
  - library_image_id (nullable, FK if from library)
  - title (varchar 255)
  - description (text)
  - category (varchar 100, nullable)
  - order (int, for manual sorting)
  - created_at, updated_at

gallery_categories (optional, if categories enabled)
  - id
  - image_gallery_id
  - name
  - slug
  - order
  - created_at, updated_at
```

### Section Component
```typescript
interface ImageGallerySection {
  type: 'image_gallery'
  image_gallery_id: number // references image_galleries table
  section_css: string
  section_name: string
}
```

### Tier-Based Restrictions

**Trial Tier:**
- Maximum 10 images total per website (across ALL galleries)
- Only Grid layout available
- No lazy loading
- No categories

**Brochure Tier:**
- Maximum 50 images total per website
- Grid + Masonry layouts
- Lazy loading available
- Categories limited to 3 per gallery

**Niche Tier:**
- Maximum 200 images total per website
- All layouts available
- Full lazy loading
- Unlimited categories

**Pro Tier:**
- Unlimited images (subject to storage limits set by admin)
- All features unlocked
- Advanced performance options

### Admin-Configurable Limits
In tier_permissions table, admin can set:
- `max_gallery_images` (per tier)
- `max_gallery_categories` (per tier)
- `allowed_gallery_layouts` (JSON array per tier)

### Files to Create

**Frontend:**
- `src/components/script-features/image-gallery/ImageGallerySection.tsx`
- `src/components/script-features/image-gallery/GalleryConfigModal.tsx`
- `src/components/script-features/image-gallery/GalleryImageManager.tsx` (admin panel)
- `src/components/script-features/image-gallery/layouts/GridLayout.tsx`
- `src/components/script-features/image-gallery/layouts/MasonryLayout.tsx`
- `src/components/script-features/image-gallery/layouts/CarouselLayout.tsx`
- `src/components/script-features/image-gallery/layouts/LightboxLayout.tsx`

**Backend:**
- `app/Http/Controllers/Api/V1/ScriptFeatures/ImageGalleryController.php`
- `app/Models/ScriptFeatures/ImageGallery.php`
- `app/Models/ScriptFeatures/GalleryImage.php`
- `app/Models/ScriptFeatures/GalleryCategory.php`
- `app/Services/ScriptFeatures/ImageGalleryService.php`
- `database/migrations/xxxx_create_image_galleries_tables.php`

### Implementation Notes
- Image uploads stored in `storage/gallery_images/{website_id}/{gallery_id}/`
- Shared library images can be referenced by multiple galleries
- Lazy loading uses Intersection Observer API
- Image optimization (resize, compress) on upload
- Support for WebP format with fallback
- Lightbox uses existing modal system with image navigation

---

## FEATURE #3: USER ACCESS SYSTEM ✅ SPECIFIED

### Implementation Approach
**Feature Installation** - Installed via Insert > Feature menu, creates user management system for website

### System Inspiration
Modeled after **Windows Server Active Directory** with:
- Pre-defined roles with customizable permissions
- Group-based permission management
- Granular access controls
- User directory with privacy controls

### User Roles (Pre-defined + Customizable)

**Default Roles:**
1. **Admin** - Full control over website and users
2. **Moderator** - Can manage users and content
3. **Member** - Standard registered user
4. **Guest** - Limited access user
5. **Custom Roles** - Customer can create additional roles

**Role Permissions Structure:**
Each role has configurable permissions:
- `can_login` - Access to login
- `can_comment` - Post comments (if Blog installed)
- `can_purchase` - Make purchases (if Shop installed)
- `can_upload` - Upload files (if File Hoster installed)
- `can_post` - Create posts (if Social Platform installed)
- `can_view_members` - View member directory
- `can_message_users` - Send direct messages
- Custom permissions (customer-defined)

### Configuration Options (Modal - Installation)

**Registration Settings:**
- ☐ Allow public registration (anyone can sign up)
- ☐ Require admin approval before activation (configurable)
- ☐ Require email verification (configurable)
- Default role for new users: [Member | Guest | Custom]

**Login Methods:**
- ✓ Email + Password (always enabled)
- ☐ Social Login (Google, Facebook, Twitter) - configurable
- ☐ Two-Factor Authentication (2FA) - configurable

**User Profile Fields:**
**Required Fields:**
- Username (unique)
- Email (unique)
- Password (hashed)

**Default Optional Fields:**
- First Name
- Last Name
- Avatar/Profile Picture
- Bio/Description
- Phone Number
- Address (Street, City, State, ZIP, Country)
- Date of Birth
- Website URL
- Social Media Links

**Custom Fields:**
- Customer can add unlimited custom fields
- Field types: Text, Textarea, Dropdown, Checkbox, Date, Number
- Fields can be required or optional
- Fields can be public or private

**Content Restrictions:**
- ☐ Enable page-level access control (restrict pages to logged-in users)
- ☐ Enable section-level access control (restrict sections by role)
- ☐ Enable feature-level access control (restrict features by role)

**Member Directory:**
- ☐ Enable public member directory
- Privacy options: [Public | Members Only | Hidden]
- Users can opt-out of directory: (YES/NO)
- Directory fields to display: (checkboxes for each field)

**Admin Panel Management:**
- Choose management method:
  - ☐ Managed through Pagevoo (modal in Website Builder)
  - ☐ Standalone admin.php page
  - ☐ Both (recommended)

**Session Settings:**
- Session timeout: [30 min | 1 hour | 24 hours | 7 days | 30 days]
- Remember me option: (YES/NO)
- Auto-logout on browser close: (YES/NO)

### Database Schema

```sql
website_users (in pagevoo_website_{user_id})
  - id
  - username (unique, varchar 100)
  - email (unique, varchar 255)
  - password (hashed, varchar 255)
  - first_name (varchar 100, nullable)
  - last_name (varchar 100, nullable)
  - avatar_path (varchar 255, nullable)
  - bio (text, nullable)
  - phone (varchar 50, nullable)
  - address (JSON: street, city, state, zip, country, nullable)
  - date_of_birth (date, nullable)
  - website_url (varchar 255, nullable)
  - social_links (JSON, nullable)
  - custom_fields (JSON, nullable)
  - status (enum: pending, active, suspended, banned)
  - email_verified_at (timestamp, nullable)
  - two_factor_secret (varchar 255, nullable)
  - two_factor_enabled (boolean, default false)
  - last_login_at (timestamp, nullable)
  - created_at, updated_at

website_roles
  - id
  - name (varchar 100)
  - slug (varchar 100, unique)
  - description (text, nullable)
  - is_default (boolean) - for Admin, Member, Guest, etc.
  - is_custom (boolean)
  - created_at, updated_at

website_permissions
  - id
  - name (varchar 100)
  - slug (varchar 100, unique)
  - description (text, nullable)
  - category (varchar 50) - groups permissions (content, commerce, social, etc.)
  - is_default (boolean) - pre-defined permissions
  - is_custom (boolean) - customer-created permissions
  - created_at, updated_at

role_permissions (pivot table)
  - role_id
  - permission_id
  - created_at, updated_at

user_roles (pivot table)
  - user_id
  - role_id
  - assigned_by (admin user_id)
  - created_at, updated_at

user_groups (for Active Directory-style group management)
  - id
  - name (varchar 100)
  - description (text, nullable)
  - created_at, updated_at

group_users (pivot table)
  - group_id
  - user_id
  - created_at, updated_at

group_permissions (groups can have permissions too)
  - group_id
  - permission_id
  - created_at, updated_at

login_attempts (security tracking)
  - id
  - email
  - ip_address
  - user_agent
  - success (boolean)
  - attempted_at

password_resets
  - id
  - email
  - token (hashed)
  - expires_at
  - created_at

user_sessions
  - id
  - user_id
  - session_token (hashed)
  - ip_address
  - user_agent
  - last_activity
  - expires_at
  - created_at

profile_privacy_settings
  - user_id
  - show_in_directory (boolean)
  - visible_fields (JSON array of field names)
  - profile_visibility (enum: public, members_only, private)
  - created_at, updated_at
```

### Auto-Generated Pages

When User Access System is installed, these pages are created:

1. **login.php** - User login form
2. **register.php** - User registration form
3. **profile.php** - User profile view/edit
4. **forgot-password.php** - Password reset request
5. **logout.php** - Session termination (redirects to home)
6. **member-directory.php** - Public member list (optional)

**Optional Pages (if standalone admin chosen):**
7. **admin.php** - Standalone admin panel for user management

### Page-Level Access Control

**Lockdown Feature:**
Customers can restrict any page to:
- ☐ Logged-in users only
- ☐ Specific roles only (checkboxes)
- ☐ Specific groups only (checkboxes)

**Unauthorized Access Behavior:**
- Redirect to: [Login Page | Custom Page | 403 Error]
- Show message: (customizable)

### Admin Panel Features

**User Management:**
- ✓ View all users (filterable by role, status, group)
- ✓ Edit user details (all fields)
- ✓ Delete users (with confirmation)
- ✓ Ban/suspend users
- ✓ Assign/change user roles
- ✓ Add users to groups
- ✓ Manually verify email
- ✓ Reset user password
- ✓ View user activity log

**Role Management:**
- ✓ Create custom roles
- ✓ Edit role permissions
- ✓ Delete custom roles (cannot delete default roles)
- ✓ Clone roles (duplicate with modifications)

**Permission Management:**
- ✓ View all permissions (default + custom)
- ✓ Create custom permissions
- ✓ Assign permissions to roles
- ✓ Assign permissions to groups

**Group Management:**
- ✓ Create groups
- ✓ Add/remove users from groups
- ✓ Assign permissions to groups
- ✓ Delete groups

**Bulk Actions:**
- ✓ Bulk role assignment
- ✓ Bulk user deletion
- ✓ Bulk status change (activate, suspend, ban)
- ✓ Export user list (CSV)

**Communication:**
- ✓ Send message to individual user
- ✓ Send message to all users (requires Mass Mailer from Contact Form feature)
- ✓ Send message by role/group (requires Mass Mailer)

### Tier-Based Restrictions

**Trial Tier:**
- Admin-configurable max users (default: 10)
- Basic roles only (Admin, Member, Guest)
- No custom permissions
- No groups
- No 2FA
- No social login

**Brochure Tier:**
- Admin-configurable max users (default: 50)
- Custom roles allowed (max 3)
- Custom permissions allowed (max 10)
- Groups allowed (max 3)
- No 2FA
- No social login

**Niche Tier:**
- Admin-configurable max users (default: 500)
- Unlimited custom roles
- Unlimited custom permissions
- Unlimited groups
- 2FA available
- Social login (1 provider)

**Pro Tier:**
- Admin-configurable max users (default: unlimited)
- All features unlocked
- 2FA available
- Social login (all providers)
- Advanced security features
- Audit logs

### Pagevoo Platform Admin Panel (NEW SECTION)

**Location:** Permissions Tab > Feature Permissions > User Account Limitations

**Configurable Settings Per Tier:**
- Max users allowed (integer or "unlimited")
- Max custom roles (integer or "unlimited")
- Max custom permissions (integer or "unlimited")
- Max groups (integer or "unlimited")
- Enable 2FA (boolean)
- Enable social login (boolean)
- Allowed social providers (JSON array)
- Enable advanced security (boolean)
- Enable audit logs (boolean)

### Files to Create

**Frontend:**
- `src/components/script-features/user-access/UserAccessConfigModal.tsx`
- `src/components/script-features/user-access/AdminPanel.tsx` (Pagevoo modal version)
- `src/components/script-features/user-access/UserManagement.tsx`
- `src/components/script-features/user-access/RoleManagement.tsx`
- `src/components/script-features/user-access/PermissionManagement.tsx`
- `src/components/script-features/user-access/GroupManagement.tsx`
- `src/components/script-features/user-access/PageAccessControl.tsx`
- `src/components/script-features/user-access/ProfileEditor.tsx`

**Frontend (Generated PHP Pages):**
- `public/generated/{website_id}/login.php`
- `public/generated/{website_id}/register.php`
- `public/generated/{website_id}/profile.php`
- `public/generated/{website_id}/forgot-password.php`
- `public/generated/{website_id}/logout.php`
- `public/generated/{website_id}/member-directory.php`
- `public/generated/{website_id}/admin.php` (if standalone chosen)

**Backend:**
- `app/Http/Controllers/Api/V1/ScriptFeatures/UserAccessController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/AuthController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/RoleController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/PermissionController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/GroupController.php`
- `app/Models/ScriptFeatures/WebsiteUser.php`
- `app/Models/ScriptFeatures/WebsiteRole.php`
- `app/Models/ScriptFeatures/WebsitePermission.php`
- `app/Models/ScriptFeatures/UserGroup.php`
- `app/Services/ScriptFeatures/UserAccessService.php`
- `app/Services/ScriptFeatures/AuthenticationService.php`
- `app/Services/ScriptFeatures/PermissionService.php`
- `database/migrations/xxxx_create_user_access_tables.php`

**Pagevoo Platform Admin:**
- `src/pages/admin/FeaturePermissions.tsx` (new page)
- `app/Http/Controllers/Admin/FeaturePermissionsController.php`

### Implementation Notes
- Password hashing: bcrypt with work factor 12
- 2FA: TOTP (Time-based One-Time Password) using Google Authenticator compatible
- Social login: OAuth 2.0 via Laravel Socialite
- Session management: Encrypted cookies + database sessions
- CSRF protection on all forms
- Rate limiting on login attempts (5 attempts per 15 minutes)
- Email verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- User avatars stored in `storage/user_avatars/{website_id}/{user_id}/`
- Active Directory-style permission inheritance (Group > Role > User)
- Audit logs track all admin actions (user create/edit/delete, role changes, etc.)

### Security Features
- Brute force protection (account lockout after failed attempts)
- IP-based blocking for suspicious activity
- Password strength requirements (configurable)
- Forced password expiration (optional, configurable days)
- Session hijacking protection (IP + User Agent validation)
- XSS protection on all user inputs
- SQL injection prevention via prepared statements
- HTTPS enforcement for login/registration pages

---

## FEATURE #4: BLOG & NEWS ✅ SPECIFIED

### Implementation Approach
**Feature Installation** - Installed via Insert > Feature menu, creates blog/news system for website

### Content Type
**Unified System** - Blog posts and news articles are the same content type with configurable display options

### Content Editor
**Uses Existing WYSIWYG Editor** - Same rich text editor used throughout Pagevoo
- All existing features available (bold, italic, underline, headings, lists, etc.)
- Image insertion
- Link management
- Text formatting
- Already supports all necessary formatting

### Configuration Options (Modal - Installation)

**Blog Settings:**
- Blog Title: (e.g., "Blog", "News", "Articles")
- Blog Description/Tagline: (optional)
- URL Slug: [/blog | /news | /articles | custom]
- Posts per page: [5 | 10 | 15 | 20 | custom]
- Default post status: [Draft | Published | Scheduled]

**Display Layout:**
- List view style: [Grid | List | Masonry | Compact]
- Show post excerpts: (YES/NO)
- Excerpt length: (characters, if enabled)
- Show featured images: (YES/NO)
- Show author info: (YES/NO)
- Show post date: (YES/NO)
- Show category/tags: (YES/NO)
- Show read time estimate: (YES/NO)

**Categories & Tags:**
- ✓ Enable categories (always available)
- ✓ Enable tags (always available)
- ✓ Multiple categories per post
- ✓ Multiple tags per post
- Max categories: (customer sets limit, or unlimited)
- Max tags per post: (customer sets limit, or unlimited)

**Featured Posts:**
- ☐ Enable featured/sticky posts
- Featured post display: [Top of List | Separate Section | Highlighted]
- ☐ Require featured image for all posts

**Comments System:**
- ☐ Enable comments on posts
- Comment access: [Logged-in Users Only | Guests Allowed (name + email)]
- ☐ Require comment moderation (admin approval)
- ☐ Enable nested replies/threading
- Max thread depth: [1 | 2 | 3 | 5 | Unlimited]
- ☐ Allow comment editing (by author, time limit)
- Comment edit time limit: [5 min | 15 min | 1 hour | 24 hours]

**Author Management:**
- ☐ Enable multi-author support (requires User Access System)
- Author display: [Full Name | Username | Custom Display Name | Anonymous]
- ☐ Show author bio on posts
- ☐ Show author avatar
- ☐ Link to author profile page
- Default author: (if multi-author disabled)

**Archive & Filtering:**
- ☐ Enable date archive (monthly/yearly)
- ☐ Enable search within blog
- Search fields: [Title | Content | Tags | All]
- ☐ Enable category filtering
- ☐ Enable tag filtering
- ☐ Enable author filtering

**RSS Feed:**
- ☐ Generate RSS/Atom feed
- Feed URL: [/blog/feed | /rss | /feed.xml | custom]
- Feed items: [10 | 20 | 50 | All posts]
- Feed content: [Excerpt | Full Post]

**SEO Settings:**
- ☐ Auto-generate meta descriptions from excerpt
- ☐ Enable Open Graph tags (social sharing)
- ☐ Enable Twitter Card tags
- Custom meta title template: (e.g., "{post_title} - {site_name}")

### Database Schema

```sql
blog_posts (in pagevoo_website_{user_id})
  - id
  - author_id (FK to website_users, nullable if anonymous)
  - title (varchar 255)
  - slug (varchar 255, unique)
  - content (longtext, HTML from WYSIWYG)
  - excerpt (text, nullable)
  - featured_image (varchar 255, nullable)
  - status (enum: draft, published, scheduled, archived)
  - is_featured (boolean, default false)
  - published_at (timestamp, nullable)
  - scheduled_at (timestamp, nullable)
  - view_count (int, default 0)
  - comment_count (int, default 0)
  - allow_comments (boolean, default true)
  - meta_title (varchar 255, nullable)
  - meta_description (text, nullable)
  - created_at, updated_at

blog_categories
  - id
  - name (varchar 100)
  - slug (varchar 100, unique)
  - description (text, nullable)
  - parent_id (FK to blog_categories, nullable for nested categories)
  - order (int)
  - created_at, updated_at

blog_tags
  - id
  - name (varchar 100)
  - slug (varchar 100, unique)
  - created_at, updated_at

post_categories (pivot table)
  - post_id
  - category_id
  - created_at

post_tags (pivot table)
  - post_id
  - tag_id
  - created_at

blog_comments
  - id
  - post_id (FK to blog_posts)
  - user_id (FK to website_users, nullable if guest)
  - parent_id (FK to blog_comments, for threading)
  - author_name (varchar 100, for guests)
  - author_email (varchar 255, for guests)
  - content (text)
  - status (enum: pending, approved, spam, deleted)
  - ip_address (varchar 45)
  - user_agent (varchar 255)
  - created_at, updated_at

blog_settings
  - id
  - blog_title (varchar 255)
  - blog_description (text, nullable)
  - url_slug (varchar 100)
  - posts_per_page (int)
  - display_layout (enum: grid, list, masonry, compact)
  - comments_enabled (boolean)
  - comments_require_login (boolean)
  - comments_require_moderation (boolean)
  - multi_author_enabled (boolean)
  - rss_enabled (boolean)
  - rss_url (varchar 255, nullable)
  - configuration (JSON: all other settings)
  - created_at, updated_at
```

### Auto-Generated Pages

When Blog & News feature is installed, these pages are created (if configured):

1. **blog.php** - Main blog listing page (ALWAYS CREATED)
2. **post.php** - Individual post view (ALWAYS CREATED)
3. **category.php** - Posts filtered by category (if categories enabled)
4. **tag.php** - Posts filtered by tag (if tags enabled)
5. **author.php** - Posts filtered by author (if multi-author enabled)
6. **archive.php** - Posts filtered by date (if date archive enabled)
7. **search.php** - Blog search results (if search enabled)

### Special Sections

**Blog List Section:**
- Displays list of recent posts
- Configurable: number of posts, layout, filtering
- Can be inserted on any page (not just blog.php)

**Recent Posts Widget Section:**
- Shows X most recent posts (titles only or with excerpts)
- Sidebar-friendly
- Configurable post count

**Featured Posts Section:**
- Shows only featured/sticky posts
- Customizable layout

**Category/Tag Cloud Section:**
- Visual representation of categories or tags
- Size based on post count

### Admin Panel Features (within Blog Management)

**Post Management:**
- ✓ Create new posts
- ✓ Edit existing posts
- ✓ Delete posts
- ✓ Bulk actions (publish, draft, delete, feature)
- ✓ Filter by status, category, tag, author, date
- ✓ Search posts
- ✓ Schedule posts for future publishing
- ✓ Duplicate posts

**Category Management:**
- ✓ Create categories
- ✓ Edit categories
- ✓ Delete categories (reassign posts or set to uncategorized)
- ✓ Nested categories (parent/child)
- ✓ Reorder categories

**Tag Management:**
- ✓ Create tags
- ✓ Edit tags
- ✓ Delete tags (remove from posts)
- ✓ Merge tags

**Comment Management:**
- ✓ View all comments
- ✓ Approve/reject comments
- ✓ Mark as spam
- ✓ Delete comments
- ✓ Bulk moderation
- ✓ Reply to comments
- ✓ Ban users/IPs

**Analytics:**
- ✓ Most viewed posts
- ✓ Most commented posts
- ✓ Post views over time
- ✓ Comment activity over time
- ✓ Top categories/tags

### Tier-Based Restrictions

**Trial Tier:**
- Pagevoo admin-configurable max posts (default: 10)
- Max categories: 3
- Max tags: 10
- No multi-author support
- No RSS feed
- Comments: basic only (no threading)

**Brochure Tier:**
- Pagevoo admin-configurable max posts (default: 50)
- Max categories: 10
- Max tags: 50
- No multi-author support
- RSS feed available
- Comments: threading allowed (max depth 2)

**Niche Tier:**
- Pagevoo admin-configurable max posts (default: 200)
- Unlimited categories
- Unlimited tags
- Multi-author support (max 5 authors)
- RSS feed available
- Comments: full threading (unlimited depth)

**Pro Tier:**
- Pagevoo admin-configurable max posts (default: unlimited)
- Unlimited categories
- Unlimited tags
- Multi-author support (unlimited authors)
- RSS feed available
- Comments: full threading with advanced moderation
- Advanced analytics

### Pagevoo Platform Admin Panel

**Location:** Permissions Tab > Feature Permissions > Blog & News Limitations

**Configurable Settings Per Tier:**
- Max posts allowed (integer or "unlimited")
- Max categories (integer or "unlimited")
- Max tags (integer or "unlimited")
- Max authors (integer or "unlimited")
- Enable multi-author (boolean)
- Enable RSS feed (boolean)
- Enable advanced analytics (boolean)
- Max comment thread depth (integer or "unlimited")

### Files to Create

**Frontend:**
- `src/components/script-features/blog/BlogConfigModal.tsx`
- `src/components/script-features/blog/PostEditor.tsx`
- `src/components/script-features/blog/PostList.tsx`
- `src/components/script-features/blog/CategoryManager.tsx`
- `src/components/script-features/blog/TagManager.tsx`
- `src/components/script-features/blog/CommentManager.tsx`
- `src/components/script-features/blog/BlogAnalytics.tsx`
- `src/components/script-features/blog/sections/BlogListSection.tsx`
- `src/components/script-features/blog/sections/RecentPostsWidget.tsx`
- `src/components/script-features/blog/sections/FeaturedPostsSection.tsx`
- `src/components/script-features/blog/sections/CategoryCloudSection.tsx`

**Frontend (Generated PHP Pages):**
- `public/generated/{website_id}/blog.php`
- `public/generated/{website_id}/post.php`
- `public/generated/{website_id}/category.php`
- `public/generated/{website_id}/tag.php`
- `public/generated/{website_id}/author.php`
- `public/generated/{website_id}/archive.php`
- `public/generated/{website_id}/search.php`

**Backend:**
- `app/Http/Controllers/Api/V1/ScriptFeatures/BlogController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/PostController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/CommentController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/CategoryController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/TagController.php`
- `app/Models/ScriptFeatures/BlogPost.php`
- `app/Models/ScriptFeatures/BlogCategory.php`
- `app/Models/ScriptFeatures/BlogTag.php`
- `app/Models/ScriptFeatures/BlogComment.php`
- `app/Services/ScriptFeatures/BlogService.php`
- `app/Services/ScriptFeatures/RSSGeneratorService.php`
- `database/migrations/xxxx_create_blog_tables.php`

### Implementation Notes
- Post slugs auto-generated from title (URL-friendly)
- Duplicate slug handling (append -2, -3, etc.)
- Featured images stored in `storage/blog_images/{website_id}/`
- RSS feed cached for performance (regenerate on post publish)
- Comment spam detection (simple keyword blacklist + rate limiting)
- Post view tracking (increment on page view, IP-based throttle)
- Scheduled posts published via Laravel task scheduler
- Rich text content sanitized on save (prevent XSS)
- SEO meta tags auto-generated if not custom
- Excerpt auto-generated from first 160 characters if not set
- Read time calculated: ~200 words per minute
- Nested categories: max 3 levels deep to prevent excessive nesting

### SEO & Performance
- Post URLs: `/blog/{slug}` format
- Category URLs: `/blog/category/{slug}`
- Tag URLs: `/blog/tag/{slug}`
- Author URLs: `/blog/author/{username}`
- Archive URLs: `/blog/{year}/{month}`
- Pagination: `/blog?page=2` format
- Canonical URLs for duplicate content prevention
- Lazy loading for post images
- Database indexes on slug, status, published_at for performance
- Full-text search index on title and content

---

## FEATURE #5: EVENTS ✅ SPECIFIED

### Implementation Approach
**Feature Installation** - Installed via Insert > Feature menu, creates event management system for website

### Core Concept
**Fully Customer-Configurable** - All aspects of the event system are customizable by the customer during setup and ongoing management

### Configuration Options (Modal - Installation)

**Event System Settings:**
- System Name: (e.g., "Events", "Calendar", "Schedule")
- URL Slug: [/events | /calendar | /schedule | custom]
- Default view: [Calendar | List | Grid]
- Timezone: (customer's timezone for event display)

**Event Types:**
- ☐ Enable event types/categories
- Pre-defined types: [Conference | Webinar | Workshop | Concert | Meeting | Other]
- ☐ Allow custom event types (customer can add their own)
- ☐ Color-code event types (in calendar view)

**Event Information Fields:**
**Always Included:**
- ✓ Event Title (required)
- ✓ Event Description (WYSIWYG editor)
- ✓ Start Date & Time (required)
- ✓ End Date & Time (required)

**Optional Fields (Customer Configurable):**
- ☐ Event Type/Category
- ☐ Location (physical address with Google Maps integration)
- ☐ Virtual Event Link (Zoom, Teams, Google Meet, etc.)
- ☐ Event Capacity (max attendees)
- ☐ Featured Image/Banner
- ☐ Event Cost/Ticket Price
- ☐ Organizer Name
- ☐ Contact Email
- ☐ Contact Phone
- ☐ Custom Fields (customer can add unlimited custom fields)

**RSVP/Registration Settings:**
- ☐ Enable RSVP system
- RSVP Access: [Logged-in Users Only | Guests Allowed (name + email) | Both]
- ☐ Require RSVP approval (organizer must approve)
- ☐ Send RSVP confirmation emails
- ☐ Collect attendee information at RSVP
- Additional RSVP fields: [Name | Email | Phone | Company | Dietary Restrictions | Special Needs | Custom Questions]
- ☐ Allow attendees to cancel RSVP
- RSVP deadline: [Event start time | 1 hour before | 1 day before | Custom]
- ☐ Waitlist (if event at capacity)

**Recurring Events:**
- ☐ Enable recurring events
- Recurrence patterns: [Daily | Weekly | Monthly | Yearly | Custom]
- Recurrence options:
  - Repeat every X days/weeks/months
  - Repeat on specific days of week (for weekly)
  - Repeat on specific date of month (for monthly)
  - End after X occurrences OR end by date
- Max recurrences: (customer sets, or unlimited)
- ☐ Allow editing individual occurrences vs entire series

**Categories & Tags:**
- ☐ Enable event categories
- Categories: (customer-defined list)
- ☐ Enable event tags
- ☐ Multiple categories per event
- ☐ Multiple tags per event

**Display Options:**
- Views to enable:
  - ☐ Calendar view (month/week/day)
  - ☐ List view (upcoming events)
  - ☐ Grid view (event cards)
  - ☐ Map view (show event locations on map)
- Default view: (choose from enabled views)
- Events per page (list/grid): [10 | 20 | 50 | custom]
- ☐ Show past events (archive)
- ☐ Filter by category/tag/type
- ☐ Search events

**Event Status:**
- Status options: [Draft | Published | Cancelled | Postponed | Completed]
- ☐ Automatically mark events as "Completed" after end date
- ☐ Show cancelled events (with strikethrough)
- ☐ Notify RSVP'd attendees of status changes

**Notifications & Reminders:**
- ☐ Send reminder emails to RSVP'd attendees
- Reminder timing: [1 week before | 1 day before | 1 hour before | Custom | Multiple]
- ☐ Send event update notifications (if event details change)
- ☐ Send cancellation notifications
- Email templates: (customizable)

**Integration Settings:**
- ☐ Google Calendar integration (.ics export)
- ☐ iCal export for individual events
- ☐ Google Maps for location display
- ☐ Embed virtual event links (Zoom, Teams iframe)

### Database Schema

```sql
events (in pagevoo_website_{user_id})
  - id
  - organizer_id (FK to website_users, nullable)
  - title (varchar 255)
  - slug (varchar 255, unique)
  - description (longtext, HTML from WYSIWYG)
  - event_type (varchar 100, nullable)
  - start_datetime (datetime)
  - end_datetime (datetime)
  - timezone (varchar 50)
  - location_address (text, nullable)
  - location_lat (decimal, nullable)
  - location_lng (decimal, nullable)
  - virtual_link (varchar 255, nullable)
  - capacity (int, nullable)
  - featured_image (varchar 255, nullable)
  - cost (decimal 10,2, nullable)
  - currency (varchar 3, default 'USD')
  - organizer_name (varchar 255, nullable)
  - contact_email (varchar 255, nullable)
  - contact_phone (varchar 50, nullable)
  - custom_fields (JSON, nullable)
  - status (enum: draft, published, cancelled, postponed, completed)
  - rsvp_enabled (boolean, default false)
  - rsvp_deadline (datetime, nullable)
  - rsvp_count (int, default 0)
  - is_recurring (boolean, default false)
  - recurrence_rule (JSON, nullable)
  - parent_event_id (FK to events, for recurring instances)
  - created_at, updated_at

event_categories
  - id
  - name (varchar 100)
  - slug (varchar 100, unique)
  - color (varchar 7, hex color)
  - description (text, nullable)
  - created_at, updated_at

event_tags
  - id
  - name (varchar 100)
  - slug (varchar 100, unique)
  - created_at, updated_at

event_category_pivot
  - event_id
  - category_id

event_tag_pivot
  - event_id
  - tag_id

event_rsvps
  - id
  - event_id (FK to events)
  - user_id (FK to website_users, nullable if guest)
  - guest_name (varchar 255, nullable)
  - guest_email (varchar 255, nullable)
  - guest_phone (varchar 50, nullable)
  - rsvp_data (JSON: additional fields collected)
  - status (enum: pending, confirmed, cancelled, waitlist)
  - confirmation_token (varchar 100, unique)
  - attended (boolean, default false)
  - created_at, updated_at

event_reminders
  - id
  - event_id
  - reminder_time (enum: 1_week, 1_day, 1_hour, custom)
  - custom_hours_before (int, nullable)
  - sent_at (timestamp, nullable)
  - created_at, updated_at

event_settings
  - id
  - system_name (varchar 255)
  - url_slug (varchar 100)
  - default_view (enum: calendar, list, grid, map)
  - timezone (varchar 50)
  - configuration (JSON: all settings)
  - created_at, updated_at
```

### Auto-Generated Pages

When Events feature is installed, these pages are created (based on configuration):

1. **events.php** - Main events listing/calendar page (ALWAYS CREATED)
2. **event.php** - Individual event view (ALWAYS CREATED)
3. **rsvp.php** - RSVP confirmation/thank you page (if RSVP enabled)
4. **my-events.php** - User's RSVP'd events (if User Access System installed)

### Special Sections

**Events Calendar Section:**
- Full calendar widget (month/week/day views)
- Can be inserted on any page
- Configurable: view type, categories to show

**Upcoming Events Section:**
- Shows next X upcoming events
- List or grid layout
- Configurable: event count, categories

**Featured Event Section:**
- Highlights a specific event
- Large banner style
- Customer selects which event

**Event Countdown Section:**
- Shows countdown to specific event
- Real-time JavaScript countdown
- Customizable styling

### Admin Panel Features (within Event Management)

**Event Management:**
- ✓ Create new events
- ✓ Edit existing events
- ✓ Delete events
- ✓ Duplicate events (copy as template)
- ✓ Bulk actions (publish, cancel, delete)
- ✓ Filter by status, category, type, date range
- ✓ Search events
- ✓ Calendar view for management
- ✓ Drag-and-drop to reschedule events (calendar view)

**Recurring Event Management:**
- ✓ Create recurring event series
- ✓ Edit single occurrence
- ✓ Edit entire series
- ✓ Delete single occurrence
- ✓ Delete entire series
- ✓ Break recurrence (convert instance to standalone event)

**RSVP Management:**
- ✓ View all RSVPs for an event
- ✓ Approve/reject RSVPs (if approval required)
- ✓ Mark attendance (check-in)
- ✓ Export RSVP list (CSV)
- ✓ Send message to all RSVP'd attendees
- ✓ Manage waitlist
- ✓ Manually add RSVPs

**Category & Tag Management:**
- ✓ Create/edit/delete categories
- ✓ Create/edit/delete tags
- ✓ Assign colors to categories

**Reminder Management:**
- ✓ Configure reminder schedules
- ✓ View sent reminders
- ✓ Resend reminders manually

**Analytics:**
- ✓ Total events created
- ✓ Most popular events (by RSVP count)
- ✓ RSVP conversion rate
- ✓ Attendance rate (if check-in used)
- ✓ Events by category/type
- ✓ Upcoming vs past events

### Tier-Based Restrictions

**Trial Tier:**
- Pagevoo admin-configurable max events (default: 5)
- No recurring events
- Max capacity per event: 20
- No map integration
- Basic calendar view only
- No reminder emails

**Brochure Tier:**
- Pagevoo admin-configurable max events (default: 20)
- Recurring events (max 10 occurrences per series)
- Max capacity per event: 100
- Google Maps integration
- All calendar views
- 1 reminder per event

**Niche Tier:**
- Pagevoo admin-configurable max events (default: 100)
- Recurring events (max 50 occurrences per series)
- Max capacity per event: 500
- All integrations
- Multiple reminders per event

**Pro Tier:**
- Pagevoo admin-configurable max events (default: unlimited)
- Unlimited recurring occurrences
- Unlimited capacity
- All features unlocked
- Advanced analytics
- Priority support

### Pagevoo Platform Admin Panel

**Location:** Permissions Tab > Feature Permissions > Events Limitations

**Configurable Settings Per Tier:**
- Max events allowed (integer or "unlimited")
- Max recurring occurrences (integer or "unlimited")
- Max event capacity (integer or "unlimited")
- Enable recurring events (boolean)
- Enable map integration (boolean)
- Enable reminder emails (boolean)
- Max reminders per event (integer)
- Enable advanced analytics (boolean)

### Files to Create

**Frontend:**
- `src/components/script-features/events/EventsConfigModal.tsx`
- `src/components/script-features/events/EventEditor.tsx`
- `src/components/script-features/events/EventList.tsx`
- `src/components/script-features/events/CalendarView.tsx`
- `src/components/script-features/events/RSVPManager.tsx`
- `src/components/script-features/events/RecurringEventEditor.tsx`
- `src/components/script-features/events/CategoryManager.tsx`
- `src/components/script-features/events/EventAnalytics.tsx`
- `src/components/script-features/events/sections/EventsCalendarSection.tsx`
- `src/components/script-features/events/sections/UpcomingEventsSection.tsx`
- `src/components/script-features/events/sections/FeaturedEventSection.tsx`
- `src/components/script-features/events/sections/EventCountdownSection.tsx`

**Frontend (Generated PHP Pages):**
- `public/generated/{website_id}/events.php`
- `public/generated/{website_id}/event.php`
- `public/generated/{website_id}/rsvp.php`
- `public/generated/{website_id}/my-events.php`

**Backend:**
- `app/Http/Controllers/Api/V1/ScriptFeatures/EventsController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/RSVPController.php`
- `app/Http/Controllers/Api/V1/ScriptFeatures/EventCategoryController.php`
- `app/Models/ScriptFeatures/Event.php`
- `app/Models/ScriptFeatures/EventCategory.php`
- `app/Models/ScriptFeatures/EventTag.php`
- `app/Models/ScriptFeatures/EventRSVP.php`
- `app/Services/ScriptFeatures/EventsService.php`
- `app/Services/ScriptFeatures/RecurringEventService.php`
- `app/Services/ScriptFeatures/RSVPService.php`
- `app/Services/ScriptFeatures/EventReminderService.php`
- `app/Services/ScriptFeatures/ICalGeneratorService.php`
- `database/migrations/xxxx_create_events_tables.php`

### Implementation Notes
- Event slugs auto-generated from title (URL-friendly)
- Recurring events: Generate occurrences on-demand (not all at once)
- RSVP confirmation tokens for guest verification
- iCal export follows RFC 5545 standard
- Google Maps integration uses Maps Embed API
- Reminder emails sent via Laravel queue (scheduled jobs)
- Timezone conversion for global events
- Check-in functionality via QR codes (optional)
- Featured images stored in `storage/event_images/{website_id}/`
- Calendar views use FullCalendar.js library
- Map clustering for multiple event locations
- Event capacity warnings when nearing full
- Automatic waitlist promotion when RSVP cancelled

### SEO & Performance
- Event URLs: `/events/{slug}` format
- Category URLs: `/events/category/{slug}`
- Structured data (Schema.org Event markup) for SEO
- Open Graph tags for social sharing
- Calendar data cached for performance
- Lazy loading for event images
- Database indexes on start_datetime, status, event_type
- Pagination for large event lists

---

## FEATURE #6: BOOKING SYSTEM ✅ SPECIFIED

### Implementation Approach
**Feature Installation** - Installed via Insert > Feature menu, creates appointment/reservation booking system

### Core Concept
**Fully Customer-Configurable** - Complete control over services, scheduling, staff, and booking rules

### Configuration Options (Modal - Installation)

**Booking System Settings:**
- System Name: (e.g., "Book Appointment", "Reservations", "Schedule")
- URL Slug: [/book | /appointments | /reservations | custom]
- Business Hours: (default availability)
- Timezone: (customer's timezone)
- Booking Window: (how far in advance customers can book)

**Service Management:**
- ☐ Enable multiple services
- Services: (customer-defined list)
- Per Service Configuration:
  - Service name
  - Description
  - Duration (15 min | 30 min | 1 hour | 2 hours | custom)
  - Price (optional)
  - Buffer time (gap between bookings)
  - Category/type
  - Featured image

**Staff Management:**
- ☐ Enable staff assignment (requires User Access System)
- Staff members: (link to website users with "staff" role)
- Per Staff Configuration:
  - Working hours (override business hours)
  - Services they provide
  - Break times
  - Unavailable dates
  - Bio/photo

**Time Slot Configuration:**
- Slot duration: [15 min | 30 min | 1 hour | custom]
- ☐ Allow custom duration per service
- Slots per time block: [1 | Multiple (for group services)]
- ☐ Allow overbooking (accept more than capacity)

**Booking Rules:**
- Min advance notice: (e.g., 2 hours, 1 day)
- Max advance booking: (e.g., 30 days, 90 days, 1 year)
- ☐ Require booking approval (manual confirmation)
- ☐ Allow same-day bookings
- ☐ Allow recurring bookings (weekly appointments, etc.)
- Cancellation policy: (how far in advance can cancel)
- ☐ Cancellation fee/penalty

**Customer Information:**
- Required fields: [Name | Email | Phone]
- Optional fields: [Address | Company | Notes | Custom fields]
- ☐ Require User Access System login
- ☐ Allow guest bookings

**Payment Integration:**
- ☐ Require payment at booking
- ☐ Deposit only (partial payment)
- ☐ Payment on arrival (no online payment)
- Payment gateways: [Stripe | PayPal | Both]
- Deposit percentage: (if deposit enabled)
- Refund policy: (configurable)

**Notifications:**
- ☐ Send booking confirmation to customer
- ☐ Send booking notification to staff/admin
- ☐ Send reminder emails (1 day before, 1 hour before, custom)
- ☐ Send cancellation notifications
- ☐ Send rescheduling notifications
- Email templates: (customizable)

**Calendar Integration:**
- ☐ Google Calendar sync (two-way)
- ☐ iCal export for bookings
- ☐ Block external calendar events (prevent double-booking)

### Database Schema

```sql
booking_services (in pagevoo_website_{user_id})
  - id
  - name (varchar 255)
  - slug (varchar 255)
  - description (text)
  - category (varchar 100, nullable)
  - duration_minutes (int)
  - buffer_minutes (int, default 0)
  - price (decimal 10,2, nullable)
  - currency (varchar 3, default 'USD')
  - capacity (int, default 1)
  - featured_image (varchar 255, nullable)
  - is_active (boolean, default true)
  - created_at, updated_at

booking_staff (if staff management enabled)
  - id
  - user_id (FK to website_users)
  - bio (text, nullable)
  - photo (varchar 255, nullable)
  - working_hours (JSON: day/time configuration)
  - is_active (boolean, default true)
  - created_at, updated_at

staff_services (pivot)
  - staff_id
  - service_id

staff_unavailability
  - id
  - staff_id
  - start_datetime
  - end_datetime
  - reason (varchar 255, nullable)
  - created_at, updated_at

bookings
  - id
  - service_id (FK to booking_services)
  - staff_id (FK to booking_staff, nullable)
  - customer_user_id (FK to website_users, nullable if guest)
  - customer_name (varchar 255)
  - customer_email (varchar 255)
  - customer_phone (varchar 50)
  - customer_data (JSON: additional fields)
  - booking_datetime (datetime)
  - end_datetime (datetime)
  - duration_minutes (int)
  - status (enum: pending, confirmed, cancelled, completed, no_show)
  - payment_status (enum: unpaid, deposit_paid, paid, refunded)
  - payment_amount (decimal 10,2, nullable)
  - payment_id (varchar 255, nullable)
  - notes (text, nullable)
  - cancellation_reason (text, nullable)
  - cancelled_at (timestamp, nullable)
  - confirmed_at (timestamp, nullable)
  - created_at, updated_at

booking_reminders
  - id
  - booking_id
  - reminder_type (enum: 1_day, 1_hour, custom)
  - sent_at (timestamp, nullable)
  - created_at

booking_settings
  - id
  - system_name (varchar 255)
  - url_slug (varchar 100)
  - business_hours (JSON)
  - timezone (varchar 50)
  - configuration (JSON: all settings)
  - created_at, updated_at
```

### Auto-Generated Pages

1. **book.php** - Booking calendar/service selection (ALWAYS CREATED)
2. **booking-confirmation.php** - Booking confirmation/thank you page (ALWAYS CREATED)
3. **my-bookings.php** - Customer's bookings list (if User Access System installed)
4. **manage-bookings.php** - Staff booking management (if staff management enabled)

### Special Sections

**Booking Calendar Section:**
- Interactive calendar showing availability
- Customer selects date/time
- Real-time availability checking

**Service List Section:**
- Displays available services with "Book Now" buttons
- Grid or list layout
- Filter by category

**Staff Directory Section:**
- Shows staff members with bios and "Book with [Name]"
- Photo, bio, services offered

**Quick Booking Form Section:**
- Simple form for single-service businesses
- Embedded calendar picker

### Admin Panel Features

**Booking Management:**
- ✓ View all bookings (calendar view, list view)
- ✓ Create manual bookings
- ✓ Edit bookings
- ✓ Cancel bookings
- ✓ Confirm pending bookings
- ✓ Mark as completed/no-show
- ✓ Reschedule bookings
- ✓ Filter by status, service, staff, date
- ✓ Search bookings

**Service Management:**
- ✓ Create/edit/delete services
- ✓ Set pricing and duration
- ✓ Manage availability
- ✓ Bulk actions

**Staff Management:**
- ✓ Add/remove staff members
- ✓ Set working hours
- ✓ Manage unavailability (vacation, sick days)
- ✓ View staff schedules
- ✓ Assign services to staff

**Availability Management:**
- ✓ Block time slots
- ✓ Set special hours (holidays, events)
- ✓ Override business hours for specific dates
- ✓ Bulk block dates

**Payment Management:**
- ✓ View payment history
- ✓ Process refunds
- ✓ Mark manual payments
- ✓ Export financial reports

**Analytics:**
- ✓ Total bookings
- ✓ Revenue reports
- ✓ Most popular services
- ✓ Booking conversion rate
- ✓ No-show rate
- ✓ Staff performance

### Tier-Based Restrictions

**Trial:** Max 10 bookings/month, 1 service, no staff management, no payments
**Brochure:** Max 50 bookings/month, 3 services, no staff management, basic payments
**Niche:** Max 500 bookings/month, unlimited services, 3 staff members, full payments
**Pro:** Unlimited bookings, unlimited services, unlimited staff, all features

### Pagevoo Platform Admin Panel
**Location:** Permissions Tab > Feature Permissions > Booking System Limitations
- Max bookings per month, max services, max staff, enable payments, etc.

---

## FEATURE #7: VOOPRESS (WORDPRESS-STYLE SITES) ✅ SPECIFIED

### Implementation Approach
**Website Theme/Template System** - Pre-configured WordPress-style website setup using existing Pagevoo features

### Core Concept
VooPress is NOT a separate feature with its own database tables. Instead, it's a **quick-start template system** that automatically configures existing Pagevoo features (Blog, User Access, Contact Form, etc.) to create a WordPress-style website instantly.

### What VooPress Does

**Automatic Feature Installation:**
When customer selects "Create VooPress Site", the system automatically installs and configures:
1. **Blog & News** - Pre-configured as main content system
2. **User Access System** - For multi-author support
3. **Contact Form** - Standard contact page
4. **Image Gallery** - For media management

**Pre-Built WordPress-Style Pages:**
- Home page (blog listing)
- About page (editable)
- Contact page (with form)
- Sample blog post
- Privacy Policy (template)
- Terms of Service (template)

**WordPress-Style Sections (Special Sections):**
- **Sidebar Widget Section** - Customizable sidebar with widgets
- **Author Box Section** - Author bio at end of posts
- **Related Posts Section** - "You might also like" section
- **Categories Widget** - Category list with post counts
- **Tags Cloud Widget** - Tag visualization
- **Recent Posts Widget** - Latest posts list
- **Archives Widget** - Monthly/yearly archive links
- **Search Widget** - Blog search box
- **Social Share Buttons** - Share to social media

**WordPress-Style Admin Panel:**
- Dashboard view (similar to WordPress admin)
- Posts management (create, edit, categories, tags)
- Pages management
- Comments moderation
- Users management (authors, editors, admins)
- Appearance settings (theme customization)
- Settings panel (general, reading, discussion, permalinks)

### VooPress Themes (Pre-designed Templates)

**Classic Blog Theme:**
- Traditional blog layout
- Sidebar on right
- Featured posts at top
- Category-based navigation

**Magazine Theme:**
- Multi-column layout
- Featured content areas
- Category sections
- News-style design

**Minimal Theme:**
- Clean, typography-focused
- Center column layout
- Minimalist design
- Distraction-free reading

**Business Blog Theme:**
- Professional corporate style
- About/Services integration
- Team member sections
- Portfolio integration

### Configuration Options (VooPress Setup Modal)

**Site Identity:**
- Site Title
- Tagline
- Site Icon/Logo
- Primary Color
- Secondary Color

**Content Settings:**
- Blog name: [Blog | News | Articles | Custom]
- Posts per page: [5 | 10 | 15 | 20]
- Show excerpts or full posts on homepage
- Date format
- Time format

**Theme Selection:**
- Choose from VooPress themes (Classic, Magazine, Minimal, Business)
- Preview themes before selecting

**Feature Configuration:**
- ☐ Enable comments (pre-configures Blog comments)
- ☐ Enable multi-author (activates User Access System)
- ☐ Enable categories and tags
- ☐ Enable featured images
- ☐ Enable social sharing

**Sidebar Configuration:**
- Sidebar position: [Right | Left | Both | None]
- Active widgets: (drag-and-drop selection)
  - Search
  - Recent Posts
  - Categories
  - Tags Cloud
  - Archives
  - Custom HTML

**User Roles (WordPress-Style):**
- Administrator (full control)
- Editor (can publish and manage all posts)
- Author (can publish own posts)
- Contributor (can write but not publish)
- Subscriber (can only read and comment)

### Implementation Details

**NO New Database Tables** - VooPress uses:
- `blog_posts` from Blog feature
- `website_users`, `website_roles` from User Access System
- `contact_forms` from Contact Form feature
- Existing `user_websites` and `user_pages` tables

**Special VooPress Flag:**
Add to `user_websites` table:
- `is_voopress` (boolean) - Marks site as VooPress-style
- `voopress_theme` (varchar 50) - Stores selected theme
- `voopress_config` (JSON) - Stores VooPress-specific settings

**Theme System:**
- Themes stored as JSON templates in `storage/voopress/themes/`
- Each theme defines:
  - Default page layouts
  - Default sections configuration
  - CSS overrides
  - Widget positions

### VooPress Admin Dashboard (Special UI)

When `is_voopress = true`, Website Builder shows **VooPress Mode** with WordPress-style interface:

**Dashboard:**
- At a Glance widget (posts, pages, comments count)
- Recent activity
- Quick Draft (create post quickly)

**Posts Menu:**
- All Posts
- Add New
- Categories
- Tags

**Pages Menu:**
- All Pages
- Add New

**Comments Menu:**
- All Comments (if enabled)
- Pending moderation

**Appearance Menu:**
- Themes (switch VooPress theme)
- Customize (visual theme editor)
- Widgets (manage sidebar)
- Menus (navigation setup)

**Users Menu:**
- All Users
- Add New
- Your Profile

**Settings Menu:**
- General (site title, tagline, etc.)
- Reading (posts per page, homepage settings)
- Discussion (comment settings)
- Permalinks (URL structure)

### VooPress-Specific Features

**WordPress-Style Permalinks:**
- Post URL structure: [/blog/{slug} | /{year}/{month}/{slug} | /{category}/{slug}]
- Page URL structure: [/{slug} | /page/{slug}]
- Custom structure option

**WordPress-Style Widgets System:**
- Widget areas defined in theme
- Drag-and-drop widget management
- Custom HTML widget
- Text widget
- Image widget
- Custom menu widget

**WordPress-Style Menus:**
- Create custom navigation menus
- Assign to menu locations (Primary, Footer, Sidebar, etc.)
- Drag-and-drop menu builder
- Nested menu items

**Import from WordPress:**
- ☐ Import WordPress XML export
- Converts WordPress posts to Pagevoo blog posts
- Imports categories and tags
- Imports users (creates User Access accounts)
- Imports media to Image Gallery
- Maintains post slugs/URLs

### Files to Create

**Frontend:**
- `src/components/voopress/VooPressSetupWizard.tsx`
- `src/components/voopress/VooPressDashboard.tsx`
- `src/components/voopress/ThemeSelector.tsx`
- `src/components/voopress/WidgetManager.tsx`
- `src/components/voopress/MenuBuilder.tsx`
- `src/components/voopress/WordPressImporter.tsx`
- `src/components/voopress/sections/SidebarWidget.tsx`
- `src/components/voopress/sections/AuthorBox.tsx`
- `src/components/voopress/sections/RelatedPosts.tsx`

**Backend:**
- `app/Http/Controllers/Api/V1/VooPressController.php`
- `app/Services/VooPress/VooPressSetupService.php`
- `app/Services/VooPress/ThemeService.php`
- `app/Services/VooPress/WordPressImporterService.php`
- `storage/voopress/themes/` (JSON theme definitions)

### Tier Restrictions

**Trial:** Cannot create VooPress sites
**Brochure:** Can create VooPress site, limited to 2 themes
**Niche:** Can create VooPress site, access to all themes
**Pro:** Full VooPress functionality + WordPress import

---

## FEATURE #8: SHOP (E-COMMERCE) ✅ SPECIFIED

### Implementation Approach
**Feature Installation** - Full e-commerce system, requires User Access System for customer accounts

### Core Concept
**Fully Customer-Configurable** - Complete online store with products, cart, checkout, payments, and order management

### Configuration Options (Modal - Installation)

**Store Settings:**
- Store Name
- Store Description
- Currency: [USD | EUR | GBP | etc.]
- Tax Configuration:
  - ☐ Enable tax calculation
  - Tax rate(s): (by region if needed)
  - ☐ Prices include tax (vs. tax added at checkout)

**Product Configuration:**
- Product types to enable:
  - ☐ Physical products (requires shipping)
  - ☐ Digital products (downloadable)
  - ☐ Services (no shipping, no download)
  - ☐ Variable products (size, color options)
  - ☐ Subscription products (recurring billing)

**Inventory Management:**
- ☐ Enable inventory tracking
- ☐ Allow backorders (sell when out of stock)
- ☐ Low stock threshold warnings
- ☐ SKU (Stock Keeping Unit) system

**Pricing Features:**
- ☐ Enable sale/discount prices
- ☐ Enable coupon codes
- ☐ Enable bulk pricing (quantity discounts)
- ☐ Enable tiered pricing (based on customer role)

**Shopping Cart:**
- Cart behavior: [Side panel | Dedicated page | Modal]
- ☐ Enable cart saving (requires User Access)
- ☐ Enable wishlists/favorites
- ☐ Abandoned cart recovery emails
- ☐ Continue shopping vs. direct to checkout

**Checkout Process:**
- Checkout style: [Single page | Multi-step | Express]
- Required fields: [Shipping Address | Billing Address | Phone | Company]
- ☐ Guest checkout allowed (vs. login required)
- ☐ Create account at checkout option
- ☐ Order notes field

**Shipping Configuration:**
- Shipping methods:
  - ☐ Flat rate
  - ☐ Free shipping (conditional)
  - ☐ Local pickup
  - ☐ Weight-based
  - ☐ Price-based
  - ☐ Carrier calculated (UPS, FedEx, USPS API)
- Shipping zones/regions
- Free shipping threshold

**Payment Gateways:**
- ☐ Stripe
- ☐ PayPal
- ☐ Cash on Delivery
- ☐ Bank Transfer
- ☐ Check/Money Order
- Test mode for each gateway

**Order Management:**
- Order statuses: [Pending | Processing | Completed | Cancelled | Refunded | On Hold]
- ☐ Automatic order confirmation emails
- ☐ Shipping notification emails
- ☐ Order tracking numbers
- Email templates (customizable)

**Customer Accounts:**
- ☐ Require User Access System login for purchases
- Customer dashboard features:
  - Order history
  - Download digital products
  - Saved addresses
  - Wishlist
  - Subscription management

### Database Schema

```sql
shop_products (in pagevoo_website_{user_id})
  - id
  - name (varchar 255)
  - slug (varchar 255, unique)
  - description (longtext)
  - short_description (text, nullable)
  - sku (varchar 100, unique, nullable)
  - product_type (enum: simple, variable, digital, service, subscription)
  - price (decimal 10,2)
  - sale_price (decimal 10,2, nullable)
  - sale_start (datetime, nullable)
  - sale_end (datetime, nullable)
  - cost (decimal 10,2, nullable)
  - tax_class (varchar 50, nullable)
  - manage_stock (boolean)
  - stock_quantity (int, nullable)
  - stock_status (enum: in_stock, out_of_stock, on_backorder)
  - weight (decimal 8,2, nullable)
  - length (decimal 8,2, nullable)
  - width (decimal 8,2, nullable)
  - height (decimal 8,2, nullable)
  - featured_image (varchar 255, nullable)
  - gallery_images (JSON, nullable)
  - is_featured (boolean)
  - is_virtual (boolean)
  - is_downloadable (boolean)
  - download_files (JSON, nullable)
  - download_limit (int, nullable)
  - download_expiry (int, nullable)
  - status (enum: draft, published, archived)
  - created_at, updated_at

shop_categories
  - id
  - name (varchar 100)
  - slug (varchar 100, unique)
  - description (text, nullable)
  - parent_id (FK, nullable)
  - image (varchar 255, nullable)
  - order (int)
  - created_at, updated_at

product_categories (pivot)
  - product_id
  - category_id

product_variations (for variable products)
  - id
  - product_id
  - sku (varchar 100, unique, nullable)
  - price (decimal 10,2)
  - sale_price (decimal 10,2, nullable)
  - stock_quantity (int, nullable)
  - attributes (JSON: size, color, etc.)
  - image (varchar 255, nullable)
  - created_at, updated_at

shop_carts
  - id
  - user_id (FK, nullable if guest)
  - session_id (varchar 100, for guests)
  - items (JSON)
  - subtotal (decimal 10,2)
  - tax (decimal 10,2)
  - shipping (decimal 10,2)
  - discount (decimal 10,2)
  - total (decimal 10,2)
  - expires_at (timestamp)
  - created_at, updated_at

shop_orders
  - id
  - order_number (varchar 50, unique)
  - user_id (FK, nullable if guest)
  - status (enum: pending, processing, completed, cancelled, refunded, on_hold)
  - payment_status (enum: unpaid, paid, partially_refunded, refunded)
  - payment_method (varchar 50)
  - payment_id (varchar 255, nullable)
  - subtotal (decimal 10,2)
  - tax (decimal 10,2)
  - shipping (decimal 10,2)
  - discount (decimal 10,2)
  - total (decimal 10,2)
  - currency (varchar 3)
  - customer_email (varchar 255)
  - customer_name (varchar 255)
  - billing_address (JSON)
  - shipping_address (JSON)
  - shipping_method (varchar 100)
  - tracking_number (varchar 100, nullable)
  - customer_note (text, nullable)
  - admin_note (text, nullable)
  - completed_at (timestamp, nullable)
  - created_at, updated_at

shop_order_items
  - id
  - order_id
  - product_id
  - variation_id (nullable)
  - quantity (int)
  - price (decimal 10,2)
  - subtotal (decimal 10,2)
  - tax (decimal 10,2)
  - total (decimal 10,2)
  - product_name (varchar 255)
  - product_sku (varchar 100, nullable)
  - created_at, updated_at

shop_coupons
  - id
  - code (varchar 50, unique)
  - description (text, nullable)
  - discount_type (enum: percent, fixed, free_shipping)
  - discount_value (decimal 10,2)
  - minimum_purchase (decimal 10,2, nullable)
  - maximum_discount (decimal 10,2, nullable)
  - usage_limit (int, nullable)
  - usage_count (int, default 0)
  - per_user_limit (int, nullable)
  - valid_from (datetime, nullable)
  - valid_until (datetime, nullable)
  - is_active (boolean)
  - created_at, updated_at

shop_reviews
  - id
  - product_id
  - user_id (FK, nullable if guest)
  - reviewer_name (varchar 255)
  - reviewer_email (varchar 255)
  - rating (int, 1-5)
  - review (text)
  - status (enum: pending, approved, spam)
  - created_at, updated_at

shop_settings
  - id
  - store_name (varchar 255)
  - currency (varchar 3)
  - configuration (JSON)
  - created_at, updated_at
```

### Auto-Generated Pages

1. **shop.php** - Main shop/product listing (ALWAYS)
2. **product.php** - Individual product page (ALWAYS)
3. **cart.php** - Shopping cart page (ALWAYS)
4. **checkout.php** - Checkout process (ALWAYS)
5. **my-account.php** - Customer dashboard (if User Access installed)
6. **order-confirmation.php** - Order thank you page (ALWAYS)
7. **track-order.php** - Order tracking (if enabled)

### Special Sections

**Product Grid/List Section** - Display products
**Featured Products Section** - Highlighted products
**Product Categories Section** - Category navigation
**Product Search Section** - Search with filters
**Cart Icon/Widget** - Floating cart button with item count
**Checkout Progress** - Multi-step checkout indicator

### Admin Panel Features

**Product Management:**
- Create/edit/delete products
- Bulk actions
- Import/export products (CSV)
- Product variations
- Inventory management

**Order Management:**
- View all orders
- Process orders
- Refund orders
- Print invoices/packing slips
- Export orders

**Customer Management:**
- View customers
- Customer lifetime value
- Purchase history

**Coupon Management:**
- Create/edit/delete coupons
- Usage reports

**Reports & Analytics:**
- Sales reports
- Top products
- Revenue tracking
- Conversion rates

### Tier-Based Restrictions

**Trial:** Cannot install Shop
**Brochure:** Cannot install Shop
**Niche:** Max 50 products, basic payments, max 100 orders/month
**Pro:** Unlimited products, all payment gateways, unlimited orders, advanced features

### Files to Create
(Frontend, Backend, Services - similar structure to other features)

---

## FEATURE #9: FILE HOSTER ✅ SPECIFIED

### Implementation Approach
**Feature Installation** - File upload/download management system with access controls

### Core Concept
**Customer-Configurable within Pagevoo Admin Limits** - Customers control file organization and access, but Pagevoo admin sets storage/size limits

### Configuration Options

**File System Settings:**
- System Name: [Downloads | Files | Resources]
- Allowed file types: [PDF | DOC | ZIP | Images | Videos | Audio | All]
- Max file size per upload: (Pagevoo admin limit, customer cannot exceed)
- Total storage quota: (Pagevoo admin sets per tier)

**Access Control:**
- File access: [Public | Logged-in Users | Specific Roles | Password-Protected]
- Download limits: [Unlimited | X downloads per file | X downloads per user]
- ☐ Require email to download (for guests)
- ☐ Track downloads (analytics)

**File Organization:**
- ☐ Enable folders/categories
- ☐ Enable tags
- ☐ Enable file descriptions
- ☐ Enable file versions (upload new version, keep history)

**File Security:**
- ☐ Scan files for viruses (ClamAV integration)
- ☐ Watermark images/PDFs
- ☐ Prevent hotlinking
- ☐ Expiring download links
- Link expiry time: [1 hour | 24 hours | 7 days | Custom]

**Notifications:**
- ☐ Notify admin on new upload (if user uploads allowed)
- ☐ Send download confirmation to user

### Database Schema

```sql
hosted_files (in pagevoo_website_{user_id})
  - id
  - uploader_id (FK to website_users, nullable)
  - folder_id (FK to file_folders, nullable)
  - file_name (varchar 255)
  - file_path (varchar 500)
  - file_size (bigint, bytes)
  - file_type (varchar 100)
  - mime_type (varchar 100)
  - title (varchar 255, nullable)
  - description (text, nullable)
  - version (int, default 1)
  - parent_file_id (FK for versions)
  - access_type (enum: public, logged_in, role, password)
  - allowed_roles (JSON, nullable)
  - password_hash (varchar 255, nullable)
  - download_limit (int, nullable)
  - download_count (int, default 0)
  - expires_at (timestamp, nullable)
  - status (enum: active, archived, deleted)
  - created_at, updated_at

file_folders
  - id
  - name (varchar 255)
  - parent_id (FK, nullable)
  - description (text, nullable)
  - access_type (enum: public, logged_in, role)
  - allowed_roles (JSON, nullable)
  - order (int)
  - created_at, updated_at

file_downloads
  - id
  - file_id
  - user_id (FK, nullable if guest)
  - guest_email (varchar 255, nullable)
  - ip_address (varchar 45)
  - user_agent (varchar 255)
  - downloaded_at (timestamp)

file_tags (pivot)
  - file_id
  - tag_name (varchar 100)
```

### Pagevoo Admin File Limits

**Per Tier Configuration:**
- Max total storage: [Trial: 100MB | Brochure: 1GB | Niche: 10GB | Pro: 100GB]
- Max file size: [Trial: 10MB | Brochure: 50MB | Niche: 500MB | Pro: 2GB]
- Allowed file types: [Trial: PDF/Images only | Others: All]

**Security Against Workarounds:**
- Detect split archives (.part files)
- Scan for renamed executables
- Block certain MIME types regardless of extension
- Checksum validation

### Auto-Generated Pages

1. **files.php** - File browser/listing
2. **download.php** - Download handler (access control)

---

## FEATURE #10: VIDEO SHARING (YOUTUBE-STYLE) ✅ SPECIFIED

### Implementation Approach
**Feature Installation** - Full video platform like YouTube (requires User Access System)

### Core Concept
**Fully Customer-Configurable** - Create YouTube/Vimeo-style video sharing platform

### Configuration Options

**Platform Settings:**
- Platform Name: (e.g., "MyTube", "VideoHub")
- Allow user uploads: (YES/NO)
- Video moderation: [Auto-publish | Require approval]

**Upload Settings:**
- Max video size: (Pagevoo admin limit)
- Allowed formats: [MP4 | MOV | AVI | WebM | All]
- Max video length: [5 min | 15 min | 60 min | Unlimited]
- ☐ Auto-generate thumbnails
- ☐ Auto-generate multiple quality versions (360p, 720p, 1080p)
- Video processing: [Server-side | Third-party (AWS, Cloudflare Stream)]

**Content Organization:**
- ☐ Enable playlists
- ☐ Enable channels (per user)
- ☐ Enable categories
- ☐ Enable tags
- ☐ Enable video descriptions

**Engagement Features:**
- ☐ Enable likes/dislikes
- ☐ Enable comments
- ☐ Enable video responses
- ☐ Enable subscriptions (follow channels)
- ☐ Enable sharing
- ☐ Enable embeds

**Monetization:**
- ☐ Enable ads (if Pro tier)
- ☐ Enable paid videos
- ☐ Enable channel memberships
- ☐ Enable donations/tips

**Analytics:**
- Track views, watch time, engagement
- Channel analytics
- Popular videos

### Database Schema

```sql
videos (in pagevoo_website_{user_id})
  - id
  - uploader_id (FK to website_users)
  - title (varchar 255)
  - slug (varchar 255, unique)
  - description (text)
  - video_file_path (varchar 500)
  - thumbnail_path (varchar 500, nullable)
  - duration_seconds (int)
  - file_size (bigint)
  - status (enum: processing, published, unlisted, private, removed)
  - view_count (bigint, default 0)
  - like_count (int, default 0)
  - dislike_count (int, default 0)
  - comment_count (int, default 0)
  - is_monetized (boolean)
  - published_at (timestamp, nullable)
  - created_at, updated_at

video_playlists
  - id
  - user_id
  - name (varchar 255)
  - description (text, nullable)
  - privacy (enum: public, unlisted, private)
  - video_count (int)
  - created_at, updated_at

playlist_videos (pivot, with order)
  - playlist_id
  - video_id
  - order (int)

video_views
  - id
  - video_id
  - user_id (nullable)
  - watch_duration (int, seconds)
  - ip_address
  - watched_at

video_likes
  - video_id
  - user_id
  - is_like (boolean, true=like, false=dislike)
  - created_at

video_comments
  - id
  - video_id
  - user_id
  - parent_id (FK, for replies)
  - comment (text)
  - status (enum: published, spam, deleted)
  - created_at, updated_at

channel_subscriptions
  - subscriber_id (FK to website_users)
  - channel_owner_id (FK to website_users)
  - created_at
```

### Auto-Generated Pages

1. **videos.php** - Video feed/homepage
2. **watch.php** - Video player page
3. **channel.php** - User's channel page
4. **upload.php** - Video upload page
5. **my-channel.php** - Manage your channel
6. **subscriptions.php** - Subscribed channels feed

### Tier Restrictions

**Trial:** Cannot install
**Brochure:** Cannot install
**Niche:** Max 50 videos, 100MB per video, basic player
**Pro:** Unlimited videos, Pagevoo admin sets size limit, advanced features

---

## FEATURE #11: SOCIAL PLATFORM (FACEBOOK/INSTAGRAM-STYLE) ✅ SPECIFIED

### Implementation Approach
**Feature Installation** - Full social network (requires User Access System)

### Core Concept
**Fully Customer-Configurable** - Create Facebook/Instagram/Twitter-style social platform

### Configuration Options

**Platform Type:**
- Style: [Facebook-like | Instagram-like | Twitter-like | Custom]

**Content Features:**
- ☐ Enable text posts
- ☐ Enable image posts
- ☐ Enable video posts
- ☐ Enable links/URL previews
- ☐ Enable polls
- ☐ Enable stories (24-hour expiring content)

**Social Features:**
- ☐ Enable likes
- ☐ Enable comments
- ☐ Enable shares/reposts
- ☐ Enable direct messages
- ☐ Enable follow/friend system
- ☐ Enable hashtags
- ☐ Enable mentions (@username)
- ☐ Enable groups/communities

**Privacy:**
- Post privacy: [Public | Friends | Private]
- Profile privacy controls
- Block/report users

**Feeds:**
- Algorithm: [Chronological | Engagement-based | Hybrid]
- Feed types: [Home | Trending | Following]

### Database Schema

```sql
social_posts
  - id
  - user_id
  - content (text)
  - media (JSON: images/videos)
  - post_type (enum: text, image, video, link, poll, story)
  - privacy (enum: public, friends, private)
  - like_count, comment_count, share_count
  - created_at, updated_at

social_comments
  - id
  - post_id
  - user_id
  - parent_id (for replies)
  - content
  - created_at

social_likes
  - post_id, user_id, created_at

social_follows
  - follower_id, following_id, created_at

direct_messages
  - id, sender_id, recipient_id, message, read_at, created_at

notifications
  - id, user_id, type, data (JSON), read_at, created_at
```

### Auto-Generated Pages

1. **feed.php** - Main social feed
2. **profile.php** - User profiles
3. **messages.php** - Direct messages
4. **notifications.php** - Notifications
5. **explore.php** - Discover content

### Tier Restrictions

**Trial:** Cannot install
**Brochure:** Cannot install
**Niche:** Max 100 users, basic features
**Pro:** Unlimited users, all features

---