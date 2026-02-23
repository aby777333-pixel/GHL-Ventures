/* ─────────────────────────────────────────────────────────────
   Centralized Error Handler — Supabase error management

   Provides consistent error handling, retry logic, and
   user-friendly error messages across all portals.
   ───────────────────────────────────────────────────────────── */

// ── Error Types ─────────────────────────────────────────────
export interface AppError {
  code: string
  message: string
  userMessage: string
  retryable: boolean
  originalError?: unknown
}

// ── Error Codes ─────────────────────────────────────────────
const ERROR_MAP: Record<string, { userMessage: string; retryable: boolean }> = {
  // Auth errors
  'auth/invalid-login-credentials': { userMessage: 'Invalid email or password.', retryable: false },
  'auth/email-not-confirmed': { userMessage: 'Please confirm your email address.', retryable: false },
  'auth/user-not-found': { userMessage: 'No account found with this email.', retryable: false },
  'auth/too-many-requests': { userMessage: 'Too many attempts. Please try again later.', retryable: true },
  'auth/session-expired': { userMessage: 'Your session has expired. Please log in again.', retryable: false },

  // Database errors
  'PGRST301': { userMessage: 'The requested data was not found.', retryable: false },
  '23505': { userMessage: 'This record already exists.', retryable: false },
  '23503': { userMessage: 'Cannot delete — this record is referenced elsewhere.', retryable: false },
  '42501': { userMessage: 'You don\'t have permission to perform this action.', retryable: false },

  // Network errors
  'NETWORK_ERROR': { userMessage: 'Network error. Please check your connection.', retryable: true },
  'TIMEOUT': { userMessage: 'The request timed out. Please try again.', retryable: true },

  // Generic
  'UNKNOWN': { userMessage: 'An unexpected error occurred. Please try again.', retryable: true },
}

// ── Parse Supabase Error ────────────────────────────────────
export function parseError(error: unknown): AppError {
  if (!error) {
    return { code: 'UNKNOWN', message: 'Unknown error', userMessage: ERROR_MAP.UNKNOWN.userMessage, retryable: true }
  }

  const err = error as any

  // Supabase auth error
  if (err?.message?.includes('Invalid login credentials')) {
    return {
      code: 'auth/invalid-login-credentials',
      message: err.message,
      ...ERROR_MAP['auth/invalid-login-credentials'],
      originalError: error,
    }
  }

  // Supabase PostgREST error
  if (err?.code && ERROR_MAP[err.code]) {
    return {
      code: err.code,
      message: err.message || err.code,
      ...ERROR_MAP[err.code],
      originalError: error,
    }
  }

  // Network error
  if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.name === 'TypeError') {
    return {
      code: 'NETWORK_ERROR',
      message: err.message,
      ...ERROR_MAP.NETWORK_ERROR,
      originalError: error,
    }
  }

  // Generic fallback
  return {
    code: err?.code || 'UNKNOWN',
    message: err?.message || 'Unknown error',
    userMessage: err?.message || ERROR_MAP.UNKNOWN.userMessage,
    retryable: true,
    originalError: error,
  }
}

// ── Retry Wrapper ───────────────────────────────────────────
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 500, label = 'operation' } = options

  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const parsed = parseError(error)

      // Don't retry non-retryable errors
      if (!parsed.retryable || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      console.warn(`[retry] ${label} attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms…`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// ── Safe Fetch ──────────────────────────────────────────────
// Wraps an async function, returns { data, error } instead of throwing
export async function safeFetch<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: parseError(err) }
  }
}
