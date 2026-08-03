'use client'

import { useState } from 'react'
import { Linkedin, Twitter, Facebook, Link2, Check, MessageCircle, Mail } from 'lucide-react'

interface Props {
  url: string
  title: string
  excerpt?: string
  layout?: 'row' | 'column'
}

export default function ShareButtons({ url, title, excerpt = '', layout = 'row' }: Props) {
  const [copied, setCopied] = useState(false)

  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  const s = encodeURIComponent(excerpt)

  const links = [
    { name: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: 'X',        icon: Twitter,  href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { name: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${t}%20${u}` },
    { name: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'Email',    icon: Mail,     href: `mailto:?subject=${t}&body=${s}%0A%0A${u}` },
  ]

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked — nothing to do */ }
  }

  return (
    <div className={`flex items-center gap-2 ${layout === 'column' ? 'flex-col' : 'flex-wrap'}`}>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Share</span>
      {links.map(({ name, icon: Icon, href }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${name}`}
          title={`Share on ${name}`}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-brand-red hover:border-brand-red transition-colors"
        >
          <Icon className="w-4 h-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        title="Copy link"
        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-brand-black hover:border-brand-black transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
