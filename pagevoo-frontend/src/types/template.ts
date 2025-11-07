// Template Builder Type Definitions

export interface TemplateSection {
  id: number
  type: string
  content: any
  order: number
  section_name?: string
  section_id?: string
  is_locked?: boolean
}

export interface ContentCSS {
  row?: string
  columns?: { [key: string]: string }
}

export interface TemplatePage {
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

export interface TemplateImage {
  id: string
  filename: string
  path: string
  size: number
  uploaded_at: string
}

export interface Template {
  id: number
  name: string
  template_slug?: string
  description: string
  business_type: string
  is_active: boolean
  pages: TemplatePage[]
  preview_image: string | null
  exclusive_to: 'pro' | 'niche' | null
  technologies: string[]
  features: string[]
  custom_css?: string
  images?: TemplateImage[]
}

export interface HistoryState {
  template: Template
  currentPageId: number | null
}

// Navbar-specific types
export interface ButtonStyling {
  enabled: boolean
  backgroundColor: string
  textColor: string
  hoverBackgroundColor: string
  hoverTextColor: string
  borderWidth: number
  borderStyle: string
  borderColor: string
  borderRadius: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  fontSize: number
  fontWeight: string
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
}

export interface LinkStyling {
  textColor?: string
  textColorHover?: string
  bgColor?: string
  bgColorHover?: string
  fontSize?: string
  fontWeight?: string
  letterSpacing?: string
  padding?: string
  margin?: string
  border?: string
  borderRadius?: string
  transition?: string
}

export interface DropdownConfig {
  trigger?: 'hover' | 'click'
  hoverDelay?: number
  transitionDuration?: number
  dropdownBg?: string
  dropdownBorder?: string
  dropdownShadow?: string
  dropdownPadding?: string
  dropdownItemHoverBg?: string
  mobileMenuBg?: string
  mobileMenuButtonBg?: string
  mobileMenuButtonColor?: string
  mobileMenuButtonHoverBg?: string
}
