import dynamic from 'next/dynamic'

const StaffClient = dynamic(
  () => import('@/components/staff/StaffClient'),
  { ssr: false }
)

export default function StaffPage() {
  return <StaffClient />
}
