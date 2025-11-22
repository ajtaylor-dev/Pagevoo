# PAGEVOO PHASE 2 - SCRIPT FEATURES IMPLEMENTATION PLAN
**Created:** November 22, 2025
**Status:** Planning Phase
**Target Completion:** Phase 2 (Before IONOS Deployment)

---

## EXECUTIVE SUMMARY

Phase 2 focuses on implementing the **script features** that make Pagevoo unique in the market. These are functional, dynamic features that go beyond static HTML/CSS templates and provide real business value to niche customers.

### Core Script Features (11 Total)

1. **Contact Form** - Email collection and submission handling
2. **Image Gallery** - Dynamic photo galleries with lightbox
3. **User Access System** - User registration, login, and permissions
4. **Blog & News** - Content management system for articles
5. **Events** - Event calendar and management
6. **Booking System** - Appointment/reservation scheduling
7. **WordPress Integration** - Import/export WordPress content
8. **Shop** - E-commerce with product catalog and cart
9. **File Hoster** - File upload, storage, and download management
10. **Video Sharing** - Video upload, hosting, and playback
11. **Social Platform** - Social networking features (posts, comments, likes)

---

## IMPLEMENTATION PRIORITY & COMPLEXITY

### Tier 1: Essential & Simple (Start Here)
**Estimated Time:** 2-3 weeks

1. **Contact Form** ⭐ HIGHEST PRIORITY
   - Complexity: LOW
   - Dependencies: None
   - Business Value: CRITICAL (every website needs this)

2. **Image Gallery** ⭐
   - Complexity: LOW-MEDIUM
   - Dependencies: None
   - Business Value: HIGH (visual businesses need this)

### Tier 2: High Value & Medium Complexity
**Estimated Time:** 4-6 weeks

3. **Blog & News**
   - Complexity: MEDIUM
   - Dependencies: User Access System (authors)
   - Business Value: HIGH (content marketing essential)

4. **Events**
   - Complexity: MEDIUM
   - Dependencies: None (enhanced by User Access)
   - Business Value: HIGH (local businesses, venues)

5. **User Access System**
   - Complexity: MEDIUM-HIGH
   - Dependencies: None (but required by many features)
   - Business Value: HIGH (enables personalization)

### Tier 3: Specialized Features
**Estimated Time:** 6-10 weeks

6. **Booking System**
   - Complexity: HIGH
   - Dependencies: User Access System, Events (calendar)
   - Business Value: VERY HIGH (service businesses)

7. **Shop (E-commerce)**
   - Complexity: VERY HIGH
   - Dependencies: User Access System, Payment Gateway
   - Business Value: VERY HIGH (retail businesses)

### Tier 4: Advanced Integrations
**Estimated Time:** 8-12 weeks

8. **WordPress Integration**
   - Complexity: HIGH
   - Dependencies: Blog & News system
   - Business Value: MEDIUM (migration tool)

9. **File Hoster**
   - Complexity: MEDIUM-HIGH
   - Dependencies: User Access System (permissions)
   - Business Value: MEDIUM (specific niches)

10. **Video Sharing**
    - Complexity: VERY HIGH
    - Dependencies: File Hoster, User Access System
    - Business Value: MEDIUM-HIGH (content creators)

11. **Social Platform**
    - Complexity: VERY HIGH
    - Dependencies: User Access System, possibly all above
    - Business Value: HIGH (community sites)

---

## DETAILED FEATURE SPECIFICATIONS

---

## 1. CONTACT FORM ⭐ PRIORITY #1

### Description
Dynamic contact forms with email delivery, spam protection, and form builder.

### User Stories
- As a website owner, I want visitors to contact me via email
- As a user, I want to customize form fields without coding
- As a website owner, I want to prevent spam submissions

### Technical Requirements

