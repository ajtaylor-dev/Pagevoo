import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Pencil, X, Search, Eye, EyeOff,
  Calendar, User, FolderOpen, Tag, MoreVertical,
  ChevronLeft, ArrowLeft, FileText, Clock, Loader2,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Quote, Code, Link2, Image, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo
} from 'lucide-react'
import { api } from '@/services/api'
import { databaseService } from '@/services/databaseService'

// Types
export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  author_name: string | null
  category_id: number | null
  category?: BlogCategory
  tags?: BlogTag[]
  status: 'draft' | 'published' | 'scheduled'
  published_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface BlogCategory {
  id: number
  name: string
  slug: string
  description: string | null
  order: number
}

export interface BlogTag {
  id: number
  name: string
  slug: string
}

interface BlogManagerProps {
  isOpen: boolean
  onClose: () => void
  type: 'template' | 'website'
  referenceId: number
}

type ViewMode = 'posts' | 'categories' | 'tags' | 'editor'

export function BlogManager({
  isOpen,
  onClose,
  type,
  referenceId
}: BlogManagerProps) {
  // Data state
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [databaseId, setDatabaseId] = useState<number | null>(null)
  const [featureError, setFeatureError] = useState<string | null>(null)
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('posts')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all')
  const [filterCategory, setFilterCategory] = useState<number | null>(null)

  // Post editor state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isNewPost, setIsNewPost] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [postExcerpt, setPostExcerpt] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postFeaturedImage, setPostFeaturedImage] = useState('')
  const [postAuthor, setPostAuthor] = useState('')
  const [postCategoryId, setPostCategoryId] = useState<number | null>(null)
  const [postStatus, setPostStatus] = useState<'draft' | 'published'>('draft')
  const [postTags, setPostTags] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  // Category/Tag creation state
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [showCreateTag, setShowCreateTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)

  const [postMenuOpen, setPostMenuOpen] = useState<number | null>(null)

  // Rich text editor ref
  const contentEditorRef = useRef<HTMLTextAreaElement>(null)

  // Rich text formatting helper
  const insertFormatting = useCallback((before: string, after: string = '') => {
    const textarea = contentEditorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = postContent.substring(start, end)
    const beforeText = postContent.substring(0, start)
    const afterText = postContent.substring(end)

    const newContent = beforeText + before + selectedText + (after || before) + afterText
    setPostContent(newContent)

    // Reset cursor position after the inserted content
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length + (after || before).length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [postContent])

  const insertTag = useCallback((tag: string, attributes: string = '') => {
    const textarea = contentEditorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = postContent.substring(start, end)
    const beforeText = postContent.substring(0, start)
    const afterText = postContent.substring(end)

    const openTag = attributes ? `<${tag} ${attributes}>` : `<${tag}>`
    const closeTag = `</${tag}>`
    const newContent = beforeText + openTag + selectedText + closeTag + afterText
    setPostContent(newContent)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + openTag.length + selectedText.length + closeTag.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [postContent])

  const insertBlockTag = useCallback((tag: string) => {
    const textarea = contentEditorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = postContent.substring(start, end)
    const beforeText = postContent.substring(0, start)
    const afterText = postContent.substring(end)

    // Add newlines for block elements
    const prefix = beforeText.endsWith('\n') || beforeText === '' ? '' : '\n'
    const suffix = afterText.startsWith('\n') || afterText === '' ? '' : '\n'

    const newContent = beforeText + prefix + `<${tag}>${selectedText || 'Text here'}</${tag}>` + suffix + afterText
    setPostContent(newContent)

    setTimeout(() => {
      textarea.focus()
    }, 0)
  }, [postContent])

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:')
    if (!url) return

    const textarea = contentEditorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = postContent.substring(start, end) || 'Link text'
    const beforeText = postContent.substring(0, start)
    const afterText = postContent.substring(end)

    const linkHtml = `<a href="${url}">${selectedText}</a>`
    const newContent = beforeText + linkHtml + afterText
    setPostContent(newContent)

    setTimeout(() => {
      textarea.focus()
    }, 0)
  }, [postContent])

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:')
    if (!url) return

    const alt = prompt('Enter alt text:', 'Image') || 'Image'

    const textarea = contentEditorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const beforeText = postContent.substring(0, start)
    const afterText = postContent.substring(start)

    const imgHtml = `<img src="${url}" alt="${alt}" class="max-w-full h-auto rounded-lg" />`
    const newContent = beforeText + imgHtml + afterText
    setPostContent(newContent)

    setTimeout(() => {
      textarea.focus()
    }, 0)
  }, [postContent])

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && referenceId) {
      loadData()
    }
  }, [isOpen, referenceId, type])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode('posts')
      setSearchQuery('')
      setFilterStatus('all')
      setFilterCategory(null)
      setEditingPost(null)
      setIsNewPost(false)
      setFeatureError(null)
      resetPostForm()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    setFeatureError(null)
    try {
      // First get the database instance
      const instance = await databaseService.getInstance(type, referenceId)
      if (!instance) {
        console.error('No database found for blog')
        setFeatureError('No database found. Please create a database first.')
        setLoading(false)
        return
      }
      setDatabaseId(instance.id)

      // Load posts, categories, and tags in parallel
      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        api.getBlogPosts(type, referenceId),
        api.getBlogCategories(type, referenceId),
        api.getBlogTags(type, referenceId)
      ])

      // Check for feature not installed error
      if (!postsRes.success && postsRes.message?.includes('not installed')) {
        setFeatureError(postsRes.message)
        return
      }

      setPosts(postsRes.data || [])
      setCategories(categoriesRes.data || [])
      setTags(tagsRes.data || [])
    } catch (error: any) {
      console.error('Failed to load blog data:', error)
      // Check if the error message indicates feature not installed
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load blog data'
      if (errorMsg.includes('not installed') || errorMsg.includes('Base table')) {
        setFeatureError('Blog feature is not installed. Please install the Blog feature from the Database Manager.')
      } else {
        setFeatureError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Helpers
  const resetPostForm = () => {
    setPostTitle('')
    setPostSlug('')
    setPostExcerpt('')
    setPostContent('')
    setPostFeaturedImage('')
    setPostAuthor('')
    setPostCategoryId(null)
    setPostStatus('draft')
    setPostTags([])
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus
    const matchesCategory = filterCategory === null || post.category_id === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  // Start editing a post
  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setIsNewPost(false)
    setPostTitle(post.title)
    setPostSlug(post.slug)
    setPostExcerpt(post.excerpt || '')
    setPostContent(post.content)
    setPostFeaturedImage(post.featured_image || '')
    setPostAuthor(post.author_name || '')
    setPostCategoryId(post.category_id)
    setPostStatus(post.status === 'scheduled' ? 'draft' : post.status)
    setPostTags(post.tags?.map(t => t.id) || [])
    setViewMode('editor')
  }

  // Start creating a new post
  const handleNewPost = () => {
    setEditingPost(null)
    setIsNewPost(true)
    resetPostForm()
    setViewMode('editor')
  }

  // Save post
  const handleSavePost = async () => {
    if (!postTitle.trim()) {
      alert('Please enter a post title')
      return
    }

    if (!databaseId) {
      alert('No database connection')
      return
    }

    setSaving(true)
    try {
      const postData: Partial<BlogPost> = {
        title: postTitle,
        slug: postSlug || generateSlug(postTitle),
        excerpt: postExcerpt || null,
        content: postContent,
        featured_image: postFeaturedImage || null,
        author_name: postAuthor || null,
        category_id: postCategoryId,
        status: postStatus,
        published_at: postStatus === 'published' ? new Date().toISOString() : null
      }

      if (isNewPost) {
        const result = await api.createBlogPost({
          type,
          reference_id: referenceId,
          title: postData.title!,
          slug: postData.slug,
          excerpt: postData.excerpt ?? undefined,
          content: postData.content!,
          featured_image: postData.featured_image ?? undefined,
          author_name: postData.author_name ?? undefined,
          category_id: postData.category_id ?? undefined,
          status: postData.status!
        })
        setPosts([...posts, result.data])
      } else if (editingPost) {
        await api.updateBlogPost(editingPost.id, {
          type,
          reference_id: referenceId,
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt ?? undefined,
          content: postData.content,
          featured_image: postData.featured_image ?? undefined,
          author_name: postData.author_name ?? undefined,
          category_id: postData.category_id,
          status: postData.status
        })
        setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...postData } as BlogPost : p))
      }

      setViewMode('posts')
      resetPostForm()
      setEditingPost(null)
      setIsNewPost(false)
    } catch (error) {
      console.error('Failed to save post:', error)
      alert('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  // Delete post
  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return

    if (!databaseId) return

    try {
      await api.deleteBlogPost(postId, type, referenceId)
      setPosts(posts.filter(p => p.id !== postId))
      setPostMenuOpen(null)
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post')
    }
  }

  // Create category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    if (!databaseId) return

    setCreatingCategory(true)
    try {
      const result = await api.createBlogCategory({
        type,
        reference_id: referenceId,
        name: newCategoryName,
        description: newCategoryDescription || undefined
      })
      setCategories([...categories, result.data])
      setNewCategoryName('')
      setNewCategoryDescription('')
      setShowCreateCategory(false)
    } catch (error) {
      console.error('Failed to create category:', error)
      alert('Failed to create category')
    } finally {
      setCreatingCategory(false)
    }
  }

  // Delete category
  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? Posts will be uncategorized.')) return

    if (!databaseId) return

    try {
      await api.deleteBlogCategory(categoryId, type, referenceId)
      setCategories(categories.filter(c => c.id !== categoryId))
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  // Create tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    if (!databaseId) return

    setCreatingTag(true)
    try {
      const result = await api.createBlogTag({
        type,
        reference_id: referenceId,
        name: newTagName
      })
      setTags([...tags, result.data])
      setNewTagName('')
      setShowCreateTag(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
      alert('Failed to create tag')
    } finally {
      setCreatingTag(false)
    }
  }

  // Delete tag
  const handleDeleteTag = async (tagId: number) => {
    if (!databaseId) return

    try {
      await api.deleteBlogTag(tagId, type, referenceId)
      setTags(tags.filter(t => t.id !== tagId))
    } catch (error) {
      console.error('Failed to delete tag:', error)
      alert('Failed to delete tag')
    }
  }

  // Render posts list
  const renderPostsList = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4 flex-wrap">
        <button
          onClick={handleNewPost}
          className="flex items-center gap-2 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'draft' | 'published')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
        >
          <option value="all">All Status</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
        </select>

        <select
          value={filterCategory ?? ''}
          onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Posts Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm">Create your first blog post to get started</p>
            <button
              onClick={handleNewPost}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Create Post
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map(post => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#98b290] transition bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">{post.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {post.author_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {post.author_name}
                        </span>
                      )}
                      {post.category && (
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          {post.category.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.view_count} views
                      </span>
                    </div>
                  </div>

                  <div className="relative ml-4">
                    <button
                      onClick={() => setPostMenuOpen(postMenuOpen === post.id ? null : post.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>

                    {postMenuOpen === post.id && (
                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                        <button
                          onClick={() => {
                            handleEditPost(post)
                            setPostMenuOpen(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Render post editor
  const renderPostEditor = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Editor Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setViewMode('posts')
              resetPostForm()
              setEditingPost(null)
              setIsNewPost(false)
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Posts
          </button>
          <h2 className="text-lg font-semibold">
            {isNewPost ? 'Create New Post' : 'Edit Post'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={postStatus}
            onChange={(e) => setPostStatus(e.target.value as 'draft' | 'published')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <button
            onClick={handleSavePost}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => {
                setPostTitle(e.target.value)
                if (isNewPost && !postSlug) {
                  setPostSlug(generateSlug(e.target.value))
                }
              }}
              placeholder="Enter post title..."
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
            <input
              type="text"
              value={postSlug}
              onChange={(e) => setPostSlug(e.target.value)}
              placeholder="post-url-slug"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290] font-mono text-sm"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt (Short Summary)</label>
            <textarea
              value={postExcerpt}
              onChange={(e) => setPostExcerpt(e.target.value)}
              placeholder="Brief summary shown in post listings..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290] resize-none"
            />
          </div>

          {/* Content with Rich Text Toolbar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Rich Text Toolbar */}
              <div className="bg-gray-50 border-b border-gray-300 px-2 py-1.5 flex items-center gap-1 flex-wrap">
                {/* Heading buttons */}
                <div className="flex items-center border-r border-gray-300 pr-2 mr-1">
                  <button
                    type="button"
                    onClick={() => insertBlockTag('h1')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Heading 1"
                  >
                    <Heading1 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlockTag('h2')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlockTag('h3')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Heading 3"
                  >
                    <Heading3 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Text formatting */}
                <div className="flex items-center border-r border-gray-300 pr-2 mr-1">
                  <button
                    type="button"
                    onClick={() => insertTag('strong')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('em')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('u')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('s')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Lists */}
                <div className="flex items-center border-r border-gray-300 pr-2 mr-1">
                  <button
                    type="button"
                    onClick={() => insertBlockTag('ul')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlockTag('ol')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Block elements */}
                <div className="flex items-center border-r border-gray-300 pr-2 mr-1">
                  <button
                    type="button"
                    onClick={() => insertBlockTag('blockquote')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Quote"
                  >
                    <Quote className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('code')}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Inline Code"
                  >
                    <Code className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Links and Images */}
                <div className="flex items-center border-r border-gray-300 pr-2 mr-1">
                  <button
                    type="button"
                    onClick={insertLink}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Insert Link"
                  >
                    <Link2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={insertImage}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Insert Image"
                  >
                    <Image className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Paragraph button */}
                <button
                  type="button"
                  onClick={() => insertBlockTag('p')}
                  className="p-1.5 hover:bg-gray-200 rounded transition"
                  title="Paragraph"
                >
                  <span className="text-xs font-bold text-gray-600">P</span>
                </button>

                {/* Help text */}
                <span className="ml-auto text-xs text-gray-400">Select text and click to format</span>
              </div>
              <textarea
                ref={contentEditorRef}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write your post content here... (HTML supported)"
                rows={15}
                className="w-full px-4 py-3 focus:outline-none resize-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Sidebar fields in a grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image URL</label>
              <input
                type="text"
                value={postFeaturedImage}
                onChange={(e) => setPostFeaturedImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author Name</label>
              <input
                type="text"
                value={postAuthor}
                onChange={(e) => setPostAuthor(e.target.value)}
                placeholder="Author name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={postCategoryId ?? ''}
                onChange={(e) => setPostCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              >
                <option value="">No Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render categories manager
  const renderCategoriesManager = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Categories</h3>
        <button
          onClick={() => setShowCreateCategory(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {showCreateCategory && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">New Category</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
              <textarea
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Description (optional)..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290] resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition disabled:opacity-50"
                >
                  {creatingCategory ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateCategory(false)
                    setNewCategoryName('')
                    setNewCategoryDescription('')
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No categories yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#98b290] transition">
                <div>
                  <h4 className="font-medium text-gray-800">{cat.name}</h4>
                  {cat.description && (
                    <p className="text-sm text-gray-500">{cat.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Render tags manager
  const renderTagsManager = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tags</h3>
        <button
          onClick={() => setShowCreateTag(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {showCreateTag && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">New Tag</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
              />
              <button
                onClick={handleCreateTag}
                disabled={creatingTag || !newTagName.trim()}
                className="px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded-lg transition disabled:opacity-50"
              >
                {creatingTag ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateTag(false)
                  setNewTagName('')
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {tags.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tags yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="text-gray-400 hover:text-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">Blog Manager</h2>

            {/* View Mode Tabs */}
            {viewMode !== 'editor' && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('posts')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === 'posts'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setViewMode('categories')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === 'categories'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Categories
                </button>
                <button
                  onClick={() => setViewMode('tags')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === 'tags'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Tags
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#98b290] mx-auto mb-4" />
              <p className="text-gray-500">Loading blog data...</p>
            </div>
          </div>
        ) : featureError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <FileText className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-medium mb-2">Blog Feature Not Available</p>
              <p className="text-gray-500 mb-4">{featureError}</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>To enable the Blog feature:</p>
                <ol className="list-decimal list-inside text-left space-y-1">
                  <li>Go to <strong>Settings</strong> from the left sidebar</li>
                  <li>Click on <strong>Database</strong></li>
                  <li>Find the <strong>Blog</strong> feature and click <strong>Install</strong></li>
                </ol>
              </div>
            </div>
          </div>
        ) : !databaseId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">No Database Found</p>
              <p className="text-gray-400">Please create a database and install the Blog feature first.</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'posts' && renderPostsList()}
            {viewMode === 'editor' && renderPostEditor()}
            {viewMode === 'categories' && renderCategoriesManager()}
            {viewMode === 'tags' && renderTagsManager()}
          </>
        )}
      </div>
    </div>
  )
}
