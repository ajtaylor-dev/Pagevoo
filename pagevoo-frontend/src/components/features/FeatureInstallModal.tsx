import React, { useState, useEffect } from 'react'
import { databaseService, DatabaseInstance } from '../../services/databaseService'

interface FeatureInstallModalProps {
  isOpen: boolean
  onClose: () => void
  onFeatureInstalled: (featureType: string) => void
  type: 'template' | 'website'
  referenceId: number
}

interface Feature {
  type: string
  name: string
  description: string
  icon: string
  requiresUAS: boolean // Requires User Access System
  tier: 'trial' | 'brochure' | 'niche' | 'pro'
  available: boolean
}

const AVAILABLE_FEATURES: Feature[] = [
  {
    type: 'contact_form',
    name: 'Contact Form',
    description: 'Add contact forms, support ticket systems, and mass mailer functionality',
    icon: '📧',
    requiresUAS: false,
    tier: 'trial',
    available: true
  },
  {
    type: 'image_gallery',
    name: 'Image Gallery',
    description: 'Create beautiful image galleries with lightbox, slideshows, and albums',
    icon: '🖼️',
    requiresUAS: false,
    tier: 'trial',
    available: false // Coming soon
  },
  {
    type: 'user_access_system',
    name: 'User Access System',
    description: 'User registration, login, profiles, and role-based permissions',
    icon: '👥',
    requiresUAS: false,
    tier: 'niche',
    available: false
  },
  {
    type: 'blog',
    name: 'Blog',
    description: 'Full-featured blog with posts, categories, tags, and comments',
    icon: '📝',
    requiresUAS: false,
    tier: 'brochure',
    available: false
  },
  {
    type: 'events',
    name: 'Events Calendar',
    description: 'Event management with calendar views, RSVPs, and reminders',
    icon: '📅',
    requiresUAS: false,
    tier: 'niche',
    available: false
  },
  {
    type: 'booking',
    name: 'Booking System',
    description: 'Appointment booking, scheduling, and availability management',
    icon: '🗓️',
    requiresUAS: true,
    tier: 'niche',
    available: false
  },
  {
    type: 'voopress',
    name: 'VooPress',
    description: 'WordPress-style content management with themes and plugins',
    icon: '✍️',
    requiresUAS: true,
    tier: 'pro',
    available: false
  },
  {
    type: 'shop',
    name: 'E-Commerce Shop',
    description: 'Full e-commerce solution with products, cart, checkout, and payments',
    icon: '🛒',
    requiresUAS: true,
    tier: 'pro',
    available: false
  },
  {
    type: 'file_hoster',
    name: 'File Hosting',
    description: 'Upload, share, and manage files with download tracking',
    icon: '📁',
    requiresUAS: true,
    tier: 'niche',
    available: false
  },
  {
    type: 'video_sharing',
    name: 'Video Sharing',
    description: 'YouTube-style video hosting with uploads, playlists, and comments',
    icon: '🎥',
    requiresUAS: true,
    tier: 'pro',
    available: false
  },
  {
    type: 'social_platform',
    name: 'Social Platform',
    description: 'Facebook/Instagram-style social network with posts, likes, and follows',
    icon: '🌐',
    requiresUAS: true,
    tier: 'pro',
    available: false
  }
]

export const FeatureInstallModal: React.FC<FeatureInstallModalProps> = ({
  isOpen,
  onClose,
  onFeatureInstalled,
  type,
  referenceId
}) => {
  const [database, setDatabase] = useState<DatabaseInstance | null>(null)
  const [installedFeatures, setInstalledFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState<string | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadDatabaseInfo()
    }
  }, [isOpen, referenceId, type])

  const loadDatabaseInfo = async () => {
    setLoading(true)
    try {
      const instance = await databaseService.getInstance(type, referenceId)
      setDatabase(instance)

      if (instance) {
        const features = await databaseService.getInstalledFeatures(instance.id)
        setInstalledFeatures(features.map(f => f.type))
      }
    } catch (error) {
      console.error('Failed to load database info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInstallFeature = async (feature: Feature) => {
    if (!database) {
      alert('Please create a database first (Edit > Manage Database)')
      return
    }

    if (!feature.available) {
      alert('This feature is coming soon!')
      return
    }

    if (installedFeatures.includes(feature.type)) {
      alert('This feature is already installed')
      return
    }

    if (feature.requiresUAS && !installedFeatures.includes('user_access_system')) {
      alert(`${feature.name} requires User Access System to be installed first`)
      return
    }

    const confirmed = confirm(
      `Install ${feature.name}?\n\nThis will add the necessary database tables and configuration for this feature.`
    )

    if (!confirmed) return

    setInstalling(feature.type)
    try {
      await databaseService.installFeature(database.id, feature.type, {})
      setInstalledFeatures([...installedFeatures, feature.type])
      alert(`${feature.name} installed successfully!`)
      onFeatureInstalled(feature.type)
    } catch (error: any) {
      console.error('Failed to install feature:', error)
      alert(error.message || 'Failed to install feature')
    } finally {
      setInstalling(null)
    }
  }

  const getTierBadgeColor = (tier: string): string => {
    const colors = {
      trial: 'bg-gray-100 text-gray-800',
      brochure: 'bg-blue-100 text-blue-800',
      niche: 'bg-purple-100 text-purple-800',
      pro: 'bg-amber-100 text-amber-800'
    }
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Install Script Feature</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add dynamic features to your {type === 'template' ? 'template' : 'website'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Loading features...</p>
          </div>
        ) : !database ? (
          /* No Database Warning */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Required</h3>
              <p className="text-gray-600 mb-6">
                Script features require a database to store data. Please create a database first.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#98b290] text-white rounded-lg hover:bg-[#7a9072] font-medium"
              >
                Go to Database Management
              </button>
            </div>
          </div>
        ) : (
          /* Feature Grid */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_FEATURES.map(feature => {
                const isInstalled = installedFeatures.includes(feature.type)
                const isInstalling = installing === feature.type

                return (
                  <div
                    key={feature.type}
                    className={`border rounded-lg p-4 transition-all ${
                      isInstalled
                        ? 'border-green-300 bg-green-50'
                        : feature.available
                        ? 'border-gray-200 hover:border-[#98b290] hover:shadow-md cursor-pointer'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                    onClick={() => !isInstalled && feature.available && handleInstallFeature(feature)}
                  >
                    {/* Icon and Title */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{feature.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBadgeColor(feature.tier)}`}>
                              {feature.tier.charAt(0).toUpperCase() + feature.tier.slice(1)}
                            </span>
                            {feature.requiresUAS && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                Requires UAS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isInstalled && (
                        <span className="text-green-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>

                    {/* Status/Action */}
                    {isInstalled ? (
                      <div className="text-sm font-medium text-green-700">
                        ✓ Installed
                      </div>
                    ) : !feature.available ? (
                      <div className="text-sm font-medium text-gray-500">
                        Coming Soon
                      </div>
                    ) : isInstalling ? (
                      <div className="text-sm font-medium text-[#98b290]">
                        Installing...
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-[#98b290]">
                        Click to Install
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Info Section */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">About Script Features</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Script features add dynamic functionality to your {type === 'template' ? 'template' : 'website'}</li>
                <li>• Each feature has its own database tables and configuration</li>
                <li>• Features marked "Requires UAS" need User Access System installed first</li>
                <li>• Installed features: {installedFeatures.length} / {AVAILABLE_FEATURES.filter(f => f.available).length}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
