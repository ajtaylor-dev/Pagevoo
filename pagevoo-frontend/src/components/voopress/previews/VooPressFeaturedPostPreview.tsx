import React, { useState, useEffect } from 'react'
import { FileText, Calendar, User, ArrowRight, Loader2 } from 'lucide-react'
import { api } from '@/services/api'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  author_name: string | null
  category_id: number | null
  category?: { id: number; name: string; slug: string } | null
  status: string
  published_at: string | null
  created_at: string
}

interface VooPressFeaturedPostPreviewProps {
  config: any
  themeConfig?: any
  isPreview?: boolean
}

const VooPressFeaturedPostPreview: React.FC<VooPressFeaturedPostPreviewProps> = ({
  config = {},
  themeConfig = {},
  isPreview = true
}) => {
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  const colors = themeConfig.theme_colors || config.theme_colors || {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    background: '#FFFFFF',
    text: '#1F2937',
    accent: '#F59E0B'
  }

  const typography = themeConfig.theme_typography || config.theme_typography || {
    heading_font: 'Georgia, serif',
    body_font: 'system-ui, sans-serif'
  }

  // Fetch the latest blog post as featured from VooPress endpoint
  useEffect(() => {
    const fetchFeaturedPost = async () => {
      setLoading(true)
      try {
        const response = await api.get('/v1/script-features/voopress/blog/posts?status=published&limit=1')
        if (response.success && response.data?.posts?.length > 0) {
          setFeaturedPost(response.data.posts[0])
        }
      } catch (err) {
        console.error('Failed to fetch featured post:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedPost()
  }, [])

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Show loading state
  if (loading) {
    return (
      <section className="py-8" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
          <span className="ml-2 text-sm" style={{ color: colors.text }}>Loading featured post...</span>
        </div>
      </section>
    )
  }

  // If no featured post, don't render the section
  if (!featuredPost) {
    return null
  }

  return (
    <section
      className="py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Featured Label */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded"
            style={{
              backgroundColor: colors.accent + '20',
              color: colors.accent
            }}
          >
            Featured
          </span>
        </div>

        {/* Featured Post Card */}
        <article
          className="rounded-lg overflow-hidden border"
          style={{ borderColor: colors.primary + '20' }}
        >
          <div className="md:flex">
            {/* Image */}
            <div
              className="md:w-2/5 h-64 md:h-auto flex items-center justify-center"
              style={{ backgroundColor: colors.primary + '10' }}
            >
              {featuredPost.featured_image ? (
                <img
                  src={featuredPost.featured_image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-16 h-16" style={{ color: colors.primary + '40' }} />
              )}
            </div>

            {/* Content */}
            <div className="md:w-3/5 p-6 md:p-8">
              {/* Category */}
              {featuredPost.category && (
                <div className="mb-3">
                  <span
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: colors.primary }}
                  >
                    {featuredPost.category.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h2
                className="text-2xl md:text-3xl font-bold mb-4 hover:opacity-80 cursor-pointer transition"
                style={{
                  fontFamily: typography.heading_font,
                  color: colors.text
                }}
              >
                {featuredPost.title}
              </h2>

              {/* Excerpt */}
              {featuredPost.excerpt && (
                <p
                  className="mb-4 leading-relaxed line-clamp-3"
                  style={{
                    fontFamily: typography.body_font,
                    color: colors.text + 'cc'
                  }}
                >
                  {featuredPost.excerpt}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: colors.text + '99' }}>
                {featuredPost.author_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {featuredPost.author_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(featuredPost.published_at || featuredPost.created_at)}
                </span>
              </div>

              {/* Read More */}
              <a
                href="#"
                className="inline-flex items-center gap-2 font-medium hover:gap-3 transition-all"
                style={{ color: colors.primary }}
                onClick={(e) => e.preventDefault()}
              >
                Read More
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </article>

        {/* Preview indicator */}
        {isPreview && (
          <div className="mt-2 text-center">
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              VooPress Featured Post - Synced with Blog Feature
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

export default VooPressFeaturedPostPreview
