'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  FolderOpen, Monitor, FileText, Key, Award, Eye, Download,
  Upload, Plus, Search, Calendar, Tag, Lock, Globe,
  HardDrive, Shield, AlertTriangle, Clock, CheckCircle2,
  Laptop, Server, File, FolderClosed, Trash2, Sparkles,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminCRUDPlaceholder from '../shared/AdminCRUDPlaceholder'
import { fetchAssets, fetchDocuments, insertRow, deleteAssetSafe } from '@/lib/supabase/adminDataService'
import { formatINR, formatDate } from '@/lib/admin/adminHooks'
import type { Asset, AssetCategory, AssetStatus } from '@/lib/admin/adminTypes'
import { saveBlobAs, getDownloadUrl } from '@/lib/supabase/storageService'
import UploadWithFolderPicker from '@/components/shared/UploadWithFolderPicker'
import DocumentGeneratorModal from '../shared/DocumentGeneratorModal'
import { pickTemplateKind, type DocumentKind } from '@/lib/admin/documentTemplates'

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
  /** Public URL when the underlying bucket is public; empty string when it's private and the UI must mint a signed URL via storageBucket + storagePath. */
  fileUrl: string
  /** Set when the object lives in a private bucket — used by View / Download to call getDownloadUrl() and produce a short-lived signed URL on demand. */
  storageBucket: string | null
  storagePath: string | null
  isTemplate: boolean
  accessLevel: string
  placeholders: string[]
}

