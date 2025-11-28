import React from 'react'
import { Calendar, Clock, MapPin, Globe, Star, ArrowRight, Tag } from 'lucide-react'
import type { CalendarEvent, EventCategory } from '../../EventsManager'

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

interface EventsWrapPreviewProps {
  section: TemplateSection
  selectedSection: TemplateSection | null
  events?: CalendarEvent[]
  categories?: EventCategory[]
  onOpenEventsManager?: () => void
}

// Sample events for preview when no events exist
const sampleEvents: CalendarEvent[] = [
  {
    id: 1,
    title: 'Community Meetup',
    slug: 'community-meetup',
    description: 'Join us for our monthly community gathering with networking and refreshments.',
    content: null,
    featured_image: null,
    start_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    end_date: null,
    start_time: '18:00',
    end_time: '21:00',
    is_all_day: false,
    location: 'Community Center, 123 Main St',
    location_url: null,
    is_online: false,
    online_url: null,
    category_id: 1,
    category: { id: 1, name: 'Meetups', slug: 'meetups', description: null, color: '#98b290', order: 0 },
    status: 'published',
    is_featured: true,
    organizer_name: null,
    organizer_email: null,
    organizer_phone: null,
    ticket_url: null,
    price: 0,
    price_text: 'Free',
    capacity: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Workshop: Introduction to Web Design',
    slug: 'web-design-workshop',
    description: 'Learn the fundamentals of web design in this hands-on workshop for beginners.',
    content: null,
    featured_image: null,
    start_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    end_date: null,
    start_time: '10:00',
    end_time: '16:00',
    is_all_day: false,
    location: null,
    location_url: null,
    is_online: true,
    online_url: 'https://zoom.us/example',
    category_id: 2,
    category: { id: 2, name: 'Workshops', slug: 'workshops', description: null, color: '#5C6BC0', order: 1 },
    status: 'published',
    is_featured: false,
    organizer_name: null,
    organizer_email: null,
    organizer_phone: null,
    ticket_url: null,
    price: 49.99,
    price_text: null,
    capacity: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Annual Conference 2025',
    slug: 'annual-conference-2025',
    description: 'Our biggest event of the year featuring keynote speakers and networking opportunities.',
    content: null,
    featured_image: null,
    start_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 32 * 86400000).toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    is_all_day: false,
    location: 'Convention Center, Downtown',
    location_url: null,
    is_online: false,
    online_url: null,
    category_id: 3,
    category: { id: 3, name: 'Conferences', slug: 'conferences', description: null, color: '#E91E63', order: 2 },
    status: 'published',
    is_featured: true,
    organizer_name: null,
    organizer_email: null,
    organizer_phone: null,
    ticket_url: null,
    price: 199,
    price_text: '$199 - $499',
    capacity: 500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const EventsWrapPreview: React.FC<EventsWrapPreviewProps> = ({
  section,
  selectedSection,
  events = [],
  categories = [],
  onOpenEventsManager
}) => {
  const content = section.content || {}
  const { eventsConfig, title, subtitle } = content
  const isSelected = selectedSection?.id === section.id
  const config: EventsConfig = eventsConfig || {
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

  // Use sample events if no real events
  const displayEvents = events.length > 0 ? events : sampleEvents
  const isPreviewMode = events.length === 0

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time
  const formatTime = (timeString: string | null): string => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Get price display
  const getPrice = (event: CalendarEvent): string | null => {
    if (event.price_text) return event.price_text
    if (event.price !== null) {
      if (event.price === 0) return 'Free'
      const currency = config.currency || '$'
      return `${currency}${event.price.toFixed(2)}`
    }
    return null
  }

  // Container styles
  const containerStyle: React.CSSProperties = {
    padding: config.containerStyle?.padding || '32px',
    background: config.containerStyle?.background || 'transparent',
    borderRadius: config.containerStyle?.borderRadius || '0'
  }

  // Empty state
  if (displayEvents.length === 0) {
    return (
      <div
        style={containerStyle}
        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[#98b290]' : ''}`}
      >
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Calendar className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium mb-2">No Events</p>
          <p className="text-sm mb-4">Create your first event to see it here</p>
          {onOpenEventsManager && (
            <button
              onClick={onOpenEventsManager}
              className="px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition"
            >
              Open Events Manager
            </button>
          )}
        </div>
      </div>
    )
  }

  // Render a single event card
  const renderEventCard = (event: CalendarEvent) => {
    const isGrid = config.layout === 'grid' || config.layout === 'cards'
    const price = getPrice(event)

    return (
      <article
        key={event.id}
        className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition ${
          config.layout === 'list' ? 'flex' : ''
        }`}
      >
        {/* Featured Image / Date Block */}
        {config.showFeaturedImage && (
          <div
            className={`bg-gradient-to-br from-[#98b290] to-[#7a9274] flex flex-col items-center justify-center text-white ${
              config.layout === 'list' ? 'w-32 flex-shrink-0 py-4' : 'w-full py-6'
            }`}
          >
            {event.is_featured && (
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mb-1" />
            )}
            <div className="text-3xl font-bold">
              {new Date(event.start_date).getDate()}
            </div>
            <div className="text-sm uppercase">
              {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
            </div>
            {event.end_date && event.end_date !== event.start_date && (
              <div className="text-xs mt-1 opacity-80">
                - {new Date(event.end_date).getDate()} {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short' })}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1">
          {/* Category */}
          {config.showCategory && event.category && (
            <div className="mb-2">
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                style={{ backgroundColor: event.category.color + '20', color: event.category.color }}
              >
                <Tag className="w-3 h-3" />
                {event.category.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-800 text-lg mb-2 hover:text-[#98b290] cursor-pointer transition">
            {event.title}
          </h3>

          {/* Description */}
          {config.showDescription && event.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
            {config.showDate && !config.showFeaturedImage && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(event.start_date)}
              </span>
            )}
            {config.showTime && !event.is_all_day && event.start_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(event.start_time)}
                {event.end_time && <> - {formatTime(event.end_time)}</>}
              </span>
            )}
            {config.showTime && event.is_all_day && (
              <span className="flex items-center gap-1 text-blue-600">
                <Clock className="w-3 h-3" />
                All Day
              </span>
            )}
            {config.showLocation && event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
            {config.showLocation && event.is_online && (
              <span className="flex items-center gap-1 text-blue-600">
                <Globe className="w-3 h-3" />
                Online
              </span>
            )}
          </div>

          {/* Price & Read More */}
          <div className="flex items-center justify-between">
            {config.showPrice && price && (
              <span className={`text-sm font-medium ${price === 'Free' ? 'text-green-600' : 'text-gray-700'}`}>
                {price}
              </span>
            )}
            {config.showReadMore && (
              <button className="text-sm font-medium text-[#98b290] hover:text-[#7a9274] flex items-center gap-1 transition ml-auto">
                {config.readMoreText}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <div
      style={containerStyle}
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[#98b290]' : ''}`}
    >
      {/* Preview Banner */}
      {isPreviewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Preview mode - showing sample events</span>
          </div>
          {onOpenEventsManager && (
            <button
              onClick={onOpenEventsManager}
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Open Events Manager
            </button>
          )}
        </div>
      )}

      {/* Title & Subtitle */}
      {(title || subtitle) && (
        <div className="mb-6 text-center">
          {title && <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
      )}

      {/* Events Grid/List */}
      <div
        className={
          config.layout === 'list'
            ? 'space-y-4'
            : `grid gap-6`
        }
        style={
          config.layout !== 'list'
            ? {
                gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
                gap: config.gap
              }
            : { gap: config.gap }
        }
      >
        {displayEvents.slice(0, config.eventsPerPage).map(renderEventCard)}
      </div>

      {/* View All Link */}
      {displayEvents.length > config.eventsPerPage && (
        <div className="mt-6 text-center">
          <button className="px-6 py-2 border border-[#98b290] text-[#98b290] rounded-lg hover:bg-[#98b290] hover:text-white transition">
            View All Events
          </button>
        </div>
      )}
    </div>
  )
}
