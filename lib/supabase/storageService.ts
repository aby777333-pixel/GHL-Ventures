/* ─────────────────────────────────────────────────────────────
   Supabase Storage Service — Centralized file management

   Wraps supabase.storage for the entire GHL India Ventures platform.
   Provides upload routing per portal/module, file record tracking,
   activity logging, and native file picker integration.

   Bucket Strategy:
     • uploads        — legacy/general uploads (public, demo)
     • ghl-documents  — primary document store with folder structure
     • ghl-templates  — reusable document templates
     • ghl-media      — images, videos, audio (website/marketing)
     • ghl-exports    — generated exports (CSV, PDF reports)
     • ghl-temp-uploads — temporary staging area
     • ghl-backups    — database/config backups
     • avatars        — user profile images
     • marketing-assets — campaign assets

   Falls back to local blob URLs when Supabase is not configured.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

// ── Constants ────────────────────────────────────────────────

const DEFAULT_BUCKET = 'ghl-documents'
const LEGACY_BUCKET = 'uploads'

export const BUCKETS = {
  DOCUMENTS: 'ghl-documents',
  TEMPLATES: 'ghl-templates',
  MEDIA: 'ghl-media',
  EXPORTS: 'ghl-exports',
  TEMP: 'ghl-temp-uploads',
  BACKUPS: 'ghl-backups',
  AVATARS: 'avatars',
  MARKETING: 'marketing-assets',
  UPLOADS: 'uploads',
  KYC: 'kyc-documents',
  RESUMES: 'resumes',
} as const

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS]

// ── Types ─────────────────────────────────────────────────────

export interface StorageFile {
  name: string
  path: string
  url: string
  size: number
  type: string
  bucket: string
}

export interface UploadResult {
  success: boolean
  file?: StorageFile
  fileRecordId?: string
  error?: string
}

export interface DownloadResult {
  success: boolean
  url?: string
  blob?: Blob
  error?: string
}

export interface FileRecordData {
  fileName: string
  originalName: string
  filePath: string
  bucket: string
  fileSize: number
  mimeType: string
  folderId?: string
  category?: string
  tags?: string[]
  description?: string
  entityType?: string
  entityId?: string
  portal?: string
  uploadedBy?: string
  uploadedByName?: string
  accessLevel?: 'public' | 'internal' | 'restricted' | 'confidential'
  isConfidential?: boolean
  isTemplate?: boolean
}

export interface StorageQuota {
  entityType: string
  entityId: string
  quotaBytes: number
  usedBytes: number
  fileCount: number
  percentUsed: number
}

// ── Upload Routing Map ────────────────────────────────────────
// Maps portal + module to the correct bucket and folder path

interface RouteConfig {
  bucket: string
  folder: string
}

const UPLOAD_ROUTES: Record<string, RouteConfig> = {
  // Admin portal routes
  'admin/documents':       { bucket: BUCKETS.DOCUMENTS, folder: 'admin/documents' },
  'admin/fund':            { bucket: BUCKETS.DOCUMENTS, folder: 'admin/fund' },
  'admin/compliance':      { bucket: BUCKETS.DOCUMENTS, folder: 'admin/compliance' },
  'admin/clients':         { bucket: BUCKETS.DOCUMENTS, folder: 'admin/clients' },
  'admin/employees':       { bucket: BUCKETS.DOCUMENTS, folder: 'admin/employees' },
  'admin/financial':       { bucket: BUCKETS.DOCUMENTS, folder: 'admin/financial' },
  'admin/legal':           { bucket: BUCKETS.DOCUMENTS, folder: 'admin/legal' },
  'admin/board':           { bucket: BUCKETS.DOCUMENTS, folder: 'admin/board' },
  'admin/internal':        { bucket: BUCKETS.DOCUMENTS, folder: 'admin/internal' },
  'admin/sales':           { bucket: BUCKETS.DOCUMENTS, folder: 'admin/sales' },
  'admin/technology':      { bucket: BUCKETS.DOCUMENTS, folder: 'admin/technology' },
  'admin/insurance':       { bucket: BUCKETS.DOCUMENTS, folder: 'admin/insurance' },
  'admin/correspondence':  { bucket: BUCKETS.DOCUMENTS, folder: 'admin/correspondence' },
  'admin/archives':        { bucket: BUCKETS.DOCUMENTS, folder: 'admin/archives' },
  'admin/assets':          { bucket: BUCKETS.DOCUMENTS, folder: 'admin/assets' },
  'admin/reports':         { bucket: BUCKETS.EXPORTS,   folder: 'admin/reports' },
  'admin/analytics':       { bucket: BUCKETS.EXPORTS,   folder: 'admin/analytics' },
  'admin/marketing-assets': { bucket: BUCKETS.MARKETING, folder: 'campaigns' },
  'admin/marketing':       { bucket: BUCKETS.MARKETING, folder: 'campaigns' },
  'admin/templates':       { bucket: BUCKETS.TEMPLATES, folder: 'admin' },
  'admin/media':           { bucket: BUCKETS.MEDIA,     folder: 'admin' },
  'admin/backups':         { bucket: BUCKETS.BACKUPS,   folder: 'admin' },

  // Staff portal routes
  'staff/documents':       { bucket: BUCKETS.DOCUMENTS, folder: 'staff/documents' },
  'staff/tasks':           { bucket: BUCKETS.DOCUMENTS, folder: 'staff/tasks' },
  'staff/expenses':        { bucket: BUCKETS.DOCUMENTS, folder: 'staff/expenses' },
  'staff/training':        { bucket: BUCKETS.DOCUMENTS, folder: 'staff/training' },
  'staff/self-service':    { bucket: BUCKETS.DOCUMENTS, folder: 'staff/hr' },
  'staff/field-ops':       { bucket: BUCKETS.DOCUMENTS, folder: 'staff/field-ops' },

  // Client portal routes
  'client/documents':      { bucket: BUCKETS.DOCUMENTS, folder: 'clients' },
  'client/kyc':            { bucket: BUCKETS.KYC,       folder: 'clients' },
  'client/support':        { bucket: BUCKETS.DOCUMENTS, folder: 'clients/support' },
  'client/profile':        { bucket: BUCKETS.AVATARS,   folder: 'clients' },

  // Investor portal routes
  'investor/documents':    { bucket: BUCKETS.DOCUMENTS, folder: 'investors' },
  'investor/reports':      { bucket: BUCKETS.EXPORTS,   folder: 'investors/reports' },
  'investor/kyc':          { bucket: BUCKETS.KYC,       folder: 'investors' },

  // Agent portal routes
  'agent/documents':       { bucket: BUCKETS.DOCUMENTS, folder: 'agents' },
  'agent/deals':           { bucket: BUCKETS.DOCUMENTS, folder: 'agents/deals' },
  'agent/commissions':     { bucket: BUCKETS.EXPORTS,   folder: 'agents/commissions' },

  // Website/public routes
  'website/assets':        { bucket: BUCKETS.MEDIA,     folder: 'website' },
  'website/forms':         { bucket: BUCKETS.TEMP,      folder: 'website/submissions' },

  // Generic fallback
  'general':               { bucket: BUCKETS.UPLOADS,   folder: 'general' },
}

// ── Helpers ───────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function buildPath(folder: string, fileName: string): string {
  const ts = Date.now()
  const safe = sanitizeFileName(fileName)
  return folder ? `${folder}/${ts}_${safe}` : `${ts}_${safe}`
}

/**
 * Resolve the bucket and folder for a given route key.
 * Route key format: 'portal/module' e.g. 'admin/documents', 'client/kyc'
 */
