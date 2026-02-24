import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const InvestorClient = dynamic(
  () => import('@/components/investor/InvestorClient'),
  { ssr: false }
)

export function generateStaticParams() {
  return [
    { tab: ['overview'] },
    { tab: ['portfolio'] },
    { tab: ['documents'] },
    { tab: ['reports'] },
    { tab: ['communications'] },
    { tab: ['profile'] },
    { tab: ['settings'] },
  ]
}

export default function InvestorTabPage() {
  return (
    <ErrorBoundary theme="light" fallbackTitle="Investor Portal Error">
      <InvestorClient />
    </ErrorBoundary>
  )
}
