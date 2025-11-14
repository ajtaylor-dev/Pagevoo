import React from 'react'
import { api } from '@/services/api'

interface UserWebsite {
  id: number
  name: string | null
  template_id: number | null
  is_published: boolean
  published_at: string | null
  last_published_at: string | null
  subdomain: string | null
  custom_domain: string | null
  pages: any[]
  custom_css?: string
}

interface PublishedWebsiteBannerProps {
  website: UserWebsite
  setWebsite: (website: UserWebsite) => void
  setIsPublished: (published: boolean) => void
}

export const PublishedWebsiteBanner: React.FC<PublishedWebsiteBannerProps> = ({
  website,
  setWebsite,
  setIsPublished
}) => {
  const handleUnpublish = () => {
    if (confirm('Unpublish this website? It will no longer be publicly accessible.')) {
      api.unpublishWebsite().then(response => {
        if (response.success) {
          const updatedWebsite = response.data.website
          setWebsite(updatedWebsite)
          setIsPublished(false)
        }
      }).catch(error => {
        console.error('Failed to unpublish:', error)
        alert('Failed to unpublish website: ' + (error.response?.data?.message || error.message || 'Unknown error'))
      })
    }
  }

  return (
    <div className="bg-gradient-to-r from-[#e8f0e6] to-[#d4e5d0] border-b border-[#d4e5d0] px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-[#5a7a54]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="text-sm font-medium text-[#4a6344]">Published Website</span>
          <p className="text-xs text-[#5a7a54]">
            This website is published and publicly accessible. Changes will update the published version.
            {website.published_at && (
              <span className="ml-1">(Last published: {new Date(website.published_at).toLocaleDateString()})</span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={handleUnpublish}
        className="px-3 py-1 bg-white border border-[#b8ceb4] text-[#5a7a54] rounded text-xs hover:bg-[#e8f0e6] transition"
      >
        Unpublish
      </button>
    </div>
  )
}