export function resolveUploadRoute(
  routeKey: string,
  entityId?: string
): RouteConfig {
  const route = UPLOAD_ROUTES[routeKey] || UPLOAD_ROUTES['general']
  let folder = route.folder

  // Append entity ID if provided (e.g., clients/{clientId}/documents)
  if (entityId) {
    folder = `${folder}/${entityId}`
  }

  return { bucket: route.bucket, folder }
}

/**
 * Get file type category from MIME type.
 */
export function getFileTypeFromMime(mime: string): string {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.includes('word')) return 'docx'
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'xlsx'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'pptx'
  if (mime === 'text/csv') return 'csv'
  if (mime === 'application/json') return 'json'
  if (mime.includes('zip') || mime.includes('gzip')) return 'archive'
  if (mime === 'text/plain') return 'txt'
  return 'other'
}

/**
 * Format bytes to human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Upload ────────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage with automatic routing.
 * @param file - The File object from a file input
 * @param folder - Subfolder path (e.g. 'admin/documents', 'clients/kyc')
 * @param options - Additional options for file record tracking
 * @returns UploadResult with the file URL on success
 */
export async function uploadFile(
  file: File,
  folder: string = 'general',
  options?: {
    bucket?: string
    entityType?: string
    entityId?: string
    portal?: string
    uploadedBy?: string
    uploadedByName?: string
    category?: string
    tags?: string[]
    description?: string
    accessLevel?: 'public' | 'internal' | 'restricted' | 'confidential'
    isConfidential?: boolean
    folderId?: string
    trackRecord?: boolean
  }
): Promise<UploadResult> {
  // Resolve bucket: explicit > route-based > default
  const route = resolveUploadRoute(folder)
  const bucket = options?.bucket || route.bucket
  const resolvedFolder = options?.bucket ? folder : route.folder

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured — file upload unavailable' }
  }

  try {
    const filePath = buildPath(resolvedFolder, file.name)

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      // Fallback to uploads bucket if primary bucket fails
      if (bucket !== LEGACY_BUCKET) {
        const { error: fallbackError } = await supabase.storage
          .from(LEGACY_BUCKET)
          .upload(filePath, file, { upsert: true, contentType: file.type })

        if (fallbackError) {
          return { success: false, error: `${uploadError.message} (fallback: ${fallbackError.message})` }
        }

        const { data: fbUrl } = supabase.storage.from(LEGACY_BUCKET).getPublicUrl(filePath)

        const fileRecord = await trackFileRecord({
          fileName: sanitizeFileName(file.name),
          originalName: file.name,
          filePath,
          bucket: LEGACY_BUCKET,
          fileSize: file.size,
          mimeType: file.type,
          folderId: options?.folderId,
          category: options?.category,
          tags: options?.tags,
          description: options?.description,
          entityType: options?.entityType,
          entityId: options?.entityId,
          portal: options?.portal || 'admin',
          uploadedBy: options?.uploadedBy,
          uploadedByName: options?.uploadedByName,
          accessLevel: options?.accessLevel,
          isConfidential: options?.isConfidential,
        })

        return {
          success: true,
          file: {
            name: file.name,
            path: filePath,
            url: fbUrl.publicUrl,
            size: file.size,
            type: file.type,
            bucket: LEGACY_BUCKET,
          },
          fileRecordId: fileRecord,
        }
      }
      return { success: false, error: uploadError.message }
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    // Track file record in database
    let fileRecordId: string | undefined
    if (options?.trackRecord !== false) {
      fileRecordId = await trackFileRecord({
        fileName: sanitizeFileName(file.name),
        originalName: file.name,
        filePath,
        bucket,
        fileSize: file.size,
        mimeType: file.type,
        folderId: options?.folderId,
        category: options?.category,
        tags: options?.tags,
        description: options?.description,
        entityType: options?.entityType,
        entityId: options?.entityId,
        portal: options?.portal || 'admin',
        uploadedBy: options?.uploadedBy,
        uploadedByName: options?.uploadedByName,
        accessLevel: options?.accessLevel,
        isConfidential: options?.isConfidential,
      })
    }

    // Log activity
    await logFileActivity({
      action: 'upload',
      portal: options?.portal || 'admin',
      performedBy: options?.uploadedBy,
      performedByName: options?.uploadedByName,
      details: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        bucket,
        folder: resolvedFolder,
      },
    })

    return {
      success: true,
      file: {
        name: file.name,
        path: filePath,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        bucket,
      },
      fileRecordId,
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Upload failed' }
  }
}

