import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const CmsClient = dynamic(() => import('@/components/cms/CmsClient'), { ssr: false })

export default function CmsPage() {
  return (
    <ErrorBoundary theme="dark" fallbackTitle="Content Studio Error">
      <Suspense fallback={<div className="min-h-screen bg-[#0B090A]" />}>
        <CmsClient />
      </Suspense>
    </ErrorBoundary>
  )
}
