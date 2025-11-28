import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Calendar, Layout, Eye, Settings, Palette } from 'lucide-react'
import type { EventCategory } from '../EventsManager'

interface EventsConfig {
  layout: 'list' | 'grid' | 'cards' | 'calendar'
  eventsPerPage: number
  columns: number
  gap: string
  showFeaturedImage: boolean
  showDescription: boolean
  showDate: boolean
  showTime: boolean
  showLocation: boolean
  showCategory: boolean
  showPrice: boolean
  showReadMore: boolean
  readMoreText: string
  filter: 'upcoming' | 'past' | 'all'
  filterCategory: number | null
  currency: '$' | '£' | '€'
  containerStyle?: {
    padding?: string
    background?: string
    borderRadius?: string
  }
}

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface EventsWrapPropertiesProps {
  selectedSection: TemplateSection
  categories?: EventCategory[]
  onUpdateContent: (sectionId: number, content: any) => void
  onOpenEventsManager?: () => void
}

export const EventsWrapProperties: React.FC<EventsWrapPropertiesProps> = ({
  selectedSection,
  categories = [],
  onUpdateContent,
  onOpenEventsManager
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    layout: true,
    display: false,
    filtering: false,
    container: false
  })

  const content = selectedSection.content || {}
  const config: EventsConfig = content.eventsConfig || {
    layout: 'list',
    eventsPerPage: 10,
    columns: 2,
    gap: '24px',
    showFeaturedImage: true,
    showDescription: true,
    showDate: true,
    showTime: true,
    showLocation: true,
    showCategory: true,
    showPrice: true,
    showReadMore: true,
    readMoreText: 'View Details',
    filter: 'upcoming',
    filterCategory: null,
    currency: '$',
    containerStyle: {}
  }

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateConfig = (updates: Partial<EventsConfig>) => {
    onUpdateContent(selectedSection.id, {
      ...content,
      eventsConfig: { ...config, ...updates }
    })
  }

  const updateContainerStyle = (updates: Partial<EventsConfig['containerStyle']>) => {
    onUpdateContent(selectedSection.id, {
      ...content,
      eventsConfig: {
        ...config,
        containerStyle: { ...config.containerStyle, ...updates }
      }
    })
  }

  const SectionHeader = ({
    title,
    icon: Icon,
    sectionKey
  }: {
    title: string
    icon: React.ElementType
    sectionKey: string
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-200 hover:text-white"
    >
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </span>
      {expandedSections[sectionKey] ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>
  )

  return (
    <div className="space-y-4 text-sm">
      {/* Header */}
      <div className="pb-3 border-b border-gray-600">
        <h3 className="text-base font-semibold text-gray-200">Events Settings</h3>
        <p className="text-xs text-gray-400 mt-1">Configure your events display</p>
      </div>

      {/* General Settings */}
      <div>
        <SectionHeader title="General Settings" icon={Settings} sectionKey="general" />
        {expandedSections.general && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Title (optional)</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => onUpdateContent(selectedSection.id, { ...content, title: e.target.value })}
                placeholder="Events title"
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Subtitle (optional)</label>
              <input
                type="text"
                value={content.subtitle || ''}
                onChange={(e) => onUpdateContent(selectedSection.id, { ...content, subtitle: e.target.value })}
                placeholder="Events description"
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
            </div>

            {onOpenEventsManager && (
              <button
                onClick={onOpenEventsManager}
                className="w-full px-3 py-2 text-xs font-medium text-white bg-[#98b290] rounded hover:bg-[#7a9072] transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Open Events Manager
              </button>
            )}
          </div>
        )}
      </div>

      {/* Layout Settings */}
      <div>
        <SectionHeader title="Layout" icon={Layout} sectionKey="layout" />
        {expandedSections.layout && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Layout Style</label>
              <select
                value={config.layout}
                onChange={(e) => updateConfig({ layout: e.target.value as EventsConfig['layout'] })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              >
                <option value="list">List</option>
                <option value="grid">Grid</option>
                <option value="cards">Cards</option>
              </select>
            </div>

            {(config.layout === 'grid' || config.layout === 'cards') && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Columns</label>
                <select
                  value={config.columns}
                  onChange={(e) => updateConfig({ columns: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                >
                  <option value={2}>2 columns</option>
                  <option value={3}>3 columns</option>
                  <option value={4}>4 columns</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 block mb-1">Gap Between Events</label>
              <select
                value={config.gap}
                onChange={(e) => updateConfig({ gap: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="12px">Small (12px)</option>
                <option value="16px">Medium (16px)</option>
                <option value="24px">Large (24px)</option>
                <option value="32px">Extra Large (32px)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Events Per Page</label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.eventsPerPage}
                onChange={(e) => updateConfig({ eventsPerPage: Number(e.target.value) })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Display Options */}
      <div>
        <SectionHeader title="Display Options" icon={Eye} sectionKey="display" />
        {expandedSections.display && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-600">
            {[
              { key: 'showFeaturedImage', label: 'Date Block' },
              { key: 'showDescription', label: 'Description' },
              { key: 'showDate', label: 'Date' },
              { key: 'showTime', label: 'Time' },
              { key: 'showLocation', label: 'Location' },
              { key: 'showCategory', label: 'Category' },
              { key: 'showPrice', label: 'Price' },
              { key: 'showReadMore', label: 'Read More Link' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config[key as keyof EventsConfig] as boolean}
                  onChange={(e) => updateConfig({ [key]: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800"
                />
                {label}
              </label>
            ))}

            {config.showReadMore && (
              <div className="pt-2 mt-2 border-t border-gray-600">
                <label className="text-xs text-gray-400 block mb-1">Read More Text</label>
                <input
                  type="text"
                  value={config.readMoreText}
                  onChange={(e) => updateConfig({ readMoreText: e.target.value })}
                  placeholder="View Details"
                  className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                />
              </div>
            )}

            {config.showPrice && (
              <div className="pt-2 mt-2 border-t border-gray-600">
                <label className="text-xs text-gray-400 block mb-1">Currency Symbol</label>
                <select
                  value={config.currency || '$'}
                  onChange={(e) => updateConfig({ currency: e.target.value as '$' | '£' | '€' })}
                  className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#98b290]"
                >
                  <option value="$">$ (USD)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="€">€ (EUR)</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtering */}
      <div>
        <SectionHeader title="Filtering" icon={Settings} sectionKey="filtering" />
        {expandedSections.filtering && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Show Events</label>
              <select
                value={config.filter}
                onChange={(e) => updateConfig({ filter: e.target.value as EventsConfig['filter'] })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="upcoming">Upcoming Only</option>
                <option value="past">Past Only</option>
                <option value="all">All Events</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Filter by Category</label>
              <select
                value={config.filterCategory ?? ''}
                onChange={(e) => updateConfig({ filterCategory: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Container Styling */}
      <div>
        <SectionHeader title="Container Styling" icon={Palette} sectionKey="container" />
        {expandedSections.container && (
          <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-600">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Padding</label>
              <select
                value={config.containerStyle?.padding || '32px'}
                onChange={(e) => updateContainerStyle({ padding: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="0">None</option>
                <option value="16px">Small (16px)</option>
                <option value="32px">Medium (32px)</option>
                <option value="48px">Large (48px)</option>
                <option value="64px">Extra Large (64px)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.containerStyle?.background || '#ffffff'}
                  onChange={(e) => updateContainerStyle({ background: e.target.value })}
                  className="w-10 h-8 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={config.containerStyle?.background || 'transparent'}
                  onChange={(e) => updateContainerStyle({ background: e.target.value })}
                  placeholder="transparent"
                  className="flex-1 px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Container Border Radius</label>
              <select
                value={config.containerStyle?.borderRadius || '0'}
                onChange={(e) => updateContainerStyle({ borderRadius: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-600 rounded text-xs bg-gray-800 text-gray-200"
              >
                <option value="0">None</option>
                <option value="4px">Small (4px)</option>
                <option value="8px">Medium (8px)</option>
                <option value="16px">Large (16px)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