/**
 * Upload multiple files at once.
 * @param files - Array of File objects
 * @param folder - Subfolder path or route key
 * @param onProgress - Callback with (completed, total) counts
 * @param options - Additional upload options
 * @returns Array of UploadResult
 */
export async function uploadFiles(
  files: File[],
  folder: string = 'general',
  onProgress?: (completed: number, total: number) => void,
  options?: Parameters<typeof uploadFile>[2]
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(files[i], folder, options)
    results.push(result)
    onProgress?.(i + 1, files.length)
  }
  return results
}

// ── Download ──────────────────────────────────────────────────

/**
 * Get a download URL for a file.
 * For public buckets: returns the public URL.
 * For private buckets: creates a signed URL.
 */
export async function getDownloadUrl(
  filePath: string,
  bucket: string = DEFAULT_BUCKET
): Promise<DownloadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Try public URL first (for public buckets)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
    if (urlData?.publicUrl) {
      return { success: true, url: urlData.publicUrl }
    }

    // Fall back to signed URL (for private buckets)
    const { data: signedData, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600) // 1 hour

    if (error || !signedData?.signedUrl) {
      return { success: false, error: error?.message || 'Failed to create download URL' }
    }

    return { success: true, url: signedData.signedUrl }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Download failed' }
  }
}

/**
 * Download a file as a Blob (for Save-As dialog).
 */
