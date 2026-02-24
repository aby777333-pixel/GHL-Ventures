import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const AgentClient = dynamic(
  () => import('@/components/agent/AgentClient'),
  { ssr: false }
)

export function generateStaticParams() {
  return [
    { tab: ['overview'] },
    { tab: ['deals'] },
    { tab: ['commissions'] },
    { tab: ['documents'] },
    { tab: ['leads'] },
    { tab: ['profile'] },
    { tab: ['settings'] },
  ]
}

export default function AgentTabPage() {
  return (
    <ErrorBoundary theme="light" fallbackTitle="Agent Portal Error">
      <AgentClient />
    </ErrorBoundary>
  )
}
