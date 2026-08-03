'use client'

/* Free research reports — ported from blog.ghlindiaventures.com so
   nothing is lost in the subdomain cutover. Gated downloads capture
   a lead into blog_report_leads before revealing the PDF. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Download, X, Loader2, CheckCircle2, ArrowLeft, Lock,
} from 'lucide-react'
import BlogBreadcrumbs from '@/components/blog/BlogBreadcrumbs'
import NewsletterSignup from '@/components/blog/NewsletterSignup'
import PlaceholderImage from '@/components/PlaceholderImage'
import { getReports, type CmsReport } from '@/lib/blog/cmsService'
import { supabase as _sb, isSupabaseConfigured } from '@/lib/supabase/client'

const sb = _sb as any

export default function BlogReportsPage() {
  const [reports, setReports] = useState<CmsReport[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<CmsReport | null>(null)

  useEffect(() => {
    let alive = true
    getReports().then((r) => { if (alive) { setReports(r); setLoading(false) } })
    return () => { alive = false }
  }, [])

  return (
    <>
      <section className="pt-32 pb-12 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-5">
            <BlogBreadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: 'Reports' }]} />
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-[11px] font-semibold uppercase tracking-[0.18em] mb-4">
            <FileText className="w-3.5 h-3.5" /> Research
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3">Free research reports</h1>
          <p className="text-base text-gray-300 max-w-2xl leading-relaxed">
            In-depth PDF research on India&rsquo;s alternative investment market — AIF strategy, distressed
            real estate and the mechanics of institutional value creation.
          </p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 bg-brand-offwhite rounded-2xl">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No reports published yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((r) => (
                <article key={r.id} className="flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow h-full">
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                    {r.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover_image} alt={r.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <PlaceholderImage theme="fund" aspectRatio="aspect-[16/10]" label={r.title} className="rounded-none" />
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-base font-bold text-brand-black leading-snug mb-2 blog-clamp-2">{r.title}</h2>
                    {r.description && (
                      <p className="text-sm text-gray-600 blog-clamp-3 mb-4 flex-1 whitespace-pre-line">{r.description}</p>
                    )}
                    <button
                      onClick={() => setActive(r)}
                      className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-red hover:bg-brand-red-deep text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      {r.gated ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      Download report
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-12">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to all articles
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSignup source="blog-reports" />

      {active && <DownloadModal report={active} onClose={() => setActive(null)} />}
    </>
  )
}

function DownloadModal({ report, onClose }: { report: CmsReport; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  function openPdf() {
    window.open(report.pdf_url, '_blank', 'noopener,noreferrer')
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'busy') return
    setState('busy')

    if (isSupabaseConfigured()) {
      try {
        await sb.from('blog_report_leads').insert({
          name: name.trim(), email: email.trim().toLowerCase(),
          phone: phone.trim() || null, report_id: report.id, source: 'pdf_download',
        })
      } catch { /* never block the download on a capture failure */ }
      try { await sb.rpc('register_blog_report_download', { p_report_id: report.id }) } catch { /* best effort */ }
    }

    setMessage('Thank you — your report is opening in a new tab.')
    setState('done')
    openPdf()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Download ${report.title}`}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-brand-black blog-clamp-2">{report.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Free PDF · {report.pdf_filename || 'report.pdf'}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-black transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {state === 'done' ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-gray-700 mb-5">{message}</p>
            <div className="flex gap-3">
              <button onClick={openPdf} className="flex-1 px-4 py-2.5 bg-brand-red hover:bg-brand-red-deep text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Open again
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-5 space-y-3">
            <p className="text-sm text-gray-600 mb-1">
              Tell us where to send future research and the download will start straight away.
            </p>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Full name" aria-label="Full name"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address" aria-label="Email address"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)" aria-label="Phone number"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <button
              type="submit" disabled={state === 'busy'}
              className="w-full px-4 py-3 bg-brand-red hover:bg-brand-red-deep disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              {state === 'busy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Get the report
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              We never share your details. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