export async function downloadFileBlob(
  filePath: string,
  bucket: string = DEFAULT_BUCKET
): Promise<DownloadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).download(filePath)
    if (error || !data) {
      return { success: false, error: error?.message || 'Download failed' }
    }
    return { success: true, blob: data }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Download failed' }
  }
}

// ── Delete ────────────────────────────────────────────────────

/**
 * Delete a file from storage.
 */
export async function deleteStorageFile(
  filePath: string,
  bucket: string = DEFAULT_BUCKET
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath])
    if (error) return { success: false, error: error.message }

    // Log activity
    await logFileActivity({
      action: 'delete',
      details: { filePath, bucket },
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Delete failed' }
  }
}

// ── Move ──────────────────────────────────────────────────────

/**
 * Move a file from one path to another within the same bucket.
 */
export async function moveStorageFile(
  fromPath: string,
  toPath: string,
  bucket: string = DEFAULT_BUCKET
): Promise<{ success: boolean; newPath?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, newPath: toPath }
  }

  try {
    const { error } = await supabase.storage.from(bucket).move(fromPath, toPath)
    if (error) return { success: false, error: error.message }

    await logFileActivity({
      action: 'move',
      details: { from: fromPath, to: toPath, bucket },
    })

    return { success: true, newPath: toPath }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Move failed' }
  }
}

// ── Copy ──────────────────────────────────────────────────────

/**
 * Copy a file within the same bucket.
 */
export async function copyStorageFile(
  fromPath: string,
  toPath: string,
  bucket: string = DEFAULT_BUCKET
): Promise<{ success: boolean; newPath?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, newPath: toPath }
  }

  try {
    const { error } = await supabase.storage.from(bucket).copy(fromPath, toPath)
    if (error) return { success: false, error: error.message }
    return { success: true, newPath: toPath }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Copy failed' }
  }
}

// ── List ──────────────────────────────────────────────────────

/**
 * List files in a storage folder.
 */
export async function listStorageFiles(
  folder: string = '',
  bucket: string = DEFAULT_BUCKET
): Promise<{ name: string; size: number; createdAt: string; path: string }[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error || !data) return []

    return data
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => ({
        name: f.name,
        size: f.metadata?.size || 0,
        createdAt: f.created_at || '',
        path: folder ? `${folder}/${f.name}` : f.name,
      }))
  } catch {
    return []
  }
}

// ── File Record Tracking ──────────────────────────────────────

/**
 * Track a file upload in the file_records table.
 * Returns the record ID.
 */
