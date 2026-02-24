'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  FolderOpen, Search, Grid3X3, List, Table2, Upload, Plus,
  ChevronRight, ChevronDown, Star, Download, Eye, Trash2,
  MoreHorizontal, X, File, FileText, Image, Presentation,
  Clock, Shield, Tag, Users, Lock, Globe, ArrowUpDown,
  FolderPlus, Filter, Briefcase, Building2, IndianRupee,
  Mail, Settings, Code, Archive, TrendingUp, Scale,
  type LucideIcon, Pencil, History, Share2, AlertTriangle,
  CheckCircle, Info, FolderClosed,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import {
  useFolderTree, useRepoFiles, useFileDetail, useFileVersions,
  useAuditLog, useStorageStats, useFileSearch,
} from '@/lib/admin/fileRepositoryHooks'
import {
  formatFileSize, getFileTypeColor, buildFolderTree, MOCK_FOLDERS,
} from '@/lib/admin/fileRepositoryData'
import * as svc from '@/lib/supabase/fileRepositoryService'
import { uploadFile, uploadFiles, saveFileAs, saveBlobAs, checkStorageConnection } from '@/lib/supabase/storageService'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { FolderNode, RepoFile, ViewMode, SortField, SortDir } from '@/lib/admin/fileRepositoryTypes'

// ── Icon Map for folder icons ───────────────────────────────
const FOLDER_ICONS: Record<string, LucideIcon> = {
  Briefcase, Shield: Shield, Users, UserCircle: Users, IndianRupee,
  Megaphone: TrendingUp, Scale, Building2, Settings, FileBarChart: File,
  TrendingUp, Code, ShieldCheck: Shield, Mail, Archive, Folder: FolderOpen,
  FolderOpen, FileText, BarChart3: File, PhoneCall: File, ArrowDownRight: File,
  ScrollText: FileText, FileSignature: FileText, Book: FileText,
  ClipboardCheck: CheckCircle, CreditCard: File, Star: Star, LogOut: File,
  Receipt: FileText, Calculator: File, BookOpen: FileText, Presentation,
  Image, Palette: File, Handshake: Users, Gavel: Scale,
  ClipboardList: FileText, CheckSquare: CheckCircle, Calendar: Clock,
  ListChecks: FileText, LayoutTemplate: File, GraduationCap: File,
  PieChart: File, Network: Code, Code2: Code, ShieldAlert: AlertTriangle,
  AlertTriangle, FolderClosed, UserMinus: Users,
}

// ── File type icons ─────────────────────────────────────────
function FileTypeIcon({ type, className }: { type: string; className?: string }) {
  const iconMap: Record<string, LucideIcon> = {
    pdf: FileText, xlsx: File, xls: File, csv: File,
    docx: FileText, doc: FileText, pptx: Presentation, ppt: Presentation,
    png: Image, jpg: Image, jpeg: Image,
  }
  const Icon = iconMap[type.toLowerCase()] || File
  return <Icon className={className} />
}

