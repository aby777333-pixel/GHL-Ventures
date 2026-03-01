import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const StaffClient = dynamic(
  () => import('@/components/staff/StaffClient'),
  { ssr: false }
)

export default function StaffPage() {
  return (
    <ErrorBoundary theme="dark" fallbackTitle="Staff Portal Error">
      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
        <StaffClient />
      </Suspense>
    </ErrorBoundary>
  )
}
