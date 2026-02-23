import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const AdminClient = dynamic(
  () => import('@/components/admin/AdminClient'),
  { ssr: false }
)

export default function AdminPage() {
  return (
    <ErrorBoundary theme="dark" fallbackTitle="Admin Portal Error">
      <AdminClient />
    </ErrorBoundary>
  )
}
