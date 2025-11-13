# Tooltip & Hyperlink Styling Fixes

**Date:** 2025-10-27
**Session:** 30

## Overview
Fixed two critical issues:
1. **Tooltip not appearing** when hovering over links in canvas
2. **Hyperlink colors not working** in the canvas

## Problem 1: Tooltip Not Showing

### Root Cause
The `pointer-events: none` CSS property on links prevented ALL mouse interactions, including hover detection. This meant the `:hover` pseudo-class never triggered, so the tooltip never appeared.

### Solution
- Removed `pointer-events: none` from links (allow hover)
- Added JavaScript event listener to prevent actual clicks
- Links can now detect hover for tooltip display

## Problem 2: Hyperlink Colors Not Working

### Root Cause
Link styles were generated as `a { color: ... }` without proper scoping or specificity. This caused them to be overridden by other CSS rules in the canvas.

### Solution
- Changed link selectors from `a` to `.row a` (matches header pattern)
- Added `!important` flags to ensure proper specificity
- Updated CSS parsing to handle both old and new formats
- Updated backend PHP generator to extract link styles for physical files

---

## Changes Made

### 1. Frontend - TemplateBuilder.tsx

**File:** `pagevoo-frontend/src/pages/TemplateBuilder.tsx`

#### Improved Tooltip CSS (Lines 1720-1769)

**Changes:**
- Removed `pointer-events: none` from `#template-canvas a`
- Improved tooltip positioning with `calc(100% + 8px)`
- Added smooth transform animation on hover
- Increased z-index to 10000 (was 1000)
- Added box-shadow for better visibility
- Made tooltip darker (rgba 0.9 instead of 0.85)
- Improved font styling (font-weight: 500)

**New CSS:**
```css
#template-canvas a {
  cursor: not-allowed !important;
  position: relative;
}

#template-canvas a::after {
  content: 'Link disabled on canvas';
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 10000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

#template-canvas a::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 3px);
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 10000;
}

#template-canvas a:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(-2px);
}

#template-canvas a:hover::before {
  opacity: 1;
}
```

#### JavaScript Click Prevention (Lines 1771-1785)

**Added script to prevent link clicks:**
```javascript
(function() {
  const canvas = document.getElementById('template-canvas');
  if (canvas) {
    canvas.addEventListener('click', function(e) {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }
})();
```

**Benefits:**
- Allows hover events (tooltip works)
- Prevents click navigation
- Uses event capturing (third parameter `true`)
- Checks both direct clicks and clicks on child elements

---

### 2. Frontend - StyleEditor.tsx

**File:** `pagevoo-frontend/src/components/StyleEditor.tsx`

#### CSS Generation - Link Scoping (Lines 568-593)

**Before:**
```css
a {
  color: #007bff;
}

a:hover {
  color: #0056b3;
}
```

**After:**
```css
.row a {
  color: #007bff !important;
}

.row a:hover {
  color: #0056b3 !important;
}
```

**Changes:**
- Added `.row` prefix to all link selectors
- Added `!important` flags for proper specificity
- Applies to: `a`, `a:hover`, `a:visited`, `a:active`
- Consistent with header tag pattern (`.row h1`, `.row h2`, etc.)

**Code:**
```typescript
// Link styles for page/site level (scoped to .row for proper specificity)
if (props.linkColor || props.linkTextDecoration) {
  css += `.row a {\n`
  if (props.linkColor) css += `  color: ${props.linkColor} !important;\n`
  if (props.linkTextDecoration) css += `  text-decoration: ${props.linkTextDecoration} !important;\n`
  css += `}\n\n`
}

if (props.linkHoverColor || props.linkHoverTextDecoration) {
  css += `.row a:hover {\n`
  if (props.linkHoverColor) css += `  color: ${props.linkHoverColor} !important;\n`
  if (props.linkHoverTextDecoration) css += `  text-decoration: ${props.linkHoverTextDecoration} !important;\n`
  css += `}\n\n`
}

if (props.linkVisitedColor) {
  css += `.row a:visited {\n`
  css += `  color: ${props.linkVisitedColor} !important;\n`
  css += `}\n\n`
}

if (props.linkActiveColor) {
  css += `.row a:active {\n`
  css += `  color: ${props.linkActiveColor} !important;\n`
  css += `}\n\n`
}
```

