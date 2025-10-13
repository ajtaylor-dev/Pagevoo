import { useState, useEffect } from 'react'
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

    // Text color
    const colorMatch = css.match(/color:\s*([^;]+);?/i)
    if (colorMatch) props.color = colorMatch[1].trim()

    // Font size
    const fontSizeMatch = css.match(/font-size:\s*(\d+)px;?/i)
    if (fontSizeMatch) props.fontSize = parseInt(fontSizeMatch[1])

    // Padding
    const paddingMatch = css.match(/padding:\s*(\d+)px;?/i)
    if (paddingMatch) props.padding = parseInt(paddingMatch[1])

    // Margin
    const marginMatch = css.match(/margin:\s*(\d+)px;?/i)
    if (marginMatch) props.margin = parseInt(marginMatch[1])

    // Border radius
    const radiusMatch = css.match(/border-radius:\s*(\d+(?:\.\d+)?)(?:px|rem);?/i)
    if (radiusMatch) props.borderRadius = parseFloat(radiusMatch[1])

    // Border width
    const borderWidthMatch = css.match(/border-width:\s*(\d+)px;?/i)
    if (borderWidthMatch) props.borderWidth = parseInt(borderWidthMatch[1])

    // Border color
    const borderColorMatch = css.match(/border-color:\s*([^;]+);?/i)
    if (borderColorMatch) props.borderColor = borderColorMatch[1].trim()

    // Border style
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

    return props
  }

  // Generate CSS from visual properties
  const generateCSS = (props: StyleProperty): string => {
    let css = ''

    // For page/site context with font selector, apply font styles globally via body selector
    if (showFontSelector && context === 'page') {
      let bodyStyles = ''

      // Font family - always include if specified
      if (props.fontFamily) {
        bodyStyles += `  font-family: '${props.fontFamily}', sans-serif;\n`
      }

      // Font size - apply globally
      if (props.fontSize) {
        bodyStyles += `  font-size: ${props.fontSize}px;\n`
      }

      // Text color - apply globally
      if (props.color) {
        bodyStyles += `  color: ${props.color};\n`
      }

      if (bodyStyles) {
        css += `body {\n${bodyStyles}}\n\n`
      }
    }

    if (props.backgroundColor) css += `background-color: ${props.backgroundColor};\n`
    if (!showFontSelector || context !== 'page') {
      // Only add these if not in page context (otherwise they're in body{})
      if (props.fontFamily) css += `font-family: '${props.fontFamily}', sans-serif;\n`
      if (props.color) css += `color: ${props.color};\n`
      if (props.fontSize) css += `font-size: ${props.fontSize}px;\n`
    }
    if (props.padding !== undefined) css += `padding: ${props.padding}px;\n`
    if (props.margin !== undefined) css += `margin: ${props.margin}px;\n`
    if (props.borderRadius !== undefined) css += `border-radius: ${props.borderRadius}px;\n`
    if (props.borderWidth !== undefined) css += `border-width: ${props.borderWidth}px;\n`
    if (props.borderColor) css += `border-color: ${props.borderColor};\n`
    if (props.borderStyle) css += `border-style: ${props.borderStyle};\n`
    if (props.position && props.position !== 'static') css += `position: ${props.position};\n`
    if (props.backgroundImage) {
      css += `background-image: url('${props.backgroundImage}');\n`
      if (props.backgroundSize) css += `background-size: ${props.backgroundSize};\n`
      if (props.backgroundPosition) css += `background-position: ${props.backgroundPosition};\n`
      if (props.backgroundRepeat) css += `background-repeat: ${props.backgroundRepeat};\n`
      if (props.backgroundAttachment) css += `background-attachment: ${props.backgroundAttachment};\n`
    }

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
      backgroundImage: parsed.backgroundImage,
      backgroundSize: parsed.backgroundSize,
      backgroundPosition: parsed.backgroundPosition,
      backgroundRepeat: parsed.backgroundRepeat,
      backgroundAttachment: parsed.backgroundAttachment,
    })
    setRawCSS(value)
  }, [value])

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

          {/* Background Color */}
          <div>
            <Label className="text-xs font-medium">Background Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <button
                className="w-8 h-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: properties.backgroundColor || '#FFFFFF' }}
                onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
              />
              <Input
                value={properties.backgroundColor || ''}
                onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                className="h-8 text-xs flex-1"
                placeholder="e.g., #FFFFFF"
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
              <Label className="text-xs font-medium">Padding</Label>
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
              <Label className="text-xs font-medium">Margin</Label>
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
              </div>
            </>
          )}

          {/* Position */}
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

          {/* Background Image - Hide for site/page context */}
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

                    {/* Background Image Properties */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Background Size */}
                      <div>
                        <Label className="text-[9px] font-medium">Size</Label>
                        <Select
                          value={properties.backgroundSize || 'auto'}
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
                  </>
                )}
              </div>

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
