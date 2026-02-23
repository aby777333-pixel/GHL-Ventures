import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const StaffClient = dynamic(
  () => import('@/components/staff/StaffClient'),
  { ssr: false }
)

export default function StaffPage() {
  return (
    <ErrorBoundary theme="dark" fallbackTitle="Staff Portal Error">
      <StaffClient />
    </ErrorBoundary>
  )
}
