# HEADER COMPONENT QUICK REFERENCE
TemplateBuilder.tsx Lines 4472-5059 (587 lines)

## MENU VISIBILITY STATES (4)
- showFileMenu: boolean
- showEditMenu: boolean  
- showInsertMenu: boolean
- showViewMenu: boolean

## EDIT MENU TAB STATE (1)
- editSubTab: 'settings' | 'css' | 'page'

## MODAL/PANEL STATES (7)
- showAddPageModal: boolean
- showEditPageModal: boolean
- showSourceCodeModal: boolean
- showStylesheetModal: boolean
- showSitemapModal: boolean
- showImageGallery: boolean
- uploadingImage: boolean

## UNDO/REDO STATES (2)
- canUndo: boolean
- canRedo: boolean

## CHANGE TRACKING (1)
- hasUnsavedChanges: boolean

## DATA STATES (2)
- template: Template
- currentPage: TemplatePage | null

## FORM INPUT STATES (4)
- newPageName: string
- editPageName: string
- editPageSlug: string
- editPageMetaDescription: string

## REFS (6)
- fileMenuRef: React.RefObject<HTMLDivElement>
- editMenuRef: React.RefObject<HTMLDivElement>
- insertMenuRef: React.RefObject<HTMLDivElement>
- viewMenuRef: React.RefObject<HTMLDivElement>
- templateRef: React.RefObject<Template | null>
- imageGalleryRef: React.RefObject<boolean>

## FILE MENU HANDLERS (6)
- handleNew(): void
- handleSave(): Promise<void>
- handleSaveAs(): Promise<void>
- handleLoad(): Promise<void>
- handleExportAsHTMLTemplate(): Promise<void>
- handleExit(): void

## EDIT MENU HANDLERS (6)
- handleUndo(): void
- handleRedo(): void
- handleOpenEditPageModal(): void
- handleSaveEditPage(): void
- handleCopyPage(): void
- handleDeletePage(pageId: number): void

## OTHER HANDLERS (3)
- handleImageUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void>
- handleLivePreview(): void
- addToHistory(newTemplate: Template, markAsUnsaved?: boolean): void

## TEMPLATE PROPERTIES ACCESSED
- template.name: string (center input, editable)
- template.description: string (settings textarea)
- template.business_type: string (select: restaurant, barber, pizza, cafe, gym, salon, other)
- template.exclusive_to: 'pro' | 'niche' | null
- template.technologies: string[] (html5 or react)
- template.features: string[] (shopping-cart, booking, blog, marketplace, forum, contact-form)
- template.custom_css: string (CSS tab editor)
- template.preview_image: string | null (settings image)
- template.pages: TemplatePage[] (length checked at line 4689)

## CURRENTPAGE PROPERTIES
- currentPage.name: string
- currentPage.id: number
- currentPage.slug: string
- currentPage.meta_description: string
- currentPage.sections: TemplateSection[]

## OTHER DEPENDENCIES
- user: {name: string} | null | undefined (from useAuth())
- StyleEditor: Component (for CSS tab)

## KEY FEATURES

1. File Menu: New, Save, Save As, Load, Export As (HTML/ZIP/React), Exit
2. Edit Menu: 3 tabs
   - Settings: description, business_type, exclusive_to, technologies, features, preview_image
   - CSS: custom CSS editor (StyleEditor component)
   - Page: page management (rename, copy, delete)
3. Edit Menu Controls: Undo/Redo buttons with disabled states
4. View Menu: Live Preview, Source Code, Stylesheet, Sitemap
5. Insert Menu: New Page
6. Header Center: Editable template name input
7. Toolbar: Undo/Redo buttons, Save icon (color-coded), Image Gallery button
8. Right Section: Preview button, User name display

## KEYBOARD SHORTCUTS
- Ctrl+N: New
- Ctrl+S: Save
- Ctrl+O: Load
- Ctrl+Z: Undo
- Ctrl+Y: Redo

## CRITICAL CONDITIONS
- Delete Page button: Only shows if template.pages.length > 1
- Edit menu/Insert menu: Only render if template exists
- Image Gallery: Disabled if !template
- Image upload: Disabled if template.id === 0 (not saved)
- Image upload loading UI: Shows when uploadingImage = true

## STATE UPDATE PATTERNS
1. Menu toggles: setShowXMenu(!showXMenu)
2. Template updates: setTemplate({...template, propertyName: newValue})
   - Each triggers addToHistory() call
   - templateRef.current synced immediately
3. Modal updates: setShowXModal(true/false)
4. Form updates: setEditPageName(value), etc.

## COMPONENT COMPLEXITY SUMMARY
- 16 state variables
- 6 refs
- 15 handler functions
- 7 modals/panels
- 4 main menus
- 3 edit menu sub-tabs
- 6 template settings fields
- 587 lines of JSX