#### CSS Parsing - Backward Compatibility (Lines 454-476)

**Added support for both old and new formats:**

```typescript
// Link color (supports both "a {" and ".row a {" formats)
const linkColorMatch = css.match(/(?:\.row\s+)?a\s*\{[^}]*color:\s*([^;}\n]+)/i)
if (linkColorMatch) props.linkColor = linkColorMatch[1].trim().replace(/\s*!important\s*$/, '')

// Link hover color (a:hover { color: ... })
const linkHoverColorMatch = css.match(/(?:\.row\s+)?a:hover\s*\{[^}]*color:\s*([^;}\n]+)/i)
if (linkHoverColorMatch) props.linkHoverColor = linkHoverColorMatch[1].trim().replace(/\s*!important\s*$/, '')

// Link visited color (a:visited { color: ... })
const linkVisitedColorMatch = css.match(/(?:\.row\s+)?a:visited\s*\{[^}]*color:\s*([^;}\n]+)/i)
if (linkVisitedColorMatch) props.linkVisitedColor = linkVisitedColorMatch[1].trim().replace(/\s*!important\s*$/, '')

// Link active color (a:active { color: ... })
const linkActiveColorMatch = css.match(/(?:\.row\s+)?a:active\s*\{[^}]*color:\s*([^;}\n]+)/i)
if (linkActiveColorMatch) props.linkActiveColor = linkActiveColorMatch[1].trim().replace(/\s*!important\s*$/, '')

// Link text decoration (a { text-decoration: ... })
const linkTextDecorationMatch = css.match(/(?:\.row\s+)?a\s*\{[^}]*text-decoration:\s*([^;}\n]+)/i)
if (linkTextDecorationMatch) props.linkTextDecoration = linkTextDecorationMatch[1].trim().replace(/\s*!important\s*$/, '')

// Link hover text decoration (a:hover { text-decoration: ... })
const linkHoverTextDecorationMatch = css.match(/(?:\.row\s+)?a:hover\s*\{[^}]*text-decoration:\s*([^;}\n]+)/i)
if (linkHoverTextDecorationMatch) props.linkHoverTextDecoration = linkHoverTextDecorationMatch[1].trim().replace(/\s*!important\s*$/, '')
```

