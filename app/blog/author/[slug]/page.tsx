import TaxonomyView from '@/components/blog/TaxonomyView'
import { getAuthors, getAuthorBySlug } from '@/lib/blog/cmsService'

const SITE_URL = 'https://ghlindiaventures.com'

export async function generateStaticParams() {
  const authors = await getAuthors()
  return authors.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const author = await getAuthorBySlug(params.slug)
  const name = author?.name || params.slug.replace(/-/g, ' ')
  const title = `${name} | Author | GHL India Ventures`
  const description = author?.bio || `Articles written by ${name} for GHL India Ventures.`
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog/author/${params.slug}` },
    openGraph: {
      title, description, type: 'profile',
      url: `${SITE_URL}/blog/author/${params.slug}`,
      siteName: 'GHL India Ventures', locale: 'en_IN',
    },
  }
}

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const author = await getAuthorBySlug(params.slug)

  const personSchema = author
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: author.name,
        ...(author.title ? { jobTitle: author.title } : {}),
        ...(author.bio ? { description: author.bio } : {}),
        ...(author.avatar_url ? { image: author.avatar_url } : {}),
        url: `${SITE_URL}/blog/author/${author.slug}`,
        worksFor: { '@type': 'Organization', name: 'GHL India Ventures', url: SITE_URL },
        ...(author.linkedin_url || author.twitter_url
          ? { sameAs: [author.linkedin_url, author.twitter_url].filter(Boolean) }
          : {}),
      }
    : null

  return (
    <>
      {personSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      )}
      <TaxonomyView kind="author" slug={params.slug} />
    </>
  )
}
