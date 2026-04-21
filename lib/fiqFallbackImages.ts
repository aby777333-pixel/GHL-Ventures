import type React from 'react'

/**
 * Financial IQ cover-image fallbacks.
 *
 * Any FIQ article saved without an explicit `cover_image` falls back to a
 * topic-appropriate royalty-free Unsplash image based on its category.
 * Images are all from unsplash.com, free to use under the Unsplash license.
 *
 * Used by:
 *   - /financial-iq listing cards
 *   - /financial-iq/[slug] detail page cover
 *   - Admin ContentManagerModule editor auto-fill
 *
 * Add more categories here as new ones come into use; the default entry
 * covers anything uncategorised.
 */

export const FIQ_CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  // Core categories used by FIQ_CATEGORIES in ContentManagerModule
  'Basics':         'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  'Advanced':       'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  'Strategy':       'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
  'Education':      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&q=80',
  'Tax Planning':   'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
  'Retirement':     'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=1200&q=80',
  'Insurance':      'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=1200&q=80',
  'Real Estate':    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
  'Mutual Funds':   'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=80',
  'General':        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
}

export const FIQ_DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80'

export function resolveFIQCoverImage(
  coverImage: string | null | undefined,
  category: string | null | undefined,
): string {
  if (coverImage && coverImage.trim()) return coverImage.trim()
  if (category && FIQ_CATEGORY_FALLBACK_IMAGES[category]) {
    return FIQ_CATEGORY_FALLBACK_IMAGES[category]
  }
  return FIQ_DEFAULT_FALLBACK_IMAGE
}

/**
 * onError handler for FIQ cover <img> tags. When the primary URL (usually
 * the admin-saved cover_image) fails, swap to the category fallback. If the
 * fallback URL is the same as the failed URL (or also fails), hide the
 * image so the broken-icon doesn't render.
 */
export function makeFIQImageErrorHandler(category: string | null | undefined) {
  const fallback = (category && FIQ_CATEGORY_FALLBACK_IMAGES[category]) || FIQ_DEFAULT_FALLBACK_IMAGE
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (img.dataset.fallbackApplied === '1' || img.src === fallback) {
      img.style.display = 'none'
      return
    }
    img.dataset.fallbackApplied = '1'
    img.src = fallback
  }
}
