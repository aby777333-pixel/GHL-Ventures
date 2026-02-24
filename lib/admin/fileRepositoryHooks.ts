/* ─────────────────────────────────────────────────────────────
   File Repository Hooks — React hooks wrapping fileRepositoryService

   Each hook provides { data, loading, error, refetch }
   following the same pattern as dashboardDataHooks.ts
   ───────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback } from 'react'
import * as svc from '../supabase/fileRepositoryService'
import type {
  FolderNode, RepoFile, RepoVersion, RepoAuditEntry, StorageStats, FileFilters,
} from './fileRepositoryTypes'

// ── Generic async-data hook ─────────────────────────────────
interface UseQueryResult<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => void
}

function useQuery<T>(fetcher: () => Promise<T>, fallback: T, deps: any[] = []): UseQueryResult<T> {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger(n => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err?.message || 'Unknown error'); setLoading(false) } })

    return () => { cancelled = true }
  }, [trigger, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch }
}

// ── Folder Tree ─────────────────────────────────────────────
export function useFolderTree() {
  return useQuery(() => svc.fetchFolderTree(), [])
}

// ── Files (by folder + filters) ─────────────────────────────
export function useRepoFiles(folderId?: string | null, filters?: FileFilters) {
  return useQuery(
    () => svc.fetchFiles(folderId, filters),
    [],
    [folderId, JSON.stringify(filters)]
  )
}

// ── File Detail ─────────────────────────────────────────────
export function useFileDetail(fileId: string | null) {
  return useQuery<RepoFile | null>(
    () => fileId ? svc.fetchFileById(fileId) : Promise.resolve(null),
    null,
    [fileId]
  )
}

// ── Version History ─────────────────────────────────────────
export function useFileVersions(documentId: string | null) {
  return useQuery(
    () => documentId ? svc.fetchVersions(documentId) : Promise.resolve([]),
    [] as RepoVersion[],
    [documentId]
  )
}

// ── Audit Log ───────────────────────────────────────────────
export function useAuditLog(documentId?: string) {
  return useQuery(
    () => svc.fetchAuditLog(documentId),
    [] as RepoAuditEntry[],
    [documentId]
  )
}

// ── Storage Stats ───────────────────────────────────────────
export function useStorageStats() {
  return useQuery(() => svc.fetchStorageStats(), {
    usedBytes: 0,
    totalBytes: 524288000,
    fileCount: 0,
    folderCount: 0,
    byCategory: [],
    byType: [],
  } as StorageStats)
}

// ── File Search ─────────────────────────────────────────────
export function useFileSearch(query: string, filters?: FileFilters) {
  return useQuery(
    () => query.length >= 2 ? svc.searchFiles(query, filters) : Promise.resolve([]),
    [] as RepoFile[],
    [query, JSON.stringify(filters)]
  )
}
