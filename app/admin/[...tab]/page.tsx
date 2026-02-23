import dynamic from 'next/dynamic'
import { ALL_ADMIN_TAB_PARAMS } from '@/lib/admin/adminConstants'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const AdminClient = dynamic(
  () => import('@/components/admin/AdminClient'),
  { ssr: false }
)

export function generateStaticParams() {
  return ALL_ADMIN_TAB_PARAMS
}

export default function AdminTabPage() {
  return (
    <ErrorBoundary theme="dark" fallbackTitle="Admin Portal Error">
      <AdminClient />
    </ErrorBoundary>
  )
}
