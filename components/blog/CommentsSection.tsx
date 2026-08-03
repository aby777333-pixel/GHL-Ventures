'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Loader2, CheckCircle2 } from 'lucide-react'
import { getApprovedComments, submitComment, formatShortDate } from '@/lib/blog/cmsService'

interface Props {
  postId: string
  enabled: boolean
}

export default function CommentsSection({ postId, enabled }: Props) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!enabled || !postId) { setLoading(false); return }
    let alive = true
    getApprovedComments(postId).then((c) => { if (alive) { setComments(c); setLoading(false) } })
    return () => { alive = false }
  }, [postId, enabled])

  if (!enabled) return null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'busy') return
    setState('busy')
    const res = await submitComment(postId, name, email, body)
    setMessage(res.message)
    setState(res.ok ? 'done' : 'error')
    if (res.ok) { setName(''); setEmail(''); setBody('') }
  }

  return (
    <section className="max-w-3xl mx-auto mt-14 pt-10 border-t border-gray-200">
      <h2 className="flex items-center gap-2 text-lg font-bold text-brand-black mb-6">
        <MessageSquare className="w-5 h-5 text-brand-red" />
        Discussion {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h2>

      {loading ? (
        <div className="space-y-4 mb-8">
          {[0, 1].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : comments.length > 0 ? (
        <ul className="space-y-5 mb-10">
          {comments.map((c) => (
            <li key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-7 h-7 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {String(c.author_name || '?').charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-brand-black">{c.author_name}</span>
                <span className="text-[11px] text-gray-400">{formatShortDate(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 mb-8">Be the first to comment on this article.</p>
      )}

      {state === 'done' ? (
        <div className="flex items-center gap-2.5 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="bg-brand-offwhite rounded-2xl p-5 md:p-6">
          <h3 className="text-sm font-bold text-brand-black mb-4">Leave a comment</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name" aria-label="Your name"
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (not published)" aria-label="Email address"
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          <textarea
            required rows={4} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Share your perspective…" aria-label="Your comment"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-brand-red transition-colors resize-y"
          />
          {state === 'error' && <p className="mt-2 text-xs text-brand-red">{message}</p>}
          <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
            <p className="text-[11px] text-gray-500">Comments are reviewed before they appear.</p>
            <button
              type="submit" disabled={state === 'busy'}
              className="px-5 py-2.5 bg-brand-red hover:bg-brand-red-deep disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors inline-flex items-center gap-2"
            >
              {state === 'busy' && <Loader2 className="w-4 h-4 animate-spin" />}
              Post comment
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
