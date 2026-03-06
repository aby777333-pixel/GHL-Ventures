'use client'

import { useState, useMemo, useRef } from 'react'
import { FolderOpen, ChevronRight, Upload, Search, X, AlertTriangle } from 'lucide-react'
import { MOCK_FOLDERS } from '@/lib/admin/fileRepositoryData'
import type { RepoFolder } from '@/lib/admin/fileRepositoryTypes'
import { uploadFile } from '@/lib/supabase/storageService'

// ── Folder tree structure ───────────────────────────────────
interface FolderNode extends RepoFolder {
  children: FolderNode[]
}

function buildTree(folders: RepoFolder[]): FolderNode[] {
  const map = new Map<string, FolderNode>()
  const roots: FolderNode[] = []
  folders.forEach(f => map.set(f.id, { ...f, children: [] }))
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  roots.sort((a, b) => a.sortOrder - b.sortOrder)
  roots.forEach(r => r.children.sort((a, b) => a.sortOrder - b.sortOrder))
  return roots
}

// ── Props ───────────────────────────────────────────────────
interface UploadWithFolderPickerProps {
  open: boolean
  onClose: () => void
  /** Default upload route key, e.g. 'admin/documents' */
  defaultRoute?: string
  /** File accept filter */
  accept?: string
  /** Allow multiple files */
  multiple?: boolean
  /** Toast function */
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  /** Called after upload completes */
  onUploadComplete?: (results: { success: boolean; fileName: string }[]) => void
  /** Theme: 'dark' (admin) or 'teal' (staff) */
  theme?: 'dark' | 'teal'
  /** Portal context for upload route, e.g. 'admin', 'staff', 'investor' */
  portal?: string
}

