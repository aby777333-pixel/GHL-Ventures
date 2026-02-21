'use client'

import { useEffect } from 'react'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('dashboard-active')
    return () => {
      document.body.classList.remove('dashboard-active')
    }
  }, [])

  return <div className="dashboard-root">{children}</div>
}
