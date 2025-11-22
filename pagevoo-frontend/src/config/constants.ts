/**
 * Application Configuration Constants
 * Centralizes environment variables and app-wide constants
 */

// API URLs
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Helper function to get full asset URL
export const getAssetUrl = (path: string): string => {
  if (!path) return ''
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${API_BASE_URL}/${cleanPath}`
}
