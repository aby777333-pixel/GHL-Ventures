import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const AdminClient = dynamic(
  () => import('@/components/admin/AdminClient'),
  { ssr: false }
)

export default function AdminPage() {
  return (
    <ErrorBoundary theme="dark" fallbackTitle="Admin Portal Error">
      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
        <AdminClient />
      </Suspense>
    </ErrorBoundary>
  )
}
