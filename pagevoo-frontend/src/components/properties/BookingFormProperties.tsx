import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Calendar, Palette, Layout, Settings, Type } from 'lucide-react';

// Booking type definition
type BookingType = 'appointments' | 'restaurant' | 'classes' | 'events' | 'rentals';

interface BookingTypeConfig {
  id: BookingType;
  name: string;
  icon: string;
  features: {
    showInstructor: boolean;      // For classes - show instructor to customers
    showPartySize: boolean;       // Party size or ticket quantity
    showTicketQuantity: boolean;  // For events - ticket quantity
    showQuantity: boolean;        // For rentals - rent multiple items
    showSkillLevel: boolean;      // For classes
    showTicketTypes: boolean;     // For events - different ticket types
    showTicketsRemaining: boolean; // For events - capacity indicator
    showNotes: boolean;           // Customer notes/comments
    serviceLabel: string;
    bookingLabel: string;
  };
}

const BOOKING_TYPES: BookingTypeConfig[] = [
  {
    id: 'appointments',
    name: 'Appointments',
    icon: '💇',
    features: {
      showInstructor: false,
      showPartySize: false,
      showTicketQuantity: false,
      showQuantity: false,
      showSkillLevel: false,
      showTicketTypes: false,
      showTicketsRemaining: false,
      showNotes: true,
      serviceLabel: 'Service',
      bookingLabel: 'Appointment',
    },
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    features: {
      showInstructor: false,
      showPartySize: true,
      showTicketQuantity: false,
      showQuantity: false,
      showSkillLevel: false,
      showTicketTypes: false,
      showTicketsRemaining: false,
      showNotes: true,
      serviceLabel: 'Table/Area',
      bookingLabel: 'Reservation',
    },
  },
  {
    id: 'classes',
    name: 'Classes',
    icon: '🧘',
    features: {
      showInstructor: true,
      showPartySize: false,
      showTicketQuantity: false,
      showQuantity: false,
      showSkillLevel: true,
      showTicketTypes: false,
      showTicketsRemaining: false,
      showNotes: false,
      serviceLabel: 'Class',
      bookingLabel: 'Registration',
    },
  },
  {
    id: 'events',
    name: 'Events',
    icon: '🎫',
    features: {
      showInstructor: false,
      showPartySize: false,
      showTicketQuantity: true,
      showQuantity: false,
      showSkillLevel: false,
      showTicketTypes: true,
      showTicketsRemaining: true,
      showNotes: false,
      serviceLabel: 'Event',
      bookingLabel: 'Ticket',
    },
  },
  {
    id: 'rentals',
    name: 'Rentals',
    icon: '🚲',
    features: {
      showInstructor: false,
      showPartySize: false,
      showTicketQuantity: false,
      showQuantity: true,
      showSkillLevel: false,
      showTicketTypes: false,
      showTicketsRemaining: false,
      showNotes: true,
      serviceLabel: 'Item',
      bookingLabel: 'Rental',
    },
  },
];

interface BookingConfig {
  title?: string;
  subtitle?: string;
  showServiceSelector?: boolean;
  showDatePicker?: boolean;
  showTimePicker?: boolean;
  showPartySize?: boolean;
  showNotes?: boolean;
  buttonText?: string;
  layout?: 'vertical' | 'horizontal' | 'stepped';
  theme?: 'default' | 'minimal' | 'card';
  // Classes specific
  showInstructor?: boolean;
  showSkillLevel?: boolean;
  equipmentNote?: string;
  // Events specific
  showTicketQuantity?: boolean;
  showTicketTypes?: boolean;
  showTicketsRemaining?: boolean;
  // Rentals specific
  showQuantity?: boolean;
  showAvailabilityCalendar?: boolean;
  idRequirementNote?: string;
  primaryColor?: string;
  serviceFilter?: number | null;
  containerStyle?: {
    padding?: string;
    background?: string;
    borderRadius?: string;
  };
}

interface BookingFormPropertiesProps {
  section: {
    id: string;
    content: {
      bookingConfig?: BookingConfig;
    };
  };
  onUpdateSection: (sectionId: string, updates: any) => void;
  onOpenBookingManager?: () => void;
  bookingType?: BookingType; // Passed from booking manager settings
}

