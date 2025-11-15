# Pagevoo Folder Structure Guide

## Complete Directory Structure Overview

This document explains how Pagevoo organizes files for templates and user websites, including both preview (unpublished) and published versions.

---

## Root Directory Structure

```
D:\Pagevoo\
├── pagevoo-backend\
│   ├── public\                          # Publicly accessible files
│   │   ├── template_directory\          # TEMPLATES: Preview files
│   │   ├── image_galleries\             # Template image uploads
│   │   └── storage -> ..\storage\app\public (symlink)
│   │
│   └── storage\
│       └── app\
│           └── public\
│               └── websites\            # USER WEBSITES: Preview & Published
│                   ├── preview\         # Unpublished user websites
│                   └── published\       # Published user websites
│
└── pagevoo-frontend\                    # React application (not file storage)
```

---

## Part 1: TEMPLATES (Admin Created)

### Templates Base Location
**Path:** `public/template_directory/`

### Directory Creation Logic

**When:** Admin saves a template in Template Builder
**Service:** `TemplateFileGenerator.php` (line 18)
**Base Path:** `public_path('template_directory')`

### Slug Generation Rules

Templates use `template_slug` to organize their files:

**Published Templates:**
- Uses clean name-based slug: `Str::slug($template->name)`
- Example: "Modern Restaurant" → `modern-restaurant`
- Ensures uniqueness with counter: `modern-restaurant-1`, `modern-restaurant-2`, etc.

**Unpublished Templates (Drafts):**
- Uses random 10-character string
- Example: `a3k2m9p4x1`
- Makes preview URLs non-guessable

### Complete Template Structure

```
public/template_directory/
│
├── {template-slug}/                      # One folder per template
│   ├── index.php                        # Home page (first page)
│   ├── about.php                        # Other pages (by slug)
│   ├── services.php
│   ├── contact.php
│   │
│   └── public/                           # Static assets
│       ├── css/
│       │   └── style.css                 # Site-wide CSS
│       ├── js/
│       │   └── script.js                 # JavaScript
│       └── images/
│           ├── hero-bg.jpg               # Uploaded images
│           ├── logo.png
│           └── gallery-1.jpg
│
├── modern-restaurant/                    # EXAMPLE: Published template
│   ├── index.php
│   ├── menu.php
│   ├── contact.php
│   └── public/
│       ├── css/style.css
│       ├── js/script.js
│       └── images/
│
└── a3k2m9p4x1/                          # EXAMPLE: Unpublished template
    ├── index.php
    ├── about.php
    └── public/
        └── css/style.css
```

### Template File Generation Process

**Trigger:** Admin clicks "Save" in Template Builder

**Flow:**
1. Check if `template_slug` exists, if not generate one
2. Create template directory: `public/template_directory/{slug}/`
3. Create subdirectories: `public/css/`, `public/js/`, `public/images/`
4. Copy images from `public/image_galleries/{template-id}/` to `public/images/`
5. Generate `style.css` from template's custom_css
6. For each page, generate HTML file:
   - First page → `index.php`
   - Other pages → `{page-slug}.php`
7. Generate basic `script.js` with mobile menu handlers

**Code Location:** `TemplateFileGenerator.php` → `generateTemplateFiles()` (line 35)

### Template Preview URLs

**Format:** `http://localhost:8000/template_directory/{template-slug}/index.php`

**Examples:**
- `http://localhost:8000/template_directory/modern-restaurant/index.php`
- `http://localhost:8000/template_directory/modern-restaurant/menu.php`

---

## Part 2: USER WEBSITES (Regular Users)

### User Websites Base Location
**Path:** `storage/app/public/websites/`

**Why storage instead of public?**
- Storage is more secure (symlinked to public/storage)
- Easier to manage permissions
- Can be moved to S3/cloud storage in production

### Two Types of Directories

#### A) Preview Directories (Unpublished)
**Path:** `storage/app/public/websites/preview/{preview-hash}/`

#### B) Published Directories (Published)
**Path:** `storage/app/public/websites/published/{domain}/`

### Preview Hash Generation

**When:** UserWebsite record is created
**Service:** `WebsiteFileService.php` → `generatePreviewHash()` (line 33)
**Algorithm:** 32-character random string via `Str::random(32)`
**Uniqueness:** Checks if directory already exists, regenerates if collision

**Example Hash:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Domain Identifier (Published)

