import React from 'react'
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react'

interface VooPressFooterPreviewProps {
  config: any
  themeConfig?: any
  siteName?: string
  isPreview?: boolean
}

const VooPressFooterPreview: React.FC<VooPressFooterPreviewProps> = ({
  config = {},
  themeConfig = {},
  siteName: propSiteName = 'My VooPress Site',
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
  const siteName = config.site_name ?? propSiteName
  const copyrightText = config.copyright_text ?? `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`
  const showSocial = config.show_social !== false
  const showNewsletter = config.show_newsletter === true
  const newsletterHeading = config.newsletter_heading ?? 'Subscribe to our newsletter'
  const newsletterDescription = config.newsletter_description ?? 'Get the latest updates delivered to your inbox.'

  const footerConfig = themeConfig.footer || config.footer || {
    style: 'simple',
    columns: 3,
    show_copyright: true
  }

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: colors.text,
        borderColor: colors.primary + '20'
      }}
    >
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* About Column */}
          <div>
            <h4
              className="text-lg font-bold mb-4"
              style={{
                fontFamily: typography.heading_font,
                color: colors.background
              }}
            >
              About
            </h4>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{
                fontFamily: typography.body_font,
                color: colors.background + 'aa'
              }}
            >
              Welcome to {siteName}. We share insights, tips, and stories
              to help you on your journey. Stay connected and never miss an update.
            </p>
            {showSocial && (
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="p-2 rounded-full hover:opacity-80 transition"
                    style={{ backgroundColor: colors.primary + '30' }}
                    onClick={(e) => e.preventDefault()}
                  >
                    <Icon className="w-4 h-4" style={{ color: colors.background }} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links Column */}
          <div>
            <h4
              className="text-lg font-bold mb-4"
              style={{
                fontFamily: typography.heading_font,
                color: colors.background
              }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              {['Home', 'About', 'Blog', 'Contact', 'Privacy Policy'].map((link, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-sm hover:opacity-100 transition"
                    style={{
                      fontFamily: typography.body_font,
                      color: colors.background + 'aa'
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter or Contact Column */}
          <div>
            {showNewsletter ? (
              <>
                <h4
                  className="text-lg font-bold mb-4"
                  style={{
                    fontFamily: typography.heading_font,
                    color: colors.background
                  }}
                >
                  {newsletterHeading}
                </h4>
                <p
                  className="text-sm leading-relaxed mb-4"
                  style={{
                    fontFamily: typography.body_font,
                    color: colors.background + 'aa'
                  }}
                >
                  {newsletterDescription}
                </p>
                <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: colors.background + '20',
                      color: colors.background,
                      border: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded text-sm font-medium"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.background
                    }}
                  >
                    Subscribe
                  </button>
                </form>
              </>
            ) : (
              <>
                <h4
                  className="text-lg font-bold mb-4"
                  style={{
                    fontFamily: typography.heading_font,
                    color: colors.background
                  }}
                >
                  Contact Us
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: typography.body_font,
                        color: colors.background + 'aa'
                      }}
                    >
                      123 Main Street, City, Country
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} />
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: typography.body_font,
                        color: colors.background + 'aa'
                      }}
                    >
                      contact@example.com
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} />
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: typography.body_font,
                        color: colors.background + 'aa'
                      }}
                    >
                      (123) 456-7890
                    </span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      {footerConfig.show_copyright !== false && (
        <div
          className="border-t py-4"
          style={{ borderColor: colors.background + '20' }}
        >
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p
              className="text-sm"
              style={{
                fontFamily: typography.body_font,
                color: colors.background + '80'
              }}
            >
              {copyrightText} Powered by VooPress.
            </p>
          </div>
        </div>
      )}

      {/* Preview indicator */}
      {isPreview && (
        <div className="bg-purple-900 py-1 text-center">
          <span className="text-xs text-purple-300">VooPress Footer Preview</span>
        </div>
      )}
    </footer>
  )
}

export default VooPressFooterPreview