**Frontend:**
- Form builder interface in Template/Website Builder
- Drag-and-drop form fields (text, email, textarea, select, checkbox, radio)
- Field validation rules (required, email format, min/max length)
- Customizable submit button text and styling
- Success/error message display
- Spam protection (honeypot, reCAPTCHA option)

**Backend:**
- Form submission API endpoint
- Email sending service (Laravel Mail)
- Form data validation
- Spam filtering
- Database storage of submissions (optional)
- Email templates (customizable)

**Database Schema:**
```sql
contact_forms
  - id
  - website_id (foreign key)
  - name (form name)
  - recipient_email
  - fields (JSON array of field definitions)
  - settings (JSON: success message, redirect URL, etc.)
  - spam_protection (enum: none, honeypot, recaptcha)
  - created_at, updated_at

form_submissions (optional - for storing submissions)
  - id
  - contact_form_id
  - data (JSON: submitted field values)
  - ip_address
  - user_agent
  - status (enum: new, read, archived, spam)
  - created_at
```

**Files to Create:**
- Frontend:
  - `src/components/script-features/ContactFormBuilder.tsx`
  - `src/components/script-features/FormFieldEditor.tsx`
  - `src/components/modals/ContactFormModal.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/ContactFormController.php`
  - `app/Models/ContactForm.php`
  - `app/Models/FormSubmission.php`
  - `app/Services/FormEmailService.php`
  - `database/migrations/xxxx_create_contact_forms_table.php`

**Implementation Steps:**
1. Create database migration and models
2. Build form builder UI component
3. Implement form submission API
4. Configure email sending (SMTP)
5. Add spam protection
6. Create admin interface to view submissions
7. Test email delivery

**Estimate:** 4-5 days

---

## 2. IMAGE GALLERY

### Description
Dynamic photo galleries with categories, lightbox viewer, and upload management.

### User Stories
- As a photographer, I want to showcase my portfolio in galleries
- As a website owner, I want to organize images into categories
- As a visitor, I want to view images in full-screen lightbox

### Technical Requirements

**Frontend:**
- Gallery builder interface
- Image upload and management
- Category/album creation
- Gallery layout options (grid, masonry, carousel)
- Lightbox viewer with navigation
- Image captions and descriptions
- Lazy loading for performance

**Backend:**
- Image upload API (with resizing/optimization)
- Gallery CRUD operations
- Image metadata storage
- Album/category management
- Access control (public/private galleries)

**Database Schema:**
```sql
galleries
  - id
  - website_id
  - name
  - description
  - layout_type (grid, masonry, carousel)
  - columns (for grid layout)
  - created_at, updated_at

gallery_images
  - id
  - gallery_id
  - filename
  - path
  - thumbnail_path
  - title
  - description
  - order
  - created_at, updated_at

gallery_categories
  - id
  - gallery_id
  - name
  - slug
  - created_at, updated_at
```

**Files to Create:**
- Frontend:
  - `src/components/script-features/GalleryBuilder.tsx`
  - `src/components/script-features/GalleryLightbox.tsx`
  - `src/components/script-features/ImageUploader.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/GalleryController.php`
  - `app/Models/Gallery.php`
  - `app/Models/GalleryImage.php`
  - `app/Services/ImageProcessingService.php`

**Estimate:** 5-6 days

---

## 3. USER ACCESS SYSTEM

### Description
Complete user authentication, registration, and permission management system.

### User Stories
- As a visitor, I want to create an account on the website
- As a user, I want to log in and access member-only content
- As an admin, I want to manage user roles and permissions

### Technical Requirements

**Frontend:**
- Registration form component
- Login/logout functionality
- Password reset flow
- User profile editor
- Role-based content visibility
- Member dashboard

**Backend:**
- User registration API
- Authentication (Laravel Sanctum - already implemented)
- Password reset functionality
- Role and permission system
- Email verification
- Social login (optional: Google, Facebook)

