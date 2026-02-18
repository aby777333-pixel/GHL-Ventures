'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

export type ColorTheme =
  | 'default'
  | 'midnight-blue'
  | 'forest'
  | 'sunset'
  | 'royal-purple'
  | 'ocean'
  | 'rose-gold'
  | 'custom'

export interface ColorThemeConfig {
  id: ColorTheme
  label: string
  accent: string
  accentDark: string
  bg: string
  card: string
  text: string
  description: string
}

export const COLOR_THEMES: ColorThemeConfig[] = [
  { id: 'default', label: 'GHL Red', accent: '#D0021B', accentDark: '#8B0000', bg: '#F8F7F5', card: '#FFFFFF', text: '#0A0A0A', description: 'Classic brand' },
  { id: 'midnight-blue', label: 'Midnight Blue', accent: '#1E40AF', accentDark: '#1E3A5F', bg: '#F0F4FF', card: '#FFFFFF', text: '#0F172A', description: 'Night focus' },
  { id: 'forest', label: 'Forest Green', accent: '#15803D', accentDark: '#14532D', bg: '#F0FDF4', card: '#FFFFFF', text: '#0A1F0A', description: 'Nature calm' },
  { id: 'sunset', label: 'Sunset Orange', accent: '#EA580C', accentDark: '#9A3412', bg: '#FFF7ED', card: '#FFFFFF', text: '#1A0A00', description: 'Warm evening' },
  { id: 'royal-purple', label: 'Royal Purple', accent: '#7C3AED', accentDark: '#5B21B6', bg: '#FAF5FF', card: '#FFFFFF', text: '#1A0A2E', description: 'Luxe mood' },
  { id: 'ocean', label: 'Ocean Teal', accent: '#0891B2', accentDark: '#155E75', bg: '#ECFEFF', card: '#FFFFFF', text: '#042F2E', description: 'Serene day' },
  { id: 'rose-gold', label: 'Rose Gold', accent: '#BE185D', accentDark: '#831843', bg: '#FFF1F2', card: '#FFFFFF', text: '#1A0010', description: 'Elegant' },
]

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  colorTheme: ColorTheme
  setColorTheme: (ct: ColorTheme) => void
  customAccent: string
  setCustomAccent: (color: string) => void
  /** Global color override — overrides bg/card/text across entire site. null = no override */
  globalOverrideColor: string | null
  setGlobalOverrideColor: (color: string | null) => void
  /** Resets to original theme, clearing any global color override */
  resetToOriginal: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  colorTheme: 'default',
  setColorTheme: () => {},
  customAccent: '#D0021B',
  setCustomAccent: () => {},
  globalOverrideColor: null,
  setGlobalOverrideColor: () => {},
  resetToOriginal: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function applyColorTheme(ct: ColorTheme, customAccent: string) {
  const root = document.documentElement
  const config = COLOR_THEMES.find(t => t.id === ct)
  if (!config && ct !== 'custom') return

  const accent = ct === 'custom' ? customAccent : config!.accent
  const accentDark = ct === 'custom' ? darkenColor(customAccent, 30) : config!.accentDark

  root.style.setProperty('--color-red', accent)
  root.style.setProperty('--color-red-dark', accentDark)
  root.style.setProperty('--cta-gradient', `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`)
  root.style.setProperty('--red-burst', `radial-gradient(circle at 30% 50%, ${accent}4D 0%, transparent 60%)`)
  root.style.setProperty('--section-divider', `linear-gradient(90deg, transparent, ${accent}, transparent)`)

  root.setAttribute('data-color-theme', ct)
}

/** Apply a global color to all bg/card/text areas, completely overriding dark/light */
function applyGlobalOverride(color: string) {
  const root = document.documentElement
  const darkened = darkenColor(color, 15)
  const lighter = lightenColor(color, 70)
  const isColorDark = getPerceivedBrightness(color) < 128
  const textColor = isColorDark ? '#FFFFFF' : '#0A0A0A'

  root.style.setProperty('--global-override-bg', color)
  root.style.setProperty('--global-override-card', isColorDark ? lightenColor(color, 15) : darkenColor(color, 5))
  root.style.setProperty('--global-override-text', textColor)
  root.setAttribute('data-global-override', 'true')
}

/** Remove the global override, restore normal theme */
function removeGlobalOverride() {
  const root = document.documentElement
  root.style.removeProperty('--global-override-bg')
  root.style.removeProperty('--global-override-card')
  root.style.removeProperty('--global-override-text')
  root.removeAttribute('data-global-override')
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)))
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent / 100)))
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent / 100)))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent / 100))
  const g = Math.min(255, Math.floor(((num >> 8) & 0xFF) + (255 - ((num >> 8) & 0xFF)) * percent / 100))
  const b = Math.min(255, Math.floor((num & 0xFF) + (255 - (num & 0xFF)) * percent / 100))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}

function getPerceivedBrightness(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = num >> 16
  const g = (num >> 8) & 0xFF
  const b = num & 0xFF
  return (r * 299 + g * 587 + b * 114) / 1000
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('default')
  const [customAccent, setCustomAccentState] = useState('#D0021B')
  const [globalOverrideColor, setGlobalOverrideColorState] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('ghl-theme') as Theme | null
    const savedColor = localStorage.getItem('ghl-color-theme') as ColorTheme | null
    const savedCustom = localStorage.getItem('ghl-custom-accent')

    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
    if (savedColor) {
      setColorThemeState(savedColor)
      applyColorTheme(savedColor, savedCustom || '#D0021B')
    }
    if (savedCustom) {
      setCustomAccentState(savedCustom)
    }
    // On mount: never restore global override (it must not persist)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('ghl-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    // Reset any global override when day/night toggle is clicked
    if (globalOverrideColor) {
      setGlobalOverrideColorState(null)
      removeGlobalOverride()
    }
  }

  const setColorTheme = (ct: ColorTheme) => {
    setColorThemeState(ct)
    localStorage.setItem('ghl-color-theme', ct)
    applyColorTheme(ct, customAccent)
  }

  const setCustomAccent = (color: string) => {
    setCustomAccentState(color)
    localStorage.setItem('ghl-custom-accent', color)
    if (colorTheme === 'custom') {
      applyColorTheme('custom', color)
    }
  }

  const setGlobalOverrideColor = (color: string | null) => {
    setGlobalOverrideColorState(color)
    if (color) {
      applyGlobalOverride(color)
    } else {
      removeGlobalOverride()
    }
    // NO localStorage — must not persist across refresh
  }

  const resetToOriginal = () => {
    setGlobalOverrideColorState(null)
    removeGlobalOverride()
  }

  if (!mounted) return <>{children}</>

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme,
      colorTheme, setColorTheme,
      customAccent, setCustomAccent,
      globalOverrideColor, setGlobalOverrideColor,
      resetToOriginal,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
