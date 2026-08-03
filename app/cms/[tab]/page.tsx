import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const CmsClient = dynamic(() => import('@/components/cms/CmsClient'), { ssr: false })

export function generateStaticParams() {
  // Tabs of the standalone content console. Listed explicitly because
  // the Netlify mirror is a static export and needs every route
  // pre-generated. Keep in sync with NAV in components/cms/CmsClient.
  return [
    'media', 'categories', 'authors', 'comments', 'reports',
    'subscribers', 'analytics', 'seo', 'trash',
  ].map((tab) => ({ tab }))
}

export default function CmsTabPage({ params }: { params: { tab: string } }) {
  return (
    <ErrorBoundary theme="dark" fallbackTitle="Content Studio Error">
      <Suspense fallback={<div className="min-h-screen bg-[#0B090A]" />}>
        <CmsClient subTab={params.tab} />
      </Suspense>
    </ErrorBoundary>
  )
}
