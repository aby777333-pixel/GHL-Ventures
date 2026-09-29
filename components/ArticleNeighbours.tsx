import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

/* "Previous / Next article" links, rendered into the HTML at build time.
   Every article links to its neighbours by publish date, so each one has at
   least two inbound links besides its hub listing — most used to have only
   the hub (Pulse: LINKING_WEAK). Deliberately no heading tags, so it never
   affects a page's heading outline. Renders nothing without neighbours. */
export interface Neighbour { href: string; title: string }

export default function ArticleNeighbours({
  prev, next, className = '',
}: { prev?: Neighbour | null; next?: Neighbour | null; className?: string }) {
  if (!prev && !next) return null
  return (
    <nav aria-label="More articles" className={`grid sm:grid-cols-2 gap-4 ${className}`}>
      {prev ? (
        <Link href={prev.href} className="group block rounded-xl border border-gray-200 p-4 hover:border-brand-red transition-colors">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Previous article
          </span>
          <span className="block text-sm font-semibold text-brand-black group-hover:text-brand-red transition-colors line-clamp-2">
            {prev.title}
          </span>
        </Link>
      ) : <span className="hidden sm:block" />}
      {next && (
        <Link href={next.href} className="group block rounded-xl border border-gray-200 p-4 hover:border-brand-red transition-colors sm:text-right">
          <span className="flex items-center sm:justify-end gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Next article <ArrowRight className="w-3.5 h-3.5" />
          </span>
          <span className="block text-sm font-semibold text-brand-black group-hover:text-brand-red transition-colors line-clamp-2">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  )
}

/** Neighbours of `slug` in a newest-first list: previous = older, next = newer. */
export function neighboursIn<T extends { slug: string; title: string }>(
  list: T[], slug: string, hrefFor: (slug: string) => string,
): { prev: Neighbour | null; next: Neighbour | null } {
  const i = list.findIndex((p) => p.slug === slug)
  if (i < 0) return { prev: null, next: null }
  const older = list[i + 1], newer = list[i - 1]
  return {
    prev: older ? { href: hrefFor(older.slug), title: older.title } : null,
    next: newer ? { href: hrefFor(newer.slug), title: newer.title } : null,
  }
}
