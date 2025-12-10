import React, { useState } from 'react'
import { Sparkles, Info, Settings, ExternalLink, ChevronDown, ChevronUp, Type, Link2, Image } from 'lucide-react'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
}

interface VooPressPropertiesProps {
  selectedSection: TemplateSection
  onUpdateContent: (sectionId: number, content: any) => void
  onOpenVooPressDashboard?: () => void
}

export const VooPressProperties: React.FC<VooPressPropertiesProps> = ({
  selectedSection,
  onUpdateContent,
  onOpenVooPressDashboard
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['content'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleUpdate = (field: string, value: any) => {
    onUpdateContent(selectedSection.id, {
      ...selectedSection.content,
      [field]: value
    })
  }

  const handleNestedUpdate = (parent: string, field: string, value: any) => {
    onUpdateContent(selectedSection.id, {
      ...selectedSection.content,
      [parent]: {
        ...(selectedSection.content?.[parent] || {}),
        [field]: value
      }
    })
  }

  const getSectionDisplayName = (type: string): string => {
    const names: Record<string, string> = {
      'voopress-header': 'Header Section',
      'voopress-footer': 'Footer Section',
      'voopress-featured-post': 'Featured Post',
      'voopress-featured-posts': 'Featured Posts Grid',
      'voopress-blog-listing': 'Blog Listing',
      'voopress-page-content': 'Page Content',
      'voopress-contact-page': 'Contact Page',
      'voopress-hero': 'Hero Section',
      'voopress-featured-grid': 'Featured Grid',
      'voopress-category-sections': 'Category Sections',
      'voopress-team-section': 'Team Section'
    }
    return names[type] || 'VooPress Section'
  }

  const isBlogSyncedSection = (type: string): boolean => {
    return ['voopress-blog-listing', 'voopress-featured-post', 'voopress-featured-posts', 'voopress-featured-grid', 'voopress-category-sections'].includes(type)
  }

  // Collapsible section header
  const SectionHeader = ({ title, section, icon: Icon }: { title: string; section: string; icon: React.ElementType }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-gray-200">{title}</span>
      </div>
      {expandedSections.includes(section) ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )

  // Hero Section Editor
  const renderHeroEditor = () => (
    <div className="space-y-3">
      <SectionHeader title="Content" section="content" icon={Type} />
      {expandedSections.includes('content') && (
        <div className="space-y-3 pl-2">
          {/* Tagline */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Tagline</label>
            <input
              type="text"
              value={selectedSection.content?.tagline || 'Welcome to our blog'}
              onChange={(e) => handleUpdate('tagline', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              placeholder="Welcome to our blog"
            />
          </div>

          {/* Main Heading */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Main Heading</label>
            <input
              type="text"
              value={selectedSection.content?.heading || 'Insights & Ideas for'}
              onChange={(e) => handleUpdate('heading', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              placeholder="Insights & Ideas for"
            />
          </div>

          {/* Heading Highlight */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Heading Highlight</label>
            <input
              type="text"
              value={selectedSection.content?.heading_highlight || 'Your Business'}
              onChange={(e) => handleUpdate('heading_highlight', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              placeholder="Your Business"
            />
            <p className="text-xs text-gray-500 mt-1">This text will be highlighted in the primary color</p>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Description</label>
            <textarea
              value={selectedSection.content?.description || 'Stay updated with the latest trends, tips, and strategies to help your business grow.'}
              onChange={(e) => handleUpdate('description', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200 min-h-[60px] resize-y"
              placeholder="Enter hero description..."
            />
          </div>
        </div>
      )}

      <SectionHeader title="Call-to-Action Buttons" section="cta" icon={Link2} />
      {expandedSections.includes('cta') && (
        <div className="space-y-3 pl-2">
          {/* Show CTA Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Show CTA Buttons</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSection.content?.show_cta !== false}
                onChange={(e) => handleUpdate('show_cta', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {selectedSection.content?.show_cta !== false && (
            <>
              {/* Primary Button */}
              <div className="p-2 bg-gray-750 rounded border border-gray-600">
                <p className="text-xs font-medium text-purple-400 mb-2">Primary Button</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Button Text</label>
                    <input
                      type="text"
                      value={selectedSection.content?.primary_button_text || 'Browse Articles'}
                      onChange={(e) => handleUpdate('primary_button_text', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Button Link</label>
                    <input
                      type="text"
                      value={selectedSection.content?.primary_button_link || '#blog'}
                      onChange={(e) => handleUpdate('primary_button_link', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                      placeholder="#blog or /page-slug"
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Button */}
              <div className="p-2 bg-gray-750 rounded border border-gray-600">
                <p className="text-xs font-medium text-purple-400 mb-2">Secondary Button</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Button Text</label>
                    <input
                      type="text"
                      value={selectedSection.content?.secondary_button_text || 'Subscribe'}
                      onChange={(e) => handleUpdate('secondary_button_text', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Button Link</label>
                    <input
                      type="text"
                      value={selectedSection.content?.secondary_button_link || '#subscribe'}
                      onChange={(e) => handleUpdate('secondary_button_link', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                      placeholder="#subscribe or /page-slug"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  // Header Section Editor
  const renderHeaderEditor = () => (
    <div className="space-y-3">
      <SectionHeader title="Site Identity" section="content" icon={Type} />
      {expandedSections.includes('content') && (
        <div className="space-y-3 pl-2">
          {/* Site Name */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Site Name</label>
            <input
              type="text"
              value={selectedSection.content?.site_name || 'My VooPress Site'}
              onChange={(e) => handleUpdate('site_name', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              placeholder="My VooPress Site"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Tagline</label>
            <input
              type="text"
              value={selectedSection.content?.tagline || 'Just another VooPress site'}
              onChange={(e) => handleUpdate('tagline', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              placeholder="Your site tagline"
            />
          </div>

          {/* Show Tagline Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Show Tagline</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSection.content?.show_tagline !== false}
                onChange={(e) => handleUpdate('show_tagline', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Show Search Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Show Search</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSection.content?.show_search === true}
                onChange={(e) => handleUpdate('show_search', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  )

  // Footer Section Editor
  const renderFooterEditor = () => (
    <div className="space-y-3">
      <SectionHeader title="Footer Content" section="content" icon={Type} />
      {expandedSections.includes('content') && (
        <div className="space-y-3 pl-2">
          {/* Copyright Text */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Copyright Text</label>
            <input
              type="text"
              value={selectedSection.content?.copyright_text || '© 2024 My VooPress Site. All rights reserved.'}
              onChange={(e) => handleUpdate('copyright_text', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              placeholder="© 2024 Your Site Name"
            />
          </div>

          {/* Show Social Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Show Social Links</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSection.content?.show_social !== false}
                onChange={(e) => handleUpdate('show_social', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Show Newsletter Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Show Newsletter</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSection.content?.show_newsletter === true}
                onChange={(e) => handleUpdate('show_newsletter', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {selectedSection.content?.show_newsletter && (
            <div className="p-2 bg-gray-750 rounded border border-gray-600">
              <p className="text-xs font-medium text-purple-400 mb-2">Newsletter Settings</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Heading</label>
                  <input
                    type="text"
                    value={selectedSection.content?.newsletter_heading || 'Subscribe to our newsletter'}
                    onChange={(e) => handleUpdate('newsletter_heading', e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Description</label>
                  <input
                    type="text"
                    value={selectedSection.content?.newsletter_description || 'Get the latest updates delivered to your inbox.'}
                    onChange={(e) => handleUpdate('newsletter_description', e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Page Content Editor
  const renderPageContentEditor = () => (
    <div className="space-y-3">
      <SectionHeader title="Page Content" section="content" icon={Type} />
      {expandedSections.includes('content') && (
        <div className="space-y-3 pl-2">
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Content (HTML)</label>
            <textarea
              value={selectedSection.content?.page_content || '<h1>Page Title</h1>\n<p>Your content here...</p>'}
              onChange={(e) => handleUpdate('page_content', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200 min-h-[200px] font-mono resize-y"
              placeholder="Enter HTML content..."
            />
            <p className="text-xs text-gray-500 mt-1">You can use HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, etc.</p>
          </div>
        </div>
      )}
    </div>
  )

  // Contact Page Editor
  const renderContactPageEditor = () => (
    <div className="space-y-3">
      <SectionHeader title="Contact Content" section="content" icon={Type} />
      {expandedSections.includes('content') && (
        <div className="space-y-3 pl-2">
          {/* Heading */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Page Heading</label>
            <input
              type="text"
              value={selectedSection.content?.heading || 'Get in Touch'}
              onChange={(e) => handleUpdate('heading', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              placeholder="Get in Touch"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Description</label>
            <textarea
              value={selectedSection.content?.description || "We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
              onChange={(e) => handleUpdate('description', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200 min-h-[60px] resize-y"
              placeholder="Contact page description..."
            />
          </div>

          {/* Show Map Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Show Map</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSection.content?.show_map !== false}
                onChange={(e) => handleUpdate('show_map', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Contact Info */}
          <div className="p-2 bg-gray-750 rounded border border-gray-600">
            <p className="text-xs font-medium text-purple-400 mb-2">Contact Information</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={selectedSection.content?.contact_email || 'hello@example.com'}
                  onChange={(e) => handleUpdate('contact_email', e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                  placeholder="hello@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Phone</label>
                <input
                  type="text"
                  value={selectedSection.content?.contact_phone || '+1 (555) 123-4567'}
                  onChange={(e) => handleUpdate('contact_phone', e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Address</label>
                <textarea
                  value={selectedSection.content?.contact_address || '123 Business Street\nCity, State 12345'}
                  onChange={(e) => handleUpdate('contact_address', e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200 min-h-[50px] resize-y"
                  placeholder="Your address..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Featured Posts Settings Editor
  const renderFeaturedPostsEditor = () => (
    <div className="space-y-3">
      <SectionHeader title="Display Settings" section="content" icon={Settings} />
      {expandedSections.includes('content') && (
        <div className="space-y-3 pl-2">
          {/* Post Count */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Number of Posts</label>
            <select
              value={selectedSection.content?.count || 3}
              onChange={(e) => handleUpdate('count', parseInt(e.target.value))}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
            >
              <option value={2}>2 Posts</option>
              <option value={3}>3 Posts</option>
              <option value={4}>4 Posts</option>
              <option value={6}>6 Posts</option>
            </select>
          </div>

          {/* Layout */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Layout Style</label>
            <select
              value={selectedSection.content?.layout || 'cards'}
              onChange={(e) => handleUpdate('layout', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
            >
              <option value="cards">Card Grid</option>
              <option value="list">List View</option>
              <option value="masonry">Masonry Grid</option>
            </select>
          </div>

          {/* Section Title */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Section Title</label>
            <input
              type="text"
              value={selectedSection.content?.section_title || 'Featured Posts'}
              onChange={(e) => handleUpdate('section_title', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              placeholder="Featured Posts"
            />
          </div>
        </div>
      )}

      <div className="bg-green-900/30 rounded-lg p-3 border border-green-700">
        <div className="flex items-start gap-2">
          <Settings className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-300">
            Posts are automatically pulled from your blog. Manage posts in the VooPress Dashboard.
          </p>
        </div>
      </div>
    </div>
  )

  // Blog Listing Settings Editor
  const renderBlogListingEditor = () => (
    <div className="space-y-3">
      <SectionHeader title="Display Settings" section="content" icon={Settings} />
      {expandedSections.includes('content') && (
        <div className="space-y-3 pl-2">
          {/* Posts Per Page */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Posts Per Page</label>
            <select
              value={selectedSection.content?.posts_per_page || 6}
              onChange={(e) => handleUpdate('posts_per_page', parseInt(e.target.value))}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
            >
              <option value={4}>4 Posts</option>
              <option value={6}>6 Posts</option>
              <option value={9}>9 Posts</option>
              <option value={12}>12 Posts</option>
            </select>
          </div>

          {/* Show Sidebar Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Show Sidebar</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSection.content?.show_sidebar !== false}
                onChange={(e) => handleUpdate('show_sidebar', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Layout */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Layout Style</label>
            <select
              value={selectedSection.content?.layout || 'grid'}
              onChange={(e) => handleUpdate('layout', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="cards">Cards</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-green-900/30 rounded-lg p-3 border border-green-700">
        <div className="flex items-start gap-2">
          <Settings className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-300">
            Posts are automatically pulled from your blog. Manage posts in the VooPress Dashboard.
          </p>
        </div>
      </div>
    </div>
  )

  // Get the appropriate editor based on section type
  const renderSectionEditor = () => {
    switch (selectedSection.type) {
      case 'voopress-hero':
        return renderHeroEditor()
      case 'voopress-header':
        return renderHeaderEditor()
      case 'voopress-footer':
        return renderFooterEditor()
      case 'voopress-page-content':
        return renderPageContentEditor()
      case 'voopress-contact-page':
        return renderContactPageEditor()
      case 'voopress-featured-posts':
        return renderFeaturedPostsEditor()
      case 'voopress-blog-listing':
        return renderBlogListingEditor()
      case 'voopress-featured-post':
        return renderFeaturedPostsEditor()
      default:
        return null
    }
  }

  const hasEditor = ['voopress-hero', 'voopress-header', 'voopress-footer', 'voopress-page-content', 'voopress-contact-page', 'voopress-featured-posts', 'voopress-blog-listing', 'voopress-featured-post'].includes(selectedSection.type)

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-600">
        <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-200">
            {getSectionDisplayName(selectedSection.type)}
          </h3>
          <p className="text-xs text-gray-500">VooPress Section</p>
        </div>
      </div>

      {/* Section-specific editor */}
      {renderSectionEditor()}

      {/* Info for sections without specific editors */}
      {!hasEditor && (
        <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-700">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-300">
              This section's content is managed through the VooPress Dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Blog sync info for relevant sections */}
      {isBlogSyncedSection(selectedSection.type) && !['voopress-featured-posts', 'voopress-blog-listing', 'voopress-featured-post'].includes(selectedSection.type) && (
        <div className="bg-green-900/30 rounded-lg p-3 border border-green-700">
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-300">
              Content is automatically synced with your Blog posts.
            </p>
          </div>
        </div>
      )}

      {/* VooPress Dashboard Link */}
      {onOpenVooPressDashboard && (
        <button
          onClick={onOpenVooPressDashboard}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Sparkles className="w-4 h-4" />
          Open VooPress Dashboard
          <ExternalLink className="w-3 h-3 ml-1" />
        </button>
      )}
    </div>
  )
}

export default VooPressProperties
