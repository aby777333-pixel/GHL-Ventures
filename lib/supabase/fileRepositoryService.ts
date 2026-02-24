/* ─────────────────────────────────────────────────────────────
   File Repository Service — Supabase queries with mock fallback

   Provides CRUD operations for the file repository module.
   Falls back to fileRepositoryData.ts mock data when Supabase
   is not configured or queries fail.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import {
  MOCK_FOLDERS, MOCK_REPO_FILES, MOCK_VERSIONS, MOCK_AUDIT_LOG,
  MOCK_STORAGE_STATS, buildFolderTree,
} from '../admin/fileRepositoryData'
import type {
  RepoFolder, RepoFile, RepoVersion, RepoAuditEntry, RepoShare,
  StorageStats, FolderNode, FileFilters,
} from '../admin/fileRepositoryTypes'

// ── Generic query helper (same pattern as reportsDataService) ──
async function queryOrFallback<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T,
  label: string
): Promise<T> {
  if (!isSupabaseConfigured()) return fallback
  try {
    const { data, error } = await queryFn() as any
    if (error) {
      console.warn(`[fileRepo] Error fetching ${label}:`, error.message)
      return fallback
    }
    return (data as T) ?? fallback
  } catch (err) {
    console.warn(`[fileRepo] Exception fetching ${label}:`, err)
    return fallback
  }
}

// ═══════════════════════════════════════════════════════════════
// READ OPERATIONS
// ═══════════════════════════════════════════════════════════════

/** Fetch all folders (flat list) */
export async function fetchFolders(): Promise<RepoFolder[]> {
  return queryOrFallback(
    () => supabase.from('folders').select('*').order('sort_order') as any,
    MOCK_FOLDERS,
    'folders'
  )
}

/** Fetch folder tree (nested structure) */
export async function fetchFolderTree(): Promise<FolderNode[]> {
  const folders = await fetchFolders()
  return buildFolderTree(folders)
}

/** Fetch files, optionally filtered by folder and other criteria */
export async function fetchFiles(
  folderId?: string | null,
  filters?: FileFilters
): Promise<RepoFile[]> {
  if (!isSupabaseConfigured()) {
    let files = [...MOCK_REPO_FILES]
    if (folderId) files = files.filter(f => f.folderId === folderId)
    if (filters?.fileType?.length) files = files.filter(f => filters.fileType!.includes(f.fileType))
    if (filters?.accessLevel?.length) files = files.filter(f => filters.accessLevel!.includes(f.accessLevel))
    if (filters?.category?.length) files = files.filter(f => filters.category!.includes(f.category))
    if (filters?.starred) files = files.filter(f => f.starred)
    if (filters?.isTemplate) files = files.filter(f => f.isTemplate)
    if (filters?.isConfidential) files = files.filter(f => f.isConfidential)
    if (filters?.tags?.length) files = files.filter(f => f.tags.some(t => filters.tags!.includes(t)))
    return files
  }

  try {
    let query = supabase.from('documents').select('*')
    if (folderId) query = query.eq('folder_id', folderId)
    if (filters?.fileType?.length) query = query.in('file_type', filters.fileType)
    if (filters?.accessLevel?.length) query = query.in('access_level', filters.accessLevel)
    if (filters?.category?.length) query = query.in('category', filters.category)
    if (filters?.starred) query = query.eq('starred', true)
    if (filters?.isTemplate) query = query.eq('is_template', true)
    if (filters?.isConfidential) query = query.eq('is_confidential', true)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error || !data) return MOCK_REPO_FILES
    return data as unknown as RepoFile[]
  } catch {
    return MOCK_REPO_FILES
  }
}

/** Fetch a single file by ID */
export async function fetchFileById(fileId: string): Promise<RepoFile | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_REPO_FILES.find(f => f.id === fileId) || null
  }
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', fileId)
      .single()
    if (error || !data) return MOCK_REPO_FILES.find(f => f.id === fileId) || null
    return data as unknown as RepoFile
  } catch {
    return null
  }
}

/** Fetch version history for a document */
export async function fetchVersions(documentId: string): Promise<RepoVersion[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_VERSIONS.filter(v => v.documentId === documentId)
  }
  return queryOrFallback(
    () => supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false }) as any,
    MOCK_VERSIONS.filter(v => v.documentId === documentId),
    'versions'
  )
}

/** Fetch audit log, optionally for a specific document */
export async function fetchAuditLog(documentId?: string): Promise<RepoAuditEntry[]> {
  if (!isSupabaseConfigured()) {
    if (documentId) return MOCK_AUDIT_LOG.filter(a => a.documentId === documentId)
    return MOCK_AUDIT_LOG
  }
  try {
    let query = (supabase.from('document_audit_log') as any).select('*').order('created_at', { ascending: false }).limit(50)
    if (documentId) query = query.eq('document_id', documentId)
    const { data, error } = await query
    if (error || !data) return documentId ? MOCK_AUDIT_LOG.filter(a => a.documentId === documentId) : MOCK_AUDIT_LOG
    return data as unknown as RepoAuditEntry[]
  } catch {
    return MOCK_AUDIT_LOG
  }
}

/** Fetch storage statistics */
export async function fetchStorageStats(): Promise<StorageStats> {
  if (!isSupabaseConfigured()) return MOCK_STORAGE_STATS
  // In production, this would aggregate from storage.objects
  // For now, return mock stats
  return MOCK_STORAGE_STATS
}

