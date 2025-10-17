import React, { useState } from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  links: any[]
  linkStyling?: any
  activeIndicator?: any
  currentPageId?: number
  getLinkHref: (link: any) => string
  getLinkLabel: (link: any) => string
  isActivePage: (link: any, pageId: number) => boolean
  generateLinkStyle: (styling: any) => any
  generateActiveIndicatorStyle: (indicator: any) => any
}

export function MobileMenu({
  isOpen,
  onClose,
  links,
  linkStyling,
  activeIndicator,
  currentPageId = 0,
  getLinkHref,
  getLinkLabel,
  isActivePage,
  generateLinkStyle,
  generateActiveIndicatorStyle,
}: MobileMenuProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleExpanded = (index: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Mobile Menu Panel - Full Width */}
      <div
        className="w-full bg-white border-t border-gray-200 md:hidden"
        style={{ animation: 'slideDown 250ms ease-out' }}
      >
        {/* Menu Items */}
        <nav className="p-4">
          {links.map((link, index) => {
            const hasSubItems = typeof link === 'object' && link.subItems && link.subItems.length > 0
            const isExpanded = expandedItems.has(index)
            const isActive = isActivePage(link, currentPageId)

            return (
              <div key={index} className="mb-2">
                {/* Main Link */}
                <div className="flex items-center justify-between">
                  <a
                    href={getLinkHref(link)}
                    className="flex-1 py-3 px-3 rounded transition block"
                    style={{
                      ...generateLinkStyle(linkStyling),
                      ...(isActive ? generateActiveIndicatorStyle(activeIndicator) : {}),
                    }}
                    onClick={(e) => {
                      if (hasSubItems) {
                        e.preventDefault()
                        toggleExpanded(index)
                      } else {
                        onClose()
                      }
                    }}
                  >
                    {getLinkLabel(link)}
                  </a>
                  {hasSubItems && (
                    <button
                      onClick={() => toggleExpanded(index)}
                      className="p-2 hover:bg-gray-100 rounded transition"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Sub Items */}
                {hasSubItems && isExpanded && (
                  <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-3">
                    {link.subItems.map((subItem: any, subIndex: number) => {
                      const isSubActive = isActivePage(subItem, currentPageId)
                      return (
                        <a
                          key={subIndex}
                          href={getLinkHref(subItem)}
                          className="block py-2 px-3 rounded transition text-sm"
                          style={{
                            ...generateLinkStyle(linkStyling),
                            ...(isSubActive ? generateActiveIndicatorStyle(activeIndicator) : {}),
                          }}
                          onClick={onClose}
                        >
                          {getLinkLabel(subItem)}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
