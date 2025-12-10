import React from 'react'
import { ArrowRight } from 'lucide-react'

interface VooPressHeroPreviewProps {
  config: any
  themeConfig?: any
  isPreview?: boolean
}

const VooPressHeroPreview: React.FC<VooPressHeroPreviewProps> = ({
  config = {},
  themeConfig = {},
  isPreview = true
}) => {
  const colors = themeConfig.theme_colors || config.theme_colors || {
    primary: '#2563EB',
    secondary: '#1D4ED8',
    background: '#F8FAFC',
    text: '#1E293B',
    accent: '#10B981'
  }

  const typography = themeConfig.theme_typography || config.theme_typography || {
    heading_font: 'Inter, system-ui, sans-serif',
    body_font: 'Inter, system-ui, sans-serif'
  }

  // Editable content with defaults - use ?? to allow empty strings
  const tagline = config.tagline ?? 'Welcome to our blog'
  const heading = config.heading ?? 'Insights & Ideas for'
  const headingHighlight = config.heading_highlight ?? 'Your Business'
  const description = config.description ?? 'Stay updated with the latest trends, tips, and strategies to help your business grow. Expert insights delivered fresh to your inbox.'
  const showCta = config.show_cta !== false
  const primaryButtonText = config.primary_button_text ?? 'Browse Articles'
  const primaryButtonLink = config.primary_button_link ?? '#blog'
  const secondaryButtonText = config.secondary_button_text ?? 'Subscribe'
  const secondaryButtonLink = config.secondary_button_link ?? '#subscribe'

  return (
    <section
      className="py-16 md:py-24"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.secondary}10 100%)`
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Tagline */}
          <span
            className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: colors.primary + '20',
              color: colors.primary
            }}
          >
            {tagline}
          </span>

          {/* Main Heading */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{
              fontFamily: typography.heading_font,
              color: colors.text
            }}
          >
            {heading}{' '}
            <span style={{ color: colors.primary }}>{headingHighlight}</span>
          </h1>

          {/* Description */}
          <p
            className="text-lg md:text-xl mb-8 leading-relaxed"
            style={{
              fontFamily: typography.body_font,
              color: colors.text + 'cc'
            }}
          >
            {description}
          </p>

          {/* CTA Buttons */}
          {showCta && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={primaryButtonLink}
                className="px-8 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition"
                style={{ backgroundColor: colors.primary }}
                onClick={(e) => e.preventDefault()}
              >
                {primaryButtonText}
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href={secondaryButtonLink}
                className="px-8 py-3 rounded-lg font-semibold border-2 flex items-center justify-center gap-2 hover:opacity-80 transition"
                style={{
                  borderColor: colors.primary,
                  color: colors.primary
                }}
                onClick={(e) => e.preventDefault()}
              >
                {secondaryButtonText}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Preview indicator */}
      {isPreview && (
        <div className="mt-8 text-center">
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            VooPress Hero Section
          </span>
        </div>
      )}
    </section>
  )
}

export default VooPressHeroPreview
