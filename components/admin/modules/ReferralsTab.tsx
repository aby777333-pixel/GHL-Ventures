'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, UserPlus, CheckCircle2, XCircle, Eye, Mail, Phone, MapPin, IndianRupee } from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { fetchReferrals, updateReferral, type Referral } from '@/lib/supabase/adminDataService'
import { formatDate } from '@/lib/admin/adminHooks'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

export default function ReferralsTab({ showToast }: { showToast: ShowToast }) {
  const [items, setItems] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Referral | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setItems(await fetchReferrals())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setNotes(selected?.admin_notes || '') }, [selected])

  const kpis = useMemo(() => {
    const total = items.length
    const pending = items.filter(r => r.status === 'new').length
    const converted = items.filter(r => r.status === 'converted').length
    const thisWeek = items.filter(r => Date.now() - new Date(r.created_at).getTime() < 7 * 24 * 3600 * 1000).length
    return { total, pending, converted, thisWeek }
  }, [items])

  const variant = (s: Referral['status']): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (s) {
      case 'converted': return 'success'
      case 'rejected': return 'error'
      case 'qualified': case 'contacted': return 'info'
      case 'new': return 'warning'
      default: return 'neutral'
    }
  }

  const setStatus = async (status: Referral['status']) => {
    if (!selected) return
    setSaving(true)
    const ok = await updateReferral(selected.id, { status, admin_notes: notes || null })
    setSaving(false)
    if (ok) { showToast(`Marked ${status}`, 'success'); setSelected(null); load() }
    else showToast('Update failed', 'error')
  }

  const saveNotes = async () => {
    if (!selected) return
    setSaving(true)
    const ok = await updateReferral(selected.id, { admin_notes: notes || null })
    setSaving(false)
    showToast(ok ? 'Notes saved' : 'Save failed', ok ? 'success' : 'error')
    if (ok) load()
  }

  const columns: Column<Referral>[] = [
    {
      key: 'referrer_name', label: 'Referrer', sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{r.referrer_name}</p>
          <p className="text-[11px] text-gray-500 truncate">{r.referrer_email}</p>
        </div>
      ),
    },
    {
      key: 'referee_name', label: 'Referee', sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{r.referee_name}</p>
          <p className="text-[11px] text-gray-500 truncate">{r.referee_email || r.referee_phone || '-'}</p>
        </div>
      ),
    },
    { key: 'relationship', label: 'Relation', render: (r) => <span className="text-xs text-gray-300">{r.relationship || '-'}</span> },
    { key: 'investable_surplus', label: 'Surplus', render: (r) => <span className="text-xs text-gray-300">{r.investable_surplus || '-'}</span> },
    { key: 'created_at', label: 'Submitted', sortable: true, render: (r) => <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <AdminBadge label={r.status} variant={variant(r.status)} dot /> },
    { key: 'actions' as any, label: '', render: (r) => (
      <button onClick={() => setSelected(r)} className="text-xs text-brand-red hover:underline font-medium inline-flex items-center gap-1">
        <Eye className="w-3 h-3" /> View
      </button>
    )},
  ]

  return (
    <AdminGlass>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <AdminKPICard title="Total Referrals" value={kpis.total} icon={Users} color="#3B82F6" delay={0} />
        <AdminKPICard title="Pending" value={kpis.pending} icon={UserPlus} color="#F59E0B" delay={50} />
        <AdminKPICard title="Converted" value={kpis.converted} icon={CheckCircle2} color="#10B981" delay={100} />
        <AdminKPICard title="This Week" value={kpis.thisWeek} icon={IndianRupee} color="#8B5CF6" delay={150} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading referrals...</div>
      ) : items.length === 0 ? (
        <AdminEmptyState title="No referrals yet" description="Submissions from /contact/refer will appear here." />
      ) : (
        <AdminDataTable data={items as any} columns={columns as any} searchable exportable title="Investor Referrals" emptyMessage="No matching referrals" />
      )}

      {selected && (
        <AdminModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`${selected.referrer_name} -> ${selected.referee_name}`}
          subtitle={`${selected.relationship || 'Referral'} * ${formatDate(selected.created_at)}`}
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton onClick={() => setSelected(null)}>Close</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('contacted')} disabled={saving}>Contacted</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('qualified')} disabled={saving}>Qualify</ModalButton>
              <ModalButton variant="primary" onClick={saveNotes} disabled={saving}>Save Notes</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('converted')} disabled={saving}>Converted</ModalButton>
              <ModalButton variant="danger" onClick={() => setStatus('rejected')} disabled={saving}>Reject</ModalButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-1">Referrer</p>
                <p className="text-sm text-white">{selected.referrer_name}</p>
                <p className="text-xs text-gray-400"><Mail className="w-3 h-3 inline mr-1" />{selected.referrer_email}</p>
                {selected.referrer_phone && <p className="text-xs text-gray-400"><Phone className="w-3 h-3 inline mr-1" />{selected.referrer_phone}</p>}
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-1">Referee</p>
                <p className="text-sm text-white">{selected.referee_name}</p>
                {selected.referee_email && <p className="text-xs text-gray-400"><Mail className="w-3 h-3 inline mr-1" />{selected.referee_email}</p>}
                {selected.referee_phone && <p className="text-xs text-gray-400"><Phone className="w-3 h-3 inline mr-1" />{selected.referee_phone}</p>}
                {selected.referee_city && <p className="text-xs text-gray-400"><MapPin className="w-3 h-3 inline mr-1" />{selected.referee_city}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminBadge label={selected.status} variant={variant(selected.status)} dot />
              {selected.investable_surplus && <AdminBadge label={`Surplus: ${selected.investable_surplus}`} variant="purple" />}
              {selected.lead_id && <AdminBadge label="Lead created" variant="info" />}
            </div>
            {selected.message && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-2">Message</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.message}</p>
              </div>
            )}
            <div>
              <label className="block text-[11px] uppercase text-gray-500 mb-2">Admin Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="Follow-up notes..."
                className="w-full px-3 py-2 text-xs text-gray-200 rounded-lg bg-white/[0.04] border border-white/[0.06] focus:outline-none focus:border-brand-red/50" />
            </div>
          </div>
        </AdminModal>
      )}
    </AdminGlass>
  )
}
