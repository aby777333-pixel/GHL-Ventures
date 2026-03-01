import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const DashboardClient = dynamic(
  () => import('@/components/dashboard/DashboardClient'),
  { ssr: false }
)

export default function DashboardPage() {
  return (
    <ErrorBoundary theme="light" fallbackTitle="Dashboard Error">
      <Suspense fallback={<div className="min-h-screen bg-brand-black" />}>
        <DashboardClient />
      </Suspense>
    </ErrorBoundary>
  )
}
