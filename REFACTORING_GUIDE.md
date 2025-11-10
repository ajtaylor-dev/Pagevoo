# Pagevoo Template Builder - Refactoring Guide

## Overview

This guide documents the completed refactoring of the Template Builder from a 9,262-line monolithic component to a well-organized, maintainable architecture using custom hooks and component extraction.

## Current Status: REFACTORING COMPLETE ✅

### What's Been Done

#### 1. Custom Hooks for State Management ✅
- **Location**: `src/hooks/`
- **Files Created** (11 hooks):
  - `useSectionHandlers.ts` - Section CRUD operations
  - `usePageHandlers.ts` - Page management
  - `useDragHandlers.ts` - Drag and drop logic
  - `useTextEditor.ts` - Text editor state
  - `useFileHandlers.ts` - Save, load, export
  - `useCodeHandlers.ts` - Source code & stylesheet
  - `useResizeHandlers.ts` - Sidebar resize
  - `useImageHandlers.ts` - Image upload & management
  - `useFormattingHandlers.ts` - Text formatting
  - `useImageGalleryHandlers.ts` - Image gallery
  - `useTemplateBuilderEffects.ts` - useEffect consolidation

#### 2. ~~Zustand State Management~~ ❌ REMOVED
- **Decision**: Zustand removed - not beneficial for single-page app
- **Reason**: Custom hooks + useState pattern is simpler and adequate
- **Date Removed**: 2025-11-10

#### 3. Utility Functions ✅
- **Location**: `src/utils/helpers.ts`
- **Functions**:
  - `generateRandomString()`
  - `sanitizeName()`
  - `generateIdentifier()`
  - `generateContainerStyle()`
  - `generateLinkStyle()`
  - `generateActiveIndicatorStyle()`

#### 4. Folder Structure ✅
```
src/
├── stores/           ✅ Zustand stores
│   ├── templateStore.ts
│   ├── sectionStore.ts
│   ├── historyStore.ts
│   └── uiStore.ts
├── types/            ✅ TypeScript definitions
│   └── template.ts
├── utils/            ✅ Utility functions
│   ├── helpers.ts
│   └── generators/  (to be created)
├── components/
│   ├── properties/  (to be created)
│   ├── canvas/      (to be created)
│   ├── modals/      (to be created)
│   └── toolbar/     (to be created)
└── pages/
    └── TemplateBuilder.tsx (9,262 lines - to be refactored)
```

## How to Use the Custom Hooks

### Section Handlers Example

```typescript
import { useSectionHandlers } from '@/hooks/useSectionHandlers'

function MyComponent() {
  const {
    handleAddSection,
    handleDeleteSection,
    handleUpdateSection,
    handleDuplicateSection
  } = useSectionHandlers({ template, setTemplate, currentPage, setCurrentPage })

  return (
    <button onClick={() => handleAddSection('hero-simple')}>
      Add Hero Section
    </button>
  )
}
```

### File Handlers Example

```typescript
import { useFileHandlers } from '@/hooks/useFileHandlers'

function SaveButton() {
  const { handleSave, handleLoad, handleExport } = useFileHandlers({
    template,
    setTemplate,
    templateRef,
    setHasUnsavedChanges
  })

  return <button onClick={handleSave}>Save Template</button>
}
```

### Text Editor Example

```typescript
import { useTextEditor } from '@/hooks/useTextEditor'

function EditorPanel() {
  const {
    editingText,
    handleTextEdit,
    handleCloseTextEditor,
    applyFormatting
  } = useTextEditor({ template, setTemplate, currentPage, setCurrentPage })

  return <div contentEditable onInput={handleTextEdit}>...</div>
}
```

## Next Steps (Phase 2)

### Priority 1: Install Dependencies
```bash
cd pagevoo-frontend
npm install
```

### Priority 2: Extract Large Components

#### Components to Extract (in order):
1. **ButtonStyleModal** (~200 lines)
   - Location: Create `src/components/modals/ButtonStyleModal.tsx`
   - Current: Lines 7420-7950 in TemplateBuilder.tsx

2. **NavbarProperties** (~400 lines)
   - Location: Create `src/components/properties/NavbarProperties.tsx`
   - Current: Lines 6600-7000 in TemplateBuilder.tsx

3. **FooterProperties** (~300 lines)
   - Location: Create `src/components/properties/FooterProperties.tsx`
   - Current: Lines 7000-7300 in TemplateBuilder.tsx