interface Props {
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  navigate: (path: string) => void
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function FileRepository({ showToast, navigate }: Props) {
  // ── State ─────────────────────────────────────────────────
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [detailFileId, setDetailFileId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<{ type?: string[]; access?: string[] }>({})
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)

  // ── Data hooks ────────────────────────────────────────────
  const { data: folderTree, loading: foldersLoading } = useFolderTree()
  const { data: files, loading: filesLoading, refetch: refetchFiles } = useRepoFiles(currentFolderId)
  const { data: searchResults, loading: searchLoading } = useFileSearch(searchQuery)
  const { data: storageStats } = useStorageStats()
  const { data: detailFile } = useFileDetail(detailFileId)
  const { data: versions } = useFileVersions(detailFileId)
  const { data: auditLog } = useAuditLog(detailFileId ?? undefined)

  // ── Derived values ────────────────────────────────────────
  const isSearching = searchQuery.length >= 2
  const displayFiles = isSearching ? searchResults : files

  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null
    return MOCK_FOLDERS.find(f => f.id === currentFolderId) || null
  }, [currentFolderId])

  const breadcrumbs = useMemo(() => {
    if (!currentFolder) return [{ id: null, name: 'All Files' }]
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'All Files' }]
    const pathParts = currentFolder.path.split('/').filter(Boolean)
    let accumulated = ''
    for (const part of pathParts) {
      accumulated += '/' + part
      const folder = MOCK_FOLDERS.find(f => f.path === accumulated)
      if (folder) crumbs.push({ id: folder.id, name: folder.name })
    }
    return crumbs
  }, [currentFolder])

  const sortedFiles = useMemo(() => {
    const sorted = [...displayFiles]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name': cmp = a.title.localeCompare(b.title); break
        case 'date': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break
        case 'size': cmp = a.fileSize - b.fileSize; break
        case 'type': cmp = a.fileType.localeCompare(b.fileType); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [displayFiles, sortField, sortDir])

  const subFolders = useMemo(() => {
    if (!currentFolderId) {
      return MOCK_FOLDERS.filter(f => !f.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return MOCK_FOLDERS.filter(f => f.parentId === currentFolderId).sort((a, b) => a.sortOrder - b.sortOrder)
  }, [currentFolderId])

  // ── Actions ───────────────────────────────────────────────
  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }, [])

  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId)
    setSelectedFiles(new Set())
    setDetailFileId(null)
    setSearchQuery('')
  }, [])

  const toggleFileSelect = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(fileId)) next.delete(fileId)
      else next.add(fileId)
      return next
    })
  }, [])

  const handleStarFile = useCallback(async (fileId: string, starred: boolean) => {
    await svc.starFile(fileId, !starred)
    showToast(starred ? 'Removed from favorites' : 'Added to favorites', 'success')
    refetchFiles()
  }, [showToast, refetchFiles])

  const handleDeleteFile = useCallback(async (fileId: string, title: string) => {
    await svc.deleteFile(fileId)
    showToast(`Deleted "${title}"`, 'success')
    refetchFiles()
    if (detailFileId === fileId) setDetailFileId(null)
  }, [showToast, refetchFiles, detailFileId])

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return
    const slug = newFolderName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const parentPath = currentFolder?.path || ''
    await svc.createFolder({
      name: newFolderName.trim(),
      slug,
      parentId: currentFolderId,
      path: `${parentPath}/${slug}`,
    })
    showToast(`Created folder "${newFolderName.trim()}"`, 'success')
    setNewFolderName('')
    setNewFolderModalOpen(false)
    refetchFiles()
  }, [newFolderName, currentFolderId, currentFolder, showToast, refetchFiles])

  const handleDownload = useCallback(async (file: RepoFile) => {
    showToast(`Downloading ${file.fileName}...`, 'info')
    svc.logAudit(file.id, 'download', { fileName: file.fileName })

    // If file has a storage path, download from Supabase
    if (file.fileUrl && isSupabaseConfigured()) {
      // fileUrl may be a full URL or a storage path
      const storagePath = file.fileUrl.startsWith('http')
        ? file.fileUrl.split('/storage/v1/object/public/uploads/')[1] || file.fileUrl
        : file.fileUrl
      await saveFileAs(storagePath, file.fileName, 'uploads', showToast as any)
      return
    }

    // Fallback: generate demo content and save
    const blob = new Blob(
      [`File: ${file.fileName}\nTitle: ${file.title}\nSize: ${file.fileSize}\nCategory: ${file.category}\n\nThis is demo content. Upload real files to see real downloads.`],
      { type: 'application/octet-stream' }
    )
    await saveBlobAs(blob, file.fileName, showToast as any)
  }, [showToast])

  const handleBatchDelete = useCallback(async () => {
    const count = selectedFiles.size
    const ids = Array.from(selectedFiles)
    for (let i = 0; i < ids.length; i++) {
      await svc.deleteFile(ids[i])
    }
    showToast(`Deleted ${count} file(s)`, 'success')
    setSelectedFiles(new Set())
    refetchFiles()
  }, [selectedFiles, showToast, refetchFiles])

  // ── Storage percentage ────────────────────────────────────
  const storagePercent = storageStats.totalBytes > 0
    ? ((storageStats.usedBytes / storageStats.totalBytes) * 100).toFixed(1)
    : '0'

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">File Repository</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {storageStats.fileCount} files &middot; {storageStats.folderCount} folders &middot; {formatFileSize(storageStats.usedBytes)} used
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-red/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-0.5 p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
            {([['grid', Grid3X3], ['list', List], ['table', Table2]] as [ViewMode, LucideIcon][]).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-md transition-colors ${viewMode === mode ? 'bg-brand-red/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Filter */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`p-2 rounded-lg border transition-colors ${filterOpen ? 'bg-brand-red/20 border-brand-red/30 text-white' : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-gray-300'}`}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>

          {/* New Folder */}
          <button
            onClick={() => setNewFolderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Folder
          </button>

          {/* Upload */}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
        </div>
      </div>

      {/* ── Filter Bar (conditional) ────────────────────────── */}
      {filterOpen && (
        <AdminGlass padding="p-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">File Type:</span>
            {['pdf', 'xlsx', 'docx', 'pptx', 'png', 'csv'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setActiveFilters(prev => {
                    const types = prev.type || []
                    return { ...prev, type: types.includes(t) ? types.filter(x => x !== t) : [...types, t] }
                  })
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase transition-colors ${
                  activeFilters.type?.includes(t) ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                {t}
              </button>
            ))}
            <span className="text-white/[0.06] mx-1">|</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Access:</span>
            {['public', 'internal', 'restricted', 'confidential'].map(a => (
              <button
                key={a}
                onClick={() => {
                  setActiveFilters(prev => {
                    const levels = prev.access || []
                    return { ...prev, access: levels.includes(a) ? levels.filter(x => x !== a) : [...levels, a] }
                  })
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors ${
                  activeFilters.access?.includes(a) ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                {a}
              </button>
            ))}
            {(activeFilters.type?.length || activeFilters.access?.length) ? (
              <button onClick={() => setActiveFilters({})} className="text-[10px] text-brand-red hover:text-red-400 ml-2">
                Clear All
              </button>
            ) : null}
          </div>
        </AdminGlass>
      )}

      {/* ── Main Content Area ────────────────────────────────── */}
      <div className="flex gap-4">
        {/* ── Sidebar: Folder Tree ──────────────────────────── */}
        <div className="hidden lg:block w-60 flex-shrink-0">
          <AdminGlass padding="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Folders</span>
              <span className="text-[10px] text-gray-600">{MOCK_FOLDERS.filter(f => !f.parentId).length} root</span>
            </div>

            {/* All Files link */}
            <button
              onClick={() => navigateToFolder(null)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors mb-1 ${
                !currentFolderId ? 'bg-brand-red/20 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>All Files</span>
              <span className="ml-auto text-[10px] text-gray-600">{MOCK_FOLDERS.reduce((s, f) => s + f.fileCount, 0)}</span>
            </button>

            {/* Folder tree */}
            <div className="space-y-0.5 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-hide">
              {folderTree.map(node => (
                <FolderTreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  currentFolderId={currentFolderId}
                  expandedFolders={expandedFolders}
                  onNavigate={navigateToFolder}
                  onToggle={toggleFolderExpand}
                />
              ))}
            </div>
          </AdminGlass>

          {/* Storage indicator */}
          <AdminGlass padding="p-3" className="mt-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-400">Storage</span>
              <span className="text-white">{formatFileSize(storageStats.usedBytes)} / {formatFileSize(storageStats.totalBytes)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full bg-brand-red transition-all" style={{ width: `${storagePercent}%` }} />
            </div>
            <div className="mt-2 space-y-1">
              {storageStats.byCategory.slice(0, 4).map(cat => (
                <div key={cat.category} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">{cat.category}</span>
                  <span className="text-gray-400">{formatFileSize(cat.bytes)}</span>
                </div>
              ))}
            </div>
          </AdminGlass>
        </div>

        {/* ── Main: Files Area ──────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb + Sort */}
          <div className="flex items-center justify-between mb-3">
            <nav className="flex items-center gap-1 text-xs overflow-x-auto scrollbar-hide">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id ?? 'root'} className="flex items-center gap-1 whitespace-nowrap">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-gray-600" />}
                  <button
                    onClick={() => navigateToFolder(crumb.id)}
                    className={`hover:text-white transition-colors ${
                      i === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-gray-400'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (sortField === 'date') setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                  else { setSortField('date'); setSortDir('desc') }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  sortField === 'date' ? 'text-white bg-white/[0.06]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Clock className="w-3 h-3" /> Date {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => {
                  if (sortField === 'name') setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                  else { setSortField('name'); setSortDir('asc') }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  sortField === 'name' ? 'text-white bg-white/[0.06]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <ArrowUpDown className="w-3 h-3" /> Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => {
                  if (sortField === 'size') setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                  else { setSortField('size'); setSortDir('desc') }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  sortField === 'size' ? 'text-white bg-white/[0.06]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <File className="w-3 h-3" /> Size {sortField === 'size' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          {/* Batch Action Bar */}
          {selectedFiles.size > 0 && (
            <AdminGlass padding="p-2" className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white">{selectedFiles.size} file(s) selected</span>
                <div className="flex gap-2">
                  <button onClick={handleBatchDelete} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                  <button onClick={() => {
                    const ids = Array.from(selectedFiles)
                    const matchedFiles = files.filter(f => ids.indexOf(f.id) !== -1)
                    for (let i = 0; i < matchedFiles.length; i++) { handleDownload(matchedFiles[i]) }
                    setSelectedFiles(new Set())
                  }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                    <Download className="w-3 h-3" /> Download
                  </button>
                  <button onClick={() => setSelectedFiles(new Set())} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-400 hover:text-gray-200 transition-colors">
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>
            </AdminGlass>
          )}

          {/* Sub-folders (when not searching) */}
          {!isSearching && subFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 mb-4">
              {subFolders.map(folder => {
                const FIcon = FOLDER_ICONS[folder.icon] || FolderOpen
                return (
                  <button
                    key={folder.id}
                    onClick={() => navigateToFolder(folder.id)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group text-left"
                  >
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${folder.color}15` }}>
                      <FIcon className="w-4 h-4" style={{ color: folder.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">{folder.name}</p>
                      <p className="text-[10px] text-gray-600">{folder.fileCount} files</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Search indicator */}
          {isSearching && (
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
              <Search className="w-3.5 h-3.5" />
              <span>Showing results for &ldquo;{searchQuery}&rdquo;</span>
              {searchLoading && <span className="text-gray-600">Searching...</span>}
              {!searchLoading && <span className="text-gray-600">{searchResults.length} found</span>}
            </div>
          )}

          {/* Loading state */}
          {filesLoading && !isSearching && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-red border-t-transparent" />
            </div>
          )}

          {/* Empty state */}
          {!filesLoading && sortedFiles.length === 0 && !isSearching && subFolders.length === 0 && (
            <AdminGlass padding="p-8">
              <div className="text-center">
                <FolderOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">This folder is empty</p>
                <p className="text-xs text-gray-600 mt-1">Upload files or create subfolders to get started</p>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-medium text-brand-red bg-brand-red/10 border border-brand-red/20 hover:bg-brand-red/20 transition-colors"
                >
                  Upload Files
                </button>
              </div>
            </AdminGlass>
          )}

          {/* File views */}
          {sortedFiles.length > 0 && viewMode === 'grid' && (
            <FileGridView
              files={sortedFiles}
              selectedFiles={selectedFiles}
              onSelect={toggleFileSelect}
              onOpen={setDetailFileId}
              onStar={handleStarFile}
              onDownload={handleDownload}
              onDelete={handleDeleteFile}
            />
          )}

          {sortedFiles.length > 0 && viewMode === 'list' && (
            <FileListView
              files={sortedFiles}
              selectedFiles={selectedFiles}
              onSelect={toggleFileSelect}
              onOpen={setDetailFileId}
              onStar={handleStarFile}
              onDownload={handleDownload}
            />
          )}

          {sortedFiles.length > 0 && viewMode === 'table' && (
            <FileTableView
              files={sortedFiles}
              selectedFiles={selectedFiles}
              onSelect={toggleFileSelect}
              onOpen={setDetailFileId}
              onStar={handleStarFile}
              onDownload={handleDownload}
              onDelete={handleDeleteFile}
            />
          )}
        </div>

        {/* ── Detail Panel ───────────────────────────────────── */}
        {detailFile && (
          <div className="hidden xl:block w-72 flex-shrink-0">
            <FileDetailPanel
              file={detailFile}
              versions={versions}
              auditLog={auditLog}
              onClose={() => setDetailFileId(null)}
              onDownload={handleDownload}
              onDelete={handleDeleteFile}
              showToast={showToast}
            />
          </div>
        )}
      </div>

      {/* ── Upload Modal ──────────────────────────────────────── */}
      <AdminModal
        isOpen={uploadModalOpen}
        onClose={() => { setUploadModalOpen(false); setUploadProgress(null) }}
        title="Upload Files"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div
            className="rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center hover:border-brand-red/20 transition-colors cursor-pointer"
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-brand-red/40', 'bg-brand-red/5') }}
            onDragLeave={e => { e.currentTarget.classList.remove('border-brand-red/40', 'bg-brand-red/5') }}
            onDrop={async e => {
              e.preventDefault()
              e.currentTarget.classList.remove('border-brand-red/40', 'bg-brand-red/5')
              const droppedFiles = e.dataTransfer.files
              if (droppedFiles.length > 0) {
                const folder = currentFolder ? `admin/documents/${currentFolder.slug}` : 'admin/documents'
                setUploadProgress({ done: 0, total: droppedFiles.length })
                const results = await uploadFiles(Array.from(droppedFiles), folder, (done, total) => setUploadProgress({ done, total }))
                const successes = results.filter(r => r.success)
                const failures = results.filter(r => !r.success)
                if (successes.length > 0) showToast(`Uploaded ${successes.length} file(s) to Supabase Storage`, 'success')
                if (failures.length > 0) showToast(`${failures.length} file(s) failed: ${failures[0].error}`, 'error')
                setUploadProgress(null)
                setUploadModalOpen(false)
                refetchFiles()
              }
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = '.pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip'
              input.onchange = async () => {
                if (input.files && input.files.length > 0) {
                  const folder = currentFolder ? `admin/documents/${currentFolder.slug}` : 'admin/documents'
                  setUploadProgress({ done: 0, total: input.files.length })
                  const results = await uploadFiles(Array.from(input.files), folder, (done, total) => setUploadProgress({ done, total }))
                  const successes = results.filter(r => r.success)
                  const failures = results.filter(r => !r.success)
                  if (successes.length > 0) showToast(`Uploaded ${successes.length} file(s) to Supabase Storage`, 'success')
                  if (failures.length > 0) showToast(`${failures.length} file(s) failed: ${failures[0].error}`, 'error')
                  setUploadProgress(null)
                  setUploadModalOpen(false)
                  refetchFiles()
                }
              }
              input.click()
            }}
          >
            {uploadProgress ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-red border-t-transparent" />
                <p className="text-sm text-gray-400">Uploading {uploadProgress.done}/{uploadProgress.total} files…</p>
                <div className="w-48 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-brand-red transition-all" style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }} />
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Drag & drop files here, or click to browse</p>
                <p className="text-xs text-gray-600 mt-1">PDF, XLSX, DOCX, PPTX, images up to 50MB</p>
                <span className="inline-block mt-3 px-4 py-2 rounded-xl text-xs font-medium text-brand-red bg-brand-red/10 border border-brand-red/20 hover:bg-brand-red/20 transition-colors">
                  Browse Files
                </span>
              </>
            )}
          </div>

          {currentFolder && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Uploading to: <span className="text-white">{currentFolder.name}</span></span>
            </div>
          )}

          {isSupabaseConfigured() && (
            <div className="flex items-center gap-2 text-[10px] text-emerald-500">
              <CheckCircle className="w-3 h-3" />
              <span>Supabase Storage connected — files will be stored in cloud</span>
            </div>
          )}
        </div>
      </AdminModal>

      {/* ── New Folder Modal ──────────────────────────────────── */}
      <AdminModal
        isOpen={newFolderModalOpen}
        onClose={() => { setNewFolderModalOpen(false); setNewFolderName('') }}
        title="Create New Folder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Folder Name</label>
            <input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-red/30"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder() }}
              autoFocus
            />
          </div>
          {currentFolder && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Inside: <span className="text-white">{currentFolder.name}</span></span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <ModalButton variant="secondary" onClick={() => { setNewFolderModalOpen(false); setNewFolderName('') }}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </ModalButton>
          </div>
        </div>
      </AdminModal>

      {/* ── Detail Panel Modal for smaller screens ─────────────── */}
      {detailFile && (
        <AdminModal
          isOpen={!!detailFile && typeof window !== 'undefined' && window.innerWidth < 1280}
          onClose={() => setDetailFileId(null)}
          title={detailFile.title}
          maxWidth="max-w-3xl"
        >
          <FileDetailContent
            file={detailFile}
            versions={versions}
            auditLog={auditLog}
            onDownload={handleDownload}
            onDelete={handleDeleteFile}
            showToast={showToast}
          />
        </AdminModal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── Folder Tree Item ────────────────────────────────────────
function FolderTreeItem({
  node, depth, currentFolderId, expandedFolders, onNavigate, onToggle,
}: {
  node: FolderNode
  depth: number
  currentFolderId: string | null
  expandedFolders: Set<string>
  onNavigate: (id: string) => void
  onToggle: (id: string) => void
}) {
  const isActive = currentFolderId === node.id
  const isExpanded = expandedFolders.has(node.id)
  const hasChildren = node.children.length > 0
  const FIcon = FOLDER_ICONS[node.icon] || FolderOpen

  return (
    <div>
      <div className="flex items-center group" style={{ paddingLeft: `${depth * 12}px` }}>
        {hasChildren ? (
          <button onClick={() => onToggle(node.id)} className="p-0.5 text-gray-600 hover:text-gray-400 transition-colors">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <button
          onClick={() => onNavigate(node.id)}
          className={`flex-1 flex items-center gap-2 px-1.5 py-1 rounded-md text-[11px] transition-colors truncate ${
            isActive ? 'bg-brand-red/20 text-white font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
          }`}
        >
          <FIcon className="w-3 h-3 flex-shrink-0" style={{ color: isActive ? undefined : node.color }} />
          <span className="truncate">{node.name}</span>
          {node.fileCount > 0 && (
            <span className="ml-auto text-[9px] text-gray-600 flex-shrink-0">{node.fileCount}</span>
          )}
        </button>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <FolderTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              currentFolderId={currentFolderId}
              expandedFolders={expandedFolders}
              onNavigate={onNavigate}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Grid View ───────────────────────────────────────────────
function FileGridView({ files, selectedFiles, onSelect, onOpen, onStar, onDownload, onDelete }: {
  files: RepoFile[]
  selectedFiles: Set<string>
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onDownload: (file: RepoFile) => void
  onDelete: (id: string, title: string) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
      {files.map(file => {
        const colors = getFileTypeColor(file.fileType)
        const isSelected = selectedFiles.has(file.id)
        return (
          <div
            key={file.id}
            className={`relative p-3 rounded-xl border transition-all cursor-pointer group ${
              isSelected
                ? 'bg-brand-red/10 border-brand-red/30'
                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
            }`}
            onClick={() => onOpen(file.id)}
          >
            {/* Checkbox */}
            <button
              onClick={e => { e.stopPropagation(); onSelect(file.id) }}
              className={`absolute top-2 left-2 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                isSelected ? 'bg-brand-red border-brand-red' : 'border-white/[0.1] opacity-0 group-hover:opacity-100'
              }`}
            >
              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
            </button>

            {/* Star */}
            <button
              onClick={e => { e.stopPropagation(); onStar(file.id, file.starred) }}
              className={`absolute top-2 right-2 transition-all ${
                file.starred ? 'text-yellow-500' : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-yellow-500'
              }`}
            >
              <Star className="w-3.5 h-3.5" fill={file.starred ? 'currentColor' : 'none'} />
            </button>

            {/* File icon */}
            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mx-auto mb-2 mt-2`}>
              <FileTypeIcon type={file.fileType} className={`w-5 h-5 ${colors.text}`} />
            </div>

            {/* Info */}
            <p className="text-[11px] text-white font-medium text-center truncate">{file.title}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-[9px] text-gray-500 uppercase">{file.fileType}</span>
              <span className="text-[9px] text-gray-600">&middot;</span>
              <span className="text-[9px] text-gray-500">{formatFileSize(file.fileSize)}</span>
            </div>

            {/* Quick actions (hover) */}
            <div className="flex items-center justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={e => { e.stopPropagation(); onDownload(file) }} className="p-1 rounded hover:bg-white/[0.06] text-gray-400 hover:text-gray-200">
                <Download className="w-3 h-3" />
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(file.id, file.title) }} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Confidential badge */}
            {file.isConfidential && (
              <div className="absolute bottom-2 left-2">
                <Lock className="w-3 h-3 text-yellow-500/60" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── List View ───────────────────────────────────────────────
function FileListView({ files, selectedFiles, onSelect, onOpen, onStar, onDownload }: {
  files: RepoFile[]
  selectedFiles: Set<string>
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onDownload: (file: RepoFile) => void
}) {
  return (
    <AdminGlass padding="p-0">
      <div className="divide-y divide-white/[0.04]">
        {files.map(file => {
          const colors = getFileTypeColor(file.fileType)
          const isSelected = selectedFiles.has(file.id)
          return (
            <div
              key={file.id}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors group ${
                isSelected ? 'bg-brand-red/5' : 'hover:bg-white/[0.02]'
              }`}
              onClick={() => onOpen(file.id)}
            >
              <button
                onClick={e => { e.stopPropagation(); onSelect(file.id) }}
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'bg-brand-red border-brand-red' : 'border-white/[0.1] opacity-0 group-hover:opacity-100'
                }`}
              >
                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
              </button>

              <div className={`p-1.5 rounded-lg ${colors.bg} flex-shrink-0`}>
                <FileTypeIcon type={file.fileType} className={`w-3.5 h-3.5 ${colors.text}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white font-medium truncate">{file.title}</p>
                  {file.isConfidential && <Lock className="w-3 h-3 text-yellow-500/60 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">{formatFileSize(file.fileSize)}</span>
                  <span className="text-[10px] text-gray-600">&middot;</span>
                  <span className="text-[10px] text-gray-500">{file.uploadedByName}</span>
                  <span className="text-[10px] text-gray-600">&middot;</span>
                  <span className="text-[10px] text-gray-500">{new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  {file.folderPath && (
                    <>
                      <span className="text-[10px] text-gray-600">&middot;</span>
                      <span className="text-[10px] text-gray-600">{file.folderPath}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {file.tags.slice(0, 2).map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-500">{t}</span>
                ))}
              </div>

              <button
                onClick={e => { e.stopPropagation(); onStar(file.id, file.starred) }}
                className={`flex-shrink-0 transition-colors ${file.starred ? 'text-yellow-500' : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-yellow-500'}`}
              >
                <Star className="w-3.5 h-3.5" fill={file.starred ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={e => { e.stopPropagation(); onDownload(file) }}
                className="flex-shrink-0 p-1 rounded hover:bg-white/[0.06] text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </AdminGlass>
  )
}

// ── Table View ──────────────────────────────────────────────
function FileTableView({ files, selectedFiles, onSelect, onOpen, onStar, onDownload, onDelete }: {
  files: RepoFile[]
  selectedFiles: Set<string>
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onDownload: (file: RepoFile) => void
  onDelete: (id: string, title: string) => void
}) {
  return (
    <AdminGlass padding="p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="w-8 px-3 py-2.5"><span className="sr-only">Select</span></th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider">Name</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider">Type</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider">Size</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider hidden md:table-cell">Folder</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider hidden lg:table-cell">Uploaded By</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider">Date</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider">v</th>
              <th className="w-24 px-3 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {files.map(file => {
              const colors = getFileTypeColor(file.fileType)
              const isSelected = selectedFiles.has(file.id)
              return (
                <tr
                  key={file.id}
                  className={`cursor-pointer transition-colors group ${
                    isSelected ? 'bg-brand-red/5' : 'hover:bg-white/[0.02]'
                  }`}
                  onClick={() => onOpen(file.id)}
                >
                  <td className="px-3 py-2">
                    <button
                      onClick={e => { e.stopPropagation(); onSelect(file.id) }}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-brand-red border-brand-red' : 'border-white/[0.1]'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${colors.bg}`}>
                        <FileTypeIcon type={file.fileType} className={`w-3 h-3 ${colors.text}`} />
                      </div>
                      <span className="text-xs text-white truncate max-w-[200px]">{file.title}</span>
                      {file.isConfidential && <Lock className="w-3 h-3 text-yellow-500/60" />}
                    </div>
                  </td>
                  <td className="px-3 py-2"><span className="text-[10px] text-gray-400 uppercase">{file.fileType}</span></td>
                  <td className="px-3 py-2"><span className="text-[10px] text-gray-400">{formatFileSize(file.fileSize)}</span></td>
                  <td className="px-3 py-2 hidden md:table-cell"><span className="text-[10px] text-gray-500 truncate">{file.folderPath}</span></td>
                  <td className="px-3 py-2 hidden lg:table-cell"><span className="text-[10px] text-gray-400">{file.uploadedByName}</span></td>
                  <td className="px-3 py-2"><span className="text-[10px] text-gray-400">{new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span></td>
                  <td className="px-3 py-2"><span className="text-[10px] text-gray-500">v{file.version}</span></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); onStar(file.id, file.starred) }}
                        className={`p-1 rounded transition-colors ${file.starred ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'}`}>
                        <Star className="w-3 h-3" fill={file.starred ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); onDownload(file) }}
                        className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors">
                        <Download className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); onDelete(file.id, file.title) }}
                        className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AdminGlass>
  )
}

// ── File Detail Panel (sidebar) ─────────────────────────────
function FileDetailPanel({ file, versions, auditLog, onClose, onDownload, onDelete, showToast }: {
  file: RepoFile
  versions: any[]
  auditLog: any[]
  onClose: () => void
  onDownload: (file: RepoFile) => void
  onDelete: (id: string, title: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  return (
    <AdminGlass padding="p-0" className="sticky top-4">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-semibold text-white truncate">{file.title}</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.06] text-gray-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3">
        <FileDetailContent
          file={file}
          versions={versions}
          auditLog={auditLog}
          onDownload={onDownload}
          onDelete={onDelete}
          showToast={showToast}
        />
      </div>
    </AdminGlass>
  )
}

// ── File Detail Content (shared between panel & modal) ──────
function FileDetailContent({ file, versions, auditLog, onDownload, onDelete, showToast }: {
  file: RepoFile
  versions: any[]
  auditLog: any[]
  onDownload: (file: RepoFile) => void
  onDelete: (id: string, title: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'versions' | 'activity'>('info')
  const colors = getFileTypeColor(file.fileType)

  return (
    <div className="space-y-4">
      {/* File preview placeholder */}
      <div className={`w-full h-24 rounded-lg ${colors.bg} flex items-center justify-center`}>
        <FileTypeIcon type={file.fileType} className={`w-10 h-10 ${colors.text}`} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDownload(file)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        <button
          onClick={() => showToast('Share link copied to clipboard', 'success')}
          className="p-2 rounded-lg text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(file.id, file.title)}
          className="p-2 rounded-lg text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
        {(['info', 'versions', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveDetailTab(tab)}
            className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium capitalize transition-colors ${
              activeDetailTab === tab ? 'bg-brand-red/20 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {activeDetailTab === 'info' && (
        <div className="space-y-2.5">
          <DetailRow label="File name" value={file.fileName} />
          <DetailRow label="Type" value={file.fileType.toUpperCase()} />
          <DetailRow label="Size" value={formatFileSize(file.fileSize)} />
          <DetailRow label="Version" value={`v${file.version}`} />
          <DetailRow label="Category" value={file.category} />
          <DetailRow label="Access" value={file.accessLevel} />
          <DetailRow label="Uploaded by" value={file.uploadedByName} />
          <DetailRow label="Created" value={new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
          {file.expiresAt && <DetailRow label="Expires" value={new Date(file.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />}
          <DetailRow label="Downloads" value={String(file.downloadCount)} />
          {file.description && <DetailRow label="Description" value={file.description} />}
          {file.tags.length > 0 && (
            <div>
              <span className="text-[10px] text-gray-500">Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {file.tags.map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-400">{t}</span>
                ))}
              </div>
            </div>
          )}
          {file.isConfidential && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
              <Lock className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] text-yellow-400">Confidential document</span>
            </div>
          )}
        </div>
      )}

      {/* Versions tab */}
      {activeDetailTab === 'versions' && (
        <div className="space-y-2">
          {versions.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No version history</p>
          ) : versions.map((v: any) => (
            <div key={v.id} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white font-medium">v{v.versionNumber}</span>
                <span className="text-[9px] text-gray-500">{new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{v.changeSummary}</p>
              <p className="text-[9px] text-gray-600 mt-0.5">{v.uploadedByName} &middot; {formatFileSize(v.fileSize)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Activity tab */}
      {activeDetailTab === 'activity' && (
        <div className="space-y-2">
          {auditLog.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No activity recorded</p>
          ) : auditLog.map((entry: any) => (
            <div key={entry.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
              <AuditIcon action={entry.action} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white">
                  <span className="font-medium">{entry.performedByName}</span>{' '}
                  <span className="text-gray-400">{entry.action}</span>
                </p>
                <p className="text-[9px] text-gray-600">{new Date(entry.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Detail Row ──────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-[10px] text-gray-300 text-right truncate">{value}</span>
    </div>
  )
}

// ── Audit Icon ──────────────────────────────────────────────
function AuditIcon({ action }: { action: string }) {
  const icons: Record<string, { icon: LucideIcon; color: string }> = {
    upload: { icon: Upload, color: 'text-green-400' },
    download: { icon: Download, color: 'text-blue-400' },
    view: { icon: Eye, color: 'text-gray-400' },
    delete: { icon: Trash2, color: 'text-red-400' },
    move: { icon: FolderOpen, color: 'text-purple-400' },
    rename: { icon: Pencil, color: 'text-orange-400' },
    share: { icon: Share2, color: 'text-cyan-400' },
    version: { icon: History, color: 'text-yellow-400' },
    star: { icon: Star, color: 'text-yellow-400' },
    unstar: { icon: Star, color: 'text-gray-400' },
  }
  const { icon: Icon, color } = icons[action] || { icon: Info, color: 'text-gray-400' }
  return <Icon className={`w-3 h-3 mt-0.5 ${color}`} />
}
