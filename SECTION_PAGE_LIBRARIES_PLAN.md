# Section and Page Libraries - Implementation Plan

## Overview

Implement a reusable library system for sections and pages, allowing users to:
- Export sections with full styling and content to a library
- Export pages with all sections, CSS, and metadata to a library
- Browse libraries with visual previews
- Import sections/pages from libraries into their templates

## User Flow

### Section Library
1. User hovers over section → sees export button in hover menu
2. Clicks export → modal opens with customization options (name, description, image)
3. Section saved to library with all content, CSS, and settings
4. Access via **View > Section Library**
5. Browse sections with previews, click "Import" to add to current page
6. Imported sections appear under "Imported Sections" category in left sidebar

### Page Library
1. User opens sitemap (View > Sitemap)
2. Each page row shows export icon button
3. Click export → modal opens with customization (name, description, metadata, screenshot)
4. Page saved to library with all sections, page CSS, and site CSS
5. Access via **View > Page Library**
6. Browse pages with previews, click "Import" to add to current template
7. Imported page added directly to pages array (appears in sitemap)

---

## Database Schema

### Table: `section_library`
```sql
CREATE TABLE section_library (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  preview_image VARCHAR(255), -- Path to screenshot/thumbnail
  section_type VARCHAR(100) NOT NULL, -- 'hero-simple', 'navbar', 'grid', etc.
  section_data JSON NOT NULL, -- Full section object with content, CSS, etc.
  tags JSON, -- ['hero', 'banner', 'CTA', etc.]
  is_public BOOLEAN DEFAULT FALSE, -- For future: shared library
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, section_type),
  INDEX idx_public (is_public)
)
```

**section_data JSON structure:**
```json
{
  "type": "hero-simple",
  "content": {
    "columns": [...],
    "content_css": {...},
    "section_css": "padding: 20px;...",
    "rowCSS": "...",
    "columnCSS": {...}
  },
  "section_name": "Hero Section",
  "section_id": "hero-1"
}
```

### Table: `page_library`
```sql
CREATE TABLE page_library (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  preview_image VARCHAR(255), -- Screenshot of full page
  meta_description TEXT,
  meta_keywords VARCHAR(500),
  page_data JSON NOT NULL, -- Full page object
  site_css TEXT, -- Site-wide CSS that was active
  tags JSON, -- ['landing', 'contact', 'about', etc.]
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_public (is_public)
)
```

**page_data JSON structure:**
```json
{
  "name": "Landing Page",
  "slug": "landing",
  "page_css": "body { font-family: Arial; }",
  "meta_description": "Welcome to our landing page",
  "sections": [
    {
      "id": 1,
      "type": "navbar",
      "content": {...},
      "order": 0
    },
    {
      "id": 2,
      "type": "hero-simple",
      "content": {...},
      "order": 1
    }
    // ... more sections
  ]
}
```

---

## API Endpoints

### Section Library

**POST `/api/section-library`** - Create section library entry
- Request Body:
  ```json
  {
    "name": "Modern Hero Section",
    "description": "A hero section with gradient background and CTA",
    "section_type": "hero-simple",
    "section_data": { /* full section object */ },
    "tags": ["hero", "gradient", "cta"],
    "preview_image": "base64_encoded_image" // or file upload
  }
  ```
- Response: `{ id, name, preview_url, created_at }`

**GET `/api/section-library`** - Get all user's section library entries
- Query params: `?type=hero-simple&tags=gradient`
- Response:
  ```json
  {
    "sections": [
      {
        "id": 1,
        "name": "Modern Hero",
        "description": "...",
        "preview_image": "http://...storage/section_library/1.png",
        "section_type": "hero-simple",
        "tags": ["hero", "gradient"],
        "created_at": "2025-01-15..."
      }
    ]
  }
  ```

**GET `/api/section-library/{id}`** - Get single section with full data
- Response:
  ```json
  {
    "id": 1,
    "name": "Modern Hero",
    "section_data": { /* full section object to import */ },
    "preview_image": "http://..."
  }
  ```

**DELETE `/api/section-library/{id}`** - Delete section from library

### Page Library

**POST `/api/page-library`** - Create page library entry
- Request Body:
  ```json
  {
    "name": "Landing Page Template",
    "description": "Full landing page with hero, features, and contact",
    "page_data": { /* full page object with sections */ },
    "site_css": "/* site-wide CSS */",
    "meta_description": "...",
    "meta_keywords": "landing, template",
    "tags": ["landing", "business"],
    "preview_image": "base64_encoded_screenshot"
  }
  ```
- Response: `{ id, name, preview_url, created_at }`

