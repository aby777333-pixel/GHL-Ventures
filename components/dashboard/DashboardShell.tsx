'use client'

import { useEffect } from 'react'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Mark body as dashboard-active
    document.body.classList.add('dashboard-active')

    // IDs / selectors of elements we want to HIDE on the dashboard
    // We keep ChatWidget (live chat) visible
    const hideSelectors = [
      // Navbar
      'nav',
      // Footer
      'footer',
      // Skip-to-content link
      '.skip-to-content',
    ]

    // Hide matched elements
    const hidden: HTMLElement[] = []
    hideSelectors.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        // Don't hide anything inside the dashboard-root
        if (el.closest('.dashboard-root')) return
        el.style.display = 'none'
        hidden.push(el)
      })
    })

    // Hide ALL fixed/absolute positioned widgets EXCEPT the chat widget
    // and anything inside .dashboard-root
    const allElements = document.querySelectorAll<HTMLElement>('body *')
    const dashRoot = document.querySelector('.dashboard-root')

    allElements.forEach((el) => {
      // Skip elements inside dashboard
      if (dashRoot && dashRoot.contains(el)) return

      // Skip the main wrapper elements (html > body > div > ThemeProvider chain)
      if (el.contains(dashRoot)) return

      const style = window.getComputedStyle(el)
      const isFixed = style.position === 'fixed'
      const isAbsolute = style.position === 'absolute'

      if (isFixed || isAbsolute) {
        // Check if this is the chat widget - keep it
        const isChatWidget =
          el.id?.toLowerCase().includes('chat') ||
          el.className?.toLowerCase().includes('chat') ||
          el.querySelector('[class*="chat" i]') ||
          el.querySelector('[id*="chat" i]')

        if (!isChatWidget) {
          el.setAttribute('data-dash-hidden', 'true')
          el.style.display = 'none'
          hidden.push(el)
        }
      }
    })

    // Cleanup on unmount
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
