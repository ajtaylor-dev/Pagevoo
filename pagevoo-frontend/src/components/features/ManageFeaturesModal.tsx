import React, { useState, useEffect } from 'react'
import { databaseService } from '@/services/databaseService'
import { MdEmail, MdClose, MdSettings } from 'react-icons/md'
import type { IconType } from 'react-icons'

interface ManageFeaturesModalProps {
  onClose: () => void
  websiteId: number | null
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
  websiteId,
  onConfigureFeature
}) => {
  const [installedFeatures, setInstalledFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInstalledFeatures()
  }, [websiteId])

  const loadInstalledFeatures = async () => {
    if (!websiteId) {
      setError('No website ID available')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get database instance for this website
      const database = await databaseService.getInstance('website', websiteId)

      if (!database) {
        setInstalledFeatures([])
        setLoading(false)
        return
      }

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

                return (
                  <div
                    key={featureType}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#98b290] transition"
                  >
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
                      <button
                        onClick={() => handleConfigure(featureType)}
                        className="ml-4 px-4 py-2 bg-[#98b290] hover:bg-[#7a9274] text-white rounded transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <MdSettings className="w-4 h-4" />
                        Configure
                      </button>
                    </div>
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
