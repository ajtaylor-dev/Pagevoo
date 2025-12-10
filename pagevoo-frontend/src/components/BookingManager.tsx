import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  DollarSign,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  List,
  Grid3X3,
  RefreshCw,
  Eye,
  XCircle,
  CheckCircle,
  Timer,
  Briefcase,
} from 'lucide-react';
import { api } from '../services/api';
import { databaseService } from '../services/databaseService';

interface BookingManagerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'template' | 'website';
  referenceId: number;
  onBookingTypeChange?: (type: 'appointments' | 'restaurant' | 'classes' | 'events' | 'rentals') => void;
  onServicesChange?: () => void;  // Callback when services are modified
  installedFeatures?: string[];  // To check dependencies
}

interface BookingService {
  id: number;
  category_id: number | null;
  category?: BookingCategory;
  name: string;
  slug: string;
  description: string | null;
  featured_image: string | null;
  type: 'appointment' | 'reservation';
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  capacity: number;
  min_party_size: number;
  max_party_size: number | null;
  pricing_type: 'free' | 'fixed' | 'per_person' | 'hourly';
  price: number;
  currency: string;
  allow_pay_online: boolean;
  allow_pay_at_venue: boolean;
  require_deposit: boolean;
  deposit_amount: number | null;
  deposit_type: 'fixed' | 'percentage' | null;
  require_login: boolean;
  min_advance_hours: number;
  max_advance_days: number;
  cancellation_hours: number;
  require_staff: boolean;
  allow_staff_selection: boolean;
  allow_recurring: boolean;
  recurring_options: string[] | null;
  order: number;
  is_active: boolean;
  staff?: BookingStaff[];
}

interface BookingCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  order: number;
  is_active: boolean;
  services_count?: number;
}

interface BookingStaff {
  id: number;
  uas_user_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  title: string | null;
  color: string;
  order: number;
  is_active: boolean;
  services?: BookingService[];
}

interface Booking {
  id: number;
  booking_reference: string;
  service_id: number;
  service?: BookingService;
  staff_id: number | null;
  staff?: BookingStaff;
  resource_id: number | null;
  uas_user_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_notes: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  is_recurring: boolean;
  recurring_pattern: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  cancellation_reason: string | null;
  total_price: number;
  deposit_paid: number;
  amount_paid: number;
  payment_status: 'not_required' | 'pending' | 'deposit_paid' | 'paid' | 'refunded' | 'partial_refund';
  payment_method: string | null;
  admin_notes: string | null;
  reminder_sent: boolean;
  created_at: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  status: string;
  booking: Booking;
}

interface Stats {
  today: number;
  pending: number;
  upcoming: number;
  this_week: number;
  this_month: number;
}

// Booking Types - determines which options are shown
type BookingType =
  | 'appointments'    // 1-on-1 services: salon, spa, consulting, healthcare
  | 'restaurant'      // Table reservations with party size
  | 'classes'         // Classes/courses with capacity
  | 'events'          // Ticketed events with payment (requires Events feature + UAS + E-commerce)
  | 'rentals';        // Equipment/space rentals with duration

interface BookingTypeConfig {
  id: BookingType;
  name: string;
  description: string;
  icon: string;
  features: {
    // Display options
    showStaff: boolean;           // Show staff/instructor to customers
    showPartySize: boolean;       // Party size or ticket quantity
    showCapacity: boolean;        // Show capacity limits / tickets remaining
    showDuration: boolean;        // Duration configuration
    showRecurring: boolean;       // Recurring bookings option
    showWaitlist: boolean;        // Waitlist when full
    showSkillLevel: boolean;      // Skill level indicator
    showQuantity: boolean;        // Quantity selector (e.g., rent 3 kayaks)
    showAvailabilityCalendar: boolean; // Show availability calendar
    showPickupDelivery: boolean;  // Pickup/delivery options
    showTicketTypes: boolean;     // Multiple ticket types
    showNotes: boolean;           // Customer notes/comments field
    // Labels
    staffLabel: string;
    customerLabel: string;
    serviceLabel: string;
    bookingLabel: string;
    // Dependencies (only UAS and Events - payment is handled by e-commerce separately)
    requiresUAS: boolean;         // Requires User Access System
    requiresEventsFeature: boolean; // Requires Events feature
  };
}

const BOOKING_TYPES: BookingTypeConfig[] = [
  {
    id: 'appointments',
    name: 'Appointments',
    description: 'One-on-one services like salons, spas, consultations, garages, or healthcare',
    icon: '💇',
    features: {
      // Display options
      showStaff: true,              // Staff managed in booking manager, assigned to appointments
      showPartySize: false,
      showCapacity: false,          // Create "Group Appointment" service if needed
      showDuration: true,           // Per-service duration
      showRecurring: true,          // Optional recurring appointments
      showWaitlist: false,
      showSkillLevel: false,
      showQuantity: false,
      showAvailabilityCalendar: false,
      showPickupDelivery: false,
      showTicketTypes: false,
      showNotes: true,              // Customer comment box
      // Labels
      staffLabel: 'Staff Member',
      customerLabel: 'Client',
      serviceLabel: 'Service',
      bookingLabel: 'Appointment',
      // Dependencies
      requiresUAS: false,
      requiresEventsFeature: false,
    },
  },
  {
    id: 'restaurant',
    name: 'Restaurant / Table Reservations',
    description: 'Table bookings with party size for restaurants, cafes, or bars',
    icon: '🍽️',
    features: {
      // Display options
      showStaff: false,
      showPartySize: true,
      showCapacity: true,
      showDuration: true,           // Reservation duration set by owner
      showRecurring: false,
      showWaitlist: false,
      showSkillLevel: false,
      showQuantity: false,
      showAvailabilityCalendar: false,
      showPickupDelivery: false,
      showTicketTypes: false,
      showNotes: true,              // Special requests, dietary, seating preferences
      // Labels
      staffLabel: 'Server',
      customerLabel: 'Guest',
      serviceLabel: 'Table/Area',
      bookingLabel: 'Reservation',
      // Dependencies - none required
      requiresUAS: false,
      requiresEventsFeature: false,
    },
  },
  {
    id: 'classes',
    name: 'Classes & Workshops',
    description: 'Fitness classes, yoga, workshops, or courses with limited spots',
    icon: '🧘',
    features: {
      // Display options
      showStaff: true,              // Instructor shown to customers
      showPartySize: false,
      showCapacity: true,           // Max participants per class
      showDuration: true,
      showRecurring: true,          // Recurring class schedules
      showWaitlist: true,           // Join waitlist if class full
      showSkillLevel: true,         // Beginner/intermediate/advanced
      showQuantity: false,          // One place per booking
      showAvailabilityCalendar: false,
      showPickupDelivery: false,
      showTicketTypes: false,
      showNotes: false,
      // Labels
      staffLabel: 'Instructor',
      customerLabel: 'Participant',
      serviceLabel: 'Class',
      bookingLabel: 'Registration',
      // Dependencies - only UAS required
      requiresUAS: true,            // Users must be registered to book classes
      requiresEventsFeature: false,
    },
  },
  {
    id: 'events',
    name: 'Events & Tickets',
    description: 'Ticketed events, shows, concerts, or experiences',
    icon: '🎫',
    features: {
      // Display options
      showStaff: false,
      showPartySize: true,          // Ticket quantity
      showCapacity: true,           // Tickets remaining
      showDuration: false,
      showRecurring: false,
      showWaitlist: false,
      showSkillLevel: false,
      showQuantity: false,
      showAvailabilityCalendar: false,
      showPickupDelivery: false,
      showTicketTypes: true,        // General, VIP, different seat areas
      showNotes: false,
      // Labels
      staffLabel: 'Host',
      customerLabel: 'Attendee',
      serviceLabel: 'Event',
      bookingLabel: 'Ticket',
      // Dependencies - requires UAS and Events feature
      requiresUAS: true,            // Users must be registered to buy tickets
      requiresEventsFeature: true,  // Requires Events feature installed
    },
  },
  {
    id: 'rentals',
    name: 'Rentals & Equipment Hire',
    description: 'Equipment rentals, vehicle hire, or property/venue bookings',
    icon: '🚲',
    features: {
      // Display options
      showStaff: false,
      showPartySize: false,
      showCapacity: false,
      showDuration: true,           // Hourly/daily/weekly rates
      showRecurring: false,
      showWaitlist: false,
      showSkillLevel: false,
      showQuantity: true,           // Rent multiple of same item
      showAvailabilityCalendar: true, // Show available dates
      showPickupDelivery: true,     // Pickup or delivery option
      showTicketTypes: false,
      showNotes: true,              // Customer notes
      // Labels
      staffLabel: 'Manager',
      customerLabel: 'Renter',
      serviceLabel: 'Item',
      bookingLabel: 'Rental',
      // Dependencies - none required
      requiresUAS: false,
      requiresEventsFeature: false,
    },
  },
];

