import React, { useState, useEffect } from 'react'
import { databaseService } from '@/services/databaseService'
import { MdEmail, MdClose, MdSettings, MdDelete } from 'react-icons/md'
import type { IconType } from 'react-icons'

interface ManageFeaturesModalProps {
  onClose: () => void
  referenceId: number | null
  referenceType: 'template' | 'website'
  onConfigureFeature: (featureType: string) => void
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
  }
  // Add more features as they're implemented
}

export const ManageFeaturesModal: React.FC<ManageFeaturesModalProps> = ({
  onClose,
  referenceId,
  referenceType,
  onConfigureFeature
}) => {
  const [installedFeatures, setInstalledFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uninstalling, setUninstalling] = useState<string | null>(null)
  const [confirmUninstall, setConfirmUninstall] = useState<string | null>(null)
  const [databaseId, setDatabaseId] = useState<number | null>(null)

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
      await databaseService.uninstallFeature(databaseId, featureType)
      // Remove from local state
      setInstalledFeatures(prev => prev.filter(f => f !== featureType))
      setConfirmUninstall(null)
    } catch (err: any) {
      console.error('Error uninstalling feature:', err)
      setError(err.message || 'Failed to uninstall feature')
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
