'use client'

/* ─────────────────────────────────────────────────────────────
   Dark dropdown for the CMS.

   Replaces the native <select>. Chrome on Windows draws the option
   popup with the OS widget and ignores author styling on <option>,
   so the dark theme produced white text on a white popup — the list
   looked empty. CSS could not reliably fix that, so the list is
   rendered as real elements we control.

   The popup is positioned fixed and carries `admin-portal` for two
   reasons: it escapes the panels' `overflow-hidden`, and globals.css
   hides unexempted `.fixed` elements inside the admin portal.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface CmsSelectOption {
  value: string
  label: string
  /** renders as a child of the option above it */
  indent?: boolean
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: CmsSelectOption[]
  placeholder?: string
  className?: string
  ariaLabel?: string
  disabled?: boolean
}

export default function CmsSelect({
  value, onChange, options, placeholder = 'Select…', className = '', ariaLabel, disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const [active, setActive] = useState(0)
  const btnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const place = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const below = window.innerHeight - r.bottom
    const wantsAbove = below < 240 && r.top > below
    setRect({
      top: wantsAbove ? Math.max(8, r.top - Math.min(280, options.length * 38 + 12)) : r.bottom + 4,
      left: r.left,
      width: r.width,
    })
  }, [options.length])

  useLayoutEffect(() => { if (open) place() }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return
      if (listRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const opt = options[active]
        if (opt) { onChange(opt.value); setOpen(false); btnRef.current?.focus() }
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, options, active, onChange, place])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return
          setActive(Math.max(0, options.findIndex((o) => o.value === value)))
          setOpen((o) => !o)
        }}
        className={`w-full flex justify-between items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border text-sm text-left transition-colors disabled:opacity-50 ${
          open ? 'border-brand-red' : 'border-white/10 hover:border-white/20'
        } ${className}`}
        style={{ color: '#FFFFFF' }}
      >
        <span className={`truncate ${selected ? '' : 'text-white/40'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && rect && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="admin-portal fixed z-[300] max-h-72 overflow-y-auto rounded-lg border border-white/15 shadow-2xl py-1"
          style={{
            top: rect.top, left: rect.left, width: rect.width,
            backgroundColor: '#161A1D',
          }}
        >
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>No options</p>
          )}
          {options.map((o, i) => {
            const isSel = o.value === value
            return (
              <button
                key={o.value || `opt-${i}`}
                type="button"
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => { onChange(o.value); setOpen(false); btnRef.current?.focus() }}
                className="w-full flex justify-start items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                style={{
                  color: '#FFFFFF',
                  backgroundColor: i === active ? '#BA181B' : 'transparent',
                  paddingLeft: o.indent ? '1.75rem' : undefined,
                }}
              >
                <span className="truncate flex-1">{o.label}</span>
                {isSel && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FFFFFF' }} />}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
