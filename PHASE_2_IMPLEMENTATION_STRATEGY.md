# PAGEVOO PHASE 2 - IMPLEMENTATION STRATEGY
**Created:** November 22, 2025
**Deadline:** December 9, 2025 (2.5 weeks)
**Status:** Planning & Requirements Gathering

---

## ⚠️ CRITICAL: DATABASE ARCHITECTURE

### Per-Website Database Requirement

**MANDATORY RULE:** Each published website MUST have its own dedicated MySQL database.

**Database Lifecycle:**

1. **Database Creation Triggers:**
   - User publishes a website for the first time, OR
   - User manually creates database (without publishing yet)

2. **One Active Database Per User:**
   - User can only have **ONE active database** at a time
   - Database is tied to a specific website

3. **Script Feature Dependency:**
   - **ALL script features require a database to function**
   - If user tries to add a feature:
     - Check if website has database
     - If NO database: Prompt user to either:
       - ✓ Publish website (creates database)
       - ✓ Create database manually (for testing features before publishing)

4. **Website Locking:**
   - Once a website has a database assigned:
     - **ONLY that website can be saved/edited**
     - **New templates CANNOT be created**
     - User must delete database first to create new templates

5. **Database Deletion:**
   - User can delete database at any time
   - **WARNING:** Deletes ALL script feature data (contacts, products, users, etc.)
   - Must confirm deletion
   - After deletion:
     - Website becomes unpublished (if published)
     - User can create new templates again

6. **Template vs Website Distinction:**
   - **Templates** (Template Builder): NO database, static HTML/CSS only
   - **Websites** (Website Builder): CAN have database, dynamic features enabled

### Database Naming Convention
```
pagevoo_website_{user_id}
```
- Single database per user
- All script features use this database
- Tables prefixed with feature name (e.g., `shop_products`, `blog_posts`, `contact_forms`)

### Database Connection Management

```php
// When user has active database
$websiteDatabase = "pagevoo_website_{$userId}";

// All script feature queries run on this database
config(['database.connections.website' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST'),
    'database' => $websiteDatabase,
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
]]);

DB::connection('website')->table('shop_products')->get();
```

### UI Flow for Database Management

**Scenario 1: User wants to add Shop feature**
1. User clicks "Insert > Feature > Shop"
2. System checks: Does this website have a database?
3. If NO:
   ```
   ┌─────────────────────────────────────────────────┐
   │  Shop Feature Requires Database                 │
   ├─────────────────────────────────────────────────┤
   │  This website needs a database to use dynamic   │
   │  features like Shop, Blog, and User Accounts.   │
   │                                                  │
   │  Choose an option:                              │
   │                                                  │
   │  ○ Publish Website & Create Database            │
   │    (Makes website live with custom domain)      │
   │                                                  │
   │  ○ Create Database Only                         │
   │    (Test features before publishing)            │
   │                                                  │
   │  [ Cancel ]  [ Continue ]                       │
   └─────────────────────────────────────────────────┘
   ```

**Scenario 2: User tries to create new template while having active database**
```
┌─────────────────────────────────────────────────┐
│  Cannot Create New Template                    │
├─────────────────────────────────────────────────┤
│  You have an active database for:              │
│  "My Shop Website"                              │
│                                                  │
│  You can only work on one website at a time    │
│  when using dynamic features.                   │
│                                                  │
│  To create a new template, you must:           │
│  1. Delete the current database                │
│  2. Unpublish "My Shop Website"                │
│                                                  │
│  ⚠️ WARNING: Deleting the database will        │
│  remove all products, orders, users, etc.      │
│                                                  │
│  [ Cancel ]  [ Manage Database ]                │
└─────────────────────────────────────────────────┘
```