async function trackFileRecord(data: FileRecordData): Promise<string | undefined> {
  if (!isSupabaseConfigured()) return undefined

  try {
    const { data: record, error } = await (supabase.from('file_records') as any).insert({
      file_name: data.fileName,
      original_name: data.originalName,
      file_path: data.filePath,
      bucket: data.bucket,
      file_size: data.fileSize,
      mime_type: data.mimeType,
      folder_id: data.folderId || null,
      category: data.category || null,
      tags: data.tags || [],
      description: data.description || null,
      entity_type: data.entityType || null,
      entity_id: data.entityId || null,
      portal: data.portal || 'admin',
      uploaded_by: data.uploadedBy || null,
      uploaded_by_name: data.uploadedByName || null,
      access_level: data.accessLevel || 'internal',
      is_confidential: data.isConfidential || false,
      is_template: data.isTemplate || false,
    }).select('id').single()

    if (error) {
      console.warn('[storage] Failed to track file record:', error.message)
      return undefined
    }
    return record?.id
  } catch (err: any) {
    console.warn('[storage] File record tracking error:', err?.message)
    return undefined
  }
}

// ── Activity Logging ──────────────────────────────────────────

/**
 * Log a file-related activity.
 */
export async function logFileActivity(data: {
  fileId?: string
  documentId?: string
  action: string
  performedBy?: string
  performedByName?: string
  portal?: string
  details?: Record<string, any>
}): Promise<void> {
  if (!isSupabaseConfigured()) return

  try {
    await (supabase.from('file_activity_log') as any).insert({
      file_id: data.fileId || null,
      document_id: data.documentId || null,
      action: data.action,
      performed_by: data.performedBy || null,
      performed_by_name: data.performedByName || null,
      portal: data.portal || 'admin',
      details: data.details || {},
    })
  } catch {
    // Non-critical — don't block on logging failures
  }
}

// ── File Records CRUD ─────────────────────────────────────────

/**
 * Fetch file records with filtering.
 */
export async function fetchFileRecords(filters?: {
  portal?: string
  entityType?: string
  entityId?: string
  category?: string
  bucket?: string
  folderId?: string
  status?: string
  starred?: boolean
  limit?: number
}): Promise<any[]> {
  if (!isSupabaseConfigured()) return []

  try {
    let query = (supabase.from('file_records') as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.portal) query = query.eq('portal', filters.portal)
    if (filters?.entityType) query = query.eq('entity_type', filters.entityType)
    if (filters?.entityId) query = query.eq('entity_id', filters.entityId)
    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.bucket) query = query.eq('bucket', filters.bucket)
    if (filters?.folderId) query = query.eq('folder_id', filters.folderId)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.starred) query = query.eq('starred', true)
    if (filters?.limit) query = query.limit(filters.limit)
    else query = query.limit(100)

    const { data, error } = await query
    if (error) {
      console.warn('[storage] Fetch file records error:', error.message)
      return []
    }
    return data || []
  } catch {
    return []
  }
}

/**
 * Fetch recent file activity.
 */
export async function fetchFileActivity(filters?: {
  fileId?: string
  portal?: string
  action?: string
  limit?: number
}): Promise<any[]> {
  if (!isSupabaseConfigured()) return []

  try {
    let query = (supabase.from('file_activity_log') as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.fileId) query = query.eq('file_id', filters.fileId)
    if (filters?.portal) query = query.eq('portal', filters.portal)
    if (filters?.action) query = query.eq('action', filters.action)
    query = query.limit(filters?.limit || 50)

    const { data, error } = await query
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

/**
 * Get storage quota for a portal or entity.
 */
export async function getStorageQuota(
  entityType: string = 'portal',
  entityId: string = 'admin'
): Promise<StorageQuota | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await (supabase.from('storage_quotas') as any)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single()

    if (error || !data) return null

    return {
      entityType: data.entity_type,
      entityId: data.entity_id,
      quotaBytes: data.quota_bytes,
      usedBytes: data.used_bytes,
      fileCount: data.file_count,
      percentUsed: data.quota_bytes > 0 ? (data.used_bytes / data.quota_bytes) * 100 : 0,
    }
  } catch {
    return null
  }
}

/**
 * Search file records by name or description.
 */
