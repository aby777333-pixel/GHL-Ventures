'use client'

/* ─────────────────────────────────────────────────────────────
   Draft preview — /cms/preview?slug=…

   The Preview button used to point at the public article URL, which
   only serves published posts, so an unpublished draft returned
   "Article Not Found". This renders the SAME ArticleView the public
   page uses, but reads the row with allowDraft, which RLS permits
   for blog editors (blog_posts_public_read allows is_blog_editor()).

   A query parameter rather than a dynamic route on purpose: the
   Netlify mirror is a static export, so /cms/preview/[slug] could not
   exist for a draft created after the last build. One static page
   plus ?slug= works on both hosts.
   ───────────────────────────────────────────────────────────── */

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react'
import ArticleView from '@/app/blog/[slug]/ArticleView'
import { getPostBySlug, type CmsPost } from '@/lib/blog/cmsService'
import { getCmsSession } from '@/lib/supabase/cmsAuthService'

function PreviewInner() {
  const params = useSearchParams()
  const slug = params.get('slug') || ''
  const [post, setPost] = useState<CmsPost | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'denied'>('loading')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!slug) { setState('missing'); return }
      // Drafts are only readable by a signed-in editor, so say that plainly
      // rather than repeating a misleading "not found".
      const session = await getCmsSession()
      if (!alive) return
      if (!session) { setState('denied'); return }

      const found = await getPostBySlug(slug, { allowDraft: true })
      if (!alive) return
      if (!found) { setState('missing'); return }
      setPost(found)
      setState('ready')
    })()
    return () => { alive = false }
  }, [slug])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
      </div>
    )
  }

  if (state !== 'ready' || !post) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <BookOpen className="w-14 h-14 text-gray-700 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {state === 'denied' ? 'Sign in to preview' : 'Nothing to preview yet'}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {state === 'denied'
              ? 'Draft previews are only visible to signed-in content accounts.'
              : 'Save the article first — a preview needs a saved draft to read.'}
          </p>
          <Link
            href="/cms"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl text-sm font-semibold hover:bg-brand-red-deep transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Content Studio
          </Link>
        </div>
      </div>
    )
  }

  return <ArticleView post={post} preview />
}

export default function CmsPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-black" />}>
      <PreviewInner />
    </Suspense>
  )
}
