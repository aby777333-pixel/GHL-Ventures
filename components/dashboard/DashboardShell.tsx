'use client'

import { useEffect } from 'react'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('dashboard-active')

    const hideSelectors = ['nav', 'footer', '.skip-to-content']
    const hidden: HTMLElement[] = []

    hideSelectors.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (el.closest('.dashboard-root')) return
        el.style.display = 'none'
        hidden.push(el)
      })
    })

    // Hide fixed/absolute widgets EXCEPT chat, video-call, direct-call, voice
    const dashRoot = document.querySelector('.dashboard-root')
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      if (dashRoot && dashRoot.contains(el)) return
      if (el.contains(dashRoot)) return

      const style = window.getComputedStyle(el)
      if (style.position === 'fixed' || style.position === 'absolute') {
        const cn = (el.className || '').toLowerCase()
        const id = (el.id || '').toLowerCase()
        const keep =
          cn.includes('chat') || id.includes('chat') ||
          cn.includes('video') || id.includes('video') ||
          cn.includes('direct') || id.includes('direct') ||
          cn.includes('voice') || id.includes('voice') ||
          el.querySelector('[class*="chat" i], [class*="video" i], [class*="direct" i], [class*="voice" i]')

        if (!keep) {
          el.setAttribute('data-dash-hidden', 'true')
          el.style.display = 'none'
          hidden.push(el)
        }
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
