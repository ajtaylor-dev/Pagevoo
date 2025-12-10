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

interface VooPressFeaturedPostsPreviewProps {
  config: any
  themeConfig?: any
  isPreview?: boolean
}

const VooPressFeaturedPostsPreview: React.FC<VooPressFeaturedPostsPreviewProps> = ({
  config = {},
  themeConfig = {},
  isPreview = true
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const colors = themeConfig.theme_colors || config.theme_colors || {
    primary: '#2563EB',
    secondary: '#1D4ED8',
    background: '#FFFFFF',
    text: '#1E293B',
    accent: '#10B981'
  }

  const typography = themeConfig.theme_typography || config.theme_typography || {
    heading_font: 'Inter, system-ui, sans-serif',
    body_font: 'Inter, system-ui, sans-serif'
  }

  const count = config.count ?? 3
  const layout = config.layout ?? 'cards'
  const sectionTitle = config.section_title ?? 'Featured Posts'

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
      <section className="py-12" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
          <span className="ml-2 text-sm" style={{ color: colors.text }}>Loading featured posts...</span>
        </div>
      </section>
    )
  }

  // Show empty state if no posts
  if (posts.length === 0) {
    return (
      <section className="py-12" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2
            className="text-2xl font-bold text-center mb-8"
            style={{ fontFamily: typography.heading_font, color: colors.text }}
          >
            {sectionTitle}
          </h2>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: colors.primary + '40' }} />
            <p className="text-sm" style={{ color: colors.text + 'aa' }}>
              No featured posts yet. Create your first blog post!
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2
            className="text-3xl font-bold mb-3"
            style={{ fontFamily: typography.heading_font, color: colors.text }}
          >
            {sectionTitle}
          </h2>
          <p
            className="text-base"
            style={{ fontFamily: typography.body_font, color: colors.text + 'aa' }}
          >
            Our latest and most popular articles
          </p>
        </div>

        {/* Posts Grid */}
        <div className={`grid gap-6 ${
          count === 2 ? 'md:grid-cols-2' :
          count >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1'
        }`}>
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-xl overflow-hidden border hover:shadow-lg transition-shadow"
              style={{ borderColor: colors.primary + '20', backgroundColor: '#fff' }}
            >
              {/* Image */}
              <div
                className="h-48 flex items-center justify-center"
                style={{ backgroundColor: colors.primary + '08' }}
              >
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-12 h-12" style={{ color: colors.primary + '30' }} />
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Category */}
                {post.category && (
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: colors.primary }}
                  >
                    {post.category.name}
                  </span>
                )}

                {/* Title */}
                <h3
                  className="text-lg font-bold mt-2 mb-2 line-clamp-2 hover:opacity-80 cursor-pointer transition"
                  style={{ fontFamily: typography.heading_font, color: colors.text }}
                >
                  {post.title}
                </h3>

                {/* Excerpt */}
                {post.excerpt && (
                  <p
                    className="text-sm mb-4 line-clamp-2"
                    style={{ fontFamily: typography.body_font, color: colors.text + 'aa' }}
                  >
                    {post.excerpt}
                  </p>
                )}

                {/* Meta & CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs" style={{ color: colors.text + '80' }}>
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.published_at || post.created_at)}
                  </div>
                  <a
                    href="#"
                    className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                    style={{ color: colors.primary }}
                    onClick={(e) => e.preventDefault()}
                  >
                    Read
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Preview indicator */}
      {isPreview && (
        <div className="mt-6 text-center">
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            VooPress Featured Posts - Synced with Blog Feature
          </span>
        </div>
      )}
    </section>
  )
}

export default VooPressFeaturedPostsPreview
