/* Search results truncate titles past ~60 characters (Pulse: TITLE_LONG).
   Page titles are "<topic><brand suffix>"; when the topic is long, the
   suffix is what gets cut off, so fall back to a shorter suffix — or none —
   instead of letting the whole title overflow. The topic is never altered. */
export const TITLE_MAX = 60

export function fitTitle(topic: string, suffixes: string[]): string {
  const base = topic.trim()
  for (const s of suffixes) {
    if ((base + s).length <= TITLE_MAX) return base + s
  }
  return base
}
