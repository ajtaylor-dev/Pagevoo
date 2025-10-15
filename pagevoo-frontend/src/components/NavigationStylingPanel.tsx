import React, { useState } from 'react'

interface NavigationLink {
  label: string
  linkType: 'page' | 'url'
  pageId: number | null
  url: string
  subItems?: NavigationLink[]
}

interface DropdownConfig {
  trigger: 'click' | 'hover' | 'hybrid'
  hoverDelay: number
  autoCloseDelay: number
  transitionDuration: number
}

interface LinkStyling {
  bgColor?: string
  bgColorHover?: string
  textColor?: string
  textColorHover?: string
  border?: string
  borderRadius?: string
  padding?: string
  margin?: string
  fontSize?: string
  fontWeight?: number
  letterSpacing?: string
  transition?: string
}

interface ContainerStyle {
  background?: string
  backgroundImage?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  borderRadius?: string
  shadow?: string
  opacity?: number
}

interface ActiveIndicator {
  type: 'underline' | 'background' | 'border' | 'custom'
  color?: string
  thickness?: string
  customCSS?: string
}

interface NavigationContent {
  logo?: string
  tagline?: string
  links?: NavigationLink[]
  linkStyling?: LinkStyling
  containerStyle?: ContainerStyle
  dropdownConfig?: DropdownConfig
  activeIndicator?: ActiveIndicator
}

interface NavigationStylingPanelProps {
  content: NavigationContent
  onUpdate: (content: NavigationContent) => void
}

type TabType = 'links' | 'link-style' | 'container' | 'dropdown' | 'active-indicator'

