import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Pencil, X, Search, Eye, EyeOff,
  Calendar, MapPin, Clock, MoreVertical, ChevronLeft,
  ChevronRight, ArrowLeft, Star, Globe, Users, Loader2,
  Tag, DollarSign
} from 'lucide-react'
import { api } from '@/services/api'
import { databaseService } from '@/services/databaseService'

// Types
export interface CalendarEvent {
  id: number
  title: string
  slug: string
  description: string | null
  content: string | null
  featured_image: string | null
  start_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  location: string | null
  location_url: string | null
  is_online: boolean
  online_url: string | null
  category_id: number | null
  category?: EventCategory
  status: 'draft' | 'published' | 'cancelled'
  is_featured: boolean
  organizer_name: string | null
  organizer_email: string | null
  organizer_phone: string | null
  ticket_url: string | null
  price: number | null
  price_text: string | null
  capacity: number | null
  created_at: string
  updated_at: string
}

export interface EventCategory {
  id: number
  name: string
  slug: string
  description: string | null
  color: string
  order: number
  event_count?: number
}

interface EventsManagerProps {
  isOpen: boolean
  onClose: () => void
  type: 'template' | 'website'
  referenceId: number
}

type ViewMode = 'list' | 'calendar' | 'categories' | 'editor'
type FilterMode = 'all' | 'upcoming' | 'past'

