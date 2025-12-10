import React from 'react';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, ChevronRight, Check, Users, Ticket, MapPin, Scissors } from 'lucide-react';

// Booking type determines the context-appropriate labels and options
type BookingType = 'appointments' | 'restaurant' | 'classes' | 'events' | 'rentals';

interface BookingTypeLabels {
  service: string;
  staff: string;
  customer: string;
  booking: string;
  partySize: string;
}

const BOOKING_TYPE_LABELS: Record<BookingType, BookingTypeLabels> = {
  appointments: {
    service: 'Service',
    staff: 'Preferred Staff',
    customer: 'Client',
    booking: 'Appointment',
    partySize: 'Party Size',
  },
  restaurant: {
    service: 'Table/Area',
    staff: 'Server',
    customer: 'Guest',
    booking: 'Reservation',
    partySize: 'Party Size',
  },
  classes: {
    service: 'Class',
    staff: 'Instructor',
    customer: 'Participant',
    booking: 'Registration',
    partySize: 'Number of Spots',
  },
  events: {
    service: 'Event',
    staff: 'Host',
    customer: 'Attendee',
    booking: 'Ticket',
    partySize: 'Number of Tickets',
  },
  rentals: {
    service: 'Item',
    staff: 'Manager',
    customer: 'Renter',
    booking: 'Rental',
    partySize: 'Quantity',
  },
};

// Sample data for different booking types
const SAMPLE_DATA: Record<BookingType, { services: Array<{ name: string; duration: string; price: string }> }> = {
  appointments: {
    services: [
      { name: 'Consultation', duration: '30 min', price: 'Free' },
      { name: 'Standard Session', duration: '60 min', price: '£50' },
      { name: 'Premium Package', duration: '90 min', price: '£80' },
    ],
  },
  restaurant: {
    services: [
      { name: 'Indoor Table', duration: '2 hours', price: '' },
      { name: 'Outdoor Terrace', duration: '2 hours', price: '' },
      { name: 'Private Room', duration: '3 hours', price: '£50 min spend' },
    ],
  },
  classes: {
    services: [
      { name: 'Yoga Basics', duration: '45 min', price: '£12' },
      { name: 'HIIT Training', duration: '30 min', price: '£15' },
      { name: 'Spin Class', duration: '45 min', price: '£14' },
    ],
  },
  events: {
    services: [
      { name: 'General Admission', duration: '', price: '£25' },
      { name: 'VIP Experience', duration: '', price: '£75' },
      { name: 'Early Bird Special', duration: '', price: '£20' },
    ],
  },
  rentals: {
    services: [
      { name: 'Mountain Bike', duration: 'Full day', price: '£35/day' },
      { name: 'Kayak', duration: 'Half day', price: '£25' },
      { name: 'Camping Gear Set', duration: 'Weekend', price: '£80' },
    ],
  },
};

interface BookingConfig {
  // Booking type - determines labels and visible options
  bookingType?: BookingType;

  // Content
  title?: string;
  subtitle?: string;
  buttonText?: string;

  // Field visibility
  showServiceSelector?: boolean;
  showStaffSelector?: boolean;
  showDatePicker?: boolean;
  showTimePicker?: boolean;
  showPartySize?: boolean;
  showNotes?: boolean;

  // Layout & appearance
  layout?: 'vertical' | 'horizontal' | 'stepped';
  theme?: 'default' | 'minimal' | 'card';
  primaryColor?: string;
  serviceFilter?: number | null;

  // Container styling
  containerStyle?: {
    padding?: string;
    background?: string;
    borderRadius?: string;
  };
}

interface BookingService {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
  pricing_type: string;
}

interface BookingFormPreviewProps {
  content: {
    bookingConfig?: BookingConfig;
  };
  css?: Record<string, string>;
  bookingType?: BookingType;
  services?: BookingService[];
}

