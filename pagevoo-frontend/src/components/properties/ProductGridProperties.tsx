import React, { useState } from 'react'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'

interface ProductGridPropertiesProps {
  section: {
    id: string
    content: {
      title?: string
      subtitle?: string
      ecommerceConfig?: {
        layout?: 'grid' | 'list'
        columns?: number
        showPrice?: boolean
        showAddToCart?: boolean
        showCategory?: boolean
        primaryColor?: string
      }
    }
  }
  onUpdateSection: (sectionId: string, updates: any) => void
  onOpenEcommerceManager?: () => void
}

const ProductGridProperties: React.FC<ProductGridPropertiesProps> = ({
  section,
  onUpdateSection,
  onOpenEcommerceManager,
}) => {
  const [openSections, setOpenSections] = useState({
    general: true,
    display: true,
    layout: true,
    appearance: true,
  })

  const config = section.content.ecommerceConfig || {
    layout: 'grid',
    columns: 3,
    showPrice: true,
    showAddToCart: true,
    showCategory: true,
    primaryColor: '#8B5CF6',
  }

  const updateConfig = (updates: any) => {
    onUpdateSection(section.id, {
      ...section.content,
      ecommerceConfig: {
        ...config,
        ...updates,
      },
    })
  }

  const updateContent = (updates: any) => {
    onUpdateSection(section.id, {
      ...section.content,
      ...updates,
    })
  }

  const toggleSection = (sectionName: keyof typeof openSections) => {
    setOpenSections({
      ...openSections,
      [sectionName]: !openSections[sectionName],
    })
  }

  return (
    <div className="space-y-4">
      {/* Manager Button */}
      {onOpenEcommerceManager && (
        <button
          onClick={onOpenEcommerceManager}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
        >
          Open E-commerce Manager
        </button>
      )}

      {/* General */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('general')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-medium">General</span>
          {openSections.general ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
        </button>
        {openSections.general && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Featured Products"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={section.content.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Discover our latest collection"
              />
            </div>
          </div>
        )}
      </div>

      {/* Layout */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('layout')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-medium">Layout</span>
          {openSections.layout ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
        </button>
        {openSections.layout && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout Style</label>
              <select
                value={config.layout}
                onChange={(e) => updateConfig({ layout: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </div>
            {config.layout === 'grid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
                <select
                  value={config.columns}
                  onChange={(e) => updateConfig({ columns: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Display */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('display')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-medium">Display Options</span>
          {openSections.display ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
        </button>
        {openSections.display && (
          <div className="p-3 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showPrice}
                onChange={(e) => updateConfig({ showPrice: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Show Price</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showAddToCart}
                onChange={(e) => updateConfig({ showAddToCart: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Show "Add to Cart" Button</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showCategory}
                onChange={(e) => updateConfig({ showCategory: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Show Category</span>
            </label>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('appearance')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-medium">Appearance</span>
          {openSections.appearance ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
        </button>
        {openSections.appearance && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                  className="w-12 h-10 rounded border"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                  placeholder="#8B5CF6"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductGridProperties
