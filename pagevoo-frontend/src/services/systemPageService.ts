import axios from 'axios'

const API_BASE = '/v1/system-pages'

// Create axios instance with authentication
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Add auth token interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export interface SystemPageSection {
  id: number
  section_name: string
  section_id: string
  type: string
  content: any
  css: any
  order: number
  is_locked: boolean
  lock_type: string | null
}

export interface SystemPage {
  id: number
  user_id: number
  user_website_id: number | null
  name: string
  slug: string
  page_id: string
  meta_description?: string
  page_css?: string
  is_homepage: boolean
  order: number
  is_system: boolean
  system_type: string
  feature_type: string
  sections: SystemPageSection[]
}

export interface SystemPageUpdateData {
  name?: string
  slug?: string
  meta_description?: string
  page_css?: string
}

export interface SystemSectionUpdateData {
  section_name?: string
  content?: any
  css?: any
  order?: number
}

export interface BulkPageUpdateData {
  id: number
  order?: number
  sections?: {
    id: number
    content?: any
    css?: any
    order?: number
  }[]
}

/**
 * Get all system pages for the current user
 */
export const getSystemPages = async (): Promise<SystemPage[]> => {
  const response = await apiClient.get(API_BASE)
  return response.data.data
}

/**
 * Get system pages for installed features, creating any missing ones
 */
export const getSystemPagesForFeatures = async (): Promise<SystemPage[]> => {
  const response = await apiClient.get(`${API_BASE}/for-features`)
  return response.data.data
}

/**
 * Update a system page (name, slug, meta, css)
 */
export const updateSystemPage = async (
  pageId: number,
  data: SystemPageUpdateData
): Promise<SystemPage> => {
  const response = await apiClient.put(`${API_BASE}/${pageId}`, data)
  return response.data.data
}

/**
 * Update a section within a system page
 */
export const updateSystemPageSection = async (
  pageId: number,
  sectionId: number,
  data: SystemSectionUpdateData
): Promise<SystemPageSection> => {
  const response = await apiClient.put(`${API_BASE}/${pageId}/sections/${sectionId}`, data)
  return response.data.data
}

/**
 * Bulk update system pages (useful for reordering)
 */
export const bulkUpdateSystemPages = async (
  pages: BulkPageUpdateData[]
): Promise<void> => {
  await apiClient.post(`${API_BASE}/bulk-update`, { pages })
}

/**
 * Delete system pages for a feature (called when uninstalling)
 */
export const deleteSystemPagesForFeature = async (
  featureType: string
): Promise<void> => {
  await apiClient.delete(`${API_BASE}/feature/${featureType}`)
}
