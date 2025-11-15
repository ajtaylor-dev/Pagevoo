# Pagevoo System Architecture & Workflow

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAGEVOO PLATFORM                                   │
│                                                                              │
│  ┌────────────────────┐                           ┌────────────────────┐   │
│  │   PUBLIC PAGES     │                           │  AUTHENTICATED     │   │
│  │   (Laravel SEO)    │                           │    USERS (React)   │   │
│  │                    │                           │                    │   │
│  │  - Homepage        │                           │  - Login/Register  │   │
│  │  - Solutions       │                           │  - User Dashboard  │   │
│  │  - Pricing         │                           │  - Website Builder │   │
│  │  - Support         │                           │                    │   │
│  │                    │                           │                    │   │
│  │  [Account Box]     │  ──── Login ────>        │                    │   │
│  └────────────────────┘                           └────────────────────┘   │
│                                                                              │
│  ┌────────────────────┐                                                     │
│  │   ADMIN PANEL      │                                                     │
│  │   (React)          │                                                     │
│  │                    │                                                     │
│  │  - Admin Dashboard │                                                     │
│  │  - User Management │                                                     │
│  │  - Template Builder│  ←── CREATES TEMPLATES ──┐                         │
│  │  - Permission Mgmt │                           │                         │
│  │  - Template Manager│                           │                         │
│  └────────────────────┘                           │                         │
│                                                     │                         │
└─────────────────────────────────────────────────────┼─────────────────────┘
                                                      │
                                                      ▼
                                    TEMPLATES ARE USED BY USER WEBSITES
```

---

## Data Model Hierarchy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATABASE STRUCTURE                                │
└──────────────────────────────────────────────────────────────────────────┘

ADMIN CREATES:                          USERS CREATE:
┌─────────────────┐                     ┌─────────────────┐
│    TEMPLATES    │                     │  USER_WEBSITES  │
│   (templates)   │ ──── Used By ────>  │ (user_websites) │
├─────────────────┤                     ├─────────────────┤
│ id              │                     │ id              │
│ name            │                     │ name            │
│ template_slug   │                     │ user_id         │
│ preview_image   │                     │ template_id ────┘ (optional reference)
│ description     │                     │ is_published    │
│ business_type   │                     │ published_at    │
│ tier_category   │                     │ preview_hash    │
│ custom_css      │                     │ custom_css      │
│ is_published    │                     │ default_title   │
└────────┬────────┘                     └────────┬────────┘
         │                                       │
         │ has many                              │ has many
         ▼                                       ▼
┌─────────────────┐                     ┌─────────────────┐
│ TEMPLATE_PAGES  │                     │   USER_PAGES    │
│(template_pages) │                     │  (user_pages)   │
├─────────────────┤                     ├─────────────────┤
│ id              │                     │ id              │
│ template_id     │                     │ user_website_id │
│ name            │                     │ name            │
│ slug            │                     │ slug            │
│ page_css        │                     │ page_css        │
│ order           │                     │ order           │
└────────┬────────┘                     └────────┬────────┘
         │                                       │
         │ has many                              │ has many
         ▼                                       ▼
┌─────────────────┐                     ┌─────────────────┐
│TEMPLATE_SECTIONS│                     │  USER_SECTIONS  │
│(template_sects) │                     │  (user_sects)   │
├─────────────────┤                     ├─────────────────┤
│ id              │                     │ id              │
│ template_page_id│                     │ user_page_id    │
│ section_id      │                     │ section_id      │
│ section_type    │                     │ section_type    │
│ content (JSON)  │                     │ content (JSON)  │
│ custom_css      │                     │ custom_css      │
│ order           │                     │ order           │
└─────────────────┘                     └─────────────────┘
```

---

## Template Builder vs Website Builder

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TEMPLATE BUILDER (Admin)                            │
└─────────────────────────────────────────────────────────────────────────┘

PURPOSE:           Create reusable website templates
WHO USES IT:       Admins only
THEME:             Light theme (white/gray backgrounds)
FILE:              src/pages/TemplateBuilder.tsx (976 lines)

DATA MODEL:        Template → TemplatePage → TemplateSection

