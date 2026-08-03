import TaxonomyView from '@/components/blog/TaxonomyView'
import { getTags } from '@/lib/blog/cmsService'

const SITE_URL = 'https://ghlindiaventures.com'

export async function generateStaticParams() {
  const tags = await getTags()
  return tags.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const pretty = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  const title = `${pretty} | Insights | GHL India Ventures`
  const description = `Every GHL India Ventures article tagged ${pretty}.`
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog/tag/${params.slug}` },
    openGraph: {
      title, description, type: 'website',
      url: `${SITE_URL}/blog/tag/${params.slug}`,
      siteName: 'GHL India Ventures', locale: 'en_IN',
    },
  }
}

export default function TagPage({ params }: { params: { slug: string } }) {
  return <TaxonomyView kind="tag" slug={params.slug} />
}
