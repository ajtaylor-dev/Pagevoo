import React from 'react'
import { GridSection } from '../components/sections/GridSection'
import { NavbarSection } from '../components/sections/NavbarSection'
import { FooterSection } from '../components/sections/FooterSection'
import { SectionWrapper } from '../components/sections/SectionWrapper'
import { ContactFormPreview } from '@/components/script-features/contact-form/ContactFormPreview'
import { FormWrapPreview } from '@/components/script-features/contact-form/FormWrapPreview'
import { GalleryWrapPreview } from '@/components/script-features/gallery/GalleryWrapPreview'
import { BlogWrapPreview } from '@/components/script-features/blog/BlogWrapPreview'
import { EventsWrapPreview } from '@/components/script-features/events/EventsWrapPreview'
import LoginBoxPreview from '@/components/script-features/uas/LoginBoxPreview'
import RegisterFormPreview from '@/components/script-features/uas/RegisterFormPreview'
import UserDashboardPreview from '@/components/script-features/uas/UserDashboardPreview'

interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

interface TemplatePage {
  id: number
  name: string
  slug: string
  is_homepage: boolean
  order: number
  sections: TemplateSection[]
  meta_description?: string
  page_css?: string
  page_id?: string
}

interface Template {
  id: number
  name: string
  description: string
  business_type: string
  is_active: boolean
  pages: TemplatePage[]
  preview_image: string | null
  exclusive_to: 'pro' | 'niche' | null
  technologies: string[]
  features: string[]
  custom_css?: string
  images?: Array<{
    id: string
    filename: string
    path: string
    thumbnail_path?: string
    title?: string
    description?: string
    alt_text?: string
    album_id: string | null
    order: number
  }>
  albums?: Array<{
    id: string
    name: string
    description?: string
    cover_image_id?: string
    image_count: number
    order: number
  }>
}

interface UseRenderSectionProps {
  selectedSection: TemplateSection | null
  editingText: { sectionId: number; field: string; value: string } | null
  handleOpenTextEditor: (sectionId: number, field: string, currentValue: string) => void
  handleGridColumnUpdate: (sectionId: number, columnIndex: number, updates: any) => void
  currentPage: TemplatePage | null
  template: Template | null
  mobileMenuOpen: { [key: number]: boolean }
  setMobileMenuOpen: (open: { [key: number]: boolean }) => void
  hoveredSection: number | null
  setHoveredSection: (id: number | null) => void
  setSelectedSection: (section: TemplateSection | null) => void
  showCSSPanel: boolean
  setShowCSSPanel: (show: boolean) => void
  cssInspectorMode: boolean
  handleMoveSidebar: (sectionId: number, direction: 'up' | 'down') => void
  handleMoveSection: (sectionId: number, direction: 'up' | 'down') => void
  handleToggleSectionLock: (sectionId: number) => void
  handleDeleteSection: (sectionId: number) => void
  handleExportSection?: (section: TemplateSection) => void
}