export async function searchFileRecords(
  query: string,
  filters?: { portal?: string; entityType?: string; limit?: number }
): Promise<any[]> {
  if (!isSupabaseConfigured() || !query.trim()) return []

  try {
    let q = (supabase.from('file_records') as any)
      .select('*')
      .or(`original_name.ilike.%${query}%,description.ilike.%${query}%,file_name.ilike.%${query}%`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (filters?.portal) q = q.eq('portal', filters.portal)
    if (filters?.entityType) q = q.eq('entity_type', filters.entityType)
    q = q.limit(filters?.limit || 50)

    const { data, error } = await q
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

// ── Trigger Save-As dialog ────────────────────────────────────

/**
 * Downloads a file and shows the native Save-As dialog.
 * Falls back to standard browser download.
 */
export async function saveFileAs(
  filePath: string,
  fileName: string,
  bucket: string = DEFAULT_BUCKET,
  showToast?: (msg: string, type?: string) => void
): Promise<void> {
  // Try Supabase download first
  const result = await downloadFileBlob(filePath, bucket)

  let blob: Blob
  if (result.success && result.blob) {
    blob = result.blob
  } else {
    // Try fetching the public URL
    const urlResult = await getDownloadUrl(filePath, bucket)
    if (urlResult.success && urlResult.url) {
      try {
        const resp = await fetch(urlResult.url)
        blob = await resp.blob()
      } catch {
        showToast?.('Download failed — file not found in storage', 'error')
        return
      }
    } else {
      showToast?.('Download failed — file not found in storage', 'error')
      return
    }
  }

  // Log download activity
  await logFileActivity({
    action: 'download',
    details: { fileName, filePath, bucket },
  })

  // Try native Save-As
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({ suggestedName: fileName })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      showToast?.(`Saved ${fileName}`, 'success')
      return
    } catch (err: any) {
      if (err?.name === 'AbortError') return
    }
  }

  // Fallback: standard download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showToast?.(`Downloaded ${fileName}`, 'success')
}

/**
 * Trigger a save-as dialog for a generated blob (CSV, PDF, etc.)
 */
export async function saveBlobAs(
  blob: Blob,
  fileName: string,
  showToast?: (msg: string, type?: string) => void
): Promise<void> {
  if ('showSaveFilePicker' in window) {
    try {
      const ext = fileName.split('.').pop()?.toLowerCase() || ''
      const mimeMap: Record<string, string> = {
        csv: 'text/csv', json: 'application/json', pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        txt: 'text/plain',
      }
      const types = mimeMap[ext]
        ? [{ description: `${ext.toUpperCase()} File`, accept: { [mimeMap[ext]]: [`.${ext}`] } }]
        : undefined

      const handle = await (window as any).showSaveFilePicker({ suggestedName: fileName, types })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      showToast?.(`Saved ${fileName}`, 'success')
      return
    } catch (err: any) {
      if (err?.name === 'AbortError') return
    }
  }

  // Fallback
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showToast?.(`Downloaded ${fileName}`, 'success')
}

/**
 * Upload a generated blob (export, report, etc.) to Supabase and
 * optionally trigger a save-as dialog.
 */
export async function saveBlobToStorage(
  blob: Blob,
  fileName: string,
  routeKey: string = 'admin/exports',
  options?: {
    alsoDownload?: boolean
    portal?: string
    entityType?: string
    entityId?: string
    showToast?: (msg: string, type?: string) => void
  }
): Promise<UploadResult> {
  // Convert blob to File for the upload function
  const file = new File([blob], fileName, { type: blob.type })
  const result = await uploadFile(file, routeKey, {
    portal: options?.portal || 'admin',
    entityType: options?.entityType,
    entityId: options?.entityId,
    category: 'export',
    trackRecord: true,
  })

  if (options?.alsoDownload) {
    await saveBlobAs(blob, fileName, options.showToast)
  }

  return result
}

// ── Bucket status check ───────────────────────────────────────

/**
 * Check if storage is accessible.
 * Tries ghl-documents bucket first, falls back to uploads bucket.
 */
export async function checkStorageConnection(): Promise<{
  connected: boolean
  bucket: string
  activeBuckets?: string[]
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    return { connected: false, bucket: DEFAULT_BUCKET, error: 'Supabase not configured' }
  }

  const activeBuckets: string[] = []

  // Check primary bucket
  try {
    const { error: docErr } = await supabase.storage.from(DEFAULT_BUCKET).list('', { limit: 1 })
    if (!docErr) activeBuckets.push(DEFAULT_BUCKET)
  } catch { /* skip */ }

  // Check legacy uploads bucket
  try {
    const { error: upErr } = await supabase.storage.from(LEGACY_BUCKET).list('', { limit: 1 })
    if (!upErr) activeBuckets.push(LEGACY_BUCKET)
  } catch { /* skip */ }

  // Check a few more buckets
  const checkBuckets = [BUCKETS.TEMPLATES, BUCKETS.MEDIA, BUCKETS.EXPORTS]
  for (let i = 0; i < checkBuckets.length; i++) {
    try {
      const { error } = await supabase.storage.from(checkBuckets[i]).list('', { limit: 1 })
      if (!error) activeBuckets.push(checkBuckets[i])
    } catch { /* skip */ }
  }

  if (activeBuckets.length > 0) {
    return { connected: true, bucket: activeBuckets[0], activeBuckets }
  }

  return { connected: false, bucket: DEFAULT_BUCKET, error: 'No accessible buckets found' }
}

