/* ─────────────────────────────────────────────────────────────
   Query Client — Retry wrapper for Supabase queries

   Provides automatic retry with exponential backoff for
   transient failures. Integrates with errorHandler for
   user-friendly error messages.
   ───────────────────────────────────────────────────────────── */

import { parseError, withRetry, type AppError } from './errorHandler'
import { queryCache, type CacheTTL } from './cache'

// ── Query Options ───────────────────────────────────────────

interface QueryOptions {
  /** Cache key — if provided, caches the result */
  cacheKey?: string
  /** Cache TTL in ms */
  cacheTTL?: number
  /** Max retry attempts (default: 3) */
  retries?: number
  /** Base delay between retries in ms (default: 500) */
  retryDelay?: number
  /** Label for logging */
  label?: string
  /** Skip cache and force fresh fetch */
  fresh?: boolean
}

// ── Query Result ────────────────────────────────────────────

interface QueryResult<T> {
  data: T | null
  error: AppError | null
  fromCache: boolean
}

// ── Execute Query ───────────────────────────────────────────

export async function executeQuery<T>(
  fetcher: () => Promise<T>,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const {
    cacheKey,
    cacheTTL,
    retries = 3,
    retryDelay = 500,
    label = 'query',
    fresh = false,
  } = options

  // Check cache first (unless fresh is requested)
  if (cacheKey && !fresh) {
    const cached = queryCache.get<T>(cacheKey)
    if (cached !== null) {
      return { data: cached, error: null, fromCache: true }
    }
  }

  try {
    const data = await withRetry(fetcher, {
      maxRetries: retries,
      baseDelay: retryDelay,
      label,
    })

    // Store in cache
    if (cacheKey && data !== null && data !== undefined) {
      queryCache.set(cacheKey, data, cacheTTL)
    }

    return { data, error: null, fromCache: false }
  } catch (err) {
    const appError = parseError(err)
    console.warn(`[queryClient] ${label} failed:`, appError.userMessage)
    return { data: null, error: appError, fromCache: false }
  }
}

// ── Mutation Helper ─────────────────────────────────────────

interface MutationOptions {
  /** Cache keys to invalidate on success */
  invalidateKeys?: string[]
  /** Cache key prefixes to invalidate */
  invalidatePrefixes?: string[]
  /** Label for logging */
  label?: string
}

export async function executeMutation<T>(
  mutator: () => Promise<T>,
  options: MutationOptions = {}
): Promise<{ data: T | null; error: AppError | null }> {
  const { invalidateKeys = [], invalidatePrefixes = [], label = 'mutation' } = options

  try {
    const data = await mutator()

    // Invalidate caches on success
    invalidateKeys.forEach(key => queryCache.invalidate(key))
    invalidatePrefixes.forEach(prefix => queryCache.invalidatePrefix(prefix))

    return { data, error: null }
  } catch (err) {
    const appError = parseError(err)
    console.warn(`[queryClient] ${label} failed:`, appError.userMessage)
    return { data: null, error: appError }
  }
}

// ── Batch Query ─────────────────────────────────────────────

export async function batchQueries<T extends Record<string, any>>(
  queries: Record<keyof T, () => Promise<any>>
): Promise<{ data: Partial<T>; errors: Record<string, AppError> }> {
  const keys = Object.keys(queries) as (keyof T)[]
  const data: Partial<T> = {}
  const errors: Record<string, AppError> = {}

  const results = await Promise.allSettled(
    keys.map(async key => {
      const fetcher = queries[key]
      try {
        const result = await fetcher()
        return { key, result }
      } catch (err) {
        throw { key, error: parseError(err) }
      }
    })
  )

  results.forEach((result, index) => {
    const key = keys[index] as string
    if (result.status === 'fulfilled') {
      (data as any)[result.value.key] = result.value.result
    } else {
      const reason = result.reason as { key: string; error: AppError }
      errors[reason.key] = reason.error
    }
  })

  return { data, errors }
}
