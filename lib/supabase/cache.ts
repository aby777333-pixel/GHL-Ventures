/* ─────────────────────────────────────────────────────────────
   Client-Side Cache — TTL-based caching for Supabase queries

   Reduces redundant API calls for frequently accessed data.
   Each cache entry expires after a configurable TTL.
   ───────────────────────────────────────────────────────────── */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL: number

  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL
  }

  /** Get cached data if not expired */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /** Store data with optional custom TTL */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  /** Invalidate a specific cache entry */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /** Invalidate all entries matching a prefix */
  invalidatePrefix(prefix: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.startsWith(prefix)) this.cache.delete(key)
    })
  }

  /** Clear entire cache */
  clear(): void {
    this.cache.clear()
  }

  /** Get cache stats */
  stats(): { entries: number; keys: string[] } {
    // Clean expired entries first
    const now = Date.now()
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      const entry = this.cache.get(key)
      if (entry && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    })

    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// ── Singleton instance ──────────────────────────────────────
export const queryCache = new QueryCache()

// ── Cached query wrapper ────────────────────────────────────
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(key)
  if (cached !== null) return cached

  // Fetch fresh data
  const data = await fetcher()
  queryCache.set(key, data, ttl)
  return data
}

// ── Pre-defined cache key generators ────────────────────────
export const CacheKeys = {
  clients: () => 'admin:clients',
  leads: () => 'admin:leads',
  employees: () => 'admin:employees',
  invoices: () => 'admin:invoices',
  expenses: () => 'admin:expenses',
  tickets: (portal?: string) => `${portal || 'all'}:tickets`,
  tasks: (portal?: string) => `${portal || 'all'}:tasks`,
  notifications: (userId?: string) => `notifications:${userId || 'all'}`,
  blogPosts: (published?: boolean) => `blog:${published ? 'published' : 'all'}`,
  siteSettings: () => 'settings:all',
  kbArticles: () => 'staff:kb-articles',
  announcements: () => 'staff:announcements',
  portfolio: (clientId: string) => `dashboard:portfolio:${clientId}`,
  transactions: (clientId: string) => `dashboard:transactions:${clientId}`,
  messages: (clientId: string) => `dashboard:messages:${clientId}`,
  aiHistory: (portal: string) => `ai:history:${portal}`,
}

// ── Cache TTL presets (in milliseconds) ─────────────────────
export const CacheTTL = {
  SHORT: 30 * 1000,       // 30 seconds — real-time-ish data
  MEDIUM: 5 * 60 * 1000,  // 5 minutes — standard queries
  LONG: 30 * 60 * 1000,   // 30 minutes — rarely changing data
  HOUR: 60 * 60 * 1000,   // 1 hour — static-ish data
}