const BookingFormProperties: React.FC<BookingFormPropertiesProps> = ({
  section,
  onUpdateSection,
  onOpenBookingManager,
  bookingType = 'appointments',
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    content: true,
    layout: true,
    fields: false,
    appearance: false,
    container: false,
  });

  const config: BookingConfig = section.content?.bookingConfig || {
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

  // Get current type config based on the booking type from manager settings
  const currentTypeConfig = useMemo(() => {
    return BOOKING_TYPES.find((t) => t.id === bookingType) || BOOKING_TYPES[0];
  }, [bookingType]);

  // Default content based on booking type
  const typeDefaults = useMemo(() => {
    const defaults: Record<BookingType, { title: string; subtitle: string; button: string }> = {
      appointments: {
        title: 'Book an Appointment',
        subtitle: 'Select your preferred date and time',
        button: 'Book Appointment',
      },
      restaurant: {
        title: 'Make a Reservation',
        subtitle: 'Reserve your table for a memorable dining experience',
        button: 'Reserve Table',
      },
      classes: {
        title: 'Join a Class',
        subtitle: 'Select a class and secure your spot',
        button: 'Register Now',
      },
      events: {
        title: 'Get Your Tickets',
        subtitle: 'Select your event and number of tickets',
        button: 'Get Tickets',
      },
      rentals: {
        title: 'Book a Rental',
        subtitle: 'Choose your dates and rental item',
        button: 'Book Rental',
      },
    };
    return defaults[bookingType] || defaults.appointments;
  }, [bookingType]);

  const updateConfig = (updates: Partial<BookingConfig>) => {
    onUpdateSection(section.id, {
      ...section.content,
      bookingConfig: {
        ...config,
        ...updates,
      },
    });
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const CollapsibleSection: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ id, title, icon, children }) => (
    <div className="border-b border-gray-700">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-300">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {expandedSections[id] ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expandedSections[id] && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="bg-[#1a1a2e] text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="font-medium">Booking Form</h3>
        </div>
        {onOpenBookingManager && (
          <button
            onClick={onOpenBookingManager}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Open Booking Manager
          </button>
        )}
      </div>

      {/* Current Booking Type Info */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/30">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{currentTypeConfig.icon}</span>
          <span className="text-gray-300">{currentTypeConfig.name}</span>
          <span className="text-gray-500 text-xs ml-auto">Configure in Booking Manager</span>
        </div>
      </div>

      {/* Content Section */}
      <CollapsibleSection id="content" title="Content" icon={<Type className="w-4 h-4" />}>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => updateConfig({ title: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder={typeDefaults.title}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Subtitle</label>
          <input
            type="text"
            value={config.subtitle || ''}
            onChange={(e) => updateConfig({ subtitle: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder={typeDefaults.subtitle}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Button Text</label>
          <input
            type="text"
            value={config.buttonText || ''}
            onChange={(e) => updateConfig({ buttonText: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder={typeDefaults.button}
          />
        </div>
      </CollapsibleSection>

      {/* Layout Section */}
      <CollapsibleSection id="layout" title="Layout & Theme" icon={<Layout className="w-4 h-4" />}>
        <div>
          <label className="block text-xs text-gray-400 mb-2">Layout Style</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'vertical', label: 'Vertical' },
              { value: 'stepped', label: 'Stepped' },
              { value: 'horizontal', label: 'Horizontal' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateConfig({ layout: option.value as any })}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  config.layout === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'default', label: 'Default' },
              { value: 'card', label: 'Card' },
              { value: 'minimal', label: 'Minimal' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateConfig({ theme: option.value as any })}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  config.theme === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Fields Section */}
      <CollapsibleSection id="fields" title="Form Fields" icon={<Settings className="w-4 h-4" />}>
        <div className="space-y-2">
          {/* Service/Class/Event/Item selector - always available */}
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showServiceSelector}
              onChange={(e) => updateConfig({ showServiceSelector: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
            />
            Show {currentTypeConfig.features.serviceLabel.toLowerCase()} selector
          </label>

          {/* Date picker - always available */}
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showDatePicker}
              onChange={(e) => updateConfig({ showDatePicker: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
            />
            Show date picker
          </label>

          {/* Time picker - not for events */}
          {bookingType !== 'events' && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTimePicker}
                onChange={(e) => updateConfig({ showTimePicker: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              Show time picker
            </label>
          )}

          {/* Party size - for restaurant */}
          {currentTypeConfig.features.showPartySize && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPartySize}
                onChange={(e) => updateConfig({ showPartySize: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              Show party size
            </label>
          )}

          {/* Instructor - for classes */}
          {currentTypeConfig.features.showInstructor && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showInstructor}
                onChange={(e) => updateConfig({ showInstructor: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              Show instructor
            </label>
          )}

          {/* Skill level - for classes */}
          {currentTypeConfig.features.showSkillLevel && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showSkillLevel}
                onChange={(e) => updateConfig({ showSkillLevel: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              Show skill level
            </label>
          )}

          {/* Ticket quantity - for events */}
          {currentTypeConfig.features.showTicketQuantity && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTicketQuantity}
                onChange={(e) => updateConfig({ showTicketQuantity: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              Show ticket quantity
            </label>
          )}

          {/* Ticket types - for events */}
          {currentTypeConfig.features.showTicketTypes && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTicketTypes}
                onChange={(e) => updateConfig({ showTicketTypes: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              Show ticket type selector
            </label>
          )}

          {/* Tickets remaining - for events */}
          {currentTypeConfig.features.showTicketsRemaining && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTicketsRemaining}
                onChange={(e) => updateConfig({ showTicketsRemaining: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              Show "tickets remaining" indicator
            </label>
          )}

          {/* Quantity - for rentals */}
          {currentTypeConfig.features.showQuantity && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showQuantity}
                  onChange={(e) => updateConfig({ showQuantity: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                Show quantity selector
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showAvailabilityCalendar}
                  onChange={(e) => updateConfig({ showAvailabilityCalendar: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                Show availability calendar
              </label>
            </>
          )}

          {/* Notes - for appointments, restaurant, rentals */}
          {currentTypeConfig.features.showNotes && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showNotes}
                onChange={(e) => updateConfig({ showNotes: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              Show {bookingType === 'restaurant' ? 'special requests' : 'notes/comments'}
            </label>
          )}
        </div>

        {/* Equipment note - for classes */}
        {bookingType === 'classes' && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <label className="block text-xs text-gray-400 mb-1">Equipment / What to Bring</label>
            <textarea
              value={config.equipmentNote || ''}
              onChange={(e) => updateConfig({ equipmentNote: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="e.g., Please bring a yoga mat and towel"
              rows={2}
            />
          </div>
        )}

        {/* ID requirement note - for rentals */}
        {bookingType === 'rentals' && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <label className="block text-xs text-gray-400 mb-1">ID / License Requirements</label>
            <textarea
              value={config.idRequirementNote || ''}
              onChange={(e) => updateConfig({ idRequirementNote: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="e.g., Valid ID required. Driving license needed for vehicle rentals."
              rows={2}
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Appearance Section */}
      <CollapsibleSection id="appearance" title="Appearance" icon={<Palette className="w-4 h-4" />}>
        <div>
          <label className="block text-xs text-gray-400 mb-2">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.primaryColor || '#8B5CF6'}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={config.primaryColor || '#8B5CF6'}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'].map((color) => (
            <button
              key={color}
              onClick={() => updateConfig({ primaryColor: color })}
              className={`w-8 h-8 rounded-full border-2 ${
                config.primaryColor === color ? 'border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Container Section */}
      <CollapsibleSection id="container" title="Container Style" icon={<Layout className="w-4 h-4" />}>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Padding</label>
          <select
            value={config.containerStyle?.padding || '2rem'}
            onChange={(e) =>
              updateConfig({
                containerStyle: { ...config.containerStyle, padding: e.target.value },
              })
            }
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="0">None</option>
            <option value="1rem">Small</option>
            <option value="2rem">Medium</option>
            <option value="3rem">Large</option>
            <option value="4rem">Extra Large</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.containerStyle?.background || '#ffffff'}
              onChange={(e) =>
                updateConfig({
                  containerStyle: { ...config.containerStyle, background: e.target.value },
                })
              }
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={config.containerStyle?.background || 'transparent'}
              onChange={(e) =>
                updateConfig({
                  containerStyle: { ...config.containerStyle, background: e.target.value },
                })
              }
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
              placeholder="transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Border Radius</label>
          <select
            value={config.containerStyle?.borderRadius || '0'}
            onChange={(e) =>
              updateConfig({
                containerStyle: { ...config.containerStyle, borderRadius: e.target.value },
              })
            }
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="0">None</option>
            <option value="0.5rem">Small</option>
            <option value="1rem">Medium</option>
            <option value="1.5rem">Large</option>
            <option value="2rem">Extra Large</option>
          </select>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default BookingFormProperties;
