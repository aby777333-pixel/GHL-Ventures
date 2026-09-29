'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EducationRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/education/insights')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-gray-400 text-sm font-normal tracking-normal">Redirecting to Education Insights…</h1>
    </div>
  )
}
