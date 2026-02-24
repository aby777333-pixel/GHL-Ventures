/* ================================================================
   File Repository Types — TypeScript interfaces for the
   comprehensive document management system.
   ================================================================ */

import type { AdminRole } from './adminTypes'

// ── Folder Types ─────────────────────────────────────────────────

export interface RepoFolder {
  id: string
  name: string
  slug: string
  parentId: string | null
  path: string              // materialized path e.g. '/fund/nav-reports'
  description?: string
  icon: string              // Lucide icon name
  color: string
  sortOrder: number
  isSystem: boolean         // prevents deletion of default folders
  childCount: number
  fileCount: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface FolderNode extends RepoFolder {
  children: FolderNode[]
  expanded?: boolean
}

// ── File Types ───────────────────────────────────────────────────

export interface RepoFile {
  id: string
  title: string
  description?: string
  fileName: string
  fileUrl: string
  fileType: string          // extension: pdf, xlsx, docx, png, etc.
  fileSize: number          // bytes
  mimeType: string
  category: string          // kyc, agreement, report, invoice, compliance, marketing, general
  folderId: string | null
  folderPath: string
  tags: string[]
  version: number
  isTemplate: boolean
  isConfidential: boolean
  accessLevel: 'public' | 'internal' | 'restricted' | 'confidential'
  starred: boolean
  downloadCount: number
  entityType?: string       // client, employee, compliance, financial, marketing, sales, asset
  entityId?: string
  uploadedBy: string        // user ID
  uploadedByName: string
  approvedBy?: string
  approvedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

// ── Version Types ────────────────────────────────────────────────

export interface RepoVersion {
  id: string
  documentId: string
  versionNumber: number
  fileUrl: string
  fileSize: number
  changeSummary: string
  uploadedBy: string
  uploadedByName: string
  createdAt: string
}

// ── Audit Types ──────────────────────────────────────────────────

export interface RepoAuditEntry {
  id: string
  documentId: string | null
  action: 'upload' | 'download' | 'view' | 'delete' | 'move' | 'rename' | 'share' | 'version' | 'star' | 'unstar'
  performedBy: string
  performedByName: string
  details: Record<string, any>
  ipAddress?: string
  createdAt: string
}

// ── Share Types ──────────────────────────────────────────────────

export interface RepoShare {
  id: string
  documentId: string
  sharedWithUser?: string
  sharedWithUserName?: string
  sharedWithRole?: AdminRole
  permission: 'view' | 'download' | 'edit'
  expiresAt?: string
  createdBy: string
  createdByName: string
  createdAt: string
}

// ── Storage Types ────────────────────────────────────────────────

export interface StorageStats {
  usedBytes: number
  totalBytes: number
  fileCount: number
  folderCount: number
  byCategory: { category: string; bytes: number; count: number }[]
  byType: { type: string; bytes: number; count: number }[]
}

// ── UI State Types ───────────────────────────────────────────────

export type ViewMode = 'grid' | 'list' | 'table'
export type SortField = 'name' | 'date' | 'size' | 'type'
export type SortDir = 'asc' | 'desc'

export interface FileFilters {
  fileType?: string[]
  accessLevel?: string[]
  category?: string[]
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  uploadedBy?: string
  starred?: boolean
  isTemplate?: boolean
  isConfidential?: boolean
}