**Scenario 3: Database Management Panel**
```
┌─────────────────────────────────────────────────┐
│  Database Management                            │
├─────────────────────────────────────────────────┤
│  Active Database: pagevoo_website_42            │
│  Website: "My Shop Website"                     │
│  Created: November 22, 2025                     │
│  Status: Published                              │
│                                                  │
│  Features Using Database:                       │
│  ✓ Shop (152 products, 43 orders)              │
│  ✓ User Access (87 registered users)           │
│  ✓ Contact Form (24 submissions)               │
│                                                  │
│  ⚠️ Database Actions                            │
│  [ Export Database Backup ]                     │
│  [ Delete Database ]                            │
│                                                  │
│  Note: Deleting removes ALL data permanently!   │
└─────────────────────────────────────────────────┘
```

### Database Tables Structure

**Core Management Table (in main pagevoo_core database):**
```sql
user_databases
  - id
  - user_id (foreign key to users)
  - website_id (foreign key to user_websites)
  - database_name (pagevoo_website_{user_id})
  - status (active, deleted)
  - created_at
  - deleted_at (nullable)

-- User can only have one row with status='active'
-- Unique constraint on (user_id, status='active')
```

**Script Feature Tables (in per-user database):**
All script feature tables live in the user's dedicated database:
- `contact_forms`, `form_submissions`
- `shop_products`, `shop_orders`, `shop_carts`
- `blog_posts`, `blog_comments`
- `events`, `event_rsvps`
- `users` (website members, NOT Pagevoo accounts)
- etc.

### Migration Strategy

**When database is created:**
```php
// Create new database
DB::statement("CREATE DATABASE {$databaseName}");

// Run all script feature migrations on new database
Artisan::call('migrate', [
    '--database' => 'website',
    '--path' => 'database/migrations/script_features'
]);
```

**Pre-built migration files:**
- All script features have migrations ready
- Only run migrations for installed features
- Track which migrations ran per database

---

## CORE PRINCIPLES

### 1. Modular Architecture
- **Single codebase** for both Template Builder and Website Builder
- **Permission-based restrictions** differentiate admin vs user access
- **Reusable components** across all script features
- **Plug-and-play design** - features can be independently enabled/disabled

### 2. Cross-Compatibility Requirements
- Features must work together seamlessly
- **Dependency resolution** - some features require others:
  - Shop → REQUIRES User Access System (for customer accounts)
  - Blog → OPTIONAL User Access System (for authors, but can work with admin-only)
  - Booking → OPTIONAL User Access System (can work with guest bookings)
  - Social Platform → REQUIRES User Access System (users need accounts)
  - File Hoster → OPTIONAL User Access System (for access control)
  - Video Sharing → OPTIONAL User Access System (for uploaders)

### 3. User Experience Flow

**Feature Installation Process:**
1. User clicks **Insert > Feature**
2. Modal shows available script features (filtered by account tier)
3. User selects a feature (e.g., "Shop", "Blog", "Booking System")
4. **Configuration modal opens** with feature-specific settings:
   - Administration options
   - User account settings
   - Permission configurations
   - Design/layout preferences
5. On confirmation:
   - Required **pages are auto-created** (login.php, shop.php, etc.)
   - Special **sections added to sidebar** (product listings, cart, etc.)
   - **Database tables created** for that feature
   - Feature is now **active and configurable**

### 4. Section System Integration

**Special Section Types:**
- Some features add **unique section types** to the sections sidebar
- **Section restrictions**:
  - Some sections can only appear once (e.g., shopping cart)
  - Some sections can only appear on specific pages (e.g., login form on login page)
  - **Dynamic sections** update based on context (e.g., "My Account" shows logged-in user)
  - **Conditional rendering** based on user state

**Examples:**
- **Shop Feature** adds sections:
  - Product Grid (can appear anywhere, multiple times)
  - Shopping Cart (appears once, typically in header/dedicated page)
  - Checkout Form (only on checkout.php)
  - Order History (only on account pages, for logged-in users)

- **Blog Feature** adds sections:
  - Blog Post List (can appear anywhere)
  - Single Post View (only on single-post.php)
  - Comment Section (only on single-post.php)
  - Author Info (can appear on post or author pages)

---

## IMPLEMENTATION ARCHITECTURE

### Frontend Structure

