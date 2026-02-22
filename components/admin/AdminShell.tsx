'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/'

  useEffect(() => {
    if (!isLoginPage) {
      document.body.classList.add('admin-active')
    }
    return () => {
      document.body.classList.remove('admin-active')
    }
  }, [isLoginPage])

  if (isLoginPage) return <>{children}</>
  return <div className="admin-root">{children}</div>
}