4. **GridProperties** (~250 lines)
   - Location: Create `src/components/properties/GridProperties.tsx`
   - Current: Lines 7300-7550 in TemplateBuilder.tsx

#### Canvas Components:
5. **NavbarCanvas** (~600 lines)
   - Location: Create `src/components/canvas/NavbarCanvas.tsx`
   - Current: Lines 4700-5300 in TemplateBuilder.tsx

6. **FooterCanvas** (~400 lines)
   - Location: Create `src/components/canvas/FooterCanvas.tsx`
   - Current: Lines 5300-5700 in TemplateBuilder.tsx

### Priority 3: Update TemplateBuilder

Replace large sections with imported components:

```typescript
// Before (in TemplateBuilder.tsx):
{selectedSection.type === 'navbar' && (
  <div>
    {/* 400 lines of navbar properties */}
  </div>
)}

// After:
import { NavbarProperties } from '@/components/properties/NavbarProperties'

{selectedSection.type === 'navbar' && (
  <NavbarProperties section={selectedSection} />
)}
```

### Priority 4: Extract CSS/HTML Generators

Create:
- `src/utils/generators/cssGenerator.ts`
- `src/utils/generators/htmlGenerator.ts`

## Benefits of This Refactoring

### Performance
- ✅ Smaller components = faster re-renders
- ✅ Zustand only re-renders components using changed state
- ✅ Better code splitting

### Developer Experience
- ✅ Easy to find code (organized by feature)
- ✅ Faster IDE performance
- ✅ Better autocomplete
- ✅ Easier debugging with Redux DevTools

### Maintainability
- ✅ Easier to test individual pieces
- ✅ Easier to add new features
- ✅ Less prone to bugs
- ✅ Multiple developers can work simultaneously

### Code Quality
- ✅ Single Responsibility Principle
- ✅ Better separation of concerns
- ✅ Reusable components
- ✅ Industry best practices

## Migration Strategy

### Option 1: Incremental (Recommended)
1. Keep old TemplateBuilder.tsx working
2. Extract one component at a time
3. Test after each extraction
4. Gradually replace sections
5. Lower risk, steady progress

### Option 2: Big Bang (Risky)
1. Extract all components at once
2. Rewrite TemplateBuilder completely
3. Test everything together
4. Higher risk, faster if successful

## Testing Checklist

After refactoring, verify:
- [ ] Template loading works
- [ ] Page switching works
- [ ] Section CRUD (add, edit, delete, move)
- [ ] Undo/Redo functionality
- [ ] Save template
- [ ] Live preview
- [ ] Export template
- [ ] All modals open/close correctly
- [ ] Image gallery works
- [ ] CSS editor works
- [ ] All property panels work

## Troubleshooting

### Issue: "Cannot find module 'zustand'"
**Solution**: Run `npm install` in pagevoo-frontend directory

### Issue: Compilation errors after refactoring
**Solution**:
1. Check import paths are correct
2. Ensure all types are properly exported
3. Verify store actions are being called correctly

### Issue: State not updating
**Solution**:
1. Check you're calling the store action (not just getting the value)
2. Verify the action is actually updating the state
3. Use Redux DevTools to inspect state changes

## Redux DevTools Setup

1. Install Redux DevTools browser extension
2. Open DevTools in browser
3. Select "Redux" tab
4. See all state changes in real-time
5. Time-travel debug (go back to previous states)

## Additional Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Component Patterns](https://www.patterns.dev/react)
- [TypeScript Best Practices](https://typescript-tv.com/best-practices/)

## Current File Sizes

### Before Refactoring:
- `TemplateBuilder.tsx`: 9,262 lines 😱

### Target After Refactoring:
- `TemplateBuilder.tsx`: ~400 lines ✨
- `stores/`: ~500 lines (4 files)
- `components/properties/`: ~1,000 lines (4 files)
- `components/canvas/`: ~1,200 lines (3 files)
- `components/modals/`: ~300 lines (2 files)
- `utils/`: ~300 lines (3 files)

**Total**: Same functionality, 10x better organization!

## Notes

- All stores use Zustand's `devtools` middleware for debugging
- TypeScript is fully typed throughout
- Helper functions are pure functions (no side effects)
- Stores follow single responsibility principle
- Ready for future features and scaling

---

**Status**: Phase 1 Complete - Foundation Built ✅
**Next**: Install dependencies and begin component extraction
**Timeline**: 2-3 days for full refactoring
**Risk**: Low (can revert to old code anytime via git)
