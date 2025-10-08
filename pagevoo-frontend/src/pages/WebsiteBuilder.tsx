import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { useNavigate } from 'react-router-dom'

interface UserSection {
  id: number
  type: string
  content: any
  order: number
}

interface UserPage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: UserSection[]
}

interface UserWebsite {
  id: number
  template_id: number
  published_at: string | null
  pages: UserPage[]
  template: any
}

export default function WebsiteBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [website, setWebsite] = useState<UserWebsite | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<UserPage | null>(null)
  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(320)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const [selectedSection, setSelectedSection] = useState<UserSection | null>(null)

  const leftSidebarRef = useRef<HTMLDivElement>(null)
  const rightSidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadWebsite()
  }, [])

  const loadWebsite = async () => {
    try {
      const response = await api.getUserWebsite()
      if (response.success && response.data) {
        setWebsite(response.data)
        // Set current page to homepage or first page
        const homepage = response.data.pages.find((p: UserPage) => p.is_homepage) || response.data.pages[0]
        setCurrentPage(homepage)
      }
    } catch (error) {
      console.error('Failed to load website:', error)
      // User doesn't have a website yet, redirect to dashboard
      alert('Please select a template first')
      navigate('/my-dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    try {
      const response = await api.publishWebsite()
      if (response.success) {
        setWebsite(response.data)
        alert('Website published successfully!')
      }
    } catch (error) {
      console.error('Failed to publish:', error)
      alert('Failed to publish website')
    }
  }

  const handleUnpublish = async () => {
    try {
      const response = await api.unpublishWebsite()
      if (response.success) {
        setWebsite(response.data)
        alert('Website unpublished')
      }
    } catch (error) {
      console.error('Failed to unpublish:', error)
      alert('Failed to unpublish website')
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

  const renderSection = (section: UserSection) => {
    const content = section.content || {}

    switch (section.type) {
      case 'hero':
        return (
          <div
            key={section.id}
            onClick={() => setSelectedSection(section)}
            className={`relative min-h-[400px] bg-gradient-to-br from-[#98b290] to-[#4b4b4b] flex items-center justify-center text-white p-12 cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
          >
            <div className="text-center max-w-3xl">
              <h1 className="text-5xl font-bold mb-4">{content.title || 'Welcome'}</h1>
              <p className="text-xl mb-6">{content.subtitle || 'Your subtitle here'}</p>
              {content.cta_text && (
                <button className="px-8 py-3 bg-white text-[#4b4b4b] rounded-lg font-semibold hover:bg-gray-100 transition">
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
            className={`p-12 cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
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
            className={`p-12 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
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
            className={`p-12 cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
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
            className={`p-12 border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#98b290] transition ${selectedSection?.id === section.id ? 'border-[#98b290]' : ''}`}
          >
            <p className="text-gray-500 text-center">Section: {section.type}</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading website...</div>
          <div className="text-gray-400">Please wait</div>
        </div>
      </div>
    )
  }

  if (!website || !currentPage) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-2xl mb-2">No website found</div>
          <button
            onClick={() => navigate('/my-dashboard')}
            className="px-6 py-2 bg-[#98b290] hover:bg-[#88a280] rounded-md transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col bg-gray-900 text-white select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Compact VSCode-style Header */}
      <header className="bg-gray-800 border-b border-gray-700 flex items-center h-9">
        {/* Left Section - Logo & Menus */}
        <div className="flex items-center h-full">
          <div className="px-3 flex items-center space-x-2 border-r border-gray-700 h-full">
            <img src="/Pagevoo_logo_500x200.png" alt="Pagevoo" className="h-4" />
          </div>
          <div className="flex items-center h-full text-xs">
            <button className="px-3 h-full hover:bg-gray-700 transition">File</button>
            <button className="px-3 h-full hover:bg-gray-700 transition">Edit</button>
            <button className="px-3 h-full hover:bg-gray-700 transition">View</button>
            <button className="px-3 h-full hover:bg-gray-700 transition">Insert</button>
            <button className="px-3 h-full hover:bg-gray-700 transition">Help</button>
          </div>
        </div>

        {/* Center Section - Business Name & Page */}
        <div className="flex-1 flex justify-center items-center space-x-2">
          <span className="text-xs text-gray-400">{user?.business_name}</span>
          <span className="text-gray-600">•</span>
          <select
            value={currentPage?.id || ''}
            onChange={(e) => {
              const page = website.pages.find(p => p.id === parseInt(e.target.value))
              if (page) setCurrentPage(page)
            }}
            className="px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
          >
            {website.pages.map((page) => (
              <option key={page.id} value={page.id}>{page.name}</option>
            ))}
          </select>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center h-full text-xs space-x-1 pr-2">
          {website.published_at && (
            <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-[10px]">
              Published
            </span>
          )}
          {website.published_at ? (
            <button
              onClick={handleUnpublish}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              Unpublish
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="px-3 py-1 bg-[#98b290] hover:bg-[#88a280] rounded transition"
            >
              Publish
            </button>
          )}
          <div className="ml-2 px-2 text-gray-400 border-l border-gray-700 flex items-center space-x-1">
            <span>{user?.name}</span>
            {user?.package && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-900/50 text-indigo-400 capitalize">
                {user.package}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-2 py-1 flex items-center justify-between h-10">
        {/* Left Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className={`p-1.5 rounded transition ${showLeftSidebar ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}`}
            title="Toggle Components Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className={`p-1.5 rounded transition ${showRightSidebar ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}`}
            title="Toggle Properties Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Center - Viewport Switcher */}
        <div className="flex items-center space-x-1 bg-gray-700 rounded p-0.5">
          <button
            onClick={() => setViewport('desktop')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'desktop' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
            title="Desktop View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'tablet' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
            title="Tablet View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`px-3 py-1 rounded text-xs transition ${viewport === 'mobile' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
            title="Mobile View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-400">Zoom: 100%</span>
        </div>
      </div>

      {/* Builder Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Components & Pages */}
        {showLeftSidebar && (
          <>
            <aside
              ref={leftSidebarRef}
              style={{ width: leftWidth }}
              className="bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0"
            >
              <div className="p-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Sections</h2>
                <div className="space-y-1">
                  {currentPage?.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section)}
                      className={`w-full text-left px-3 py-2 rounded text-xs transition ${
                        selectedSection?.id === section.id
                          ? 'bg-[#98b290] text-white'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Pages</h2>
                  <div className="space-y-1">
                    {website.pages.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer transition ${
                          currentPage?.id === page.id
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        <span>{page.name}</span>
                        {page.is_homepage && <span className="text-[#98b290] text-xs">●</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Left Resize Handle */}
            <div
              onMouseDown={handleLeftMouseDown}
              className="w-1 bg-gray-700 hover:bg-[#98b290] cursor-col-resize transition flex-shrink-0"
            />
          </>
        )}

        {/* Center - Canvas */}
        <main className="flex-1 overflow-auto bg-gray-900 flex items-start justify-center p-8">
          <div
            style={{
              width: getCanvasWidth(),
              maxWidth: '100%',
              transition: 'width 0.3s ease'
            }}
            className="bg-white min-h-full shadow-2xl mx-auto"
          >
            {/* Canvas Preview Area */}
            <div className="text-gray-900">
              {currentPage?.sections.length > 0 ? (
                currentPage.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => renderSection(section))
              ) : (
                <div className="text-center py-20 p-8">
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
              className="w-1 bg-gray-700 hover:bg-[#98b290] cursor-col-resize transition flex-shrink-0"
            />

            <aside
              ref={rightSidebarRef}
              style={{ width: rightWidth }}
              className="bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0"
            >
              <div className="p-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Properties</h2>
                {selectedSection ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Section Type</label>
                      <div className="px-3 py-2 bg-gray-700 rounded text-xs capitalize">
                        {selectedSection.type}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Order</label>
                      <div className="px-3 py-2 bg-gray-700 rounded text-xs">
                        {selectedSection.order}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Content</label>
                      <div className="px-3 py-2 bg-gray-700 rounded text-xs max-h-64 overflow-auto">
                        <pre className="text-[10px] text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(selectedSection.content, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-700">
                      <button className="w-full px-3 py-2 bg-[#98b290] hover:bg-[#88a280] rounded text-xs transition">
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
