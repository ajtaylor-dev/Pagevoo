import React, { useState, useEffect } from 'react'
import { FileText, Calendar, ArrowRight, Loader2, FolderOpen } from 'lucide-react'
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
  posts_count?: number
}

interface CategoryWithPosts {
  category: BlogCategory
  posts: BlogPost[]
}

interface VooPressCategorySectionsPreviewProps {
  config: any
  themeConfig?: any
  isPreview?: boolean
}

const VooPressCategorySectionsPreview: React.FC<VooPressCategorySectionsPreviewProps> = ({
  config = {},
  themeConfig = {},
  isPreview = true
}) => {
  const [categoriesWithPosts, setCategoriesWithPosts] = useState<CategoryWithPosts[]>([])
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

  const showCategories = config.show_categories ?? 3
  const postsPerCategory = config.posts_per_category ?? 4

  // Fetch categories and posts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch categories and posts in parallel
        const [categoriesRes, postsRes] = await Promise.all([
          api.get('/v1/script-features/voopress/blog/categories'),
          api.get(`/v1/script-features/voopress/blog/posts?status=published&limit=50`)
        ])

        const categories: BlogCategory[] = categoriesRes.success ? categoriesRes.data || [] : []
        const posts: BlogPost[] = postsRes.success && postsRes.data?.posts ? postsRes.data.posts : []

        // Group posts by category
        const categoryMap = new Map<number, CategoryWithPosts>()

        categories.forEach(cat => {
          categoryMap.set(cat.id, { category: cat, posts: [] })
        })

        posts.forEach(post => {
          if (post.category_id && categoryMap.has(post.category_id)) {
            const catData = categoryMap.get(post.category_id)!
            if (catData.posts.length < postsPerCategory) {
              catData.posts.push(post)
            }
          }
        })

        // Get categories with posts, sorted by post count
        const result = Array.from(categoryMap.values())
          .filter(c => c.posts.length > 0)
          .sort((a, b) => b.posts.length - a.posts.length)
          .slice(0, showCategories)

        setCategoriesWithPosts(result)
      } catch (err) {
        console.error('Failed to fetch category data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [showCategories, postsPerCategory])

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Show loading state
  if (loading) {
    return (
      <section className="py-10" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
          <span className="ml-2 text-sm" style={{ color: colors.text }}>Loading categories...</span>
        </div>
      </section>
    )
  }

  // Show empty state if no categories with posts
  if (categoriesWithPosts.length === 0) {
    return (
      <section className="py-10" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary + '40' }} />
            <p className="text-lg font-medium" style={{ color: colors.text }}>
              No categorized content yet
            </p>
            <p className="text-sm mt-2" style={{ color: colors.text + 'aa' }}>
              Create categories and assign posts to them
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-10" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {categoriesWithPosts.map((catData, index) => (
          <div key={catData.category.id}>
            {/* Category Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-1 h-8 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: typography.heading_font, color: colors.text }}
                >
                  {catData.category.name}
                </h2>
              </div>
              <a
                href="#"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: colors.primary }}
                onClick={(e) => e.preventDefault()}
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* First post - larger card */}
              {catData.posts[0] && (
                <article
                  className="md:col-span-2 lg:col-span-2 lg:row-span-2 relative rounded-xl overflow-hidden group cursor-pointer"
                  style={{ backgroundColor: colors.primary + '10' }}
                >
                  <div className="h-full min-h-[300px] lg:min-h-[400px]">
                    {catData.posts[0].featured_image ? (
                      <img
                        src={catData.posts[0].featured_image}
                        alt={catData.posts[0].title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="w-16 h-16" style={{ color: colors.primary + '30' }} />
                      </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3
                        className="text-xl lg:text-2xl font-bold text-white line-clamp-2 group-hover:text-opacity-90 transition"
                        style={{ fontFamily: typography.heading_font }}
                      >
                        {catData.posts[0].title}
                      </h3>
                      {catData.posts[0].excerpt && (
                        <p className="text-white/70 text-sm mt-2 line-clamp-2">
                          {catData.posts[0].excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-white/60 text-xs mt-3">
                        <Calendar className="w-3 h-3" />
                        {formatDate(catData.posts[0].published_at || catData.posts[0].created_at)}
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Remaining posts - smaller cards */}
              {catData.posts.slice(1).map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl overflow-hidden border hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderColor: colors.primary + '10' }}
                >
                  {/* Thumbnail */}
                  <div
                    className="h-32 flex items-center justify-center"
                    style={{ backgroundColor: colors.primary + '05' }}
                  >
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-10 h-10" style={{ color: colors.primary + '25' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <h4
                      className="font-bold line-clamp-2 hover:opacity-80 transition text-sm"
                      style={{ fontFamily: typography.heading_font, color: colors.text }}
                    >
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs mt-2" style={{ color: colors.text + '60' }}>
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.published_at || post.created_at)}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Divider between categories */}
            {index < categoriesWithPosts.length - 1 && (
              <div
                className="mt-12 border-b"
                style={{ borderColor: colors.primary + '15' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Preview indicator */}
      {isPreview && (
        <div className="mt-8 text-center">
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            VooPress Category Sections - Posts by Category
          </span>
        </div>
      )}
    </section>
  )
}

export default VooPressCategorySectionsPreview