**Database Schema:**
```sql
-- Extend existing users table
ALTER TABLE users ADD COLUMN:
  - email_verified_at
  - remember_token
  - status (active, suspended, pending)
  - profile_data (JSON)

roles
  - id
  - name (admin, editor, member, etc.)
  - description
  - created_at, updated_at

permissions
  - id
  - name (edit_posts, manage_users, etc.)
  - description
  - created_at, updated_at

role_user (pivot)
  - role_id
  - user_id

permission_role (pivot)
  - permission_id
  - role_id
```

**Files to Create:**
- Frontend:
  - `src/components/auth/RegisterForm.tsx`
  - `src/components/auth/LoginForm.tsx`
  - `src/components/auth/PasswordReset.tsx`
  - `src/components/auth/UserProfile.tsx`
  - `src/pages/MemberDashboard.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/AuthController.php`
  - `app/Models/Role.php`
  - `app/Models/Permission.php`
  - `app/Http/Middleware/CheckRole.php`

**Estimate:** 6-7 days

---

## 4. BLOG & NEWS

### Description
Full-featured blog/news system with posts, categories, tags, and comments.

### User Stories
- As a content creator, I want to publish blog posts
- As an admin, I want to organize posts into categories
- As a reader, I want to comment on posts

### Technical Requirements

**Frontend:**
- Rich text post editor (TinyMCE or similar)
- Post list/grid view
- Single post view with comments
- Category and tag filtering
- Search functionality
- Author profiles
- RSS feed

**Backend:**
- Post CRUD operations
- Category and tag management
- Comment system (with moderation)
- Post scheduling
- Draft/published status
- SEO metadata per post

**Database Schema:**
```sql
blog_posts
  - id
  - author_id (foreign key to users)
  - website_id
  - title
  - slug
  - content (longtext)
  - excerpt
  - featured_image
  - status (draft, published, scheduled)
  - published_at
  - views_count
  - meta_title, meta_description
  - created_at, updated_at

blog_categories
  - id
  - website_id
  - name
  - slug
  - description
  - parent_id (for nested categories)
  - created_at, updated_at

blog_tags
  - id
  - website_id
  - name
  - slug
  - created_at, updated_at

blog_post_tag (pivot)
  - blog_post_id
  - blog_tag_id

blog_comments
  - id
  - blog_post_id
  - user_id (nullable for guest comments)
  - author_name, author_email (for guests)
  - content
  - status (pending, approved, spam)
  - parent_id (for nested comments)
  - created_at, updated_at
```

**Files to Create:**
- Frontend:
  - `src/components/blog/PostEditor.tsx`
  - `src/components/blog/PostList.tsx`
  - `src/components/blog/PostSingle.tsx`
  - `src/components/blog/CommentSection.tsx`
  - `src/pages/BlogDashboard.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/BlogController.php`
  - `app/Models/BlogPost.php`
  - `app/Models/BlogCategory.php`
  - `app/Models/BlogTag.php`
  - `app/Models/BlogComment.php`

**Estimate:** 8-10 days

---

## 5. EVENTS

### Description
Event calendar and management system for venues, conferences, and local businesses.

### User Stories
- As a venue owner, I want to list upcoming events
- As a visitor, I want to view events in calendar format
- As an event organizer, I want to manage RSVPs

### Technical Requirements

**Frontend:**
- Event calendar view (month, week, day)
- Event creation form
- Event detail page
- RSVP/ticket system
- Search and filter (by date, category, location)
- iCal export

**Backend:**
- Event CRUD operations
- Recurring events support
- RSVP/ticket management
- Email notifications for event reminders
- Capacity management
- Event categories and tags

**Database Schema:**
```sql
events
  - id
  - website_id
  - title
  - slug
  - description
  - start_datetime
  - end_datetime
  - timezone
  - location_name
  - location_address
  - location_lat, location_lng
  - featured_image
  - capacity (nullable)
  - price (nullable, for paid events)
  - is_recurring
  - recurrence_rule (JSON for recurring events)
  - status (draft, published, cancelled)
  - created_at, updated_at

event_categories
  - id
  - website_id
  - name
  - slug
  - created_at, updated_at

event_rsvps
  - id
  - event_id
  - user_id (nullable for guest RSVPs)
  - name, email, phone
  - status (pending, confirmed, cancelled)
  - tickets_count
  - created_at, updated_at
```

