// Theme configuration for Template Builder and Website Builder
export type ThemeName = 'dark' | 'light' | 'sunset'

// Runtime constant for theme names
export const themeNames = ['dark', 'light', 'sunset'] as const

export interface ThemeColors {
  // Main container
  mainBg: string
  mainText: string

  // Header
  headerBg: string
  headerText: string
  headerBorder: string
  headerHover: string

  // Sidebars
  sidebarBg: string
  sidebarText: string
  sidebarBorder: string
  sidebarHeading: string

  // Buttons and interactive elements
  buttonBg: string
  buttonText: string
  buttonHover: string

  // Tabs
  tabActiveBg: string
  tabActiveText: string
  tabInactiveBg: string
  tabInactiveText: string
  tabHover: string

  // Inputs
  inputBg: string
  inputText: string
  inputBorder: string
  inputPlaceholder: string

  // Dropdown menus
  dropdownBg: string
  dropdownText: string
  dropdownHover: string
  dropdownBorder: string

  // Category buttons
  categoryBg: string
  categoryText: string
  categoryHover: string
  categoryIcon: string

  // Code displays
  codeBg: string
  codeText: string

  // Labels and helper text
  labelText: string
  helperText: string

  // Canvas/content area
  canvasBg: string

  // Accent color
  accentColor: string
}

export const themes: Record<ThemeName, ThemeColors> = {
  dark: {
    mainBg: 'bg-gray-900',
    mainText: 'text-white',

    headerBg: 'bg-gray-800',
    headerText: 'text-gray-200',
    headerBorder: 'border-gray-700',
    headerHover: 'hover:bg-gray-700',

    sidebarBg: 'bg-gray-800',
    sidebarText: 'text-gray-300',
    sidebarBorder: 'border-gray-700',
    sidebarHeading: 'text-[#98b290]',

    buttonBg: 'bg-gray-700',
    buttonText: 'text-gray-200',
    buttonHover: 'hover:bg-gray-600',

    tabActiveBg: 'bg-gray-700',
    tabActiveText: 'text-[#98b290]',
    tabInactiveBg: 'bg-gray-800',
    tabInactiveText: 'text-gray-300',
    tabHover: 'hover:bg-gray-700',

    inputBg: 'bg-gray-700',
    inputText: 'text-white',
    inputBorder: 'border-gray-600',
    inputPlaceholder: 'placeholder-gray-400',

    dropdownBg: 'bg-gray-800',
    dropdownText: 'text-gray-200',
    dropdownHover: 'hover:bg-gray-700',
    dropdownBorder: 'border-gray-700',

    categoryBg: 'bg-gray-700',
    categoryText: 'text-gray-300',
    categoryHover: 'hover:bg-gray-600',
    categoryIcon: 'text-[#98b290]',

    codeBg: 'bg-gray-700',
    codeText: 'text-gray-200',

    labelText: 'text-gray-200',
    helperText: 'text-gray-400',

    canvasBg: 'bg-gray-100',

    accentColor: 'text-[#98b290]',
  },

  light: {
    mainBg: 'bg-gray-50',
    mainText: 'text-gray-900',

    headerBg: 'bg-white',
    headerText: 'text-gray-800',
    headerBorder: 'border-gray-200',
    headerHover: 'hover:bg-[#e8f0e6]',

    sidebarBg: 'bg-white',
    sidebarText: 'text-gray-800',
    sidebarBorder: 'border-gray-200',
    sidebarHeading: 'text-[#5a7a54]',

    buttonBg: 'bg-gray-100',
    buttonText: 'text-gray-800',
    buttonHover: 'hover:bg-gray-200',

    tabActiveBg: 'bg-[#e8f0e6]',
    tabActiveText: 'text-[#5a7a54]',
    tabInactiveBg: 'bg-white',
    tabInactiveText: 'text-gray-700',
    tabHover: 'hover:bg-gray-100',

    inputBg: 'bg-white',
    inputText: 'text-gray-900',
    inputBorder: 'border-gray-300',
    inputPlaceholder: 'placeholder-gray-400',

    dropdownBg: 'bg-white',
    dropdownText: 'text-gray-800',
    dropdownHover: 'hover:bg-gray-100',
    dropdownBorder: 'border-gray-200',

    categoryBg: 'bg-gradient-to-r from-[#e8f0e6] to-[#d4e4d0]',
    categoryText: 'text-gray-800',
    categoryHover: 'hover:from-[#d4e4d0] hover:to-[#c0d8ba]',
    categoryIcon: 'text-[#5a7a54]',

    codeBg: 'bg-gray-100',
    codeText: 'text-gray-900',

    labelText: 'text-gray-800',
    helperText: 'text-gray-600',

    canvasBg: 'bg-white',

    accentColor: 'text-[#5a7a54]',
  },

  sunset: {
    mainBg: 'bg-[#2b2b2b]',
    mainText: 'text-white',

    headerBg: 'bg-[#2b2b2b]',
    headerText: 'text-[#FFD700]',
    headerBorder: 'border-[#FFD700]',
    headerHover: 'hover:bg-[#3a3a3a]',

    sidebarBg: 'bg-[#2b2b2b]',
    sidebarText: 'text-white',
    sidebarBorder: 'border-[#FFD700]',
    sidebarHeading: 'text-[#FFD700]',

    buttonBg: 'bg-[#FFD700]',
    buttonText: 'text-black',
    buttonHover: 'hover:bg-[#FFC700]',

    tabActiveBg: 'bg-[#FFD700]',
    tabActiveText: 'text-black',
    tabInactiveBg: 'bg-[#3a3a3a]',
    tabInactiveText: 'text-white',
    tabHover: 'hover:bg-[#4a4a4a]',

    inputBg: 'bg-[#3a3a3a]',
    inputText: 'text-white',
    inputBorder: 'border-[#FFD700]',
    inputPlaceholder: 'placeholder-gray-400',

    dropdownBg: 'bg-[#2b2b2b]',
    dropdownText: 'text-white',
    dropdownHover: 'hover:bg-[#3a3a3a]',
    dropdownBorder: 'border-[#FFD700]',

    categoryBg: 'bg-[#3a3a3a]',
    categoryText: 'text-[#FFD700]',
    categoryHover: 'hover:bg-[#4a4a4a]',
    categoryIcon: 'text-[#FF0000]',

    codeBg: 'bg-[#3a3a3a]',
    codeText: 'text-white',

    labelText: 'text-[#FFD700]',
    helperText: 'text-gray-400',

    canvasBg: 'bg-white',

    accentColor: 'text-[#FFD700]',
  },
}

export const themeIndicators: Record<ThemeName, string> = {
  dark: '#374151', // gray-700
  light: '#f3f4f6', // gray-100
  sunset: '#FFD700', // gold/yellow - HTMLHoney theme
}
