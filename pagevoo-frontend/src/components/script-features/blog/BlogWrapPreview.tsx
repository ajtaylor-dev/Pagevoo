import React from 'react'
import { FileText, Calendar, User, FolderOpen, ArrowRight } from 'lucide-react'
import type { BlogPost, BlogCategory } from '../../BlogManager'

interface BlogConfig {
  name?: string
  layout: 'list' | 'grid' | 'cards'
  postsPerPage: number
  columns: number
  gap: string
  showFeaturedImage: boolean
  showExcerpt: boolean
  showAuthor: boolean
  showDate: boolean
  showCategory: boolean
  showTags: boolean
  showReadMore: boolean
  readMoreText: string
  sortBy: 'newest' | 'oldest' | 'title_asc' | 'title_desc'
  filterCategory: number | null
  excerptLength: number
  dateFormat: string
  containerStyle?: {
    padding?: string
    background?: string
    borderRadius?: string
  }
}

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface BlogWrapPreviewProps {
  section: TemplateSection
  selectedSection: TemplateSection | null
  posts?: BlogPost[]
  categories?: BlogCategory[]
  onOpenBlogManager?: () => void
}

// Sample post for preview when no posts exist
const samplePosts: BlogPost[] = [
  {
    id: 1,
    title: 'Getting Started with Your Blog',
    slug: 'getting-started',
    excerpt: 'Learn how to create engaging content for your audience and grow your readership.',
    content: '',
    featured_image: null,
    author_name: 'John Doe',
    category_id: 1,
    category: { id: 1, name: 'Tutorials', slug: 'tutorials', description: null, order: 0 },
    status: 'published',
    published_at: new Date().toISOString(),
    view_count: 42,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Top 10 Tips for Better Writing',
    slug: 'writing-tips',
    excerpt: 'Discover the secrets to writing compelling blog posts that keep readers engaged.',
    content: '',
    featured_image: null,
    author_name: 'Jane Smith',
    category_id: 2,
    category: { id: 2, name: 'Tips & Tricks', slug: 'tips', description: null, order: 1 },
    status: 'published',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    view_count: 128,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    title: 'The Future of Content Creation',
    slug: 'future-content',
    excerpt: 'Explore emerging trends and technologies shaping the future of blogging.',
    content: '',
    featured_image: null,
    author_name: 'Alex Johnson',
    category_id: 1,
    category: { id: 1, name: 'Tutorials', slug: 'tutorials', description: null, order: 0 },
    status: 'published',
    published_at: new Date(Date.now() - 172800000).toISOString(),
    view_count: 89,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  }
]

export const BlogWrapPreview: React.FC<BlogWrapPreviewProps> = ({
  section,
  selectedSection,
  posts = [],
  categories = [],
  onOpenBlogManager
}) => {
  const content = section.content || {}
  const { blogConfig, title, subtitle } = content
  const isSelected = selectedSection?.id === section.id
  const config = blogConfig || {
    layout: 'list',
    postsPerPage: 10,
    columns: 2,
    gap: '24px',
    showFeaturedImage: true,
    showExcerpt: true,
    showAuthor: true,
    showDate: true,
    showCategory: true,
    showTags: false,
    showReadMore: true,
    readMoreText: 'Read More',
    sortBy: 'newest',
    filterCategory: null,
    excerptLength: 150,
    dateFormat: 'MMM D, YYYY',
    containerStyle: {}
  }

  // Use sample posts if no real posts
  const displayPosts = posts.length > 0 ? posts : samplePosts
  const isPreviewMode = posts.length === 0

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Truncate excerpt
  const truncateExcerpt = (text: string | null): string => {
    if (!text) return ''
    if (text.length <= config.excerptLength) return text
    return text.substring(0, config.excerptLength) + '...'
  }

  // Container styles
  const containerStyle: React.CSSProperties = {
    padding: config.containerStyle?.padding || '32px',
    background: config.containerStyle?.background || 'transparent',
    borderRadius: config.containerStyle?.borderRadius || '0'
  }

  // Empty state
  if (displayPosts.length === 0) {
    return (
      <div
        style={containerStyle}
        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[#98b290]' : ''}`}
      >
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FileText className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium mb-2">No Blog Posts</p>
          <p className="text-sm mb-4">Create your first blog post to see it here</p>
          {onOpenBlogManager && (
            <button
              onClick={onOpenBlogManager}
              className="px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition"
            >
              Open Blog Manager
            </button>
          )}
        </div>
      </div>
    )
  }

  // Render a single post card
  const renderPostCard = (post: BlogPost) => {
    const isGrid = config.layout === 'grid' || config.layout === 'cards'

    return (
      <article
        key={post.id}
        className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition ${
          config.layout === 'list' ? 'flex' : ''
        }`}
      >
        {/* Featured Image Placeholder */}
        {config.showFeaturedImage && (
          <div
            className={`bg-gray-100 flex items-center justify-center ${
              config.layout === 'list' ? 'w-48 flex-shrink-0' : 'w-full h-48'
            }`}
          >
            {post.featured_image ? (
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText className="w-12 h-12 text-gray-300" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1">
          {/* Category */}
          {config.showCategory && post.category && (
            <div className="mb-2">
              <span className="text-xs font-medium text-[#98b290] uppercase tracking-wide">
                {post.category.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-800 text-lg mb-2 hover:text-[#98b290] cursor-pointer transition">
            {post.title}
          </h3>

          {/* Excerpt */}
          {config.showExcerpt && post.excerpt && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {truncateExcerpt(post.excerpt)}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            {config.showAuthor && post.author_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {post.author_name}
              </span>
            )}
            {config.showDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(post.published_at || post.created_at)}
              </span>
            )}
          </div>

          {/* Read More */}
          {config.showReadMore && (
            <button className="text-sm font-medium text-[#98b290] hover:text-[#7a9274] flex items-center gap-1 transition">
              {config.readMoreText}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </article>
    )
  }

  return (
    <div
      style={containerStyle}
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[#98b290]' : ''}`}
    >
      {/* Preview Banner */}
      {isPreviewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <FileText className="w-4 h-4" />
            <span>Preview mode - showing sample posts</span>
          </div>
          {onOpenBlogManager && (
            <button
              onClick={onOpenBlogManager}
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Open Blog Manager
            </button>
          )}
        </div>
      )}

      {/* Title & Subtitle */}
      {(title || subtitle) && (
        <div className="mb-6 text-center">
          {title && <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
      )}

      {/* Posts Grid/List */}
      <div
        className={
          config.layout === 'list'
            ? 'space-y-4'
            : `grid gap-6`
        }
        style={
          config.layout !== 'list'
            ? {
                gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
                gap: config.gap
              }
            : { gap: config.gap }
        }
      >
        {displayPosts.slice(0, config.postsPerPage).map(renderPostCard)}
      </div>

      {/* Pagination Placeholder */}
      {displayPosts.length > config.postsPerPage && (
        <div className="mt-6 flex justify-center gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            Previous
          </button>
          <button className="px-4 py-2 bg-[#98b290] text-white rounded-lg">1</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            2
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
