// HTML and CSS Generator Utilities
// Extracted from TemplateBuilder to reduce file size

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: TemplateSection[]
  meta_description?: string
  page_css?: string
  page_id?: string
}

interface Template {
  id: number
  name: string
  template_slug?: string
  description: string
  business_type: string
  is_active: boolean
  pages: TemplatePage[]
  preview_image: string | null
  exclusive_to: 'pro' | 'niche' | null
  technologies: string[]
  features: string[]
  custom_css?: string
  images?: Array<{
    id: string
    filename: string
    path: string
    size: number
    uploaded_at: string
  }>
}

// Helper function to get section ID
const sectionId = (section: TemplateSection) => section.section_id || `section-${section.id}`

// Generate HTML source code from current page
export const generatePageHTML = (currentPage: TemplatePage | null): string => {
  if (!currentPage || !currentPage.sections) return ''

  const generateSectionHTML = (section: TemplateSection): string => {
    const content = section.content || {}
    const id = sectionId(section)

    // Grid sections (1x1, 2x1, 3x1, etc.)
    if (section.type.startsWith('grid-')) {
      const columns = content.columns || []
      const columnsHTML = columns.map((col: any, idx: number) => {
        const colWidth = col.colWidth || 12
        return `    <div class="col-${colWidth}">\n      ${col.content || `Column ${idx + 1}`}\n    </div>`
      }).join('\n')

      return `  <section id="${id}">\n    <div class="row">\n${columnsHTML}\n    </div>\n  </section>`
    }

    // Hero sections
    if (section.type === 'hero') {
      return `  <section id="${id}" class="hero">
    <h1>${content.title || 'Welcome'}</h1>
    <p>${content.subtitle || 'Your subtitle here'}</p>
    <button>${content.cta_text || 'Get Started'}</button>
  </section>`
    }

    // Gallery sections
    if (section.type === 'gallery') {
      return `  <section id="${id}" class="gallery">
    <h2>${content.heading || 'Gallery'}</h2>
    <div class="gallery-grid">
      <!-- Gallery images here -->
    </div>
  </section>`
    }

    // Contact form
    if (section.type === 'contact-form') {
      return `  <section id="${id}" class="contact-form">
    <h2>${content.heading || 'Contact Us'}</h2>
    <form>
      <input type="text" placeholder="Name" required>
      <input type="email" placeholder="Email" required>
      <textarea placeholder="Message" required></textarea>
      <button type="submit">Send</button>
    </form>
  </section>`
    }

    // Booking form
    if (section.type === 'booking-form') {
      return `  <section id="${id}" class="booking-form">
    <h2>${content.heading || 'Book Now'}</h2>
    <form>
      <input type="text" placeholder="Name" required>
      <input type="date" placeholder="Date" required>
      <input type="time" placeholder="Time" required>
      <button type="submit">Book</button>
    </form>
  </section>`
    }

    // Login box
    if (section.type === 'login-box') {
      return `  <section id="${id}" class="login-box">
    <h2>${content.heading || 'Sign In'}</h2>
    <form>
      <input type="email" placeholder="Email" required>
      <input type="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  </section>`
    }

    // Testimonials
    if (section.type === 'testimonials') {
      return `  <section id="${id}" class="testimonials">
    <h2>${content.heading || 'What Our Customers Say'}</h2>
    <div class="testimonials-grid">
      <!-- Testimonials here -->
    </div>
  </section>`
    }

    // Navbar sections
    if (section.type === 'navbar' || section.type.startsWith('navbar-')) {
      const links = content.links || []
      const layoutConfig = content.layoutConfig || {}
      const logoPosition = layoutConfig.logoPosition || 'left'
      const linksPosition = layoutConfig.linksPosition || 'right'
      const logoWidth = layoutConfig.logoWidth || content.logoWidth || 25

      // Generate links HTML with dropdown support
      const generateLinksHTML = (linksList: any[], isSubMenu = false): any => {
        return linksList.map((link: any, idx: number) => {
          if (typeof link === 'object') {
            const href = link.linkType === 'page' && link.pageId
              ? `#page-${link.pageId}`
              : link.url || '#'
            const label = link.label || 'Link'

            // Check for global button styling
            const hasButtonStyle = content.buttonStyling && content.buttonStyling.enabled
            const btnStyle = content.buttonStyling || {}

            // Check for sub-items (dropdown)
            if (link.subItems && link.subItems.length > 0) {
              const subItemsHTML = generateLinksHTML(link.subItems, true)
              const linkClass = hasButtonStyle ? 'nav-link nav-link-button' : 'nav-link'
              const buttonInlineStyles = hasButtonStyle ? ` style="background-color: ${btnStyle.backgroundColor}; color: ${btnStyle.textColor}; border: ${btnStyle.borderWidth || 0}px ${btnStyle.borderStyle || 'solid'} ${btnStyle.borderColor}; border-radius: ${btnStyle.borderRadius || 0}px; padding: ${btnStyle.paddingTop || 8}px ${btnStyle.paddingRight || 16}px ${btnStyle.paddingBottom || 8}px ${btnStyle.paddingLeft || 16}px; font-size: ${btnStyle.fontSize || 14}px; font-weight: ${btnStyle.fontWeight || '500'}; margin: ${btnStyle.marginTop || 5}px ${btnStyle.marginRight || 5}px ${btnStyle.marginBottom || 5}px ${btnStyle.marginLeft || 5}px; text-decoration: none; display: inline-block;"` : ''
              return `        <div class="nav-dropdown">
          <a href="${href}" class="${linkClass} dropdown-toggle"${buttonInlineStyles}>${label}</a>
          <div class="dropdown-menu">
${subItemsHTML}
          </div>
        </div>`
            }

            if (isSubMenu) {
              const linkClass = hasButtonStyle ? 'dropdown-item dropdown-item-button' : 'dropdown-item'
              const buttonInlineStyles = hasButtonStyle ? ` style="background-color: ${btnStyle.backgroundColor}; color: ${btnStyle.textColor}; border: ${btnStyle.borderWidth || 0}px ${btnStyle.borderStyle || 'solid'} ${btnStyle.borderColor}; border-radius: ${btnStyle.borderRadius || 0}px; padding: ${btnStyle.paddingTop || 8}px ${btnStyle.paddingRight || 16}px ${btnStyle.paddingBottom || 8}px ${btnStyle.paddingLeft || 16}px; font-size: ${btnStyle.fontSize || 14}px; font-weight: ${btnStyle.fontWeight || '500'}; margin: ${btnStyle.marginTop || 5}px ${btnStyle.marginRight || 5}px ${btnStyle.marginBottom || 5}px ${btnStyle.marginLeft || 5}px; text-decoration: none; display: inline-block;"` : ''
              return `            <a href="${href}" class="${linkClass}"${buttonInlineStyles}>${label}</a>`
            }

            const linkClass = hasButtonStyle ? 'nav-link nav-link-button' : 'nav-link'
            const buttonInlineStyles = hasButtonStyle ? ` style="background-color: ${btnStyle.backgroundColor}; color: ${btnStyle.textColor}; border: ${btnStyle.borderWidth || 0}px ${btnStyle.borderStyle || 'solid'} ${btnStyle.borderColor}; border-radius: ${btnStyle.borderRadius || 0}px; padding: ${btnStyle.paddingTop || 8}px ${btnStyle.paddingRight || 16}px ${btnStyle.paddingBottom || 8}px ${btnStyle.paddingLeft || 16}px; font-size: ${btnStyle.fontSize || 14}px; font-weight: ${btnStyle.fontWeight || '500'}; margin: ${btnStyle.marginTop || 0}px ${btnStyle.marginRight || 0}px ${btnStyle.marginBottom || 0}px ${btnStyle.marginLeft || 0}px; text-decoration: none; display: inline-block;"` : ''
            return `        <a href="${href}" class="${linkClass}"${buttonInlineStyles}>${label}</a>`
          }
          return isSubMenu
            ? `            <a href="#" class="dropdown-item">${link}</a>`
            : `        <a href="#" class="nav-link">${link}</a>`
        }).join('\n')
      }

      const linksHTML = generateLinksHTML(links)
      const logoHTML = `      <div class="nav-logo" style="width: ${logoPosition === 'center' ? '100%' : logoWidth + '%'}; text-align: ${logoPosition === 'center' ? 'center' : logoPosition === 'right' ? 'right' : 'left'};">${content.logo || 'Logo'}</div>`
      const navLinksHTML = `      <div class="nav-links" style="justify-content: ${linksPosition === 'center' ? 'center' : linksPosition === 'left' ? 'flex-start' : 'flex-end'};">
${linksHTML}
      </div>`

      // Arrange logo and links based on position
      let contentHTML = ''
      if (logoPosition === 'left' || logoPosition === 'center') {
        contentHTML = logoHTML + '\n' + navLinksHTML
      } else {
        contentHTML = navLinksHTML + '\n' + logoHTML
      }

      return `  <nav id="${id}" class="${section.type}">
    <div class="nav-container">
${contentHTML}
    </div>
  </nav>`
    }

    // Header sections
    if (section.type.startsWith('header-')) {
      const links = content.links || []
      let linksHTML = ''
      if (content.navigation !== false && links.length > 0) {
        linksHTML = links.map((link: any) => {
          if (typeof link === 'object') {
            const href = link.linkType === 'page' && link.pageId
              ? `#page-${link.pageId}`
              : link.url || '#'
            return `      <a href="${href}">${link.label || 'Link'}</a>`
          }
          return `      <a href="#">${link}</a>`
        }).join('\n')
      }

      if (section.type === 'header-centered') {
        return `  <header id="${id}" class="${section.type}">
    <div class="logo">${content.logo || 'Brand'}</div>
    ${content.tagline ? `<p class="tagline">${content.tagline}</p>` : ''}
    ${linksHTML ? `<div class="nav-links">\n${linksHTML}\n    </div>` : ''}
  </header>`
      } else if (section.type === 'header-split') {
        return `  <header id="${id}" class="${section.type}">
    <div class="logo">${content.logo || 'Logo'}</div>
    ${linksHTML ? `<div class="nav-links">\n${linksHTML}\n    </div>` : ''}
  </header>`
      } else {
        return `  <header id="${id}" class="${section.type}">
    <div class="logo">${content.logo || 'Company Name'}</div>
    ${content.tagline ? `<p class="tagline">${content.tagline}</p>` : ''}
  </header>`
      }
    }

    // Sidebar sections
    if (section.type.startsWith('sidebar-nav-')) {
      const links = content.links || ['Dashboard', 'Profile', 'Settings', 'Logout']
      const linksHTML = links.map((link: string) => `      <a href="#">${link}</a>`).join('\n')
      return `  <aside id="${id}" class="${section.type}">
    <nav>
${linksHTML}
    </nav>
  </aside>`
    }

    // Footer sections
    if (section.type.startsWith('footer-')) {
      if (section.type === 'footer-simple') {
        return `  <footer id="${id}" class="footer-simple">
    <p>${content.text || '© 2025 Company Name. All rights reserved.'}</p>
  </footer>`
      } else if (section.type === 'footer-columns') {
        const columns = content.columns || []
        const columnsHTML = columns.map((col: any) => {
          return `      <div class="footer-column">
        ${col.content || '<p>Column content</p>'}
      </div>`
        }).join('\n')
        const copyrightText = content.copyrightText || '© 2025 Company Name. All rights reserved.'
        return `  <footer id="${id}" class="footer-columns">
    <div class="footer-grid">
${columnsHTML}
    </div>
    <div class="footer-copyright">
      <p>${copyrightText}</p>
    </div>
  </footer>`
      }
    }

    // Default/unknown section type
    return `  <section id="${id}" class="${section.type}">
    <!-- ${section.type} section -->
  </section>`
  }

  // Generate HTML for all sections
  const sectionsHTML = currentPage.sections
    .sort((a, b) => a.order - b.order)
    .map(section => generateSectionHTML(section))
    .join('\n\n')

  // Generate complete HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentPage.name}</title>
  ${currentPage.meta_description ? `<meta name="description" content="${currentPage.meta_description}">` : ''}
  <style>
    /* Add your CSS styles here */
  </style>
</head>
<body>

${sectionsHTML}

</body>
</html>`
}

// Generate complete stylesheet (style.css)
export const generateStylesheet = (currentPage: TemplatePage | null, template: Template | null): string => {
  if (!currentPage || !template) return ''

  let css = ''

  // Header comment
  css += `/*\n * Generated Stylesheet for ${currentPage.name}\n * Generated by Pagevoo Template Builder\n */\n\n`

  // 1. Base Reset and Box Sizing
  css += `/* Base Reset */\n\n`
  css += `*, *::after, *::before {\n`
  css += `  box-sizing: border-box;\n`
  css += `  margin: 0;\n`
  css += `  padding: 0;\n`
  css += `  border-radius: 0;\n`
  css += `}\n\n`

  // Check if first section is a fixed/sticky navbar
  const firstSection = currentPage.sections && currentPage.sections.length > 0
    ? currentPage.sections.sort((a, b) => a.order - b.order)[0]
    : null
  const hasFixedNavbar = firstSection &&
    (firstSection.type === 'navbar' || firstSection.type.startsWith('navbar-')) &&
    firstSection.content?.position &&
    (firstSection.content.position === 'fixed' || firstSection.content.position === 'sticky')

  css += `body {\n`
  css += `  margin: 0;\n`
  css += `  padding: 0;\n`
  css += `  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n`
  css += `  line-height: 1.6;\n`
  // Add padding-top if there's a fixed/sticky navbar
  if (hasFixedNavbar) {
    css += `  padding-top: 80px; /* Space for fixed/sticky navbar */\n`
  }
  css += `}\n\n`

  // Remove top margin from first element to prevent gap at top of page
  css += `body > *:first-child {\n`
  css += `  margin-top: 0;\n`
  css += `}\n\n`

  // 2. Default link styles
  css += `a {\n`
  css += `  color: inherit;\n`
  css += `  text-decoration: none;\n`
  css += `}\n\n`

  // 3. Navigation Base Styles
  css += `/* Navigation Base Styles */\n\n`
  css += `nav.navbar, nav[class*="navbar-"], header[class*="header-"] {\n`
  css += `  padding: 16px 0;\n`
  css += `  background-color: #ffffff;\n`
  css += `  border-bottom: 2px solid #e5e7eb;\n`
  css += `  border-radius: 0;\n`
  css += `  position: relative;\n`
  css += `}\n\n`

  css += `.nav-container {\n`
  css += `  display: flex;\n`
  css += `  align-items: center;\n`
  css += `  justify-content: space-between;\n`
  css += `  flex-wrap: wrap;\n`
  css += `  gap: 8px;\n`
  css += `  width: 100%;\n`
  css += `  padding: 0 16px;\n`
  css += `}\n\n`

  css += `.nav-logo, .logo {\n`
  css += `  font-size: 1.25rem;\n`
  css += `  font-weight: bold;\n`
  css += `  min-width: 120px;\n`
  css += `}\n\n`

  css += `.nav-links {\n`
  css += `  display: flex;\n`
  css += `  gap: 1.5rem;\n`
  css += `  align-items: center;\n`
  css += `  flex-wrap: wrap;\n`
  css += `  flex: 1;\n`
  css += `}\n\n`

  css += `.nav-link {\n`
  css += `  text-decoration: none;\n`
  css += `  color: inherit;\n`
  css += `  transition: opacity 0.2s;\n`
  css += `}\n\n`

  css += `.nav-link:hover {\n`
  css += `  opacity: 0.75;\n`
  css += `}\n\n`

  css += `.nav-dropdown {\n`
  css += `  position: relative;\n`
  css += `}\n\n`

  css += `.dropdown-toggle {\n`
  css += `  cursor: pointer;\n`
  css += `  display: flex;\n`
  css += `  align-items: center;\n`
  css += `  gap: 0.25rem;\n`
  css += `}\n\n`

  css += `.dropdown-menu {\n`
  css += `  display: none;\n`
  css += `  position: absolute;\n`
  css += `  top: 100%;\n`
  css += `  left: 0;\n`
  css += `  margin-top: 0.25rem;\n`
  css += `  background-color: #ffffff;\n`
  css += `  border: 1px solid #e5e7eb;\n`
  css += `  border-radius: 0.25rem;\n`
  css += `  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n`
  css += `  padding: 0.5rem;\n`
  css += `  min-width: 150px;\n`
  css += `  z-index: 10;\n`
  css += `}\n\n`

  css += `.nav-dropdown.active .dropdown-menu {\n`
  css += `  display: block;\n`
  css += `}\n\n`

  css += `.dropdown-item {\n`
  css += `  display: block;\n`
  css += `  padding: 0.5rem 0.75rem;\n`
  css += `  text-decoration: none;\n`
  css += `  color: inherit;\n`
  css += `  border-radius: 0.25rem;\n`
  css += `  transition: background-color 0.2s;\n`
  css += `}\n\n`

  css += `.dropdown-item:hover {\n`
  css += `  background-color: #f3f4f6;\n`
  css += `}\n\n`

  css += `.mobile-menu-btn {\n`
  css += `  display: none;\n`
  css += `  background: none;\n`
  css += `  border: none;\n`
  css += `  cursor: pointer;\n`
  css += `  padding: 0.5rem;\n`
  css += `}\n\n`

  css += `.menu-icon {\n`
  css += `  width: 1.5rem;\n`
  css += `  height: 1.5rem;\n`
  css += `  color: #374151;\n`
  css += `}\n\n`

  css += `.mobile-menu {\n`
  css += `  display: none;\n`
  css += `  width: 100%;\n`
  css += `  background-color: #ffffff;\n`
  css += `  border-top: 1px solid #e5e7eb;\n`
  css += `  padding: 1rem;\n`
  css += `}\n\n`

  css += `.mobile-menu.active {\n`
  css += `  display: block;\n`
  css += `}\n\n`

  css += `.mobile-menu a {\n`
  css += `  display: block;\n`
  css += `  padding: 0.75rem;\n`
  css += `  border-radius: 0.375rem;\n`
  css += `}\n\n`

  css += `.mobile-menu a:hover {\n`
  css += `  background-color: #f3f4f6;\n`
  css += `}\n\n`

  // 4. Mobile Navigation
  css += `/* Mobile Navigation */\n\n`
  css += `@media (max-width: 767px) {\n`
  css += `  .desktop-menu {\n`
  css += `    display: none;\n`
  css += `  }\n\n`
  css += `  .mobile-menu-btn {\n`
  css += `    display: block;\n`
  css += `  }\n`
  css += `}\n\n`

  // 5. Responsive Grid System
  css += `/* Responsive Grid System */\n\n`
  css += `[class*="col-"] {\n`
  css += `  float: left;\n`
  css += `  width: 100%;\n`
  css += `}\n\n`

  css += `.row::after {\n`
  css += `  content: "";\n`
  css += `  clear: both;\n`
  css += `  display: table;\n`
  css += `}\n\n`

  // 6. Text Content Styles
  css += `/* Text Content Styles */\n\n`

  // Extract H1-H4 styles from Site CSS if they exist (custom header settings)
  let hasCustomHeaders = false
  if (template.custom_css) {
    const h1Match = template.custom_css.match(/(?:\.row\s+)?h1\s*\{([^}]+)\}/i)
    const h2Match = template.custom_css.match(/(?:\.row\s+)?h2\s*\{([^}]+)\}/i)
    const h3Match = template.custom_css.match(/(?:\.row\s+)?h3\s*\{([^}]+)\}/i)
    const h4Match = template.custom_css.match(/(?:\.row\s+)?h4\s*\{([^}]+)\}/i)

    if (h1Match) {
      const selector = h1Match[0].match(/^[^{]+/)![0].trim()
      css += `${selector} {\n${h1Match[1]}\n}\n\n`
      hasCustomHeaders = true
    }
    if (h2Match) {
      const selector = h2Match[0].match(/^[^{]+/)![0].trim()
      css += `${selector} {\n${h2Match[1]}\n}\n\n`
      hasCustomHeaders = true
    }
    if (h3Match) {
      const selector = h3Match[0].match(/^[^{]+/)![0].trim()
      css += `${selector} {\n${h3Match[1]}\n}\n\n`
      hasCustomHeaders = true
    }
    if (h4Match) {
      const selector = h4Match[0].match(/^[^{]+/)![0].trim()
      css += `${selector} {\n${h4Match[1]}\n}\n\n`
      hasCustomHeaders = true
    }
  }

  // If no custom header styles, use browser defaults (no hardcoded styles)
  // This allows the browser's natural heading hierarchy to work
  if (!hasCustomHeaders) {
    // Only add margin for spacing, let browser handle font-size and font-weight
    css += `.row h1, .row h2, .row h3, .row h4 {\n`
    css += `  margin: 0.67em 0;\n`
    css += `}\n\n`
  }

  // Extract Paragraph styles from Site CSS if they exist (custom paragraph settings)
  let hasCustomParagraph = false
  if (template.custom_css) {
    const pMatch = template.custom_css.match(/(?:\.row\s+)?p\s*\{([^}]+)\}/i)
    if (pMatch) {
      const selector = pMatch[0].match(/^[^{]+/)![0].trim()
      css += `${selector} {\n${pMatch[1]}\n}\n\n`
      hasCustomParagraph = true
    }
  }

  // If no custom paragraph styles, use default margin
  if (!hasCustomParagraph) {
    css += `.row p {\n`
    css += `  margin: 1em 0;\n`
    css += `}\n\n`
  }

  css += `.row ul, .row ol {\n`
  css += `  margin: 1em 0;\n`
  css += `  padding-left: 2.5em;\n`
  css += `  list-style-position: outside;\n`
  css += `}\n\n`

  css += `.row ul {\n`
  css += `  list-style-type: disc;\n`
  css += `}\n\n`

  css += `.row ol {\n`
  css += `  list-style-type: decimal;\n`
  css += `}\n\n`

  css += `.row li {\n`
  css += `  margin: 0.5em 0;\n`
  css += `  display: list-item;\n`
  css += `}\n\n`

  // 7. Site CSS (Global styles)
  if (template.custom_css && template.custom_css.trim()) {
    css += `/* Site-Wide Styles */\n\n`
    css += template.custom_css + '\n\n'
  }

  // 8. Page CSS (Page-specific styles)
  if (currentPage.page_css && currentPage.page_css.trim()) {
    css += `/* Page: ${currentPage.name} */\n\n`
    css += currentPage.page_css + '\n\n'
  }

  // 9. Section, Row, and Column CSS
  if (currentPage.sections && currentPage.sections.length > 0) {

    currentPage.sections
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        const sectionIdVal = section.section_id || `section-${section.id}`

        // Section CSS
        if (section.content?.section_css) {
          css += `/* Section: ${section.section_name || section.type} */\n`
          css += `#${sectionIdVal} {\n`
          css += `  ${section.content.section_css.trim()}\n`
          css += `}\n\n`
        }

        // Content CSS (row and columns)
        const contentCSS = section.content?.content_css
        if (contentCSS) {
          // Row CSS
          if (contentCSS.row) {
            css += `/* ${section.section_name || section.type} - Row */\n`
            css += `#${sectionIdVal} .row {\n`
            css += `  ${contentCSS.row.trim()}\n`
            css += `}\n\n`
          }

          // Column CSS
          if (contentCSS.columns) {
            const columns = section.content?.columns || []
            Object.entries(contentCSS.columns).forEach(([colIdx, colCSS]) => {
              if (colCSS) {
                const colWidth = columns[parseInt(colIdx)]?.colWidth || 12
                css += `/* ${section.section_name || section.type} - Column ${parseInt(colIdx) + 1} */\n`
                css += `#${sectionIdVal} .col-${colWidth}:nth-of-type(${parseInt(colIdx) + 1}) {\n`
                css += `  ${(colCSS as string).trim()}\n`
                css += `}\n\n`
              }
            })
          }
        }

        // Navigation/Header Styling (containerStyle, linkStyling)
        if (section.type === 'navbar' || section.type.startsWith('navbar-') || section.type.startsWith('header-')) {
          const content = section.content || {}

          // Container Style
          if (content.containerStyle || content.position) {
            const cs = content.containerStyle || {}
            const navPosition = content.position || 'static'
            css += `/* ${section.section_name || section.type} - Container */\n`
            css += `#${sectionIdVal} {\n`
            if (cs.background) css += `  background: ${cs.background};\n`
            if (cs.paddingTop) css += `  padding-top: ${cs.paddingTop};\n`
            if (cs.paddingRight) css += `  padding-right: ${cs.paddingRight};\n`
            if (cs.paddingBottom) css += `  padding-bottom: ${cs.paddingBottom};\n`
            if (cs.paddingLeft) css += `  padding-left: ${cs.paddingLeft};\n`
            if (cs.marginTop) css += `  margin-top: ${cs.marginTop};\n`
            if (cs.marginRight) css += `  margin-right: ${cs.marginRight};\n`
            if (cs.marginBottom) css += `  margin-bottom: ${cs.marginBottom};\n`
            if (cs.marginLeft) css += `  margin-left: ${cs.marginLeft};\n`
            if (cs.width) css += `  width: ${cs.width};\n`
            if (cs.height) css += `  height: ${cs.height};\n`
            if (cs.borderWidth) css += `  border-width: ${cs.borderWidth}px;\n`
            if (cs.borderStyle && cs.borderStyle !== 'none') css += `  border-style: ${cs.borderStyle};\n`
            if (cs.borderColor) css += `  border-color: ${cs.borderColor};\n`
            if (cs.borderRadius) css += `  border-radius: ${cs.borderRadius}px;\n`
            // Add position property
            if (navPosition && navPosition !== 'static') {
              css += `  position: ${navPosition};\n`
              if (navPosition === 'fixed' || navPosition === 'sticky') {
                css += `  top: 0;\n`
                css += `  left: 0;\n`
                css += `  right: 0;\n`
                css += `  z-index: 1000;\n`
              }
            }
            css += `}\n\n`
          }

          // Link Styling
          if (content.linkStyling) {
            const ls = content.linkStyling
            css += `/* ${section.section_name || section.type} - Links */\n`
            css += `#${sectionIdVal} a {\n`
            if (ls.textColor) css += `  color: ${ls.textColor};\n`
            if (ls.bgColor) css += `  background-color: ${ls.bgColor};\n`
            if (ls.fontSize) css += `  font-size: ${ls.fontSize}px;\n`
            css += `  text-decoration: none;\n`
            css += `}\n\n`

            css += `#${sectionIdVal} a:hover {\n`
            if (ls.textColorHover) css += `  color: ${ls.textColorHover};\n`
            if (ls.bgColorHover) css += `  background-color: ${ls.bgColorHover};\n`
            css += `}\n\n`
          }

          // Button-styled links hover states (global)
          if (content.buttonStyling && content.buttonStyling.enabled) {
            const btnStyle = content.buttonStyling
            css += `/* ${section.section_name || section.type} - Button Links Hover */\n`
            css += `#${sectionIdVal} .nav-link-button:hover,\n`
            css += `#${sectionIdVal} .dropdown-item-button:hover {\n`
            css += `  background-color: ${btnStyle.hoverBackgroundColor} !important;\n`
            css += `  color: ${btnStyle.hoverTextColor} !important;\n`
            css += `  transition: all 0.2s;\n`
            css += `}\n\n`

            // Remove gap when button styling is enabled (margin controls the spacing)
            css += `/* ${section.section_name || section.type} - Remove Default Gap */\n`
            css += `#${sectionIdVal} .nav-links {\n`
            css += `  gap: 0;\n`
            css += `}\n\n`
          }
        }

        // Footer styling
        if (section.type.startsWith('footer-')) {
          const sectionIdVal = section.section_id || `section-${section.id}`
          const content = section.content || {}

          if (section.type === 'footer-simple') {
            const sectionStyle = content.sectionStyle || {}
            css += `/* ${section.section_name || section.type} - Footer Simple */\n`
            css += `#${sectionIdVal} {\n`
            if (sectionStyle.background) css += `  background-color: ${sectionStyle.background};\n`
            else css += `  background-color: #1f2937;\n`
            if (sectionStyle.textColor) css += `  color: ${sectionStyle.textColor};\n`
            else css += `  color: white;\n`
            if (sectionStyle.padding) css += `  padding: ${sectionStyle.padding};\n`
            else css += `  padding: 2rem;\n`
            if (sectionStyle.textAlign) css += `  text-align: ${sectionStyle.textAlign};\n`
            else css += `  text-align: center;\n`
            css += `}\n\n`

            css += `#${sectionIdVal} p {\n`
            if (sectionStyle.fontSize) css += `  font-size: ${sectionStyle.fontSize};\n`
            else css += `  font-size: 0.875rem;\n`
            css += `}\n\n`
          }

          if (section.type === 'footer-columns') {
            const sectionStyle = content.sectionStyle || {}
            const copyrightStyle = content.copyrightStyle || {}

            css += `/* ${section.section_name || section.type} - Footer Columns */\n`
            css += `#${sectionIdVal} {\n`
            if (sectionStyle.background) css += `  background-color: ${sectionStyle.background};\n`
            else css += `  background-color: #172554;\n`
            if (sectionStyle.textColor) css += `  color: ${sectionStyle.textColor};\n`
            else css += `  color: white;\n`
            css += `}\n\n`

            css += `#${sectionIdVal} .footer-grid {\n`
            css += `  display: grid;\n`
            css += `  grid-template-columns: repeat(3, 1fr);\n`
            css += `  gap: 2rem;\n`
            css += `  padding: 3rem;\n`
            css += `  max-width: 1280px;\n`
            css += `  margin: 0 auto;\n`
            css += `}\n\n`

            css += `#${sectionIdVal} .footer-column {\n`
            css += `  min-height: 150px;\n`
            css += `  text-align: center;\n`
            css += `}\n\n`

            css += `#${sectionIdVal} .footer-copyright {\n`
            if (copyrightStyle.background) css += `  background-color: ${copyrightStyle.background};\n`
            else css += `  background-color: #171717;\n`
            if (copyrightStyle.padding) css += `  padding: ${copyrightStyle.padding};\n`
            else css += `  padding: 1.5rem;\n`
            if (copyrightStyle.borderTop) css += `  border-top: ${copyrightStyle.borderTop};\n`
            else css += `  border-top: 1px solid #374151;\n`
            css += `}\n\n`

            css += `#${sectionIdVal} .footer-copyright p {\n`
            if (copyrightStyle.fontSize) css += `  font-size: ${copyrightStyle.fontSize};\n`
            else css += `  font-size: 0.875rem;\n`
            css += `  text-align: center;\n`
            css += `  max-width: 1280px;\n`
            css += `  margin: 0 auto;\n`
            css += `  padding: 0 3rem;\n`
            css += `}\n\n`
          }
        }
      })
  }

  // 10. Responsive Breakpoints
  css += `/* Responsive Breakpoints */\n\n`
  css += `@media (min-width: 768px) {\n`
  css += `  .col-1 { width: 8.33%; }\n`
  css += `  .col-2 { width: 16.67%; }\n`
  css += `  .col-3 { width: 25%; }\n`
  css += `  .col-4 { width: 33.33%; }\n`
  css += `  .col-5 { width: 41.67%; }\n`
  css += `  .col-6 { width: 50%; }\n`
  css += `  .col-7 { width: 58.33%; }\n`
  css += `  .col-8 { width: 66.67%; }\n`
  css += `  .col-9 { width: 75%; }\n`
  css += `  .col-10 { width: 83.33%; }\n`
  css += `  .col-11 { width: 91.67%; }\n`
  css += `  .col-12 { width: 100%; }\n`
  css += `}\n\n`

  css += `@media (min-width: 1025px) {\n`
  css += `  .col-1 { width: 8.33%; }\n`
  css += `  .col-2 { width: 16.67%; }\n`
  css += `  .col-3 { width: 25%; }\n`
  css += `  .col-4 { width: 33.33%; }\n`
  css += `  .col-5 { width: 41.67%; }\n`
  css += `  .col-6 { width: 50%; }\n`
  css += `  .col-7 { width: 58.33%; }\n`
  css += `  .col-8 { width: 66.67%; }\n`
  css += `  .col-9 { width: 75%; }\n`
  css += `  .col-10 { width: 83.33%; }\n`
  css += `  .col-11 { width: 91.67%; }\n`
  css += `  .col-12 { width: 100%; }\n`
  css += `}\n`

  return css
}
