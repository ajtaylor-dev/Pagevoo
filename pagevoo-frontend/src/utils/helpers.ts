// Helper utility functions for Template Builder

/**
 * Generate a random string of specified length
 */
export const generateRandomString = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Sanitize a name for use as an identifier
 */
export const sanitizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
}

/**
 * Generate a unique identifier from a name
 */
export const generateIdentifier = (name: string): string => {
  const sanitized = sanitizeName(name)
  const random = generateRandomString(6)
  return `${sanitized}_${random}`
}

/**
 * Generate container style object from style config
 */
export const generateContainerStyle = (containerStyle: any): React.CSSProperties => {
  if (!containerStyle) return {}

  return {
    background: containerStyle.background,
    backgroundImage: containerStyle.backgroundImage,
    paddingTop: containerStyle.paddingTop,
    paddingRight: containerStyle.paddingRight,
    paddingBottom: containerStyle.paddingBottom,
    paddingLeft: containerStyle.paddingLeft,
    marginTop: containerStyle.marginTop,
    marginRight: containerStyle.marginRight,
    marginBottom: containerStyle.marginBottom,
    marginLeft: containerStyle.marginLeft,
    width: containerStyle.width,
    height: containerStyle.height,
    borderWidth: containerStyle.borderWidth,
    borderStyle: containerStyle.borderStyle,
    borderColor: containerStyle.borderColor,
    borderRadius: containerStyle.borderRadius,
    boxShadow: containerStyle.shadow,
    opacity: containerStyle.opacity,
    position: containerStyle.position,
    top: containerStyle.top,
    bottom: containerStyle.bottom,
    left: containerStyle.left,
    right: containerStyle.right,
    zIndex: containerStyle.zIndex
  }
}

/**
 * Generate link style object
 */
export const generateLinkStyle = (linkStyling: any, isHover: boolean = false): React.CSSProperties => {
  if (!linkStyling) return { textDecoration: 'none' }

  return {
    color: isHover ? linkStyling.textColorHover : linkStyling.textColor,
    backgroundColor: isHover ? linkStyling.bgColorHover : linkStyling.bgColor,
    fontSize: linkStyling.fontSize,
    fontWeight: linkStyling.fontWeight,
    letterSpacing: linkStyling.letterSpacing,
    padding: linkStyling.padding,
    margin: linkStyling.margin,
    border: linkStyling.border,
    borderRadius: linkStyling.borderRadius,
    transition: linkStyling.transition,
    textDecoration: 'none'
  }
}

/**
 * Generate active indicator style
 */
export const generateActiveIndicatorStyle = (activeIndicator: any): React.CSSProperties => {
  if (!activeIndicator) return {}

  return {
    fontWeight: activeIndicator.fontWeight,
    textDecoration: activeIndicator.textDecoration,
    color: activeIndicator.color,
    backgroundColor: activeIndicator.backgroundColor,
    borderBottom: activeIndicator.borderBottom
  }
}