const BookingFormPreview: React.FC<BookingFormPreviewProps> = ({ content, css, bookingType: propBookingType, services }) => {
  const config: BookingConfig = content.bookingConfig || {
    bookingType: 'appointments',
    title: '',
    subtitle: '',
    showServiceSelector: true,
    showStaffSelector: false,
    showDatePicker: true,
    showTimePicker: true,
    showPartySize: false,
    showNotes: true,
    buttonText: '',
    layout: 'vertical',
    theme: 'default',
    primaryColor: '#8B5CF6',
  };

  // Use prop bookingType if provided (from manager settings), otherwise fall back to config
  const bookingType = propBookingType || config.bookingType || 'appointments';
  const labels = BOOKING_TYPE_LABELS[bookingType];

  // Format real services or fall back to sample data
  const formatPrice = (price: number, pricingType: string) => {
    if (price === 0) return pricingType === 'free' ? 'Free' : '';
    return `£${price.toFixed(2)}`;
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Use real services if provided, otherwise fall back to sample data
  const displayServices = services && services.length > 0
    ? services.map(s => ({
        name: s.name,
        duration: formatDuration(s.duration_minutes),
        price: formatPrice(s.price, s.pricing_type),
      }))
    : SAMPLE_DATA[bookingType].services;

  const containerStyle = {
    padding: config.containerStyle?.padding || '2rem',
    background: config.containerStyle?.background || 'transparent',
    borderRadius: config.containerStyle?.borderRadius || '0',
  };

  // Get type-appropriate title and subtitle defaults
  const getDefaultTitle = () => {
    switch (bookingType) {
      case 'appointments': return 'Book an Appointment';
      case 'restaurant': return 'Make a Reservation';
      case 'classes': return 'Join a Class';
      case 'events': return 'Get Your Tickets';
      case 'rentals': return 'Book a Rental';
      default: return 'Make a Booking';
    }
  };

  const getDefaultSubtitle = () => {
    switch (bookingType) {
      case 'appointments': return 'Select your preferred date and time';
      case 'restaurant': return 'Choose your preferred table and time';
      case 'classes': return 'Find a class that works for you';
      case 'events': return 'Secure your spot at our upcoming events';
      case 'rentals': return 'Reserve your equipment or space';
      default: return 'Select your preferred options';
    }
  };

  const getDefaultButtonText = () => {
    switch (bookingType) {
      case 'appointments': return 'Book Appointment';
      case 'restaurant': return 'Reserve Table';
      case 'classes': return 'Register Now';
      case 'events': return 'Get Tickets';
      case 'rentals': return 'Book Now';
      default: return 'Confirm Booking';
    }
  };

  const title = config.title || getDefaultTitle();
  const subtitle = config.subtitle || getDefaultSubtitle();
  const buttonText = config.buttonText || getDefaultButtonText();

  // Stepped layout rendering
  if (config.layout === 'stepped') {
    const steps = bookingType === 'events'
      ? [labels.service, 'Tickets', 'Details', 'Confirm']
      : [labels.service, 'Date & Time', 'Details', 'Confirm'];

    return (
      <div style={containerStyle}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{title}</h2>
          <p className="text-gray-600 mb-8 text-center">{subtitle}</p>

          {/* Steps indicator */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                    style={index === 0 ? { backgroundColor: config.primaryColor } : {}}
                  >
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${index === 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {step}
                  </span>
                </div>
                {index < 3 && (
                  <div className="w-12 h-0.5 bg-gray-200 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Service/Option Selection Step Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a {labels.service}</h3>
            <div className="space-y-3">
              {displayServices.map((service, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    index === 0
                      ? 'border-2 bg-opacity-10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={index === 0 ? { borderColor: config.primaryColor, backgroundColor: config.primaryColor + '10' } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{service.name}</div>
                      {service.duration && (
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {service.duration}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {service.price && <span className="font-semibold text-gray-900">{service.price}</span>}
                      {index === 0 && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="w-full mt-6 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: config.primaryColor }}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Card theme
  if (config.theme === 'card') {
    // Select icon based on booking type
    const HeaderIcon = bookingType === 'events' ? Ticket
      : bookingType === 'restaurant' ? MapPin
      : bookingType === 'classes' ? Users
      : Calendar;

    return (
      <div style={containerStyle}>
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div
            className="px-6 py-8 text-white text-center"
            style={{ backgroundColor: config.primaryColor }}
          >
            <HeaderIcon className="w-12 h-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-2 opacity-90">{subtitle}</p>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {config.showServiceSelector && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.service}</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50">
                  <option>Select a {labels.service.toLowerCase()}</option>
                  {displayServices.map((s, i) => (
                    <option key={i}>{s.name}{s.duration ? ` - ${s.duration}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {config.showStaffSelector && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.staff}</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50">
                  <option>Any available</option>
                  <option>Staff Member 1</option>
                  <option>Staff Member 2</option>
                </select>
              </div>
            )}

            {config.showDatePicker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Select date"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            )}

            {config.showTimePicker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time, index) => (
                    <button
                      key={time}
                      className={`py-2 text-sm rounded-lg border ${
                        index === 1
                          ? 'text-white border-transparent'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                      style={index === 1 ? { backgroundColor: config.primaryColor } : {}}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="Your phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
              />
            </div>

            {config.showNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  placeholder="Any special requests?"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 resize-none"
                />
              </div>
            )}

            {config.showPartySize && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.partySize}</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? (bookingType === 'events' ? 'ticket' : 'guest') : (bookingType === 'events' ? 'tickets' : 'guests')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              className="w-full py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: config.primaryColor }}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Minimal theme
  if (config.theme === 'minimal') {
    return (
      <div style={containerStyle}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 mb-8">{subtitle}</p>

          <div className="space-y-6">
            {config.showServiceSelector && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">{labels.service}</label>
                <select className="w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent">
                  <option>Select a {labels.service.toLowerCase()}</option>
                  {displayServices.map((s, i) => (
                    <option key={i}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {config.showPartySize && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">{labels.partySize}</label>
                <select className="w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {config.showDatePicker && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Date</label>
                  <input
                    type="text"
                    placeholder="Select date"
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent"
                  />
                </div>
              )}
              {config.showTimePicker && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Time</label>
                  <input
                    type="text"
                    placeholder="Select time"
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <button
              className="mt-4 px-8 py-3 rounded-none text-white font-medium"
              style={{ backgroundColor: config.primaryColor }}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Horizontal layout
  if (config.layout === 'horizontal') {
    const HorizIcon = bookingType === 'events' ? Ticket
      : bookingType === 'restaurant' ? MapPin
      : bookingType === 'classes' ? Users
      : Calendar;

    return (
      <div style={containerStyle}>
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex">
            {/* Left side - Info */}
            <div
              className="w-1/3 p-8 text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              <HorizIcon className="w-10 h-10 mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <p className="opacity-90 text-sm">{subtitle}</p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 opacity-75" />
                  <span className="text-sm opacity-90">Quick & Easy {labels.booking}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 opacity-75" />
                  <span className="text-sm opacity-90">Instant Confirmation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 opacity-75" />
                  <span className="text-sm opacity-90">Email Reminders</span>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 p-8">
              <div className="grid grid-cols-2 gap-4">
                {config.showServiceSelector && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.service}</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Select a {labels.service.toLowerCase()}</option>
                      {displayServices.map((s, i) => (
                        <option key={i}>{s.name}{s.duration ? ` - ${s.duration}` : ''}</option>
                      ))}
                    </select>
                  </div>
                )}

                {config.showStaffSelector && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.staff}</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Any available</option>
                      <option>Staff Member 1</option>
                    </select>
                  </div>
                )}

                {config.showPartySize && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.partySize}</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}

                {config.showDatePicker && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="text"
                      placeholder="Select date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      readOnly
                    />
                  </div>
                )}

                {config.showTimePicker && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Select time</option>
                      <option>9:00 AM</option>
                      <option>10:00 AM</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {config.showNotes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      placeholder="Any special requests?"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <button
                    className="w-full py-3 rounded-lg text-white font-medium"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default vertical layout
  return (
    <div style={containerStyle}>
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8">
        {config.title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        )}
        {config.subtitle && (
          <p className="text-gray-600 mb-6">{subtitle}</p>
        )}

        <div className="space-y-5">
          {config.showServiceSelector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select {labels.service}
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>Choose {labels.service.toLowerCase()}...</option>
                {displayServices.map((service, idx) => (
                  <option key={idx}>
                    {service.name}{service.duration ? ` - ${service.duration}` : ''}{service.price ? ` - ${service.price}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {config.showStaffSelector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {labels.staff} (optional)
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>Any available</option>
                <option>John Smith</option>
                <option>Jane Doe</option>
              </select>
            </div>
          )}

          <div className={`grid gap-4 ${config.showTimePicker ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {config.showDatePicker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Select date"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    readOnly
                  />
                </div>
              </div>
            )}

            {config.showTimePicker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                    <option>Select time</option>
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>2:00 PM</option>
                    <option>3:00 PM</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {config.showPartySize && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.partySize}</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? (bookingType === 'restaurant' ? 'guest' : 'person') : (bookingType === 'restaurant' ? 'guests' : 'people')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-gray-200 pt-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{labels.customer} Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Your phone"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {config.showNotes && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {bookingType === 'restaurant' ? 'Special Requests / Dietary Requirements' : 'Special Requests'}
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      placeholder={bookingType === 'restaurant' ? 'Allergies, dietary requirements, special occasions...' : 'Any special requests or notes...'}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            className="w-full py-3 rounded-lg text-white font-medium text-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: config.primaryColor }}
          >
            {buttonText}
          </button>

          <p className="text-center text-xs text-gray-500">
            You will receive a confirmation email after {bookingType === 'restaurant' ? 'your reservation is confirmed' : 'booking'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingFormPreview;