```
src/components/script-features/
  core/
    FeatureInstaller.tsx           # Main "Insert > Feature" modal
    FeatureConfigModal.tsx          # Base modal for feature configuration
    FeatureDependencyResolver.tsx   # Checks and installs dependencies

  contact-form/
    ContactFormConfig.tsx           # Configuration modal
    ContactFormSection.tsx          # Section component

  user-access/
    UserAccessConfig.tsx
    LoginSection.tsx
    RegisterSection.tsx
    ProfileSection.tsx

  shop/
    ShopConfig.tsx
    ProductGridSection.tsx
    CartSection.tsx
    CheckoutSection.tsx

  blog/
    BlogConfig.tsx
    PostListSection.tsx
    SinglePostSection.tsx
    CommentSection.tsx

  ... (one directory per feature)
```

### Backend Structure

```
app/
  Services/ScriptFeatures/
    FeatureInstaller.php            # Handles feature installation
    FeatureManager.php              # Manages active features per website

    ContactFormService.php
    UserAccessService.php
    ShopService.php
    BlogService.php
    ... (one service per feature)

  Http/Controllers/Api/V1/ScriptFeatures/
    FeatureController.php           # Feature installation/management
    ContactFormController.php
    UserAccessController.php
    ShopController.php
    ... (one controller per feature)
```

### Database Design

**Core Feature Management:**
```sql
website_features
  - id
  - website_id
  - feature_type (enum: contact_form, user_access, shop, blog, etc.)
  - configuration (JSON - feature-specific settings)
  - is_active
  - installed_at
  - created_at, updated_at

feature_dependencies
  - id
  - feature_type (the feature that has dependencies)
  - requires_feature (the feature it depends on)
  - is_optional (boolean - can work without, but enhanced with)
```

**Feature-Specific Tables:**
Each feature will have its own set of tables, all linked to `website_id` for multi-tenancy.

---

## PERMISSION & RESTRICTION SYSTEM

### Template Builder (Admin)
- **NO RESTRICTIONS** - admin can configure everything
- Can install any feature
- Can configure all settings
- Can create custom pages with any sections
- Full access to all section types

