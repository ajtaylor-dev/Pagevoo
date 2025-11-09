// Default CSS functions
export const getDefaultColumnCSS = () => `border: 2px dashed #d1d5db;
border-radius: 0.5rem;
min-height: 200px;
padding: 1rem;`

export const getDefaultSectionCSS = () => `padding: 2rem;`

export const createDefaultContentCSS = (numColumns: number) => {
  const columns: { [key: string]: string } = {}
  for (let i = 0; i < numColumns; i++) {
    columns[i] = getDefaultColumnCSS()
  }
  return { columns }
}

// Core section templates
export const coreSections = [
  {
    type: 'grid-1x1',
    label: '1 Column',
    description: 'Single full-width column',
    cols: 1,
    rows: 1,
    colWidths: [12], // col-12 (100%)
    defaultContent: {
      columns: [{ content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>', colWidth: 12 }],
      content_css: createDefaultContentCSS(1),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-2x1',
    label: '2 Columns',
    description: 'Two equal columns (50/50)',
    cols: 2,
    rows: 1,
    colWidths: [6, 6], // 2x col-6 (50% each)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>', colWidth: 6 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>', colWidth: 6 }
      ],
      content_css: createDefaultContentCSS(2),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-3x1',
    label: '3 Columns',
    description: 'Three equal columns (33/33/33)',
    cols: 3,
    rows: 1,
    colWidths: [4, 4, 4], // 3x col-4 (33.33% each)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.</p>', colWidth: 4 },
        { content: '<p>Ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 4 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.</p>', colWidth: 4 }
      ],
      content_css: createDefaultContentCSS(3),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-4x1',
    label: '4 Columns',
    description: 'Four equal columns (25% each)',
    cols: 4,
    rows: 1,
    colWidths: [3, 3, 3, 3], // 4x col-3 (25% each)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>', colWidth: 3 },
        { content: '<p>Sed do eiusmod tempor incididunt ut labore et dolore.</p>', colWidth: 3 },
        { content: '<p>Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 3 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate.</p>', colWidth: 3 }
      ],
      content_css: createDefaultContentCSS(4),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-2x2',
    label: '2x2 Grid',
    description: 'Four boxes in 2x2 layout',
    cols: 2,
    rows: 2,
    colWidths: [6, 6, 6, 6], // 4x col-6 (2 rows of 50/50)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.</p>', colWidth: 6 },
        { content: '<p>Ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 6 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.</p>', colWidth: 6 },
        { content: '<p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.</p>', colWidth: 6 }
      ],
      content_css: createDefaultContentCSS(4),
      section_css: getDefaultSectionCSS()
    }
  },
  {
    type: 'grid-3x2',
    label: '3x2 Grid',
    description: 'Six boxes in 3x2 layout',
    cols: 3,
    rows: 2,
    colWidths: [4, 4, 4, 4, 4, 4], // 6x col-4 (2 rows of 33/33/33)
    defaultContent: {
      columns: [
        { content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>', colWidth: 4 },
        { content: '<p>Sed do eiusmod tempor incididunt ut labore et dolore.</p>', colWidth: 4 },
        { content: '<p>Ut enim ad minim veniam, quis nostrud exercitation.</p>', colWidth: 4 },
        { content: '<p>Duis aute irure dolor in reprehenderit in voluptate.</p>', colWidth: 4 },
        { content: '<p>Excepteur sint occaecat cupidatat non proident sunt.</p>', colWidth: 4 },
        { content: '<p>Culpa qui officia deserunt mollit anim id est laborum.</p>', colWidth: 4 }
      ],
      content_css: createDefaultContentCSS(6),
      section_css: getDefaultSectionCSS()
    }
  },
]

// Header/Navigation section templates
export const headerNavigationSections = [
  {
    type: 'navbar',
    label: 'Navigation Bar',
    description: 'Simple navigation with logo and links',
    position: 'top',
    defaultContent: {
      logo: 'Logo',
      logoWidth: 25,
      links: ['Home', 'About', 'Services', 'Contact'],
      position: 'static',
      content_css: '',
      containerStyle: {
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '0px',
        paddingRight: '0px',
        marginTop: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        marginRight: '0px',
        width: '100%',
        height: 'auto',
        background: '#ffffff'
      }
    }
  }
]

// Footer section templates
export const footerSections = [
  { type: 'footer-simple', label: 'Simple Footer', description: 'Basic footer with copyright text', position: 'bottom', defaultContent: { text: '© 2025 Company Name. All rights reserved.' } },
  {
    type: 'footer-columns',
    label: 'Column Footer',
    description: 'Multi-column footer with copyright',
    position: 'bottom',
    defaultContent: {
      columns: [
        { content: '<h3 style="text-align: center;">Company</h3><p style="text-align: center;">About Us</p><p style="text-align: center;">Contact</p>', colWidth: 4 },
        { content: '<h3 style="text-align: center;">Services</h3><p style="text-align: center;">Service 1</p><p style="text-align: center;">Service 2</p>', colWidth: 4 },
        { content: '<h3 style="text-align: center;">Connect</h3><p style="text-align: center;">Email</p><p style="text-align: center;">Phone</p>', colWidth: 4 }
      ],
      copyrightText: '© 2025 Company Name. All rights reserved.',
      content_css: createDefaultContentCSS(3),
      section_css: 'background-color: #172554; color: white; padding: 2rem;'
    }
  }
]