/** Search files across all folders */
export async function searchFiles(
  query: string,
  filters?: FileFilters
): Promise<RepoFile[]> {
  if (!isSupabaseConfigured()) {
    const q = query.toLowerCase()
    let files = MOCK_REPO_FILES.filter(f =>
      f.title.toLowerCase().includes(q) ||
      f.fileName.toLowerCase().includes(q) ||
      f.tags.some(t => t.toLowerCase().includes(q)) ||
      (f.description?.toLowerCase().includes(q))
    )
    if (filters?.fileType?.length) files = files.filter(f => filters.fileType!.includes(f.fileType))
    if (filters?.accessLevel?.length) files = files.filter(f => filters.accessLevel!.includes(f.accessLevel))
    return files
  }
  try {
    let dbQuery = supabase
      .from('documents')
      .select('*')
      .or(`title.ilike.%${query}%,file_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data, error } = await dbQuery
    if (error || !data) return []
    return data as unknown as RepoFile[]
  } catch {
    return []
  }
}

// ═══════════════════════════════════════════════════════════════
// WRITE OPERATIONS
// ═══════════════════════════════════════════════════════════════

/** Create a new folder */
export async function createFolder(data: {
  name: string
  slug: string
  parentId: string | null
  path: string
  description?: string
  icon?: string
  color?: string
}): Promise<RepoFolder | null> {
  if (!isSupabaseConfigured()) {
    // Mock: return a new folder object
    const newFolder: RepoFolder = {
      id: `FLD-NEW-${Date.now()}`,
      name: data.name,
      slug: data.slug,
      parentId: data.parentId,
      path: data.path,
      description: data.description,
      icon: data.icon || 'Folder',
      color: data.color || '#6B7280',
      sortOrder: 99,
      isSystem: false,
      childCount: 0,
      fileCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return newFolder
  }

  try {
    const { data: result, error } = await (supabase
      .from('folders')
      .insert({
        name: data.name,
        slug: data.slug,
        parent_id: data.parentId,
        path: data.path,
        description: data.description,
        icon: data.icon || 'Folder',
        color: data.color || '#6B7280',
      } as any)
      .select()
      .single() as any)

    if (error) return null
    return result as unknown as RepoFolder
  } catch {
    return null
  }
}

/** Move a file to a different folder */
export async function moveFile(fileId: string, targetFolderId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  try {
    const { error } = await (supabase
      .from('documents') as any)
      .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() })
      .eq('id', fileId)
    return !error
  } catch {
    return false
  }
}

/** Rename a file */
export async function renameFile(fileId: string, newTitle: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  try {
    const { error } = await (supabase
      .from('documents') as any)
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .eq('id', fileId)
    return !error
  } catch {
    return false
  }
}

/** Delete a file */
export async function deleteFile(fileId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  try {
    const { error } = await supabase.from('documents').delete().eq('id', fileId)
    return !error
  } catch {
    return false
  }
}

/** Toggle star on a file */
export async function starFile(fileId: string, starred: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  try {
    const { error } = await (supabase
      .from('documents') as any)
      .update({ starred, updated_at: new Date().toISOString() })
      .eq('id', fileId)
    return !error
  } catch {
    return false
  }
}

/** Create a new version for a document */
export async function createVersion(
  documentId: string,
  fileUrl: string,
  fileSize: number,
  changeSummary: string
): Promise<RepoVersion | null> {
  if (!isSupabaseConfigured()) {
    return {
      id: `VER-NEW-${Date.now()}`,
      documentId,
      versionNumber: 99,
      fileUrl,
      fileSize,
      changeSummary,
      uploadedBy: 'USR001',
      uploadedByName: 'Abe Thayil',
      createdAt: new Date().toISOString(),
    }
  }
  try {
    const { data, error } = await (supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        file_url: fileUrl,
        file_size: fileSize,
        change_summary: changeSummary,
      } as any)
      .select()
      .single() as any)
    if (error) return null
    return data as unknown as RepoVersion
  } catch {
    return null
  }
}

/** Share a document */
export async function shareDocument(
  documentId: string,
  shareData: {
    sharedWithUser?: string
    sharedWithRole?: string
    permission: 'view' | 'download' | 'edit'
    expiresAt?: string
  }
): Promise<RepoShare | null> {
  if (!isSupabaseConfigured()) {
    return {
      id: `SHR-NEW-${Date.now()}`,
      documentId,
      sharedWithUser: shareData.sharedWithUser,
      sharedWithRole: shareData.sharedWithRole as any,
      permission: shareData.permission,
      expiresAt: shareData.expiresAt,
      createdBy: 'USR001',
      createdByName: 'Abe Thayil',
      createdAt: new Date().toISOString(),
    }
  }
  try {
    const { data, error } = await (supabase
      .from('document_shares')
      .insert({
        document_id: documentId,
        shared_with_user: shareData.sharedWithUser,
        shared_with_role: shareData.sharedWithRole,
        permission: shareData.permission,
        expires_at: shareData.expiresAt,
      } as any)
      .select()
      .single() as any)
    if (error) return null
    return data as unknown as RepoShare
  } catch {
    return null
  }
}

/** Log an audit entry */
export async function logAudit(
  documentId: string | null,
  action: string,
  details: Record<string, any> = {}
): Promise<void> {
  if (!isSupabaseConfigured()) return
  try {
    await (supabase.from('document_audit_log') as any).insert({
      document_id: documentId,
      action,
      details,
    })
  } catch {
    // Silent fail for audit logging
  }
}

/** Delete a folder (non-system only) */
export async function deleteFolder(folderId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  try {
    const { error } = await (supabase.from('folders') as any).delete().eq('id', folderId).eq('is_system', false)
    return !error
  } catch {
    return false
  }
}

/** Rename a folder */
export async function renameFolder(folderId: string, newName: string, newSlug: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  try {
    const { error } = await (supabase
      .from('folders') as any)
      .update({ name: newName, slug: newSlug, updated_at: new Date().toISOString() })
      .eq('id', folderId)
    return !error
  } catch {
    return false
  }
}
