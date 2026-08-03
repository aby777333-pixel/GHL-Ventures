'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { subscribeToNewsletter } from '@/lib/blog/cmsService'

interface Props {
  variant?: 'band' | 'inline' | 'card'
  heading?: string
  subheading?: string
  source?: string
}

export default function NewsletterSignup({
  variant = 'band',
  heading = 'Financial Intelligence, Delivered',
  subheading = 'Join sophisticated investors receiving our research on India’s alternative investment landscape. No noise, no spam.',
  source = 'blog',
}: Props) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'busy') return
    setState('busy')
    const res = await subscribeToNewsletter(email, name, source)
    setMessage(res.message)
    setState(res.ok ? 'done' : 'error')
    if (res.ok) { setEmail(''); setName('') }
  }

  const form = (
    <form onSubmit={onSubmit} className="w-full">
      {state === 'done' ? (
        <div className="flex items-center gap-2.5 text-sm text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              aria-label="Your name"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Email address"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <button
              type="submit"
              disabled={state === 'busy'}
              className="px-6 py-3 bg-brand-red hover:bg-brand-red-deep disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {state === 'busy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Subscribe
            </button>
          </div>
          {state === 'error' && <p className="mt-2 text-xs text-brand-red-light">{message}</p>}
          <p className="mt-3 text-[11px] text-white/40">
            We use your email only to send our research. Unsubscribe at any time.
          </p>
        </>
      )}
    </form>
  )

  if (variant === 'inline') {
    return (
      <div className="bg-brand-black rounded-2xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-white mb-1.5">{heading}</h3>
        <p className="text-sm text-white/60 mb-5 max-w-xl">{subheading}</p>
        {form}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="bg-brand-black rounded-2xl p-6">
        <Mail className="w-6 h-6 text-brand-red mb-3" />
        <h3 className="text-base font-bold text-white mb-1.5">{heading}</h3>
        <p className="text-xs text-white/60 mb-4">{subheading}</p>
        {form}
      </div>
    )
  }

  return (
    <section className="bg-brand-black py-14 md:py-20">
      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-red/15 border border-brand-red/25 mb-5">
            <Mail className="w-5 h-5 text-brand-red" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{heading}</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto leading-relaxed">{subheading}</p>
          <div className="max-w-2xl mx-auto text-left">{form}</div>
        </div>
      </div>
    </section>
  )
}