FEATURES:
├─ Create/Edit templates that users can select
├─ Export sections to Section Library (can mark as "Pagevoo Official")
├─ Export pages to Page Library (can mark as "Pagevoo Official")
├─ Set template tier (Trial, Brochure, Niche, Pro)
├─ Set business type (Restaurant, Barber, Cafe, etc.)
├─ Preview and publish templates for user selection
├─ Live preview URL: pagevoo.local/preview/{template_slug}/{page}.html
└─ File > New: Creates new blank template

WORKFLOW:
1. Admin creates template in Template Builder
2. Admin designs pages and sections
3. Admin optionally exports sections/pages to libraries
4. Admin sets tier category and business type
5. Admin publishes template
6. Template appears in user's template selection gallery


┌─────────────────────────────────────────────────────────────────────────┐
│                      WEBSITE BUILDER (Users)                             │
└─────────────────────────────────────────────────────────────────────────┘

PURPOSE:           Build and edit their actual website
WHO USES IT:       Regular users (tier-based permissions)
THEME:             Dark theme (gray-800/gray-900 backgrounds)
FILE:              src/pages/WebsiteBuilder.tsx (1,550 lines)

DATA MODEL:        UserWebsite → UserPage → UserSection

FEATURES:
├─ Select from published templates OR create blank website
├─ Import sections from Section Library (own + Pagevoo Official)
├─ Export own sections to library (cannot mark as Pagevoo Official)
├─ Multiple saves (unlimited websites, only 1 published at a time)
├─ Edit default site title and meta description
├─ Publish website to go live
├─ Live preview URL: pagevoo.local/user-previews/{preview_hash}/{page}.html
└─ File > New: Returns to welcome screen (doesn't delete website)

WORKFLOW:
1. User opens Website Builder → sees welcome screen
2. User chooses: Load Save | Create New | Select Template
3. If template selected → copies Template data to UserWebsite
4. User edits their website with full builder capabilities
5. User saves (creates/updates UserWebsite record)
6. User can create multiple saved websites
7. User publishes ONE website at a time (auto-unpublishes others)
8. Published website becomes live at their domain
```

---

## Template → User Website Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│              HOW TEMPLATES BECOME USER WEBSITES                           │
└──────────────────────────────────────────────────────────────────────────┘

STEP 1: ADMIN CREATES TEMPLATE
┌─────────────────┐
│  Template #5    │
│  "Restaurant"   │
│  - Home Page    │
│  - Menu Page    │
│  - Contact Page │
└────────┬────────┘
         │
         │ Admin publishes
         ▼
┌─────────────────┐
│ Published       │
│ Template        │
│ tier: "brochure"│
│ business: "rest"│
└────────┬────────┘
         │
         │ User can now see it
         ▼


STEP 2: USER SELECTS TEMPLATE

User clicks "Select Template" in Website Builder
         │
         ▼
┌──────────────────────────────────────┐
│  Welcome Screen Shows:               │
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │Template│  │Template│  │Template││
│  │   #3   │  │   #5   │  │   #7   ││  ← User sees filtered
│  │ Cafe   │  │ Rest.  │  │ Barber ││     templates based on
│  └────────┘  └────────┘  └────────┘│     their tier permissions
│                                      │
└──────────────────────────────────────┘
         │
         │ User clicks "Select Template" on Template #5
         ▼


STEP 3: INITIALIZATION (Backend Copies Data)

POST /api/v1/user-website/initialize
Body: { template_id: 5 }
         │
         ▼
┌──────────────────────────────────────┐
│  UserWebsiteController               │
│  @initializeFromTemplate()           │
│                                      │
│  1. Find Template #5                │
│  2. Create UserWebsite record       │
│  3. Copy all TemplatePage records   │
│     to UserPage records              │
│  4. Copy all TemplateSection records│
│     to UserSection records           │
│  5. Copy custom_css from template   │
│  6. Return full UserWebsite data    │
└──────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  UserWebsite #1 │  ← NEW RECORD
│  user_id: 42    │
│  template_id: 5 │  (reference to original)
│  name: "My Site"│
│  - Home Page    │  (copied structure)
│  - Menu Page    │  (copied structure)
│  - Contact Page │  (copied structure)
└────────┬────────┘
         │
         │ From this point forward, Template and UserWebsite are independent
         ▼


STEP 4: USER EDITS (Changes Only Affect UserWebsite)

User edits text, images, colors, etc.
         │
         ▼
POST /api/v1/user-website/{id}/save
         │
         ▼
┌─────────────────┐
│  UserWebsite #1 │  ← UPDATED
│  custom_css: "…"│
│  - Home Page    │
│    - Hero (EDITED CONTENT)
│    - About (EDITED CONTENT)
│  - Menu Page    │
│    - Menu Grid (ADDED SECTION)
└────────┬────────┘
         │
         │ Template #5 remains unchanged!
         ▼

Template #5 is still in its original state.
Other users can still initialize from Template #5.
Admin can still edit Template #5 without affecting existing user websites.
```

---

## Section/Page Library System

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SECTION & PAGE LIBRARIES                               │
└──────────────────────────────────────────────────────────────────────────┘

PURPOSE: Reusable components that can be imported into any template/website

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│      SECTION LIBRARY            │   │        PAGE LIBRARY             │
│   (section_library table)       │   │    (page_library table)         │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ id                              │   │ id                              │
│ user_id (who created it)        │   │ user_id (who created it)        │
│ name                            │   │ name                            │
│ section_type                    │   │ page_css                        │
│ content (JSON)                  │   │ sections (JSON array)           │
│ preview_image                   │   │ preview_image                   │
│ is_pagevoo_official (boolean)   │   │ is_pagevoo_official (boolean)   │
│ is_public (boolean)             │   │ is_public (boolean)             │
│ tags (JSON array)               │   │ tags (JSON array)               │
└─────────────────────────────────┘   └─────────────────────────────────┘
         │                                       │
         │                                       │
         └───────────┬───────────────────────────┘
                     │
                     ▼

┌──────────────────────────────────────────────────────────────────────────┐
│                          IMPORT WORKFLOW                                  │
└──────────────────────────────────────────────────────────────────────────┘

TEMPLATE BUILDER (Admin):
1. Export Section → Can mark as "Pagevoo Official" ✓
2. Export Page → Can mark as "Pagevoo Official" ✓
3. Import from library → Sections go to LEFT SIDEBAR first
4. Drag from sidebar → Section added to canvas
5. Can see: Own sections + All Pagevoo Official sections

WEBSITE BUILDER (User):
1. Export Section → Cannot mark as "Pagevoo Official" ✗
2. Export Page → Cannot mark as "Pagevoo Official" ✗
3. Import from library → Sections go to LEFT SIDEBAR first
4. Drag from sidebar → Section added to canvas
5. Can see: Own sections + All Pagevoo Official sections


VISUAL BADGES:
┌────────────────────────────────┐
│  Hero Section                  │
│  ┌──────────────────┐          │
│  │     PAGEVOO      │  ← Purple badge (Pagevoo Official)
│  └──────────────────┘          │
│  A beautiful hero section...   │
└────────────────────────────────┘

┌────────────────────────────────┐
│  Imported Sections             │  ← Blue category in Left Sidebar
│  ┌────────┐  ┌────────┐        │
│  │ Hero   │  │Pricing │  X     │  ← Can be removed
│  └────────┘  └────────┘        │
│  Drag to canvas to add →       │
└────────────────────────────────┘
```

---

## Permission System

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        TIER-BASED PERMISSIONS                             │
└──────────────────────────────────────────────────────────────────────────┘

Database Table: tier_permissions
Columns: id, tier (enum), permissions (JSON), timestamps

┌──────────────┬──────────────┬──────────────┬──────────────┐
│    TRIAL     │   BROCHURE   │     NICHE    │      PRO     │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Basic edit   │ Full editing │ Full editing │ Full editing │
│ 1 page max   │ 5 pages max  │ 20 pages max │ Unlimited    │
│ No publish   │ Can publish  │ Can publish  │ Can publish  │
│ No export    │ Can export   │ Can export   │ Can export   │
│ No custom CSS│ Site CSS     │ All CSS      │ All CSS      │
│              │              │ + Analytics  │ + Custom code│
│              │              │ + Forms      │ + Advanced   │
└──────────────┴──────────────┴──────────────┴──────────────┘

FRONTEND HOOKS:
const { can, tier, getLimit } = usePermissions()

if (can('publish_website')) {
  // Show publish button
}

TEMPLATE ACCESS:
Trial users → See only Trial templates
Brochure users → See only Brochure templates
Niche users → See Brochure + Niche templates
Pro users → See Brochure + Niche + Pro templates

CONTROLLED IN:
Backend: TemplateController filters by user's tier permissions
Frontend: LockedFeature component wraps restricted features
Admin Panel: PermissionManager allows editing all permissions
```

---

## Multiple Saves System

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       MULTIPLE WEBSITES PER USER                          │
└──────────────────────────────────────────────────────────────────────────┘

CONCEPT: Users can create unlimited saved websites, but only publish one

┌─────────────────────────────────────────────────────────────────────────┐
│  User #42                                                                │
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │
│  │ UserWebsite 1 │  │ UserWebsite 2 │  │ UserWebsite 3 │              │
│  │ "My Cafe"     │  │ "My Blog"     │  │ "Test Site"   │              │
│  │ [PUBLISHED]   │  │ Unpublished   │  │ Unpublished   │  ← Only ONE  │
│  │ ✓ Live        │  │ Draft         │  │ Draft         │     published│
│  └───────────────┘  └───────────────┘  └───────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

WORKFLOW:

1. User creates "My Cafe" → Saves and publishes
   Status: Published ✓

2. User clicks File > New → Welcome screen (doesn't delete "My Cafe")
   User creates "My Blog" → Saves (doesn't publish yet)
   Status: "My Cafe" still published, "My Blog" is draft

3. User clicks File > New → Welcome screen
   User creates "Test Site" → Saves (doesn't publish)
   Status: "My Cafe" still published, others are drafts

4. User clicks "Load Save" → Sees all 3 websites in modal
   User loads "My Blog" → Edits it → Clicks "Publish"
   Backend AUTO-UNPUBLISHES "My Cafe"
   Status: "My Blog" now published, others unpublished

BENEFITS:
- Experiment without affecting live site
- A/B test different designs
- Maintain multiple projects
- Only one site live at a time (prevents confusion)
```

---

## Full User Journey

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE USER FLOW                                │
└──────────────────────────────────────────────────────────────────────────┘

1. DISCOVERY & SIGNUP
   User visits pagevoo.local (Laravel marketing pages)
   → Clicks "Get Started" in hero
   → Creates account
   → Assigned tier (Trial, Brochure, Niche, or Pro)

2. DASHBOARD
   User logs in → Redirected to /my-dashboard (React)
   → Sees quick actions: "Build Website", "View Analytics", etc.

3. WEBSITE BUILDER - FIRST TIME
   User clicks "Build Website" → /website-builder
   → Sees welcome screen with 3 options:

      ┌─────────────────────────────────────────────────┐
      │  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
      │  │Load Save│  │Create   │  │ Select  │        │
      │  │         │  │  New    │  │Template │        │
      │  └─────────┘  └─────────┘  └─────────┘        │
      │  (empty)      (blank site)  (from gallery)    │
      └─────────────────────────────────────────────────┘

4. TEMPLATE SELECTION
   User clicks "Select Template"
   → Sees filtered templates based on their tier
   → Clicks a template (e.g., "Modern Restaurant")
   → Backend initializes UserWebsite from Template
   → Builder loads with full editing interface

5. EDITING
   User edits:
   - Text content (click to edit with WYSIWYG)
   - Images (upload or select from gallery)
   - Colors (color pickers)
   - Layout (drag-and-drop sections)
   - Spacing/padding (visual controls)
   - CSS (if tier allows)

6. IMPORTING SECTIONS
   User clicks View > Section Library
   → Sees own sections + Pagevoo Official sections
   → Clicks "Import to Sidebar"
   → Section appears in left sidebar "Imported Sections"
   → User drags section to canvas
   → Section added to page

7. SAVING
   User clicks File > Save (or Ctrl+S)
   → UserWebsite record updated in database
   → Preview files generated
   → Can click "Live Preview" to see result

8. PUBLISHING
   User clicks "Publish" button (if tier allows)
   → Backend publishes this website
   → Backend auto-unpublishes any other published websites
   → Website goes live at user's domain/subdomain
   → User can view published site

9. MULTIPLE PROJECTS
   User clicks File > New
   → Returns to welcome screen (doesn't delete website!)
   → Can create another website
   → Can switch between websites via "Load Save"

10. COMING BACK
    User returns later
    → Clicks "Build Website" from dashboard
    → Welcome screen shown
    → Clicks "Load Save"
    → Sees list of all saved websites with publish status
    → Loads desired website
    → Continues editing
```

---

## Key Differences Summary

```
┌──────────────────────────────────────────────────────────────────────────┐
│              TEMPLATE BUILDER vs WEBSITE BUILDER COMPARISON               │
└──────────────────────────────────────────────────────────────────────────┘

┌───────────────────┬─────────────────────┬─────────────────────┐
│     ASPECT        │  TEMPLATE BUILDER   │  WEBSITE BUILDER    │
├───────────────────┼─────────────────────┼─────────────────────┤
│ Who Uses          │ Admins only         │ Regular users       │
│ Theme             │ Light               │ Dark                │
│ Purpose           │ Create templates    │ Build actual sites  │
│ Data Model        │ Template → Page     │ UserWebsite → Page  │
│ Multiple Items    │ Can create many     │ Can create many     │
│                   │ templates           │ websites            │
│ Publishing        │ Publishes for user  │ Publishes to live   │
│                   │ selection           │ domain              │
│ Pagevoo Official  │ Can mark sections   │ Cannot mark         │
│ Permissions       │ Full access         │ Tier-based limits   │
│ File > New        │ Creates new template│ Shows welcome screen│
│ Preview URL       │ /preview/{slug}/    │ /user-previews/{id}/│
│ Tier Required     │ Admin role          │ Any paid tier       │
└───────────────────┴─────────────────────┴─────────────────────┘
```

---

## Technology Stack

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           TECH STACK OVERVIEW                             │
└──────────────────────────────────────────────────────────────────────────┘

BACKEND (Laravel 12):
├─ PHP 8.2+
├─ MySQL Database
├─ RESTful API
├─ Blade Templates (for public pages)
├─ Laravel Sanctum (authentication)
└─ Port 8000

FRONTEND (React 19):
├─ TypeScript
├─ Vite 7 (build tool)
├─ Tailwind CSS
├─ DnD Kit (drag and drop)
├─ Custom Hooks (state management)
└─ Port 5173

STATE MANAGEMENT:
├─ NO Redux
├─ NO Zustand
└─ useState + 11 Custom Hooks
    ├─ useCodeHandlers
    ├─ useDragHandlers
    ├─ useFileHandlers
    ├─ useFormattingHandlers
    ├─ useImageGalleryHandlers
    ├─ useImageHandlers
    ├─ usePageHandlers
    ├─ useResizeHandlers
    ├─ useSectionHandlers
    ├─ useTemplateBuilderEffects
    └─ useTextEditor

FILE STRUCTURE:
pagevoo-frontend/src/
├── components/
│   ├── dnd/          (4 files - drag-and-drop)
│   ├── layout/       (4 files - header, editors)
│   ├── modals/       (9 files - all dialogs)
│   ├── properties/   (3 files - property panels)
│   └── sections/     (4 files - section rendering)
├── hooks/            (11 files - custom hooks)
├── pages/            (TemplateBuilder, WebsiteBuilder, Dashboards)
├── services/         (api.ts, libraryApi.ts)
└── utils/            (4 files - helpers, CSS generators)
```

---

## Summary

**TEMPLATE BUILDER** = Admin creates reusable templates
**WEBSITE BUILDER** = Users build their actual websites from templates
**CONNECTION** = Templates are copied/initialized into UserWebsites
**INDEPENDENCE** = After initialization, they are completely separate
**LIBRARIES** = Shared section/page components both can use
**PERMISSIONS** = Control what users can do based on their tier
**MULTIPLE SAVES** = Users can have many websites, publish only one

The system is built for **scalability**, **clean separation of concerns**, and **professional-grade** website building capabilities.
