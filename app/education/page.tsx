'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EducationPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/education/insights')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Redirecting to Education Insights…</p>
    </div>
  )
}
