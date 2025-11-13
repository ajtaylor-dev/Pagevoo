import { useState, useEffect } from 'react'

interface Permission {
  [key: string]: boolean | number | null | string
}

interface TierPermissions {
  trial: Permission
  brochure: Permission
  niche: Permission
  pro: Permission
}

export function PermissionManager() {
  const [permissions, setPermissions] = useState<TierPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Content Editing']))

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')

      const response = await fetch('http://localhost:8000/api/v1/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      const data = await response.json()
      if (data.success && data.data) {
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePermissions = async () => {
    if (!permissions) return

    try {
      setIsSaving(true)
      const token = localStorage.getItem('auth_token')

      // Save each tier
      for (const tier of ['trial', 'brochure', 'niche', 'pro'] as const) {
        await fetch('http://localhost:8000/api/v1/permissions', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tier,
            permissions: permissions[tier],
          }),
        })
      }

      alert('Permissions saved successfully!')
    } catch (error) {
      console.error('Error saving permissions:', error)
      alert('Failed to save permissions')
    } finally {
      setIsSaving(false)
    }
  }

  const updatePermission = (tier: 'trial' | 'brochure' | 'niche' | 'pro', feature: string, value: boolean | number | null) => {
    if (!permissions) return

    setPermissions({
      ...permissions,
      [tier]: {
        ...permissions[tier],
        [feature]: value,
      },
    })
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const categories = {
    'Content Editing': [
      'wysiwyg_text_editor', 'inline_text_editing', 'image_upload', 'image_management',
      'image_search_filter', 'image_resize', 'image_alignment', 'image_alt_text',
      'image_links', 'copy_paste_images', 'headings', 'lists', 'hyperlinks', 'clear_formatting'
    ],
    'Section Management': [
      'add_sections', 'delete_sections', 'reorder_sections', 'duplicate_sections',
      'lock_unlock_sections', 'section_name_id'
    ],
    'Grid Sections': [
      'add_columns', 'delete_columns', 'column_styling', 'remove_all_borders',
      'grid_1_column', 'grid_2_column', 'grid_3_column', 'grid_4_column', 'grid_2x2', 'grid_3x2'
    ],
    'Navigation': [
      'navbar_section', 'navigation_links', 'dropdown_menus', 'navigation_tree_manager',
      'link_to_pages', 'external_urls', 'mobile_menu', 'navbar_background',
      'navbar_padding_margin', 'navbar_width_height', 'logo_position', 'links_position',
      'link_colors', 'dropdown_trigger', 'hover_delay'
    ],
    'Footer': [
      'footer_section', 'footer_simple', 'footer_columns', 'footer_background',
      'footer_padding', 'footer_text_align', 'copyright_section'
    ],
    'Page Management': [
      'add_new_page', 'delete_page', 'rename_page', 'reorder_pages',
      'set_homepage', 'sitemap_view', 'page_css'
    ],
    'Styling - Site Level': [
      'site_css_editor', 'font_family', 'text_color', 'font_size',
      'body_padding', 'body_margin', 'background_color', 'header_settings',
      'paragraph_styling', 'hyperlink_styling'
    ],
    'Styling - Page Level': [
      'page_css_editor', 'page_background_color', 'page_body_padding', 'page_body_margin'
    ],
    'Styling - Section/Row/Column': [
      'section_css_editor', 'section_background_color', 'section_background_image',
      'section_background_properties', 'section_padding', 'section_margin',
      'section_width', 'section_height', 'section_min_width', 'section_min_height',
      'section_border_width', 'section_border_style', 'section_border_color',
      'section_border_radius', 'section_display_property', 'section_overflow',
      'section_float', 'section_text_decoration', 'section_opacity', 'section_box_shadow',
      'row_css_editor', 'column_css_editor'
    ],
    'Advanced Features': [
      'code_view_toggle', 'custom_css_code_tab', 'undo', 'redo',
      'keyboard_shortcuts', 'save_website', 'live_preview', 'publish_website',
      'unpublish_website', 'export_section', 'import_section', 'export_page',
      'import_page', 'section_library_access', 'page_library_access',
      'css_inheritance_display', 'viewport_switcher', 'zoom_controls',
      'show_hide_ui', 'responsive_design'
    ],
    'Collaboration': [
      'collaborator_management', 'groups', 'permissions', 'share_sections', 'share_pages'
    ],
    'Journal': [
      'notes_system', 'share_notes'
    ],
    'Limits': [
      'max_pages', 'max_sections_per_page', 'max_images', 'max_storage_mb',
      'custom_domain', 'remove_branding'
    ],
    'Support': [
      'documentation_access', 'video_tutorials', 'email_support', 'priority_support'
    ],
    'Template Access': [
      'access_trial_templates', 'access_brochure_templates', 'access_niche_templates',
      'access_pro_templates', 'trial_feature_indicator'
    ],
    'Script Features': [
      'script_contact_form', 'script_image_gallery', 'script_blog_news',
      'script_wordpress_style', 'script_event_planner', 'script_booking_system',
      'script_simple_shop', 'script_video_hosting', 'script_file_sharing',
      'script_social_engine', 'script_courses_teaching'
    ],
  }

  const formatFeatureName = (key: string): string => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const renderEditableValue = (tier: 'trial' | 'brochure' | 'niche' | 'pro', feature: string, value: any) => {
    const isNumeric = typeof value === 'number' || feature.startsWith('max_')

    if (isNumeric) {
      return (
        <input
          type="number"
          value={value === null ? '' : value}
          onChange={(e) => {
            const newValue = e.target.value === '' ? null : parseInt(e.target.value)
            updatePermission(tier, feature, newValue)
          }}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
          placeholder="∞"
        />
      )
    }

    return (
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => updatePermission(tier, feature, e.target.checked)}
        className="w-4 h-4 text-[#98b290] border-gray-300 rounded focus:ring-[#98b290] cursor-pointer"
      />
    )
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-[#4b4b4b] mb-6">Package Settings & Permissions</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#98b290] mb-4"></div>
            <p className="text-gray-600">Loading permissions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#4b4b4b]">Package Settings & Permissions</h2>
        <button
          onClick={savePermissions}
          disabled={isSaving}
          className="px-6 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Toggle checkboxes for boolean features, enter numbers for limits (leave empty for unlimited ∞). Changes are saved to the database.
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {Object.entries(categories).map(([category, features]) => (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between"
            >
              <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedCategories.has(category) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Category Content */}
            {expandedCategories.has(category) && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50">
                        Feature
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 min-w-[120px]">
                        <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                          Trial
                        </span>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 min-w-[120px]">
                        <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700">
                          Brochure
                        </span>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 min-w-[120px]">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                          Niche
                        </span>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 min-w-[120px]">
                        <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                          Pro
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <tr
                        key={feature}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="py-3 px-6 text-sm text-gray-900 sticky left-0 bg-inherit">
                          {formatFeatureName(feature)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderEditableValue('trial', feature, permissions?.trial?.[feature])}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderEditableValue('brochure', feature, permissions?.brochure?.[feature])}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderEditableValue('niche', feature, permissions?.niche?.[feature])}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderEditableValue('pro', feature, permissions?.pro?.[feature])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Permissions are stored in the <code className="bg-gray-200 px-2 py-1 rounded text-xs">tier_permissions</code> database table. The Website Builder and all features will read from this database in real-time.
        </p>
      </div>
    </div>
  )
}
