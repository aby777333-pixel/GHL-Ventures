'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
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
import { fetchAssets, fetchDocuments } from '@/lib/supabase/adminDataService'
import { formatINR, formatDate } from '@/lib/admin/adminHooks'
import type { Asset, AssetCategory, AssetStatus } from '@/lib/admin/adminTypes'
import { saveBlobAs } from '@/lib/supabase/storageService'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'

// ── Document type ───────────────────────────────────────────────
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
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)

  const [assets, setAssets] = useState<any[]>([])
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [a, d] = await Promise.all([fetchAssets(), fetchDocuments()])
    setAssets(a)
    setDocuments(d as any)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const kpis = useMemo(() => {
    const totalAssetValue = assets.reduce((s, a) => s + (a.value || 0), 0)
    const activeAssets = assets.filter(a => a.status === 'active').length
    const expiring = assets.filter(a => a.expiryDate && new Date(a.expiryDate) < new Date('2025-06-01')).length
    return { totalAssets: assets.length, activeAssets, totalAssetValue, expiring, totalDocs: documents.length }
  }, [assets, documents])

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
          onClick={() => setFolderPickerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <UploadWithFolderPicker
        open={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        defaultRoute="admin/assets"
        showToast={showToast as any}
        onUploadComplete={(results) => {
          const ok = results.filter(r => r.success).length
          if (ok > 0) showToast(`${ok} file(s) uploaded to Assets`, 'success')
        }}
        theme="dark"
        portal="admin"
      />

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
        {activeTab === 'assets' && <AssetInventoryTab assets={assets} showToast={showToast} />}
        {activeTab === 'documents' && <DocumentsTab documents={documents} showToast={showToast} />}
      </div>
    </div>
  )
}

