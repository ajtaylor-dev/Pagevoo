import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/services/api'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
}

interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: TemplateSection[]
}

interface Template {
  id: number
  name: string
  description: string
  business_type: string
  is_active: boolean
  pages: TemplatePage[]
  preview_image: string | null
  exclusive_to: 'pro' | 'niche' | null
  technologies: string[]
  features: string[]
  custom_css?: string
}

export default function TemplateBuilder() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('id')

  const [template, setTemplate] = useState<Template | null>(null)
  const [currentPage, setCurrentPage] = useState<TemplatePage | null>(null)
  const [selectedSection, setSelectedSection] = useState<TemplateSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editSubTab, setEditSubTab] = useState<'settings' | 'css'>('settings')
  const [showAddPageModal, setShowAddPageModal] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [showExportSectionModal, setShowExportSectionModal] = useState(false)
  const [showExportPageModal, setShowExportPageModal] = useState(false)
  const [sectionToExport, setSectionToExport] = useState<TemplateSection | null>(null)
  const [exportedSections, setExportedSections] = useState<any[]>([])
  const [exportedPages, setExportedPages] = useState<any[]>([])
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [hoveredSection, setHoveredSection] = useState<number | null>(null)

  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(320)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  const leftSidebarRef = useRef<HTMLDivElement>(null)
  const rightSidebarRef = useRef<HTMLDivElement>(null)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const editMenuRef = useRef<HTMLDivElement>(null)

  // Load template data if ID is present, or create blank template
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) {
        // Create a blank template for new template creation
        setTemplate({
          id: 0,
          name: 'Untitled Template',
          description: '',
          business_type: 'restaurant',
          is_active: true,
          pages: [],
          preview_image: null,
          exclusive_to: null,
          technologies: [],
          features: []
        })
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await api.getTemplate(parseInt(templateId))
        if (response.success && response.data) {
          setTemplate(response.data)
          // Set current page to homepage or first page
          const homepage = response.data.pages?.find((p: TemplatePage) => p.is_homepage) || response.data.pages?.[0]
          setCurrentPage(homepage || null)
        }
      } catch (error) {
        console.error('Failed to load template:', error)
        alert('Failed to load template')
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [templateId])

  // VSCode-style menu behavior: click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (fileMenuRef.current && !fileMenuRef.current.contains(target)) {
        setShowFileMenu(false)
      }
      if (editMenuRef.current && !editMenuRef.current.contains(target)) {
        setShowEditMenu(false)
      }
    }

    if (showFileMenu || showEditMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFileMenu, showEditMenu])

  const handleSaveTemplate = async () => {
    if (!template) {
      alert('No template loaded')
      return
    }

    setLoading(true)
    try {
      if (template.id === 0) {
        // Create new template with pages and sections
        const response = await api.createTemplate({
          name: template.name,
          description: template.description,
          business_type: template.business_type,
          is_active: template.is_active,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
          custom_css: template.custom_css,
          pages: template.pages.map(page => ({
            name: page.name,
            slug: page.slug,
            is_homepage: page.is_homepage,
            order: page.order,
            sections: page.sections.map(section => ({
              type: section.type,
              content: section.content,
              order: section.order
            }))
          }))
        })
        if (response.success && response.data) {
          alert('Template created successfully!')
          // Redirect to the new template
          window.location.href = `/template-builder?id=${response.data.id}`
        }
      } else {
        // Update existing template (metadata and pages/sections)
        const response = await api.updateTemplate(template.id, {
          name: template.name,
          description: template.description,
          business_type: template.business_type,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
          custom_css: template.custom_css,
          pages: template.pages.map(page => ({
            id: page.id > 1000000000000 ? undefined : page.id, // Don't send temporary IDs (from Date.now())
            name: page.name,
            slug: page.slug,
            is_homepage: page.is_homepage,
            order: page.order,
            sections: page.sections.map(section => ({
              id: section.id > 1000000000000 ? undefined : section.id,
              type: section.type,
              content: section.content,
              order: section.order
            }))
          }))
        })
        if (response.success) {
          alert('Template saved successfully!')
          // Reload to get proper IDs from server
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !template) return

    // Check if template is saved first
    if (template.id === 0) {
      alert('Please save the template first before uploading an image')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('preview_image', file)

      const response = await api.uploadTemplateImage(template.id, formData)
      if (response.success && response.data) {
        setTemplate({ ...template, preview_image: response.data.preview_image })
        alert('Preview image uploaded successfully')
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload preview image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Page Management Functions
  const handleAddPage = () => {
    if (!template || !newPageName.trim()) return

    const slug = newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const newPage: TemplatePage = {
      id: Date.now(), // Temporary ID
      name: newPageName,
      slug: slug,
      is_homepage: template.pages.length === 0, // First page is homepage
      order: template.pages.length,
      sections: []
    }

    setTemplate({
      ...template,
      pages: [...template.pages, newPage]
    })
    setCurrentPage(newPage)
    setNewPageName('')
    setShowAddPageModal(false)
  }

  const handleDeletePage = (pageId: number) => {
    if (!template) return
    if (template.pages.length === 1) {
      alert('Cannot delete the only page')
      return
    }
    if (!confirm('Are you sure you want to delete this page?')) return

    const updatedPages = template.pages.filter(p => p.id !== pageId)
    setTemplate({ ...template, pages: updatedPages })

    // If current page was deleted, switch to first page
    if (currentPage?.id === pageId) {
      setCurrentPage(updatedPages[0] || null)
    }
  }

  const handleMovePage = (pageId: number, direction: 'up' | 'down') => {
    if (!template) return

    const index = template.pages.findIndex(p => p.id === pageId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === template.pages.length - 1) return

    const newPages = [...template.pages]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    // Swap
    ;[newPages[index], newPages[swapIndex]] = [newPages[swapIndex], newPages[index]]

    // Update order values
    newPages.forEach((page, idx) => {
      page.order = idx
    })

    setTemplate({ ...template, pages: newPages })
  }

  const handleSetHomepage = (pageId: number) => {
    if (!template) return

    const updatedPages = template.pages.map(p => ({
      ...p,
      is_homepage: p.id === pageId
    }))

    setTemplate({ ...template, pages: updatedPages })
  }

  // Section Management Functions
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['core'])

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category))
    } else {
      setExpandedCategories([...expandedCategories, category])
    }
  }

  const coreSections = [
    { type: 'grid-1x1', label: '1 Column', description: 'Single full-width column for content', cols: 1, rows: 1, defaultContent: { columns: [{ content: 'Column content' }] } },
    { type: 'grid-2x1', label: '2 Columns', description: 'Two equal columns side by side', cols: 2, rows: 1, defaultContent: { columns: [{ content: 'Column 1' }, { content: 'Column 2' }] } },
    { type: 'grid-3x1', label: '3 Columns', description: 'Three equal columns in a row', cols: 3, rows: 1, defaultContent: { columns: [{ content: 'Column 1' }, { content: 'Column 2' }, { content: 'Column 3' }] } },
    { type: 'grid-4x1', label: '4 Columns', description: 'Four equal columns in a row', cols: 4, rows: 1, defaultContent: { columns: [{ content: 'Col 1' }, { content: 'Col 2' }, { content: 'Col 3' }, { content: 'Col 4' }] } },
    { type: 'grid-2x2', label: '2x2 Grid', description: 'Four boxes in a 2x2 grid layout', cols: 2, rows: 2, defaultContent: { columns: [{ content: 'Box 1' }, { content: 'Box 2' }, { content: 'Box 3' }, { content: 'Box 4' }] } },
    { type: 'grid-3x2', label: '3x2 Grid', description: 'Six boxes in a 3x2 grid layout', cols: 3, rows: 2, defaultContent: { columns: Array(6).fill(null).map((_, i) => ({ content: `Box ${i + 1}` })) } },
  ]

  const headerNavigationSections = [
    // Top-locked navigation bars
    { type: 'navbar-basic', label: 'Basic Navbar', description: 'Simple horizontal navigation bar with links', position: 'top', defaultContent: { logo: 'Logo', links: ['Home', 'About', 'Services', 'Contact'] } },
    { type: 'navbar-dropdown', label: 'Dropdown Nav', description: 'Navigation bar with dropdown menus', position: 'top', defaultContent: { logo: 'Logo', links: ['Home', 'Services', 'About', 'Contact'] } },
    { type: 'navbar-sticky', label: 'Sticky Navbar', description: 'Navigation that sticks to top on scroll', position: 'top', defaultContent: { logo: 'Logo', links: ['Home', 'About', 'Contact'] } },
    { type: 'header-simple', label: 'Simple Header', description: 'Clean header with logo and tagline', position: 'top', defaultContent: { logo: 'Company Name', tagline: 'Your tagline here' } },
    { type: 'header-centered', label: 'Centered Header', description: 'Centered logo with navigation below', position: 'top', defaultContent: { logo: 'Brand', navigation: true } },
    { type: 'header-split', label: 'Split Header', description: 'Logo left, navigation right layout', position: 'top', defaultContent: { logo: 'Logo', links: ['Home', 'About', 'Contact'] } },
    // Sidebar navigation (can move left/right)
    { type: 'sidebar-nav-left', label: 'Sidebar Nav (Left)', description: 'Left-side vertical navigation menu', position: 'left', defaultContent: { links: ['Dashboard', 'Profile', 'Settings', 'Logout'], positioned: 'permanently-fixed', fullHeight: true } },
    { type: 'sidebar-nav-right', label: 'Sidebar Nav (Right)', description: 'Right-side vertical navigation menu', position: 'right', defaultContent: { links: ['Dashboard', 'Profile', 'Settings', 'Logout'], positioned: 'permanently-fixed', fullHeight: true } },
  ]

  const footerSections = [
    { type: 'footer-simple', label: 'Simple Footer', description: 'Basic footer with copyright text', position: 'bottom', defaultContent: { text: '© 2025 Company Name. All rights reserved.' } },
    { type: 'footer-columns', label: 'Column Footer', description: 'Multi-column footer with links', position: 'bottom', defaultContent: { columns: [{ title: 'Company', links: ['About', 'Contact'] }, { title: 'Services', links: ['Service 1', 'Service 2'] }] } },
    { type: 'footer-social', label: 'Social Footer', description: 'Footer with social media icons', position: 'bottom', defaultContent: { text: '© 2025 Company', socials: ['Facebook', 'Twitter', 'Instagram'] } },
  ]

  const specialSections = [
    { type: 'hero', label: 'Hero Banner', description: 'Large banner with heading and call-to-action', defaultContent: { title: 'Welcome', subtitle: 'Your subtitle here', cta_text: 'Get Started' } },
    { type: 'gallery', label: 'Image Gallery', description: 'Grid of images with lightbox', defaultContent: { heading: 'Gallery', images: [] } },
    { type: 'contact-form', label: 'Contact Form', description: 'Form with name, email, and message fields', defaultContent: { heading: 'Contact Us', fields: ['name', 'email', 'message'] } },
    { type: 'booking-form', label: 'Booking Form', description: 'Appointment booking form with date/time', defaultContent: { heading: 'Book Now', fields: ['name', 'date', 'time'] } },
    { type: 'login-box', label: 'Login Box', description: 'User authentication login form', defaultContent: { heading: 'Sign In' } },
    { type: 'testimonials', label: 'Testimonials', description: 'Customer reviews and feedback display', defaultContent: { heading: 'What Our Customers Say', testimonials: [] } },
  ]

  const predefinedPages = [
    { name: 'About Us', description: 'Standard about page with company info', sections: [{ type: 'hero', content: { title: 'About Us', subtitle: 'Learn more about our company' } }, { type: 'grid-2x1', content: { columns: [{ content: 'Our Story' }, { content: 'Our Mission' }] } }] },
    { name: 'Contact', description: 'Contact page with form and info', sections: [{ type: 'hero', content: { title: 'Contact Us', subtitle: 'Get in touch' } }, { type: 'contact-form', content: { heading: 'Send us a message' } }] },
    { name: 'Services', description: 'Services overview page', sections: [{ type: 'hero', content: { title: 'Our Services', subtitle: 'What we offer' } }, { type: 'grid-3x1', content: { columns: [{ content: 'Service 1' }, { content: 'Service 2' }, { content: 'Service 3' }] } }] },
  ]

  const renderSectionThumbnail = (section: any) => {
    if (section.cols) {
      // Core grid section - render visual thumbnail
      const gridItems = Array(section.cols * section.rows).fill(null)
      return (
        <div className="w-full aspect-video bg-white rounded border border-gray-300 p-1 flex items-center justify-center">
          <div
            className="grid gap-0.5 w-full h-full"
            style={{ gridTemplateColumns: `repeat(${section.cols}, 1fr)` }}
          >
            {gridItems.map((_, idx) => (
              <div key={idx} className="bg-amber-100 rounded-sm border border-amber-200"></div>
            ))}
          </div>
        </div>
      )
    } else {
      // Special section - show icon placeholder
      return (
        <div className="w-full aspect-video bg-gradient-to-br from-amber-50 to-amber-100 rounded border border-amber-200 flex items-center justify-center">
          <div className="text-2xl font-bold text-amber-600">
            {section.label.charAt(0)}
          </div>
        </div>
      )
    }
  }

  const handleExportSection = () => {
    if (!selectedSection) return
    setSectionToExport(selectedSection)
    setShowExportSectionModal(true)
  }

  const handleSaveExportedSection = (name: string, description: string, thumbnail: string | null) => {
    if (!sectionToExport) return

    const exportedSection = {
      id: Date.now(),
      name,
      description,
      thumbnail,
      type: sectionToExport.type,
      content: sectionToExport.content,
      label: name,
      defaultContent: sectionToExport.content
    }

    setExportedSections([...exportedSections, exportedSection])
    setShowExportSectionModal(false)
    setSectionToExport(null)
    alert('Section exported successfully!')
  }

  const handleExportPage = () => {
    if (!currentPage) return
    setShowExportPageModal(true)
  }

  const handleSaveExportedPage = (name: string, description: string, thumbnail: string | null) => {
    if (!currentPage) return

    const exportedPage = {
      id: Date.now(),
      name,
      description,
      thumbnail,
      sections: currentPage.sections.map(s => ({
        type: s.type,
        content: s.content
      }))
    }

    setExportedPages([...exportedPages, exportedPage])
    setShowExportPageModal(false)
    alert('Page exported successfully!')
  }

  const handleAddPredefinedPage = (pageConfig: any) => {
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

  const handleAddSection = (sectionConfig: any) => {
    if (!template || !currentPage) {
      alert('Please create a page first')
      return
    }

    // Check if this is a top-positioned section (navbar/header/sidebar)
    const isTopSection = sectionConfig.type.startsWith('navbar-') ||
                        sectionConfig.type.startsWith('header-') ||
                        sectionConfig.type.startsWith('sidebar-nav-')

    // Check if this is a footer section
    const isFooterSection = sectionConfig.type.startsWith('footer-')

    const newSection: TemplateSection = {
      id: Date.now(),
      type: sectionConfig.type,
      content: sectionConfig.defaultContent,
      order: isTopSection ? 0 : currentPage.sections.length
    }

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        if (isTopSection) {
          // Find the position after existing navbars/headers/sidebars
          let insertPosition = 0
          for (let i = 0; i < p.sections.length; i++) {
            const section = p.sections[i]
            if (section.type.startsWith('navbar-') ||
                section.type.startsWith('header-') ||
                section.type.startsWith('sidebar-nav-')) {
              insertPosition = i + 1
            } else {
              break
            }
          }

          // Insert at the calculated position
          const newSections = [
            ...p.sections.slice(0, insertPosition),
            newSection,
            ...p.sections.slice(insertPosition)
          ]

          // Reorder all sections
          newSections.forEach((section, idx) => {
            section.order = idx
          })

          return {
            ...p,
            sections: newSections
          }
        } else if (isFooterSection) {
          // Find the position before existing footers (to insert at end but before other footers)
          let insertPosition = p.sections.length
          for (let i = p.sections.length - 1; i >= 0; i--) {
            const section = p.sections[i]
            if (section.type.startsWith('footer-')) {
              insertPosition = i
            } else {
              break
            }
          }

          // Insert at the calculated position
          const newSections = [
            ...p.sections.slice(0, insertPosition),
            newSection,
            ...p.sections.slice(insertPosition)
          ]

          // Reorder all sections
          newSections.forEach((section, idx) => {
            section.order = idx
          })

          return {
            ...p,
            sections: newSections
          }
        } else {
          // Insert before footers for regular sections
          let insertPosition = p.sections.length
          for (let i = 0; i < p.sections.length; i++) {
            const section = p.sections[i]
            if (section.type.startsWith('footer-')) {
              insertPosition = i
              break
            }
          }

          const newSections = [
            ...p.sections.slice(0, insertPosition),
            newSection,
            ...p.sections.slice(insertPosition)
          ]

          newSections.forEach((section, idx) => {
            section.order = idx
          })

          return {
            ...p,
            sections: newSections
          }
        }
      }
      return p
    })

    const updatedCurrentPage = updatedPages.find(p => p.id === currentPage.id)
    if (updatedCurrentPage) {
      setTemplate({ ...template, pages: updatedPages })
      setCurrentPage(updatedCurrentPage)
      setSelectedSection(newSection)
    }
  }

  const handleDeleteSection = (sectionId: number) => {
    if (!template || !currentPage) return
    if (!confirm('Are you sure you want to delete this section?')) return

    const updatedSections = currentPage.sections.filter(s => s.id !== sectionId)
    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    setTemplate({ ...template, pages: updatedPages })
    setCurrentPage({ ...currentPage, sections: updatedSections })
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null)
    }
  }

  const handleMoveSection = (sectionId: number, direction: 'up' | 'down') => {
    if (!template || !currentPage) return

    const index = currentPage.sections.findIndex(s => s.id === sectionId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === currentPage.sections.length - 1) return

    const currentSection = currentPage.sections[index]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const targetSection = currentPage.sections[swapIndex]

    // Check if current section is a navigation section
    const isCurrentNavSection = currentSection.type.startsWith('navbar-') ||
                                currentSection.type.startsWith('header-') ||
                                currentSection.type.startsWith('sidebar-nav-')

    // Check if target section is a navigation section
    const isTargetNavSection = targetSection.type.startsWith('navbar-') ||
                               targetSection.type.startsWith('header-') ||
                               targetSection.type.startsWith('sidebar-nav-')

    // Check if current section is a footer section
    const isCurrentFooterSection = currentSection.type.startsWith('footer-')

    // Check if target section is a footer section
    const isTargetFooterSection = targetSection.type.startsWith('footer-')

    // Prevent non-nav sections from moving above nav sections
    if (direction === 'up' && !isCurrentNavSection && isTargetNavSection) {
      alert('Regular sections cannot be moved above navigation sections')
      return
    }

    // Prevent nav sections from moving below non-nav sections
    if (direction === 'down' && isCurrentNavSection && !isTargetNavSection && !isTargetFooterSection) {
      alert('Navigation sections cannot be moved below regular sections')
      return
    }

    // Prevent non-footer sections from moving below footer sections
    if (direction === 'down' && !isCurrentFooterSection && isTargetFooterSection) {
      alert('Regular sections cannot be moved below footer sections')
      return
    }

    // Prevent footer sections from moving above non-footer sections
    if (direction === 'up' && isCurrentFooterSection && !isTargetFooterSection) {
      alert('Footer sections cannot be moved above regular sections')
      return
    }

    const newSections = [...currentPage.sections]

    // Swap
    ;[newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]]

    // Update order values
    newSections.forEach((section, idx) => {
      section.order = idx
    })

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: newSections }
      }
      return p
    })

    setTemplate({ ...template, pages: updatedPages })
    setCurrentPage({ ...currentPage, sections: newSections })
  }

  const handleMoveSidebar = (sectionId: number, direction: 'left' | 'right') => {
    if (!template || !currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        // Toggle sidebar position
        const newType = direction === 'left' ? 'sidebar-nav-left' : 'sidebar-nav-right'
        return { ...s, type: newType }
      }
      return s
    })

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    setTemplate({ ...template, pages: updatedPages })
    setCurrentPage({ ...currentPage, sections: updatedSections })

    // Update selected section if this was the selected one
    if (selectedSection?.id === sectionId) {
      const updatedSection = updatedSections.find(s => s.id === sectionId)
      if (updatedSection) {
        setSelectedSection(updatedSection)
      }
    }
  }

  const handleUpdateSectionContent = (sectionId: number, newContent: any) => {
    if (!template || !currentPage) return

    const updatedSections = currentPage.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, content: newContent }
      }
      return s
    })

    const updatedPages = template.pages.map(p => {
      if (p.id === currentPage.id) {
        return { ...p, sections: updatedSections }
      }
      return p
    })

    setTemplate({ ...template, pages: updatedPages })
    setCurrentPage({ ...currentPage, sections: updatedSections })
    setSelectedSection({ ...selectedSection!, content: newContent })
  }

  const renderSection = (section: TemplateSection, index: number) => {
    const content = section.content || {}

    // Determine section behavior based on type
    const isTopLocked = section.type.startsWith('navbar-') || section.type.startsWith('header-')
    const isBottomLocked = section.type.startsWith('footer-')
    const isSidebar = section.type.startsWith('sidebar-nav-')
    const isLeftSidebar = section.type === 'sidebar-nav-left'
    const isRightSidebar = section.type === 'sidebar-nav-right'
    const isPositionLocked = isTopLocked || isBottomLocked
    const isHovered = hoveredSection === section.id

    const sectionWrapper = (children: React.ReactNode) => (
      <div
        key={section.id}
        className={`relative group ${isSidebar ? 'z-20' : ''}`}
        onMouseEnter={() => setHoveredSection(section.id)}
        onMouseLeave={() => setHoveredSection(null)}
        onClick={() => setSelectedSection(section)}
      >
        {children}

        {/* Hover Overlay */}
        {isHovered && (
          <div className={`absolute top-2 ${isLeftSidebar ? 'left-2' : 'right-2'} bg-white shadow-lg rounded-lg border border-gray-200 p-2 flex items-center gap-1 z-50`}>
            <span className="text-xs font-medium text-gray-700 mr-2 capitalize">{section.type}</span>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedSection(section)
              }}
              className="p-1 hover:bg-amber-50 rounded transition"
              title="Properties"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            {/* Sidebar sections: show left/right controls */}
            {isSidebar && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSidebar(section.id, 'left')
                  }}
                  disabled={isLeftSidebar}
                  className="p-1 hover:bg-amber-50 rounded disabled:opacity-30 transition"
                  title="Move to Left"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSidebar(section.id, 'right')
                  }}
                  disabled={isRightSidebar}
                  className="p-1 hover:bg-amber-50 rounded disabled:opacity-30 transition"
                  title="Move to Right"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Normal sections: show up/down controls */}
            {!isPositionLocked && !isSidebar && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSection(section.id, 'up')
                  }}
                  disabled={index === 0}
                  className="p-1 hover:bg-amber-50 rounded disabled:opacity-30 transition"
                  title="Move Up"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSection(section.id, 'down')
                  }}
                  disabled={index === (currentPage?.sections.length || 0) - 1}
                  className="p-1 hover:bg-amber-50 rounded disabled:opacity-30 transition"
                  title="Move Down"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            )}

            {/* Position-locked sections: show lock icon */}
            {isPositionLocked && (
              <div className="p-1 text-gray-400" title="Position locked">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteSection(section.id)
              }}
              className="p-1 hover:bg-red-50 rounded transition ml-1"
              title="Delete"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    )

    // Grid sections (1x1, 2x1, 3x1, etc.)
    if (section.type.startsWith('grid-')) {
      const [_, gridConfig] = section.type.split('-')
      const [cols, rows] = gridConfig.split('x').map(Number)
      const columns = content.columns || []

      return sectionWrapper(
        <div className={`p-8 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
          <div
            className="grid gap-4 w-full"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {columns.map((col: any, idx: number) => (
              <div
                key={idx}
                className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[200px] flex items-center justify-center"
              >
                <p className="text-gray-500 text-sm text-center">{col.content || `Column ${idx + 1}`}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    switch (section.type) {
      case 'hero':
        return sectionWrapper(
          <div className={`relative min-h-[400px] bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="text-center max-w-3xl">
              <h1 className="text-5xl font-bold mb-4">{content.title || 'Welcome'}</h1>
              <p className="text-xl mb-6">{content.subtitle || 'Your subtitle here'}</p>
              {content.cta_text && (
                <button className="px-8 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition">
                  {content.cta_text}
                </button>
              )}
            </div>
          </div>
        )

      case 'gallery':
        return sectionWrapper(
          <div className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <h2 className="text-3xl font-bold mb-6 text-center">{content.heading || 'Gallery'}</h2>
            <div className="grid grid-cols-3 gap-4">
              {Array(6).fill(null).map((_, idx) => (
                <div key={idx} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Image {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'contact-form':
      case 'booking-form':
        return sectionWrapper(
          <div className={`p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <h2 className="text-3xl font-bold mb-6 text-center">{content.heading || section.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h2>
            <div className="max-w-md mx-auto space-y-4">
              {(content.fields || ['name', 'email', 'message']).map((field: string, idx: number) => (
                <div key={idx} className="border-2 border-gray-300 rounded p-3 bg-gray-50">
                  <span className="text-sm text-gray-600 capitalize">{field}</span>
                </div>
              ))}
              <button className="w-full px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold">
                Submit
              </button>
            </div>
          </div>
        )

      case 'login-box':
        return sectionWrapper(
          <div className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="max-w-sm mx-auto bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">{content.heading || 'Sign In'}</h2>
              <div className="space-y-4">
                <div className="border-2 border-gray-300 rounded p-3">
                  <span className="text-sm text-gray-600">Email</span>
                </div>
                <div className="border-2 border-gray-300 rounded p-3">
                  <span className="text-sm text-gray-600">Password</span>
                </div>
                <button className="w-full px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold">
                  Login
                </button>
              </div>
            </div>
          </div>
        )

      case 'testimonials':
        return sectionWrapper(
          <div className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <h2 className="text-3xl font-bold mb-8 text-center">{content.heading || 'What Our Customers Say'}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {Array(2).fill(null).map((_, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600 italic mb-4">"Great service and experience!"</p>
                  <p className="font-semibold">Customer {idx + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )

      // Navigation and Header sections
      case 'navbar-basic':
      case 'navbar-dropdown':
      case 'navbar-sticky':
        return sectionWrapper(
          <div className={`bg-white border-b-2 border-gray-200 p-4 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="text-xl font-bold text-amber-600">{content.logo || 'Logo'}</div>
              <div className="flex gap-6">
                {(content.links || []).map((link: string, idx: number) => (
                  <span key={idx} className="text-gray-700 hover:text-amber-600 transition">{link}</span>
                ))}
              </div>
            </div>
          </div>
        )

      case 'header-simple':
        return sectionWrapper(
          <div className={`bg-gradient-to-r from-amber-50 to-amber-100 p-12 text-center cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{content.logo || 'Company Name'}</h1>
            <p className="text-gray-600">{content.tagline || 'Your tagline here'}</p>
          </div>
        )

      case 'header-centered':
        return sectionWrapper(
          <div className={`bg-white p-8 text-center border-b-2 border-gray-200 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <h1 className="text-3xl font-bold text-amber-600 mb-4">{content.logo || 'Brand'}</h1>
            {content.navigation && (
              <div className="flex gap-6 justify-center">
                {['Home', 'About', 'Services', 'Contact'].map((link, idx) => (
                  <span key={idx} className="text-gray-700">{link}</span>
                ))}
              </div>
            )}
          </div>
        )

      case 'header-split':
        return sectionWrapper(
          <div className={`bg-white p-6 border-b-2 border-gray-200 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-amber-600">{content.logo || 'Logo'}</h1>
              <div className="flex gap-6">
                {(content.links || []).map((link: string, idx: number) => (
                  <span key={idx} className="text-gray-700">{link}</span>
                ))}
              </div>
            </div>
          </div>
        )

      // Footer sections
      case 'footer-simple':
        return sectionWrapper(
          <div className={`bg-gray-800 text-white p-8 text-center cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <p className="text-sm">{content.text || '© 2025 Company Name. All rights reserved.'}</p>
          </div>
        )

      case 'footer-columns':
        return sectionWrapper(
          <div className={`bg-gray-800 text-white p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="grid grid-cols-4 gap-8 max-w-7xl mx-auto">
              {(content.columns || []).map((col: any, idx: number) => (
                <div key={idx}>
                  <h3 className="font-bold mb-3">{col.title}</h3>
                  {col.links?.map((link: string, linkIdx: number) => (
                    <p key={linkIdx} className="text-sm text-gray-400 mb-1">{link}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )

      case 'footer-social':
        return sectionWrapper(
          <div className={`bg-gray-800 text-white p-8 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="text-center">
              <p className="text-sm mb-4">{content.text || '© 2025 Company'}</p>
              <div className="flex gap-4 justify-center">
                {(content.socials || []).map((social: string, idx: number) => (
                  <span key={idx} className="text-amber-500 hover:text-amber-400 cursor-pointer">{social}</span>
                ))}
              </div>
            </div>
          </div>
        )

      // Sidebar navigation sections
      case 'sidebar-nav-left':
      case 'sidebar-nav-right':
        const sidebarPosition = section.type === 'sidebar-nav-left' ? 'left' : 'right'
        const positionType = content.positioned || 'permanently-fixed'
        const fullHeight = content.fullHeight !== false
        const heightClass = fullHeight ? 'min-h-[600px]' : 'min-h-[300px]'

        // Different visual indicators based on position type
        if (positionType === 'menu-click') {
          return sectionWrapper(
            <div className={`relative ${sidebarPosition === 'left' ? 'float-left mr-4' : 'float-right ml-4'} w-64 bg-gray-100 border-2 border-amber-400 border-dashed rounded-lg p-6 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''} ${heightClass} z-30`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">Navigation</h3>
                <button className="px-2 py-1 bg-amber-500 text-white text-xs rounded">☰</button>
              </div>
              <div className="text-xs text-amber-600 mb-2 font-medium">Appears on menu click</div>
              {fullHeight && <div className="text-[10px] text-gray-500 mb-2">Full height</div>}
              <div className="space-y-2">
                {(content.links || []).map((link: string, idx: number) => (
                  <div key={idx} className="p-2 bg-white rounded hover:bg-amber-50 transition">
                    <span className="text-gray-700">{link}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        } else if (positionType === 'permanently-fixed') {
          return sectionWrapper(
            <div className={`relative ${sidebarPosition === 'left' ? 'float-left mr-4' : 'float-right ml-4'} w-64 bg-gray-100 border-2 border-blue-400 rounded-lg p-6 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''} ${heightClass} z-30`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">Navigation</h3>
                <div className="text-xs text-blue-600 font-medium">📌 Fixed</div>
              </div>
              {fullHeight && <div className="text-[10px] text-gray-500 mb-2">Full height (100vh)</div>}
              <div className="space-y-2">
                {(content.links || []).map((link: string, idx: number) => (
                  <div key={idx} className="p-2 bg-white rounded hover:bg-amber-50 transition">
                    <span className="text-gray-700">{link}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        } else {
          // static
          return sectionWrapper(
            <div className={`relative ${sidebarPosition === 'left' ? 'float-left mr-4' : 'float-right ml-4'} w-64 bg-gray-100 border-2 border-gray-300 rounded-lg p-6 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''} ${heightClass} z-30`}>
              <h3 className="font-bold text-lg mb-4 text-gray-800">Navigation</h3>
              <div className="text-xs text-gray-600 mb-2">Static position</div>
              {fullHeight && <div className="text-[10px] text-gray-500 mb-2">Full height</div>}
              <div className="space-y-2">
                {(content.links || []).map((link: string, idx: number) => (
                  <div key={idx} className="p-2 bg-white rounded hover:bg-amber-50 transition">
                    <span className="text-gray-700">{link}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        }

      default:
        return sectionWrapper(
          <div className={`p-12 border-2 border-dashed border-gray-300 cursor-pointer hover:border-amber-500 transition ${selectedSection?.id === section.id ? 'border-amber-500' : ''}`}>
            <p className="text-gray-500 text-center">Section: {section.type}</p>
          </div>
        )
    }
  }

  const handleLeftMouseDown = () => setIsResizingLeft(true)
  const handleRightMouseDown = () => setIsResizingRight(true)

  const handleMouseUp = () => {
    setIsResizingLeft(false)
    setIsResizingRight(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 500) {
        setLeftWidth(newWidth)
      }
    }
    if (isResizingRight) {
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 250 && newWidth <= 600) {
        setRightWidth(newWidth)
      }
    }
  }

  const getCanvasWidth = () => {
    if (viewport === 'mobile') return '375px'
    if (viewport === 'tablet') return '768px'
    return '100%'
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading template...</div>
          <div className="text-gray-400">Please wait</div>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-center">
          <div className="text-2xl mb-2">Error loading template</div>
          <p className="text-gray-600">Please try again</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 text-gray-900 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Compact VSCode-style Header */}
      <header className="bg-white border-b border-gray-200 flex items-center h-9 shadow-sm">
        {/* Left Section - Logo & Menus */}
        <div className="flex items-center h-full">
          <div className="px-3 flex items-center space-x-2 border-r border-gray-200 h-full">
            <img src="/Pagevoo_logo_500x200.png" alt="Pagevoo" className="h-4" />
          </div>
          <div className="flex items-center h-full text-xs relative">
            <div className="relative" ref={fileMenuRef}>
              <button
                onClick={() => setShowFileMenu(!showFileMenu)}
                onMouseEnter={() => {
                  if (showEditMenu) {
                    setShowEditMenu(false)
                    setShowFileMenu(true)
                  }
                }}
                className="px-3 h-full hover:bg-amber-50 transition"
              >
                File
              </button>
              {showFileMenu && (
                <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-48">
                  <button
                    onClick={() => {
                      handleExportPage()
                      setShowFileMenu(false)
                    }}
                    disabled={!currentPage}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Export Current Page
                  </button>
                  <button
                    onClick={() => setShowFileMenu(false)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs border-t border-gray-200"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
            <div className="relative" ref={editMenuRef}>
              <button
                onClick={() => setShowEditMenu(!showEditMenu)}
                onMouseEnter={() => {
                  if (showFileMenu) {
                    setShowFileMenu(false)
                    setShowEditMenu(true)
                  }
                }}
                className="px-3 h-full hover:bg-amber-50 transition"
              >
                Edit
              </button>
              {showEditMenu && template && (
                <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-80">
                  {/* Sub-navigation Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setEditSubTab('settings')}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                        editSubTab === 'settings'
                          ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Template Settings
                    </button>
                    <button
                      onClick={() => setEditSubTab('css')}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                        editSubTab === 'css'
                          ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Site CSS
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {editSubTab === 'settings' ? (
                    <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Preview Image
                      </label>
                      {template.preview_image && (
                        <div className="mb-2">
                          <img
                            src={`http://localhost:8000/storage/${template.preview_image}`}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded border border-gray-300"
                          />
                        </div>
                      )}
                      <label className="block w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                        <div className={`w-full px-3 py-2 border border-gray-300 rounded text-xs text-center cursor-pointer transition ${
                          uploadingImage
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-50 text-gray-700'
                        }`}>
                          {uploadingImage ? 'Uploading...' : template.preview_image ? 'Change Image' : 'Upload Image'}
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={template.description}
                        onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                        rows={3}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Template description..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Business Type
                      </label>
                      <select
                        value={template.business_type}
                        onChange={(e) => setTemplate({ ...template, business_type: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="restaurant">Restaurant</option>
                        <option value="barber">Barber</option>
                        <option value="pizza">Pizza Shop</option>
                        <option value="cafe">Cafe</option>
                        <option value="gym">Gym</option>
                        <option value="salon">Salon</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Exclusive To
                      </label>
                      <select
                        value={template.exclusive_to || ''}
                        onChange={(e) => setTemplate({ ...template, exclusive_to: e.target.value as 'pro' | 'niche' | null })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">None (All Users)</option>
                        <option value="niche">Niche Package</option>
                        <option value="pro">Pro Package</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Template Type
                      </label>
                      <select
                        value={template.technologies?.includes('react') ? 'react' : 'html5'}
                        onChange={(e) => {
                          const type = e.target.value;
                          setTemplate({ ...template, technologies: [type] });
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="html5">HTML5</option>
                        <option value="react">React</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Features
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {['shopping-cart', 'booking', 'blog', 'marketplace', 'forum', 'contact-form'].map((feature) => (
                          <label key={feature} className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={template.features?.includes(feature) || false}
                              onChange={(e) => {
                                const feats = template.features || [];
                                if (e.target.checked) {
                                  setTemplate({ ...template, features: [...feats, feature] });
                                } else {
                                  setTemplate({ ...template, features: feats.filter(f => f !== feature) });
                                }
                              }}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="capitalize">{feature.replace('-', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    </>
                  ) : (
                    <>
                      {/* Site CSS Tab */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom CSS
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                          Add custom CSS styles for your template. This CSS will be applied to all pages.
                        </p>
                        <textarea
                          value={template.custom_css || ''}
                          onChange={(e) => setTemplate({ ...template, custom_css: e.target.value })}
                          rows={12}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="/* Enter your CSS here */&#10;.my-class {&#10;  color: #000;&#10;}"
                        />
                      </div>
                    </>
                  )}

                    <button
                      onClick={() => setShowEditMenu(false)}
                      className="w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition mt-3"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              className="px-3 h-full hover:bg-amber-50 transition"
              onMouseEnter={() => {
                if (showFileMenu || showEditMenu) {
                  setShowFileMenu(false)
                  setShowEditMenu(false)
                }
              }}
            >
              View
            </button>
            <button
              className="px-3 h-full hover:bg-amber-50 transition"
              onMouseEnter={() => {
                if (showFileMenu || showEditMenu) {
                  setShowFileMenu(false)
                  setShowEditMenu(false)
                }
              }}
            >
              Insert
            </button>
            <button
              className="px-3 h-full hover:bg-amber-50 transition"
              onMouseEnter={() => {
                if (showFileMenu || showEditMenu) {
                  setShowFileMenu(false)
                  setShowEditMenu(false)
                }
              }}
            >
              Help
            </button>
          </div>
        </div>

        {/* Center Section - Template Name */}
        <div className="flex-1 flex justify-center">
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-center w-64"
          />
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center h-full text-xs space-x-1 pr-2">
          <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition">
            Preview
          </button>
          <button
            onClick={handleSaveTemplate}
            disabled={loading}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : template.id === 0 ? 'Create Template' : 'Save Template'}
          </button>
          <div className="ml-2 px-2 text-gray-600 border-l border-gray-200">
            {user?.name}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-2 py-1 flex items-center justify-between h-10">
        {/* Left Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className={`p-1.5 rounded transition ${showLeftSidebar ? 'bg-amber-100 text-amber-700' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Components Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className={`p-1.5 rounded transition ${showRightSidebar ? 'bg-amber-100 text-amber-700' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Properties Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Center - Viewport Switcher */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded p-0.5">
          <button
            onClick={() => setViewport('desktop')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'desktop' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
            title="Desktop View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'tablet' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
            title="Tablet View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'mobile' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
            title="Mobile View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-600">Zoom: 100%</span>
        </div>
      </div>

      {/* Builder Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Sections & Pages */}
        {showLeftSidebar && (
          <>
            <aside
              ref={leftSidebarRef}
              style={{ width: leftWidth }}
              className="bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0"
            >
              <div className="p-3">
                {/* Section Library */}
                <h2 className="text-xs font-semibold text-amber-600 uppercase mb-3">Section Library</h2>

                {/* Core Sections */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleCategory('core')}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                  >
                    <span>Core Sections</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategories.includes('core') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expandedCategories.includes('core') && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {coreSections.map((section) => (
                        <button
                          key={section.type}
                          onClick={() => handleAddSection(section)}
                          className="group relative"
                          title={section.description}
                        >
                          {renderSectionThumbnail(section)}
                          <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-amber-700 transition">
                            {section.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Header & Navigation Sections */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleCategory('headerNav')}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                  >
                    <span>Header & Navigation</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategories.includes('headerNav') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expandedCategories.includes('headerNav') && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {headerNavigationSections.map((section) => (
                        <button
                          key={section.type}
                          onClick={() => handleAddSection(section)}
                          className="group relative"
                          title={section.description}
                        >
                          {renderSectionThumbnail(section)}
                          <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-amber-700 transition">
                            {section.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Sections */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleCategory('footers')}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                  >
                    <span>Footers</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategories.includes('footers') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expandedCategories.includes('footers') && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {footerSections.map((section) => (
                        <button
                          key={section.type}
                          onClick={() => handleAddSection(section)}
                          className="group relative"
                          title={section.description}
                        >
                          {renderSectionThumbnail(section)}
                          <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-amber-700 transition">
                            {section.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Special Sections */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleCategory('special')}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                  >
                    <span>Special Sections</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategories.includes('special') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expandedCategories.includes('special') && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {specialSections.map((section) => (
                        <button
                          key={section.type}
                          onClick={() => handleAddSection(section)}
                          className="group relative"
                          title={section.description}
                        >
                          {renderSectionThumbnail(section)}
                          <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-amber-700 transition">
                            {section.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exported Sections */}
                {exportedSections.length > 0 && (
                  <div className="mb-3">
                    <button
                      onClick={() => toggleCategory('exported')}
                      className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                    >
                      <span>Exported Sections</span>
                      <svg
                        className={`w-3 h-3 transition-transform ${expandedCategories.includes('exported') ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {expandedCategories.includes('exported') && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {exportedSections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => handleAddSection(section)}
                            className="group relative"
                            title={section.description}
                          >
                            {section.thumbnail ? (
                              <img src={section.thumbnail} alt={section.name} className="w-full aspect-video object-cover rounded border border-gray-300" />
                            ) : (
                              renderSectionThumbnail(section)
                            )}
                            <div className="mt-1 text-[10px] text-gray-700 text-center group-hover:text-amber-700 transition">
                              {section.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Export Section Button */}
                {selectedSection && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <button
                      onClick={handleExportSection}
                      className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded transition text-xs font-medium"
                    >
                      Export Selected Section
                    </button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h2 className="text-xs font-semibold text-amber-600 uppercase mb-3">Page Library</h2>

                  {/* Predefined Pages */}
                  <div className="mb-3">
                    <button
                      onClick={() => toggleCategory('predefined-pages')}
                      className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                    >
                      <span>Ready-to-Go Pages</span>
                      <svg
                        className={`w-3 h-3 transition-transform ${expandedCategories.includes('predefined-pages') ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {expandedCategories.includes('predefined-pages') && (
                      <div className="space-y-1 mt-2">
                        {predefinedPages.map((page) => (
                          <button
                            key={page.name}
                            onClick={() => handleAddPredefinedPage(page)}
                            className="w-full text-left px-2 py-1.5 bg-gray-50 hover:bg-amber-50 rounded text-[10px] transition"
                            title={page.description}
                          >
                            {page.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exported Pages */}
                  {exportedPages.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleCategory('exported-pages')}
                        className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                      >
                        <span>Exported Pages</span>
                        <svg
                          className={`w-3 h-3 transition-transform ${expandedCategories.includes('exported-pages') ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {expandedCategories.includes('exported-pages') && (
                        <div className="space-y-1 mt-2">
                          {exportedPages.map((page) => (
                            <button
                              key={page.id}
                              onClick={() => handleAddPredefinedPage(page)}
                              className="w-full text-left px-2 py-1.5 bg-gray-50 hover:bg-amber-50 rounded text-[10px] transition"
                              title={page.description}
                            >
                              {page.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </aside>

            {/* Left Resize Handle */}
            <div
              onMouseDown={handleLeftMouseDown}
              className="w-1 bg-gray-200 hover:bg-amber-400 cursor-col-resize transition flex-shrink-0"
            />
          </>
        )}

        {/* Center - Canvas */}
        <main className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-8">
          <div
            style={{
              width: getCanvasWidth(),
              maxWidth: '100%',
              transition: 'width 0.3s ease'
            }}
            className="bg-white min-h-full shadow-xl mx-auto ring-1 ring-gray-200"
          >
            {/* Page Selector */}
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Viewing page:</span>
                <select
                  value={currentPage?.id || ''}
                  onChange={(e) => {
                    const selectedPage = template.pages.find(p => p.id === parseInt(e.target.value))
                    if (selectedPage) setCurrentPage(selectedPage)
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {template.pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name} {page.is_homepage ? '(Home)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                {currentPage && !currentPage.is_homepage && (
                  <button
                    onClick={() => handleSetHomepage(currentPage.id)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                    title="Set as Homepage"
                  >
                    Set as Home
                  </button>
                )}
                {currentPage && template.pages.length > 1 && (
                  <button
                    onClick={() => handleDeletePage(currentPage.id)}
                    className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
                    title="Delete Page"
                  >
                    Delete Page
                  </button>
                )}
                <button
                  onClick={() => setShowAddPageModal(true)}
                  className="px-2 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded transition"
                  title="Add New Page"
                >
                  + Add Page
                </button>
              </div>
            </div>

            {/* Canvas Preview Area */}
            <div className="text-gray-900">
              {currentPage && currentPage.sections && currentPage.sections.length > 0 ? (
                currentPage.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => renderSection(section, index))
              ) : (
                <div className="text-center py-20 p-8">
                  <div className="text-6xl mb-4">📄</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Empty Page</h2>
                  <p className="text-gray-600">This page has no sections yet. Add sections from the left sidebar!</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        {showRightSidebar && (
          <>
            {/* Right Resize Handle */}
            <div
              onMouseDown={handleRightMouseDown}
              className="w-1 bg-gray-200 hover:bg-amber-400 cursor-col-resize transition flex-shrink-0"
            />

            <aside
              ref={rightSidebarRef}
              style={{ width: rightWidth }}
              className="bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0"
            >
              <div className="p-3">
                <h2 className="text-xs font-semibold text-amber-600 uppercase mb-3">Properties</h2>
                {selectedSection ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Section Type</label>
                      <div className="px-2 py-1.5 bg-gray-50 rounded text-xs capitalize font-medium">
                        {selectedSection.type}
                      </div>
                    </div>

                    {/* Grid Section Fields */}
                    {selectedSection.type.startsWith('grid-') && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-2">Column Content</label>
                          <div className="space-y-2">
                            {(selectedSection.content?.columns || []).map((col: any, idx: number) => (
                              <div key={idx}>
                                <label className="text-[10px] text-gray-500 block mb-1">Column {idx + 1}</label>
                                <textarea
                                  value={col.content || ''}
                                  onChange={(e) => {
                                    const newColumns = [...(selectedSection.content?.columns || [])]
                                    newColumns[idx] = { ...newColumns[idx], content: e.target.value }
                                    handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, columns: newColumns })
                                  }}
                                  rows={2}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  placeholder={`Content for column ${idx + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Hero Section Fields */}
                    {selectedSection.type === 'hero' && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">Title</label>
                          <input
                            type="text"
                            value={selectedSection.content?.title || ''}
                            onChange={(e) => handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, title: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">Subtitle</label>
                          <textarea
                            value={selectedSection.content?.subtitle || ''}
                            onChange={(e) => handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, subtitle: e.target.value })}
                            rows={2}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">Button Text</label>
                          <input
                            type="text"
                            value={selectedSection.content?.cta_text || ''}
                            onChange={(e) => handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, cta_text: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </>
                    )}

                    {/* Gallery, Contact Form, Booking Form, Login, Testimonials */}
                    {(selectedSection.type === 'gallery' || selectedSection.type === 'contact-form' || selectedSection.type === 'booking-form' || selectedSection.type === 'login-box' || selectedSection.type === 'testimonials') && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">Heading</label>
                          <input
                            type="text"
                            value={selectedSection.content?.heading || ''}
                            onChange={(e) => handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, heading: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500 italic">Advanced configuration coming soon</p>
                      </>
                    )}

                    {/* Sidebar Navigation Fields */}
                    {(selectedSection.type === 'sidebar-nav-left' || selectedSection.type === 'sidebar-nav-right') && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">Position Behavior</label>
                          <select
                            value={selectedSection.content?.positioned || 'permanently-fixed'}
                            onChange={(e) => handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, positioned: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="menu-click">Appear on menu click</option>
                            <option value="permanently-fixed">Permanently fixed</option>
                            <option value="static">Static</option>
                          </select>
                          <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                            {selectedSection.content?.positioned === 'menu-click' && 'Sidebar appears when user clicks menu button'}
                            {selectedSection.content?.positioned === 'permanently-fixed' && 'Sidebar stays visible and fixed to viewport'}
                            {selectedSection.content?.positioned === 'static' && 'Sidebar scrolls with page content'}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-700 flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={selectedSection.content?.fullHeight !== false}
                              onChange={(e) => handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, fullHeight: e.target.checked })}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span>Full Height (100vh)</span>
                          </label>
                          <p className="text-[10px] text-gray-500 ml-5 leading-tight">
                            {selectedSection.content?.fullHeight !== false
                              ? 'Sidebar extends to full viewport height'
                              : 'Sidebar height adjusts to content'}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-2">Navigation Links</label>
                          <div className="space-y-2">
                            {(selectedSection.content?.links || []).map((link: string, idx: number) => (
                              <input
                                key={idx}
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(selectedSection.content?.links || [])]
                                  newLinks[idx] = e.target.value
                                  handleUpdateSectionContent(selectedSection.id, { ...selectedSection.content, links: newLinks })
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                placeholder={`Link ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-8">
                    Click a section in the canvas to edit its properties
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Page</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Name
                </label>
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
                  placeholder="e.g., About Us, Services, Contact"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Slug will be auto-generated: {newPageName ? newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'page-slug'}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddPageModal(false)
                    setNewPageName('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPage}
                  disabled={!newPageName.trim()}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Section Modal */}
      {showExportSectionModal && (
        <ExportModal
          title="Export Section"
          onSave={handleSaveExportedSection}
          onClose={() => {
            setShowExportSectionModal(false)
            setSectionToExport(null)
          }}
        />
      )}

      {/* Export Page Modal */}
      {showExportPageModal && (
        <ExportModal
          title="Export Page"
          onSave={handleSaveExportedPage}
          onClose={() => setShowExportPageModal(false)}
        />
      )}
    </div>
  )
}

// Export Modal Component
function ExportModal({ title, onSave, onClose }: { title: string, onSave: (name: string, description: string, thumbnail: string | null) => void, onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setThumbnail(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Custom Section"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this item"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail (Optional)</label>
            {thumbnail && (
              <div className="mb-2">
                <img src={thumbnail} alt="Preview" className="w-full h-32 object-cover rounded border border-gray-300" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 800x600px or similar aspect ratio</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!name.trim()) {
                  alert('Please enter a name')
                  return
                }
                onSave(name, description, thumbnail)
                setName('')
                setDescription('')
                setThumbnail(null)
              }}
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
