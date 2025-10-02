import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function WebsiteBuilder() {
  const { user } = useAuth()
  const [pageName, setPageName] = useState('Home')
  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(320)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  const leftSidebarRef = useRef<HTMLDivElement>(null)
  const rightSidebarRef = useRef<HTMLDivElement>(null)

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
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
            className="px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#98b290]"
          >
            <option value="Home">Home</option>
            <option value="About">About</option>
            <option value="Services">Services</option>
            <option value="Contact">Contact</option>
          </select>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center h-full text-xs space-x-1 pr-2">
          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition">
            Preview
          </button>
          <button className="px-3 py-1 bg-[#98b290] hover:bg-[#88a280] rounded transition">
            Publish
          </button>
          <div className="ml-2 px-2 text-gray-400 border-l border-gray-700 flex items-center space-x-1">
            <span>{user?.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              user?.account_status === 'active' ? 'bg-green-900/50 text-green-400' :
              user?.account_status === 'trial' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-gray-700 text-gray-400'
            }`}>
              {user?.account_status}
            </span>
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
                <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Components</h2>
                <div className="space-y-1">
                  {['Header', 'Hero Section', 'Text Block', 'Image', 'Gallery', 'Contact Form', 'Booking Widget', 'Menu/Products', 'Footer'].map((component) => (
                    <button key={component} className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition">
                      {component}
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Pages</h2>
                  <div className="space-y-1">
                    <div className="px-3 py-2 bg-gray-700 rounded text-xs flex items-center justify-between">
                      <span>Home</span>
                      <span className="text-[#98b290] text-xs">●</span>
                    </div>
                    <div className="px-3 py-2 bg-gray-700/50 rounded text-xs text-gray-400 hover:bg-gray-700 cursor-pointer transition">
                      About
                    </div>
                    <div className="px-3 py-2 bg-gray-700/50 rounded text-xs text-gray-400 hover:bg-gray-700 cursor-pointer transition">
                      Services
                    </div>
                    <div className="px-3 py-2 bg-gray-700/50 rounded text-xs text-gray-400 hover:bg-gray-700 cursor-pointer transition">
                      Contact
                    </div>
                    <button className="w-full text-left px-3 py-2 border border-dashed border-gray-600 hover:border-gray-500 rounded text-xs text-gray-400 transition">
                      + Add Page
                    </button>
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
            <div className="p-8 text-gray-900">
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏗️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Build Your Website</h2>
                <p className="text-gray-600 mb-6">Drag components from the left sidebar to start designing</p>
                <button className="px-6 py-3 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md font-medium transition">
                  Choose a Template
                </button>
              </div>
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
                <div className="text-xs text-gray-500 text-center py-8">
                  Select a component to edit its properties
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