**Files to Create:**
- Frontend:
  - `src/components/events/EventCalendar.tsx`
  - `src/components/events/EventForm.tsx`
  - `src/components/events/EventDetail.tsx`
  - `src/components/events/RSVPForm.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/EventController.php`
  - `app/Models/Event.php`
  - `app/Models/EventRsvp.php`
  - `app/Services/RecurringEventService.php`

**Estimate:** 7-9 days

---

## 6. BOOKING SYSTEM

### Description
Appointment and reservation scheduling system for service-based businesses.

### User Stories
- As a service provider, I want clients to book appointments online
- As a client, I want to see available time slots
- As a business owner, I want to manage my availability

### Technical Requirements

**Frontend:**
- Availability calendar with time slots
- Service selection (haircut, consultation, etc.)
- Date/time picker
- Customer information form
- Confirmation and email notifications
- Admin booking management dashboard

**Backend:**
- Availability management
- Booking conflict detection
- Time slot calculation
- Booking CRUD operations
- Email confirmations and reminders
- Payment integration (optional - Stripe/PayPal)
- Cancellation and rescheduling

**Database Schema:**
```sql
booking_services
  - id
  - website_id
  - name
  - description
  - duration_minutes
  - price
  - buffer_time_minutes
  - created_at, updated_at

booking_availability
  - id
  - website_id
  - day_of_week (0-6)
  - start_time
  - end_time
  - is_available
  - created_at, updated_at

booking_exceptions
  - id
  - website_id
  - date
  - start_time, end_time
  - is_available (for closures or special hours)
  - created_at, updated_at

bookings
  - id
  - website_id
  - service_id
  - user_id (nullable)
  - customer_name, customer_email, customer_phone
  - booking_date
  - start_time
  - end_time
  - status (pending, confirmed, completed, cancelled)
  - notes
  - payment_status (if applicable)
  - created_at, updated_at
```

**Files to Create:**
- Frontend:
  - `src/components/booking/BookingCalendar.tsx`
  - `src/components/booking/ServiceSelector.tsx`
  - `src/components/booking/TimeSlotPicker.tsx`
  - `src/components/booking/BookingForm.tsx`
  - `src/pages/BookingDashboard.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/BookingController.php`
  - `app/Models/BookingService.php`
  - `app/Models/Booking.php`
  - `app/Services/AvailabilityService.php`
  - `app/Services/BookingNotificationService.php`

**Estimate:** 10-12 days

---

## 7. SHOP (E-COMMERCE)

### Description
Full e-commerce solution with products, cart, checkout, and order management.

### User Stories
- As a store owner, I want to sell products online
- As a customer, I want to browse products and add to cart
- As a customer, I want to securely checkout with payment

### Technical Requirements

**Frontend:**
- Product catalog with search/filter
- Product detail pages
- Shopping cart
- Checkout flow
- Order confirmation
- Customer account (order history)
- Admin product management

**Backend:**
- Product CRUD operations
- Category and tag management
- Inventory management
- Shopping cart session/database
- Checkout and order processing
- Payment gateway integration (Stripe, PayPal)
- Order management and fulfillment
- Shipping calculation
- Tax calculation
- Email notifications (order confirmation, shipping updates)

