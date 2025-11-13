# Prevent Accidental Page Refresh/Close

**Date:** 2025-10-27
**Session:** 30

## Overview
Added browser confirmation prompt to prevent accidental page refresh or tab close when there are unsaved changes in the Template Builder.

## Problem
- Users could accidentally press F5, Ctrl+R, or close the tab
- All unsaved work would be lost without warning
- No protection against accidental data loss

## Solution
Added a `beforeunload` event listener that triggers a browser confirmation dialog when the user tries to refresh or close the tab with unsaved changes.

## Implementation

### File Modified
**File:** `pagevoo-frontend/src\pages\TemplateBuilder.tsx`

**Lines:** 665-678

### Code Added
```typescript
// Prevent accidental page refresh/close when there are unsaved changes
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault()
      // Chrome requires returnValue to be set
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      return 'You have unsaved changes. Are you sure you want to leave?'
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [hasUnsavedChanges])
```

## How It Works

### 1. Event Listener
- Listens to the browser's `beforeunload` event
- Triggers when user tries to:
  - Refresh the page (F5, Ctrl+R, Cmd+R)
  - Close the tab/window
  - Navigate to a different URL
  - Close the browser

### 2. Conditional Check
- Only triggers if `hasUnsavedChanges === true`
- If no unsaved changes, user can leave freely
- Tracks the same state as the save icon (red = unsaved, green = saved)

### 3. Browser Dialog
- Shows a native browser confirmation dialog
- Message: "You have unsaved changes. Are you sure you want to leave?"
- User can choose:
  - **Stay on page** - Continue editing
  - **Leave** - Discard unsaved changes

### 4. Cleanup
- Event listener is properly removed when component unmounts
- Dependency array `[hasUnsavedChanges]` ensures listener updates when save state changes

## Browser Behavior

### Modern Browsers
Most modern browsers (Chrome, Firefox, Edge, Safari) show a generic message like:
- "Changes you made may not be saved"
- "Do you want to leave this site?"

The custom message (`'You have unsaved changes. Are you sure you want to leave?'`) may not be displayed in modern browsers due to security reasons, but the dialog will still appear.

### Why Both Lines?
```typescript
e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
return 'You have unsaved changes. Are you sure you want to leave?'
```
- `e.returnValue` is required for Chrome/Edge
- `return` statement is required for Firefox/older browsers
- Both ensure maximum browser compatibility

## User Experience

### Before:
❌ Press F5 → Page refreshes immediately → All work lost
❌ Close tab → Tab closes immediately → All work lost
❌ No warning or protection

### After:
✅ Press F5 → Browser dialog appears
✅ Close tab → Browser dialog appears
✅ User prompted: "Do you want to leave this site? Changes you made may not be saved"
✅ Can choose to stay or leave

## Triggers

### Will Prompt When:
- ✅ Pressing F5 or Ctrl+R (refresh)
- ✅ Closing the tab
- ✅ Closing the browser window
- ✅ Navigating to a different URL
- ✅ Clicking browser back button
- ✅ Typing a new URL in address bar

### Will NOT Prompt When:
- ✅ All changes are saved (green save icon)
- ✅ User just saved their work
- ✅ Template has no unsaved changes

## Integration with Save System

The prompt uses the same `hasUnsavedChanges` state that controls:
- Save icon color (red = unsaved, green = saved)
- Undo/redo history
- Save hotkeys (Ctrl+S)

This ensures consistency across all save-related features.

## Testing

### Test Case 1: Unsaved Changes
1. Open Template Builder
2. Make any change (add section, edit text, change CSS)
3. **Don't save**
4. Press F5 or try to close tab
5. **Expected:** Browser dialog appears asking to confirm

### Test Case 2: After Saving
1. Open Template Builder
2. Make changes
3. **Save the template** (Ctrl+S or click save icon)
4. Press F5 or try to close tab
5. **Expected:** Page refreshes normally (no dialog)

### Test Case 3: No Changes
1. Open Template Builder
2. Load a template
3. Don't make any changes
4. Press F5 or try to close tab
5. **Expected:** Page refreshes normally (no dialog)

## Browser Compatibility

✅ **Chrome/Edge:** Fully supported
✅ **Firefox:** Fully supported
✅ **Safari:** Fully supported
✅ **Opera:** Fully supported

All modern browsers support the `beforeunload` event.

## Benefits

1. ✅ **Prevents Data Loss:** Users warned before losing unsaved work
2. ✅ **Smart Detection:** Only prompts when there are actual unsaved changes
3. ✅ **Native Dialog:** Uses browser's built-in confirmation (trusted and familiar)
4. ✅ **All Exit Methods:** Covers refresh, close, navigate away
5. ✅ **Consistent UX:** Works with existing save icon and undo/redo system
6. ✅ **Clean Cleanup:** Event listener properly removed on unmount

## Technical Notes

### Why useEffect?
- Need to add/remove event listener based on component lifecycle
- Dependency array ensures listener updates when `hasUnsavedChanges` changes
- Cleanup function prevents memory leaks

### Why e.preventDefault()?
- Signals to the browser that we want to show the confirmation dialog
- Without this, the page would refresh without warning

### Why both returnValue and return?
- Different browsers require different approaches
- Using both ensures maximum compatibility
- Legacy support for older browser versions

---

**Status:** ✅ Complete and deployed
**Impact:** Prevents accidental data loss for all users
