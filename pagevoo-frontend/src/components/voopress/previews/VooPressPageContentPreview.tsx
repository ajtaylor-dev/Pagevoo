import React from 'react'
import { FileText } from 'lucide-react'

interface VooPressPageContentPreviewProps {
  config: any
  themeConfig?: any
  isPreview?: boolean
}

const VooPressPageContentPreview: React.FC<VooPressPageContentPreviewProps> = ({
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

  // Editable content - use ?? to allow empty strings
  const pageContent = config.page_content ?? config.default_content ?? `
    <h1>About Us</h1>
    <p>Welcome to our blog. Tell your story here...</p>
    <p>This is a page content section where you can add any HTML content. Use the editor to customize this page with your own text, images, and formatting.</p>
    <h2>Our Mission</h2>
    <p>We believe in sharing knowledge and helping others succeed. Our mission is to provide valuable insights and resources to our readers.</p>
    <h2>Get In Touch</h2>
    <p>We'd love to hear from you! Feel free to reach out through our contact page or connect with us on social media.</p>
  `

  return (
    <section
      className="py-10"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Content */}
        <article
          className="prose prose-lg max-w-none"
          style={{
            '--tw-prose-body': colors.text,
            '--tw-prose-headings': colors.text,
            '--tw-prose-links': colors.primary,
            fontFamily: typography.body_font
          } as React.CSSProperties}
        >
          <div
            dangerouslySetInnerHTML={{ __html: pageContent }}
            style={{
              color: colors.text
            }}
            className="[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-0 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-6 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4"
          />
        </article>

        {/* Preview indicator */}
        {isPreview && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">VooPress Page Content Preview</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Edit content using the properties panel on the right.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default VooPressPageContentPreview
