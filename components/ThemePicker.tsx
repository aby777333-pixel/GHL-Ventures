'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette, Check, RotateCcw } from 'lucide-react'
import { useTheme, COLOR_THEMES } from '@/lib/ThemeProvider'

interface ThemePickerProps {
  scrolled: boolean
}

export default function ThemePicker({ scrolled }: ThemePickerProps) {
  const { theme, colorTheme, setColorTheme, customAccent, setCustomAccent, globalOverrideColor, setGlobalOverrideColor, resetToOriginal } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isLightTheme = theme === 'light'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
          scrolled
            ? isLightTheme
              ? 'text-black hover:text-brand-red hover:bg-red-50'
              : 'text-white/60 hover:text-brand-red hover:bg-white/10'
            : 'text-white/60 hover:text-brand-red hover:bg-white/10'
        }`}
        aria-label="Color theme picker"
        title="Color Theme"
      >
        {globalOverrideColor ? (
          <div className={`w-3.5 h-3.5 rounded-full ring-1 ${isLightTheme ? 'ring-black/20' : 'ring-white/30'}`} style={{ background: globalOverrideColor }} />
        ) : (
          <Palette className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-72 rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden z-50 ${
            isLightTheme
              ? 'border-black/10 bg-white/95 shadow-black/10'
              : 'border-white/10 bg-[#111]/95 shadow-black/40'
          }`}
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          {/* Header */}
          <div className={`px-4 pt-3 pb-2 border-b ${isLightTheme ? 'border-black/5' : 'border-white/5'}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isLightTheme ? 'text-black' : 'text-white/90'}`}>Color Theme</p>
            <p className={`text-[9px] mt-0.5 ${isLightTheme ? 'text-gray-500' : 'text-white/40'}`}>Pick an accent or override the entire site color</p>
          </div>

          {/* ── "Go back to original" switch ── */}
          {globalOverrideColor && (
            <div className={`px-4 py-2 border-b ${isLightTheme ? 'border-black/5' : 'border-white/5'}`}>
              <button
                onClick={() => {
                  resetToOriginal()
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                  isLightTheme ? 'bg-black/[0.03] hover:bg-black/[0.06]' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-green-400 group-hover:rotate-[-45deg] transition-transform" />
                <div className="flex-1 text-left">
                  <p className="text-green-400 text-[11px] font-semibold">Go back to original color themes</p>
                  <p className={`text-[9px] ${isLightTheme ? 'text-gray-500' : 'text-white/35'}`}>Restore default dark/light theme</p>
                </div>
              </button>
            </div>
          )}

          {/* ── Global Color Override ── */}
          <div className={`px-4 py-3 border-b ${isLightTheme ? 'border-black/5' : 'border-white/5'}`}>
            <p className={`text-[9px] font-semibold uppercase tracking-wider mb-2 ${isLightTheme ? 'text-gray-600' : 'text-white/60'}`}>Override Entire Site</p>
            <div className="flex items-center gap-2">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={globalOverrideColor || '#1a1a2e'}
                  onChange={e => setGlobalOverrideColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={`w-8 h-8 rounded-lg ring-1 transition-all ${isLightTheme ? 'ring-black/10 hover:ring-black/25' : 'ring-white/20 hover:ring-white/40'}`}
                  style={{ background: globalOverrideColor || 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
                />
              </label>
              <div className="flex-1">
                <p className={`text-[10px] font-medium ${isLightTheme ? 'text-black' : 'text-white/80'}`}>
                  {globalOverrideColor ? 'Site color override active' : 'Pick a color to override all backgrounds'}
                </p>
                <p className={`text-[8px] ${isLightTheme ? 'text-gray-500' : 'text-white/30'}`}>Does not persist after refresh</p>
              </div>
              {globalOverrideColor && (
                <button
                  onClick={() => resetToOriginal()}
                  className={`transition-colors ${isLightTheme ? 'text-gray-500 hover:text-black' : 'text-white/40 hover:text-white/70'}`}
                  title="Clear override"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* ── Accent Preset Themes ── */}
          <div className="px-4 pt-2 pb-1">
            <p className={`text-[9px] font-semibold uppercase tracking-wider mb-1 ${isLightTheme ? 'text-gray-600' : 'text-white/60'}`}>Accent Themes</p>
          </div>
          <div className="p-2 space-y-0.5 max-h-52 overflow-y-auto">
            {COLOR_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setColorTheme(theme.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  colorTheme === theme.id
                    ? isLightTheme ? 'bg-black/[0.05]' : 'bg-white/10'
                    : isLightTheme ? 'hover:bg-black/[0.03]' : 'hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full shrink-0 ring-1 transition-transform group-hover:scale-110 ${isLightTheme ? 'ring-black/10' : 'ring-white/10'}`}
                  style={{ background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentDark} 100%)` }}
                />
                <div className="flex-1 text-left">
                  <p className={`text-[11px] font-medium leading-tight ${isLightTheme ? 'text-black' : 'text-white/90'}`}>{theme.label}</p>
                  <p className={`text-[9px] ${isLightTheme ? 'text-gray-500' : 'text-white/35'}`}>{theme.description}</p>
                </div>
                {colorTheme === theme.id && <Check className="w-3 h-3 text-brand-red shrink-0" />}
              </button>
            ))}
          </div>

          {/* ── Custom Accent ── */}
          <div className={`px-4 py-3 border-t ${isLightTheme ? 'border-black/5' : 'border-white/5'}`}>
            <button
              onClick={() => setColorTheme('custom')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all mb-2 ${
                colorTheme === 'custom'
                  ? isLightTheme ? 'bg-black/[0.05]' : 'bg-white/10'
                  : isLightTheme ? 'hover:bg-black/[0.03]' : 'hover:bg-white/5'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shrink-0 ring-1 ${isLightTheme ? 'ring-black/10' : 'ring-white/10'}`}
                style={{ background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
              />
              <div className="flex-1 text-left">
                <p className={`text-[11px] font-medium ${isLightTheme ? 'text-black' : 'text-white/90'}`}>Custom Accent</p>
                <p className={`text-[9px] ${isLightTheme ? 'text-gray-500' : 'text-white/35'}`}>Pick your own accent color</p>
              </div>
              {colorTheme === 'custom' && <Check className="w-3 h-3 text-brand-red shrink-0" />}
            </button>

            {colorTheme === 'custom' && (
              <div className="flex items-center gap-2 mt-1">
                <label className="relative cursor-pointer">
                  <input
                    type="color"
                    value={customAccent}
                    onChange={e => setCustomAccent(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`w-7 h-7 rounded-lg ring-1 ${isLightTheme ? 'ring-black/10' : 'ring-white/20'}`} style={{ background: customAccent }} />
                </label>
                <input
                  type="text"
                  value={customAccent}
                  onChange={e => {
                    const val = e.target.value
                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setCustomAccent(val)
                  }}
                  className={`flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none transition-colors ${
                    isLightTheme
                      ? 'bg-black/[0.03] border border-black/10 text-black focus:border-black/25'
                      : 'bg-white/5 border border-white/10 text-white focus:border-white/25'
                  }`}
                  placeholder="#D0021B"
                  maxLength={7}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
