import { useState, useEffect } from 'react'

interface PermissionsData {
  permissions: {
    [key: string]: boolean | number | null | string
  }
  usage: {
    tier: string
    limits: {
      max_pages: number | null
      max_sections_per_page: number | null
      max_images: number | null
      max_storage_mb: number | null
    }
    features: {
      can_publish: boolean
      can_use_custom_domain: boolean
      can_remove_branding: boolean
      has_priority_support: boolean
    }
  }
  tier: string
  available_template_tiers: string[]
}

interface UsePermissionsReturn {
  permissions: PermissionsData | null
  isLoading: boolean
  error: string | null
  can: (feature: string) => boolean
  canAll: (features: string[]) => boolean
  canAny: (features: string[]) => boolean
  getLimit: (limit: string) => number | null
  hasExceededLimit: (limit: string, currentCount: number) => boolean
  tier: string
  availableTemplateTiers: string[]
  reload: () => Promise<void>
}

export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPermissions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem('auth_token')

      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('http://localhost:8000/api/v1/me/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load permissions: ${response.status}`)
      }

      const data = await response.json()
      setPermissions(data)
    } catch (err) {
      console.error('Error loading permissions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  /**
   * Check if user has access to a specific feature
   */
  const can = (feature: string): boolean => {
    if (!permissions || !permissions.permissions) return false
    return permissions.permissions[feature] === true
  }

  /**
   * Check if user has access to ALL features (requires ALL)
   */
  const canAll = (features: string[]): boolean => {
    if (!permissions || !permissions.permissions) return false
    return features.every(feature => permissions.permissions[feature] === true)
  }

  /**
   * Check if user has access to ANY of the features (requires ONE)
   */
  const canAny = (features: string[]): boolean => {
    if (!permissions || !permissions.permissions) return false
    return features.some(feature => permissions.permissions[feature] === true)
  }

  /**
   * Get a numeric limit value (e.g., max_pages, max_images)
   * Returns null for unlimited
   */
  const getLimit = (limit: string): number | null => {
    if (!permissions || !permissions.permissions) return 0
    const value = permissions.permissions[limit]
    return typeof value === 'number' ? value : (value === null ? null : 0)
  }

  /**
   * Check if user has reached a numeric limit
   * Returns true if limit exceeded
   */
  const hasExceededLimit = (limit: string, currentCount: number): boolean => {
    const maxLimit = getLimit(limit)

    // If limit is null, it's unlimited
    if (maxLimit === null) {
      return false
    }

    return currentCount >= maxLimit
  }

  return {
    permissions,
    isLoading,
    error,
    can,
    canAll,
    canAny,
    getLimit,
    hasExceededLimit,
    tier: permissions?.tier || 'trial',
    availableTemplateTiers: permissions?.available_template_tiers || [],
    reload: loadPermissions,
  }
}
