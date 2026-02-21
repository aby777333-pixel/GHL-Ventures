import dynamic from 'next/dynamic'

const DashboardClient = dynamic(
  () => import('@/components/dashboard/DashboardClient'),
  { ssr: false }
)

export function generateStaticParams() {
  return [
    { tab: ['investments'] },
    { tab: ['invest-onboard'] },
    { tab: ['portfolio'] },
    { tab: ['kyc'] },
    { tab: ['transactions'] },
    { tab: ['messages'] },
    { tab: ['support'] },
    { tab: ['calculators'] },
    { tab: ['referrals'] },
    { tab: ['profile'] },
    { tab: ['settings'] },
  ]
}

export default function DashboardPage() {
  return <DashboardClient />
}
