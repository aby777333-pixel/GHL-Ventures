'use client'

import { useTheme } from '@/lib/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  scrolled: boolean
}

export default function ThemeToggle({ scrolled }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
        scrolled
          ? 'text-brand-black/60 hover:text-brand-red hover:bg-red-50'
          : 'text-white/60 hover:text-brand-red hover:bg-white/10'
      }`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`${theme === 'light' ? 'Dark' : 'Light'} mode`}
    >
      <span
        className="transition-transform duration-300"
        style={{ transform: theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </span>
    </button>
  )
}