// ── Sub-tabs ─────────────────────────────────────────────────────
// 2026-05-12: `tracking` added per the Super-Admin menu spec — surfaces
// the document-tracking timeline that until now lived inside a modal.
// 2026-05-13: `templates` added — auto-fetched blank PDF templates the
// super-admin can populate dynamically. Source bucket is `ghl-templates`
// (public), keyed off `documents.is_template = true`.
const ASSET_TABS = [
  { id: 'assets', label: 'Asset Inventory', icon: Monitor },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'tracking', label: 'Tracking', icon: FileText },
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

  // ── Document Generator (Fill & Download) ────────────────────────
  // 2026-05-13: Generate button on each known doc kind opens this modal
  // with the matching field set; output is a populated PDF via jsPDF.
  const [generator, setGenerator] = useState<{ kind: DocumentKind; documentName: string } | null>(null)
  const openGenerator = (doc: AdminDocument) => {
    const kind = pickTemplateKind(doc.category)
    if (!kind) {
      showToast('No generator available for this document type.', 'warning')
      return
    }
    setGenerator({ kind, documentName: doc.name })
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const [a, d] = await Promise.all([fetchAssets(), fetchDocuments()])
    setAssets(a || [])
    // Map raw DB documents to AdminDocument shape
    const mapped: AdminDocument[] = ((d || []) as any[]).map((raw: any) => {
      const meta = raw?.metadata && typeof raw.metadata === 'object' ? raw.metadata : {}
      // Files stored in a private bucket carry their bucket+path in metadata.
      // file_url for those rows is a `supabase://bucket/path` pseudo-URL (so
      // upsert keys stay stable) and the public storage endpoint 404s — we
      // must mint a signed URL on demand at View / Download time.
      const storageBucket: string | null = meta.bucket || null
      const storagePath: string | null = meta.path || null
      const rawUrl: string = String(raw.file_url || '')
      const usePublic = rawUrl.startsWith('https://')
      return {
        id: raw.id || String(Math.random()),
        name: raw.title || raw.file_name || raw.name || 'Untitled',
        type: (raw.file_type || raw.mime_type || raw.type || 'PDF').toUpperCase().replace('.',''),
        category: raw.category || 'general',
        uploadedBy: raw.uploaded_by_name || raw.uploaded_by || 'System',
        uploadDate: raw.created_at || raw.uploaded_at || raw.uploadDate || new Date().toISOString(),
        size: raw.file_size ? `${Math.round(Number(raw.file_size) / 1024)} KB` : (raw.size || '—'),
        version: raw.version || 1,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        fileUrl: usePublic ? rawUrl : '',
        storageBucket,
        storagePath,
        isTemplate: raw.is_template === true,
        accessLevel: raw.access_level || 'internal',
        placeholders: Array.isArray(meta.placeholders) ? meta.placeholders : [],
      }
    })
    setDocuments(mapped)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const kpis = useMemo(() => {
    const totalAssetValue = assets.reduce((s, a) => s + (a.value || 0), 0)
    const activeAssets = assets.filter(a => a.status === 'active').length
    const expiring = assets.filter(a => a.expiryDate && new Date(a.expiryDate) < new Date()).length
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

      <DocumentGeneratorModal
        isOpen={generator !== null}
        kind={generator?.kind || null}
        documentName={generator?.documentName || null}
        onClose={() => setGenerator(null)}
        showToast={showToast}
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
        {activeTab === 'assets' && <AssetInventoryTab assets={assets} showToast={showToast} onRefresh={loadData} />}
        {/* 2026-05-13: Documents tab hides templates — those live on the dedicated
            Templates sub-tab. Keeps the existing library view free of clutter. */}
        {activeTab === 'documents' && <DocumentsTab documents={documents.filter(d => !d.isTemplate)} showToast={showToast} openGenerator={openGenerator} />}
        {activeTab === 'templates' && <TemplatesTab documents={documents.filter(d => d.isTemplate)} loading={loading} showToast={showToast} openGenerator={openGenerator} />}
        {/* 2026-05-12: Document Tracking sub-tab — pulls the
            investment-doc-tracking timeline that the investor sees
            on their portal, scoped to admin view-only here. View
            actions on each row open the existing tracking modal. */}
        {activeTab === 'tracking' && (
          <AdminCRUDPlaceholder
            title="Document Tracking"
            description="Status timeline (Ack Letter, Agreement, Allotment, Certificate, TDS) per investment."
            icon={FileText}
            showToast={showToast}
            hint="Tracking rows are auto-created when an investment is approved. Open any investment from Sales → Investments and use the Tracking modal to inspect or update a stage."
          />
        )}
      </div>
    </div>
  )
}

// ── Asset Inventory Tab ─────────────────────────────────────────
function AssetInventoryTab({ assets, showToast, onRefresh }: { assets: any[]; showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void; onRefresh?: () => void }) {
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

  const handleAssetSubmit = async () => {
    if (!assetForm.name.trim()) {
      showToast('Asset name is required', 'error')
      return
    }
    try {
      // Map form categories to DB enum: digital, physical, license, certificate
      const catMap: Record<string, string> = { laptop: 'physical', desktop: 'physical', phone: 'physical', server: 'physical', monitor: 'physical', printer: 'physical', software: 'digital', domain: 'digital', license: 'license', certificate: 'certificate' }
      const dbCategory = catMap[assetForm.category] || 'physical'
      // assigned_to accepts text name or UUID
      const assignedToVal = assetForm.assignedTo?.trim() || null
      // Get current user for created_by
      let createdBy: string | null = null
      try {
        const { supabase: sb } = await import('@/lib/supabase/client')
        const { data: { user } } = await (sb as any).auth.getUser()
        createdBy = user?.id || null
      } catch { /* continue */ }
      const result = await insertRow('assets', {
        name: assetForm.name.trim(),
        category: dbCategory,
        serial_number: assetForm.serialNumber || null,
        assigned_to: assignedToVal,
        value: parseFloat(assetForm.purchaseValue) || 0,
        purchase_date: assetForm.purchaseDate || null,
        expiry_date: assetForm.warrantyExpiry || null,
        status: assetForm.status || 'active',
        location: assetForm.location || null,
        notes: `[${assetForm.category}] ${assetForm.notes || ''}`.trim(),
        created_by: createdBy,
      })
      if (result) {
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
        onRefresh?.()
      } else {
        showToast('Failed to register asset — check console for details', 'error')
      }
    } catch (err: any) {
      console.error('[AssetDocModule] handleAssetSubmit error:', err)
      showToast(err?.message || 'Failed to register asset', 'error')
    }
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

  const handleDeleteAsset = async (row: Asset) => {
    if (!window.confirm(`Delete asset "${row.name}"? This cannot be undone.`)) return
    const res = await deleteAssetSafe(row.id)
    if (res.ok) { showToast('Asset deleted', 'success'); onRefresh?.() }
    else showToast(res.error || 'Failed to delete asset', 'error')
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
        const isExpiringSoon = new Date(row.expiryDate) < new Date()
        return (
          <span className={`text-xs ${isExpiringSoon ? 'text-amber-400 font-medium' : 'text-gray-400'}`}>
            {formatDate(row.expiryDate)}
            {isExpiringSoon && ' ⚠'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '60px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteAsset(row) }}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
          title="Delete asset"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
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

// ── Helper: resolve a usable URL for a stored document ─────────────
// Private-bucket rows have `fileUrl=''` and `storageBucket`/`storagePath`
// set in their metadata; we mint a short-lived signed URL on demand.
// Public-bucket rows already have a long-lived `fileUrl`.
async function resolveDocumentUrl(doc: AdminDocument): Promise<{ url: string; error?: string }> {
  if (doc.fileUrl) return { url: doc.fileUrl }
  if (doc.storageBucket && doc.storagePath) {
    const res = await getDownloadUrl(doc.storagePath, doc.storageBucket)
    if (res.success && res.url) return { url: res.url }
    return { url: '', error: res.error || 'Failed to mint signed URL' }
  }
  return { url: '', error: 'No file URL or storage path available' }
}

// ── Documents Tab ───────────────────────────────────────────────
function DocumentsTab({ documents, showToast, openGenerator }: {
  documents: AdminDocument[]
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  openGenerator: (doc: AdminDocument) => void
}) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = useMemo(() => {
    const cats = new Set((documents || []).map(d => d?.category || 'general').filter(Boolean))
    return ['all', ...Array.from(cats)]
  }, [documents])

  const filtered = useMemo(() => {
    const docs = (documents || []).filter(Boolean)
    if (categoryFilter === 'all') return docs
    return docs.filter(d => (d?.category || 'general') === categoryFilter)
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
          const Icon = getFileIcon(doc.type || '')
          const colorClasses = getFileColor(doc.type || '')
          return (
            <AdminGlass key={doc.id} padding="p-4" className="group cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-brand-red transition-colors">{doc.name || 'Untitled'}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{doc.type || 'FILE'} • {doc.size || '—'} • v{doc.version || 1}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(Array.isArray(doc.tags) ? doc.tags : []).slice(0, 3).map(tag => (
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
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <button
                  onClick={async () => {
                    const { url, error } = await resolveDocumentUrl(doc)
                    if (!url) { showToast(error || 'No file URL available for this document', 'error'); return }
                    window.open(url, '_blank', 'noopener,noreferrer')
                  }}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={async () => {
                    const { url, error } = await resolveDocumentUrl(doc)
                    if (!url) { showToast(error || 'No file available for download', 'error'); return }
                    showToast(`Downloading ${doc.name}...`, 'info')
                    const link = document.createElement('a')
                    link.href = url
                    link.download = doc.name || 'document'
                    link.target = '_blank'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
                {pickTemplateKind(doc.category) && (
                  <button
                    onClick={() => openGenerator(doc)}
                    className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
                    title="Fill in the fields and download a fresh PDF for this document type"
                  >
                    <Sparkles className="w-3 h-3" />
                    Fill & Download
                  </button>
                )}
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

// ── Templates Tab ───────────────────────────────────────────────
// Auto-fetched from the public `ghl-templates` Supabase bucket via the
// documents table (filtered on is_template = true). Templates are
// intentionally blank — no logos, names, numbers or prefilled details —
// so the super-admin can populate the {{PLACEHOLDER}} tokens dynamically
// before issuing a document to an investor.
function TemplatesTab({
  documents,
  loading,
  showToast,
  openGenerator,
}: {
  documents: AdminDocument[]
  loading: boolean
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  openGenerator: (doc: AdminDocument) => void
}) {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return documents
    return documents.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q)),
    )
  }, [search, documents])

  const handleCopyUrl = async (doc: AdminDocument) => {
    const { url, error } = await resolveDocumentUrl(doc)
    if (!url) { showToast(error || 'No URL available for this template', 'error'); return }
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(doc.id)
      showToast('Template URL copied — paste into your generator or share securely.', 'success')
      setTimeout(() => setCopiedId(curr => (curr === doc.id ? null : curr)), 2000)
    } catch {
      showToast('Copy failed — please copy the URL manually.', 'warning')
    }
  }

  return (
    <div className="space-y-4">
      <AdminGlass padding="p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-300 space-y-1.5">
            <p>
              <span className="font-semibold text-white">Blank Templates Repository.</span>
              {' '}Auto-fetched from the public <code className="text-amber-300">ghl-templates</code> bucket on every load.
              Templates contain placeholder tokens (<code className="text-amber-300">{'{{INVESTOR_NAME}}'}</code>,{' '}
              <code className="text-amber-300">{'{{INVESTMENT_AMOUNT}}'}</code>, etc.) and intentionally carry no logos,
              names, numbers or prefilled details — the Super Admin populates them on demand.
            </p>
          </div>
        </div>
      </AdminGlass>

      <AdminGlass padding="p-4">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by template name, category or tag…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
        </div>
      </AdminGlass>

      {loading ? (
        <AdminGlass padding="p-10">
          <div className="text-center text-sm text-gray-500">Loading templates…</div>
        </AdminGlass>
      ) : filtered.length === 0 ? (
        <AdminGlass>
          <AdminEmptyState
            icon={FileText}
            title="No templates"
            description="Run the seed script (scripts/seed-admin-document-templates.mjs) or upload templates with is_template=true."
          />
        </AdminGlass>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(doc => (
            <AdminGlass key={doc.id} padding="p-4" className="group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl flex-shrink-0 text-amber-400 bg-amber-500/10">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-brand-red transition-colors">{doc.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {doc.type} • {doc.size} • v{doc.version}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <AdminBadge label={doc.category} variant="purple" size="sm" />
                    <AdminBadge label={doc.accessLevel} variant={doc.accessLevel === 'public' ? 'success' : 'neutral'} size="sm" />
                    {doc.placeholders.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-400 border border-white/[0.06]">
                        {doc.placeholders.length} fields
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {doc.placeholders.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1.5">Placeholders</p>
                  <div className="flex flex-wrap gap-1">
                    {doc.placeholders.slice(0, 8).map(p => (
                      <code key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {p}
                      </code>
                    ))}
                    {doc.placeholders.length > 8 && (
                      <span className="text-[10px] text-gray-500">+{doc.placeholders.length - 8} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                {pickTemplateKind(doc.category) && (
                  <button
                    onClick={() => openGenerator(doc)}
                    className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
                    title="Fill in the fields and download a populated PDF"
                  >
                    <Sparkles className="w-3 h-3" /> Fill & Download
                  </button>
                )}
                <button
                  onClick={async () => {
                    const { url, error } = await resolveDocumentUrl(doc)
                    if (!url) { showToast(error || 'Template URL is missing — re-run the seed script.', 'error'); return }
                    window.open(url, '_blank', 'noopener,noreferrer')
                  }}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  title="Open the blank template"
                >
                  <Eye className="w-3 h-3" /> View
                </button>
                <button
                  onClick={async () => {
                    const { url, error } = await resolveDocumentUrl(doc)
                    if (!url) { showToast(error || 'Template URL is missing — re-run the seed script.', 'error'); return }
                    const link = document.createElement('a')
                    link.href = url
                    link.download = doc.name
                    link.target = '_blank'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  title="Download a copy of the blank template"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
                <button
                  onClick={() => handleCopyUrl(doc)}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  title="Copy the public auto-fetch URL"
                >
                  {copiedId === doc.id ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Tag className="w-3 h-3" />}
                  {copiedId === doc.id ? 'Copied' : 'Copy URL'}
                </button>
              </div>
            </AdminGlass>
          ))}
        </div>
      )}
    </div>
  )
}