**GET `/api/page-library`** - Get all user's page library entries
- Query params: `?tags=landing`
- Response:
  ```json
  {
    "pages": [
      {
        "id": 1,
        "name": "Landing Page Template",
        "description": "...",
        "preview_image": "http://...storage/page_library/1.png",
        "meta_description": "...",
        "tags": ["landing", "business"],
        "section_count": 8,
        "created_at": "2025-01-15..."
      }
    ]
  }
  ```

**GET `/api/page-library/{id}`** - Get single page with full data
- Response:
  ```json
  {
    "id": 1,
    "name": "Landing Page Template",
    "page_data": { /* full page object to import */ },
    "site_css": "/* CSS to apply */",
    "preview_image": "http://..."
  }
  ```

**DELETE `/api/page-library/{id}`** - Delete page from library

---

## Frontend Components

### 1. Export Section Button (in SectionWrapper hover menu)

**Location**: `src/components/sections/SectionWrapper.tsx` line ~360

**Add button after Lock button:**
```tsx
{/* Export to Library button */}
<button
  onClick={(e) => {
    e.stopPropagation()
    onOpenExportSectionModal(section)
  }}
  className="builder-ui p-1 hover:bg-[#e8f0e6] rounded transition"
  title="Export to Library"
>
  <svg className="builder-ui w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
</button>
```

### 2. Export Section Modal

**New file**: `src/components/modals/ExportSectionModal.tsx`

**Props:**
```tsx
interface ExportSectionModalProps {
  isOpen: boolean
  onClose: () => void
  section: TemplateSection
  onExport: (data: ExportSectionData) => Promise<void>
}

interface ExportSectionData {
  name: string
  description: string
  tags: string[]
  preview_image?: File | null
}
```

**Features:**
- Name input (default: section.section_name or section.type)
- Description textarea
- Tags input (comma-separated or tag chips)
- Preview image upload (or auto-generate from section screenshot)
- "Export to Library" button → calls API → shows success toast

### 3. Section Library Modal

**New file**: `src/components/modals/SectionLibraryModal.tsx`

**Features:**
- Grid layout with section cards
- Each card shows:
  - Preview image (thumbnail)
  - Section name
  - Description (truncated)
  - Tags as chips
  - "Import" button
- Filter by section type dropdown
- Search by name/description
- Tag filter
- Delete button (trash icon) for each section

**Import flow:**
- Click "Import" → fetches full section_data from API
- Creates new section ID
- Adds to current page's sections array
- Shows in "Imported Sections" category (needs new category in LeftSidebar)

### 4. Export Page Button (in Sitemap)

**Location**: `src/components/modals/SitemapModal.tsx` line ~143 (actions)

**Add button after Edit and before Delete:**
```tsx
<button
  onClick={() => handleExportPage(page)}
  className="p-1.5 hover:bg-[#e8f0e6] rounded transition"
  title="Export to Library"
>
  <svg className="w-4 h-4 text-[#98b290]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
</button>
```

### 5. Export Page Modal

**New file**: `src/components/modals/ExportPageModal.tsx`

**Props:**
```tsx
interface ExportPageModalProps {
  isOpen: boolean
  onClose: () => void
  page: TemplatePage
  template: Template // need site CSS
  onExport: (data: ExportPageData) => Promise<void>
}

interface ExportPageData {
  name: string
  description: string
  meta_description: string
  meta_keywords: string
  tags: string[]
  preview_image?: File | null
}
```

**Features:**
- Name input (default: page.name)
- Description textarea
- Meta description input
- Meta keywords input
- Tags input
- Preview image upload/screenshot capture
- Shows section count badge
- "Export to Library" button

### 6. Page Library Modal

**New file**: `src/components/modals/PageLibraryModal.tsx`

**Features:**
- Grid layout with page cards (larger than section cards)
- Each card shows:
  - Preview image (page screenshot)
  - Page name
  - Description
  - Tags
  - Section count badge
  - "Import" button
  - Delete button
- Search and filter functionality

**Import flow:**
- Click "Import" → fetches full page_data and site_css
- Creates new page with unique IDs for page and all sections
- Optionally prompts: "Apply site CSS?" (if site_css exists)
- Adds to template.pages array
- Switches to imported page

### 7. View Menu Updates

**Location**: `src/components/layout/Header.tsx` line ~516

**Add after Sitemap:**
```tsx
<button
  onClick={() => {
    setShowSectionLibraryModal(true)
    setShowViewMenu(false)
  }}
  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
>
  Section Library
</button>
<button
  onClick={() => {
    setShowPageLibraryModal(true)
    setShowViewMenu(false)
  }}
  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs"
>
  Page Library
</button>
```