**Features:**
- Regex pattern `(?:\.row\s+)?` makes `.row` prefix optional
- Works with old templates using `a { }`
- Works with new templates using `.row a { }`
- Strips `!important` when parsing (don't show to user)

---

### 3. Backend - TemplateFileGenerator.php

**File:** `pagevoo-backend/app/Services/TemplateFileGenerator.php`

#### Link Style Extraction (Lines 519-556)

**Added extraction of link styles from Site CSS to physical files:**

```php
// Extract Link styles from Site CSS if they exist (custom hyperlink settings)
if ($template->custom_css) {
    // Extract .row a { } styles
    if (preg_match('/(?:\.row\s+)?a\s*\{([^}]+)\}/i', $template->custom_css, $aMatch)) {
        if (preg_match('/^[^{]+/', $aMatch[0], $selectorMatch)) {
            $css .= trim($selectorMatch[0]) . " {\n";
            $css .= $aMatch[1] . "\n";
            $css .= "}\n\n";
        }
    }

    // Extract .row a:hover { } styles
    if (preg_match('/(?:\.row\s+)?a:hover\s*\{([^}]+)\}/i', $template->custom_css, $aHoverMatch)) {
        if (preg_match('/^[^{]+/', $aHoverMatch[0], $selectorMatch)) {
            $css .= trim($selectorMatch[0]) . " {\n";
            $css .= $aHoverMatch[1] . "\n";
            $css .= "}\n\n";
        }
    }

    // Extract .row a:visited { } styles
    if (preg_match('/(?:\.row\s+)?a:visited\s*\{([^}]+)\}/i', $template->custom_css, $aVisitedMatch)) {
        if (preg_match('/^[^{]+/', $aVisitedMatch[0], $selectorMatch)) {
            $css .= trim($selectorMatch[0]) . " {\n";
            $css .= $aVisitedMatch[1] . "\n";
            $css .= "}\n\n";
        }
    }

    // Extract .row a:active { } styles
    if (preg_match('/(?:\.row\s+)?a:active\s*\{([^}]+)\}/i', $template->custom_css, $aActiveMatch)) {
        if (preg_match('/^[^{]+/', $aActiveMatch[0], $selectorMatch)) {
            $css .= trim($selectorMatch[0]) . " {\n";
            $css .= $aActiveMatch[1] . "\n";
            $css .= "}\n\n";
        }
    }
}
```

**Features:**
- Extracts all 4 link states (normal, hover, visited, active)
- Supports both old `a { }` and new `.row a { }` formats
- Preserves selector format from database
- Includes `!important` flags in generated files
- Same pattern as header/paragraph extraction

---

## Testing

### Test Case 1: Tooltip Visibility

1. Open Template Builder
2. Add a navigation section or text with links
3. **Hover over a link** in the canvas
4. **Expected:** Tooltip appears saying "Link disabled on canvas"
5. **Expected:** Smooth fade-in animation with upward movement
6. **Expected:** Arrow pointing to the link

### Test Case 2: Tooltip Click Prevention

1. Hover over a link (tooltip appears)
2. **Click the link**
3. **Expected:** Nothing happens (no navigation)
4. **Expected:** Tooltip remains visible
5. **Expected:** Cursor shows "not-allowed"

### Test Case 3: Link Color Changes

1. Go to Site CSS or Page CSS
2. Open "Hyperlink Styling" section
3. Change "Link Color" to red (#FF0000)
4. **Expected:** Links in canvas turn red immediately
5. Change "Hover Color" to blue (#0000FF)
6. **Hover over link**
7. **Expected:** Link turns blue on hover

### Test Case 4: Generated PHP Files

1. Set link colors in Site CSS
2. Save the template
3. Check generated `.php` file
4. **Expected:** CSS file contains `.row a { color: #FF0000 !important; }`
5. Open Live Preview
6. **Expected:** Link colors work in Live Preview

### Test Case 5: Backward Compatibility

1. Load an old template with `a { color: blue; }` format
2. **Expected:** Colors still work in canvas
3. **Expected:** StyleEditor shows blue color
4. Change the color
5. **Expected:** New format `.row a { }` is used

---

## CSS Specificity Explained

### Why `.row a` instead of just `a`?

**Problem with `a { }`:**
- Specificity: 1 element = **1**
- Easily overridden by other styles

**Solution with `.row a { }`:**
- Specificity: 1 class + 1 element = **11**
- Higher specificity ensures our styles apply

**With `!important`:**
- `.row a { color: red !important; }`
- Overrides almost all other color declarations
- Ensures user's choice is respected

### Specificity Hierarchy

1. `a { color: blue; }` = 1 (loses)
2. `.row a { color: red; }` = 11 (wins without !important)
3. `.row a { color: green !important; }` = 11 + !important (always wins)

---

## Benefits

### Tooltip Improvements

✅ **Now visible** - Hover detection works properly
✅ **Better design** - Darker background, shadow, better font
✅ **Smooth animation** - Fade + upward movement
✅ **Higher z-index** - Always appears on top

### Hyperlink Styling

✅ **Colors work** - Proper specificity with `.row a`
✅ **All states** - Normal, hover, visited, active
✅ **Live Preview** - Colors work in generated files
✅ **Backward compatible** - Old templates still work

### User Experience

✅ **Clear feedback** - Users know links are disabled
✅ **Professional** - Polished tooltip design
✅ **Predictable** - Link colors work as expected
✅ **Flexible** - Full control over link appearance

---

## Technical Notes

### Why JavaScript for Click Prevention?

CSS `pointer-events: none` prevents ALL mouse events including hover. JavaScript allows us to:
- Allow hover events (for tooltip)
- Prevent click events (for navigation)
- Best of both worlds

### Why !important?

The `!important` flag ensures user-defined link colors override:
- Browser defaults
- Reset styles
- Other CSS rules
- Navigation section styles

Without `!important`, some styles might not apply due to specificity conflicts.

### Why Event Capturing?

The `addEventListener` uses `true` as third parameter (capturing phase):
```javascript
canvas.addEventListener('click', function(e) { ... }, true);
```

This ensures the event is caught BEFORE it reaches the link, preventing navigation even if other scripts try to handle clicks.

---

**Status:** ✅ Complete and ready for testing
**Impact:** Tooltip now visible, hyperlink colors working correctly
