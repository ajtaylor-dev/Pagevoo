import React, { useState, useRef, useEffect } from 'react'
import { EditableText } from '../EditableText'
import { MobileMenu } from '@/components/MobileMenu'
import {
  generateContainerStyle,
  generateLinkStyle,
  generateActiveIndicatorStyle
} from '../../utils/helpers'
import { isActivePage } from '../../utils/cssUtils'

interface NavbarSectionProps {
  section: {
    id: number
    type: string
    section_id?: string
    content: any
  }
  selectedSection: any
  editingText: { sectionId: number; field: string; value: string } | null
  currentPage: any
  template: any
  mobileMenuOpen: boolean
  onSetMobileMenuOpen: (open: boolean) => void
  onOpenTextEditor: (sectionId: number, field: string, value: string) => void
}

export const NavbarSection: React.FC<NavbarSectionProps> = ({
  section,
  selectedSection,
  editingText,
  currentPage,
  template,
  mobileMenuOpen,
  onSetMobileMenuOpen,
  onOpenTextEditor
}) => {
  const content = section.content || {}
  const navPosition = content.position || 'static'
  const logoWidth = content.layoutConfig?.logoWidth || content.logoWidth || 25
  const links = content.links || []
  const layoutConfig = content.layoutConfig || {}
  const dropdownConfig = content.dropdownConfig || {}
  const linkStyling = content.linkStyling || {}

  // Layout positioning
  const logoPosition = layoutConfig.logoPosition || 'left'
  const linksPosition = layoutConfig.linksPosition || 'right'

  // Link styling
  const linkTextColor = linkStyling.textColor || '#000000'
  const linkTextColorHover = linkStyling.textColorHover || '#666666'

  // Dropdown styling
  const dropdownBg = dropdownConfig.dropdownBg || '#ffffff'
  const dropdownBorder = dropdownConfig.dropdownBorder || '1px solid #e5e7eb'
  const dropdownShadow = dropdownConfig.dropdownShadow || '0 4px 6px rgba(0,0,0,0.1)'
  const dropdownPadding = dropdownConfig.dropdownPadding || '8px'
  const dropdownItemHoverBg = dropdownConfig.dropdownItemHoverBg || '#f3f4f6'

  // Mobile menu button styling
  const mobileMenuButtonBg = dropdownConfig.mobileMenuButtonBg || 'transparent'
  const mobileMenuButtonColor = dropdownConfig.mobileMenuButtonColor || '#000000'
  const mobileMenuButtonHoverBg = dropdownConfig.mobileMenuButtonHoverBg || '#f3f4f6'

  // Helper functions
  const getLinkHref = (link: any): string => {
    if (typeof link === 'string') return '#'
    if (link.linkType === 'url') {
      return link.url || '#'
    } else if (link.linkType === 'page' && link.pageId) {
      const page = template?.pages.find((p: any) => p.id === link.pageId)
      if (page) {
        return page.is_homepage ? '/' : `/${page.slug || page.name.toLowerCase().replace(/\s+/g, '-')}`
      }
    }
    return '#'
  }

  const getLinkLabel = (link: any): string => {
    return typeof link === 'string' ? link : (link.label || 'Link')
  }

  // Dropdown nav item component
  const DropdownNavItem = ({ link, currentPageId }: any) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const hasSubItems = typeof link === 'object' && link.subItems && link.subItems.length > 0
    const isActive = isActivePage(link, currentPageId)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const hasButtonStyle = content.buttonStyling?.enabled || false
    const btnStyle = content.buttonStyling || {}

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
          document.removeEventListener('mousedown', handleClickOutside)
        }
      }
    }, [isOpen])

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)

    const handleClick = (e: any) => {
      if (hasSubItems) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    return (
      <div ref={dropdownRef} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <a
          href={getLinkHref(link)}
          className={`cursor-pointer flex items-center gap-1 transition ${hasButtonStyle ? 'inline-block' : ''}`}
          onClick={handleClick}
          style={hasButtonStyle ? {
            backgroundColor: isHovered ? btnStyle.hoverBackgroundColor : btnStyle.backgroundColor,
            color: isHovered ? btnStyle.hoverTextColor : btnStyle.textColor,
            borderWidth: `${btnStyle.borderWidth || 0}px`,
            borderStyle: btnStyle.borderStyle || 'solid',
            borderColor: btnStyle.borderColor || btnStyle.backgroundColor,
            borderRadius: `${btnStyle.borderRadius || 0}px`,
            paddingTop: `${btnStyle.paddingTop || 8}px`,
            paddingRight: `${btnStyle.paddingRight || 16}px`,
            paddingBottom: `${btnStyle.paddingBottom || 8}px`,
            paddingLeft: `${btnStyle.paddingLeft || 16}px`,
            fontSize: `${btnStyle.fontSize || 14}px`,
            fontWeight: btnStyle.fontWeight || '500',
            marginTop: `${btnStyle.marginTop || 5}px`,
            marginRight: `${btnStyle.marginRight || 5}px`,
            marginBottom: `${btnStyle.marginBottom || 5}px`,
            marginLeft: `${btnStyle.marginLeft || 5}px`,
            textDecoration: 'none'
          } : {
            color: isHovered ? linkTextColorHover : linkTextColor,
            fontWeight: isActive ? 'bold' : 'normal',
            textDecoration: isActive ? 'underline' : 'none'
          }}
        >
          {getLinkLabel(link)}
        </a>
        {isOpen && hasSubItems && (
          <div
            className="absolute top-full left-0 mt-1 min-w-[120px] z-10"
            style={{
              backgroundColor: dropdownBg,
              border: dropdownBorder,
              boxShadow: dropdownShadow,
              padding: dropdownPadding,
              borderRadius: '0.25rem'
            }}
          >
            {link.subItems.map((subItem: any, subIdx: number) => {
              const DropdownSubItem = () => {
                const [isSubHovered, setIsSubHovered] = useState(false)
                const isSubItemActive = isActivePage(subItem, currentPageId)
                return (
                  <a
                    href={getLinkHref(subItem)}
                    className="block text-sm py-1 px-2 rounded transition"
                    style={hasButtonStyle ? {
                      backgroundColor: isSubHovered ? btnStyle.hoverBackgroundColor : btnStyle.backgroundColor,
                      color: isSubHovered ? btnStyle.hoverTextColor : btnStyle.textColor,
                      borderWidth: `${btnStyle.borderWidth || 0}px`,
                      borderStyle: btnStyle.borderStyle || 'solid',
                      borderColor: btnStyle.borderColor || btnStyle.backgroundColor,
                      borderRadius: `${btnStyle.borderRadius || 0}px`,
                      paddingTop: `${btnStyle.paddingTop || 8}px`,
                      paddingRight: `${btnStyle.paddingRight || 16}px`,
                      paddingBottom: `${btnStyle.paddingBottom || 8}px`,
                      paddingLeft: `${btnStyle.paddingLeft || 16}px`,
                      fontSize: `${btnStyle.fontSize || 14}px`,
                      fontWeight: btnStyle.fontWeight || '500',
                      marginTop: `${btnStyle.marginTop || 5}px`,
                      marginRight: `${btnStyle.marginRight || 5}px`,
                      marginBottom: `${btnStyle.marginBottom || 5}px`,
                      marginLeft: `${btnStyle.marginLeft || 5}px`,
                      textDecoration: 'none'
                    } : {
                      color: isSubHovered ? linkTextColorHover : linkTextColor,
                      fontWeight: isSubItemActive ? 'bold' : 'normal',
                      backgroundColor: isSubHovered ? dropdownItemHoverBg : 'transparent'
                    }}
                    onMouseEnter={() => setIsSubHovered(true)}
                    onMouseLeave={() => setIsSubHovered(false)}
                    onClick={(e) => e.preventDefault()}
                  >
                    {getLinkLabel(subItem)}
                  </a>
                )
              }
              return <DropdownSubItem key={subIdx} />
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Custom CSS for navbar */}
      {content.content_css && (
        <style dangerouslySetInnerHTML={{ __html: `
          #${section.section_id || `section-${section.id}`} {
            ${content.content_css}
          }
        ` }} />
      )}
      <div
        id={section.section_id || `section-${section.id}`}
        className={`cursor-pointer hover:ring-2 hover:ring-[#98b290] transition ${selectedSection?.id === section.id ? 'ring-2 ring-[#98b290]' : ''}`}
        style={{
          paddingTop: '16px',
          paddingBottom: '16px',
          ...generateContainerStyle(content.containerStyle || {}),
          borderBottom: content.containerStyle?.borderWidth ? undefined : '2px solid #e5e7eb',
          borderRadius: content.containerStyle?.borderRadius || 0,
          position: 'relative'
        }}
      >
        <div className="flex items-center" style={{
          width: '100%',
          padding: '0 16px',
          flexDirection: logoPosition === 'center' && linksPosition === 'center' ? 'column' : 'row',
          flexWrap: 'wrap',
          justifyContent:
            logoPosition === 'center' && linksPosition === 'center' ? 'center' :
            logoPosition === 'left' && linksPosition === 'right' ? 'space-between' :
            logoPosition === 'right' && linksPosition === 'left' ? 'space-between' :
            'space-between',
          gap: logoPosition === 'center' && linksPosition === 'center' ? '16px' : '8px'
        }}>
          {/* Render logo first if on left or center, last if on right */}
          {(logoPosition === 'left' || logoPosition === 'center') && (
            <div style={{
              width: logoPosition === 'center' ? '100%' : `${logoWidth}%`,
              minWidth: logoPosition === 'center' ? 'auto' : '120px',
              textAlign: logoPosition === 'center' ? 'center' : 'left'
            }}>
              <EditableText
                tag="div"
                sectionId={section.id}
                field="logo"
                value={(content.logo && content.logo.trim()) || 'Logo'}
                className="text-xl font-bold outline-none hover:bg-gray-50 px-2 py-1 rounded transition"
                isEditing={editingText?.sectionId === section.id && editingText?.field === "logo"}
                onOpenEditor={onOpenTextEditor}
              />
            </div>
          )}

          {/* Navigation Links - Desktop */}
          <div className={`hidden md:flex items-center flex-1 ${content.buttonStyling?.enabled ? '' : 'gap-6'}`} style={{
            flexWrap: 'wrap',
            justifyContent:
              linksPosition === 'center' ? 'center' :
              linksPosition === 'left' ? 'flex-start' :
              'flex-end',
            order: logoPosition === 'right' && linksPosition === 'left' ? -1 : 0
          }}>
            {links.map((link: any, idx: number) => {
              const hasSubItems = typeof link === 'object' && link.subItems && link.subItems.length > 0

              if (hasSubItems) {
                return <DropdownNavItem key={idx} link={link} currentPageId={currentPage?.id || 0} />
              }

              const LinkItem = () => {
                const [isHovered, setIsHovered] = useState(false)
                const isActive = isActivePage(link, currentPage?.id || 0)
                const hasButtonStyle = content.buttonStyling?.enabled || false
                const btnStyle = content.buttonStyling || {}

                if (hasButtonStyle) {
                  return (
                    <a
                      href={getLinkHref(link)}
                      className="transition inline-block"
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      style={{
                        backgroundColor: isHovered ? btnStyle.hoverBackgroundColor : btnStyle.backgroundColor,
                        color: isHovered ? btnStyle.hoverTextColor : btnStyle.textColor,
                        borderWidth: `${btnStyle.borderWidth || 0}px`,
                        borderStyle: btnStyle.borderStyle || 'solid',
                        borderColor: btnStyle.borderColor || btnStyle.backgroundColor,
                        borderRadius: `${btnStyle.borderRadius || 0}px`,
                        paddingTop: `${btnStyle.paddingTop || 8}px`,
                        paddingRight: `${btnStyle.paddingRight || 16}px`,
                        paddingBottom: `${btnStyle.paddingBottom || 8}px`,
                        paddingLeft: `${btnStyle.paddingLeft || 16}px`,
                        fontSize: `${btnStyle.fontSize || 14}px`,
                        fontWeight: btnStyle.fontWeight || '500',
                        marginTop: `${btnStyle.marginTop || 5}px`,
                        marginRight: `${btnStyle.marginRight || 5}px`,
                        marginBottom: `${btnStyle.marginBottom || 5}px`,
                        marginLeft: `${btnStyle.marginLeft || 5}px`,
                        textDecoration: 'none'
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {getLinkLabel(link)}
                    </a>
                  )
                }

                return (
                  <a
                    href={getLinkHref(link)}
                    className="transition"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                      color: isHovered ? linkTextColorHover : linkTextColor,
                      fontWeight: isActive ? 'bold' : 'normal',
                      textDecoration: isActive ? 'underline' : 'none'
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    {getLinkLabel(link)}
                  </a>
                )
              }
              return <LinkItem key={idx} />
            })}
          </div>

          {/* Render logo last if on right */}
          {logoPosition === 'right' && (
            <div style={{ width: `${logoWidth}%`, minWidth: '120px', textAlign: 'right' }}>
              <EditableText
                tag="div"
                sectionId={section.id}
                field="logo"
                value={(content.logo && content.logo.trim()) || 'Logo'}
                className="text-xl font-bold outline-none hover:bg-gray-50 px-2 py-1 rounded transition"
                isEditing={editingText?.sectionId === section.id && editingText?.field === "logo"}
                onOpenEditor={onOpenTextEditor}
              />
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded transition"
            style={{
              backgroundColor: mobileMenuButtonBg,
              color: mobileMenuButtonColor
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = mobileMenuButtonHoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = mobileMenuButtonBg}
            onClick={() => onSetMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => onSetMobileMenuOpen(false)}
          links={links}
          linkStyling={linkStyling}
          activeIndicator={{}}
          mobileMenuBg={dropdownConfig.mobileMenuBg}
          currentPageId={currentPage?.id || 0}
          buttonStyling={content.buttonStyling}
          getLinkHref={getLinkHref}
          getLinkLabel={getLinkLabel}
          isActivePage={isActivePage}
          generateLinkStyle={generateLinkStyle}
          generateActiveIndicatorStyle={generateActiveIndicatorStyle}
        />
      </div>
    </>
  )
}