### 8. Left Sidebar Update

**Location**: `src/components/LeftSidebar.tsx`

**Add new category:**
```tsx
const categories = [
  { name: 'Hero', sections: [...] },
  { name: 'Features', sections: [...] },
  // ... existing categories
  {
    name: 'Imported Sections',
    sections: importedSections // from new state
  }
]
```

**State management:**
- Add `importedSections` state in TemplateBuilder
- Load from section library on mount
- Display with special icon/badge

---

## State Management

### New State in TemplateBuilder.tsx

```tsx
// Section Library
const [showSectionLibraryModal, setShowSectionLibraryModal] = useState(false)
const [showExportSectionModal, setShowExportSectionModal] = useState(false)
const [exportingSect, setExportingSection] = useState<TemplateSection | null>(null)
const [sectionLibrary, setSectionLibrary] = useState<SectionLibraryItem[]>([])

// Page Library
const [showPageLibraryModal, setShowPageLibraryModal] = useState(false)
const [showExportPageModal, setShowExportPageModal] = useState(false)
const [exportingPage, setExportingPage] = useState<TemplatePage | null>(null)
const [pageLibrary, setPageLibrary] = useState<PageLibraryItem[]>([])
```

### API Functions

**New file**: `src/api/libraryApi.ts`

```tsx
export const libraryApi = {
  // Section Library
  exportSection: async (data: ExportSectionData) => {...},
  getSectionLibrary: async (filters?: { type?: string, tags?: string[] }) => {...},
  getSectionById: async (id: number) => {...},
  deleteSection: async (id: number) => {...},

  // Page Library
  exportPage: async (data: ExportPageData) => {...},
  getPageLibrary: async (filters?: { tags?: string[] }) => {...},
  getPageById: async (id: number) => {...},
  deletePage: async (id: number) => {...}
}
```

---

## Preview Image Generation

### Option 1: Manual Upload
- User uploads image file
- Resized to standard dimensions (e.g., 800x600)
- Stored in `storage/app/public/section_library/` or `page_library/`

### Option 2: Auto-Screenshot (Advanced)
- Use `html2canvas` library
- Capture section/page DOM element
- Convert to image blob
- Upload to server

**Implementation (frontend):**
```tsx
import html2canvas from 'html2canvas'

const captureScreenshot = async (elementId: string): Promise<Blob> => {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Element not found')

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher quality
    logging: false
  })

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
    }, 'image/png')
  })
}
```

---

## Implementation Steps

### Phase 1: Backend (Database + API)
1. Create migration for `section_library` table
2. Create migration for `page_library` table
3. Create `SectionLibrary` model (Laravel)
4. Create `PageLibrary` model (Laravel)
5. Create `SectionLibraryController` with CRUD endpoints
6. Create `PageLibraryController` with CRUD endpoints
7. Add routes in `api.php`
8. Test endpoints with Postman

### Phase 2: Frontend - Section Library
1. Create `ExportSectionModal.tsx` component
2. Add export button to `SectionWrapper.tsx`
3. Create `libraryApi.ts` with API functions
4. Wire up export functionality
5. Create `SectionLibraryModal.tsx` component
6. Add "Section Library" to View menu
7. Implement import functionality
8. Add "Imported Sections" category to LeftSidebar
9. Test export and import flow

### Phase 3: Frontend - Page Library
1. Create `ExportPageModal.tsx` component
2. Add export button to `SitemapModal.tsx`
3. Wire up export functionality
4. Create `PageLibraryModal.tsx` component
5. Add "Page Library" to View menu
6. Implement import functionality
7. Handle site CSS application prompt
8. Test export and import flow

### Phase 4: Polish
1. Add loading states
2. Add success/error toasts
3. Add confirmation dialogs
4. Implement search and filters
5. Add preview image auto-capture
6. Optimize performance
7. Add analytics/tracking

---

## Data Flow Diagrams

### Export Section Flow
```
User hovers section
  → Clicks export button
  → ExportSectionModal opens
  → User fills form (name, description, tags)
  → Optionally uploads preview image
  → Clicks "Export"
  → POST /api/section-library
  → Server saves to database
  → Returns success
  → Modal closes
  → Toast: "Section exported successfully"
```

### Import Section Flow
```
User opens View > Section Library
  → SectionLibraryModal displays grid
  → GET /api/section-library (loads all)
  → User clicks "Import" on a section
  → GET /api/section-library/{id} (full data)
  → Create new section object with new IDs
  → Add to template.pages[currentPage].sections
  → setTemplate(updatedTemplate)
  → Toast: "Section imported"
  → Modal closes
  → Section appears in canvas
```

