import React, { useState, useEffect } from 'react'
import { databaseService } from '@/services/databaseService'
import { MdEmail, MdClose, MdSettings, MdDelete, MdPhotoLibrary, MdArticle, MdEvent, MdPeople, MdCalendarMonth, MdEdit } from 'react-icons/md'
import type { IconType } from 'react-icons'

interface ManageFeaturesModalProps {
  onClose: () => void
  referenceId: number | null
  referenceType: 'template' | 'website'
  onConfigureFeature: (featureType: string) => void
  onFeatureUninstalled?: (featureType: string) => void
}

interface InstalledFeature {
  type: string
  name: string
  description: string
  icon: IconType
}

const FEATURE_DETAILS: Record<string, InstalledFeature> = {
  contact_form: {
    type: 'contact_form',
    name: 'Contact Form',
    description: 'Contact forms, support ticket systems, and mass mailer functionality',
    icon: MdEmail
  },
  image_gallery: {
    type: 'image_gallery',
    name: 'Image Gallery',
    description: 'Beautiful image galleries with lightbox, multiple layouts, and album organization',
    icon: MdPhotoLibrary
  },
  blog: {
    type: 'blog',
    name: 'Blog',
    description: 'Full-featured blog with posts, categories, tags, and rich text editing',
    icon: MdArticle
  },
  events: {
    type: 'events',
    name: 'Events Calendar',
    description: 'Event management with calendar views, categories, and scheduling',
    icon: MdEvent
  },
  user_access_system: {
    type: 'user_access_system',
    name: 'User Access System',
    description: 'User registration, login, profiles, groups, and role-based permissions',
    icon: MdPeople
  },
  booking: {
    type: 'booking',
    name: 'Booking System',
    description: 'Appointments, reservations, classes, events, and rental bookings with scheduling',
    icon: MdCalendarMonth
  },
  voopress: {
    type: 'voopress',
    name: 'VooPress',
    description: 'WordPress-style blog with themes, widgets, menus, and dashboard',
    icon: MdEdit
  }
}

export const ManageFeaturesModal: React.FC<ManageFeaturesModalProps> = ({
  onClose,
  referenceId,
  referenceType,
  onConfigureFeature,
  onFeatureUninstalled
}) => {
  const [installedFeatures, setInstalledFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uninstalling, setUninstalling] = useState<string | null>(null)
  const [confirmUninstall, setConfirmUninstall] = useState<string | null>(null)
  const [databaseId, setDatabaseId] = useState<number | null>(null)
  const [dependencyError, setDependencyError] = useState<{ feature: string; blocking: string[] } | null>(null)

  useEffect(() => {
    loadInstalledFeatures()
  }, [referenceId, referenceType])

  const loadInstalledFeatures = async () => {
    if (!referenceId) {
      setError('No ID available')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get database instance for this template or website
      const database = await databaseService.getInstance(referenceType, referenceId)

      if (!database) {
        setInstalledFeatures([])
        setDatabaseId(null)
        setLoading(false)
        return
      }

      setDatabaseId(database.id)

      // Get installed features
      const features = await databaseService.getInstalledFeatures(database.id)
      setInstalledFeatures(features.map(f => f.type))
    } catch (err: any) {
      console.error('Error loading installed features:', err)
      setError(err.message || 'Failed to load installed features')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigure = (featureType: string) => {
    onConfigureFeature(featureType)
    onClose()
  }

  const handleUninstall = async (featureType: string) => {
    if (!databaseId) return

    try {
      setUninstalling(featureType)
      setDependencyError(null)
      await databaseService.uninstallFeature(databaseId, featureType)
      // Remove from local state
      setInstalledFeatures(prev => prev.filter(f => f !== featureType))
      setConfirmUninstall(null)
      // Notify parent to remove related sections
      if (onFeatureUninstalled) {
        onFeatureUninstalled(featureType)
      }
    } catch (err: any) {
      console.error('Error uninstalling feature:', err)

      // Check if this is a dependency error
      if (err.error_code === 'FEATURE_DEPENDENCY' || err.blocking_features) {
        setDependencyError({
          feature: featureType,
          blocking: err.blocking_features || []
        })
        setConfirmUninstall(null)
      } else {
        setError(err.message || 'Failed to uninstall feature')
      }
    } finally {
      setUninstalling(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Manage Features</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Dependency Error Alert */}
          {dependencyError && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-800 mb-1">Cannot Uninstall Feature</h4>
                  <p className="text-sm text-amber-700 mb-2">
                    <strong>{FEATURE_DETAILS[dependencyError.feature]?.name || dependencyError.feature}</strong> cannot be uninstalled because other features depend on it.
                  </p>
                  <p className="text-sm text-amber-600">
                    Please uninstall the following features first:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {dependencyError.blocking.map((blockingFeature) => (
                      <li key={blockingFeature} className="flex items-center gap-2 text-sm text-amber-700">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        {FEATURE_DETAILS[blockingFeature]?.name || blockingFeature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setDependencyError(null)}
                    className="mt-3 text-sm text-amber-700 hover:text-amber-800 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#98b290]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadInstalledFeatures}
                className="px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded transition"
              >
                Retry
              </button>
            </div>
          ) : installedFeatures.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No features installed yet</p>
              <p className="text-sm text-gray-500">
                Use Insert → Install Feature to add features to your website
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {installedFeatures.map((featureType) => {
                const feature = FEATURE_DETAILS[featureType]
                if (!feature) return null

                const FeatureIcon = feature.icon

                const isConfirming = confirmUninstall === featureType
                const isUninstalling = uninstalling === featureType

                return (
                  <div
                    key={featureType}
                    className={`border rounded-lg p-4 transition ${
                      isConfirming ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-[#98b290]'
                    }`}
                  >
                    {isConfirming ? (
                      // Confirmation view
                      <div className="text-center py-2">
                        <p className="text-gray-800 font-medium mb-2">
                          Uninstall {feature.name}?
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          This will remove all {feature.name.toLowerCase()} data and cannot be undone.
                        </p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => setConfirmUninstall(null)}
                            disabled={isUninstalling}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUninstall(featureType)}
                            disabled={isUninstalling}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition flex items-center gap-2"
                          >
                            {isUninstalling ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Uninstalling...
                              </>
                            ) : (
                              <>
                                <MdDelete className="w-4 h-4" />
                                Uninstall
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal view
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="text-[#98b290] flex-shrink-0">
                            <FeatureIcon className="w-10 h-10" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">
                              {feature.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {feature.description}
                            </p>
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                ✓ Installed
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <button
                            onClick={() => handleConfigure(featureType)}
                            className="px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded transition flex items-center gap-2 whitespace-nowrap"
                          >
                            <MdSettings className="w-4 h-4" />
                            Configure
                          </button>
                          <button
                            onClick={() => setConfirmUninstall(featureType)}
                            className="px-4 py-2 bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded transition flex items-center gap-2 whitespace-nowrap"
                          >
                            <MdDelete className="w-4 h-4" />
                            Uninstall
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