**Database Schema:**
```sql
shop_products
  - id
  - website_id
  - name
  - slug
  - description
  - price
  - sale_price (nullable)
  - sku
  - stock_quantity
  - images (JSON array)
  - is_featured
  - status (draft, published, out_of_stock)
  - created_at, updated_at

shop_categories
  - id
  - website_id
  - name
  - slug
  - parent_id
  - created_at, updated_at

shop_carts
  - id
  - user_id (nullable for guest carts)
  - session_id
  - items (JSON)
  - created_at, updated_at

shop_orders
  - id
  - website_id
  - user_id (nullable)
  - order_number
  - status (pending, processing, completed, cancelled)
  - subtotal, tax, shipping, total
  - payment_method
  - payment_status (pending, paid, refunded)
  - shipping_address (JSON)
  - billing_address (JSON)
  - created_at, updated_at

shop_order_items
  - id
  - order_id
  - product_id
  - product_name (snapshot)
  - quantity
  - price
  - created_at, updated_at
```

**Files to Create:**
- Frontend:
  - `src/components/shop/ProductGrid.tsx`
  - `src/components/shop/ProductDetail.tsx`
  - `src/components/shop/ShoppingCart.tsx`
  - `src/components/shop/Checkout.tsx`
  - `src/pages/ShopDashboard.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/ShopController.php`
  - `app/Models/ShopProduct.php`
  - `app/Models/ShopOrder.php`
  - `app/Services/PaymentService.php`
  - `app/Services/ShippingService.php`

**Estimate:** 15-20 days

---

## 8. WORDPRESS INTEGRATION

### Description
Import WordPress content (posts, pages, media) into Pagevoo format.

### User Stories
- As a WordPress user, I want to migrate my content to Pagevoo
- As an admin, I want to import WordPress XML export files

### Technical Requirements

**Frontend:**
- WordPress import wizard
- Content mapping interface
- Import progress tracker

**Backend:**
- WordPress XML parser
- Content transformation (WP format → Pagevoo format)
- Media file migration
- User mapping
- Category/tag migration
- URL redirect mapping

**Database Schema:**
```sql
wordpress_imports
  - id
  - website_id
  - status (processing, completed, failed)
  - source_file
  - mapping_data (JSON)
  - stats (JSON: posts imported, media migrated, etc.)
  - created_at, updated_at
```

**Files to Create:**
- Frontend:
  - `src/components/wordpress/ImportWizard.tsx`
  - `src/components/wordpress/ContentMapper.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/WordPressController.php`
  - `app/Services/WordPressImporter.php`
  - `app/Services/WordPressXmlParser.php`

**Estimate:** 8-10 days

---

## 9. FILE HOSTER

### Description
File upload, storage, and download management system.

### User Stories
- As a user, I want to share files with website visitors
- As an admin, I want to control who can download files
- As a visitor, I want to download files securely

### Technical Requirements

**Frontend:**
- File upload interface (drag & drop)
- File browser/manager
- Download links generator
- Access control settings
- File preview (PDFs, images)

**Backend:**
- File upload API (with virus scanning)
- Storage management (S3, local disk)
- Download tracking
- Access control (public, private, password-protected)
- Download limits and expiration
- File metadata storage

**Database Schema:**
```sql
hosted_files
  - id
  - website_id
  - user_id (uploader)
  - filename
  - original_filename
  - path
  - filesize
  - mime_type
  - access_level (public, private, password)
  - password (nullable, hashed)
  - download_limit (nullable)
  - downloads_count
  - expires_at (nullable)
  - created_at, updated_at

file_downloads
  - id
  - hosted_file_id
  - ip_address
  - user_id (nullable)
  - downloaded_at
```

**Files to Create:**
- Frontend:
  - `src/components/files/FileUploader.tsx`
  - `src/components/files/FileBrowser.tsx`
  - `src/components/files/FilePreview.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/FileHostController.php`
  - `app/Models/HostedFile.php`
  - `app/Services/FileStorageService.php`
  - `app/Services/VirusScanService.php`

**Estimate:** 7-9 days

---

## 10. VIDEO SHARING

### Description
Video upload, hosting, and playback platform.

### User Stories
- As a content creator, I want to upload and share videos
- As a visitor, I want to watch videos with a modern player
- As an admin, I want to manage video content

