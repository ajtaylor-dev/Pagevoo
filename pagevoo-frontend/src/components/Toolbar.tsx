import React from 'react'

interface ToolbarProps {
  showLeftSidebar: boolean
  setShowLeftSidebar: (show: boolean) => void
  showRightSidebar: boolean
  setShowRightSidebar: (show: boolean) => void
  viewport: 'desktop' | 'tablet' | 'mobile'
  setViewport: (viewport: 'desktop' | 'tablet' | 'mobile') => void
  builderType?: 'template' | 'website'
  itemId?: number | null
}

export const Toolbar: React.FC<ToolbarProps> = ({
  showLeftSidebar,
  setShowLeftSidebar,
  showRightSidebar,
  setShowRightSidebar,
  viewport,
  setViewport,
  builderType = 'website',
  itemId
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-2 py-1 flex items-center justify-between h-10">
      {/* Left Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className={`p-1.5 rounded transition ${showLeftSidebar ? 'bg-[#d4e5d0] text-[#5a7a54]' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
          title="Toggle Components Panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className={`p-1.5 rounded transition ${showRightSidebar ? 'bg-[#d4e5d0] text-[#5a7a54]' : 'bg-white hover:bg-gray-100 text-gray-600'}`}
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
          className={`px-3 py-1 rounded text-xs transition ${viewport === 'desktop' ? 'bg-[#98b290] text-white' : 'hover:bg-gray-200 text-gray-700'}`}
          title="Desktop View"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={() => setViewport('tablet')}
          className={`px-3 py-1 rounded text-xs transition ${viewport === 'tablet' ? 'bg-[#98b290] text-white' : 'hover:bg-gray-200 text-gray-700'}`}
          title="Tablet View"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={() => setViewport('mobile')}
          className={`px-3 py-1 rounded text-xs transition ${viewport === 'mobile' ? 'bg-[#98b290] text-white' : 'hover:bg-gray-200 text-gray-700'}`}
          title="Mobile View"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Right Controls - Show ID if saved */}
      <div className="flex items-center space-x-1">
        {itemId !== null && itemId !== undefined && itemId > 0 && (
          <span className="text-xs text-gray-600">
            {builderType === 'template' ? 'Template' : 'Website'} ID: {itemId}
          </span>
        )}
      </div>
    </div>
  )
}
