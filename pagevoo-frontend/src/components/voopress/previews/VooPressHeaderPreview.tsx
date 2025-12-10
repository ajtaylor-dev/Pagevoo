import React from 'react'
import { Search } from 'lucide-react'

interface VooPressHeaderPreviewProps {
  config: any
  themeConfig?: any
  siteName?: string
  tagline?: string
  isPreview?: boolean
}

const VooPressHeaderPreview: React.FC<VooPressHeaderPreviewProps> = ({
  config = {},
  themeConfig = {},
  siteName: propSiteName,
  tagline: propTagline,
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
  const siteName = config.site_name ?? propSiteName ?? 'My VooPress Site'
  const tagline = config.tagline ?? propTagline ?? 'Just another VooPress site'
  const showTagline = config.show_tagline !== false
  const showSearch = config.show_search === true

  const headerConfig = themeConfig.header || config.header || {
    style: 'classic',
    menu_position: 'below'
  }

  const menuItems = config.menu_items || [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ]

  return (
    <header
      className="border-b"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.primary + '20'
      }}
    >
      {/* Top bar with site title */}
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <h1
          className="text-3xl font-bold mb-1"
          style={{
            fontFamily: typography.heading_font,
            color: colors.text
          }}
        >
          {siteName}
        </h1>
        {showTagline && (
          <p
            className="text-sm opacity-70"
            style={{
              fontFamily: typography.body_font,
              color: colors.text
            }}
          >
            {tagline}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="border-t"
        style={{ borderColor: colors.primary + '20' }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 py-2">
            {menuItems.map((item: { label: string; href: string }, index: number) => (
              <a
                key={index}
                href="#"
                className="px-4 py-2 text-sm font-medium rounded hover:bg-gray-100 transition"
                style={{
                  fontFamily: typography.body_font,
                  color: colors.text
                }}
                onClick={(e) => e.preventDefault()}
              >
                {item.label}
              </a>
            ))}
            {showSearch && (
              <button
                className="p-2 ml-2 rounded hover:bg-gray-100 transition"
                style={{ color: colors.text }}
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Preview indicator */}
      {isPreview && (
        <div className="bg-purple-50 border-t border-purple-200 px-4 py-1 text-center">
          <span className="text-xs text-purple-600">VooPress Header Preview</span>
        </div>
      )}
    </header>
  )
}

export default VooPressHeaderPreview
