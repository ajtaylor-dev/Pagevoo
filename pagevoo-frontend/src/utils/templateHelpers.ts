interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: any[]
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

// Helper to get link href from link object
export const getLinkHref = (link: any, template?: Template | null): string => {
  // Handle old string format
  if (typeof link === 'string') return '#'

  // Handle new object format
  if (link.linkType === 'url') {
    return link.url || '#'
  } else if (link.linkType === 'page' && link.pageId) {
    const page = template?.pages.find(p => p.id === link.pageId)
    if (page) {
      return page.is_homepage ? '/' : `/${page.slug || page.name.toLowerCase().replace(/\s+/g, '-')}`
    }
  }
  return '#'
}

// Helper to get link label
export const getLinkLabel = (link: any): string => {
  return typeof link === 'string' ? link : (link.label || 'Link')
}

// Get canvas width based on viewport
export const getCanvasWidth = (viewport: 'desktop' | 'tablet' | 'mobile'): string => {
  if (viewport === 'mobile') return '375px'
  if (viewport === 'tablet') return '768px'
  return '100%'
}

// Handle add predefined page
export const handleAddPredefinedPage = (
  pageConfig: any,
  template: Template | null,
  setTemplate: (template: Template) => void,
  setCurrentPage: (page: TemplatePage) => void
) => {
  if (!template) return

  const slug = pageConfig.name.toLowerCase().replace(/\s+/g, '-')
  const newPage: TemplatePage = {
    id: Date.now(),
    name: pageConfig.name,
    slug: slug,
    is_homepage: template.pages.length === 0,
    order: template.pages.length,
    sections: pageConfig.sections.map((s: any, idx: number) => ({
      id: Date.now() + idx,
      type: s.type,
      content: s.content,
      order: idx
    }))
  }

  setTemplate({
    ...template,
    pages: [...template.pages, newPage]
  })
  setCurrentPage(newPage)
}
