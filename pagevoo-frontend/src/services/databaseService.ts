import axios from 'axios'

const API_BASE = '/api/v1/database'

export interface DatabaseInstance {
  id: number
  type: 'template' | 'website'
  reference_id: number
  database_name: string
  status: 'active' | 'inactive' | 'creating' | 'copying' | 'deleting' | 'error'
  size_bytes: number
  last_backup_at: string | null
  metadata: {
    installed_features?: Array<{
      type: string
      config: Record<string, any>
      installed_at: string
    }>
  }
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface InstalledFeature {
  type: string
  config: Record<string, any>
  installed_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

class DatabaseService {
  /**
   * Get database instance for a template or website
   */
  async getInstance(type: 'template' | 'website', referenceId: number): Promise<DatabaseInstance | null> {
    try {
      const response = await axios.get<ApiResponse<DatabaseInstance>>(
        `${API_BASE}/instance`,
        {
          params: { type, reference_id: referenceId }
        }
      )
      return response.data.data || null
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Create a database for a template
   */
  async createTemplateDatabase(templateId: number): Promise<DatabaseInstance> {
    const response = await axios.post<ApiResponse<DatabaseInstance>>(
      `${API_BASE}/template/create`,
      { template_id: templateId }
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create template database')
    }

    return response.data.data
  }

  /**
   * Create a database for user's website
   */
  async createWebsiteDatabase(): Promise<DatabaseInstance> {
    const response = await axios.post<ApiResponse<DatabaseInstance>>(
      `${API_BASE}/website/create`
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create website database')
    }

    return response.data.data
  }

  /**
   * Copy template database to user's website (happens automatically on template init)
   */
  async copyTemplateDatabase(templateId: number): Promise<DatabaseInstance> {
    const response = await axios.post<ApiResponse<DatabaseInstance>>(
      `${API_BASE}/copy-template`,
      { template_id: templateId }
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to copy template database')
    }

    return response.data.data
  }

  /**
   * Delete a database instance
   */
  async deleteDatabase(instanceId: number, hardDelete: boolean = false): Promise<void> {
    const response = await axios.delete<ApiResponse>(
      `${API_BASE}/${instanceId}`,
      { data: { hard_delete: hardDelete } }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete database')
    }
  }

  /**
   * Backup a database
   */
  async backupDatabase(instanceId: number): Promise<{ backup_path: string; backup_time: string }> {
    const response = await axios.post<ApiResponse<{ backup_path: string; backup_time: string }>>(
      `${API_BASE}/${instanceId}/backup`
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to backup database')
    }

    return response.data.data
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(instanceId: number, backupPath: string): Promise<void> {
    const response = await axios.post<ApiResponse>(
      `${API_BASE}/${instanceId}/restore`,
      { backup_path: backupPath }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to restore database')
    }
  }

  /**
   * Get installed features for a database
   */
  async getInstalledFeatures(instanceId: number): Promise<InstalledFeature[]> {
    const response = await axios.get<ApiResponse<InstalledFeature[]>>(
      `${API_BASE}/${instanceId}/features`
    )

    return response.data.data || []
  }

  /**
   * Install a feature on a database
   */
  async installFeature(
    instanceId: number,
    featureType: string,
    config: Record<string, any> = {}
  ): Promise<DatabaseInstance> {
    const response = await axios.post<ApiResponse<DatabaseInstance>>(
      `${API_BASE}/${instanceId}/features/install`,
      {
        feature_type: featureType,
        config
      }
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to install feature')
    }

    return response.data.data
  }

  /**
   * Uninstall a feature from a database
   */
  async uninstallFeature(instanceId: number, featureType: string): Promise<DatabaseInstance> {
    const response = await axios.post<ApiResponse<DatabaseInstance>>(
      `${API_BASE}/${instanceId}/features/uninstall`,
      { feature_type: featureType }
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to uninstall feature')
    }

    return response.data.data
  }

  /**
   * Update database size statistics
   */
  async updateSize(instanceId: number): Promise<{ size_bytes: number; size_mb: number }> {
    const response = await axios.post<ApiResponse<{ size_bytes: number; size_mb: number }>>(
      `${API_BASE}/${instanceId}/update-size`
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update database size')
    }

    return response.data.data
  }

  /**
   * Helper: Format database size for display
   */
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Helper: Get status badge color
   */
  getStatusColor(status: DatabaseInstance['status']): string {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      creating: 'bg-blue-100 text-blue-800',
      copying: 'bg-yellow-100 text-yellow-800',
      deleting: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  /**
   * Helper: Check if database is in transitional state
   */
  isTransitioning(status: DatabaseInstance['status']): boolean {
    return ['creating', 'copying', 'deleting'].includes(status)
  }

  /**
   * Helper: Get feature display name
   */
  getFeatureDisplayName(featureType: string): string {
    const names: Record<string, string> = {
      contact_form: 'Contact Form',
      image_gallery: 'Image Gallery',
      user_access_system: 'User Access System',
      blog: 'Blog',
      events: 'Events',
      booking: 'Booking System',
      voopress: 'VooPress (WordPress-style)',
      shop: 'E-Commerce Shop',
      file_hoster: 'File Hosting',
      video_sharing: 'Video Sharing',
      social_platform: 'Social Platform',
    }
    return names[featureType] || featureType
  }
}

export const databaseService = new DatabaseService()
