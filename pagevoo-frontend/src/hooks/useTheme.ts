import { useState, useEffect } from 'react'
import { themes } from '@/config/themes'
import type { ThemeName } from '@/config/themes'

const THEME_STORAGE_KEY = 'pagevoo-builder-theme'

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    // Load theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName
    return savedTheme && themes[savedTheme] ? savedTheme : 'light'
  })

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme)
  }, [currentTheme])

  const theme = themes[currentTheme]

  const changeTheme = (newTheme: ThemeName) => {
    setCurrentTheme(newTheme)
  }

  return {
    currentTheme,
    theme,
    changeTheme,
  }
}
