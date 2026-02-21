'use client'

import { useEffect } from 'react'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('dashboard-active')

    const hidden: HTMLElement[] = []

    // Hide main nav and footer (but not elements inside dashboard)
    const hideSelectors = ['nav', 'footer', '.skip-to-content']
    hideSelectors.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (el.closest('.dashboard-root')) return
        el.style.display = 'none'
        hidden.push(el)
      })
    })

    // Hide all fixed/absolute positioned elements except GHL widgets
    const dashRoot = document.querySelector('.dashboard-root')
    const widgetIds = ['ghl-chat-widget', 'ghl-video-widget', 'ghl-direct-widget', 'ghl-voice-widget']

    document.querySelectorAll<HTMLElement>('body > *').forEach((el) => {
      // Skip the dashboard root itself
      if (dashRoot && (dashRoot.contains(el) || el.contains(dashRoot))) return

      // Skip GHL widget containers (by id or data attribute)
      if (widgetIds.includes(el.id) || el.hasAttribute('data-ghl-widget')) return

      const style = window.getComputedStyle(el)
      if (style.position === 'fixed' || style.position === 'absolute') {
        el.setAttribute('data-dash-hidden', 'true')
        el.style.display = 'none'
        hidden.push(el)
      }
    })

    // Also hide deeper fixed elements but preserve widgets
    document.querySelectorAll<HTMLElement>('[style*="position: fixed"], [style*="position:fixed"]').forEach((el) => {
      if (dashRoot && dashRoot.contains(el)) return
      // Check if this element or any ancestor is a GHL widget
      if (el.closest('[data-ghl-widget]')) return
      if (widgetIds.some(id => el.id === id)) return

      // Skip elements already hidden
      if (el.getAttribute('data-dash-hidden') === 'true') return

      const style = window.getComputedStyle(el)
      if (style.display !== 'none') {
        // Double-check it's not inside a widget
        const isInWidget = el.closest('#ghl-chat-widget, #ghl-video-widget, #ghl-direct-widget, #ghl-voice-widget')
        if (isInWidget) return

        el.setAttribute('data-dash-hidden', 'true')
        el.style.display = 'none'
        hidden.push(el)
      }
    })

    return () => {
      document.body.classList.remove('dashboard-active')
      hidden.forEach((el) => {
        el.style.display = ''
        el.removeAttribute('data-dash-hidden')
      })
    }
  }, [])

  return <div className="dashboard-root">{children}</div>
}