export function EventsManager({
  isOpen,
  onClose,
  type,
  referenceId
}: EventsManagerProps) {
  // Data state
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [databaseId, setDatabaseId] = useState<number | null>(null)

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterMode>('upcoming')
  const [filterCategory, setFilterCategory] = useState<number | null>(null)

  // Calendar state
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1)

  // Event editor state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [isNewEvent, setIsNewEvent] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventSlug, setEventSlug] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventContent, setEventContent] = useState('')
  const [eventFeaturedImage, setEventFeaturedImage] = useState('')
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventIsAllDay, setEventIsAllDay] = useState(false)
  const [eventLocation, setEventLocation] = useState('')
  const [eventLocationUrl, setEventLocationUrl] = useState('')
  const [eventIsOnline, setEventIsOnline] = useState(false)
  const [eventOnlineUrl, setEventOnlineUrl] = useState('')
  const [eventCategoryId, setEventCategoryId] = useState<number | null>(null)
  const [eventStatus, setEventStatus] = useState<'draft' | 'published'>('draft')
  const [eventIsFeatured, setEventIsFeatured] = useState(false)
  const [eventOrganizerName, setEventOrganizerName] = useState('')
  const [eventOrganizerEmail, setEventOrganizerEmail] = useState('')
  const [eventOrganizerPhone, setEventOrganizerPhone] = useState('')
  const [eventTicketUrl, setEventTicketUrl] = useState('')
  const [eventPrice, setEventPrice] = useState('')
  const [eventPriceText, setEventPriceText] = useState('')
  const [eventCapacity, setEventCapacity] = useState('')
  const [saving, setSaving] = useState(false)

  // Category state
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#98b290')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [eventMenuOpen, setEventMenuOpen] = useState<number | null>(null)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && referenceId) {
      loadData()
    }
  }, [isOpen, referenceId, type])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode('list')
      setSearchQuery('')
      setFilterStatus('upcoming')
      setFilterCategory(null)
      setEditingEvent(null)
      setIsNewEvent(false)
      resetEventForm()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      const instance = await databaseService.getInstance(type, referenceId)
      if (!instance) {
        console.error('No database found for events')
        setLoading(false)
        return
      }
      setDatabaseId(instance.id)

      const [eventsRes, categoriesRes] = await Promise.all([
        api.getEvents(type, referenceId, 'all'),
        api.getEventCategories(type, referenceId)
      ])

      setEvents(eventsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Failed to load events data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Helpers
  const resetEventForm = () => {
    setEventTitle('')
    setEventSlug('')
    setEventDescription('')
    setEventContent('')
    setEventFeaturedImage('')
    setEventStartDate('')
    setEventEndDate('')
    setEventStartTime('')
    setEventEndTime('')
    setEventIsAllDay(false)
    setEventLocation('')
    setEventLocationUrl('')
    setEventIsOnline(false)
    setEventOnlineUrl('')
    setEventCategoryId(null)
    setEventStatus('draft')
    setEventIsFeatured(false)
    setEventOrganizerName('')
    setEventOrganizerEmail('')
    setEventOrganizerPhone('')
    setEventTicketUrl('')
    setEventPrice('')
    setEventPriceText('')
    setEventCapacity('')
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === null || event.category_id === filterCategory

    const today = new Date().toISOString().split('T')[0]
    const eventEndDate = event.end_date || event.start_date
    let matchesFilter = true
    if (filterStatus === 'upcoming') {
      matchesFilter = event.start_date >= today
    } else if (filterStatus === 'past') {
      matchesFilter = eventEndDate < today
    }

    return matchesSearch && matchesCategory && matchesFilter
  }).sort((a, b) => {
    if (filterStatus === 'past') {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    }
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  })

  // Event handlers
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setIsNewEvent(false)
    setEventTitle(event.title)
    setEventSlug(event.slug)
    setEventDescription(event.description || '')
    setEventContent(event.content || '')
    setEventFeaturedImage(event.featured_image || '')
    setEventStartDate(event.start_date)
    setEventEndDate(event.end_date || '')
    setEventStartTime(event.start_time || '')
    setEventEndTime(event.end_time || '')
    setEventIsAllDay(event.is_all_day)
    setEventLocation(event.location || '')
    setEventLocationUrl(event.location_url || '')
    setEventIsOnline(event.is_online)
    setEventOnlineUrl(event.online_url || '')
    setEventCategoryId(event.category_id)
    setEventStatus(event.status === 'cancelled' ? 'draft' : event.status)
    setEventIsFeatured(event.is_featured)
    setEventOrganizerName(event.organizer_name || '')
    setEventOrganizerEmail(event.organizer_email || '')
    setEventOrganizerPhone(event.organizer_phone || '')
    setEventTicketUrl(event.ticket_url || '')
    setEventPrice(event.price?.toString() || '')
    setEventPriceText(event.price_text || '')
    setEventCapacity(event.capacity?.toString() || '')
    setViewMode('editor')
  }

  const handleCreateEvent = () => {
    setEditingEvent(null)
    setIsNewEvent(true)
    resetEventForm()
    // Set default start date to today
    setEventStartDate(new Date().toISOString().split('T')[0])
    setViewMode('editor')
  }

  const handleSaveEvent = async () => {
    if (!eventTitle.trim() || !eventStartDate) return

    setSaving(true)
    try {
      const eventData = {
        type,
        reference_id: referenceId,
        title: eventTitle,
        slug: eventSlug || generateSlug(eventTitle),
        description: eventDescription || undefined,
        content: eventContent || undefined,
        featured_image: eventFeaturedImage || undefined,
        start_date: eventStartDate,
        end_date: eventEndDate || undefined,
        start_time: eventIsAllDay ? undefined : eventStartTime || undefined,
        end_time: eventIsAllDay ? undefined : eventEndTime || undefined,
        is_all_day: eventIsAllDay,
        location: eventLocation || undefined,
        location_url: eventLocationUrl || undefined,
        is_online: eventIsOnline,
        online_url: eventIsOnline ? eventOnlineUrl || undefined : undefined,
        category_id: eventCategoryId || undefined,
        status: eventStatus as 'draft' | 'published' | 'cancelled',
        is_featured: eventIsFeatured,
        organizer_name: eventOrganizerName || undefined,
        organizer_email: eventOrganizerEmail || undefined,
        organizer_phone: eventOrganizerPhone || undefined,
        ticket_url: eventTicketUrl || undefined,
        price: eventPrice ? parseFloat(eventPrice) : undefined,
        price_text: eventPriceText || undefined,
        capacity: eventCapacity ? parseInt(eventCapacity) : undefined,
      }

      if (isNewEvent) {
        await api.createEvent(eventData)
      } else if (editingEvent) {
        await api.updateEvent(editingEvent.id, eventData)
      }

      await loadData()
      setViewMode('list')
      resetEventForm()
      setEditingEvent(null)
      setIsNewEvent(false)
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await api.deleteEvent(eventId, type, referenceId)
      setEvents(events.filter(e => e.id !== eventId))
      setEventMenuOpen(null)
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('Failed to delete event')
    }
  }

  // Category handlers
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setCreatingCategory(true)
    try {
      await api.createEventCategory({
        type,
        reference_id: referenceId,
        name: newCategoryName,
        description: newCategoryDescription || undefined,
        color: newCategoryColor
      })

      const categoriesRes = await api.getEventCategories(type, referenceId)
      setCategories(categoriesRes.data || [])
      setNewCategoryName('')
      setNewCategoryDescription('')
      setNewCategoryColor('#98b290')
      setShowCreateCategory(false)
    } catch (error) {
      console.error('Failed to create category:', error)
      alert('Failed to create category')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return

    setCreatingCategory(true)
    try {
      await api.updateEventCategory(editingCategory.id, {
        type,
        reference_id: referenceId,
        name: newCategoryName,
        description: newCategoryDescription || undefined,
        color: newCategoryColor
      })

      const categoriesRes = await api.getEventCategories(type, referenceId)
      setCategories(categoriesRes.data || [])
      setEditingCategory(null)
      setNewCategoryName('')
      setNewCategoryDescription('')
      setNewCategoryColor('#98b290')
    } catch (error) {
      console.error('Failed to update category:', error)
      alert('Failed to update category')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? Events in this category will be uncategorized.')) return

    try {
      await api.deleteEventCategory(categoryId, type, referenceId)
      setCategories(categories.filter(c => c.id !== categoryId))
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  const startEditCategory = (category: EventCategory) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryDescription(category.description || '')
    setNewCategoryColor(category.color)
  }

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const getEventsForDate = (date: string) => {
    return events.filter(event => {
      if (event.status !== 'published') return false
      const eventEnd = event.end_date || event.start_date
      return date >= event.start_date && date <= eventEnd
    })
  }

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12)
      setCalendarYear(calendarYear - 1)
    } else {
      setCalendarMonth(calendarMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1)
      setCalendarYear(calendarYear + 1)
    } else {
      setCalendarMonth(calendarMonth + 1)
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  // Render list view
  const renderEventsList = () => (
    <div className="flex-1 overflow-y-auto">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterMode)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All Events</option>
          </select>
          <select
            value={filterCategory ?? ''}
            onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events list */}
      <div className="p-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No events found</p>
            <button
              onClick={handleCreateEvent}
              className="mt-4 px-4 py-2 bg-[#98b290] text-white rounded-lg hover:bg-[#7a9072] transition text-sm"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#98b290] transition relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {event.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        event.status === 'published' ? 'bg-green-100 text-green-700' :
                        event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {event.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(event.start_date)}
                        {event.end_date && event.end_date !== event.start_date && (
                          <> - {formatDate(event.end_date)}</>
                        )}
                      </span>
                      {!event.is_all_day && event.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(event.start_time)}
                          {event.end_time && <> - {formatTime(event.end_time)}</>}
                        </span>
                      )}
                      {event.is_all_day && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">All Day</span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                      {event.is_online && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          Online
                        </span>
                      )}
                    </div>

                    {event.category && (
                      <div className="mt-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: event.category.color + '20', color: event.category.color }}
                        >
                          <Tag className="w-3 h-3" />
                          {event.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setEventMenuOpen(eventMenuOpen === event.id ? null : event.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>

                    {eventMenuOpen === event.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                        <button
                          onClick={() => { handleEditEvent(event); setEventMenuOpen(null) }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Render calendar view
  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth)
    const days = []

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = getEventsForDate(dateStr)
      const isToday = dateStr === new Date().toISOString().split('T')[0]

      days.push(
        <div key={day} className={`h-24 border border-gray-100 p-1 ${isToday ? 'bg-blue-50' : ''}`}>
          <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{day}</div>
          <div className="mt-1 space-y-0.5 overflow-hidden">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                className="text-xs truncate px-1 py-0.5 rounded cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: event.category?.color || '#98b290',
                  color: 'white'
                }}
                onClick={() => handleEditEvent(event)}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-y-auto p-4">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold">
            {monthNames[calendarMonth - 1]} {calendarYear}
          </h3>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-t border-l border-gray-200">
          {days}
        </div>
      </div>
    )
  }

  // Render categories view
  const renderCategoriesManager = () => (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Event Categories</h3>
        <button
          onClick={() => { setShowCreateCategory(true); setEditingCategory(null); setNewCategoryName(''); setNewCategoryDescription(''); setNewCategoryColor('#98b290'); }}
          className="px-3 py-1.5 bg-[#98b290] text-white rounded-lg hover:bg-[#7a9072] transition text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Create/Edit category form */}
      {(showCreateCategory || editingCategory) && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-sm mb-3">{editingCategory ? 'Edit Category' : 'New Category'}</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Description (optional)</label>
              <input
                type="text"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Category description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="px-4 py-2 bg-[#98b290] text-white rounded-lg hover:bg-[#7a9072] transition text-sm disabled:opacity-50"
              >
                {creatingCategory ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
              </button>
              <button
                onClick={() => { setShowCreateCategory(false); setEditingCategory(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No categories yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(category => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#98b290] transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category.color }}
                ></div>
                <div>
                  <div className="font-medium text-sm">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-gray-500">{category.description}</div>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {category.event_count || 0} events
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEditCategory(category)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Pencil className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Render event editor
  const renderEventEditor = () => (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => {
              setEventTitle(e.target.value)
              if (isNewEvent) setEventSlug(generateSlug(e.target.value))
            }}
            placeholder="Event title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Slug</label>
          <input
            type="text"
            value={eventSlug}
            onChange={(e) => setEventSlug(e.target.value)}
            placeholder="event-url-slug"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Start Date *</label>
            <input
              type="date"
              value={eventStartDate}
              onChange={(e) => setEventStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">End Date</label>
            <input
              type="date"
              value={eventEndDate}
              onChange={(e) => setEventEndDate(e.target.value)}
              min={eventStartDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
        </div>

        {/* All Day checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={eventIsAllDay}
            onChange={(e) => setEventIsAllDay(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">All-day event</span>
        </label>

        {/* Time fields */}
        {!eventIsAllDay && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Start Time</label>
              <input
                type="time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">End Time</label>
              <input
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
          <input
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="Venue name or address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Location URL (Google Maps, etc.)</label>
          <input
            type="url"
            value={eventLocationUrl}
            onChange={(e) => setEventLocationUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        {/* Online event */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={eventIsOnline}
            onChange={(e) => setEventIsOnline(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Online / Virtual event</span>
        </label>

        {eventIsOnline && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Online Event URL</label>
            <input
              type="url"
              value={eventOnlineUrl}
              onChange={(e) => setEventOnlineUrl(e.target.value)}
              placeholder="https://zoom.us/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Short Description</label>
          <textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Brief event description for listings..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        {/* Full Content */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Full Details</label>
          <textarea
            value={eventContent}
            onChange={(e) => setEventContent(e.target.value)}
            placeholder="Full event details and information..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
          <select
            value={eventCategoryId ?? ''}
            onChange={(e) => setEventCategoryId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          >
            <option value="">No category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Featured Image */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Featured Image URL</label>
          <input
            type="text"
            value={eventFeaturedImage}
            onChange={(e) => setEventFeaturedImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Price</label>
            <input
              type="number"
              value={eventPrice}
              onChange={(e) => setEventPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Price Text</label>
            <input
              type="text"
              value={eventPriceText}
              onChange={(e) => setEventPriceText(e.target.value)}
              placeholder="Free, $50-$100, Donation, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
        </div>

        {/* Ticket URL */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Ticket/Registration URL</label>
          <input
            type="url"
            value={eventTicketUrl}
            onChange={(e) => setEventTicketUrl(e.target.value)}
            placeholder="https://eventbrite.com/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Capacity</label>
          <input
            type="number"
            value={eventCapacity}
            onChange={(e) => setEventCapacity(e.target.value)}
            placeholder="Maximum attendees"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        {/* Organizer */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Organizer Information</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={eventOrganizerName}
              onChange={(e) => setEventOrganizerName(e.target.value)}
              placeholder="Organizer name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
            <input
              type="email"
              value={eventOrganizerEmail}
              onChange={(e) => setEventOrganizerEmail(e.target.value)}
              placeholder="Organizer email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
            <input
              type="tel"
              value={eventOrganizerPhone}
              onChange={(e) => setEventOrganizerPhone(e.target.value)}
              placeholder="Organizer phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
        </div>

        {/* Status & Featured */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value as 'draft' | 'published')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={eventIsFeatured}
              onChange={(e) => setEventIsFeatured(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Featured Event</span>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {viewMode === 'editor' && (
              <button
                onClick={() => { setViewMode('list'); setEditingEvent(null); setIsNewEvent(false); resetEventForm(); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === 'editor' ? (isNewEvent ? 'Create Event' : 'Edit Event') : 'Events Manager'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {viewMode !== 'editor' && (
              <>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${viewMode === 'calendar' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                  >
                    Calendar
                  </button>
                  <button
                    onClick={() => setViewMode('categories')}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${viewMode === 'categories' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                  >
                    Categories
                  </button>
                </div>
                <button
                  onClick={handleCreateEvent}
                  className="px-3 py-1.5 bg-[#98b290] text-white rounded-lg hover:bg-[#7a9072] transition text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> New Event
                </button>
              </>
            )}
            {viewMode === 'editor' && (
              <button
                onClick={handleSaveEvent}
                disabled={saving || !eventTitle.trim() || !eventStartDate}
                className="px-4 py-1.5 bg-[#98b290] text-white rounded-lg hover:bg-[#7a9072] transition text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Event'}
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#98b290]" />
          </div>
        ) : !databaseId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 mb-2">No database found</p>
              <p className="text-sm text-gray-500">Please install the Events feature first</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'list' && renderEventsList()}
            {viewMode === 'calendar' && renderCalendarView()}
            {viewMode === 'categories' && renderCategoriesManager()}
            {viewMode === 'editor' && renderEventEditor()}
          </>
        )}
      </div>
    </div>
  )
}
