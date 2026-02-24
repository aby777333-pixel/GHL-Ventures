/* ─────────────────────────────────────────────────────────────
   Supabase Storage Service — Centralized file upload/download

   Wraps supabase.storage for the entire platform.
   Uses the 'uploads' public bucket (no auth required for demo).
   Falls back to local blob URLs when Supabase is not configured.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

const BUCKET = 'uploads'

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
  error?: string
}

export interface DownloadResult {
  success: boolean
  url?: string
  blob?: Blob
  error?: string
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

// ── Upload ────────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage.
 * @param file - The File object from a file input
 * @param folder - Subfolder path (e.g. 'admin/documents', 'clients/kyc')
 * @returns UploadResult with the file URL on success
 */
export async function uploadFile(
  file: File,
  folder: string = 'general'
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    // Demo fallback: return a local blob URL
    return {
      success: true,
      file: {
        name: file.name,
        path: `demo/${folder}/${file.name}`,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        bucket: 'local',
      },
    }
  }

  try {
    const filePath = buildPath(folder, file.name)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    return {
      success: true,
      file: {
        name: file.name,
        path: filePath,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        bucket: BUCKET,
      },
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Upload failed' }
  }
}

/**
 * Upload multiple files at once.
 * @param files - Array of File objects
 * @param folder - Subfolder path
 * @param onProgress - Callback with (completed, total) counts
 * @returns Array of UploadResult
 */
export async function uploadFiles(
  files: File[],
  folder: string = 'general',
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(files[i], folder)
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
  bucket: string = BUCKET
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
  bucket: string = BUCKET
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
  bucket: string = BUCKET
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath])
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Delete failed' }
  }
}

// ── List ──────────────────────────────────────────────────────

/**
 * List files in a storage folder.
 */
export async function listStorageFiles(
  folder: string = '',
  bucket: string = BUCKET
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

// ── Trigger Save-As dialog ────────────────────────────────────

/**
 * Downloads a file and shows the native Save-As dialog.
 * Falls back to standard browser download.
 */
export async function saveFileAs(
  filePath: string,
  fileName: string,
  bucket: string = BUCKET,
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

// ── Bucket status check ───────────────────────────────────────

/**
 * Check if the uploads bucket is accessible.
 * Useful for showing connection status in the UI.
 */
export async function checkStorageConnection(): Promise<{
  connected: boolean
  bucket: string
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    return { connected: false, bucket: BUCKET, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1 })
    if (error) {
      return { connected: false, bucket: BUCKET, error: error.message }
    }
    return { connected: true, bucket: BUCKET }
  } catch (err: any) {
    return { connected: false, bucket: BUCKET, error: err?.message }
  }
}
