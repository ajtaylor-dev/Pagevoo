import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { HexColorPicker } from 'react-colorful'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StyleProperty {
  backgroundColor?: string
  color?: string
  fontSize?: number
  fontFamily?: string
  padding?: number
  margin?: number
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  borderStyle?: string
  position?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  backgroundAttachment?: string
  opacity?: number
  // Link styles
  linkColor?: string
  linkHoverColor?: string
  linkVisitedColor?: string
  linkActiveColor?: string
  linkTextDecoration?: string
  linkHoverTextDecoration?: string
  // Dimensions
  width?: string
  height?: string
  minWidth?: string
  minHeight?: string
  // Layout
  display?: string
  overflow?: string
  float?: string
  // Header styles (h1-h4)
  h1FontSize?: number
  h1Padding?: number
  h1Margin?: number
  h1Color?: string
  h2FontSize?: number
  h2Padding?: number
  h2Margin?: number
  h2Color?: string
  h3FontSize?: number
  h3Padding?: number
  h3Margin?: number
  h3Color?: string
  h4FontSize?: number
  h4Padding?: number
  h4Margin?: number
  h4Color?: string
  // Paragraph styles
  pPadding?: string
  pMargin?: string
}

interface StyleEditorProps {
  value: string
  onChange: (css: string) => void
  context: 'page' | 'section' | 'row' | 'column'
  showFontSelector?: boolean
  galleryImages?: Array<{
    id: string
    filename: string
    path: string
    size: number
    uploaded_at: string
  }>
  onOpenGallery?: () => void
}

const GOOGLE_FONTS = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'PT Sans',
  'Merriweather',
  'Nunito',
  'Playfair Display',
  'Ubuntu'
]

const POSITION_OPTIONS = [
  { value: 'static', label: 'Static (default)' },
  { value: 'relative', label: 'Relative' },
  { value: 'absolute', label: 'Absolute' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'sticky', label: 'Sticky' }
]

const BORDER_STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' }
]

const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#F3F4F6', '#D1D5DB', '#6B7280',
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#06B6D4'
]

const BACKGROUND_SIZE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: '100% 100%', label: 'Stretch' },
]

const BACKGROUND_POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top left', label: 'Top Left' },
  { value: 'top right', label: 'Top Right' },
  { value: 'bottom left', label: 'Bottom Left' },
  { value: 'bottom right', label: 'Bottom Right' },
]

const BACKGROUND_REPEAT_OPTIONS = [
  { value: 'no-repeat', label: 'No Repeat' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'repeat-x', label: 'Repeat X' },
  { value: 'repeat-y', label: 'Repeat Y' },
]

const BACKGROUND_ATTACHMENT_OPTIONS = [
  { value: 'scroll', label: 'Scroll' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'local', label: 'Local' },
]

const TEXT_DECORATION_OPTIONS = [
  { value: 'default', label: 'Default (underline)' },
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'overline', label: 'Overline' },
  { value: 'line-through', label: 'Line Through' },
]

const WIDTH_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '100%', label: '100%' },
  { value: 'fit-content', label: 'Fit Content' },
  { value: 'custom', label: 'Custom' },
]

const HEIGHT_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '100%', label: '100%' },
  { value: '100vh', label: '100vh' },
  { value: 'fit-content', label: 'Fit Content' },
  { value: 'custom', label: 'Custom' },
]

const MIN_WIDTH_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '100%', label: '100%' },
  { value: 'fit-content', label: 'Fit Content' },
  { value: 'custom', label: 'Custom' },
]

const MIN_HEIGHT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '100%', label: '100%' },
  { value: '100vh', label: '100vh' },
  { value: 'fit-content', label: 'Fit Content' },
  { value: 'custom', label: 'Custom' },
]

const DISPLAY_OPTIONS = [
  { value: 'default', label: 'Default (block)' },
  { value: 'block', label: 'Block' },
  { value: 'inline-block', label: 'Inline Block' },
  { value: 'flex', label: 'Flex' },
  { value: 'inline-flex', label: 'Inline Flex' },
  { value: 'grid', label: 'Grid' },
  { value: 'inline-grid', label: 'Inline Grid' },
  { value: 'inline', label: 'Inline' },
  { value: 'none', label: 'None' },
]

const OVERFLOW_OPTIONS = [
  { value: 'default', label: 'Default (visible)' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'auto', label: 'Auto' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'clip', label: 'Clip' },
]

const FLOAT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center', label: 'Center (margin auto)' },
]

