import React, { useState, useEffect } from 'react'
import { FileText, Calendar, ArrowRight, Loader2 } from 'lucide-react'
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

interface VooPressFeaturedGridPreviewProps {
  config: any
  themeConfig?: any
  isPreview?: boolean
}

const VooPressFeaturedGridPreview: React.FC<VooPressFeaturedGridPreviewProps> = ({
  config = {},
  themeConfig = {},
  isPreview = true
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const colors = themeConfig.theme_colors || config.theme_colors || {
    primary: '#DC2626',
    secondary: '#991B1B',
    background: '#F9FAFB',
    text: '#111827',
    accent: '#F59E0B'
  }

  const typography = themeConfig.theme_typography || config.theme_typography || {
    heading_font: 'Inter, system-ui, sans-serif',
    body_font: 'Inter, system-ui, sans-serif'
  }

  const count = config.count ?? 5
  const layout = config.layout ?? 'hero-grid'

  // Fetch featured posts from VooPress endpoint
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      try {
        const response = await api.get(`/v1/script-features/voopress/blog/posts?status=published&limit=${count}`)
        if (response.success && response.data?.posts) {
          setPosts(response.data.posts.slice(0, count))
        }
      } catch (err) {
        console.error('Failed to fetch featured posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [count])

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Show loading state
  if (loading) {
    return (
      <section className="py-8" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
          <span className="ml-2 text-sm" style={{ color: colors.text }}>Loading featured content...</span>
        </div>
      </section>
    )
  }

  // Show empty state if no posts
  if (posts.length === 0) {
    return (
      <section className="py-8" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary + '40' }} />
            <p className="text-lg font-medium" style={{ color: colors.text }}>
              No featured content yet
            </p>
            <p className="text-sm mt-2" style={{ color: colors.text + 'aa' }}>
              Create blog posts to populate this section
            </p>
          </div>
        </div>
      </section>
    )
  }

  const heroPost = posts[0]
  const secondaryPosts = posts.slice(1, 3)
  const tertiaryPosts = posts.slice(3, 5)

  return (
    <section className="py-6" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Hero Post - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 lg:row-span-2">
            <article
              className="relative h-full min-h-[400px] lg:min-h-[500px] rounded-xl overflow-hidden group cursor-pointer"
              style={{ backgroundColor: colors.primary + '10' }}
            >
              {heroPost.featured_image ? (
                <img
                  src={heroPost.featured_image}
                  alt={heroPost.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-24 h-24" style={{ color: colors.primary + '30' }} />
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                {heroPost.category && (
                  <span
                    className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded mb-3"
                    style={{ backgroundColor: colors.primary, color: '#fff' }}
                  >
                    {heroPost.category.name}
                  </span>
                )}
                <h2
                  className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 line-clamp-3 group-hover:text-opacity-90 transition"
                  style={{ fontFamily: typography.heading_font }}
                >
                  {heroPost.title}
                </h2>
                {heroPost.excerpt && (
                  <p className="text-white/80 text-sm lg:text-base mb-4 line-clamp-2 max-w-2xl">
                    {heroPost.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-white/70 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(heroPost.published_at || heroPost.created_at)}
                  </span>
                  {heroPost.author_name && (
                    <span>By {heroPost.author_name}</span>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* Secondary Posts - Right column */}
          {secondaryPosts.map((post) => (
            <article
              key={post.id}
              className="relative h-[240px] rounded-xl overflow-hidden group cursor-pointer"
              style={{ backgroundColor: colors.primary + '10' }}
            >
              {post.featured_image ? (
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-12 h-12" style={{ color: colors.primary + '30' }} />
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {post.category && (
                  <span
                    className="inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded mb-2"
                    style={{ backgroundColor: colors.primary, color: '#fff' }}
                  >
                    {post.category.name}
                  </span>
                )}
                <h3
                  className="text-lg font-bold text-white line-clamp-2 group-hover:text-opacity-90 transition"
                  style={{ fontFamily: typography.heading_font }}
                >
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 text-white/60 text-xs mt-2">
                  <Calendar className="w-3 h-3" />
                  {formatDate(post.published_at || post.created_at)}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Tertiary Posts Row - Below the main grid */}
        {tertiaryPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {tertiaryPosts.map((post) => (
              <article
                key={post.id}
                className="flex gap-4 p-4 rounded-xl bg-white border hover:shadow-md transition-shadow cursor-pointer"
                style={{ borderColor: colors.primary + '15' }}
              >
                {/* Thumbnail */}
                <div
                  className="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: colors.primary + '08' }}
                >
                  {post.featured_image ? (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-8 h-8" style={{ color: colors.primary + '30' }} />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {post.category && (
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: colors.primary }}
                    >
                      {post.category.name}
                    </span>
                  )}
                  <h4
                    className="font-bold mt-1 line-clamp-2 hover:opacity-80 transition"
                    style={{ fontFamily: typography.heading_font, color: colors.text }}
                  >
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs mt-2" style={{ color: colors.text + '70' }}>
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.published_at || post.created_at)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Preview indicator */}
      {isPreview && (
        <div className="mt-6 text-center">
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            VooPress Featured Grid - Magazine Layout
          </span>
        </div>
      )}
    </section>
  )
}

export default VooPressFeaturedGridPreview
