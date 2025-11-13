import { ReactNode } from 'react'
import { usePermissions } from '../hooks/usePermissions'

interface LockedFeatureProps {
  /**
   * Feature key(s) to check. User needs access to at least one feature.
   */
  feature: string | string[]

  /**
   * Content to display (will be blurred/overlayed if locked)
   */
  children: ReactNode

  /**
   * Whether to blur the content when locked (default: true)
   */
  blur?: boolean

  /**
   * Custom message to show when locked (optional)
   */
  message?: string

  /**
   * Minimum tier required message (will be auto-detected if not provided)
   */
  requiredTier?: string

  /**
   * Variant style: 'overlay' (full overlay) or 'inline' (inline message)
   */
  variant?: 'overlay' | 'inline'

  /**
   * If true, completely hide content when locked instead of blurring
   */
  hideWhenLocked?: boolean
}

const tierColors = {
  trial: 'bg-gray-100 text-gray-700',
  brochure: 'bg-green-100 text-green-700',
  niche: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
}

const tierOrder = ['trial', 'brochure', 'niche', 'pro']

export function LockedFeature({
  feature,
  children,
  blur = true,
  message,
  requiredTier,
  variant = 'overlay',
  hideWhenLocked = false,
}: LockedFeatureProps) {
  const { can, canAny, tier } = usePermissions()

  // Check if user has access
  const features = Array.isArray(feature) ? feature : [feature]
  const hasAccess = features.length === 1 ? can(features[0]) : canAny(features)

  // If user has access, just render children
  if (hasAccess) {
    return <>{children}</>
  }

  // Determine required tier (find the lowest tier that has this feature)
  const determinedTier = requiredTier || getTierForFeature(features[0])
  const tierName = determinedTier ? determinedTier.charAt(0).toUpperCase() + determinedTier.slice(1) : 'higher'

  // Default message
  const defaultMessage = `This feature is available in the ${tierName} plan and above.`
  const displayMessage = message || defaultMessage

  // If hideWhenLocked, don't render children at all
  if (hideWhenLocked) {
    return (
      <div className="p-6 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gray-200 rounded-full">
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-700 mb-2">{displayMessage}</p>
        <button className="px-4 py-2 text-sm font-medium text-white bg-[#98b290] hover:bg-[#88a280] rounded-md transition">
          Upgrade to {tierName}
        </button>
      </div>
    )
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className="space-y-2">
        <div className={blur ? 'filter blur-sm pointer-events-none' : 'opacity-50 pointer-events-none'}>
          {children}
        </div>
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-yellow-800">{displayMessage}</p>
          </div>
          <button className="px-3 py-1 text-xs font-medium text-white bg-[#98b290] hover:bg-[#88a280] rounded transition">
            Upgrade
          </button>
        </div>
      </div>
    )
  }

  // Overlay variant (default)
  return (
    <div className="relative">
      {/* Content (blurred if locked) */}
      <div className={blur ? 'filter blur-sm pointer-events-none select-none' : 'opacity-30 pointer-events-none select-none'}>
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Lock Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Locked</h3>
          <p className="text-sm text-gray-600 mb-4">{displayMessage}</p>

          {/* Current & Required Tier */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Your Plan</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${tierColors[tier as keyof typeof tierColors] || 'bg-gray-100 text-gray-700'}`}>
                {tier}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Required Plan</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${tierColors[determinedTier as keyof typeof tierColors] || 'bg-gray-100 text-gray-700'}`}>
                {tierName}
              </span>
            </div>
          </div>

          {/* Upgrade Button */}
          <button className="w-full px-4 py-2 text-sm font-medium text-white bg-[#98b290] hover:bg-[#88a280] rounded-md transition">
            Upgrade to {tierName}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Helper function to determine which tier provides access to a feature
 * This would ideally come from the backend, but we can approximate it here
 */
function getTierForFeature(feature: string): string {
  // This is a simplified version - in reality, you'd want to fetch this from the backend
  // or have a more sophisticated lookup

  // Basic tier progression logic
  const basicFeatures = ['wysiwyg_text_editor', 'inline_text_editing', 'image_upload', 'save_website']
  const brochureFeatures = ['publish_website', 'add_new_page', 'navbar_section', 'footer_section']
  const nicheFeatures = ['notes_system', 'page_css_editor', 'custom_css_code_tab', 'export_page']
  const proFeatures = ['collaborator_management', 'groups', 'permissions', 'custom_domain', 'remove_branding']

  if (basicFeatures.includes(feature)) return 'trial'
  if (brochureFeatures.includes(feature)) return 'brochure'
  if (nicheFeatures.includes(feature)) return 'niche'
  if (proFeatures.includes(feature)) return 'pro'

  // Default to brochure for unknown features
  return 'brochure'
}
