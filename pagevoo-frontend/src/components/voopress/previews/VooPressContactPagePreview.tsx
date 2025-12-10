import React from 'react'
import { Mail, MapPin, Phone, Clock, Send } from 'lucide-react'

interface VooPressContactPagePreviewProps {
  config: any
  themeConfig?: any
  isPreview?: boolean
}

const VooPressContactPagePreview: React.FC<VooPressContactPagePreviewProps> = ({
  config = {},
  themeConfig = {},
  isPreview = true
}) => {
  const colors = themeConfig.theme_colors || config.theme_colors || {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    background: '#FFFFFF',
    text: '#1F2937'
  }

  const typography = themeConfig.theme_typography || config.theme_typography || {
    heading_font: 'Georgia, serif',
    body_font: 'system-ui, sans-serif'
  }

  // Editable content with defaults - use ?? to allow empty strings
  const heading = config.heading ?? 'Get in Touch'
  const description = config.description ?? "Have a question or want to get in touch? We'd love to hear from you. Fill out the form below or use our contact information."
  const showMap = config.show_map !== false
  const contactEmail = config.contact_email ?? 'hello@example.com'
  const contactPhone = config.contact_phone ?? '+1 (555) 123-4567'
  const contactAddress = config.contact_address ?? '123 Business Street\nCity, State 12345'

  // Split address by newlines for display
  const addressLines = contactAddress.split('\n')

  return (
    <section
      className="py-10"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl font-bold mb-3"
            style={{
              fontFamily: typography.heading_font,
              color: colors.text
            }}
          >
            {heading}
          </h1>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{
              fontFamily: typography.body_font,
              color: colors.text + 'aa'
            }}
          >
            {description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact Form */}
          <div
            className="rounded-lg border p-6"
            style={{ borderColor: colors.primary + '20' }}
          >
            <h2
              className="text-xl font-bold mb-6"
              style={{
                fontFamily: typography.heading_font,
                color: colors.text
              }}
            >
              Send us a Message
            </h2>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.text }}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.primary + '30',
                      fontFamily: typography.body_font
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.text }}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.primary + '30',
                      fontFamily: typography.body_font
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.text }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.primary + '30',
                    fontFamily: typography.body_font
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.text }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="How can we help?"
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.primary + '30',
                    fontFamily: typography.body_font
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.text }}
                >
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Your message..."
                  className="w-full px-4 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.primary + '30',
                    fontFamily: typography.body_font
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition"
                style={{ backgroundColor: colors.primary }}
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div
              className="rounded-lg border p-6"
              style={{ borderColor: colors.primary + '20' }}
            >
              <h2
                className="text-xl font-bold mb-6"
                style={{
                  fontFamily: typography.heading_font,
                  color: colors.text
                }}
              >
                Contact Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: colors.primary + '10' }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h3
                      className="font-medium mb-1"
                      style={{ color: colors.text }}
                    >
                      Address
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: colors.text + 'aa' }}
                    >
                      {addressLines.map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < addressLines.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: colors.primary + '10' }}
                  >
                    <Mail className="w-5 h-5" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h3
                      className="font-medium mb-1"
                      style={{ color: colors.text }}
                    >
                      Email
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: colors.text + 'aa' }}
                    >
                      {contactEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: colors.primary + '10' }}
                  >
                    <Phone className="w-5 h-5" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h3
                      className="font-medium mb-1"
                      style={{ color: colors.text }}
                    >
                      Phone
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: colors.text + 'aa' }}
                    >
                      {contactPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: colors.primary + '10' }}
                  >
                    <Clock className="w-5 h-5" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h3
                      className="font-medium mb-1"
                      style={{ color: colors.text }}
                    >
                      Business Hours
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: colors.text + 'aa' }}
                    >
                      Mon - Fri: 9:00 AM - 6:00 PM<br />
                      Sat - Sun: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            {showMap && (
              <div
                className="rounded-lg border overflow-hidden h-48 flex items-center justify-center"
                style={{
                  borderColor: colors.primary + '20',
                  backgroundColor: colors.primary + '08'
                }}
              >
                <div className="text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: colors.primary + '40' }} />
                  <p className="text-sm" style={{ color: colors.text + '60' }}>
                    Map will be displayed here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview indicator */}
        {isPreview && (
          <div className="mt-6 text-center">
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              VooPress Contact Page Preview
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

export default VooPressContactPagePreview
