import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ALL_STAFF_TAB_PARAMS } from '@/lib/staff/staffConstants'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const StaffClient = dynamic(
  () => import('@/components/staff/StaffClient'),
  { ssr: false }
)

export function generateStaticParams() {
  return ALL_STAFF_TAB_PARAMS
}

export default function StaffTabPage() {
  return (
    <ErrorBoundary theme="dark" fallbackTitle="Staff Portal Error">
      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
        <StaffClient />
      </Suspense>
    </ErrorBoundary>
  )
}
