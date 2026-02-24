'use client'

import { useState, useMemo } from 'react'
import {
  FolderOpen, Monitor, FileText, Key, Award, Eye, Download,
  Upload, Plus, Search, Calendar, Tag, Lock, Globe,
  HardDrive, Shield, AlertTriangle, Clock, CheckCircle2,
  Laptop, Server, File, FolderClosed,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { ASSETS_DATA } from '@/lib/admin/adminMockData'
import { formatINR, formatDate } from '@/lib/admin/adminHooks'
import type { Asset, AssetCategory, AssetStatus } from '@/lib/admin/adminTypes'

// ── Mock Documents ──────────────────────────────────────────────
interface AdminDocument {
  id: string
  name: string
  type: string
  category: string
  uploadedBy: string
  uploadDate: string
  size: string
  version: number
  tags: string[]
}

const DOCUMENTS_DATA: AdminDocument[] = [
  { id: 'DOC-001', name: 'Q4 2024 Fund Performance Report', type: 'PDF', category: 'Reports', uploadedBy: 'Karthik Sundaram', uploadDate: '2025-03-19', size: '2.4 MB', version: 3, tags: ['fund', 'quarterly', 'performance'] },
  { id: 'DOC-002', name: 'SEBI Annual Filing 2024-25', type: 'PDF', category: 'Compliance', uploadedBy: 'Meera Subramaniam', uploadDate: '2025-03-15', size: '5.1 MB', version: 1, tags: ['sebi', 'filing', 'annual'] },
  { id: 'DOC-003', name: 'Investment Agreement Template v4', type: 'DOCX', category: 'Templates', uploadedBy: 'Sowmya Rajan', uploadDate: '2025-03-10', size: '180 KB', version: 4, tags: ['template', 'legal', 'agreement'] },
  { id: 'DOC-004', name: 'Client Onboarding Checklist', type: 'PDF', category: 'Operations', uploadedBy: 'Divya Krishnamurthy', uploadDate: '2025-03-05', size: '450 KB', version: 2, tags: ['onboarding', 'checklist', 'client'] },
  { id: 'DOC-005', name: 'Brand Guidelines 2025', type: 'PDF', category: 'Marketing', uploadedBy: 'Abe Thayil', uploadDate: '2025-02-20', size: '12.8 MB', version: 1, tags: ['brand', 'guidelines', 'marketing'] },
  { id: 'DOC-006', name: 'NDA Template — Standard', type: 'DOCX', category: 'Templates', uploadedBy: 'Sowmya Rajan', uploadDate: '2025-02-15', size: '95 KB', version: 3, tags: ['nda', 'template', 'legal'] },
  { id: 'DOC-007', name: 'Employee Handbook 2025', type: 'PDF', category: 'HR', uploadedBy: 'Abe Thayil', uploadDate: '2025-01-10', size: '3.2 MB', version: 5, tags: ['handbook', 'hr', 'policy'] },
  { id: 'DOC-008', name: 'Risk Assessment Framework', type: 'XLSX', category: 'Compliance', uploadedBy: 'Meera Subramaniam', uploadDate: '2025-01-05', size: '780 KB', version: 2, tags: ['risk', 'framework', 'compliance'] },
]

// ── Sub-tabs ─────────────────────────────────────────────────────
const ASSET_TABS = [
  { id: 'assets', label: 'Asset Inventory', icon: Monitor },
  { id: 'documents', label: 'Documents', icon: FileText },
] as const

type AssetTab = typeof ASSET_TABS[number]['id']

interface AssetDocModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function AssetDocModule({ subTab, navigate, showToast }: AssetDocModuleProps) {
  const activeTab = (ASSET_TABS.some(t => t.id === subTab) ? subTab : 'assets') as AssetTab

  const kpis = useMemo(() => {
    const totalAssetValue = ASSETS_DATA.reduce((s, a) => s + a.value, 0)
    const activeAssets = ASSETS_DATA.filter(a => a.status === 'active').length
    const expiring = ASSETS_DATA.filter(a => a.expiryDate && new Date(a.expiryDate) < new Date('2025-06-01')).length
    return { totalAssets: ASSETS_DATA.length, activeAssets, totalAssetValue, expiring, totalDocs: DOCUMENTS_DATA.length }
  }, [])

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'assets' ? 'assets' : `assets/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets & Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Asset inventory and document management system</p>
        </div>
        <button
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = '.pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip'
            input.onchange = () => {
              if (input.files && input.files.length > 0) {
                const names = Array.from(input.files).map(f => f.name).join(', ')
                showToast(`Selected ${input.files.length} file(s): ${names}`, 'success')
              }
            }
            input.click()
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <AdminKPICard title="Total Assets" value={kpis.totalAssets} icon={Monitor} color="#3B82F6" delay={0} />
        <AdminKPICard title="Active Assets" value={kpis.activeAssets} icon={CheckCircle2} color="#10B981" delay={50} />
        <AdminKPICard title="Asset Value" value={formatINR(kpis.totalAssetValue)} icon={HardDrive} color="#8B5CF6" delay={100} />
        <AdminKPICard title="Expiring Soon" value={kpis.expiring} icon={AlertTriangle} color="#F59E0B" delay={150} />
        <AdminKPICard title="Documents" value={kpis.totalDocs} icon={FileText} color="#DC2626" delay={200} />
      </div>

      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {ASSET_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="admin-tab-switch">
        {activeTab === 'assets' && <AssetInventoryTab showToast={showToast} />}
        {activeTab === 'documents' && <DocumentsTab showToast={showToast} />}
      </div>
    </div>
  )
}

// ── Asset Inventory Tab ─────────────────────────────────────────
function AssetInventoryTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const getCategoryIcon = (cat: AssetCategory) => {
    switch (cat) {
      case 'digital': return Globe
      case 'physical': return Laptop
      case 'license': return Key
      case 'certificate': return Award
    }
  }

  const getStatusVariant = (status: AssetStatus) => {
    switch (status) {
      case 'active': return 'success' as const
      case 'expired': return 'error' as const
      case 'maintenance': return 'warning' as const
      case 'decommissioned': return 'neutral' as const
    }
  }

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      label: 'Asset',
      render: (row) => {
        const Icon = getCategoryIcon(row.category)
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/[0.04]">
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{row.name}</p>
              <p className="text-[11px] text-gray-500">{row.id}{row.serialNumber ? ` • ${row.serialNumber}` : ''}</p>
            </div>
          </div>
        )
      },
    },
    { key: 'category', label: 'Category', render: (row) => <AdminBadge label={row.category} variant="purple" /> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <AdminBadge label={row.status} variant={getStatusVariant(row.status)} dot />,
    },
    { key: 'assignedTo', label: 'Assigned To', render: (row) => <span className="text-xs text-gray-400">{row.assignedTo || '—'}</span> },
    { key: 'value', label: 'Value', render: (row) => <span className="text-white font-medium">{formatINR(row.value)}</span> },
    {
      key: 'expiryDate',
      label: 'Expiry',
      render: (row) => {
        if (!row.expiryDate) return <span className="text-xs text-gray-600">—</span>
        const isExpiringSoon = new Date(row.expiryDate) < new Date('2025-06-01')
        return (
          <span className={`text-xs ${isExpiringSoon ? 'text-amber-400 font-medium' : 'text-gray-400'}`}>
            {formatDate(row.expiryDate)}
            {isExpiringSoon && ' ⚠'}
          </span>
        )
      },
    },
  ]

  return (
    <AdminGlass padding="p-4">
      <AdminDataTable<Asset>
        columns={columns}
        data={ASSETS_DATA}
        searchKeys={['name', 'category', 'assignedTo']}
        searchPlaceholder="Search assets..."
        exportable
        title="Asset Inventory"
        actions={
          <button
            onClick={() => showToast('Asset registration form — fill in details to add a new asset', 'info')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-brand-red/20 border border-brand-red/30 rounded-lg hover:bg-brand-red/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Asset
          </button>
        }
      />
    </AdminGlass>
  )
}

// ── Documents Tab ───────────────────────────────────────────────
function DocumentsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = useMemo(() => {
    const cats = new Set(DOCUMENTS_DATA.map(d => d.category))
    return ['all', ...Array.from(cats)]
  }, [])

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return DOCUMENTS_DATA
    return DOCUMENTS_DATA.filter(d => d.category === categoryFilter)
  }, [categoryFilter])

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return File
      case 'DOCX': return FileText
      case 'XLSX': return Server
      default: return File
    }
  }

  const getFileColor = (type: string) => {
    switch (type) {
      case 'PDF': return 'text-red-400 bg-red-500/15'
      case 'DOCX': return 'text-blue-400 bg-blue-500/15'
      case 'XLSX': return 'text-emerald-400 bg-emerald-500/15'
      default: return 'text-gray-400 bg-gray-500/15'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              categoryFilter === cat
                ? 'bg-brand-red/20 text-white border-brand-red/30'
                : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {cat === 'all' ? 'All Documents' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(doc => {
          const Icon = getFileIcon(doc.type)
          const colorClasses = getFileColor(doc.type)
          return (
            <AdminGlass key={doc.id} padding="p-4" className="group cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-brand-red transition-colors">{doc.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{doc.type} • {doc.size} • v{doc.version}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-500 border border-white/[0.06]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-gray-500">
                    <span>{doc.uploadedBy}</span>
                    <span>{formatDate(doc.uploadDate)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <button
                  onClick={() => showToast('Opening document preview...', 'info')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={async () => {
                    showToast(`Downloading ${doc.name}...`, 'info')
                    const content = `Document: ${doc.name}\nType: ${doc.type}\nCategory: ${doc.category}\nVersion: ${doc.version}\nUploaded by: ${doc.uploadedBy}\nDate: ${doc.uploadDate}\nSize: ${doc.size}\n\n[Demo document content — connect Supabase Storage for real files]`
                    const blob = new Blob([content], { type: 'application/octet-stream' })
                    const ext = doc.type.toLowerCase() === 'pdf' ? 'pdf' : doc.type.toLowerCase() === 'xlsx' ? 'xlsx' : doc.type.toLowerCase() === 'docx' ? 'docx' : 'txt'
                    const filename = `${doc.name.replace(/[^a-zA-Z0-9 ]/g, '')}.${ext}`
                    if ('showSaveFilePicker' in window) {
                      try {
                        const handle = await (window as any).showSaveFilePicker({ suggestedName: filename })
                        const writable = await handle.createWritable()
                        await writable.write(blob)
                        await writable.close()
                        showToast(`Saved ${doc.name}`, 'success')
                        return
                      } catch (err: any) { if (err?.name === 'AbortError') return }
                    }
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = filename
                    document.body.appendChild(a); a.click()
                    document.body.removeChild(a); URL.revokeObjectURL(url)
                    showToast(`Downloaded ${doc.name}`, 'success')
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </AdminGlass>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full">
            <AdminGlass><AdminEmptyState title="No documents" description="No documents found in this category." /></AdminGlass>
          </div>
        )}
      </div>
    </div>
  )
}