### Technical Requirements

**Frontend:**
- Video upload interface (chunked upload for large files)
- Video player (HTML5 with controls)
- Video thumbnails
- Playlists
- Video search and categories
- View counter

**Backend:**
- Video upload API
- Video transcoding (multiple resolutions)
- Thumbnail generation
- Video streaming
- Storage management (consider CDN)
- Access control
- Analytics (views, watch time)

**Database Schema:**
```sql
videos
  - id
  - website_id
  - user_id (uploader)
  - title
  - description
  - filename
  - path
  - thumbnail_path
  - duration_seconds
  - filesize
  - status (processing, ready, failed)
  - views_count
  - visibility (public, unlisted, private)
  - created_at, updated_at

video_resolutions
  - id
  - video_id
  - resolution (360p, 720p, 1080p)
  - path
  - filesize
  - created_at, updated_at

video_playlists
  - id
  - website_id
  - user_id
  - name
  - description
  - created_at, updated_at

video_playlist_items
  - id
  - playlist_id
  - video_id
  - order
```

**Files to Create:**
- Frontend:
  - `src/components/video/VideoUploader.tsx`
  - `src/components/video/VideoPlayer.tsx`
  - `src/components/video/VideoGrid.tsx`
  - `src/components/video/PlaylistManager.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/VideoController.php`
  - `app/Models/Video.php`
  - `app/Services/VideoTranscodingService.php` (use FFmpeg)
  - `app/Services/VideoStreamingService.php`

**Estimate:** 12-15 days

---

## 11. SOCIAL PLATFORM

### Description
Social networking features including posts, comments, likes, follows, and feeds.

### User Stories
- As a user, I want to create posts and share content
- As a member, I want to follow other users
- As a community member, I want to like and comment on posts

### Technical Requirements

**Frontend:**
- News feed
- Post creation (text, images, videos)
- Like/comment system
- User profiles
- Follow/unfollow functionality
- Notifications
- Activity feed

**Backend:**
- Post CRUD operations
- Like system
- Comment threading
- Follow relationships
- Feed algorithm (chronological, trending, etc.)
- Notifications system
- Real-time updates (WebSockets optional)

**Database Schema:**
```sql
social_posts
  - id
  - website_id
  - user_id
  - content
  - media (JSON: images/videos)
  - visibility (public, friends, private)
  - likes_count
  - comments_count
  - created_at, updated_at

social_comments
  - id
  - post_id
  - user_id
  - content
  - parent_id (for nested comments)
  - likes_count
  - created_at, updated_at

social_likes
  - id
  - likeable_type (post, comment)
  - likeable_id
  - user_id
  - created_at

social_follows
  - id
  - follower_id (user)
  - following_id (user)
  - created_at

notifications
  - id
  - user_id
  - type (like, comment, follow, mention)
  - data (JSON)
  - read_at (nullable)
  - created_at
```

**Files to Create:**
- Frontend:
  - `src/components/social/NewsFeed.tsx`
  - `src/components/social/PostCard.tsx`
  - `src/components/social/PostComposer.tsx`
  - `src/components/social/UserProfile.tsx`
  - `src/components/social/Notifications.tsx`
- Backend:
  - `app/Http/Controllers/Api/V1/SocialController.php`
  - `app/Models/SocialPost.php`
  - `app/Models/SocialComment.php`
  - `app/Services/FeedService.php`
  - `app/Services/NotificationService.php`

**Estimate:** 15-20 days

---

## IMPLEMENTATION ROADMAP

### Phase 2A: Foundation (Weeks 1-4)
**Goal:** Implement core features that most websites need

- ✅ Week 1-2: **Contact Form** (COMPLETE)
- ✅ Week 3-4: **Image Gallery** (COMPLETE)

**Deliverables:**
- Working contact form feature in Template/Website Builder
- Dynamic image galleries with lightbox
- Documentation for both features

