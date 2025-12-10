import React, { useState, useEffect } from 'react'
import { FileText, Calendar, User, Search, Tag, FolderOpen, ArrowRight, Loader2 } from 'lucide-react'
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

interface BlogCategory {
  id: number
  name: string
  slug: string
  description: string | null
  posts_count?: number
}

interface VooPressBlogListingPreviewProps {
  config: any
  themeConfig?: any
  isPreview?: boolean
}

const VooPressBlogListingPreview: React.FC<VooPressBlogListingPreviewProps> = ({
  config = {},
  themeConfig = {},
  isPreview = true
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const showSidebar = config.show_sidebar !== false

  // Fetch real blog posts and categories from VooPress endpoint
  useEffect(() => {
    const fetchBlogData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch posts from VooPress-specific endpoint
        const postsResponse = await api.get('/v1/script-features/voopress/blog/posts?status=published&limit=10')
        if (postsResponse.success && postsResponse.data?.posts) {
          setPosts(postsResponse.data.posts)
        }

        // Fetch categories from VooPress-specific endpoint
        const categoriesResponse = await api.get('/v1/script-features/voopress/blog/categories')
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data)
        }
      } catch (err) {
        console.error('Failed to fetch blog data:', err)
        setError('Failed to load blog posts')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogData()
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

  // Get recent post titles
  const recentPostTitles = posts.slice(0, 3).map(p => p.title)

  // Show loading state
  if (loading) {
    return (
      <section className="py-8" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
          <span className="ml-3" style={{ color: colors.text }}>Loading posts...</span>
        </div>
      </section>
    )
  }

  // Show empty state if no posts
  if (posts.length === 0) {
    return (
      <section className="py-8" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary + '40' }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
              No Blog Posts Yet
            </h3>
            <p className="text-sm" style={{ color: colors.text + 'aa' }}>
              Create your first blog post to see it displayed here.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className={`flex gap-8 ${showSidebar ? '' : 'justify-center'}`}>
          {/* Main Content */}
          <div className={showSidebar ? 'flex-1' : 'max-w-3xl w-full'}>
            {/* Posts */}
            <div className="space-y-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition"
                  style={{ borderColor: colors.primary + '20' }}
                >
                  <div className="md:flex">
                    {/* Image */}
                    <div
                      className="md:w-1/3 h-48 md:h-auto flex items-center justify-center"
                      style={{ backgroundColor: colors.primary + '08' }}
                    >
                      {post.featured_image ? (
                        <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-12 h-12" style={{ color: colors.primary + '30' }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="md:w-2/3 p-5">
                      {post.category && (
                        <div className="mb-2">
                          <span
                            className="text-xs font-medium uppercase tracking-wide"
                            style={{ color: colors.primary }}
                          >
                            {post.category.name}
                          </span>
                        </div>
                      )}

                      <h3
                        className="text-xl font-bold mb-2 hover:opacity-80 cursor-pointer transition"
                        style={{
                          fontFamily: typography.heading_font,
                          color: colors.text
                        }}
                      >
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p
                          className="text-sm mb-3 line-clamp-2"
                          style={{
                            fontFamily: typography.body_font,
                            color: colors.text + 'aa'
                          }}
                        >
                          {post.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs" style={{ color: colors.text + '80' }}>
                          {post.author_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {post.author_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.published_at || post.created_at)}
                          </span>
                        </div>
                        <a
                          href="#"
                          className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                          style={{ color: colors.primary }}
                          onClick={(e) => e.preventDefault()}
                        >
                          Read More
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {posts.length > 5 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  className="px-4 py-2 rounded border text-sm"
                  style={{ borderColor: colors.primary + '40', color: colors.text }}
                >
                  Previous
                </button>
                <button
                  className="px-4 py-2 rounded text-sm text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  1
                </button>
                <button
                  className="px-4 py-2 rounded border text-sm"
                  style={{ borderColor: colors.primary + '40', color: colors.text }}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <aside className="w-72 flex-shrink-0 space-y-6">
              {/* Search Widget */}
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: colors.primary + '20' }}
              >
                <h4
                  className="font-bold mb-3"
                  style={{ fontFamily: typography.heading_font, color: colors.text }}
                >
                  Search
                </h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full px-3 py-2 pr-10 border rounded text-sm"
                    style={{ borderColor: colors.primary + '30' }}
                  />
                  <Search
                    className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: colors.text + '60' }}
                  />
                </div>
              </div>

              {/* Categories Widget */}
              {categories.length > 0 && (
                <div
                  className="p-4 rounded-lg border"
                  style={{ borderColor: colors.primary + '20' }}
                >
                  <h4
                    className="font-bold mb-3 flex items-center gap-2"
                    style={{ fontFamily: typography.heading_font, color: colors.text }}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Categories
                  </h4>
                  <ul className="space-y-2">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <a
                          href="#"
                          className="flex items-center justify-between text-sm hover:opacity-80 transition"
                          style={{ color: colors.text + 'cc' }}
                          onClick={(e) => e.preventDefault()}
                        >
                          <span>{cat.name}</span>
                          {cat.posts_count !== undefined && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{ backgroundColor: colors.primary + '15', color: colors.primary }}
                            >
                              {cat.posts_count}
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Posts Widget */}
              {recentPostTitles.length > 0 && (
                <div
                  className="p-4 rounded-lg border"
                  style={{ borderColor: colors.primary + '20' }}
                >
                  <h4
                    className="font-bold mb-3 flex items-center gap-2"
                    style={{ fontFamily: typography.heading_font, color: colors.text }}
                  >
                    <FileText className="w-4 h-4" />
                    Recent Posts
                  </h4>
                  <ul className="space-y-2">
                    {recentPostTitles.map((title, i) => (
                      <li key={i}>
                        <a
                          href="#"
                          className="text-sm hover:opacity-80 transition line-clamp-2"
                          style={{ color: colors.text + 'cc' }}
                          onClick={(e) => e.preventDefault()}
                        >
                          {title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags Widget */}
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: colors.primary + '20' }}
              >
                <h4
                  className="font-bold mb-3 flex items-center gap-2"
                  style={{ fontFamily: typography.heading_font, color: colors.text }}
                >
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['blogging', 'tips', 'writing', 'content', 'SEO'].map((tag, i) => (
                    <a
                      key={i}
                      href="#"
                      className="px-2 py-1 rounded text-xs hover:opacity-80 transition"
                      style={{
                        backgroundColor: colors.primary + '10',
                        color: colors.primary
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {tag}
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Preview indicator */}
        {isPreview && (
          <div className="mt-4 text-center">
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              VooPress Blog Listing - Synced with Blog Feature
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

export default VooPressBlogListingPreview
