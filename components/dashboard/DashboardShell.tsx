'use client'

import { useEffect } from 'react'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('dashboard-active')

    const hidden: HTMLElement[] = []

    // 1. Hide main site navigation, footer, and skip-link
    const hideSelectors = ['nav', 'footer', '.skip-to-content']
    hideSelectors.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (el.closest('.dashboard-root')) return
        el.style.display = 'none'
        hidden.push(el)
      })
    })

    // 2. Find ALL elements in the page and hide fixed/absolute ones
    //    EXCEPT those that are GHL widgets or inside the dashboard
    const dashRoot = document.querySelector('.dashboard-root')

    // Use querySelectorAll('*') to traverse all elements
    // But for performance, only check elements that have fixed/absolute via computed style
    // We'll target known wrappers: ScrollProgress, BackToTop, CookieConsent, SocialProofToasts, LiveVisitorCount, SpeechTranslation, CommandPalette
    const allElements = document.querySelectorAll<HTMLElement>('*')
    allElements.forEach((el) => {
      // Skip anything inside the dashboard
      if (dashRoot && dashRoot.contains(el)) return

      // Skip script, style, meta, link, etc.
      const tag = el.tagName.toLowerCase()
      if (['script', 'style', 'meta', 'link', 'head', 'html', 'body', 'noscript'].includes(tag)) return

      // Skip if it's a GHL widget or inside one
      if (el.hasAttribute('data-ghl-widget') || el.closest('[data-ghl-widget]')) return

      // Skip if already hidden
      if (el.getAttribute('data-dash-hidden') === 'true') return
      if (el.style.display === 'none') return

      // Check if this element has fixed positioning (via class or computed style)
      const hasFixedClass = el.classList.contains('fixed')
      if (!hasFixedClass) return

      // This is a fixed element outside the dashboard and not a widget — hide it
      el.setAttribute('data-dash-hidden', 'true')
      el.style.display = 'none'
      hidden.push(el)
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