export const NavigationStylingPanel: React.FC<NavigationStylingPanelProps> = ({ content, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('links')

  const updateLinkStyling = (updates: Partial<LinkStyling>) => {
    onUpdate({
      ...content,
      linkStyling: { ...content.linkStyling, ...updates }
    })
  }

  const updateContainerStyle = (updates: Partial<ContainerStyle>) => {
    onUpdate({
      ...content,
      containerStyle: { ...content.containerStyle, ...updates }
    })
  }

  const updateDropdownConfig = (updates: Partial<DropdownConfig>) => {
    onUpdate({
      ...content,
      dropdownConfig: { ...content.dropdownConfig, ...updates } as DropdownConfig
    })
  }

  const updateActiveIndicator = (updates: Partial<ActiveIndicator>) => {
    onUpdate({
      ...content,
      activeIndicator: { ...content.activeIndicator, ...updates } as ActiveIndicator
    })
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('links')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'links'
              ? 'bg-white border-b-2 border-amber-500 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Links
        </button>
        <button
          onClick={() => setActiveTab('link-style')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'link-style'
              ? 'bg-white border-b-2 border-amber-500 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Link Style
        </button>
        <button
          onClick={() => setActiveTab('container')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'container'
              ? 'bg-white border-b-2 border-amber-500 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Container
        </button>
        <button
          onClick={() => setActiveTab('dropdown')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'dropdown'
              ? 'bg-white border-b-2 border-amber-500 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dropdown
        </button>
        <button
          onClick={() => setActiveTab('active-indicator')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'active-indicator'
              ? 'bg-white border-b-2 border-amber-500 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active Page
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'links' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Link management is handled in the main properties panel. Use this panel to style your navigation links.
            </p>
          </div>
        )}

        {activeTab === 'link-style' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Link Styling</h3>

            {/* Text Colors */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Text Color (Default)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.linkStyling?.textColor || '#000000'}
                  onChange={(e) => updateLinkStyling({ textColor: e.target.value })}
                  className="w-10 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={content.linkStyling?.textColor || '#000000'}
                  onChange={(e) => updateLinkStyling({ textColor: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Text Color (Hover)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.linkStyling?.textColorHover || '#f59e0b'}
                  onChange={(e) => updateLinkStyling({ textColorHover: e.target.value })}
                  className="w-10 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={content.linkStyling?.textColorHover || '#f59e0b'}
                  onChange={(e) => updateLinkStyling({ textColorHover: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#f59e0b"
                />
              </div>
            </div>

            {/* Background Colors */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Background Color (Default)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.linkStyling?.bgColor || '#ffffff'}
                  onChange={(e) => updateLinkStyling({ bgColor: e.target.value })}
                  className="w-10 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={content.linkStyling?.bgColor || '#ffffff'}
                  onChange={(e) => updateLinkStyling({ bgColor: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Background Color (Hover)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.linkStyling?.bgColorHover || '#f3f4f6'}
                  onChange={(e) => updateLinkStyling({ bgColorHover: e.target.value })}
                  className="w-10 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={content.linkStyling?.bgColorHover || '#f3f4f6'}
                  onChange={(e) => updateLinkStyling({ bgColorHover: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#f3f4f6"
                />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Font Size</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={parseInt(content.linkStyling?.fontSize || '16')}
                  onChange={(e) => updateLinkStyling({ fontSize: e.target.value + 'px' })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-12 text-right">
                  {content.linkStyling?.fontSize || '16px'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Font Weight</label>
              <select
                value={content.linkStyling?.fontWeight || 400}
                onChange={(e) => updateLinkStyling({ fontWeight: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="300">Light (300)</option>
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi-Bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra Bold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Letter Spacing</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-2"
                  max="5"
                  step="0.1"
                  value={parseFloat(content.linkStyling?.letterSpacing || '0')}
                  onChange={(e) => updateLinkStyling({ letterSpacing: e.target.value + 'px' })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-12 text-right">
                  {content.linkStyling?.letterSpacing || '0px'}
                </span>
              </div>
            </div>

            {/* Padding */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Padding</label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Top"
                  value={content.linkStyling?.padding?.split(' ')[0] || '8px'}
                  onChange={(e) => {
                    const parts = (content.linkStyling?.padding || '8px 12px').split(' ')
                    parts[0] = e.target.value
                    updateLinkStyling({ padding: parts.join(' ') })
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Right"
                  value={content.linkStyling?.padding?.split(' ')[1] || '12px'}
                  onChange={(e) => {
                    const parts = (content.linkStyling?.padding || '8px 12px').split(' ')
                    parts[1] = e.target.value
                    updateLinkStyling({ padding: parts.join(' ') })
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Bottom"
                  value={content.linkStyling?.padding?.split(' ')[2] || '8px'}
                  onChange={(e) => {
                    const parts = (content.linkStyling?.padding || '8px 12px 8px 12px').split(' ')
                    while (parts.length < 4) parts.push('8px')
                    parts[2] = e.target.value
                    updateLinkStyling({ padding: parts.join(' ') })
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Left"
                  value={content.linkStyling?.padding?.split(' ')[3] || '12px'}
                  onChange={(e) => {
                    const parts = (content.linkStyling?.padding || '8px 12px 8px 12px').split(' ')
                    while (parts.length < 4) parts.push('12px')
                    parts[3] = e.target.value
                    updateLinkStyling({ padding: parts.join(' ') })
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Border */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Border</label>
              <input
                type="text"
                value={content.linkStyling?.border || 'none'}
                onChange={(e) => updateLinkStyling({ border: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="1px solid #000"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Border Radius</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={parseInt(content.linkStyling?.borderRadius || '0')}
                  onChange={(e) => updateLinkStyling({ borderRadius: e.target.value + 'px' })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-12 text-right">
                  {content.linkStyling?.borderRadius || '0px'}
                </span>
              </div>
            </div>

            {/* Transition */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Transition Duration</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={parseInt(content.linkStyling?.transition?.split(' ')[1] || '200')}
                  onChange={(e) => updateLinkStyling({ transition: `all ${e.target.value}ms ease` })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-16 text-right">
                  {content.linkStyling?.transition?.split(' ')[1] || '200ms'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Timing Function</label>
              <select
                value={content.linkStyling?.transition?.split(' ')[2] || 'ease'}
                onChange={(e) => {
                  const duration = content.linkStyling?.transition?.split(' ')[1] || '200ms'
                  updateLinkStyling({ transition: `all ${duration} ${e.target.value}` })
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="ease">Ease</option>
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In Out</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'container' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Container Styling</h3>

            {/* Background */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.containerStyle?.background || '#ffffff'}
                  onChange={(e) => updateContainerStyle({ background: e.target.value })}
                  className="w-10 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={content.containerStyle?.background || '#ffffff'}
                  onChange={(e) => updateContainerStyle({ background: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Padding */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Padding</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Top</label>
                  <input
                    type="text"
                    value={content.containerStyle?.paddingTop || '0px'}
                    onChange={(e) => updateContainerStyle({ paddingTop: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Right</label>
                  <input
                    type="text"
                    value={content.containerStyle?.paddingRight || '0px'}
                    onChange={(e) => updateContainerStyle({ paddingRight: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Bottom</label>
                  <input
                    type="text"
                    value={content.containerStyle?.paddingBottom || '0px'}
                    onChange={(e) => updateContainerStyle({ paddingBottom: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Left</label>
                  <input
                    type="text"
                    value={content.containerStyle?.paddingLeft || '0px'}
                    onChange={(e) => updateContainerStyle({ paddingLeft: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0px"
                  />
                </div>
              </div>
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Margin</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Top</label>
                  <input
                    type="text"
                    value={content.containerStyle?.marginTop || '0px'}
                    onChange={(e) => updateContainerStyle({ marginTop: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Right</label>
                  <input
                    type="text"
                    value={content.containerStyle?.marginRight || '0px'}
                    onChange={(e) => updateContainerStyle({ marginRight: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Bottom</label>
                  <input
                    type="text"
                    value={content.containerStyle?.marginBottom || '0px'}
                    onChange={(e) => updateContainerStyle({ marginBottom: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Left</label>
                  <input
                    type="text"
                    value={content.containerStyle?.marginLeft || '0px'}
                    onChange={(e) => updateContainerStyle({ marginLeft: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0px"
                  />
                </div>
              </div>
            </div>

            {/* Border */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Border Width</label>
              <input
                type="text"
                value={content.containerStyle?.borderWidth || '0px'}
                onChange={(e) => updateContainerStyle({ borderWidth: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="0px"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Border Style</label>
              <select
                value={content.containerStyle?.borderStyle || 'solid'}
                onChange={(e) => updateContainerStyle({ borderStyle: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Border Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={content.containerStyle?.borderColor || '#000000'}
                  onChange={(e) => updateContainerStyle({ borderColor: e.target.value })}
                  className="w-10 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={content.containerStyle?.borderColor || '#000000'}
                  onChange={(e) => updateContainerStyle({ borderColor: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Border Radius</label>
              <input
                type="text"
                value={content.containerStyle?.borderRadius || '0px'}
                onChange={(e) => updateContainerStyle({ borderRadius: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="0px"
              />
            </div>

            {/* Box Shadow */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Box Shadow</label>
              <input
                type="text"
                value={content.containerStyle?.shadow || 'none'}
                onChange={(e) => updateContainerStyle({ shadow: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="0 2px 4px rgba(0,0,0,0.1)"
              />
              <p className="text-xs text-gray-500">Example: 0 2px 4px rgba(0,0,0,0.1)</p>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Opacity</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(content.containerStyle?.opacity || 1) * 100}
                  onChange={(e) => updateContainerStyle({ opacity: parseInt(e.target.value) / 100 })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-12 text-right">
                  {Math.round((content.containerStyle?.opacity || 1) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dropdown' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Dropdown Behavior</h3>

            {/* Trigger Method */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Trigger Method</label>
              <select
                value={content.dropdownConfig?.trigger || 'click'}
                onChange={(e) => updateDropdownConfig({ trigger: e.target.value as 'click' | 'hover' | 'hybrid' })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="click">Click (Open/close on click)</option>
                <option value="hover">Hover (Open on mouseenter, close on mouseleave)</option>
                <option value="hybrid">Hybrid (Hover to open, click anywhere to close)</option>
              </select>
            </div>

            {/* Hover Delay */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Hover Delay (ms)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={content.dropdownConfig?.hoverDelay || 0}
                  onChange={(e) => updateDropdownConfig({ hoverDelay: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-16 text-right">
                  {content.dropdownConfig?.hoverDelay || 0}ms
                </span>
              </div>
              <p className="text-xs text-gray-500">Delay before dropdown opens on hover</p>
            </div>

            {/* Auto-close Delay */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Auto-close Delay (ms)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-1"
                  max="5000"
                  step="100"
                  value={content.dropdownConfig?.autoCloseDelay ?? 0}
                  onChange={(e) => updateDropdownConfig({ autoCloseDelay: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-16 text-right">
                  {content.dropdownConfig?.autoCloseDelay === -1 ? 'Never' : `${content.dropdownConfig?.autoCloseDelay || 0}ms`}
                </span>
              </div>
              <p className="text-xs text-gray-500">Set to -1 for never auto-close</p>
            </div>

            {/* Transition Duration */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Animation Duration (ms)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={content.dropdownConfig?.transitionDuration || 200}
                  onChange={(e) => updateDropdownConfig({ transitionDuration: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-16 text-right">
                  {content.dropdownConfig?.transitionDuration || 200}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active-indicator' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Active Page Indicator</h3>

            {/* Indicator Type */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Indicator Type</label>
              <select
                value={content.activeIndicator?.type || 'underline'}
                onChange={(e) => updateActiveIndicator({ type: e.target.value as 'underline' | 'background' | 'border' | 'custom' })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="underline">Underline</option>
                <option value="background">Background Highlight</option>
                <option value="border">Border Highlight</option>
                <option value="custom">Custom CSS</option>
              </select>
            </div>

            {/* Color */}
            {content.activeIndicator?.type !== 'custom' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={content.activeIndicator?.color || '#f59e0b'}
                    onChange={(e) => updateActiveIndicator({ color: e.target.value })}
                    className="w-10 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={content.activeIndicator?.color || '#f59e0b'}
                    onChange={(e) => updateActiveIndicator({ color: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
            )}

            {/* Thickness (for underline) */}
            {content.activeIndicator?.type === 'underline' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Thickness</label>
                <input
                  type="text"
                  value={content.activeIndicator?.thickness || '2px'}
                  onChange={(e) => updateActiveIndicator({ thickness: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="2px"
                />
              </div>
            )}

            {/* Custom CSS */}
            {content.activeIndicator?.type === 'custom' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Custom CSS</label>
                <textarea
                  value={content.activeIndicator?.customCSS || ''}
                  onChange={(e) => updateActiveIndicator({ customCSS: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                  rows={4}
                  placeholder="border-bottom: 2px solid #f59e0b;"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
