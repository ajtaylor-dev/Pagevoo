import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token')
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// ========== TYPES ==========

export interface SectionLibraryItem {
  id: number
  name: string
  description?: string
  preview_image?: string
  section_type: string
  tags?: string[]
  is_pagevoo_official: boolean
  created_at: string
  updated_at: string
}

export interface SectionLibraryItemDetail extends SectionLibraryItem {
  section_data: any
}

export interface PageLibraryItem {
  id: number
  name: string
  description?: string
  preview_image?: string
  meta_description?: string
  tags?: string[]
  section_count: number
  is_pagevoo_official: boolean
  created_at: string
  updated_at: string
}

export interface PageLibraryItemDetail extends PageLibraryItem {
  page_data: any
  site_css?: string
  meta_keywords?: string
}

export interface ExportSectionData {
  name: string
  description?: string
  section_type: string
  section_data: any
  tags?: string[]
  preview_image?: string // Base64 encoded
  is_pagevoo_official?: boolean
}

export interface ExportPageData {
  name: string
  description?: string
  meta_description?: string
  meta_keywords?: string
  page_data: any
  site_css?: string
  tags?: string[]
  preview_image?: string // Base64 encoded
  is_pagevoo_official?: boolean
}

// ========== SECTION LIBRARY API ==========

export const sectionLibraryApi = {
  /**
   * Get all section library entries for the authenticated user
   */
  async getAll(filters?: { type?: string; tags?: string[]; search?: string }): Promise<SectionLibraryItem[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.type) params.append('type', filters.type)
      if (filters?.tags) params.append('tags', filters.tags.join(','))
      if (filters?.search) params.append('search', filters.search)

      const response = await axios.get(`${API_BASE_URL}/v1/section-library?${params}`, {
        headers: getAuthHeaders()
      })

      return response.data.sections || []
    } catch (error) {
      console.error('Error fetching section library:', error)
      throw error
    }
  },

  /**
   * Get a single section with full data
   */
  async getById(id: number): Promise<SectionLibraryItemDetail> {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/section-library/${id}`, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (error) {
      console.error('Error fetching section:', error)
      throw error
    }
  },

  /**
   * Export a section to the library
   */
  async export(data: ExportSectionData): Promise<{ id: number; name: string; preview_url?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/section-library`, data, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (error) {
      console.error('libraryApi.export: Error occurred')

      if (axios.isAxiosError(error)) {
        console.error('libraryApi.export: Axios error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          requestUrl: error.config?.url,
          requestMethod: error.config?.method
        })
      } else {
        console.error('libraryApi.export: Non-axios error:', error)
      }

      throw error
    }
  },

  /**
   * Update a section in the library
   */
  async update(id: number, data: Partial<ExportSectionData>): Promise<{ id: number; name: string }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/v1/section-library/${id}`, data, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (error) {
      console.error('Error updating section:', error)
      throw error
    }
  },

  /**
   * Delete a section from the library
   */
  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/v1/section-library/${id}`, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (error) {
      console.error('Error deleting section:', error)
      throw error
    }
  }
}

// ========== PAGE LIBRARY API ==========

export const pageLibraryApi = {
  /**
   * Get all page library entries for the authenticated user
   */
  async getAll(filters?: { tags?: string[]; search?: string; source?: 'both' | 'my' | 'pagevoo' }): Promise<PageLibraryItem[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.tags) params.append('tags', filters.tags.join(','))
      if (filters?.search) params.append('search', filters.search)
      if (filters?.source) params.append('source', filters.source)

      const response = await axios.get(`${API_BASE_URL}/v1/page-library?${params}`, {
        headers: getAuthHeaders()
      })

      return response.data.pages || []
    } catch (error) {
      console.error('Error fetching page library:', error)
      throw error
    }
  },

  /**
   * Get a single page with full data
   */
  async getById(id: number): Promise<PageLibraryItemDetail> {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/page-library/${id}`, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (error) {
      console.error('Error fetching page:', error)
      throw error
    }
  },

  /**
   * Export a page to the library
   */
  async export(data: ExportPageData): Promise<{ id: number; name: string; preview_url?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/page-library`, data, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (error) {
      console.error('Error exporting page:', error)
      throw error
    }
  },

  /**
   * Update a page in the library
   */
  async update(id: number, data: Partial<ExportPageData>): Promise<{ id: number; name: string }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/v1/page-library/${id}`, data, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (error) {
      console.error('Error updating page:', error)
      throw error
    }
  },

  /**
   * Delete a page from the library
   */
  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/v1/page-library/${id}`, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (error) {
      console.error('Error deleting page:', error)
      throw error
    }
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Convert a File or Blob to base64 string
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

/**
 * Capture a screenshot of a DOM element and convert to base64
 * Requires html2canvas library
 */
export const captureElementScreenshot = async (elementId: string): Promise<string | null> => {
  try {
    // Check if html2canvas is available
    if (typeof window !== 'undefined' && (window as any).html2canvas) {
      const element = document.getElementById(elementId)
      if (!element) {
        console.warn(`Element with id "${elementId}" not found`)
        return null
      }

      const canvas = await (window as any).html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      })

      return canvas.toDataURL('image/png')
    } else {
      console.warn('html2canvas library not loaded')
      return null
    }
  } catch (error) {
    console.error('Error capturing screenshot:', error)
    return null
  }
}