### Phase 2B: Content Management (Weeks 5-10)
**Goal:** Enable content-driven websites

- Week 5-7: **User Access System** (Foundation for other features)
- Week 8-10: **Blog & News**
- Week 11-12: **Events**

**Deliverables:**
- Complete authentication and authorization system
- Fully-featured blog CMS
- Event calendar and management
- User dashboard

### Phase 2C: Business Features (Weeks 11-18)
**Goal:** Enable service and e-commerce businesses

- Week 13-15: **Booking System**
- Week 16-20: **Shop (E-commerce)**

**Deliverables:**
- Appointment scheduling system
- Complete e-commerce platform
- Payment gateway integration
- Order management system

### Phase 2D: Advanced Features (Weeks 19-28)
**Goal:** Specialized features for niche markets

- Week 21-23: **WordPress Integration**
- Week 24-26: **File Hoster**
- Week 27-30: **Video Sharing**
- Week 31-35: **Social Platform**

**Deliverables:**
- WordPress migration tool
- File hosting and sharing
- Video platform
- Social networking features

---

## TECHNICAL ARCHITECTURE CONSIDERATIONS

### Frontend Architecture

**Script Feature Components Structure:**
```
src/components/script-features/
  contact-form/
    ContactFormBuilder.tsx
    FormFieldEditor.tsx
    FormSubmissionView.tsx
  gallery/
    GalleryBuilder.tsx
    GalleryLightbox.tsx
    ImageUploader.tsx
  blog/
    PostEditor.tsx
    PostList.tsx
    CommentSection.tsx
  events/
    EventCalendar.tsx
    EventForm.tsx
    RSVPForm.tsx
  booking/
    BookingCalendar.tsx
    TimeSlotPicker.tsx
  shop/
    ProductGrid.tsx
    ShoppingCart.tsx
    Checkout.tsx
  ... (and so on)
```

**State Management:**
- Consider Zustand stores for each feature's global state
- Local state for UI components
- API integration via centralized service layer

### Backend Architecture

**Service Layer Pattern:**
```
app/Services/ScriptFeatures/
  ContactFormService.php
  GalleryService.php
  BlogService.php
  EventService.php
  BookingService.php
  ShopService.php
  ... (and so on)
```

**API Versioning:**
- All script features under `/api/v1/script-features/*`
- Consistent RESTful design
- Proper error handling and validation

### Database Design

**Multi-tenancy Considerations:**
- All script feature tables include `website_id` foreign key
- Data isolation per website
- Efficient indexing on `website_id` + primary queries

### Security Considerations

**For All Features:**
- CSRF protection on all forms
- XSS prevention (sanitize user input)
- SQL injection prevention (use Eloquent ORM)
- Rate limiting on API endpoints
- File upload validation and virus scanning
- Proper authentication and authorization checks

**Payment Features (Shop, Booking):**
- PCI compliance for payment handling
- Use payment gateway SDKs (Stripe, PayPal)
- Never store credit card numbers
- SSL/HTTPS required
- Secure webhooks for payment notifications

---

## FEATURE ENABLEMENT SYSTEM

### Template Feature Tagging
Each template can be tagged with supported script features:

```typescript
interface Template {
  // ... existing fields
  script_features: ScriptFeature[]
}

type ScriptFeature =
  | 'contact_form'
  | 'image_gallery'
  | 'user_access'
  | 'blog'
  | 'events'
  | 'booking'
  | 'shop'
  | 'file_hoster'
  | 'video_sharing'
  | 'social_platform'
  | 'wordpress_import'
```

### Website Feature Activation
When creating a website from a template:
- User sees which features are available
- Can enable/disable features as needed
- Features are configured per website instance
- Some features may require tier upgrades

### Tier-Based Feature Access

**Trial Tier:**
- Contact Form (basic)
- Image Gallery (max 10 images)