// ── Preview URL Helper ────────────────────────────────────────

/**
 * Get a preview-friendly URL for a file.
 * Returns public URL for images/PDFs, signed URL for private files.
 */
export async function getPreviewUrl(
  filePath: string,
  bucket: string = DEFAULT_BUCKET,
  mimeType?: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    if (data?.publicUrl) return data.publicUrl

    const { data: signed, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600)

    if (error || !signed?.signedUrl) return null
    return signed.signedUrl
  } catch {
    return null
  }
}

// ── Bulk Operations ───────────────────────────────────────────

/**
 * Delete multiple files from storage.
 */
export async function deleteMultipleFiles(
  filePaths: string[],
  bucket: string = DEFAULT_BUCKET
): Promise<{ success: boolean; deleted: number; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return { success: true, deleted: filePaths.length, errors: [] }
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove(filePaths)
    if (error) {
      return { success: false, deleted: 0, errors: [error.message] }
    }

    await logFileActivity({
      action: 'bulk_delete',
      details: { count: filePaths.length, bucket },
    })

    return { success: true, deleted: filePaths.length, errors: [] }
  } catch (err: any) {
    return { success: false, deleted: 0, errors: [err?.message || 'Bulk delete failed'] }
  }
}

// ── Open File Picker (upload via native dialog) ───────────────

/**
 * Open the native file picker and upload selected files.
 * @param routeKey - Upload route key (e.g. 'admin/documents', 'client/kyc')
 * @param options - Upload options plus file picker options
 * @returns Array of upload results
 */
export async function pickAndUploadFiles(
  routeKey: string = 'general',
  options?: {
    accept?: string     // e.g. '.pdf,.docx,.xlsx'
    multiple?: boolean
    portal?: string
    entityType?: string
    entityId?: string
    uploadedBy?: string
    uploadedByName?: string
    category?: string
    folderId?: string
    onProgress?: (completed: number, total: number) => void
  }
): Promise<UploadResult[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    if (options?.accept) input.accept = options.accept
    if (options?.multiple !== false) input.multiple = true

    input.onchange = async () => {
      const fileList = input.files
      if (!fileList || fileList.length === 0) {
        resolve([])
        return
      }

      const files: File[] = []
      for (let i = 0; i < fileList.length; i++) {
        files.push(fileList[i])
      }

      const results = await uploadFiles(files, routeKey, options?.onProgress, {
        portal: options?.portal,
        entityType: options?.entityType,
        entityId: options?.entityId,
        uploadedBy: options?.uploadedBy,
        uploadedByName: options?.uploadedByName,
        category: options?.category,
        folderId: options?.folderId,
        trackRecord: true,
      })
      resolve(results)
    }

    input.oncancel = () => resolve([])
    input.click()
  })
}