**Priority:**
1. `custom_domain` (if set) - Example: `myrestaurant.com`
2. `subdomain` (if set) - Example: `myrestaurant` → `myrestaurant.pagevoo.com`

**Error:** If neither is set, publishing fails with error message

### Complete User Website Structure

```
storage/app/public/websites/
│
├── preview/                              # UNPUBLISHED VERSIONS
│   │
│   ├── {32-char-hash-1}/                # User Website #1 preview
│   │   ├── index.php                    # Home page
│   │   ├── about.php                    # Other pages
│   │   ├── menu.php
│   │   ├── contact.php
│   │   │
│   │   ├── css/
│   │   │   └── style.css                 # Site-wide CSS
│   │   ├── js/
│   │   │   └── script.js                 # JavaScript
│   │   ├── images/
│   │   │   ├── hero.jpg                  # User uploaded images
│   │   │   └── logo.png
│   │   └── assets/                       # Additional assets
│   │
│   ├── {32-char-hash-2}/                # User Website #2 preview
│   │   └── ...
│   │
│   └── a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6/ # EXAMPLE
│       ├── index.php
│       ├── about.php
│       └── css/style.css
│
│
└── published/                            # PUBLISHED VERSIONS
    │
    ├── {subdomain}/                      # Subdomain-based
    │   ├── index.php
    │   ├── css/style.css
    │   └── images/
    │
    ├── {custom-domain}/                  # Custom domain-based
    │   ├── index.php
    │   └── ...
    │
    ├── joes-pizza/                       # EXAMPLE: Subdomain
    │   ├── index.php                    # → joes-pizza.pagevoo.com
    │   ├── menu.php
    │   └── public/
    │       └── css/style.css
    │
    └── myrestaurant.com/                 # EXAMPLE: Custom domain
        ├── index.php                    # → myrestaurant.com
        ├── about.php
        └── public/
            └── css/style.css
```

### User Website File Generation Process

#### PREVIEW Generation (Save Button)

**Trigger:** User clicks "Save" in Website Builder

**Flow:**
1. Check if `preview_hash` exists on UserWebsite, if not generate one
2. Get preview path: `storage/app/public/websites/preview/{hash}/`
3. Create directory structure:
   - Base directory
   - `css/` subdirectory
   - `js/` subdirectory
   - `images/` subdirectory
   - `assets/` subdirectory
4. Generate HTML files for all pages:
   - First page → `index.php`
   - Other pages → `{page-slug}.php`
5. Generate `css/style.css` from `site_css` field
6. Inline `page_css` into each HTML file's `<style>` tag
7. Copy images to `images/` directory
8. Generate `js/script.js` with basic functionality

**Code Location:** `WebsiteFileService.php` → `generatePreviewFiles()` (line 108)

#### PUBLISHED Generation (Publish Button)

**Trigger:** User clicks "Publish" in Website Builder

**Flow:**
1. Verify user has permission to publish
2. Verify subdomain or custom_domain is configured
3. Auto-unpublish any other published websites for this user
4. Get published path: `storage/app/public/websites/published/{domain}/`
5. Create directory structure (same as preview)
6. Generate all HTML, CSS, JS files (same process as preview)
7. Copy images
8. Update database:
   - `is_published = true`
   - `last_published_at = now()`

**Code Location:** `WebsiteFileService.php` → `generatePublishedFiles()` (line 141)

**Important:** Published files are generated fresh, NOT copied from preview

### Preview vs Published URLs

#### Preview URLs
**Format:** `http://localhost:8000/storage/websites/preview/{hash}/index.php`

**Example:**
```
http://localhost:8000/storage/websites/preview/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6/index.php
http://localhost:8000/storage/websites/preview/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6/about.php
```

**Characteristics:**
- Long, random URLs
- Non-guessable
- Can be shared for review
- Anyone with link can view
- Persists even after publishing

#### Published URLs
**Format:** Depends on domain configuration

**Subdomain Example:**
```
https://joes-pizza.pagevoo.com/index.php
https://joes-pizza.pagevoo.com/menu.php
```

**Custom Domain Example:**
```
https://myrestaurant.com/index.php
https://myrestaurant.com/about.php
```

**Characteristics:**
- Clean, professional URLs
- SEO-friendly
- Configured via website settings
- Only one website can be published at a time per user

---

## Directory Structure Comparison Table