export const useRenderSection = ({
  selectedSection,
  editingText,
  handleOpenTextEditor,
  handleGridColumnUpdate,
  currentPage,
  template,
  mobileMenuOpen,
  setMobileMenuOpen,
  hoveredSection,
  setHoveredSection,
  setSelectedSection,
  showCSSPanel,
  setShowCSSPanel,
  cssInspectorMode,
  handleMoveSidebar,
  handleMoveSection,
  handleToggleSectionLock,
  handleDeleteSection,
  handleExportSection
}: UseRenderSectionProps) => {

  const renderSection = (section: TemplateSection, index: number) => {
    // Determine which section component to render
    let sectionContent: React.ReactNode

    // Grid sections (1x1, 2x1, 3x1, etc.)
    if (section.type.startsWith('grid-')) {
      sectionContent = (
        <GridSection
          section={section}
          selectedSection={selectedSection}
          editingText={editingText}
          onOpenTextEditor={handleOpenTextEditor}
          onUpdateColumn={handleGridColumnUpdate}
        />
      )
    } else {
      switch (section.type) {
        // Navigation and Header sections
        case 'navbar':
          sectionContent = (
            <NavbarSection
              section={section}
              selectedSection={selectedSection}
              editingText={editingText}
              currentPage={currentPage}
              template={template}
              mobileMenuOpen={!!mobileMenuOpen[section.id]}
              onSetMobileMenuOpen={(open) => setMobileMenuOpen({ ...mobileMenuOpen, [section.id]: open })}
              onOpenTextEditor={handleOpenTextEditor}
            />
          )
          break

        // Legacy navbar types (deprecated)
        case 'navbar-basic':
        case 'navbar-sticky':
        case 'navbar-dropdown':
          sectionContent = (
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 text-center">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ This navbar type is deprecated. Please delete this section and add the new unified "Navigation Bar" instead.
              </p>
            </div>
          )
          break

        // Footer sections
        case 'footer-simple':
        case 'footer-columns':
          sectionContent = (
            <FooterSection
              section={section}
              selectedSection={selectedSection}
              editingText={editingText}
              onOpenTextEditor={handleOpenTextEditor}
            />
          )
          break

        // Form Wrap Container
        case 'form-wrap':
          sectionContent = (
            <FormWrapPreview
              section={section}
              selectedSection={selectedSection}
            />
          )
          break

        // Gallery Wrap Container
        case 'gallery-wrap':
          sectionContent = (
            <GalleryWrapPreview
              section={section}
              selectedSection={selectedSection}
              images={(template?.images || []).filter(
                img => img.album_id === section.content?.galleryConfig?.albumId
              )}
              albumName={template?.albums?.find(
                a => a.id === section.content?.galleryConfig?.albumId
              )?.name}
            />
          )
          break

        // Blog Wrap Container
        case 'blog-wrap':
          sectionContent = (
            <BlogWrapPreview
              section={section}
              selectedSection={selectedSection}
            />
          )
          break

        // Events Wrap Container
        case 'events-wrap':
          sectionContent = (
            <EventsWrapPreview
              section={section}
              selectedSection={selectedSection}
            />
          )
          break

        // User Access System - Login Box
        case 'login-box':
          sectionContent = (
            <LoginBoxPreview
              config={section.content?.loginConfig || {}}
              isPreview={true}
            />
          )
          break

        // User Access System - Register Form
        case 'register-form':
          sectionContent = (
            <RegisterFormPreview
              config={section.content?.registerConfig || {}}
              isPreview={true}
            />
          )
          break

        // User Access System - User Dashboard
        case 'user-dashboard':
          sectionContent = (
            <UserDashboardPreview
              config={section.content?.dashboardConfig || {}}
              isPreview={true}
            />
          )
          break

        // Contact form sections
        case 'contact-form-input':
        case 'contact-form-email':
        case 'contact-form-phone':
        case 'contact-form-textarea':
        case 'contact-form-dropdown':
        case 'contact-form-checkbox':
        case 'contact-form-radio':
        case 'contact-form-file':
        case 'contact-form-submit':
          sectionContent = (
            <ContactFormPreview
              section={section}
              selectedSection={selectedSection}
            />
          )
          break

        default:
          sectionContent = (
            <div className={`p-12 border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#98b290] transition ${selectedSection?.id === section.id ? 'border-[#98b290]' : ''}`}>
              <p className="text-gray-500 text-center">Section: {section.type}</p>
            </div>
          )
      }
    }

    // Wrap the section content with the SectionWrapper component
    return (
      <SectionWrapper
        section={section}
        index={index}
        hoveredSection={hoveredSection}
        setHoveredSection={setHoveredSection}
        setSelectedSection={setSelectedSection}
        showCSSPanel={showCSSPanel}
        setShowCSSPanel={setShowCSSPanel}
        cssInspectorMode={cssInspectorMode}
        currentPage={currentPage}
        template={template}
        handleMoveSidebar={handleMoveSidebar}
        handleMoveSection={handleMoveSection}
        handleToggleSectionLock={handleToggleSectionLock}
        handleDeleteSection={handleDeleteSection}
        handleExportSection={handleExportSection}
      >
        {sectionContent}
      </SectionWrapper>
    )
  }

  return { renderSection }
}
