// CSS utility functions for Template Builder

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

/**
 * Check if a link is the active page
 */
export const isActivePage = (link: any, currentPageId: number): boolean => {
  if (typeof link !== 'object') return false
  return link.linkType === 'page' && link.pageId === currentPageId
}

/**
 * Generate CSS from section content_css and section_css with proper cascade
 */
export const generateContentCSS = (sections: TemplateSection[], pageCSS?: string, siteCSS?: string): string => {
  let css = ''

  // Helper to scope CSS to canvas and transform body selector
  const scopeToCanvas = (inputCSS: string): string => {
    if (!inputCSS || inputCSS.trim() === '') return ''

    console.log('[generateContentCSS] Input CSS:', inputCSS)

    // Extract body selector styles
    const bodyMatch = inputCSS.match(/body\s*\{([^}]+)\}/i)
    let processedCSS = inputCSS
    let bodyStyles = ''

    if (bodyMatch) {
      bodyStyles = bodyMatch[1]
      // Remove body block from original CSS
      processedCSS = inputCSS.replace(/body\s*\{[^}]+\}/gi, '')
    }

    // Extract link selector styles (a, a:hover, a:visited, a:active)
    let linkSelectors = ''
    const linkPatterns = [
      /a\s*\{([^}]+)\}/gi,
      /a:hover\s*\{([^}]+)\}/gi,
      /a:visited\s*\{([^}]+)\}/gi,
      /a:active\s*\{([^}]+)\}/gi
    ]

    linkPatterns.forEach((pattern) => {
      const matches = [...processedCSS.matchAll(pattern)]
      matches.forEach(match => {
        // Scope link selector to canvas
        const selector = match[0].match(/^[^{]+/)![0].trim()
        const styles = match[1]
        linkSelectors += `#template-canvas ${selector} {\n  ${styles.trim()}\n}\n\n`
        // Remove from processed CSS
        processedCSS = processedCSS.replace(match[0], '')
      })
    })

    // Extract header selector styles (h1-h4) and scope them to canvas
    let headerSelectors = ''
    const headerPatterns = [
      { tag: 'h1', pattern: /(?:\.row\s+)?h1\s*\{([^}]+)\}/gi },
      { tag: 'h2', pattern: /(?:\.row\s+)?h2\s*\{([^}]+)\}/gi },
      { tag: 'h3', pattern: /(?:\.row\s+)?h3\s*\{([^}]+)\}/gi },
      { tag: 'h4', pattern: /(?:\.row\s+)?h4\s*\{([^}]+)\}/gi },
      { tag: 'p', pattern: /(?:\.row\s+)?p\s*\{([^}]+)\}/gi }
    ]

    headerPatterns.forEach(({ tag, pattern }) => {
      const matches = [...processedCSS.matchAll(pattern)]
      matches.forEach(match => {
        const styles = match[1]
        // Scope to canvas AND .row (to avoid affecting builder UI)
        headerSelectors += `#template-canvas .row ${tag} {\n  ${styles.trim()}\n}\n\n`
        // Remove from processed CSS
        processedCSS = processedCSS.replace(match[0], '')
      })
    })

    // Parse paragraph selector and apply to canvas (for margin/padding)
    const pMatch = processedCSS.match(/p\s*\{([^}]+)\}/i)
    if (pMatch) {
      const pStyles = pMatch[1]
      processedCSS = processedCSS.replace(/p\s*\{[^}]+\}/gi, '')
      processedCSS += `#template-canvas .row p {\n  ${pStyles.trim()}\n}\n\n`
    }

    // Build result with proper order
    let result = processedCSS

    // Add body styles scoped to canvas
    if (bodyStyles.trim()) {
      result = `#template-canvas {\n  ${bodyStyles.trim()}\n}\n\n` + result
    }

    // Add link selectors (already scoped to canvas)
    if (linkSelectors.trim()) {
      result = linkSelectors + result
    }

    // Add header selectors (already scoped to canvas)
    if (headerSelectors.trim()) {
      result = headerSelectors + result
    }

    console.log('[generateContentCSS] Scoped CSS:', result)
    return result
  }

  // 1. Site CSS - Applied globally within canvas (lowest specificity)
  if (siteCSS) {
    css += `/* Site-wide styles */\n${scopeToCanvas(siteCSS)}\n\n`
  }

  // 2. Page CSS - Applied to all elements on the page (higher specificity than site)
  if (pageCSS) {
    css += `/* Page-specific styles */\n${scopeToCanvas(pageCSS)}\n\n`
  }

  // 3. Base text content styles for canvas (matching live preview)
  // NOTE: H1-H4 styles are now controlled exclusively via Site CSS > Header Settings modal
  // This ensures user's custom header styles are not overridden by hardcoded defaults
  css += `/* Text Content Styles */\n\n`

  css += `#template-canvas .row p {\n`
  css += `  margin: 1em 0;\n`
  css += `}\n\n`

  css += `#template-canvas .row ul, #template-canvas .row ol {\n`
  css += `  margin: 1em 0;\n`
  css += `  padding-left: 2.5em;\n`
  css += `  list-style-position: outside;\n`
  css += `}\n\n`

  css += `#template-canvas .row ul {\n`
  css += `  list-style-type: disc;\n`
  css += `}\n\n`

  css += `#template-canvas .row ol {\n`
  css += `  list-style-type: decimal;\n`
  css += `}\n\n`

  css += `#template-canvas .row li {\n`
  css += `  margin: 0.5em 0;\n`
  css += `  display: list-item;\n`
  css += `}\n\n`

  // 4. Section content CSS - per-section custom styling (highest specificity)
  sections.forEach(section => {
    const sectionId = section.section_id || `section-${section.id}`
    const content = section.content || {}
    const contentCSS = content.content_css

    if (contentCSS && typeof contentCSS === 'string' && contentCSS.trim()) {
      css += `/* Section ${sectionId} content styles */\n#${sectionId} {\n${contentCSS}}\n\n`
    }

    // Add row-level CSS if present
    if (content.rowCSS && typeof content.rowCSS === 'string' && content.rowCSS.trim()) {
      css += `/* Section ${sectionId} row styles */\n#${sectionId} .row {\n${content.rowCSS}}\n\n`
    }

    // Add column-level CSS if present
    if (content.columns && Array.isArray(content.columns)) {
      content.columns.forEach((col: any, colIdx: number) => {
        const columnCSS = col.columnCSS
        if (columnCSS && typeof columnCSS === 'string' && columnCSS.trim()) {
          // Apply to specific column using nth-of-type
          css += `/* Section ${sectionId} column ${colIdx + 1} styles */\n#template-canvas #${sectionId} .row > [class*="col-"]:nth-of-type(${colIdx + 1}) {\n${columnCSS}}\n\n`
        }

        // Apply typography styles from column
        if (col.typography) {
          const typo = col.typography
          let typographyCSS = ''

          if (typo.fontFamily) typographyCSS += `  font-family: ${typo.fontFamily};\n`
          if (typo.fontSize) typographyCSS += `  font-size: ${typo.fontSize}px;\n`
          if (typo.fontWeight) typographyCSS += `  font-weight: ${typo.fontWeight};\n`
          if (typo.lineHeight) typographyCSS += `  line-height: ${typo.lineHeight};\n`
          if (typo.letterSpacing) typographyCSS += `  letter-spacing: ${typo.letterSpacing}px;\n`
          if (typo.textAlign) typographyCSS += `  text-align: ${typo.textAlign};\n`
          if (typo.textTransform) typographyCSS += `  text-transform: ${typo.textTransform};\n`
          if (typo.color) typographyCSS += `  color: ${typo.color};\n`

          if (typographyCSS.trim()) {
            css += `/* Section ${sectionId} column ${parseInt(colIdx as any) + 1} typography styles */\n#template-canvas #${sectionId} .row > [class*="col-"]:nth-of-type(${parseInt(colIdx as any) + 1}) {\n${typographyCSS}}\n\n`
          }
        }
      })
    }
  })

  return css
}

/**
 * Extract font families from CSS for Google Fonts loading
 */
export const extractFontsFromCSS = (css: string): string[] => {
  if (!css) return []

  const fonts = new Set<string>()
  const fontFamilyRegex = /font-family:\s*['"]?([^'";]+)['"]?/gi

  let match
  while ((match = fontFamilyRegex.exec(css)) !== null) {
    const fontFamily = match[1].trim()
    // Skip generic font families
    if (!['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(fontFamily.toLowerCase())) {
      // Extract first font if comma-separated
      const firstFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '')
      fonts.add(firstFont)
    }
  }

  return Array.from(fonts)
}
