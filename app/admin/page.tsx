import dynamic from 'next/dynamic'

const AdminClient = dynamic(
  () => import('@/components/admin/AdminClient'),
  { ssr: false }
)

export default function AdminPage() {
  return <AdminClient />
}
