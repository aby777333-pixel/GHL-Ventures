import TaxonomyView from '@/components/blog/TaxonomyView'
import { getCategories, getCategoryBySlug } from '@/lib/blog/cmsService'

const SITE_URL = 'https://ghlindiaventures.com'

export async function generateStaticParams() {
  const cats = await getCategories()
  return cats.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const cat = await getCategoryBySlug(params.slug)
  const name = cat?.name || params.slug.replace(/-/g, ' ')
  const title = cat?.seo_title || `${name} | Insights | GHL India Ventures`
  const description =
    cat?.seo_description ||
    cat?.description ||
    `Research and analysis on ${name} from the GHL India Ventures team.`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog/category/${params.slug}` },
    openGraph: {
      title, description, type: 'website',
      url: `${SITE_URL}/blog/category/${params.slug}`,
      siteName: 'GHL India Ventures', locale: 'en_IN',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <TaxonomyView kind="category" slug={params.slug} />
}
