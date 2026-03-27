/* ─────────────────────────────────────────────────────────────
   Centralized Auth Error Messages
   Maps every auth failure state to a specific, user-friendly message.
   NO generic "Something went wrong" anywhere.
   ───────────────────────────────────────────────────────────── */

export const AUTH_ERRORS = {
  // Sign-in errors
  NO_ACCOUNT: 'No account found. Please sign up first.',
  INVALID_CREDENTIALS: 'Incorrect email or password. Please try again.',
  EMAIL_NOT_REGISTERED: 'Please sign in using your registered email address.',
  ACCOUNT_UNVERIFIED: 'Your account is pending verification. Please check your email to verify your account.',
  ACCOUNT_INACTIVE: 'Your account is currently inactive. Please contact support.',
  ACCOUNT_LOCKED: 'Your account has been temporarily locked due to too many failed attempts. Please try again in 15 minutes.',

  // Sign-up errors
  EMAIL_EXISTS: 'This email is already registered. Please sign in to continue.',
  PHONE_EXISTS: 'This phone number is already linked to another account.',
  SIGNUP_FAILED: 'Registration failed. Please check your details and try again.',
  WEAK_PASSWORD: 'Password must be at least 8 characters long.',
  PASSWORDS_MISMATCH: 'Passwords do not match.',

  // OAuth / Google errors
  GOOGLE_NO_ACCOUNT: 'No account found for this Google email. Redirecting to sign up...',
  GOOGLE_UNVERIFIED: 'Your account is pending verification. Please complete email verification first.',
  GOOGLE_DISABLED: 'Google sign-in is not yet enabled. Please use email and password.',
  OAUTH_FAILED: 'Social sign-in failed. Please try another method.',

  // OTP errors
  OTP_EXPIRED: 'This verification code has expired. Please request a new one.',
  OTP_INVALID: 'Incorrect verification code.',
  OTP_INVALID_WITH_ATTEMPTS: (remaining: number) =>
    `Incorrect verification code. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
  OTP_LOCKED: 'Too many incorrect attempts. Please try again in 15 minutes.',
  OTP_COOLDOWN: (seconds: number) =>
    `Please wait ${seconds} second${seconds !== 1 ? 's' : ''} before requesting a new code.`,
  OTP_SEND_FAILED: 'Failed to send verification code. Please try again.',

  // Password reset
  RESET_UNVERIFIED: 'Please verify your account before resetting your password.',
  RESET_EMAIL_REQUIRED: 'Please enter your email address first, then click Forgot Password.',
  RESET_SENT: 'Password reset email sent! Check your inbox.',
  RESET_FAILED: 'Failed to send reset email. Please try again.',

  // Session
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  SESSION_INVALID: 'Invalid session. Please sign in again.',

  // Rate limiting
  RATE_LIMITED: 'Too many requests. Please try again later.',

  // Service
  SERVICE_UNAVAILABLE: 'Authentication service is temporarily unavailable. Please try again later.',
  CONNECTION_ERROR: 'Unable to connect. Please check your internet and try again.',

  // Fallback (should rarely be used)
  GENERIC: 'Unable to process your request. Please try again or contact support at info@ghlindiaventures.com.',
} as const

/**
 * Maps Supabase error messages to user-friendly messages.
 * Supabase returns various error strings — this normalizes them.
 */
export function mapSupabaseError(error: string | null | undefined): string {
  if (!error) return AUTH_ERRORS.GENERIC

  const e = error.toLowerCase()

  // Email/password errors
  if (e.includes('invalid login credentials') || e.includes('invalid email or password'))
    return AUTH_ERRORS.INVALID_CREDENTIALS
  if (e.includes('email not confirmed') || e.includes('email_not_confirmed'))
    return AUTH_ERRORS.ACCOUNT_UNVERIFIED
  if (e.includes('user already registered') || e.includes('already been registered'))
    return AUTH_ERRORS.EMAIL_EXISTS
  if (e.includes('duplicate key') && e.includes('email'))
    return AUTH_ERRORS.EMAIL_EXISTS
  if (e.includes('duplicate key') && e.includes('phone'))
    return AUTH_ERRORS.PHONE_EXISTS

  // Password errors
  if (e.includes('password') && (e.includes('weak') || e.includes('short') || e.includes('at least')))
    return AUTH_ERRORS.WEAK_PASSWORD

  // OTP errors
  if (e.includes('otp') && e.includes('expired'))
    return AUTH_ERRORS.OTP_EXPIRED
  if (e.includes('otp') && (e.includes('invalid') || e.includes('incorrect')))
    return AUTH_ERRORS.OTP_INVALID

  // Rate limiting
  if (e.includes('rate') || e.includes('too many') || e.includes('429'))
    return AUTH_ERRORS.RATE_LIMITED

  // Session errors
  if (e.includes('session') && e.includes('expired'))
    return AUTH_ERRORS.SESSION_EXPIRED
  if (e.includes('refresh_token') || e.includes('not authenticated'))
    return AUTH_ERRORS.SESSION_EXPIRED

  // Network errors
  if (e.includes('fetch') || e.includes('network') || e.includes('failed to fetch'))
    return AUTH_ERRORS.CONNECTION_ERROR

  // Provider not enabled
  if (e.includes('provider') && e.includes('not enabled'))
    return AUTH_ERRORS.GOOGLE_DISABLED
  // Phone provider not configured (OTP)
  if (e.includes('unsupported') && e.includes('phone'))
    return 'OTP login via SMS is not yet available. Please use email and password to sign in.'
  if (e.includes('phone') && e.includes('provider'))
    return 'OTP login via SMS is not yet available. Please use email and password to sign in.'

  // Return the original error if it's reasonably user-friendly, otherwise generic
  if (error.length < 100 && !e.includes('unexpected') && !e.includes('internal'))
    return error

  return AUTH_ERRORS.GENERIC
}
