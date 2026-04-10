/* ─────────────────────────────────────────────────────────────
   Download Tracking Service

   Logs every document download to the `download_logs` table.
   This data is visible in:
   - Admin Portal → Sales Module (download activity feed)
   - CS Portal → Lead queue (download context for follow-up)

   Each download log links to:
   - The contact_submission (form data)
   - The lead (if auto-created)
   - The document metadata
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

const sb = supabase as any

export interface DownloadLogEntry {
  documentId: string
  documentTitle: string
  documentType: string
  fileSize: string
  downloaderName: string
  downloaderEmail: string
  downloaderPhone: string
  isAccredited: boolean
  pageUrl?: string
  leadId?: string
  contactSubmissionId?: string
}

/**
 * Log a document download event to the download_logs table.
 * Non-blocking — failures are silently caught.
 */
export async function logDownload(entry: DownloadLogEntry): Promise<{ success: boolean; id?: string }> {
  if (!isSupabaseConfigured()) {
    console.debug('[downloadTracking] Supabase not configured, download logged locally')
    return { success: true }
  }

  try {
    const { data, error } = await sb.from('download_logs').insert({
      document_id: entry.documentId,
      document_title: entry.documentTitle,
      document_type: entry.documentType,
      file_size: entry.fileSize,
      downloader_name: entry.downloaderName,
      downloader_email: entry.downloaderEmail,
      downloader_phone: entry.downloaderPhone,
      is_accredited: entry.isAccredited,
      page_url: entry.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      lead_id: entry.leadId || null,
      contact_submission_id: entry.contactSubmissionId || null,
      utm_source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : null,
      utm_medium: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_medium') : null,
      utm_campaign: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') : null,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      ip_country: null, // populated server-side if needed
    }).select().single()

    if (error) throw error
    return { success: true, id: data?.id }
  } catch (err) {
    console.warn('[downloadTracking] Failed to log download:', err)
    return { success: false }
  }
}

/**
 * Get download logs for admin dashboard.
 * Returns recent downloads with optional filters.
 */
export async function getDownloadLogs(options?: {
  limit?: number
  documentId?: string
  email?: string
  since?: string
}): Promise<any[]> {
  if (!isSupabaseConfigured()) return []

  try {
    let query = sb
      .from('download_logs')
      .select('*')
      .order('downloaded_at', { ascending: false })
      .limit(options?.limit || 50)

    if (options?.documentId) {
      query = query.eq('document_id', options.documentId)
    }
    if (options?.email) {
      query = query.eq('downloader_email', options.email)
    }
    if (options?.since) {
      query = query.gte('downloaded_at', options.since)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (err) {
    console.warn('[downloadTracking] Failed to fetch download logs:', err)
    return []
  }
}

/**
 * Get download statistics for admin analytics.
 */
export async function getDownloadStats(): Promise<{
  totalDownloads: number
  uniqueDownloaders: number
  byDocument: Record<string, number>
}> {
  if (!isSupabaseConfigured()) {
    return { totalDownloads: 0, uniqueDownloaders: 0, byDocument: {} }
  }

  try {
    const { data, error } = await sb
      .from('download_logs')
      .select('id, document_id, downloader_email')

    if (error) throw error

    const logs = data || []
    const uniqueEmails = new Set(logs.map((l: any) => l.downloader_email))
    const byDocument: Record<string, number> = {}
    logs.forEach((l: any) => {
      byDocument[l.document_id] = (byDocument[l.document_id] || 0) + 1
    })

    return {
      totalDownloads: logs.length,
      uniqueDownloaders: uniqueEmails.size,
      byDocument,
    }
  } catch (err) {
    console.warn('[downloadTracking] Failed to fetch stats:', err)
    return { totalDownloads: 0, uniqueDownloaders: 0, byDocument: {} }
  }
}

/**
 * Subscribe to new download events (realtime).
 * Used by admin/CS dashboards for live activity feed.
 */
export function onNewDownload(callback: (download: any) => void) {
  if (!isSupabaseConfigured()) return { unsubscribe: () => {} }

  const channel = sb
    .channel('download_logs_realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'download_logs' },
      (payload: any) => callback(payload.new)
    )
    .subscribe()

  return {
    unsubscribe: () => {
      sb.removeChannel(channel)
    },
  }
}
