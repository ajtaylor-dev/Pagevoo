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

  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(320)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  const leftSidebarRef = useRef<HTMLDivElement>(null)
  const rightSidebarRef = useRef<HTMLDivElement>(null)

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

  const handleSaveTemplate = async () => {
    if (!template) {
      alert('No template loaded')
      return
    }

    setLoading(true)
    try {
      if (template.id === 0) {
        // Create new template
        const response = await api.createTemplate({
          name: template.name,
          description: template.description,
          business_type: template.business_type,
          is_active: template.is_active,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
          pages: []
        })
        if (response.success && response.data) {
          alert('Template created successfully!')
          // Redirect to the new template
          window.location.href = `/template-builder?id=${response.data.id}`
        }
      } else {
        // Update existing template
        const response = await api.updateTemplate(template.id, {
          name: template.name,
          description: template.description,
          business_type: template.business_type,
          exclusive_to: template.exclusive_to,
          technologies: template.technologies,
          features: template.features,
        })
        if (response.success) {
          alert('Template updated successfully')
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

  const renderSection = (section: TemplateSection) => {
    const content = section.content || {}

    switch (section.type) {
      case 'hero':
        return (
          <div
            key={section.id}
            onClick={() => setSelectedSection(section)}
            className={`relative min-h-[400px] bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
          >
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

      case 'about':
        return (
          <div
            key={section.id}
            onClick={() => setSelectedSection(section)}
            className={`p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
          >
            <h2 className="text-3xl font-bold mb-4">{content.heading || 'About Us'}</h2>
            <p className="text-gray-600">{content.text || 'Your about text here...'}</p>
          </div>
        )

      case 'features':
      case 'services':
        return (
          <div
            key={section.id}
            onClick={() => setSelectedSection(section)}
            className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
          >
            <h2 className="text-3xl font-bold mb-8 text-center">{content.heading || 'Features'}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(content.features || content.services || []).map((item: any, idx: number) => (
                <div key={idx} className="text-center p-6 bg-white rounded-lg">
                  <h3 className="font-semibold mb-2">{item.title || item.name}</h3>
                  <p className="text-sm text-gray-600">{item.text || item.price}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'contact':
      case 'menu':
        return (
          <div
            key={section.id}
            onClick={() => setSelectedSection(section)}
            className={`p-12 cursor-pointer hover:ring-2 hover:ring-amber-500 transition ${selectedSection?.id === section.id ? 'ring-2 ring-amber-500' : ''}`}
          >
            <h2 className="text-3xl font-bold mb-6">{content.heading || section.type.charAt(0).toUpperCase() + section.type.slice(1)}</h2>
            <p className="text-gray-500">Section content will render here...</p>
          </div>
        )

      default:
        return (
          <div
            key={section.id}
            onClick={() => setSelectedSection(section)}
            className={`p-12 border-2 border-dashed border-gray-300 cursor-pointer hover:border-amber-500 transition ${selectedSection?.id === section.id ? 'border-amber-500' : ''}`}
          >
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
            <button className="px-3 h-full hover:bg-amber-50 transition">File</button>
            <div className="relative">
              <button
                onClick={() => setShowEditMenu(!showEditMenu)}
                className="px-3 h-full hover:bg-amber-50 transition"
              >
                Edit
              </button>
              {showEditMenu && template && (
                <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 w-80">
                  <div className="p-4 space-y-3">
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
                    <button
                      onClick={() => setShowEditMenu(false)}
                      className="w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button className="px-3 h-full hover:bg-amber-50 transition">View</button>
            <button className="px-3 h-full hover:bg-amber-50 transition">Insert</button>
            <button className="px-3 h-full hover:bg-amber-50 transition">Help</button>
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
                <h2 className="text-xs font-semibold text-amber-600 uppercase mb-3">Sections</h2>
                <div className="space-y-1">
                  {currentPage?.sections && currentPage.sections.length > 0 ? (
                    currentPage.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section)}
                        className={`w-full text-left px-3 py-2 rounded text-xs transition ${
                          selectedSection?.id === section.id
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-700'
                        }`}
                      >
                        {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-4">No sections yet</div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h2 className="text-xs font-semibold text-amber-600 uppercase mb-3">Pages</h2>
                  <div className="space-y-1">
                    {template.pages && template.pages.length > 0 ? (
                      template.pages.map((page) => (
                        <div
                          key={page.id}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer transition ${
                            currentPage?.id === page.id
                              ? 'bg-gray-200 text-gray-900'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{page.name}</span>
                          {page.is_homepage && <span className="text-amber-600 text-xs">●</span>}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-4">No pages yet</div>
                    )}
                  </div>
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
            {/* Canvas Preview Area */}
            <div className="text-gray-900">
              {currentPage && currentPage.sections && currentPage.sections.length > 0 ? (
                currentPage.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => renderSection(section))
              ) : (
                <div className="text-center py-20 p-8">
                  <div className="text-6xl mb-4">📄</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Empty Page</h2>
                  <p className="text-gray-600">This page has no sections yet</p>
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
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Section Type</label>
                      <div className="px-3 py-2 bg-gray-50 rounded text-xs capitalize">
                        {selectedSection.type}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Order</label>
                      <div className="px-3 py-2 bg-gray-50 rounded text-xs">
                        {selectedSection.order}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Content</label>
                      <div className="px-3 py-2 bg-gray-50 rounded text-xs max-h-64 overflow-auto">
                        <pre className="text-[10px] text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedSection.content, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <button className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs transition">
                        Edit Content
                      </button>
                    </div>
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
    </div>
  )
}