```
┌─────────────────────┬──────────────────────────────┬──────────────────────────────┐
│      ASPECT         │         TEMPLATES            │       USER WEBSITES          │
├─────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Who Creates         │ Admins only                  │ Regular users                │
│ Base Location       │ public/template_directory/   │ storage/app/public/websites/ │
│ Identifier          │ template_slug                │ preview_hash or domain       │
│ Identifier Format   │ slug or random(10)           │ random(32) or domain         │
│ Unpublished Path    │ /{slug}/                     │ /preview/{hash}/             │
│ Published Path      │ /{slug}/ (same)              │ /published/{domain}/         │
│ Multiple Versions   │ No (single directory)        │ Yes (preview + published)    │
│ URL Type            │ Always same slug             │ Hash (preview) or domain     │
│ Public Access       │ All published templates      │ Only published websites      │
│ Preview Access      │ Via template_slug            │ Via random hash              │
│ Can Unpublish       │ Yes (changes slug)           │ Yes (keeps preview)          │
│ Deletion            │ Deletes entire directory     │ Can delete preview/published │
└─────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

## Lifecycle Examples

### Template Lifecycle

**1. Admin Creates Template:**
```
Template created with name "Modern Cafe"
- template_slug: random(10) → "x3k9m2p1a5"
- Directory: public/template_directory/x3k9m2p1a5/
- Preview URL: /template_directory/x3k9m2p1a5/index.php
```

**2. Admin Publishes Template:**
```
Template published (is_active = true)
- template_slug regenerated → "modern-cafe"
- Old directory deleted: x3k9m2p1a5/
- New directory created: modern-cafe/
- Files regenerated in new location
- Preview URL: /template_directory/modern-cafe/index.php
```

**3. User Selects Template:**
```
User initializes from template "Modern Cafe"
- Creates UserWebsite record
- Copies all pages and sections to user tables
- No file generation yet (happens on save)
```

### User Website Lifecycle

**1. User Selects Template:**
```
POST /api/v1/user-website/initialize {template_id: 5}
- Creates UserWebsite record
- Generates preview_hash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
- Copies Template data to UserWebsite/UserPage/UserSection tables
- NO FILES CREATED YET
```

**2. User Makes Edits:**
```
User adds sections, edits text, uploads images
- Changes stored in database only
- No file generation
```

**3. User Saves (File > Save):**
```
POST /api/v1/user-website/25/save
- Creates directory: storage/app/public/websites/preview/{hash}/
- Generates HTML files from database data
- Generates CSS files
- Copies images
- Preview URL available: /storage/websites/preview/{hash}/index.php
```

**4. User Configures Domain:**
```
User sets subdomain: "joes-pizza"
- Updates UserWebsite.subdomain = "joes-pizza"
- No files generated yet
```

**5. User Publishes:**
```
POST /api/v1/user-website/25/publish
- Auto-unpublishes any other websites for this user
- Creates directory: storage/app/public/websites/published/joes-pizza/
- Generates fresh HTML/CSS/JS files
- Copies images
- Updates is_published = true
- Published URL: https://joes-pizza.pagevoo.com/
```

**6. User Makes More Edits:**
```
User edits content in Website Builder
- Changes stored in database
- Save updates PREVIEW directory only
- PUBLISHED directory unchanged until re-publish
```

**7. User Re-publishes:**
```
POST /api/v1/user-website/25/publish
- Deletes old published directory
- Generates fresh files with latest changes
- Published site now shows new content
```

**8. User Unpublishes:**
```
POST /api/v1/user-website/25/unpublish
- Deletes published directory: /published/joes-pizza/
- Updates is_published = false
- PREVIEW still exists and accessible
```

**9. User Creates Second Website:**
```
User clicks File > New, selects different template
- Creates second UserWebsite record
- Gets new preview_hash: "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4"
- New preview directory created
- First website still exists with its own preview/published
```

**10. User Deletes Website:**
```
DELETE /api/v1/user-website/25
- Deletes preview directory (if exists)
- Deletes published directory (if exists)
- Deletes database records (cascades to pages/sections)
```

---

## File Generation Details

### HTML Page Structure

Every generated HTML file follows this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{Page Name}</title>
    <link rel="stylesheet" href="/css/style.css">

    <!-- Page-specific CSS (inline) -->
    <style>
        {page_css content}
    </style>
</head>
<body>
    <!-- Section 1 -->
    <section id="{section_id}" class="section-{type}">
        <!-- Section content -->
    </section>

    <!-- Section 2 -->
    <section id="{section_id}" class="section-{type}">
        <!-- Section content -->
    </section>

    <script src="/js/script.js"></script>
</body>
</html>
```

