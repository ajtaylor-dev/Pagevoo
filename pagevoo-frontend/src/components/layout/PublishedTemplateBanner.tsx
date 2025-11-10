import React from 'react'
import { api } from '@/services/api'

interface Template {
  id: number
  name: string
  description: string
  business_type: string
  is_active: boolean
  pages: any[]
  preview_image: string | null
  exclusive_to: 'pro' | 'niche' | null
  technologies: string[]
  features: string[]
  custom_css?: string
}

interface PublishedTemplateBannerProps {
  template: Template
  setTemplate: (template: Template) => void
  setIsPublished: (published: boolean) => void
}

export const PublishedTemplateBanner: React.FC<PublishedTemplateBannerProps> = ({
  template,
  setTemplate,
  setIsPublished
}) => {
  const handleUnpublish = () => {
    if (confirm('Unpublish this template? It will no longer be available to users.')) {
      const updatedTemplate = { ...template, is_active: false }
      api.updateTemplate(template.id, updatedTemplate).then(response => {
        if (response.success) {
          setTemplate(updatedTemplate)
          setIsPublished(false)
        }
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
          <span className="text-sm font-medium text-[#4a6344]">Published Template</span>
          <p className="text-xs text-[#5a7a54]">This template is published and available to users. Changes will update the published version.</p>
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