// ── Asset Inventory Tab ─────────────────────────────────────────
function AssetInventoryTab({ assets, showToast }: { assets: any[]; showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [addAssetOpen, setAddAssetOpen] = useState(false)
  const [assetFolderPickerOpen, setAssetFolderPickerOpen] = useState(false)
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'laptop' as string,
    serialNumber: '',
    assignedTo: '',
    purchaseValue: '',
    purchaseDate: '',
    warrantyExpiry: '',
    status: 'active' as string,
    location: '',
    notes: '',
  })

  const handleAssetFormChange = (field: string, value: string) => {
    setAssetForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAssetSubmit = () => {
    if (!assetForm.name.trim()) {
      showToast('Asset name is required', 'error')
      return
    }
    showToast('Asset registered successfully', 'success')
    setAddAssetOpen(false)
    setAssetForm({
      name: '',
      category: 'laptop',
      serialNumber: '',
      assignedTo: '',
      purchaseValue: '',
      purchaseDate: '',
      warrantyExpiry: '',
      status: 'active',
      location: '',
      notes: '',
    })
  }

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
    <>
      <AdminGlass padding="p-4">
        <AdminDataTable<Asset>
          columns={columns}
          data={assets}
          searchKeys={['name', 'category', 'assignedTo']}
          searchPlaceholder="Search assets..."
          exportable
          title="Asset Inventory"
          actions={
            <button
              onClick={() => setAddAssetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-brand-red/20 border border-brand-red/30 rounded-lg hover:bg-brand-red/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Asset
            </button>
          }
        />
      </AdminGlass>

      <AdminModal
        isOpen={addAssetOpen}
        onClose={() => setAddAssetOpen(false)}
        title="Register New Asset"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* Asset Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Asset Name *</label>
            <input
              type="text"
              value={assetForm.name}
              onChange={(e) => handleAssetFormChange('name', e.target.value)}
              placeholder="e.g. MacBook Pro 16-inch"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <select
                value={assetForm.category}
                onChange={(e) => handleAssetFormChange('category', e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="phone">Phone</option>
                <option value="tablet">Tablet</option>
                <option value="monitor">Monitor</option>
                <option value="server">Server</option>
                <option value="networking">Networking</option>
                <option value="software">Software</option>
                <option value="furniture">Furniture</option>
                <option value="vehicle">Vehicle</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Serial Number</label>
              <input
                type="text"
                value={assetForm.serialNumber}
                onChange={(e) => handleAssetFormChange('serialNumber', e.target.value)}
                placeholder="e.g. SN-2025-001"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Assigned To</label>
              <input
                type="text"
                value={assetForm.assignedTo}
                onChange={(e) => handleAssetFormChange('assignedTo', e.target.value)}
                placeholder="e.g. Karthik Sundaram"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>

            {/* Purchase Value */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Purchase Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">INR</span>
                <input
                  type="number"
                  value={assetForm.purchaseValue}
                  onChange={(e) => handleAssetFormChange('purchaseValue', e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                />
              </div>
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Purchase Date</label>
              <input
                type="date"
                value={assetForm.purchaseDate}
                onChange={(e) => handleAssetFormChange('purchaseDate', e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>

            {/* Warranty Expiry Date */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Warranty Expiry Date</label>
              <input
                type="date"
                value={assetForm.warrantyExpiry}
                onChange={(e) => handleAssetFormChange('warrantyExpiry', e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
              <select
                value={assetForm.status}
                onChange={(e) => handleAssetFormChange('status', e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="active">Active</option>
                <option value="in-maintenance">In Maintenance</option>
                <option value="retired">Retired</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Location</label>
              <input
                type="text"
                value={assetForm.location}
                onChange={(e) => handleAssetFormChange('location', e.target.value)}
                placeholder="e.g. HQ — Floor 3"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea
              value={assetForm.notes}
              onChange={(e) => handleAssetFormChange('notes', e.target.value)}
              placeholder="Additional notes about this asset..."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none"
            />
          </div>

          {/* Attach Asset Documents */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Attach Asset Documents</label>
            <button
              type="button"
              onClick={() => setAssetFolderPickerOpen(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-dashed border-white/[0.12] hover:bg-white/[0.08] hover:border-white/[0.2] transition-colors w-full justify-center"
            >
              <Upload className="w-4 h-4" />
              Upload Invoices, Warranties & Photos
            </button>
            <p className="text-[10px] text-gray-600 mt-1">Stored in File Repository &gt; Assets</p>
          </div>

          <UploadWithFolderPicker
            open={assetFolderPickerOpen}
            onClose={() => setAssetFolderPickerOpen(false)}
            defaultRoute="admin/assets"
            showToast={showToast as any}
            onUploadComplete={(results) => {
              const ok = results.filter(r => r.success).length
              if (ok > 0) showToast(`${ok} file(s) uploaded to Assets`, 'success')
            }}
            theme="dark"
            portal="admin"
          />
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => setAddAssetOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssetSubmit}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors"
          >
            Register Asset
          </button>
        </div>
      </AdminModal>
    </>
  )
}

// ── Documents Tab ───────────────────────────────────────────────
function DocumentsTab({ documents, showToast }: { documents: AdminDocument[]; showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = useMemo(() => {
    const cats = new Set(documents.map(d => d.category))
    return ['all', ...Array.from(cats)]
  }, [documents])

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return documents
    return documents.filter(d => d.category === categoryFilter)
  }, [categoryFilter, documents])

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
                    {(doc.tags ?? []).slice(0, 3).map(tag => (
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
                    const ext = doc.type.toLowerCase() === 'pdf' ? 'pdf' : doc.type.toLowerCase() === 'xlsx' ? 'xlsx' : doc.type.toLowerCase() === 'docx' ? 'docx' : 'txt'
                    const filename = `${doc.name.replace(/[^a-zA-Z0-9 ]/g, '')}.${ext}`
                    const content = `Document: ${doc.name}\nType: ${doc.type}\nCategory: ${doc.category}\nVersion: ${doc.version}\nUploaded by: ${doc.uploadedBy}\nDate: ${doc.uploadDate}\nSize: ${doc.size}`
                    const blob = new Blob([content], { type: 'application/octet-stream' })
                    await saveBlobAs(blob, filename, showToast as any)
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
