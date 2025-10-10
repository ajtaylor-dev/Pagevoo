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
}

interface StyleEditorProps {
  value: string
  onChange: (css: string) => void
  context: 'page' | 'section' | 'row' | 'column'
  showFontSelector?: boolean
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

export function StyleEditor({ value, onChange, context, showFontSelector = false }: StyleEditorProps) {
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
    if (props.backgroundImage) css += `background-image: url('${props.backgroundImage}');\n`

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

          {/* Background Image */}
          <div>
            <Label className="text-xs font-medium">Background Image URL</Label>
            <Input
              value={properties.backgroundImage || ''}
              onChange={(e) => updateProperty('backgroundImage', e.target.value)}
              className="h-8 text-xs mt-1"
              placeholder="https://example.com/image.jpg"
            />
          </div>
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
