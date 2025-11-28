import React, { useState, useEffect } from 'react'
import { databaseService } from '@/services/databaseService'
import type { DatabaseInstance, InstalledFeature } from '@/services/databaseService'

interface DatabaseManagementModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'template' | 'website'
  referenceId: number // template_id or user_id
}

export const DatabaseManagementModal: React.FC<DatabaseManagementModalProps> = ({
  isOpen,
  onClose,
  type,
  referenceId
}) => {
  const [database, setDatabase] = useState<DatabaseInstance | null>(null)
  const [installedFeatures, setInstalledFeatures] = useState<InstalledFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'backup'>('overview')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  // Check if the template/website has been saved (has a valid ID)
  const isUnsaved = !referenceId || referenceId === 0

  useEffect(() => {
    if (isOpen && !isUnsaved) {
      loadDatabase()
    }
  }, [isOpen, referenceId, type])

  const loadDatabase = async () => {
    if (isUnsaved) return

    setLoading(true)
    try {
      const instance = await databaseService.getInstance(type, referenceId)
      setDatabase(instance)

      if (instance) {
        const features = await databaseService.getInstalledFeatures(instance.id)
        setInstalledFeatures(features)
      }
    } catch (error) {
      console.error('Failed to load database:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDatabase = async () => {
    if (!confirm('Are you sure you want to create a database? This action cannot be undone.')) return

    setCreating(true)
    try {
      const newDatabase = type === 'template'
        ? await databaseService.createTemplateDatabase(referenceId)
        : await databaseService.createWebsiteDatabase()

      setDatabase(newDatabase)
      alert('Database created successfully!')
    } catch (error: any) {
      console.error('Failed to create database:', error)
      alert(error.message || 'Failed to create database')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteDatabase = async () => {
    if (!database) return

    // Build list of installed features for warning
    const featuresList = installedFeatures.length > 0
      ? `\n\nInstalled features that will be removed:\n${installedFeatures.map(f => `- ${databaseService.getFeatureDisplayName(f.type)}`).join('\n')}`
      : ''

    const confirmed = confirm(
      `⚠️ DELETE DATABASE - FINAL WARNING ⚠️\n\nYou are about to PERMANENTLY DELETE the entire database: ${database.database_name}\n\nThis will DELETE ALL:\n• All installed features (${installedFeatures.length} total)\n• Contact form submissions\n• Blog posts and comments\n• User data and profiles\n• Events, bookings, and orders\n• ALL other stored data${featuresList}\n\n🔴 THIS ACTION CANNOT BE UNDONE! 🔴\n\nType 'DELETE' in the next prompt to confirm.`
    )

    if (!confirmed) return

    // Second confirmation requiring text input
    const confirmText = prompt('Type DELETE in capital letters to confirm database deletion:')

    if (confirmText !== 'DELETE') {
      alert('Database deletion cancelled. The text did not match.')
      return
    }

    setDeleting(true)
    try {
      await databaseService.deleteDatabase(database.id, false)
      setDatabase(null)
      setInstalledFeatures([])
      alert('Database deleted successfully. All features and data have been removed.')
    } catch (error: any) {
      console.error('Failed to delete database:', error)
      alert(error.message || 'Failed to delete database')
    } finally {
      setDeleting(false)
    }
  }

  const handleBackup = async () => {
    if (!database) return

    setBackingUp(true)
    try {
      const result = await databaseService.backupDatabase(database.id)
      alert(`Database backed up successfully!\nBackup file: ${result.backup_path}`)
      await loadDatabase() // Reload to get updated backup timestamp
    } catch (error: any) {
      console.error('Failed to backup database:', error)
      alert(error.message || 'Failed to backup database')
    } finally {
      setBackingUp(false)
    }
  }

  const handleUpdateSize = async () => {
    if (!database) return

    try {
      const sizeInfo = await databaseService.updateSize(database.id)
      alert(`Database size updated: ${databaseService.formatSize(sizeInfo.size_bytes)}`)
      await loadDatabase()
    } catch (error: any) {
      console.error('Failed to update size:', error)
      alert(error.message || 'Failed to update size')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Database Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              {type === 'template' ? 'Template Database' : 'Website Database'}
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

        {isUnsaved ? (
          /* Template/Website Not Saved Yet */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Required</h3>
              <p className="text-gray-600 mb-6">
                {type === 'template'
                  ? 'Please save your template first before creating a database. The template needs to be saved so the database can be associated with it.'
                  : 'Please save your website first before creating a database.'}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                <p className="text-sm text-amber-800">
                  <strong>How to save:</strong> Click the "Save" button in the top toolbar, or press <kbd className="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">Ctrl+S</kbd>
                </p>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-gray-500">Loading database information...</p>
          </div>
        ) : !database ? (
          /* No Database - Show Create Option */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Database Found</h3>
              <p className="text-gray-600 mb-6">
                {type === 'template'
                  ? 'This template does not have a database yet. Create one to enable script features like Contact Forms, Blogs, and more.'
                  : 'Your website does not have a database yet. Create one to enable dynamic features, or initialize from a template with features already configured.'}
              </p>
              <button
                onClick={handleCreateDatabase}
                disabled={creating}
                className="px-6 py-3 bg-[#98b290] text-white rounded-lg hover:bg-[#7a9072] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {creating ? 'Creating Database...' : 'Create Database'}
              </button>
            </div>
          </div>
        ) : (
          /* Database Exists - Show Tabs */
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex px-6">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'features', label: 'Installed Features' },
                  { id: 'backup', label: 'Backup & Restore' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#98b290] text-[#98b290]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm ${databaseService.getStatusColor(database.status)}`}>
                      {database.status.charAt(0).toUpperCase() + database.status.slice(1)}
                    </span>
                  </div>

                  {/* Database Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Database Name</h3>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                        {database.database_name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Size</h3>
                      <p className="text-sm text-gray-900">
                        {databaseService.formatSize(database.size_bytes)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Created</h3>
                      <p className="text-sm text-gray-900">
                        {new Date(database.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Last Updated</h3>
                      <p className="text-sm text-gray-900">
                        {new Date(database.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateSize}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Update Size
                      </button>
                      <button
                        onClick={handleDeleteDatabase}
                        disabled={deleting || databaseService.isTransitioning(database.status)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting ? 'Deleting...' : 'Delete Database'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {activeTab === 'features' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Installed Features ({installedFeatures.length})
                  </h3>
                  {installedFeatures.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No features installed yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Use Insert &gt; Feature to add script features
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {installedFeatures.map((feature, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {databaseService.getFeatureDisplayName(feature.type)}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                Installed: {new Date(feature.installed_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Backup Tab */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Last Backup</h3>
                    <p className="text-sm text-gray-900">
                      {database.last_backup_at
                        ? new Date(database.last_backup_at).toLocaleString()
                        : 'Never backed up'}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Backup Information</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Backups are stored on the server in the backups directory</li>
                      <li>• Each backup is a complete SQL dump of the database</li>
                      <li>• Backups include all tables and data</li>
                      <li>• Contact your administrator to download backup files</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleBackup}
                    disabled={backingUp || databaseService.isTransitioning(database.status)}
                    className="px-6 py-3 bg-[#98b290] text-white rounded-lg hover:bg-[#7a9072] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {backingUp ? 'Creating Backup...' : 'Create Backup Now'}
                  </button>
                </div>
              )}
            </div>
          </>
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
