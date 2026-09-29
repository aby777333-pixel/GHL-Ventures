import TaxonomyView from '@/components/blog/TaxonomyView'
import { getTags } from '@/lib/blog/cmsService'

const SITE_URL = 'https://ghlindiaventures.com'

export async function generateStaticParams() {
  const tags = await getTags()
  return tags.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const pretty = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  // Distinct from the category pattern ("<Name> | Insights | …"): a tag and a
  // category can share a name (real-estate, startups), which produced
  // identical <title>s on two URLs (Pulse: TITLE_DUPLICATE).
  const title = `Tagged: ${pretty} | GHL India Ventures Insights`
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