### Website Builder (End User)
- **Tier-based restrictions** on available features
- Can only install features allowed by their tier
- Some configuration options may be locked (e.g., can't disable security features)
- **Section placement validation**:
  - Login section can only go on login.php or account pages
  - Checkout section can only go on checkout.php
  - Some sections enforce single-instance (shopping cart, header, footer)

### Permission Checking Flow
```typescript
// Example permission check
function canInstallFeature(feature: ScriptFeature, userTier: AccountTier): boolean {
  const tierPermissions = {
    trial: ['contact_form', 'image_gallery'],
    brochure: ['contact_form', 'image_gallery', 'blog'],
    niche: ['contact_form', 'image_gallery', 'blog', 'events', 'booking', 'user_access'],
    pro: ['*'] // All features
  }

  return tierPermissions[userTier].includes(feature) || tierPermissions[userTier].includes('*')
}
```

---

## AUTO-GENERATED PAGES SYSTEM

### Page Templates by Feature

**Contact Form:**
- No additional pages (can be added to any page)

**User Access System:**
- `login.php` - Login form
- `register.php` - Registration form
- `forgot-password.php` - Password reset
- `account.php` - User dashboard/profile

**Shop:**
- `shop.php` - Product catalog
- `product.php` - Single product view (dynamic)
- `cart.php` - Shopping cart
- `checkout.php` - Checkout process
- `order-confirmation.php` - Order confirmation
- `my-orders.php` - Order history (requires login)

**Blog:**
- `blog.php` - Blog post list
- `post.php` - Single post view (dynamic)
- `category.php` - Category archive (dynamic)
- `author.php` - Author archive (dynamic)

**Events:**
- `events.php` - Event calendar/list
- `event.php` - Single event view (dynamic)
- `rsvp-confirmation.php` - RSVP confirmation

**Booking System:**
- `booking.php` - Booking calendar and form
- `booking-confirmation.php` - Booking confirmation
- `my-bookings.php` - User's bookings (requires login)

**File Hoster:**
- `files.php` - File browser
- `download.php` - Download handler (dynamic)

**Video Sharing:**
- `videos.php` - Video gallery
- `video.php` - Video player (dynamic)
- `upload.php` - Video upload (requires login)

**Social Platform:**
- `feed.php` - Social feed
- `profile.php` - User profile (dynamic)
- `notifications.php` - Notifications (requires login)

**WordPress Import:**
- No pages (it's a migration tool)

**Image Gallery:**
- `gallery.php` - Gallery viewer
- No additional pages needed (can embed galleries anywhere)

### Auto-Creation Process

When a feature is installed:
1. Check which pages are required
2. Generate page files with base structure
3. Add pages to `template_pages` or `user_pages` table
4. Populate pages with required sections
5. Update navigation menu (optional, ask user)

---

## SECTION RESTRICTIONS & VALIDATION

### Restriction Types

**1. Single Instance Sections**
Sections that can only appear once across entire website:
- Shopping Cart
- Main Navigation (navbar)
- Main Footer
- Checkout Form

**2. Page-Specific Sections**
Sections that can only appear on certain page types:
- Login Form → only on login.php or account pages
- Registration Form → only on register.php
- Checkout Form → only on checkout.php
- Order History → only on my-orders.php or account.php
- Single Post View → only on post.php
- Single Product View → only on product.php

**3. Dynamic Context Sections**
Sections that change based on user state:
- **"My Account" Section:**
  - If logged in → shows user info, logout button
  - If logged out → shows login form
- **Cart Icon:**
  - Shows item count if items in cart
  - Disabled/hidden if cart empty (optional)

**4. Dependency-Based Sections**
Sections that require another feature to be installed:
- Order History → requires Shop AND User Access
- My Bookings → requires Booking System AND User Access
- Post Comments → available only if Blog is installed

### Validation Implementation

```typescript
interface SectionRestriction {
  sectionType: string
  restrictions: {
    singleInstance?: boolean
    allowedPages?: string[] // null = any page
    requiredFeatures?: ScriptFeature[]
    userStateRequired?: 'logged_in' | 'logged_out' | 'any'
  }
}

const sectionRestrictions: SectionRestriction[] = [
  {
    sectionType: 'checkout_form',
    restrictions: {
      singleInstance: true,
      allowedPages: ['checkout.php'],
      requiredFeatures: ['shop']
    }
  },
  {
    sectionType: 'login_form',
    restrictions: {
      singleInstance: false,
      allowedPages: ['login.php', 'account.php'],
      requiredFeatures: ['user_access']
    }
  }
  // ... more restrictions
]

function canAddSection(
  sectionType: string,
  currentPage: string,
  existingSections: Section[],
  installedFeatures: ScriptFeature[]
): { allowed: boolean; reason?: string } {
  const restriction = sectionRestrictions.find(r => r.sectionType === sectionType)
  if (!restriction) return { allowed: true } // No restrictions

  // Check single instance
  if (restriction.restrictions.singleInstance) {
    const alreadyExists = existingSections.some(s => s.type === sectionType)
    if (alreadyExists) {
      return { allowed: false, reason: 'This section can only appear once' }
    }
  }

  // Check allowed pages
  if (restriction.restrictions.allowedPages) {
    if (!restriction.restrictions.allowedPages.includes(currentPage)) {
      return {
        allowed: false,
        reason: `This section can only appear on: ${restriction.restrictions.allowedPages.join(', ')}`
      }
    }
  }

  // Check required features
  if (restriction.restrictions.requiredFeatures) {
    const missingFeatures = restriction.restrictions.requiredFeatures.filter(
      f => !installedFeatures.includes(f)
    )
    if (missingFeatures.length > 0) {
      return {
        allowed: false,
        reason: `Requires: ${missingFeatures.join(', ')}`
      }
    }
  }

  return { allowed: true }
}
```

---

## FEATURE DEPENDENCY GRAPH

```
User Access System (Foundation)
  ├─→ Shop (customer accounts)
  ├─→ Social Platform (user profiles)
  ├─→ Blog (optional: multi-author support)
  ├─→ Booking System (optional: customer accounts)
  ├─→ File Hoster (optional: upload permissions)
  └─→ Video Sharing (optional: uploader accounts)

Shop
  └─→ requires User Access System

Social Platform
  └─→ requires User Access System

Blog
  └─→ optional User Access System

Events
  └─→ optional User Access System (for RSVPs)

Booking System
  └─→ optional User Access System (guest bookings allowed)

Contact Form
  └─→ no dependencies

Image Gallery
  └─→ no dependencies

WordPress Import
  └─→ requires Blog feature

File Hoster
  └─→ optional User Access System

Video Sharing
  └─→ optional File Hoster
  └─→ optional User Access System
```

### Auto-Installation of Dependencies

When user tries to install a feature with dependencies:
1. Check if required features are installed
2. If missing dependencies:
   - **Required dependency:** Show modal: "Shop requires User Access System. Install User Access System first?"
   - **Optional dependency:** Show modal: "Blog works best with User Access System for multi-author support. Install it too?"
3. If user confirms, install dependencies first
4. Then install requested feature

---

## TIER-BASED FEATURE ACCESS

### Trial Tier
**Free - Basic features only**
- ✅ Contact Form (basic)
- ✅ Image Gallery (max 10 images)
- ❌ All other features disabled

### Brochure Tier
**£10/month - Content-focused websites**
- ✅ Contact Form (unlimited)
- ✅ Image Gallery (unlimited)
- ✅ Blog & News
- ✅ Events (basic)
- ❌ User Access, Shop, Booking, etc.

### Niche Tier
**£25/month - Service businesses**
- ✅ All Brochure features
- ✅ User Access System
- ✅ Booking System
- ✅ Events (advanced with RSVPs)
- ✅ File Hoster
- ❌ Shop, Social Platform

### Pro Tier
**£50/month - Full e-commerce and social**
- ✅ **All features unlocked**
- ✅ Shop (e-commerce)
- ✅ Social Platform
- ✅ Video Sharing
- ✅ WordPress Import
- ✅ Priority support

---

## CONFIGURATION MODAL STRUCTURE

### Example: Shop Configuration Modal

**Step 1: Basic Setup**
- Shop Name
- Currency
- Tax Rate (%)
- Shipping Options (flat rate, free, calculated)

**Step 2: Payment Settings**
- Payment Gateway (Stripe, PayPal, both)
- API Keys (Stripe/PayPal credentials)
- Test Mode (on/off)

**Step 3: User Accounts**
- ✓ Require user accounts to purchase (installs User Access if not present)
- ☐ Allow guest checkout

**Step 4: Pages to Create**
- ✓ Shop page (product catalog)
- ✓ Cart page
- ✓ Checkout page
- ✓ My Orders page
- ☐ Add "Shop" to main navigation

**Step 5: Initial Products**
- ☐ Create 3 sample products (for demo)
- ✓ Start with empty catalog

### Example: Blog Configuration Modal

**Step 1: Basic Setup**
- Blog Name
- Posts per page
- Comment system (on/off)

**Step 2: Author Settings**
- ☐ Single author (admin only)
- ✓ Multiple authors (installs User Access if not present)

**Step 3: Categories**
- Default categories to create (comma-separated)
  Example: "News, Updates, Tutorials"

**Step 4: Pages to Create**
- ✓ Blog page (post list)
- ✓ Single post page
- ☐ Add "Blog" to main navigation

**Step 5: Initial Content**
- ✓ Create welcome post
- ☐ Import from WordPress (if WordPress Import is available)

---

## QUESTIONS TO CLARIFY FOR EACH FEATURE

I'll now go through each feature systematically with questions. Please answer YES/NO or provide brief clarification.

---

## READY FOR QUESTIONS

The strategy is now documented. Let's go through each of the 11 script features one by one, and I'll ask targeted questions to clarify the scope and implementation details.

**Shall we start with Feature #1: Contact Form?**
