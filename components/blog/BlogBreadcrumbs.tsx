import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Crumb { label: string; href?: string }

const SITE_URL = 'https://ghlindiaventures.com'

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  }
}

export default function BlogBreadcrumbs({ crumbs, tone = 'dark' }: { crumbs: Crumb[]; tone?: 'dark' | 'light' }) {
  const base = tone === 'dark' ? 'text-gray-400' : 'text-gray-500'
  const hover = tone === 'dark' ? 'hover:text-white' : 'hover:text-brand-black'
  const current = tone === 'dark' ? 'text-white/70' : 'text-brand-black'

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center flex-wrap gap-1 text-xs ${base}`}>
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" />}
          {c.href && i < crumbs.length - 1 ? (
            <Link href={c.href} className={`${hover} transition-colors truncate`}>{c.label}</Link>
          ) : (
            <span className={`${current} truncate`}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