**Brochure Tier:**
- Contact Form (unlimited)
- Image Gallery (unlimited)
- Blog & News (basic)

**Niche Tier:**
- All Brochure features
- Events
- User Access System
- Booking System (basic)

**Pro Tier:**
- All features unlocked
- Shop (e-commerce)
- WordPress Integration
- File Hoster
- Video Sharing
- Social Platform

---

## DEVELOPMENT GUIDELINES

### Code Quality Standards
- TypeScript strict mode for frontend
- PHPStan level 6+ for backend
- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user flows

### Performance Requirements
- Page load time < 2 seconds
- API response time < 200ms (avg)
- Database queries optimized (no N+1)
- Image optimization (WebP, lazy loading)
- Code splitting for large features

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Proper ARIA labels
- Color contrast ratios

---

## TESTING STRATEGY

### Unit Tests
- All service layer methods
- Utility functions
- Form validation logic
- State management stores

### Integration Tests
- API endpoint responses
- Database operations
- Email sending
- Payment processing (sandbox)
- File uploads

### E2E Tests
- Critical user flows for each feature
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsive testing
- Performance testing under load

---

## DEPLOYMENT CONSIDERATIONS

### IONOS Server Requirements
- PHP 8.2+
- MySQL 8.0+
- Composer
- Node.js (for build process)
- SSL certificate
- Email server (SMTP)
- Storage space (especially for video/file hosting)
- FFmpeg (for video transcoding)

### Environment Variables
```env
# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="${APP_NAME}"

# Payment Gateways
STRIPE_KEY=
STRIPE_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=

# File Storage
FILESYSTEM_DISK=local
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
AWS_BUCKET=

# Video Processing
FFMPEG_PATH=/usr/bin/ffmpeg

# Social Features
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
```

---

## SUCCESS METRICS

### Technical Metrics
- Feature completion rate
- Code coverage (target: 80%+)
- Bug count per feature
- API response times
- Database query performance

### Business Metrics
- Feature adoption rate (% of websites using each feature)
- User engagement with features
- Customer satisfaction scores
- Revenue per tier
- Feature upgrade conversions

---

## RISKS & MITIGATION

### Technical Risks

**Risk:** Feature complexity leading to delays
**Mitigation:** Start with MVP for each feature, iterate based on feedback

**Risk:** Performance degradation with many features enabled
**Mitigation:** Lazy loading, code splitting, database optimization

**Risk:** Security vulnerabilities in user-generated content
**Mitigation:** Comprehensive input validation, security audits, penetration testing

### Business Risks

**Risk:** Features too complex for target users
**Mitigation:** User testing, intuitive UI/UX, comprehensive documentation

**Risk:** Tier pricing doesn't align with feature value
**Mitigation:** Market research, A/B testing, flexible pricing

---

## NEXT STEPS

1. **Review and approve this plan** ✅ (You're reading it!)
2. **Start with Contact Form** (Highest priority, lowest complexity)
3. **Set up development environment** for script features
4. **Create database migrations** for Contact Form
5. **Build Contact Form UI** in Template/Website Builder
6. **Implement backend API** for form submissions
7. **Test and iterate**
8. **Move to Image Gallery**
9. **Continue through the roadmap**

---

## CONCLUSION

Phase 2 will transform Pagevoo from a template builder into a **complete website platform** with dynamic, functional features that serve real business needs. By implementing these 11 script features, Pagevoo will:

- Differentiate from competitors (Wix, Squarespace, etc.)
- Target niche markets with specialized needs
- Provide genuine value to local businesses
- Create recurring revenue through tier upgrades
- Build a sustainable, scalable SaaS platform

**Estimated Total Time:** 6-9 months
**Recommended Approach:** Agile sprints, 2-week iterations
**Team Size:** 2-3 developers

Let's build something amazing! 🚀

---

**Document Version:** 1.0
**Last Updated:** November 22, 2025
**Status:** Ready for Implementation