### Export Page Flow
```
User opens View > Sitemap
  → Clicks export icon on page row
  → ExportPageModal opens
  → Auto-fills page name, meta
  → User adds description, tags
  → Optionally uploads screenshot
  → Clicks "Export"
  → POST /api/page-library with page_data and site_css
  → Server saves to database
  → Returns success
  → Modal closes
  → Toast: "Page exported successfully"
```

### Import Page Flow
```
User opens View > Page Library
  → PageLibraryModal displays grid
  → GET /api/page-library (loads all)
  → User clicks "Import" on a page
  → GET /api/page-library/{id} (full data)
  → Prompt: "Apply site CSS?" (if exists)
  → Create new page with unique IDs
  → Add to template.pages array
  → setTemplate(updatedTemplate)
  → setCurrentPage(importedPage)
  → Toast: "Page imported"
  → Modal closes
  → Page appears in sitemap
```

---

## Edge Cases & Considerations

### ID Conflicts
- When importing, generate new IDs for:
  - Section ID (`section.id`)
  - Section ID string (`section.section_id`)
  - Page ID (`page.id`)
  - Page ID string (`page.page_id`)

### CSS Conflicts
- Page import: Prompt user about applying site CSS
- Section import: Merge section CSS with page CSS (handled by existing cascade)

### Image Paths
- Section/page content may reference images
- Check if images exist in current template
- Optionally: Copy images to current template's gallery

### Validation
- Ensure section_data and page_data are valid JSON
- Validate required fields (name, type)
- Check file size limits for preview images

### Performance
- Lazy load library items (pagination)
- Thumbnail optimization (resize server-side)
- Cache library data in frontend

---

## Future Enhancements

1. **Public Libraries**
   - Set `is_public = true`
   - Browse community sections/pages
   - Like/rating system

2. **Categories**
   - Add `category` field (Hero, Features, Contact, etc.)
   - Better organization and filtering

3. **Versioning**
   - Track multiple versions of same section/page
   - Revert to previous version

4. **Sharing**
   - Generate shareable links
   - Import from URL

5. **Templates Library**
   - Full template presets (not just pages)
   - Multi-page template import

---

## Testing Checklist

### Section Library
- [ ] Export section with all CSS and content
- [ ] Preview image uploads correctly
- [ ] Section library displays all exported sections
- [ ] Import section adds to current page
- [ ] Imported section maintains all styling
- [ ] Delete section from library
- [ ] Filter by type works
- [ ] Search works
- [ ] Tag filtering works

### Page Library
- [ ] Export page with all sections and CSS
- [ ] Preview image uploads correctly
- [ ] Page library displays all exported pages
- [ ] Import page adds to template
- [ ] Site CSS prompt appears and works
- [ ] Imported page maintains all sections and styling
- [ ] Delete page from library
- [ ] Tag filtering works
- [ ] Search works

### Integration
- [ ] View menu shows both libraries
- [ ] Libraries persist across sessions
- [ ] ID conflicts handled properly
- [ ] CSS cascade works correctly
- [ ] No console errors
- [ ] Loading states show properly
- [ ] Success/error messages display

---

## Timeline Estimate

- **Phase 1 (Backend)**: 1-2 days
- **Phase 2 (Section Library)**: 2-3 days
- **Phase 3 (Page Library)**: 2-3 days
- **Phase 4 (Polish)**: 1-2 days

**Total**: 6-10 days for full implementation

---

## Files to Create

### Backend
- `database/migrations/YYYY_MM_DD_create_section_library_table.php`
- `database/migrations/YYYY_MM_DD_create_page_library_table.php`
- `app/Models/SectionLibrary.php`
- `app/Models/PageLibrary.php`
- `app/Http/Controllers/SectionLibraryController.php`
- `app/Http/Controllers/PageLibraryController.php`

### Frontend
- `src/api/libraryApi.ts`
- `src/components/modals/ExportSectionModal.tsx`
- `src/components/modals/SectionLibraryModal.tsx`
- `src/components/modals/ExportPageModal.tsx`
- `src/components/modals/PageLibraryModal.tsx`
- `src/types/library.ts` (TypeScript interfaces)

### Files to Modify
- `src/components/sections/SectionWrapper.tsx` (add export button)
- `src/components/modals/SitemapModal.tsx` (add export button)
- `src/components/layout/Header.tsx` (add menu items)
- `src/components/LeftSidebar.tsx` (add Imported Sections category)
- `src/pages/TemplateBuilder.tsx` (add state and handlers)

---

**End of Plan**