export function StyleEditor({ value, onChange, context, showFontSelector = false, galleryImages, onOpenGallery }: StyleEditorProps) {
  const [activeTab, setActiveTab] = useState<'simplified' | 'code'>('simplified')
  const [properties, setProperties] = useState<StyleProperty>({
    fontSize: 16,
    fontFamily: 'Arial',
    padding: 0,
    margin: 0,
    borderRadius: 0,
    position: 'static'
  })
  const [rawCSS, setRawCSS] = useState(value)
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBorderColorPicker, setShowBorderColorPicker] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [selectedGalleryImagePath, setSelectedGalleryImagePath] = useState<string | null>(null)
  const [showLinkColorPicker, setShowLinkColorPicker] = useState(false)
  const [showLinkHoverColorPicker, setShowLinkHoverColorPicker] = useState(false)
  const [showLinkVisitedColorPicker, setShowLinkVisitedColorPicker] = useState(false)
  const [showLinkActiveColorPicker, setShowLinkActiveColorPicker] = useState(false)
  const [showHeaderSettingsModal, setShowHeaderSettingsModal] = useState(false)
  const [showH1ColorPicker, setShowH1ColorPicker] = useState(false)
  const [showH2ColorPicker, setShowH2ColorPicker] = useState(false)
  const [showH3ColorPicker, setShowH3ColorPicker] = useState(false)
  const [showH4ColorPicker, setShowH4ColorPicker] = useState(false)

  // Local state for hex inputs to prevent parent re-renders on every keystroke
  const [linkColorInput, setLinkColorInput] = useState('')
  const [linkHoverColorInput, setLinkHoverColorInput] = useState('')
  const [linkVisitedColorInput, setLinkVisitedColorInput] = useState('')
  const [linkActiveColorInput, setLinkActiveColorInput] = useState('')

  // Track which input is being edited
  const [editingLinkColor, setEditingLinkColor] = useState(false)
  const [editingLinkHoverColor, setEditingLinkHoverColor] = useState(false)
  const [editingLinkVisitedColor, setEditingLinkVisitedColor] = useState(false)
  const [editingLinkActiveColor, setEditingLinkActiveColor] = useState(false)
  const [showCustomWidthInput, setShowCustomWidthInput] = useState(false)
  const [showCustomHeightInput, setShowCustomHeightInput] = useState(false)
  const [showCustomMinWidthInput, setShowCustomMinWidthInput] = useState(false)
  const [showCustomMinHeightInput, setShowCustomMinHeightInput] = useState(false)

  // Local state for custom dimension inputs to prevent fighting with parsed CSS
  const [customWidthInput, setCustomWidthInput] = useState('')
  const [customHeightInput, setCustomHeightInput] = useState('')
  const [customMinWidthInput, setCustomMinWidthInput] = useState('')
  const [customMinHeightInput, setCustomMinHeightInput] = useState('')

  // Refs to track if we've initialized custom inputs from loaded CSS
  const widthInitialized = useRef(false)
  const heightInitialized = useRef(false)
  const minWidthInitialized = useRef(false)
  const minHeightInitialized = useRef(false)

  // Helper to determine if width/height/min is custom
  const isCustomWidth = (width: string | undefined) => {
    if (!width) return false
    return !['auto', '100%', 'fit-content'].includes(width)
  }

  const isCustomHeight = (height: string | undefined) => {
    if (!height) return false
    return !['auto', '100%', '100vh', 'fit-content'].includes(height)
  }

  const isCustomMinWidth = (minWidth: string | undefined) => {
    if (!minWidth) return false
    return !['none', '100%', 'fit-content'].includes(minWidth)
  }

  const isCustomMinHeight = (minHeight: string | undefined) => {
    if (!minHeight) return false
    return !['none', '100%', '100vh', 'fit-content'].includes(minHeight)
  }

  // Parse CSS string to extract visual properties
  const parseCSS = (css: string): StyleProperty => {
    const props: StyleProperty = {}

    // Font family (check both inside body {} and standalone)
    const bodyFontMatch = css.match(/body\s*\{[^}]*font-family:\s*['"]?([^'";}\n]+)['"]?/i)
    const standaloneFontMatch = css.match(/(?<!body\s*\{[^}]*)font-family:\s*['"]?([^'";}\n]+)['"]?/i)
    if (bodyFontMatch) {
      const font = bodyFontMatch[1].trim().replace(/,\s*sans-serif/g, '').trim()
      props.fontFamily = font
    } else if (standaloneFontMatch) {
      const font = standaloneFontMatch[1].trim().replace(/['"]/g, '').split(',')[0]
      props.fontFamily = font
    }

    // Background color
    const bgMatch = css.match(/background(?:-color)?:\s*([^;]+);?/i)
    if (bgMatch) props.backgroundColor = bgMatch[1].trim()

    // Text color (but not border-color or background-color)
    const colorMatch = css.match(/(?<!border-)(?<!background-)color:\s*([^;]+);?/i)
    if (colorMatch) props.color = colorMatch[1].trim()

    // Font size
    const fontSizeMatch = css.match(/font-size:\s*(\d+)px;?/i)
    if (fontSizeMatch) props.fontSize = parseInt(fontSizeMatch[1])

    // Padding - support px, rem, em, % units
    const paddingMatch = css.match(/padding:\s*([\d.]+)(px|rem|em|%)?;?/i)
    if (paddingMatch) {
      const value = parseFloat(paddingMatch[1])
      const unit = paddingMatch[2] || 'px'
      // Convert rem to px for slider (1rem = 16px approximation)
      props.padding = unit === 'rem' ? value * 16 : value
    }

    // Margin - support px, rem, em, % units (but not "0 auto" for centering)
    const marginMatch = css.match(/margin:\s*([\d.]+)(px|rem|em|%)(?:\s|;)/i)
    if (marginMatch) {
      const value = parseFloat(marginMatch[1])
      const unit = marginMatch[2] || 'px'
      // Convert rem to px for slider (1rem = 16px approximation)
      props.margin = unit === 'rem' ? value * 16 : value
    }

    // Border radius - support px and rem units
    const radiusMatch = css.match(/border-radius:\s*([\d.]+)(px|rem|em|%)?;?/i)
    if (radiusMatch) {
      const value = parseFloat(radiusMatch[1])
      const unit = radiusMatch[2] || 'px'
      // Convert rem to px for slider (1rem = 16px approximation)
      props.borderRadius = unit === 'rem' ? value * 16 : value
    }

    // Border shorthand property (e.g., "border: 2px dashed #d1d5db;")
    // Format: border: [width] [style] [color] (order can vary)
    const borderShorthandMatch = css.match(/border:\s*([^;]+);?/i)
    if (borderShorthandMatch) {
      const borderValue = borderShorthandMatch[1].trim()

      // Extract width (e.g., "2px", "1rem")
      const widthMatch = borderValue.match(/([\d.]+)(px|rem|em)/)
      if (widthMatch) {
        const value = parseFloat(widthMatch[1])
        const unit = widthMatch[2]
        // Convert rem to px (1rem = 16px approximation)
        props.borderWidth = unit === 'rem' ? value * 16 : value
      }

      // Extract style (solid, dashed, dotted, double, none)
      const styleMatch = borderValue.match(/\b(none|solid|dashed|dotted|double)\b/i)
      if (styleMatch) props.borderStyle = styleMatch[1].toLowerCase()

      // Extract color - try hex first, then rgb/rgba, then named colors (excluding style keywords)
      const hexColorMatch = borderValue.match(/#[0-9a-f]{3,8}\b/i)
      if (hexColorMatch) {
        props.borderColor = hexColorMatch[0]
      } else {
        const rgbColorMatch = borderValue.match(/rgba?\([^)]+\)/i)
        if (rgbColorMatch) {
          props.borderColor = rgbColorMatch[0]
        } else {
          // Named colors (but not border style keywords)
          const namedColorMatch = borderValue.match(/\b(red|blue|green|black|white|gray|grey|yellow|orange|purple|pink|brown|cyan|magenta|lime|navy|teal|olive|maroon|aqua|fuchsia|silver|transparent)\b/i)
          if (namedColorMatch) {
            props.borderColor = namedColorMatch[0]
          }
        }
      }
    }

    // Individual border properties (fallback if shorthand not used)
    const borderWidthMatch = css.match(/border-width:\s*(\d+)px;?/i)
    if (borderWidthMatch) props.borderWidth = parseInt(borderWidthMatch[1])

    const borderColorMatch = css.match(/border-color:\s*([^;]+);?/i)
    if (borderColorMatch) props.borderColor = borderColorMatch[1].trim()

    const borderStyleMatch = css.match(/border-style:\s*([^;]+);?/i)
    if (borderStyleMatch) props.borderStyle = borderStyleMatch[1].trim()

    // Position
    const positionMatch = css.match(/position:\s*([^;]+);?/i)
    if (positionMatch) props.position = positionMatch[1].trim()

    // Background image
    const bgImageMatch = css.match(/background-image:\s*url\(([^)]+)\);?/i)
    if (bgImageMatch) props.backgroundImage = bgImageMatch[1].replace(/['"]/g, '')

    // Background size
    const bgSizeMatch = css.match(/background-size:\s*([^;]+);?/i)
    if (bgSizeMatch) props.backgroundSize = bgSizeMatch[1].trim()

    // Background position
    const bgPositionMatch = css.match(/background-position:\s*([^;]+);?/i)
    if (bgPositionMatch) props.backgroundPosition = bgPositionMatch[1].trim()

    // Background repeat
    const bgRepeatMatch = css.match(/background-repeat:\s*([^;]+);?/i)
    if (bgRepeatMatch) props.backgroundRepeat = bgRepeatMatch[1].trim()

    // Background attachment
    const bgAttachmentMatch = css.match(/background-attachment:\s*([^;]+);?/i)
    if (bgAttachmentMatch) props.backgroundAttachment = bgAttachmentMatch[1].trim()

    // Opacity
    const opacityMatch = css.match(/opacity:\s*([\d.]+);?/i)
    if (opacityMatch) props.opacity = parseFloat(opacityMatch[1])

    // Width (but not min-width or border-width)
    const widthMatch = css.match(/(?<!min-)(?<!border-)width:\s*([^;]+);?/i)
    if (widthMatch) props.width = widthMatch[1].trim()

    // Height (but not min-height)
    const heightMatch = css.match(/(?<!min-)height:\s*([^;]+);?/i)
    if (heightMatch) props.height = heightMatch[1].trim()

    // Min-width
    const minWidthMatch = css.match(/min-width:\s*([^;]+);?/i)
    if (minWidthMatch) props.minWidth = minWidthMatch[1].trim()

    // Min-height
    const minHeightMatch = css.match(/min-height:\s*([^;]+);?/i)
    if (minHeightMatch) props.minHeight = minHeightMatch[1].trim()

    // Display
    const displayMatch = css.match(/display:\s*([^;]+);?/i)
    if (displayMatch) props.display = displayMatch[1].trim()

    // Overflow
    const overflowMatch = css.match(/overflow:\s*([^;]+);?/i)
    if (overflowMatch) props.overflow = overflowMatch[1].trim()

    // Float
    const floatMatch = css.match(/float:\s*([^;]+);?/i)
    if (floatMatch) props.float = floatMatch[1].trim()

    // Check if margin is set to "0 auto" which indicates centering
    const marginAutoMatch = css.match(/margin:\s*0\s+auto;?/i)
    if (marginAutoMatch) props.float = 'center'

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

    // H1 properties (matches with or without #template-canvas prefix)
    const h1FontSizeMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h1\s*\{[^}]*font-size:\s*(\d+)px/i)
    if (h1FontSizeMatch) props.h1FontSize = parseInt(h1FontSizeMatch[1])

    const h1PaddingMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h1\s*\{[^}]*padding:\s*(\d+)px/i)
    if (h1PaddingMatch) props.h1Padding = parseInt(h1PaddingMatch[1])

    const h1MarginMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h1\s*\{[^}]*margin:\s*(\d+)px/i)
    if (h1MarginMatch) props.h1Margin = parseInt(h1MarginMatch[1])

    const h1ColorMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h1\s*\{[^}]*color:\s*([^;}\n]+)/i)
    if (h1ColorMatch) props.h1Color = h1ColorMatch[1].trim()

    // H2 properties (matches with or without #template-canvas prefix)
    const h2FontSizeMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h2\s*\{[^}]*font-size:\s*(\d+)px/i)
    if (h2FontSizeMatch) props.h2FontSize = parseInt(h2FontSizeMatch[1])

    const h2PaddingMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h2\s*\{[^}]*padding:\s*(\d+)px/i)
    if (h2PaddingMatch) props.h2Padding = parseInt(h2PaddingMatch[1])

    const h2MarginMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h2\s*\{[^}]*margin:\s*(\d+)px/i)
    if (h2MarginMatch) props.h2Margin = parseInt(h2MarginMatch[1])

    const h2ColorMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h2\s*\{[^}]*color:\s*([^;}\n]+)/i)
    if (h2ColorMatch) props.h2Color = h2ColorMatch[1].trim()

    // H3 properties (matches with or without #template-canvas prefix)
    const h3FontSizeMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h3\s*\{[^}]*font-size:\s*(\d+)px/i)
    if (h3FontSizeMatch) props.h3FontSize = parseInt(h3FontSizeMatch[1])

    const h3PaddingMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h3\s*\{[^}]*padding:\s*(\d+)px/i)
    if (h3PaddingMatch) props.h3Padding = parseInt(h3PaddingMatch[1])

    const h3MarginMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h3\s*\{[^}]*margin:\s*(\d+)px/i)
    if (h3MarginMatch) props.h3Margin = parseInt(h3MarginMatch[1])

    const h3ColorMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h3\s*\{[^}]*color:\s*([^;}\n]+)/i)
    if (h3ColorMatch) props.h3Color = h3ColorMatch[1].trim()

    // H4 properties (matches with or without #template-canvas prefix)
    const h4FontSizeMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h4\s*\{[^}]*font-size:\s*(\d+)px/i)
    if (h4FontSizeMatch) props.h4FontSize = parseInt(h4FontSizeMatch[1])

    const h4PaddingMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h4\s*\{[^}]*padding:\s*(\d+)px/i)
    if (h4PaddingMatch) props.h4Padding = parseInt(h4PaddingMatch[1])

    const h4MarginMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h4\s*\{[^}]*margin:\s*(\d+)px/i)
    if (h4MarginMatch) props.h4Margin = parseInt(h4MarginMatch[1])

    const h4ColorMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?h4\s*\{[^}]*color:\s*([^;}\n]+)/i)
    if (h4ColorMatch) props.h4Color = h4ColorMatch[1].trim()

    // Paragraph properties (matches with or without #template-canvas prefix)
    const pPaddingMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?p\s*\{[^}]*padding:\s*([^;}\n]+)/i)
    if (pPaddingMatch) props.pPadding = pPaddingMatch[1].trim()

    const pMarginMatch = css.match(/(?:#template-canvas\s+)?(?:\.row\s+)?p\s*\{[^}]*margin:\s*([^;}\n]+)/i)
    if (pMarginMatch) props.pMargin = pMarginMatch[1].trim()

    return props
  }

  // Generate CSS from visual properties
  const generateCSS = (props: StyleProperty): string => {
    let css = ''

    // For page/site context with font selector, apply ALL styles globally via body selector
    if (showFontSelector && context === 'page') {
      let bodyStyles = ''

      // Font styles
      if (props.fontFamily) {
        bodyStyles += `  font-family: '${props.fontFamily}', sans-serif;\n`
      }
      if (props.fontSize) {
        bodyStyles += `  font-size: ${props.fontSize}px;\n`
      }
      if (props.color) {
        bodyStyles += `  color: ${props.color};\n`
      }

      // Background and layout (for body element)
      if (props.backgroundColor) bodyStyles += `  background-color: ${props.backgroundColor};\n`
      if (props.padding !== undefined) bodyStyles += `  padding: ${props.padding}px;\n`
      if (props.margin !== undefined) bodyStyles += `  margin: ${props.margin}px;\n`

      if (bodyStyles) {
        css += `body {\n${bodyStyles}}\n\n`
      }

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

      // Header tag styles (h1-h4) - scoping to canvas happens automatically
      if (props.h1FontSize || props.h1Padding !== undefined || props.h1Margin !== undefined || props.h1Color) {
        css += `.row h1 {\n`
        if (props.h1FontSize) css += `  font-size: ${props.h1FontSize}px;\n`
        if (props.h1Padding !== undefined) css += `  padding: ${props.h1Padding}px;\n`
        if (props.h1Margin !== undefined) css += `  margin: ${props.h1Margin}px;\n`
        if (props.h1Color) css += `  color: ${props.h1Color};\n`
        css += `}\n\n`
      }

      if (props.h2FontSize || props.h2Padding !== undefined || props.h2Margin !== undefined || props.h2Color) {
        css += `.row h2 {\n`
        if (props.h2FontSize) css += `  font-size: ${props.h2FontSize}px;\n`
        if (props.h2Padding !== undefined) css += `  padding: ${props.h2Padding}px;\n`
        if (props.h2Margin !== undefined) css += `  margin: ${props.h2Margin}px;\n`
        if (props.h2Color) css += `  color: ${props.h2Color};\n`
        css += `}\n\n`
      }

      if (props.h3FontSize || props.h3Padding !== undefined || props.h3Margin !== undefined || props.h3Color) {
        css += `.row h3 {\n`
        if (props.h3FontSize) css += `  font-size: ${props.h3FontSize}px;\n`
        if (props.h3Padding !== undefined) css += `  padding: ${props.h3Padding}px;\n`
        if (props.h3Margin !== undefined) css += `  margin: ${props.h3Margin}px;\n`
        if (props.h3Color) css += `  color: ${props.h3Color};\n`
        css += `}\n\n`
      }

      if (props.h4FontSize || props.h4Padding !== undefined || props.h4Margin !== undefined || props.h4Color) {
        css += `.row h4 {\n`
        if (props.h4FontSize) css += `  font-size: ${props.h4FontSize}px;\n`
        if (props.h4Padding !== undefined) css += `  padding: ${props.h4Padding}px;\n`
        if (props.h4Margin !== undefined) css += `  margin: ${props.h4Margin}px;\n`
        if (props.h4Color) css += `  color: ${props.h4Color};\n`
        css += `}\n\n`
      }

      // Paragraph tag styles - scoping to canvas happens automatically
      if (props.pPadding || props.pMargin) {
        css += `.row p {\n`
        if (props.pPadding) css += `  padding: ${props.pPadding};\n`
        if (props.pMargin) css += `  margin: ${props.pMargin};\n`
        css += `}\n\n`
      }

      // Border properties don't make sense for page-level, so skip them
      // Only return the body selector CSS and link styles
      return css
    }

    // For section/row/column context, output properties without selector (parent will wrap them)
    if (props.backgroundColor) css += `background-color: ${props.backgroundColor};\n`
    // Note: font-family, color, and font-size should NOT be output here
    // They should be set inline in WYSIWYG or inherited from site/page CSS
    if (props.padding !== undefined) css += `padding: ${props.padding}px;\n`
    if (props.margin !== undefined) css += `margin: ${props.margin}px;\n`
    if (props.borderRadius !== undefined) css += `border-radius: ${props.borderRadius}px;\n`
    if (props.borderWidth !== undefined) css += `border-width: ${props.borderWidth}px;\n`
    if (props.borderColor) css += `border-color: ${props.borderColor};\n`
    if (props.borderStyle) css += `border-style: ${props.borderStyle};\n`
    if (props.position && props.position !== 'static') css += `position: ${props.position};\n`
    if (props.display) css += `display: ${props.display};\n`
    if (props.overflow) css += `overflow: ${props.overflow};\n`
    if (props.float) {
      if (props.float === 'center') {
        css += `margin: 0 auto;\n`
      } else if (props.float !== 'none') {
        css += `float: ${props.float};\n`
      }
    }
    if (props.width) css += `width: ${props.width};\n`
    if (props.height) css += `height: ${props.height};\n`
    if (props.minWidth && props.minWidth !== 'none') css += `min-width: ${props.minWidth};\n`
    if (props.minHeight && props.minHeight !== 'none') css += `min-height: ${props.minHeight};\n`
    if (props.backgroundImage) {
      css += `background-image: url('${props.backgroundImage}');\n`
      if (props.backgroundSize) css += `background-size: ${props.backgroundSize};\n`
      if (props.backgroundPosition) css += `background-position: ${props.backgroundPosition};\n`
      if (props.backgroundRepeat) css += `background-repeat: ${props.backgroundRepeat};\n`
      if (props.backgroundAttachment) css += `background-attachment: ${props.backgroundAttachment};\n`
    }
    if (props.opacity !== undefined && props.opacity !== 1) css += `opacity: ${props.opacity};\n`

    // Note: Link styles are only available at Site/Page CSS level
    // They are not included in section/row/column CSS to maintain consistent UX

    return css
  }

  // Helper to normalize hex colors for comparison
  const normalizeColor = (color: string | undefined): string => {
    if (!color) return ''
    return color.toLowerCase().replace(/\s/g, '')
  }

  // Helper to get contrasting color (black or white)
  const getContrastColor = (bgColor: string | undefined): string => {
    if (!bgColor) return '#000000'

    // Remove # if present
    const hex = bgColor.replace('#', '')

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  // Update a single property with automatic color contrast validation
  const updateProperty = (key: keyof StyleProperty, value: any) => {
    let newProps = { ...properties, [key]: value }

    // Automatic color contrast validation
    // If setting background color and text color would match, auto-adjust text color
    if (key === 'backgroundColor' && value) {
      const normalizedBg = normalizeColor(value)
      const normalizedText = normalizeColor(newProps.color)

      if (normalizedBg === normalizedText) {
        console.log('[StyleEditor] Background color matches text color - auto-adjusting text color')
        newProps.color = getContrastColor(value)
      }
    }

    // If setting text color and it would match background, auto-adjust text color
    if (key === 'color' && value) {
      const normalizedBg = normalizeColor(newProps.backgroundColor)
      const normalizedText = normalizeColor(value)

      if (normalizedBg === normalizedText) {
        console.log('[StyleEditor] Text color matches background - auto-adjusting to contrasting color')
        newProps.color = getContrastColor(newProps.backgroundColor)
      }
    }

    setProperties(newProps)

    // If on simplified tab, update the onChange immediately
    if (activeTab === 'simplified') {
      const newCSS = generateCSS(newProps)
      console.log('[StyleEditor] Generated CSS:', newCSS)
      console.log('[StyleEditor] Properties:', newProps)
      setRawCSS(newCSS)
      onChange(newCSS)
    }
  }

  // Handle manual CSS changes
  const handleRawCSSChange = (css: string) => {
    setRawCSS(css)
    onChange(css)
    // Parse the new CSS back into properties for the simplified view
    const parsed = parseCSS(css)
    setProperties(parsed)
  }

  // Handle font family change
  const handleFontChange = (font: string) => {
    updateProperty('fontFamily', font)
  }

  // Parse CSS string into properties on mount - strip out matching colors
  useEffect(() => {
    // Don't update if user is actively editing any input
    if (editingLinkColor || editingLinkHoverColor || editingLinkVisitedColor || editingLinkActiveColor) {
      return
    }

    if (!value || value.trim() === '') {
      // If empty CSS, reset to minimal defaults
      setProperties({
        fontSize: 16,
        fontFamily: 'Arial',
        padding: 0,
        margin: 0,
        borderRadius: 0,
        position: 'static'
      })
      setRawCSS('')
      return
    }
    const parsed = parseCSS(value)

    // Check if loaded CSS has matching background and text colors
    // If so, simply don't set the color property (let it inherit from parent)
    let textColor = parsed.color
    if (parsed.backgroundColor && parsed.color) {
      const normalizedBg = normalizeColor(parsed.backgroundColor)
      const normalizedText = normalizeColor(parsed.color)

      if (normalizedBg === normalizedText) {
        console.log('[StyleEditor] Loaded CSS has matching colors - removing text color to prevent invisible text')
        textColor = undefined // Remove the color so text inherits from parent

        // Generate new CSS without the bad color property
        const fixedProps = {
          ...parsed,
          color: undefined // Remove color
        }
        const fixedCSS = generateCSS(fixedProps)
        console.log('[StyleEditor] Fixed CSS (removed color):', fixedCSS)

        // Update the database with fixed CSS
        onChange(fixedCSS)
      }
    }

    setProperties({
      backgroundColor: parsed.backgroundColor,
      color: textColor,
      fontSize: parsed.fontSize ?? 16,
      fontFamily: parsed.fontFamily ?? 'Arial',
      padding: parsed.padding ?? 0,
      margin: parsed.margin ?? 0,
      borderRadius: parsed.borderRadius ?? 0,
      borderWidth: parsed.borderWidth ?? 0,
      borderColor: parsed.borderColor,
      borderStyle: parsed.borderStyle ?? 'solid',
      position: parsed.position ?? 'static',
      width: parsed.width,
      height: parsed.height,
      minWidth: parsed.minWidth,
      minHeight: parsed.minHeight,
      display: parsed.display,
      overflow: parsed.overflow,
      float: parsed.float,
      backgroundImage: parsed.backgroundImage,
      backgroundSize: parsed.backgroundSize,
      backgroundPosition: parsed.backgroundPosition,
      backgroundRepeat: parsed.backgroundRepeat,
      backgroundAttachment: parsed.backgroundAttachment,
      opacity: parsed.opacity ?? 1,
      linkColor: parsed.linkColor,
      linkHoverColor: parsed.linkHoverColor,
      linkVisitedColor: parsed.linkVisitedColor,
      linkActiveColor: parsed.linkActiveColor,
      linkTextDecoration: parsed.linkTextDecoration,
      linkHoverTextDecoration: parsed.linkHoverTextDecoration,
      // Header properties (h1-h4)
      h1FontSize: parsed.h1FontSize,
      h1Padding: parsed.h1Padding,
      h1Margin: parsed.h1Margin,
      h1Color: parsed.h1Color,
      h2FontSize: parsed.h2FontSize,
      h2Padding: parsed.h2Padding,
      h2Margin: parsed.h2Margin,
      h2Color: parsed.h2Color,
      h3FontSize: parsed.h3FontSize,
      h3Padding: parsed.h3Padding,
      h3Margin: parsed.h3Margin,
      h3Color: parsed.h3Color,
      h4FontSize: parsed.h4FontSize,
      h4Padding: parsed.h4Padding,
      h4Margin: parsed.h4Margin,
      h4Color: parsed.h4Color,
      // Paragraph properties
      pPadding: parsed.pPadding,
      pMargin: parsed.pMargin,
    })

    // Initialize custom input visibility and values based on parsed values
    const customWidth = isCustomWidth(parsed.width)
    const customHeight = isCustomHeight(parsed.height)
    const customMinWidth = isCustomMinWidth(parsed.minWidth)
    const customMinHeight = isCustomMinHeight(parsed.minHeight)

    setShowCustomWidthInput(customWidth)
    setShowCustomHeightInput(customHeight)
    setShowCustomMinWidthInput(customMinWidth)
    setShowCustomMinHeightInput(customMinHeight)

    // Initialize custom input values ONLY on first load if they have custom values
    // After that, leave them alone to prevent reset issues
    if (customWidth && !widthInitialized.current && parsed.width) {
      setCustomWidthInput(parsed.width)
      widthInitialized.current = true
    }
    if (!customWidth) {
      widthInitialized.current = false
      setCustomWidthInput('')
    }

    if (customHeight && !heightInitialized.current && parsed.height) {
      setCustomHeightInput(parsed.height)
      heightInitialized.current = true
    }
    if (!customHeight) {
      heightInitialized.current = false
      setCustomHeightInput('')
    }

    if (customMinWidth && !minWidthInitialized.current && parsed.minWidth) {
      setCustomMinWidthInput(parsed.minWidth)
      minWidthInitialized.current = true
    }
    if (!customMinWidth) {
      minWidthInitialized.current = false
      setCustomMinWidthInput('')
    }

    if (customMinHeight && !minHeightInitialized.current && parsed.minHeight) {
      setCustomMinHeightInput(parsed.minHeight)
      minHeightInitialized.current = true
    }
    if (!customMinHeight) {
      minHeightInitialized.current = false
      setCustomMinHeightInput('')
    }

    setRawCSS(value)
  }, [value, editingLinkColor, editingLinkHoverColor, editingLinkVisitedColor, editingLinkActiveColor])

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'simplified' | 'code')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simplified">Simplified</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        <TabsContent value="simplified" className="space-y-4 mt-4">
          {/* Font Family Selector (only for page/section context) */}
          {showFontSelector && (
            <div>
              <Label className="text-xs font-medium">Font Family</Label>
              <Select value={properties.fontFamily || 'Arial'} onValueChange={handleFontChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOOGLE_FONTS.map(font => (
                    <SelectItem key={font} value={font} className="text-xs">
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Header Settings Button (only for site CSS) */}
          {showFontSelector && (
            <div>
              <button
                onClick={() => setShowHeaderSettingsModal(true)}
                className="w-full px-4 py-2 bg-[#5a7a54] text-white rounded text-xs hover:bg-[#4a6a44] transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Header and Paragraph Styling
              </button>
            </div>
          )}

          {/* Background Color */}
          <div>
            <Label className="text-xs font-medium">Background Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <button
                className="w-8 h-8 rounded border-2 border-gray-300 relative overflow-hidden"
                style={
                  properties.backgroundColor
                    ? { backgroundColor: properties.backgroundColor }
                    : {
                        background:
                          'linear-gradient(to top right, transparent 0%, transparent calc(50% - 1px), #ef4444 calc(50% - 1px), #ef4444 calc(50% + 1px), transparent calc(50% + 1px), transparent 100%), ' +
                          'repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 8px 8px'
                      }
                }
                onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                title={properties.backgroundColor || 'Transparent (no background color)'}
              />
              <Input
                value={properties.backgroundColor || ''}
                onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                className="h-8 text-xs flex-1"
                placeholder="e.g., #FFFFFF or transparent"
              />
            </div>
            {showBackgroundPicker && (
              <div className="mt-2">
                <HexColorPicker
                  color={properties.backgroundColor || '#FFFFFF'}
                  onChange={(color) => updateProperty('backgroundColor', color)}
                  className="!w-full"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                      onClick={() => updateProperty('backgroundColor', color)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Color - Only show for page/site level */}
          {showFontSelector && (
            <div>
              <Label className="text-xs font-medium">Text Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: properties.color || '#000000' }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <Input
                  value={properties.color || ''}
                  onChange={(e) => updateProperty('color', e.target.value)}
                  className="h-8 text-xs flex-1"
                  placeholder="e.g., #000000"
                />
              </div>
              {showColorPicker && (
                <div className="mt-2">
                  <HexColorPicker
                    color={properties.color || '#000000'}
                    onChange={(color) => updateProperty('color', color)}
                    className="!w-full"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COLOR_PRESETS.map(color => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                        onClick={() => updateProperty('color', color)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Font Size - Only show for page/site level */}
          {showFontSelector && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Font Size</Label>
                <span className="text-xs text-gray-500">{properties.fontSize || 16}px</span>
              </div>
              <Slider
                value={[properties.fontSize || 16]}
                onValueChange={(value) => updateProperty('fontSize', value[0])}
                min={8}
                max={72}
                step={1}
                className="mt-2"
              />
            </div>
          )}

          {/* Padding */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">{showFontSelector ? 'Body Padding' : 'Padding'}</Label>
              <span className="text-xs text-gray-500">{properties.padding || 0}px</span>
            </div>
            <Slider
              value={[properties.padding || 0]}
              onValueChange={(value) => updateProperty('padding', value[0])}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Margin */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">{showFontSelector ? 'Body Margin' : 'Margin'}</Label>
              <span className="text-xs text-gray-500">{properties.margin || 0}px</span>
            </div>
            <Slider
              value={[properties.margin || 0]}
              onValueChange={(value) => updateProperty('margin', value[0])}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Border Radius - Only for section and column */}
          {(context === 'section' || context === 'column') && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Border Radius</Label>
                <span className="text-xs text-gray-500">{properties.borderRadius || 0}px</span>
              </div>
              <Slider
                value={[properties.borderRadius || 0]}
                onValueChange={(value) => updateProperty('borderRadius', value[0])}
                min={0}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
          )}

          {/* Border Controls - Only for section and column */}
          {(context === 'section' || context === 'column') && (
            <>
              {/* Border Width */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Border Width</Label>
                  <span className="text-xs text-gray-500">{properties.borderWidth || 0}px</span>
                </div>
                <Slider
                  value={[properties.borderWidth || 0]}
                  onValueChange={(value) => updateProperty('borderWidth', value[0])}
                  min={0}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Border Color */}
              <div>
                <Label className="text-xs font-medium">Border Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: properties.borderColor || '#000000' }}
                    onClick={() => setShowBorderColorPicker(!showBorderColorPicker)}
                  />
                  <Input
                    value={properties.borderColor || ''}
                    onChange={(e) => updateProperty('borderColor', e.target.value)}
                    className="h-8 text-xs flex-1"
                    placeholder="e.g., #000000"
                  />
                </div>
                {showBorderColorPicker && (
                  <div className="mt-2">
                    <HexColorPicker
                      color={properties.borderColor || '#000000'}
                      onChange={(color) => updateProperty('borderColor', color)}
                      className="!w-full"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {COLOR_PRESETS.map(color => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                          onClick={() => updateProperty('borderColor', color)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Border Style */}
              <div>
                <Label className="text-xs font-medium">Border Style</Label>
                <Select
                  value={properties.borderStyle || 'solid'}
                  onValueChange={(value) => updateProperty('borderStyle', value)}
                  disabled={!properties.borderWidth || properties.borderWidth === 0}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BORDER_STYLE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!properties.borderWidth || properties.borderWidth === 0) && (
                  <p className="text-[9px] text-gray-400 mt-1">
                    Set border width first to enable style selection
                  </p>
                )}
              </div>
            </>
          )}

          {/* Position - Hidden for page/site CSS */}
          {context !== 'page' && (
            <div>
              <Label className="text-xs font-medium">Position</Label>
              <Select
                value={properties.position || 'static'}
                onValueChange={(value) => updateProperty('position', value)}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Display - Only for section, row, column */}
          {(context === 'section' || context === 'row' || context === 'column') && (
            <div>
              <Label className="text-xs font-medium">Display</Label>
              <Select
                value={properties.display || 'default'}
                onValueChange={(value) => updateProperty('display', value === 'default' ? undefined : value)}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPLAY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Overflow - Only for section, row, column */}
          {(context === 'section' || context === 'row' || context === 'column') && (
            <div>
              <Label className="text-xs font-medium">Overflow</Label>
              <Select
                value={properties.overflow || 'default'}
                onValueChange={(value) => updateProperty('overflow', value === 'default' ? undefined : value)}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OVERFLOW_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Float - Only for section, row, column */}
          {(context === 'section' || context === 'row' || context === 'column') && (
            <div>
              <Label className="text-xs font-medium">Float</Label>
              <Select
                value={properties.float || 'none'}
                onValueChange={(value) => updateProperty('float', value)}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLOAT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Width - Hidden for page/site CSS */}
          {context !== 'page' && (
            <div>
              <Label className="text-xs font-medium">Width</Label>
            <div className="space-y-1 mt-1">
              <Select
                value={
                  !properties.width ? 'auto' :
                  properties.width === 'auto' ? 'auto' :
                  properties.width === '100%' ? '100%' :
                  properties.width === 'fit-content' ? 'fit-content' :
                  'custom'
                }
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setShowCustomWidthInput(true)
                    setCustomWidthInput('300px')
                    widthInitialized.current = true

                    // Preserve other dimension values from local state
                    const newProps = { ...properties }
                    if (customHeightInput) newProps.height = customHeightInput
                    if (customMinWidthInput) newProps.minWidth = customMinWidthInput
                    if (customMinHeightInput) newProps.minHeight = customMinHeightInput
                    newProps.width = '300px'

                    setProperties(newProps)
                    if (activeTab === 'simplified') {
                      const newCSS = generateCSS(newProps)
                      setRawCSS(newCSS)
                      onChange(newCSS)
                    }
                  } else {
                    setShowCustomWidthInput(false)
                    setCustomWidthInput('')
                    widthInitialized.current = false
                    updateProperty('width', value === 'auto' ? undefined : value)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIDTH_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCustomWidthInput && (
                <Input
                  value={customWidthInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomWidthInput(val)
                    // Update CSS immediately on every keystroke
                    if (val.trim()) {
                      // Preserve other dimension values from local state
                      const newProps = { ...properties }
                      if (customHeightInput) newProps.height = customHeightInput
                      if (customMinWidthInput) newProps.minWidth = customMinWidthInput
                      if (customMinHeightInput) newProps.minHeight = customMinHeightInput
                      newProps.width = val.trim()

                      setProperties(newProps)
                      if (activeTab === 'simplified') {
                        const newCSS = generateCSS(newProps)
                        setRawCSS(newCSS)
                        onChange(newCSS)
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    if (!val) {
                      setShowCustomWidthInput(false)
                      setCustomWidthInput('')
                      updateProperty('width', undefined)
                    }
                  }}
                  className="h-8 text-xs"
                  placeholder="e.g. 300px, 50%, 20rem"
                  type="text"
                />
              )}
            </div>
            </div>
          )}

          {/* Height - Hidden for page/site CSS */}
          {context !== 'page' && (
            <div>
              <Label className="text-xs font-medium">Height</Label>
            <div className="space-y-1 mt-1">
              <Select
                value={
                  !properties.height ? 'auto' :
                  properties.height === 'auto' ? 'auto' :
                  properties.height === '100%' ? '100%' :
                  properties.height === '100vh' ? '100vh' :
                  properties.height === 'fit-content' ? 'fit-content' :
                  'custom'
                }
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setShowCustomHeightInput(true)
                    setCustomHeightInput('100px')
                    heightInitialized.current = true

                    // Preserve other dimension values from local state
                    const newProps = { ...properties }
                    if (customWidthInput) newProps.width = customWidthInput
                    if (customMinWidthInput) newProps.minWidth = customMinWidthInput
                    if (customMinHeightInput) newProps.minHeight = customMinHeightInput
                    newProps.height = '100px'

                    setProperties(newProps)
                    if (activeTab === 'simplified') {
                      const newCSS = generateCSS(newProps)
                      setRawCSS(newCSS)
                      onChange(newCSS)
                    }
                  } else {
                    setShowCustomHeightInput(false)
                    setCustomHeightInput('')
                    heightInitialized.current = false
                    updateProperty('height', value === 'auto' ? undefined : value)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEIGHT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCustomHeightInput && (
                <Input
                  value={customHeightInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomHeightInput(val)
                    // Update CSS immediately on every keystroke
                    if (val.trim()) {
                      // Preserve other dimension values from local state
                      const newProps = { ...properties }
                      if (customWidthInput) newProps.width = customWidthInput
                      if (customMinWidthInput) newProps.minWidth = customMinWidthInput
                      if (customMinHeightInput) newProps.minHeight = customMinHeightInput
                      newProps.height = val.trim()

                      setProperties(newProps)
                      if (activeTab === 'simplified') {
                        const newCSS = generateCSS(newProps)
                        setRawCSS(newCSS)
                        onChange(newCSS)
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    if (!val) {
                      setShowCustomHeightInput(false)
                      setCustomHeightInput('')
                      updateProperty('height', undefined)
                    }
                  }}
                  className="h-8 text-xs"
                  placeholder="e.g. 100px, 50vh, 10rem"
                  type="text"
                />
              )}
            </div>
            </div>
          )}

          {/* Min-Width - Hidden for page/site CSS */}
          {context !== 'page' && (
            <div>
              <Label className="text-xs font-medium">Min-Width</Label>
            <div className="space-y-1 mt-1">
              <Select
                value={
                  !properties.minWidth ? 'none' :
                  properties.minWidth === 'none' ? 'none' :
                  properties.minWidth === '100%' ? '100%' :
                  properties.minWidth === 'fit-content' ? 'fit-content' :
                  'custom'
                }
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setShowCustomMinWidthInput(true)
                    setCustomMinWidthInput('200px')
                    minWidthInitialized.current = true

                    // Preserve other dimension values from local state
                    const newProps = { ...properties }
                    if (customWidthInput) newProps.width = customWidthInput
                    if (customHeightInput) newProps.height = customHeightInput
                    if (customMinHeightInput) newProps.minHeight = customMinHeightInput
                    newProps.minWidth = '200px'

                    setProperties(newProps)
                    if (activeTab === 'simplified') {
                      const newCSS = generateCSS(newProps)
                      setRawCSS(newCSS)
                      onChange(newCSS)
                    }
                  } else {
                    setShowCustomMinWidthInput(false)
                    setCustomMinWidthInput('')
                    minWidthInitialized.current = false
                    updateProperty('minWidth', value === 'none' ? undefined : value)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MIN_WIDTH_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCustomMinWidthInput && (
                <Input
                  value={customMinWidthInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomMinWidthInput(val)
                    // Update CSS immediately on every keystroke
                    if (val.trim()) {
                      // Preserve other dimension values from local state
                      const newProps = { ...properties }
                      if (customWidthInput) newProps.width = customWidthInput
                      if (customHeightInput) newProps.height = customHeightInput
                      if (customMinHeightInput) newProps.minHeight = customMinHeightInput
                      newProps.minWidth = val.trim()

                      setProperties(newProps)
                      if (activeTab === 'simplified') {
                        const newCSS = generateCSS(newProps)
                        setRawCSS(newCSS)
                        onChange(newCSS)
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    if (!val) {
                      setShowCustomMinWidthInput(false)
                      setCustomMinWidthInput('')
                      updateProperty('minWidth', undefined)
                    }
                  }}
                  className="h-8 text-xs"
                  placeholder="e.g. 200px, 30%, 15rem"
                  type="text"
                />
              )}
            </div>
            </div>
          )}

          {/* Min-Height - Hidden for page/site CSS */}
          {context !== 'page' && (
            <div>
              <Label className="text-xs font-medium">Min-Height</Label>
            <div className="space-y-1 mt-1">
              <Select
                value={
                  !properties.minHeight ? 'none' :
                  properties.minHeight === 'none' ? 'none' :
                  properties.minHeight === '100%' ? '100%' :
                  properties.minHeight === '100vh' ? '100vh' :
                  properties.minHeight === 'fit-content' ? 'fit-content' :
                  'custom'
                }
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setShowCustomMinHeightInput(true)
                    setCustomMinHeightInput('100px')
                    minHeightInitialized.current = true

                    // Preserve other dimension values from local state
                    const newProps = { ...properties }
                    if (customWidthInput) newProps.width = customWidthInput
                    if (customHeightInput) newProps.height = customHeightInput
                    if (customMinWidthInput) newProps.minWidth = customMinWidthInput
                    newProps.minHeight = '100px'

                    setProperties(newProps)
                    if (activeTab === 'simplified') {
                      const newCSS = generateCSS(newProps)
                      setRawCSS(newCSS)
                      onChange(newCSS)
                    }
                  } else {
                    setShowCustomMinHeightInput(false)
                    setCustomMinHeightInput('')
                    minHeightInitialized.current = false
                    updateProperty('minHeight', value === 'none' ? undefined : value)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MIN_HEIGHT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCustomMinHeightInput && (
                <Input
                  value={customMinHeightInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomMinHeightInput(val)
                    // Update CSS immediately on every keystroke
                    if (val.trim()) {
                      // Preserve other dimension values from local state
                      const newProps = { ...properties }
                      if (customWidthInput) newProps.width = customWidthInput
                      if (customHeightInput) newProps.height = customHeightInput
                      if (customMinWidthInput) newProps.minWidth = customMinWidthInput
                      newProps.minHeight = val.trim()

                      setProperties(newProps)
                      if (activeTab === 'simplified') {
                        const newCSS = generateCSS(newProps)
                        setRawCSS(newCSS)
                        onChange(newCSS)
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    if (!val) {
                      setShowCustomMinHeightInput(false)
                      setCustomMinHeightInput('')
                      updateProperty('minHeight', undefined)
                    }
                  }}
                  className="h-8 text-xs"
                  placeholder="e.g. 100px, 30vh, 10rem"
                  type="text"
                />
              )}
            </div>
            </div>
          )}

          {/* Background Image - Hidden for site CSS only (not page CSS) */}
          {!(context === 'page' && showFontSelector) && (
            <div>
              <Label className="text-xs font-medium">Background Image</Label>
            <div className="space-y-2 mt-1">
              <Input
                value={properties.backgroundImage || ''}
                onChange={(e) => updateProperty('backgroundImage', e.target.value)}
                className="h-8 text-xs"
                placeholder="https://example.com/image.jpg or choose from gallery"
              />
              <button
                onClick={() => setShowGalleryModal(true)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition flex items-center justify-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose from Gallery
              </button>
              {properties.backgroundImage && (
                  <>
                    <div className="p-2 border border-gray-200 rounded">
                      <p className="text-[9px] text-gray-600 mb-1">Preview:</p>
                      <div
                        className="w-full h-20 rounded bg-cover bg-center"
                        style={{ backgroundImage: `url('${properties.backgroundImage}')` }}
                      />
                    </div>

                    {/* Background Image Properties - Only show when image is set */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Background Size */}
                      <div>
                        <Label className="text-[9px] font-medium">Size</Label>
                        <Select
                          value={properties.backgroundSize || 'cover'}
                          onValueChange={(value) => updateProperty('backgroundSize', value)}
                        >
                          <SelectTrigger className="h-7 text-[10px] mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BACKGROUND_SIZE_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value} className="text-[10px]">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Background Repeat */}
                      <div>
                        <Label className="text-[9px] font-medium">Repeat</Label>
                        <Select
                          value={properties.backgroundRepeat || 'no-repeat'}
                          onValueChange={(value) => updateProperty('backgroundRepeat', value)}
                        >
                          <SelectTrigger className="h-7 text-[10px] mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BACKGROUND_REPEAT_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value} className="text-[10px]">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Background Position */}
                      <div>
                        <Label className="text-[9px] font-medium">Position</Label>
                        <Select
                          value={properties.backgroundPosition || 'center'}
                          onValueChange={(value) => updateProperty('backgroundPosition', value)}
                        >
                          <SelectTrigger className="h-7 text-[10px] mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BACKGROUND_POSITION_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value} className="text-[10px]">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Background Attachment */}
                      <div>
                        <Label className="text-[9px] font-medium">Attachment</Label>
                        <Select
                          value={properties.backgroundAttachment || 'scroll'}
                          onValueChange={(value) => updateProperty('backgroundAttachment', value)}
                        >
                          <SelectTrigger className="h-7 text-[10px] mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BACKGROUND_ATTACHMENT_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value} className="text-[10px]">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2">
                      Background image properties control how the image is displayed
                    </p>
                  </>
                )}

              {/* Gallery Modal */}
              {showGalleryModal && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
                  onClick={() => setShowGalleryModal(false)}
                >
                  <div
                    className="bg-white rounded-lg shadow-xl p-4 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Choose Background Image</h3>
                      <button
                        onClick={() => setShowGalleryModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {galleryImages && galleryImages.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-600 mb-2">Select an image from your gallery:</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {galleryImages.map((image) => (
                            <div
                              key={image.id}
                              onClick={() => setSelectedGalleryImagePath(`http://localhost:8000/${image.path}`)}
                              className={`cursor-pointer border-2 rounded p-1 transition ${
                                selectedGalleryImagePath === `http://localhost:8000/${image.path}`
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <img
                                src={`http://localhost:8000/${image.path}`}
                                alt={image.filename}
                                className="w-full h-24 object-cover rounded"
                              />
                              <p className="text-xs text-gray-600 mt-1 truncate">{image.filename}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm mb-4">
                        No images in gallery. Upload images first.
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowGalleryModal(false)
                          setSelectedGalleryImagePath(null)
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (selectedGalleryImagePath) {
                            updateProperty('backgroundImage', selectedGalleryImagePath)
                          }
                          setShowGalleryModal(false)
                          setSelectedGalleryImagePath(null)
                        }}
                        disabled={!selectedGalleryImagePath}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Select Image
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Header Settings Modal */}
          {showHeaderSettingsModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
              onClick={() => setShowHeaderSettingsModal(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Header Tag Settings (H1-H4)</h3>
                  <button
                    onClick={() => setShowHeaderSettingsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* H1 Settings */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-3">H1 (Main Heading)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium">Font Size (px)</Label>
                        <Input
                          type="number"
                          value={properties.h1FontSize || 32}
                          onChange={(e) => updateProperty('h1FontSize', parseInt(e.target.value))}
                          className="h-8 text-xs mt-1"
                          min="8"
                          max="96"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Padding (px)</Label>
                        <Input
                          type="number"
                          value={properties.h1Padding ?? 0}
                          onChange={(e) => updateProperty('h1Padding', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs mt-1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Margin (px)</Label>
                        <Input
                          type="number"
                          value={properties.h1Margin ?? 0}
                          onChange={(e) => updateProperty('h1Margin', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs mt-1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            className="w-8 h-8 rounded border-2 border-gray-300"
                            style={{ backgroundColor: properties.h1Color || '#000000' }}
                            onClick={() => setShowH1ColorPicker(!showH1ColorPicker)}
                          />
                          <Input
                            value={properties.h1Color || ''}
                            onChange={(e) => updateProperty('h1Color', e.target.value)}
                            className="h-8 text-xs flex-1"
                            placeholder="e.g., #000000"
                          />
                        </div>
                        {showH1ColorPicker && (
                          <div className="absolute z-10 mt-2">
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowH1ColorPicker(false)}
                            />
                            <HexColorPicker
                              color={properties.h1Color || '#000000'}
                              onChange={(color) => updateProperty('h1Color', color)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* H2 Settings */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-3">H2 (Section Heading)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium">Font Size (px)</Label>
                        <Input
                          type="number"
                          value={properties.h2FontSize || 24}
                          onChange={(e) => updateProperty('h2FontSize', parseInt(e.target.value))}
                          className="h-8 text-xs mt-1"
                          min="8"
                          max="96"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Padding (px)</Label>
                        <Input
                          type="number"
                          value={properties.h2Padding ?? 0}
                          onChange={(e) => updateProperty('h2Padding', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs mt-1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Margin (px)</Label>
                        <Input
                          type="number"
                          value={properties.h2Margin ?? 0}
                          onChange={(e) => updateProperty('h2Margin', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs mt-1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            className="w-8 h-8 rounded border-2 border-gray-300"
                            style={{ backgroundColor: properties.h2Color || '#000000' }}
                            onClick={() => setShowH2ColorPicker(!showH2ColorPicker)}
                          />
                          <Input
                            value={properties.h2Color || ''}
                            onChange={(e) => updateProperty('h2Color', e.target.value)}
                            className="h-8 text-xs flex-1"
                            placeholder="e.g., #000000"
                          />
                        </div>
                        {showH2ColorPicker && (
                          <div className="absolute z-10 mt-2">
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowH2ColorPicker(false)}
                            />
                            <HexColorPicker
                              color={properties.h2Color || '#000000'}
                              onChange={(color) => updateProperty('h2Color', color)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* H3 Settings */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-3">H3 (Subsection Heading)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium">Font Size (px)</Label>
                        <Input
                          type="number"
                          value={properties.h3FontSize || 20}
                          onChange={(e) => updateProperty('h3FontSize', parseInt(e.target.value))}
                          className="h-8 text-xs mt-1"
                          min="8"
                          max="96"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Padding (px)</Label>
                        <Input
                          type="number"
                          value={properties.h3Padding ?? 0}
                          onChange={(e) => updateProperty('h3Padding', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs mt-1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Margin (px)</Label>
                        <Input
                          type="number"
                          value={properties.h3Margin ?? 0}
                          onChange={(e) => updateProperty('h3Margin', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs mt-1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            className="w-8 h-8 rounded border-2 border-gray-300"
                            style={{ backgroundColor: properties.h3Color || '#000000' }}
                            onClick={() => setShowH3ColorPicker(!showH3ColorPicker)}
                          />
                          <Input
                            value={properties.h3Color || ''}
                            onChange={(e) => updateProperty('h3Color', e.target.value)}
                            className="h-8 text-xs flex-1"
                            placeholder="e.g., #000000"
                          />
                        </div>
                        {showH3ColorPicker && (
                          <div className="absolute z-10 mt-2">
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowH3ColorPicker(false)}
                            />
                            <HexColorPicker
                              color={properties.h3Color || '#000000'}
                              onChange={(color) => updateProperty('h3Color', color)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* H4 Settings */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-3">H4 (Minor Heading)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium">Font Size (px)</Label>
                        <Input
                          type="number"
                          value={properties.h4FontSize || 16}
                          onChange={(e) => updateProperty('h4FontSize', parseInt(e.target.value))}
                          className="h-8 text-xs mt-1"
                          min="8"
                          max="96"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Padding (px)</Label>
                        <Input
                          type="number"
                          value={properties.h4Padding ?? 0}
                          onChange={(e) => updateProperty('h4Padding', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs mt-1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Margin (px)</Label>
                        <Input
                          type="number"
                          value={properties.h4Margin ?? 0}
                          onChange={(e) => updateProperty('h4Margin', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs mt-1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            className="w-8 h-8 rounded border-2 border-gray-300"
                            style={{ backgroundColor: properties.h4Color || '#000000' }}
                            onClick={() => setShowH4ColorPicker(!showH4ColorPicker)}
                          />
                          <Input
                            value={properties.h4Color || ''}
                            onChange={(e) => updateProperty('h4Color', e.target.value)}
                            className="h-8 text-xs flex-1"
                            placeholder="e.g., #000000"
                          />
                        </div>
                        {showH4ColorPicker && (
                          <div className="absolute z-10 mt-2">
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowH4ColorPicker(false)}
                            />
                            <HexColorPicker
                              color={properties.h4Color || '#000000'}
                              onChange={(color) => updateProperty('h4Color', color)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paragraph Settings */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-4">
                  <h4 className="text-sm font-semibold mb-3">Paragraph (P)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Padding (Top Right Bottom Left)</Label>
                      <Input
                        type="text"
                        value={properties.pPadding || '10px 0px 0px 10px'}
                        onChange={(e) => updateProperty('pPadding', e.target.value)}
                        className="h-8 text-xs mt-1"
                        placeholder="e.g., 10px 0px 0px 10px"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Margin (px or '0 auto')</Label>
                      <Input
                        type="text"
                        value={properties.pMargin || ''}
                        onChange={(e) => updateProperty('pMargin', e.target.value)}
                        className="h-8 text-xs mt-1"
                        placeholder="e.g., 10px 0px or 0 auto"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowHeaderSettingsModal(false)}
                    className="flex-1 px-4 py-2 bg-[#5a7a54] text-white rounded text-sm hover:bg-[#4a6a44] transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hyperlink Styling Section - Only for Site/Page CSS */}
          {showFontSelector && (
            <div className="border-t pt-4 mt-4">
              <Label className="text-xs font-medium mb-3 block">Hyperlink Styles</Label>

            {/* Link Default Color */}
            <div className="mb-3">
              <Label className="text-[10px] font-medium text-gray-600">Link Color</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowLinkColorPicker(!showLinkColorPicker)}
                    className="w-full h-8 rounded border border-gray-300 flex items-center justify-between px-2 text-xs hover:border-gray-400 transition"
                    style={{ backgroundColor: properties.linkColor || 'transparent' }}
                  >
                    <span className="font-mono text-[10px]" style={{
                      color: properties.linkColor ? (getContrastColor(properties.linkColor)) : '#666'
                    }}>
                      {properties.linkColor || 'Default'}
                    </span>
                  </button>
                  {showLinkColorPicker && (
                    <div className="absolute z-10 mt-1">
                      <div className="fixed inset-0" onClick={() => setShowLinkColorPicker(false)} />
                      <div className="relative bg-white rounded-lg shadow-xl p-3" onClick={(e) => e.stopPropagation()}>
                        <HexColorPicker
                          color={properties.linkColor || '#0000EE'}
                          onChange={(color) => updateProperty('linkColor', color)}
                        />
                        <div className="grid grid-cols-5 gap-1 mt-2">
                          {COLOR_PRESETS.map(color => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                              onClick={() => updateProperty('linkColor', color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="text"
                  value={editingLinkColor ? linkColorInput : (properties.linkColor || '')}
                  onFocus={(e) => {
                    setEditingLinkColor(true)
                    setLinkColorInput(e.target.value)
                  }}
                  onChange={(e) => setLinkColorInput(e.target.value)}
                  onBlur={(e) => {
                    setEditingLinkColor(false)
                    if (e.target.value) {
                      updateProperty('linkColor', e.target.value)
                    }
                    setLinkColorInput('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.currentTarget.value) {
                        updateProperty('linkColor', e.currentTarget.value)
                      }
                      setEditingLinkColor(false)
                      setLinkColorInput('')
                      e.currentTarget.blur()
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="#0000EE"
                  className="w-24 h-8 text-[10px] font-mono"
                />
              </div>
            </div>

            {/* Link Text Decoration */}
            <div className="mb-3">
              <Label className="text-[10px] font-medium text-gray-600">Link Decoration</Label>
              <Select
                value={properties.linkTextDecoration || 'default'}
                onValueChange={(value) => updateProperty('linkTextDecoration', value === 'default' ? undefined : value)}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_DECORATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link Hover Color */}
            <div className="mb-3">
              <Label className="text-[10px] font-medium text-gray-600">Link Hover Color</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowLinkHoverColorPicker(!showLinkHoverColorPicker)}
                    className="w-full h-8 rounded border border-gray-300 flex items-center justify-between px-2 text-xs hover:border-gray-400 transition"
                    style={{ backgroundColor: properties.linkHoverColor || 'transparent' }}
                  >
                    <span className="font-mono text-[10px]" style={{
                      color: properties.linkHoverColor ? (getContrastColor(properties.linkHoverColor)) : '#666'
                    }}>
                      {properties.linkHoverColor || 'Default'}
                    </span>
                  </button>
                  {showLinkHoverColorPicker && (
                    <div className="absolute z-10 mt-1">
                      <div className="fixed inset-0" onClick={() => setShowLinkHoverColorPicker(false)} />
                      <div className="relative bg-white rounded-lg shadow-xl p-3" onClick={(e) => e.stopPropagation()}>
                        <HexColorPicker
                          color={properties.linkHoverColor || '#551A8B'}
                          onChange={(color) => updateProperty('linkHoverColor', color)}
                        />
                        <div className="grid grid-cols-5 gap-1 mt-2">
                          {COLOR_PRESETS.map(color => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                              onClick={() => updateProperty('linkHoverColor', color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="text"
                  value={editingLinkHoverColor ? linkHoverColorInput : (properties.linkHoverColor || '')}
                  onFocus={(e) => {
                    setEditingLinkHoverColor(true)
                    setLinkHoverColorInput(e.target.value)
                  }}
                  onChange={(e) => setLinkHoverColorInput(e.target.value)}
                  onBlur={(e) => {
                    setEditingLinkHoverColor(false)
                    if (e.target.value) {
                      updateProperty('linkHoverColor', e.target.value)
                    }
                    setLinkHoverColorInput('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.currentTarget.value) {
                        updateProperty('linkHoverColor', e.currentTarget.value)
                      }
                      setEditingLinkHoverColor(false)
                      setLinkHoverColorInput('')
                      e.currentTarget.blur()
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="#551A8B"
                  className="w-24 h-8 text-[10px] font-mono"
                />
              </div>
            </div>

            {/* Link Hover Decoration */}
            <div className="mb-3">
              <Label className="text-[10px] font-medium text-gray-600">Hover Decoration</Label>
              <Select
                value={properties.linkHoverTextDecoration || 'default'}
                onValueChange={(value) => updateProperty('linkHoverTextDecoration', value === 'default' ? undefined : value)}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_DECORATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link Visited Color */}
            <div className="mb-3">
              <Label className="text-[10px] font-medium text-gray-600">Visited Link Color</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowLinkVisitedColorPicker(!showLinkVisitedColorPicker)}
                    className="w-full h-8 rounded border border-gray-300 flex items-center justify-between px-2 text-xs hover:border-gray-400 transition"
                    style={{ backgroundColor: properties.linkVisitedColor || 'transparent' }}
                  >
                    <span className="font-mono text-[10px]" style={{
                      color: properties.linkVisitedColor ? (getContrastColor(properties.linkVisitedColor)) : '#666'
                    }}>
                      {properties.linkVisitedColor || 'Default'}
                    </span>
                  </button>
                  {showLinkVisitedColorPicker && (
                    <div className="absolute z-10 mt-1">
                      <div className="fixed inset-0" onClick={() => setShowLinkVisitedColorPicker(false)} />
                      <div className="relative bg-white rounded-lg shadow-xl p-3" onClick={(e) => e.stopPropagation()}>
                        <HexColorPicker
                          color={properties.linkVisitedColor || '#551A8B'}
                          onChange={(color) => updateProperty('linkVisitedColor', color)}
                        />
                        <div className="grid grid-cols-5 gap-1 mt-2">
                          {COLOR_PRESETS.map(color => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                              onClick={() => updateProperty('linkVisitedColor', color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="text"
                  value={editingLinkVisitedColor ? linkVisitedColorInput : (properties.linkVisitedColor || '')}
                  onFocus={(e) => {
                    setEditingLinkVisitedColor(true)
                    setLinkVisitedColorInput(e.target.value)
                  }}
                  onChange={(e) => setLinkVisitedColorInput(e.target.value)}
                  onBlur={(e) => {
                    setEditingLinkVisitedColor(false)
                    if (e.target.value) {
                      updateProperty('linkVisitedColor', e.target.value)
                    }
                    setLinkVisitedColorInput('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.currentTarget.value) {
                        updateProperty('linkVisitedColor', e.currentTarget.value)
                      }
                      setEditingLinkVisitedColor(false)
                      setLinkVisitedColorInput('')
                      e.currentTarget.blur()
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="#551A8B"
                  className="w-24 h-8 text-[10px] font-mono"
                />
              </div>
            </div>

            {/* Link Active Color */}
            <div className="mb-3">
              <Label className="text-[10px] font-medium text-gray-600">Active Link Color</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowLinkActiveColorPicker(!showLinkActiveColorPicker)}
                    className="w-full h-8 rounded border border-gray-300 flex items-center justify-between px-2 text-xs hover:border-gray-400 transition"
                    style={{ backgroundColor: properties.linkActiveColor || 'transparent' }}
                  >
                    <span className="font-mono text-[10px]" style={{
                      color: properties.linkActiveColor ? (getContrastColor(properties.linkActiveColor)) : '#666'
                    }}>
                      {properties.linkActiveColor || 'Default'}
                    </span>
                  </button>
                  {showLinkActiveColorPicker && (
                    <div className="absolute z-10 mt-1">
                      <div className="fixed inset-0" onClick={() => setShowLinkActiveColorPicker(false)} />
                      <div className="relative bg-white rounded-lg shadow-xl p-3" onClick={(e) => e.stopPropagation()}>
                        <HexColorPicker
                          color={properties.linkActiveColor || '#FF0000'}
                          onChange={(color) => updateProperty('linkActiveColor', color)}
                        />
                        <div className="grid grid-cols-5 gap-1 mt-2">
                          {COLOR_PRESETS.map(color => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                              onClick={() => updateProperty('linkActiveColor', color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="text"
                  value={editingLinkActiveColor ? linkActiveColorInput : (properties.linkActiveColor || '')}
                  onFocus={(e) => {
                    setEditingLinkActiveColor(true)
                    setLinkActiveColorInput(e.target.value)
                  }}
                  onChange={(e) => setLinkActiveColorInput(e.target.value)}
                  onBlur={(e) => {
                    setEditingLinkActiveColor(false)
                    if (e.target.value) {
                      updateProperty('linkActiveColor', e.target.value)
                    }
                    setLinkActiveColorInput('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.currentTarget.value) {
                        updateProperty('linkActiveColor', e.currentTarget.value)
                      }
                      setEditingLinkActiveColor(false)
                      setLinkActiveColorInput('')
                      e.currentTarget.blur()
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="#FF0000"
                  className="w-24 h-8 text-[10px] font-mono"
                />
              </div>
            </div>

            <p className="text-[9px] text-gray-400 mt-2">
              Customize hyperlink appearance for normal, hover, visited, and active states
            </p>
          </div>
        )}

        {/* Opacity Slider - Show for section and column */}
        {(context === 'section' || context === 'column') && (
          <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Opacity</Label>
                <span className="text-xs text-gray-500">{((properties.opacity ?? 1) * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[(properties.opacity ?? 1) * 100]}
                onValueChange={(value) => updateProperty('opacity', value[0] / 100)}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
              <p className="text-[9px] text-gray-400 mt-1">
                Adjust transparency (0% = invisible, 100% = fully visible)
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Label className="text-xs font-medium">Custom CSS</Label>
          <p className="text-[9px] text-gray-400 mb-2">
            Manual CSS edits will override simplified styling
          </p>
          <textarea
            value={rawCSS}
            onChange={(e) => handleRawCSSChange(e.target.value)}
            className="w-full h-48 p-2 border border-gray-300 rounded text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter custom CSS..."
            spellCheck={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