export default function UploadWithFolderPicker({
  open,
  onClose,
  defaultRoute = 'admin/documents',
  accept = '.pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip',
  multiple = true,
  showToast,
  onUploadComplete,
  theme = 'dark',
  portal = 'admin',
}: UploadWithFolderPickerProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'folder' | 'confirm' | 'uploading'>('folder')
  const pendingFilesRef = useRef<FileList | null>(null)

  const folderTree = useMemo(() => buildTree(MOCK_FOLDERS), [])

  const accentBg = theme === 'teal' ? 'bg-teal-600' : 'bg-brand-red'
  const accentHover = theme === 'teal' ? 'hover:bg-teal-700' : 'hover:bg-red-600'
  const accentBorder = theme === 'teal' ? 'border-teal-500/30' : 'border-brand-red/30'
  const accentBgLight = theme === 'teal' ? 'bg-teal-500/10' : 'bg-brand-red/10'
  const accentText = theme === 'teal' ? 'text-teal-400' : 'text-red-400'
  const focusBorder = theme === 'teal' ? 'focus:border-teal-500/40 focus:ring-teal-500/20' : 'focus:border-brand-red/40 focus:ring-brand-red/20'

  const selectedFolderData = useMemo(() => {
    if (!selectedFolder) return null
    return MOCK_FOLDERS.find(f => f.id === selectedFolder) || null
  }, [selectedFolder])

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return folderTree
    const q = searchQuery.toLowerCase()
    // Flatten and filter, then rebuild
    const matching = MOCK_FOLDERS.filter(f => f.name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q))
    return matching.map(f => ({ ...f, children: [] as FolderNode[] }))
  }, [searchQuery, folderTree])

  const toggleExpand = (folderId: string) => {
    const next = new Set(expandedFolders)
    if (next.has(folderId)) next.delete(folderId)
    else next.add(folderId)
    setExpandedFolders(next)
  }

  // Step 1: Open file picker, then move to confirmation step
  const handleChooseFiles = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    if (multiple) input.multiple = true

    input.onchange = () => {
      const files = input.files
      if (!files || files.length === 0) {
        return
      }
      pendingFilesRef.current = files
      setStep('confirm')
    }

    input.oncancel = () => {
      // User cancelled the file picker, stay on folder step
    }

    input.click()
  }

  // Step 2: User confirmed — actually upload
  const handleConfirmUpload = async () => {
    const files = pendingFilesRef.current
    if (!files || files.length === 0) {
      setStep('folder')
      return
    }

    setStep('uploading')
    setUploading(true)
    showToast?.(`Uploading ${files.length} file(s)...`, 'info')

    const folderPath = selectedFolderData?.path || ''
    const routeKey = folderPath
      ? `${portal}/${folderPath.replace(/^\//, '').split('/')[0]}`
      : defaultRoute

    const results: { success: boolean; fileName: string }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await uploadFile(file, routeKey)
      results.push({ success: result.success, fileName: file.name })
    }

    const okCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    if (okCount > 0) {
      const folderName = selectedFolderData?.name || 'selected folder'
      showToast?.(`${okCount} file(s) uploaded to "${folderName}"`, 'success')
    }
    if (failCount > 0) showToast?.(`${failCount} file(s) failed to upload`, 'error')

    onUploadComplete?.(results)
    pendingFilesRef.current = null
    setUploading(false)
    setStep('folder')
    onClose()
  }

  // Cancel confirmation — go back to folder selection
  const handleCancelConfirm = () => {
    pendingFilesRef.current = null
    setStep('folder')
  }

  const renderFolder = (node: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id)
    const isSelected = selectedFolder === node.id
    const hasChildren = node.children.length > 0

    return (
      <div key={node.id}>
        <button
          onClick={() => {
            setSelectedFolder(node.id)
            if (hasChildren) toggleExpand(node.id)
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
            isSelected
              ? `${accentBgLight} ${accentText} border ${accentBorder}`
              : 'hover:bg-white/[0.04] text-gray-400 border border-transparent'
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          {hasChildren ? (
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          ) : (
            <span className="w-3.5" />
          )}
          <FolderOpen className="w-4 h-4 shrink-0" style={{ color: node.color }} />
          <span className="text-sm truncate flex-1">{node.name}</span>
          <span className="text-[10px] text-gray-600">{node.fileCount}</span>
        </button>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Documents
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a folder, then choose files to upload</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search folders..."
              className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none ${focusBorder} focus:ring-1`}
            />
          </div>
        </div>

        {/* Folder List */}
        <div className="px-4 py-3 max-h-[340px] overflow-y-auto space-y-0.5">
          {searchQuery.trim() ? (
            filteredTree.length > 0 ? (
              filteredTree.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedFolder === f.id
                      ? `${accentBgLight} ${accentText} border ${accentBorder}`
                      : 'hover:bg-white/[0.04] text-gray-400 border border-transparent'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 shrink-0" style={{ color: f.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{f.name}</span>
                    <span className="text-[10px] text-gray-600 truncate block">{f.path}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">No folders match &quot;{searchQuery}&quot;</p>
            )
          ) : (
            folderTree.map(node => renderFolder(node))
          )}
        </div>

        {/* Selected Folder Info */}
        {selectedFolderData && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" style={{ color: selectedFolderData.color }} />
              <span className="text-sm font-medium text-white">{selectedFolderData.name}</span>
              <span className="text-[10px] text-gray-500 ml-auto">{selectedFolderData.path}</span>
            </div>
            {selectedFolderData.description && (
              <p className="text-[11px] text-gray-500 mt-1 ml-6">{selectedFolderData.description}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleChooseFiles}
            disabled={!selectedFolder || uploading}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${accentBg} ${accentHover}`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Choose Files & Upload'}
          </button>
        </div>

        {/* ── Confirmation Overlay ─────────────────────────────── */}
        {step === 'confirm' && pendingFilesRef.current && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl">
            <div className="w-full max-w-sm mx-6 bg-[#111] border border-white/[0.10] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${accentBgLight}`}>
                  <AlertTriangle className={`w-5 h-5 ${accentText}`} />
                </div>
                <h3 className="text-base font-semibold text-white">Confirm Upload</h3>
              </div>

              <p className="text-sm text-gray-300 mb-2">
                Are you sure you want to save {pendingFilesRef.current.length === 1 ? 'this file' : `these ${pendingFilesRef.current.length} files`} in this repository?
              </p>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] mb-1">
                <FolderOpen className="w-4 h-4 shrink-0" style={{ color: selectedFolderData?.color }} />
                <span className="text-sm font-medium text-white truncate">{selectedFolderData?.name}</span>
              </div>

              <div className="mb-5 mt-3 space-y-1 max-h-[120px] overflow-y-auto">
                {Array.from(pendingFilesRef.current).map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <Upload className="w-3 h-3 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-600 shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors ${accentBg} ${accentHover}`}
                >
                  <Upload className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Uploading Overlay ────────────────────────────────── */}
        {step === 'uploading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-red border-t-transparent" />
              <p className="text-sm text-gray-400">Uploading files...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
