'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic shell for /blog/<slug> URLs that don't have a pre-built static
// page (i.e. blog posts created in Supabase after the last deploy). The
// netlify.toml redirect rewrites /blog/* → /blog-post/index.html when no
// static file matches, and this component reads the real slug back out
// of window.location.pathname before delegating to DynamicBlogViewer.
const DynamicBlogViewer = dynamic(
  () => import('@/app/blog/[slug]/DynamicBlogViewer'),
  { ssr: false },
)

export default function BlogPostShell() {
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const parts = window.location.pathname.split('/').filter(Boolean)
    // /blog/<slug>/  → ['blog', '<slug>'] ; /blog-post/  → ['blog-post']
    // Only resolve a slug for the /blog/* shape; if someone hits the
    // shell URL directly there's no slug to load.
    if (parts[0] === 'blog' && parts[1]) {
      setSlug(decodeURIComponent(parts[1]))
    } else {
      setSlug('')
    }
  }, [])

  if (slug === null) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!slug) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-white mb-2">Article Not Found</h1>
          <p className="text-gray-400 mb-6">The article you are looking for could not be located.</p>
          <a href="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
            Back to Blog
          </a>
        </div>
      </div>
    )
  }

  return <DynamicBlogViewer slug={slug} />
}