### CSS File (style.css)

Generated from:
- **Templates:** `templates.custom_css` field
- **User Websites:** `user_websites.site_css` field

Location: `css/style.css`

### JavaScript File (script.js)

Basic boilerplate for:
- Mobile menu toggles
- Dropdown navigation
- Dynamic functionality

Location: `js/script.js`

### Images

Copied from:
- **Templates:** `public/image_galleries/{template-id}/` → `{template-dir}/public/images/`
- **User Websites:** User upload location → `{website-dir}/images/`

---

## Storage Calculations

### How Storage is Calculated

**Service:** `WebsiteFileService.php` → `getStorageUsage()` (line 458)

**For Each User Website:**
1. Calculate preview directory size (if exists)
2. Calculate published directory size (if exists)
3. Return totals in MB

**Example Response:**
```json
{
  "preview_mb": 2.45,
  "published_mb": 2.45,
  "total_mb": 4.90
}
```

**Note:** Preview and published are separate, so storage is approximately 2x when published

---

## Cleanup & Deletion

### Automatic Cleanup

**When UserWebsite is deleted:**
```php
// In UserWebsite model (line 159-163)
static::deleting(function ($website) {
    $fileService->deletePreviewDirectory($website);
    $fileService->deletePublishedDirectory($website);
});
```

**Process:**
1. Deletes preview directory (if exists)
2. Deletes published directory (if exists)
3. Cascades delete to UserPage and UserSection records

### Manual Cleanup

**Unpublish Website:**
- Deletes published directory only
- Keeps preview directory
- Sets `is_published = false`

---

## Production Considerations

### Current Setup (Development)
- Local file storage
- Public/storage symlink
- Direct file serving

### Production Recommendations

**1. Move to Cloud Storage (S3)**
```php
// Change basePath in WebsiteFileService
$this->basePath = Storage::disk('s3')->path('websites');
```

**2. CDN Integration**
- Serve static files through CloudFront/CloudFlare
- Faster global delivery
- Reduced server load

**3. Preview Hash Security**
- Already implemented with 32-char random strings
- Non-guessable URLs
- Consider adding expiration dates

**4. Storage Limits**
- Implement per-tier storage quotas
- Alert users approaching limits
- Auto-delete old preview versions

**5. Backup Strategy**
- Regular backups of storage/app/public/websites/
- Keep published versions backed up
- Consider versioning

---

## Common Operations

### Check if Preview Exists
```php
$hash = $website->preview_hash;
$path = storage_path("app/public/websites/preview/{$hash}");
$exists = File::exists($path);
```

### Get Preview URL
```php
$url = $website->getPreviewUrl();
// Returns: http://localhost:8000/storage/websites/preview/{hash}/index.php
```

### Get Published URL
```php
$url = $website->getPublishedUrl();
// Returns: https://joes-pizza.pagevoo.com (or custom domain)
```

### Force Regenerate Preview
```php
$fileService = app(WebsiteFileService::class);
$fileService->generatePreviewFiles($website, $websiteData);
```

### Copy Preview to Published
```php
$fileService = app(WebsiteFileService::class);
$fileService->copyPreviewToPublished($website);
```

---

## Summary

**TEMPLATES:**
- Live in `public/template_directory/{slug}/`
- Single directory per template (no separate preview/published)
- Identified by `template_slug` (name-based or random)
- Created/regenerated on every save

**USER WEBSITES:**
- Live in `storage/app/public/websites/`
- Two directories: `preview/{hash}/` and `published/{domain}/`
- Preview uses random 32-char hash (secure, non-guessable)
- Published uses subdomain or custom domain
- Preview persists after publishing
- Only one published website per user at a time

**FILE GENERATION:**
- Happens on Save (preview) and Publish (published)
- Complete HTML/CSS/JS files generated from database
- Images copied from uploads
- Independent regeneration (not copied from preview to published)

**LIFECYCLE:**
- Create → Save (preview) → Configure domain → Publish → Unpublish → Delete
- Multiple saves can exist per user
- Auto-cleanup on deletion
