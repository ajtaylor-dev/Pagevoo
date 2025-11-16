import React from 'react'
import { themeIndicators } from '@/config/themes'
import type { ThemeName } from '@/config/themes'

interface ThemeSwitcherProps {
  currentTheme: ThemeName
  onThemeChange: (theme: ThemeName) => void
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  const themes: ThemeName[] = ['dark', 'light', 'sunset']

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-current opacity-50 hover:opacity-100 transition-opacity">
      {themes.map((theme) => (
        <button
          key={theme}
          onClick={() => onThemeChange(theme)}
          className="relative group"
          title={theme.charAt(0).toUpperCase() + theme.slice(1)}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              currentTheme === theme
                ? 'border-current scale-110 shadow-lg'
                : 'border-gray-500 opacity-60 hover:opacity-100 hover:scale-105'
            }`}
            style={{
              backgroundColor: themeIndicators[theme],
            }}
          >
            {/* Checkmark for selected theme */}
            {currentTheme === theme && (
              <svg
                className="w-full h-full p-0.5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

export default ThemeSwitcher
