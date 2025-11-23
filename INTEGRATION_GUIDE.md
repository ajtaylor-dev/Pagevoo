# Script Features Integration Guide

## Quick Start: How to Insert Contact Form Feature

### Step 1: Import the Modals in Template/Website Builder

Add to the imports in `TemplateBuilder.tsx` and `WebsiteBuilder.tsx`:

```typescript
import { DatabaseManagementModal } from '@/components/database/DatabaseManagementModal'
import { FeatureInstallModal } from '@/components/features/FeatureInstallModal'
import { ContactFormConfigModal } from '@/components/script-features/contact-form'
```

### Step 2: Add State Variables

```typescript
// Database & Features
const [showDatabaseModal, setShowDatabaseModal] = useState(false)
const [showFeatureInstallModal, setShowFeatureInstallModal] = useState(false)
const [showContactFormModal, setShowContactFormModal] = useState(false)
```

### Step 3: Update Header Component Props

Add these props to Header component in `Header.tsx`:

```typescript
interface HeaderProps {
  // ... existing props ...

  // Database & Features
  setShowDatabaseModal?: (show: boolean) => void
  setShowFeatureInstallModal?: (show: boolean) => void
}
```

### Step 4: Add "Manage Database" to Edit Menu

In `Header.tsx`, inside the Edit menu dropdown (around line 600), add:

```typescript
{editSubTab === 'settings' && (
  <>
    {/* Existing settings content */}

    {/* Add Database Management button */}
    <div className="border-t border-gray-700 pt-3 mt-3">
      <button
        onClick={() => {
          setShowDatabaseModal?.(true)
          setShowEditMenu(false)
        }}
        className={`w-full text-left px-3 py-2 ${theme.dropdownHover} text-xs rounded border ${theme.inputBorder} ${theme.dropdownText}`}
      >
        📊 Manage Database
      </button>
    </div>
  </>
)}
```

### Step 5: Add "Install Feature" to Insert Menu

In `Header.tsx`, inside the Insert menu dropdown (around line 732), replace the current content with:

```typescript
{showInsertMenu && template && (
  <div className={`absolute top-full left-0 mt-0 ${theme.dropdownBg} border ${theme.dropdownBorder} shadow-lg z-50 w-48`}>
    <div className="py-1">
      <button
        onClick={() => {
          setShowAddPageModal(true)
          setShowInsertMenu(false)
        }}
        className={`w-full text-left px-4 py-2 ${theme.dropdownHover} text-xs ${theme.dropdownText}`}
      >
        📄 New Page
      </button>

      {/* Add Feature Installation */}
      <button
        onClick={() => {
          setShowFeatureInstallModal?.(true)
          setShowInsertMenu(false)
        }}
        className={`w-full text-left px-4 py-2 ${theme.dropdownHover} text-xs ${theme.dropdownText}`}
      >
        ⚡ Install Feature
      </button>
    </div>
  </div>
)}
```

### Step 6: Add Modal Components at Bottom of Builder

In `TemplateBuilder.tsx` or `WebsiteBuilder.tsx`, add these before the closing tags:

```typescript
{/* Database Management Modal */}
<DatabaseManagementModal
  isOpen={showDatabaseModal}
  onClose={() => setShowDatabaseModal(false)}
  type={builderType} // 'template' or 'website'
  referenceId={template?.id || 0}
/>

{/* Feature Installation Modal */}
<FeatureInstallModal
  isOpen={showFeatureInstallModal}
  onClose={() => setShowFeatureInstallModal(false)}
  onFeatureInstalled={(featureType) => {
    if (featureType === 'contact_form') {
      setShowContactFormModal(true)
    }
  }}
  type={builderType}
  referenceId={template?.id || 0}
/>

{/* Contact Form Config Modal */}
<ContactFormConfigModal
  isOpen={showContactFormModal}
  onClose={() => setShowContactFormModal(false)}
  onSave={(config) => {
    console.log('Contact form configured:', config)
    // TODO: Handle saving contact form config
    setShowContactFormModal(false)
  }}
/>
```

## Usage Flow

1. **User opens Template/Website Builder**
2. **Edit > Manage Database** → Opens DatabaseManagementModal
   - If no database: Shows "Create Database" button
   - If database exists: Shows database info, features, backup options
3. **Insert > Install Feature** → Opens FeatureInstallModal
   - Shows all 11 features in a visual grid
   - Contact Form is available (green checkmark if installed)
   - Click Contact Form to install
   - Automatically opens ContactFormConfigModal after installation
4. **Configure Contact Form** in ContactFormConfigModal
   - Choose form type (General, Support, Mass Mailer)
   - Set recipient email
   - Configure spam protection
   - Set storage options
   - Save configuration

## Database Flow for Templates

When admin creates a template with Contact Form:
1. Edit > Manage Database > Create Database
2. Database created: `pagevoo_template_{template_id}`
3. Insert > Install Feature > Contact Form
4. Contact form tables created in template database
5. Configure contact form
6. Template saved

When user initializes from template:
1. User clicks "Use This Template"
2. Template database automatically copied to `pagevoo_website_{user_id}`
3. All contact forms and configuration copied
4. User can now use the contact form immediately

## Files to Modify

1. `pagevoo-frontend/src/pages/TemplateBuilder.tsx`
2. `pagevoo-frontend/src/pages/WebsiteBuilder.tsx`
3. `pagevoo-frontend/src/components/layout/Header.tsx`

## Testing Checklist

- [ ] Edit > Manage Database opens modal
- [ ] Can create template database
- [ ] Can create website database
- [ ] Insert > Install Feature opens modal
- [ ] Can install Contact Form feature
- [ ] Contact Form config modal opens after installation
- [ ] Can configure form (type, email, spam protection, etc.)
- [ ] Template with database copies to user website on initialization
- [ ] Installed features tracked correctly

## Next Steps

After integration:
1. Test complete workflow in Template Builder
2. Test complete workflow in Website Builder
3. Add actual Contact Form section to canvas when configured
4. Wire up form submission endpoint
5. Build submission viewer interface
6. Move on to Feature #2: Image Gallery
