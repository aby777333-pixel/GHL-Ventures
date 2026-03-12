/* ================================================================
   File Repository Data — Types and utilities for the
   file repository module. Data loaded from Supabase at runtime.
   ================================================================ */

import type {
  RepoFolder, FolderNode, RepoFile, RepoVersion, RepoAuditEntry, RepoShare, StorageStats,
} from './fileRepositoryTypes'

// ═══════════════════════════════════════════════════════════════
// FOLDERS
// ═══════════════════════════════════════════════════════════════

export const MOCK_FOLDERS: RepoFolder[] = []

// ═══════════════════════════════════════════════════════════════
// FILES
// ═══════════════════════════════════════════════════════════════

export const MOCK_REPO_FILES: RepoFile[] = []

// ═══════════════════════════════════════════════════════════════
// VERSIONS
// ═══════════════════════════════════════════════════════════════

export const MOCK_VERSIONS: RepoVersion[] = []

// ═══════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════

export const MOCK_AUDIT_LOG: RepoAuditEntry[] = []

// ═══════════════════════════════════════════════════════════════
// STORAGE STATS
// ═══════════════════════════════════════════════════════════════

export const MOCK_STORAGE_STATS: StorageStats = {
  usedBytes: 0,
  totalBytes: 524_288_000,
  fileCount: 0,
  folderCount: 0,
  byCategory: [],
  byType: [],
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Build folder tree from flat list
// ═══════════════════════════════════════════════════════════════

export function buildFolderTree(folders: RepoFolder[]): FolderNode[] {
  const map = new Map<string, FolderNode>()
  const roots: FolderNode[] = []

  // Create nodes
  for (const f of folders) {
    map.set(f.id, { ...f, children: [] })
  }

  // Build tree
  for (const f of folders) {
    const node = map.get(f.id)!
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children
  Array.from(map.values()).forEach(node => {
    node.children.sort((a, b) => a.sortOrder - b.sortOrder)
  })
  roots.sort((a, b) => a.sortOrder - b.sortOrder)

  return roots
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Format file size
// ═══════════════════════════════════════════════════════════════

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Get file type color
// ═══════════════════════════════════════════════════════════════

export function getFileTypeColor(type: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    pdf: { bg: 'bg-red-500/10', text: 'text-red-400' },
    xlsx: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    xls: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    csv: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    docx: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    doc: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    pptx: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    ppt: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    png: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    jpg: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    jpeg: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  }
  return colors[type.toLowerCase()] || { bg: 'bg-gray-500/10', text: 'text-gray-400' }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Get file type icon name
// ═══════════════════════════════════════════════════════════════

export function getFileTypeIconName(type: string): string {
  const icons: Record<string, string> = {
    pdf: 'FileText',
    xlsx: 'FileSpreadsheet',
    xls: 'FileSpreadsheet',
    csv: 'FileSpreadsheet',
    docx: 'FileText',
    doc: 'FileText',
    pptx: 'Presentation',
    ppt: 'Presentation',
    png: 'Image',
    jpg: 'Image',
    jpeg: 'Image',
  }
  return icons[type.toLowerCase()] || 'File'
}