interface BookingSettings {
  // Type configuration
  booking_type: BookingType;

  // Business info
  business_name?: string;
  business_email?: string;
  business_phone?: string;

  // Regional settings
  currency: string;
  timezone: string;

  // Booking rules
  slot_interval_minutes: number;
  min_advance_booking_hours: number;
  max_advance_booking_days: number;
  default_duration_minutes: number;

  // Capacity settings (for classes/events/restaurant)
  default_capacity: number;
  allow_waitlist: boolean;

  // Notifications
  send_confirmation_email: boolean;
  send_reminder_email: boolean;
  reminder_hours_before: number;

  // Labels (customizable based on type)
  staff_label?: string;
  customer_label?: string;
  service_label?: string;
  booking_label?: string;

  // Policies
  terms_and_conditions?: string;
  cancellation_policy?: string;
  cancellation_hours: number;
  allow_cancellation: boolean;
  allow_reschedule: boolean;
}

interface BusinessHours {
  id?: number;
  staff_id: number | null;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

const DEFAULT_SETTINGS: BookingSettings = {
  booking_type: 'appointments',
  currency: 'GBP',
  timezone: 'Europe/London',
  slot_interval_minutes: 15,
  min_advance_booking_hours: 2,
  max_advance_booking_days: 60,
  default_duration_minutes: 60,
  default_capacity: 1,
  allow_waitlist: false,
  send_confirmation_email: true,
  send_reminder_email: true,
  reminder_hours_before: 24,
  cancellation_hours: 24,
  allow_cancellation: true,
  allow_reschedule: true,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIMEZONES = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (AZ)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AK)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HI)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const CURRENCIES = [
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
  { value: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥' },
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
];

type TabType = 'bookings' | 'services' | 'staff' | 'settings';
type ViewMode = 'list' | 'calendar';

const BookingManager: React.FC<BookingManagerProps> = ({
  isOpen,
  onClose,
  type,
  referenceId,
  onBookingTypeChange,
  onServicesChange,
  installedFeatures = [],
}) => {
  // Check if required features are installed
  const hasUAS = installedFeatures.includes('user_access_system');
  const hasEvents = installedFeatures.includes('events');
  const hasEcommerce = installedFeatures.includes('ecommerce');

  // Check if a booking type's dependencies are met
  // Note: E-commerce is not a dependency for booking types - payment is optional and configured separately
  const checkDependencies = (bookingType: BookingTypeConfig) => {
    const missing: string[] = [];
    if (bookingType.features.requiresUAS && !hasUAS) {
      missing.push('User Access System');
    }
    if (bookingType.features.requiresEventsFeature && !hasEvents) {
      missing.push('Events');
    }
    return missing;
  };
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [categories, setCategories] = useState<BookingCategory[]>([]);
  const [staff, setStaff] = useState<BookingStaff[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<Stats>({
    today: 0,
    pending: 0,
    upcoming: 0,
    this_week: 0,
    this_month: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Edit states
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingService, setEditingService] = useState<BookingService | null>(null);
  const [editingStaff, setEditingStaff] = useState<BookingStaff | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Settings state
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_SETTINGS);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsActiveSection, setSettingsActiveSection] = useState<'type' | 'general' | 'hours' | 'rules' | 'notifications'>('type');

  // Get current booking type config
  const currentTypeConfig = BOOKING_TYPES.find((t) => t.id === settings.booking_type) || BOOKING_TYPES[0];

  useEffect(() => {
    if (isOpen) {
      if (referenceId && referenceId > 0) {
        loadData();
      } else {
        setLoading(false);
        setError('Invalid reference ID. Please ensure you have a valid website or template selected.');
      }
    }
  }, [isOpen, referenceId, type]);

  useEffect(() => {
    if (isOpen && viewMode === 'calendar') {
      loadCalendarData();
    }
  }, [currentMonth, viewMode, isOpen]);

  // Load settings when settings tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'settings' && referenceId > 0) {
      loadSettings();
    }
  }, [activeTab, isOpen, referenceId]);

  // Query params for all API calls
  const queryParams = { type, reference_id: referenceId };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const instance = await databaseService.getInstance(type, referenceId);
      if (!instance) {
        setError('No database found. Please ensure the Booking feature is installed.');
        setLoading(false);
        return;
      }

      const [bookingsRes, servicesRes, categoriesRes, staffRes, statsRes, settingsRes] = await Promise.all([
        api.get('/v1/script-features/booking', queryParams),
        api.get('/v1/script-features/booking/services/all', queryParams),
        api.get('/v1/script-features/booking/categories/all', queryParams),
        api.get('/v1/script-features/booking/staff/all', queryParams),
        api.get('/v1/script-features/booking/dashboard', queryParams),
        api.get('/v1/script-features/booking/settings', queryParams),
      ]);

      setBookings(bookingsRes.data?.data || bookingsRes.data || bookingsRes || []);
      setServices(Array.isArray(servicesRes.data?.data) ? servicesRes.data.data : (servicesRes.data?.data || servicesRes.data || []));
      setCategories(Array.isArray(categoriesRes.data?.data) ? categoriesRes.data.data : (categoriesRes.data?.data || categoriesRes.data || []));
      setStaff(Array.isArray(staffRes.data?.data) ? staffRes.data.data : (staffRes.data?.data || staffRes.data || []));
      setStats(statsRes.data?.data || statsRes.data || stats);

      // Load settings and notify parent of booking type immediately
      // api.get returns response.data from Axios, so settingsRes = { success: true, data: {...} }
      const loadedSettings = settingsRes.data || settingsRes || {};
      setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings });
      if (onBookingTypeChange && loadedSettings.booking_type) {
        onBookingTypeChange(loadedSettings.booking_type);
      }
    } catch (err: any) {
      console.error('Error loading booking data:', err);
      setError(err.response?.data?.error || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const res = await api.get('/v1/script-features/booking/calendar', {
        ...queryParams,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      setCalendarEvents(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    }
  };

  // Settings handlers
  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const [settingsRes, hoursRes] = await Promise.all([
        api.get('/v1/script-features/booking/settings', queryParams),
        api.get('/v1/script-features/booking/business-hours', queryParams),
      ]);

      // api.get returns response.data from Axios, so settingsRes = { success: true, data: {...} }
      const loadedSettings = settingsRes.data || settingsRes || {};
      setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings });

      // Notify parent of booking type
      if (onBookingTypeChange && loadedSettings.booking_type) {
        onBookingTypeChange(loadedSettings.booking_type);
      }

      const hours = hoursRes.data || hoursRes || [];
      // Initialize default hours if empty
      if (hours.length === 0) {
        const defaultHours: BusinessHours[] = [];
        for (let i = 0; i < 7; i++) {
          defaultHours.push({
            staff_id: null,
            day_of_week: i,
            is_open: i >= 1 && i <= 5, // Mon-Fri open
            open_time: '09:00',
            close_time: '17:00',
            break_start: null,
            break_end: null,
          });
        }
        setBusinessHours(defaultHours);
      } else {
        setBusinessHours(hours);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await api.put('/v1/script-features/booking/settings', { ...settings, type, reference_id: referenceId });
      alert('Settings saved successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveBusinessHours = async () => {
    setSettingsSaving(true);
    try {
      await api.put('/v1/script-features/booking/business-hours', {
        type,
        reference_id: referenceId,
        hours: businessHours,
      });
      alert('Business hours saved successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save business hours');
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateBusinessHour = (dayOfWeek: number, updates: Partial<BusinessHours>) => {
    setBusinessHours((prev) =>
      prev.map((h) => (h.day_of_week === dayOfWeek ? { ...h, ...updates } : h))
    );
  };

  // Booking handlers
  const handleCreateBooking = async (data: Partial<Booking>) => {
    try {
      await api.post('/v1/script-features/booking', { ...data, type, reference_id: referenceId });
      await loadData();
      setShowBookingForm(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create booking');
    }
  };

  const handleUpdateBooking = async (id: number, data: Partial<Booking>) => {
    try {
      await api.put(`/v1/script-features/booking/${id}`, { ...data, type, reference_id: referenceId });
      await loadData();
      setEditingBooking(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update booking');
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      await api.delete(`/v1/script-features/booking/${id}`, queryParams);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete booking');
    }
  };

  const handleUpdateBookingStatus = async (id: number, status: string) => {
    try {
      await api.put(`/v1/script-features/booking/${id}`, { status, type, reference_id: referenceId });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update booking status');
    }
  };

  // Service handlers
  const handleCreateService = async (data: Partial<BookingService>) => {
    try {
      await api.post('/v1/script-features/booking/services', { ...data, type, reference_id: referenceId });
      await loadData();
      setShowServiceForm(false);
      onServicesChange?.();  // Notify parent that services changed
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create service');
    }
  };

  const handleUpdateService = async (id: number, data: Partial<BookingService>) => {
    try {
      await api.put(`/v1/script-features/booking/services/${id}`, { ...data, type, reference_id: referenceId });
      await loadData();
      setEditingService(null);
      onServicesChange?.();  // Notify parent that services changed
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update service');
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service? All associated bookings will also be deleted.')) return;
    try {
      await api.delete(`/v1/script-features/booking/services/${id}`, queryParams);
      await loadData();
      onServicesChange?.();  // Notify parent that services changed
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete service');
    }
  };

  // Staff handlers
  const handleCreateStaff = async (data: Partial<BookingStaff>) => {
    try {
      await api.post('/v1/script-features/booking/staff', { ...data, type, reference_id: referenceId });
      await loadData();
      setShowStaffForm(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create staff member');
    }
  };

  const handleUpdateStaff = async (id: number, data: Partial<BookingStaff>) => {
    try {
      await api.put(`/v1/script-features/booking/staff/${id}`, { ...data, type, reference_id: referenceId });
      await loadData();
      setEditingStaff(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update staff member');
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.delete(`/v1/script-features/booking/staff/${id}`, queryParams);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete staff member');
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter((event) => event.start.startsWith(dateStr));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' };
    return `${symbols[currency] || currency}${amount.toFixed(2)}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-[#1a1a2e] rounded-lg shadow-xl w-[95vw] max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Booking Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-3 border-b border-gray-700 bg-[#16162a]">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Today: {stats.today}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Pending: {stats.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Upcoming: {stats.upcoming}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-300">This Week: {stats.this_week}</span>
            </div>
          </div>
        </div>

        {/* Tabs - labels change based on booking type */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'bookings', label: `${currentTypeConfig.features.bookingLabel}s`, icon: Calendar },
            { id: 'services', label: (() => {
              const label = currentTypeConfig.features.serviceLabel;
              if (label === 'Class') return 'Classes';
              if (label === 'Table/Area') return 'Tables';
              if (label.endsWith('s')) return label;
              return label + 's';
            })(), icon: Briefcase },
            ...(currentTypeConfig.features.showStaff ? [{ id: 'staff', label: `${currentTypeConfig.features.staffLabel}s`, icon: Users }] : []),
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search bookings..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white text-sm w-64 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                        <option value="no_show">No Show</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-[#2a2a4a] rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
                        >
                          <List className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => setViewMode('calendar')}
                          className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
                        >
                          <Grid3X3 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <button
                        onClick={() => setShowBookingForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        New Booking
                      </button>
                    </div>
                  </div>

                  {viewMode === 'list' ? (
                    /* List View */
                    <div className="bg-[#2a2a4a] rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-[#1a1a2e]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reference</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Service</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date & Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {filteredBookings.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                No bookings found
                              </td>
                            </tr>
                          ) : (
                            filteredBookings.map((booking) => (
                              <tr key={booking.id} className="hover:bg-[#1a1a2e]">
                                <td className="px-4 py-3">
                                  <span className="text-purple-400 font-mono text-sm">{booking.booking_reference}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <div className="text-white text-sm">{booking.customer_name}</div>
                                    <div className="text-gray-400 text-xs">{booking.customer_email}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-white text-sm">{booking.service?.name || 'Unknown'}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <div className="text-white text-sm">{formatDate(booking.booking_date)}</div>
                                    <div className="text-gray-400 text-xs">
                                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-white text-sm">
                                    {booking.total_price > 0 ? formatCurrency(booking.total_price) : 'Free'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-2">
                                    {booking.status === 'pending' && (
                                      <button
                                        onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                        className="p-1 text-green-400 hover:text-green-300"
                                        title="Confirm"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setEditingBooking(booking)}
                                      className="p-1 text-gray-400 hover:text-white"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBooking(booking.id)}
                                      className="p-1 text-red-400 hover:text-red-300"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Calendar View */
                    <div className="bg-[#2a2a4a] rounded-lg p-4">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-2 hover:bg-gray-700 rounded"
                        >
                          <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <h3 className="text-lg font-medium text-white">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="p-2 hover:bg-gray-700 rounded"
                        >
                          <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="p-2 text-center text-xs font-medium text-gray-400">
                            {day}
                          </div>
                        ))}
                        {getDaysInMonth(currentMonth).map((date, index) => {
                          const events = date ? getEventsForDay(date) : [];
                          const isToday = date && date.toDateString() === new Date().toDateString();

                          return (
                            <div
                              key={index}
                              className={`min-h-[100px] p-1 border border-gray-700 rounded ${
                                date ? 'bg-[#1a1a2e]' : 'bg-transparent'
                              }`}
                            >
                              {date && (
                                <>
                                  <div
                                    className={`text-sm mb-1 ${
                                      isToday
                                        ? 'bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    {date.getDate()}
                                  </div>
                                  <div className="space-y-1">
                                    {events.slice(0, 3).map((event) => (
                                      <div
                                        key={event.id}
                                        className="text-xs px-1 py-0.5 rounded truncate cursor-pointer"
                                        style={{ backgroundColor: event.color + '40', color: event.color }}
                                        onClick={() => {
                                          setEditingBooking(event.booking);
                                        }}
                                        title={event.title}
                                      >
                                        {event.title}
                                      </div>
                                    ))}
                                    {events.length > 3 && (
                                      <div className="text-xs text-gray-400">+{events.length - 3} more</div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Services</h3>
                    <button
                      onClick={() => setShowServiceForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Service
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {services.length === 0 ? (
                      <div className="bg-[#2a2a4a] rounded-lg p-8 text-center text-gray-400">
                        No services created yet. Add your first service to start accepting bookings.
                      </div>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service.id}
                          className="bg-[#2a2a4a] rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                service.type === 'appointment' ? 'bg-blue-500/20' : 'bg-green-500/20'
                              }`}
                            >
                              {service.type === 'appointment' ? (
                                <Clock className="w-6 h-6 text-blue-400" />
                              ) : (
                                <Users className="w-6 h-6 text-green-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{service.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  {service.duration_minutes} min
                                </span>
                                <span>
                                  {service.pricing_type === 'free'
                                    ? 'Free'
                                    : formatCurrency(service.price, service.currency)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    service.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  {service.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingService(service)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Staff Tab */}
              {activeTab === 'staff' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Staff Members</h3>
                    <button
                      onClick={() => setShowStaffForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Staff
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {staff.length === 0 ? (
                      <div className="col-span-full bg-[#2a2a4a] rounded-lg p-8 text-center text-gray-400">
                        No staff members added yet. Staff are optional - add them if you want to assign bookings.
                      </div>
                    ) : (
                      staff.map((member) => (
                        <div key={member.id} className="bg-[#2a2a4a] rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-medium">{member.name}</h4>
                              {member.title && <p className="text-sm text-gray-400">{member.title}</p>}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                member.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {member.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {member.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700">
                            <button
                              onClick={() => setEditingStaff(member)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(member.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Settings Navigation */}
                      <div className="flex gap-2 border-b border-gray-700 pb-4 overflow-x-auto">
                        {[
                          { id: 'type', label: 'Booking Type', icon: Briefcase },
                          { id: 'general', label: 'Business Info', icon: Settings },
                          { id: 'hours', label: 'Hours', icon: Clock },
                          { id: 'rules', label: 'Rules & Policies', icon: FileText },
                          { id: 'notifications', label: 'Notifications', icon: Mail },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setSettingsActiveSection(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                              settingsActiveSection === tab.id
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                          >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Booking Type Selection */}
                      {settingsActiveSection === 'type' && (
                        <div className="space-y-6">
                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h3 className="text-lg font-medium text-white mb-2">What type of bookings do you need?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                              Choose the option that best matches your business. This will configure the relevant settings automatically.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                              {BOOKING_TYPES.map((bookingTypeOption) => {
                                const missingDeps = checkDependencies(bookingTypeOption);
                                const hasMissingDeps = missingDeps.length > 0;

                                return (
                                  <button
                                    key={bookingTypeOption.id}
                                    onClick={() => {
                                      if (hasMissingDeps) return; // Don't allow selection if dependencies missing
                                      setSettings({
                                        ...settings,
                                        booking_type: bookingTypeOption.id,
                                        staff_label: bookingTypeOption.features.staffLabel,
                                        customer_label: bookingTypeOption.features.customerLabel,
                                        service_label: bookingTypeOption.features.serviceLabel,
                                        booking_label: bookingTypeOption.features.bookingLabel,
                                      });
                                      // Notify parent of booking type change
                                      if (onBookingTypeChange) {
                                        onBookingTypeChange(bookingTypeOption.id);
                                      }
                                    }}
                                    disabled={hasMissingDeps}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                                      hasMissingDeps
                                        ? 'border-gray-700 bg-gray-800/50 opacity-60 cursor-not-allowed'
                                        : settings.booking_type === bookingTypeOption.id
                                          ? 'border-purple-500 bg-purple-500/10'
                                          : 'border-gray-600 bg-[#1a1a2e] hover:border-gray-500'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="text-2xl">{bookingTypeOption.icon}</span>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-medium text-white">{bookingTypeOption.name}</h4>
                                          {settings.booking_type === bookingTypeOption.id && !hasMissingDeps && (
                                            <Check className="w-5 h-5 text-purple-400" />
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{bookingTypeOption.description}</p>
                                        {hasMissingDeps && (
                                          <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Requires: {missingDeps.join(', ')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Show what features are enabled for this type */}
                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h4 className="text-sm font-medium text-gray-300 mb-4">
                              Features enabled for {currentTypeConfig.name}:
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { key: 'showStaff', label: `${currentTypeConfig.features.staffLabel} Management` },
                                { key: 'showPartySize', label: 'Party/Group Size' },
                                { key: 'showCapacity', label: 'Capacity Limits' },
                                { key: 'showDuration', label: 'Duration Settings' },
                                { key: 'showRecurring', label: 'Recurring Bookings' },
                                { key: 'showWaitlist', label: 'Waitlist Support' },
                                { key: 'showSkillLevel', label: 'Skill Levels' },
                                { key: 'showQuantity', label: 'Quantity Selection' },
                                { key: 'showNotes', label: 'Customer Notes' },
                              ].filter((feature) =>
                                currentTypeConfig.features[feature.key as keyof typeof currentTypeConfig.features]
                              ).map((feature) => (
                                <div
                                  key={feature.key}
                                  className="flex items-center gap-2 text-sm text-green-400"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {feature.label}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={handleSaveSettings}
                              disabled={settingsSaving}
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                              {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Save & Continue
                            </button>
                          </div>
                        </div>
                      )}

                      {/* General/Business Info */}
                      {settingsActiveSection === 'general' && (
                        <div className="space-y-6">
                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Business Information</h3>

                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
                                <input
                                  type="text"
                                  value={settings.business_name || ''}
                                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                  placeholder="Your Business Name"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                                <input
                                  type="email"
                                  value={settings.business_email || ''}
                                  onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                  placeholder="bookings@yourbusiness.com"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                                <input
                                  type="tel"
                                  value={settings.business_phone || ''}
                                  onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                  placeholder="+44 123 456 7890"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                                <select
                                  value={settings.timezone}
                                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                >
                                  {TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Currency Setting - for display purposes */}
                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Currency</h3>
                            <p className="text-gray-400 text-sm mb-4">
                              Currency used for displaying prices.
                              {hasEcommerce
                                ? ' Payment processing is configured in the E-commerce feature.'
                                : ' Install the E-commerce feature to accept payments.'}
                            </p>
                            <select
                              value={settings.currency}
                              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                              className="w-48 px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            >
                              {CURRENCIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={handleSaveSettings}
                              disabled={settingsSaving}
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                              {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Save Settings
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Business Hours */}
                      {settingsActiveSection === 'hours' && (
                        <div className="space-y-6">
                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h3 className="text-lg font-medium text-white mb-2">Operating Hours</h3>
                            <p className="text-gray-400 text-sm mb-6">
                              Set when customers can make {currentTypeConfig.features.bookingLabel.toLowerCase()}s.
                            </p>

                            <div className="space-y-3">
                              {businessHours.sort((a, b) => a.day_of_week - b.day_of_week).map((hour) => (
                                <div
                                  key={hour.day_of_week}
                                  className={`flex items-center gap-4 p-4 rounded-lg ${
                                    hour.is_open ? 'bg-[#1a1a2e]' : 'bg-[#1a1a2e]/50'
                                  }`}
                                >
                                  <div className="w-28">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={hour.is_open}
                                        onChange={(e) => updateBusinessHour(hour.day_of_week, { is_open: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                                      />
                                      <span className={`font-medium ${hour.is_open ? 'text-white' : 'text-gray-500'}`}>
                                        {DAY_NAMES[hour.day_of_week]}
                                      </span>
                                    </label>
                                  </div>

                                  {hour.is_open ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <input
                                        type="time"
                                        value={hour.open_time || '09:00'}
                                        onChange={(e) => updateBusinessHour(hour.day_of_week, { open_time: e.target.value })}
                                        className="px-2 py-1 bg-[#2a2a4a] border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                                      />
                                      <span className="text-gray-400">to</span>
                                      <input
                                        type="time"
                                        value={hour.close_time || '17:00'}
                                        onChange={(e) => updateBusinessHour(hour.day_of_week, { close_time: e.target.value })}
                                        className="px-2 py-1 bg-[#2a2a4a] border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-sm">Closed</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Slot interval - only show if duration matters */}
                          {currentTypeConfig.features.showDuration && (
                            <div className="bg-[#2a2a4a] rounded-lg p-6">
                              <h3 className="text-lg font-medium text-white mb-4">Time Slots</h3>
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Slot Interval</label>
                                  <select
                                    value={settings.slot_interval_minutes}
                                    onChange={(e) => setSettings({ ...settings, slot_interval_minutes: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                  >
                                    <option value={15}>Every 15 minutes</option>
                                    <option value={30}>Every 30 minutes</option>
                                    <option value={60}>Every hour</option>
                                  </select>
                                  <p className="text-xs text-gray-500 mt-1">How often time slots are shown</p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Default {currentTypeConfig.features.serviceLabel} Duration
                                  </label>
                                  <select
                                    value={settings.default_duration_minutes}
                                    onChange={(e) => setSettings({ ...settings, default_duration_minutes: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                  >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              onClick={handleSaveBusinessHours}
                              disabled={settingsSaving}
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                              {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Save Hours
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Rules & Policies */}
                      {settingsActiveSection === 'rules' && (
                        <div className="space-y-6">
                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Booking Rules</h3>

                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Notice</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={settings.min_advance_booking_hours}
                                    onChange={(e) => setSettings({ ...settings, min_advance_booking_hours: parseInt(e.target.value) || 0 })}
                                    className="w-20 px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                    min={0}
                                  />
                                  <span className="text-gray-400">hours before</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  How much notice is needed for a {currentTypeConfig.features.bookingLabel.toLowerCase()}
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Advance Booking Limit</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={settings.max_advance_booking_days}
                                    onChange={(e) => setSettings({ ...settings, max_advance_booking_days: parseInt(e.target.value) || 1 })}
                                    className="w-20 px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                    min={1}
                                  />
                                  <span className="text-gray-400">days ahead</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">How far in advance bookings can be made</p>
                              </div>

                              {/* Capacity - only for relevant types */}
                              {currentTypeConfig.features.showCapacity && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Default Capacity</label>
                                    <input
                                      type="number"
                                      value={settings.default_capacity}
                                      onChange={(e) => setSettings({ ...settings, default_capacity: parseInt(e.target.value) || 1 })}
                                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                      min={1}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      {settings.booking_type === 'restaurant'
                                        ? 'Maximum guests per table'
                                        : settings.booking_type === 'classes'
                                        ? 'Maximum participants per class'
                                        : 'Maximum attendees per slot'}
                                    </p>
                                  </div>

                                  <div className="flex items-center">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={settings.allow_waitlist}
                                        onChange={(e) => setSettings({ ...settings, allow_waitlist: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-600 bg-[#1a1a2e] text-purple-500 focus:ring-purple-500"
                                      />
                                      <div>
                                        <span className="text-gray-300 font-medium">Enable Waitlist</span>
                                        <p className="text-xs text-gray-500">Allow customers to join a waitlist when full</p>
                                      </div>
                                    </label>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Cancellation & Changes</h3>

                            <div className="space-y-4">
                              <label className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg cursor-pointer">
                                <div>
                                  <span className="text-gray-300 font-medium">Allow Cancellations</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {currentTypeConfig.features.customerLabel}s can cancel their {currentTypeConfig.features.bookingLabel.toLowerCase()}s
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={settings.allow_cancellation}
                                  onChange={(e) => setSettings({ ...settings, allow_cancellation: e.target.checked })}
                                  className="w-5 h-5 rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                                />
                              </label>

                              {settings.allow_cancellation && (
                                <div className="ml-4 p-4 bg-[#1a1a2e] rounded-lg border-l-2 border-purple-500">
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Cancellation Notice Required</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={settings.cancellation_hours}
                                      onChange={(e) => setSettings({ ...settings, cancellation_hours: parseInt(e.target.value) || 24 })}
                                      className="w-20 px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                      min={0}
                                    />
                                    <span className="text-gray-400">hours before</span>
                                  </div>
                                </div>
                              )}

                              <label className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg cursor-pointer">
                                <div>
                                  <span className="text-gray-300 font-medium">Allow Rescheduling</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {currentTypeConfig.features.customerLabel}s can change their {currentTypeConfig.features.bookingLabel.toLowerCase()} time
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={settings.allow_reschedule}
                                  onChange={(e) => setSettings({ ...settings, allow_reschedule: e.target.checked })}
                                  className="w-5 h-5 rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Terms & Cancellation Policy</h3>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Terms & Conditions (optional)
                                </label>
                                <textarea
                                  value={settings.terms_and_conditions || ''}
                                  onChange={(e) => setSettings({ ...settings, terms_and_conditions: e.target.value })}
                                  rows={3}
                                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                                  placeholder="Enter your terms and conditions..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Cancellation Policy (optional)
                                </label>
                                <textarea
                                  value={settings.cancellation_policy || ''}
                                  onChange={(e) => setSettings({ ...settings, cancellation_policy: e.target.value })}
                                  rows={3}
                                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                                  placeholder="e.g., Free cancellation up to 24 hours before..."
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={handleSaveSettings}
                              disabled={settingsSaving}
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                              {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Save Settings
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Notifications */}
                      {settingsActiveSection === 'notifications' && (
                        <div className="space-y-6">
                          <div className="bg-[#2a2a4a] rounded-lg p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Email Notifications</h3>

                            <div className="space-y-4">
                              <label className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg cursor-pointer">
                                <div>
                                  <span className="text-gray-300 font-medium">Confirmation Email</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Send confirmation when a {currentTypeConfig.features.bookingLabel.toLowerCase()} is made
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={settings.send_confirmation_email}
                                  onChange={(e) => setSettings({ ...settings, send_confirmation_email: e.target.checked })}
                                  className="w-5 h-5 rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                                />
                              </label>

                              <label className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg cursor-pointer">
                                <div>
                                  <span className="text-gray-300 font-medium">Reminder Email</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Send reminder before the {currentTypeConfig.features.bookingLabel.toLowerCase()}
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={settings.send_reminder_email}
                                  onChange={(e) => setSettings({ ...settings, send_reminder_email: e.target.checked })}
                                  className="w-5 h-5 rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                                />
                              </label>

                              {settings.send_reminder_email && (
                                <div className="ml-4 p-4 bg-[#1a1a2e] rounded-lg border-l-2 border-purple-500">
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Send reminder</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={settings.reminder_hours_before}
                                      onChange={(e) => setSettings({ ...settings, reminder_hours_before: parseInt(e.target.value) || 24 })}
                                      className="w-20 px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                      min={1}
                                    />
                                    <span className="text-gray-400">hours before</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={handleSaveSettings}
                              disabled={settingsSaving}
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                              {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Save Settings
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Service Form Modal */}
        {(showServiceForm || editingService) && (
          <ServiceFormModal
            service={editingService}
            categories={categories}
            staff={staff}
            bookingType={currentTypeConfig}
            installedFeatures={installedFeatures || []}
            onSave={(data) => {
              if (editingService) {
                handleUpdateService(editingService.id, data);
              } else {
                handleCreateService(data);
              }
            }}
            onClose={() => {
              setShowServiceForm(false);
              setEditingService(null);
            }}
          />
        )}

        {/* Staff Form Modal */}
        {(showStaffForm || editingStaff) && (
          <StaffFormModal
            staff={editingStaff}
            services={services}
            onSave={(data) => {
              if (editingStaff) {
                handleUpdateStaff(editingStaff.id, data);
              } else {
                handleCreateStaff(data);
              }
            }}
            onClose={() => {
              setShowStaffForm(false);
              setEditingStaff(null);
            }}
          />
        )}

        {/* Booking Detail/Edit Modal */}
        {editingBooking && (
          <BookingDetailModal
            booking={editingBooking}
            services={services}
            staff={staff}
            onUpdate={(data) => handleUpdateBooking(editingBooking.id, data)}
            onClose={() => setEditingBooking(null)}
          />
        )}
      </div>
    </div>
  );
};

// Service Form Modal Component - Type-specific labels and fields
const ServiceFormModal: React.FC<{
  service: BookingService | null;
  categories: BookingCategory[];
  staff: BookingStaff[];
  bookingType: BookingTypeConfig;
  installedFeatures: string[];
  onSave: (data: Partial<BookingService>) => void;
  onClose: () => void;
}> = ({ service, categories, staff, bookingType, installedFeatures, onSave, onClose }) => {
  const hasEcommerce = installedFeatures.includes('e-commerce');
  // Get type-specific labels
  const getLabels = () => {
    switch (bookingType.id) {
      case 'appointments':
        return {
          title: service ? 'Edit Service' : 'New Service',
          nameLabel: 'Service Name',
          namePlaceholder: 'e.g., Haircut, Consultation, Massage',
          descLabel: 'Service Description',
          descPlaceholder: 'Describe what this service includes...',
          durationLabel: 'Duration (minutes)',
          capacityLabel: 'Capacity',
          capacityHelp: 'Maximum clients per slot',
          pricingHelp: 'How you charge for this service',
          buttonText: service ? 'Update Service' : 'Create Service',
        };
      case 'restaurant':
        return {
          title: service ? 'Edit Table/Area' : 'New Table/Area',
          nameLabel: 'Table/Area Name',
          namePlaceholder: 'e.g., Table 1, Outdoor Patio, Private Room',
          descLabel: 'Description',
          descPlaceholder: 'Describe the seating area, view, ambiance...',
          durationLabel: 'Reservation Duration (minutes)',
          capacityLabel: 'Seating Capacity',
          capacityHelp: 'Maximum guests that can be seated',
          pricingHelp: 'Minimum spend or cover charge (if any)',
          buttonText: service ? 'Update Table' : 'Create Table',
        };
      case 'classes':
        return {
          title: service ? 'Edit Class' : 'New Class',
          nameLabel: 'Class Name',
          namePlaceholder: 'e.g., Yoga Basics, Advanced Pilates, HIIT Training',
          descLabel: 'Class Description',
          descPlaceholder: 'Describe what students will learn, skill level required...',
          durationLabel: 'Class Duration (minutes)',
          capacityLabel: 'Student Capacity',
          capacityHelp: 'Maximum students per class',
          pricingHelp: 'Class fee or course price',
          buttonText: service ? 'Update Class' : 'Create Class',
        };
      case 'events':
        return {
          title: service ? 'Edit Event' : 'New Event',
          nameLabel: 'Event Name',
          namePlaceholder: 'e.g., Live Music Night, Workshop, Seminar',
          descLabel: 'Event Description',
          descPlaceholder: 'Describe the event, what attendees can expect...',
          durationLabel: 'Event Duration (minutes)',
          capacityLabel: 'Ticket Capacity',
          capacityHelp: 'Maximum attendees/tickets available',
          pricingHelp: 'Ticket price',
          buttonText: service ? 'Update Event' : 'Create Event',
        };
      case 'rentals':
        return {
          title: service ? 'Edit Rental Item' : 'New Rental Item',
          nameLabel: 'Item Name',
          namePlaceholder: 'e.g., Kayak, Bicycle, Camera Equipment',
          descLabel: 'Item Description',
          descPlaceholder: 'Describe the item, condition, included accessories...',
          durationLabel: 'Rental Period (minutes)',
          capacityLabel: 'Quantity Available',
          capacityHelp: 'How many units available for rent',
          pricingHelp: 'Rental price',
          buttonText: service ? 'Update Item' : 'Create Item',
        };
      default:
        return {
          title: service ? 'Edit Service' : 'New Service',
          nameLabel: 'Service Name',
          namePlaceholder: 'Enter name...',
          descLabel: 'Description',
          descPlaceholder: 'Enter description...',
          durationLabel: 'Duration (minutes)',
          capacityLabel: 'Capacity',
          capacityHelp: 'Maximum per booking',
          pricingHelp: 'Pricing options',
          buttonText: service ? 'Update' : 'Create',
        };
    }
  };

  const labels = getLabels();
  const features = bookingType.features;

  // Determine default type based on booking type
  const defaultServiceType = ['restaurant', 'classes', 'events'].includes(bookingType.id) ? 'reservation' : 'appointment';

  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    type: service?.type || defaultServiceType,
    category_id: service?.category_id || null,
    duration_minutes: service?.duration_minutes || (bookingType.id === 'restaurant' ? 90 : 60),
    buffer_before_minutes: service?.buffer_before_minutes || 0,
    buffer_after_minutes: service?.buffer_after_minutes || (bookingType.id === 'restaurant' ? 15 : 0),
    capacity: service?.capacity || (bookingType.id === 'classes' ? 20 : bookingType.id === 'restaurant' ? 4 : 1),
    min_party_size: service?.min_party_size || 1,
    max_party_size: service?.max_party_size || null,
    pricing_type: service?.pricing_type || 'free',
    price: service?.price || 0,
    currency: service?.currency || 'GBP',
    allow_pay_online: service?.allow_pay_online || false,
    allow_pay_at_venue: service?.allow_pay_at_venue || true,
    require_deposit: service?.require_deposit || false,
    deposit_amount: service?.deposit_amount || null,
    require_login: service?.require_login || false,
    require_staff: service?.require_staff || false,
    allow_staff_selection: service?.allow_staff_selection || false,
    is_active: service?.is_active ?? true,
    staff_ids: service?.staff?.map((s) => s.id) || [],
  });

  // Get pricing type options based on booking type
  const getPricingOptions = () => {
    switch (bookingType.id) {
      case 'appointments':
        return [
          { value: 'free', label: 'Free' },
          { value: 'fixed', label: 'Fixed Price' },
          { value: 'hourly', label: 'Hourly Rate' },
        ];
      case 'restaurant':
        // Restaurant doesn't use pricing types - just deposit
        return [];
      case 'classes':
        return [
          { value: 'free', label: 'Free Class' },
          { value: 'fixed', label: 'Fixed Price' },
        ];
      case 'events':
        return [
          { value: 'free', label: 'Free Entry' },
          { value: 'fixed', label: 'Fixed Price' },
        ];
      case 'rentals':
        return [
          { value: 'free', label: 'Free' },
          { value: 'fixed', label: 'Fixed Rental Fee' },
          { value: 'hourly', label: 'Hourly Rate' },
        ];
      default:
        return [
          { value: 'free', label: 'Free' },
          { value: 'fixed', label: 'Fixed Price' },
        ];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
      <div className="bg-[#1a1a2e] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">
            {labels.title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{labels.nameLabel} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder={labels.namePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{labels.descLabel}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              rows={3}
              placeholder={labels.descPlaceholder}
            />
          </div>

          {/* Duration and Capacity - show based on booking type */}
          <div className="grid grid-cols-2 gap-4">
            {features.showDuration && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{labels.durationLabel}</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min={5}
                />
              </div>
            )}

            {features.showCapacity && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{labels.capacityLabel}</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min={1}
                />
                <p className="text-xs text-gray-500 mt-1">{labels.capacityHelp}</p>
              </div>
            )}
          </div>

          {/* Party Size - only for restaurant/reservations */}
          {features.showPartySize && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Minimum Party Size</label>
                <input
                  type="number"
                  value={formData.min_party_size}
                  onChange={(e) => setFormData({ ...formData, min_party_size: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Maximum Party Size</label>
                <input
                  type="number"
                  value={formData.max_party_size || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, max_party_size: e.target.value ? parseInt(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min={1}
                  placeholder="Same as capacity"
                />
              </div>
            </div>
          )}

          {/* Quantity for Rentals */}
          {features.showQuantity && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Quantity Available</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                min={1}
              />
              <p className="text-xs text-gray-500 mt-1">How many units are available for rent at the same time</p>
            </div>
          )}

          {/* Buffer times - for appointments */}
          {bookingType.id === 'appointments' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Buffer Before (mins)</label>
                <input
                  type="number"
                  value={formData.buffer_before_minutes}
                  onChange={(e) => setFormData({ ...formData, buffer_before_minutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">Preparation time before appointment</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Buffer After (mins)</label>
                <input
                  type="number"
                  value={formData.buffer_after_minutes}
                  onChange={(e) => setFormData({ ...formData, buffer_after_minutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">Cleanup time after appointment</p>
              </div>
            </div>
          )}

          {/* Skill Level - for classes */}
          {features.showSkillLevel && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Skill Level Required</label>
              <select
                className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Levels Welcome</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          )}

          {/* Pricing - different layout based on booking type and e-commerce availability */}
          <div className="border-t border-gray-700 pt-4">
            {bookingType.id === 'restaurant' ? (
              // Restaurant: Deposit field (only if e-commerce installed)
              hasEcommerce ? (
                <>
                  <h4 className="text-sm font-medium text-white mb-3">Deposit</h4>
                  <p className="text-xs text-gray-500 mb-3">Set a deposit amount if required to secure the reservation (optional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Deposit Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                        <input
                          type="number"
                          value={formData.deposit_amount || 0}
                          onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0, require_deposit: parseFloat(e.target.value) > 0 })}
                          className="w-full pl-7 pr-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Set to £0.00 for no deposit required</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-400 mt-3">Payment settings can be configured in the E-commerce feature</p>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-medium text-white mb-3">Pricing</h4>
                  <p className="text-sm text-gray-400">This reservation is free to book</p>
                  <p className="text-xs text-gray-500 mt-2">Install the E-commerce feature to enable deposit collection</p>
                </>
              )
            ) : !hasEcommerce ? (
              // No e-commerce: Free only
              <>
                <h4 className="text-sm font-medium text-white mb-3">Pricing</h4>
                <p className="text-sm text-gray-400">This {bookingType.features.serviceLabel.toLowerCase()} is free</p>
                <p className="text-xs text-gray-500 mt-2">Install the E-commerce feature to enable paid {bookingType.features.serviceLabel.toLowerCase()}s</p>
              </>
            ) : (
              // Has e-commerce: Pricing options
              <>
                <h4 className="text-sm font-medium text-white mb-3">Pricing</h4>
                <p className="text-xs text-gray-500 mb-3">
                  {bookingType.id === 'appointments'
                    ? 'Display price for informational purposes (not charged upfront)'
                    : labels.pricingHelp
                  }
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Pricing Type</label>
                    <select
                      value={formData.pricing_type}
                      onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      {getPricingOptions().map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.pricing_type !== 'free' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          min={0}
                          step={0.01}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="GBP">GBP (£)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-blue-400 mt-3">Payment settings can be configured in the E-commerce feature</p>
              </>
            )}
          </div>

          {/* Staff/Instructor Assignment - only show if booking type uses staff */}
          {features.showStaff && staff.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-white mb-3">{features.staffLabel} Assignment</h4>
              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.require_staff}
                    onChange={(e) => setFormData({ ...formData, require_staff: e.target.checked })}
                    className="rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                  />
                  Require {features.staffLabel.toLowerCase()} assignment
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.allow_staff_selection}
                    onChange={(e) => setFormData({ ...formData, allow_staff_selection: e.target.checked })}
                    className="rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                  />
                  Allow {features.customerLabel.toLowerCase()} to select {features.staffLabel.toLowerCase()}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {staff.map((member) => (
                  <label
                    key={member.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      formData.staff_ids.includes(member.id)
                        ? 'bg-purple-600/30 border border-purple-500'
                        : 'bg-[#2a2a4a] border border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.staff_ids.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, staff_ids: [...formData.staff_ids, member.id] });
                        } else {
                          setFormData({ ...formData, staff_ids: formData.staff_ids.filter((id) => id !== member.id) });
                        }
                      }}
                      className="sr-only"
                    />
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name[0]}
                    </div>
                    <span className="text-sm text-white">{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Other Settings */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Other Settings</h4>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.require_login}
                  onChange={(e) => setFormData({ ...formData, require_login: e.target.checked })}
                  className="rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                />
                Require login to book
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                />
                Active (visible to {features.customerLabel.toLowerCase()}s)
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.name.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
          >
            {labels.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Staff Form Modal Component
const StaffFormModal: React.FC<{
  staff: BookingStaff | null;
  services: BookingService[];
  onSave: (data: Partial<BookingStaff>) => void;
  onClose: () => void;
}> = ({ staff, services, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    title: staff?.title || '',
    bio: staff?.bio || '',
    color: staff?.color || '#10B981',
    is_active: staff?.is_active ?? true,
    service_ids: staff?.services?.map((s) => s.id) || [],
  });

  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
      <div className="bg-[#1a1a2e] rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">
            {staff ? 'Edit Staff Member' : 'Add Staff Member'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="e.g., Senior Stylist, Therapist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Calendar Color</label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Services</label>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${
                      formData.service_ids.includes(service.id)
                        ? 'bg-purple-600/30 border border-purple-500 text-white'
                        : 'bg-[#2a2a4a] border border-gray-600 text-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.service_ids.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, service_ids: [...formData.service_ids, service.id] });
                        } else {
                          setFormData({ ...formData, service_ids: formData.service_ids.filter((id) => id !== service.id) });
                        }
                      }}
                      className="sr-only"
                    />
                    {service.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
            />
            Active
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.name.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
          >
            {staff ? 'Update' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Booking Detail Modal Component
const BookingDetailModal: React.FC<{
  booking: Booking;
  services: BookingService[];
  staff: BookingStaff[];
  onUpdate: (data: Partial<Booking>) => void;
  onClose: () => void;
}> = ({ booking, services, staff, onUpdate, onClose }) => {
  const [status, setStatus] = useState(booking.status);
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes || '');

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'no_show':
        return 'bg-gray-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
      <div className="bg-[#1a1a2e] rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-white">Booking Details</h3>
            <span className="text-purple-400 font-mono text-sm">{booking.booking_reference}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Customer Info */}
          <div className="bg-[#2a2a4a] rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Customer</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white">
                <User className="w-4 h-4 text-gray-400" />
                {booking.customer_name}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-gray-400" />
                {booking.customer_email}
              </div>
              {booking.customer_phone && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {booking.customer_phone}
                </div>
              )}
            </div>
          </div>

          {/* Booking Info */}
          <div className="bg-[#2a2a4a] rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Booking</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">Service</div>
                <div className="text-white">{booking.service?.name || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Staff</div>
                <div className="text-white">{booking.staff?.name || 'Not assigned'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Date</div>
                <div className="text-white">{new Date(booking.booking_date).toLocaleDateString('en-GB')}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Time</div>
                <div className="text-white">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {booking.customer_notes && (
            <div className="bg-[#2a2a4a] rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Customer Notes</h4>
              <p className="text-gray-300 text-sm">{booking.customer_notes}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div className="flex gap-2">
              {['pending', 'confirmed', 'completed', 'no_show', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                    status === s
                      ? `${getStatusColor(s)} text-white`
                      : 'bg-[#2a2a4a] text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              rows={2}
              placeholder="Internal notes (not visible to customer)"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate({ status, admin_notes: adminNotes })}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Update Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export { BookingManager };
export default BookingManager;
