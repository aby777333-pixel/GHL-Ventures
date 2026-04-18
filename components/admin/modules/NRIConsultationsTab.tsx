'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Zap, Calendar, CheckCircle2, TrendingUp, Eye, Mail, Phone, MapPin, IndianRupee } from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { fetchNRIConsultations, updateNRIConsultation, type NRIConsultation } from '@/lib/supabase/adminDataService'
import { formatDate } from '@/lib/admin/adminHooks'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

export default function NRIConsultationsTab({ showToast }: { showToast: ShowToast }) {
  const [items, setItems] = useState<NRIConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<NRIConsultation | null>(null)
  const [notes, setNotes] = useState('')
  const [scheduleDt, setScheduleDt] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setItems(await fetchNRIConsultations())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    setNotes(selected?.admin_notes || '')
    setScheduleDt(selected?.scheduled_at ? selected.scheduled_at.slice(0, 16) : '')
  }, [selected])

  const kpis = useMemo(() => {
    const total = items.length
    const pending = items.filter(x => ['new', 'contacted'].includes(x.status)).length
    const scheduled = items.filter(x => x.status === 'scheduled').length
    const converted = items.filter(x => x.status === 'converted').length
    return { total, pending, scheduled, converted }
  }, [items])

  const variant = (s: NRIConsultation['status']): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' => {
    switch (s) {
      case 'converted': return 'success'
      case 'rejected': return 'error'
      case 'scheduled': return 'purple'
      case 'contacted': case 'completed': return 'info'
      case 'new': return 'warning'
      default: return 'neutral'
    }
  }

  const setStatus = async (status: NRIConsultation['status']) => {
    if (!selected) return
    setSaving(true)
    const ok = await updateNRIConsultation(selected.id, {
      status,
      admin_notes: notes || null,
      scheduled_at: scheduleDt ? new Date(scheduleDt).toISOString() : null,
    })
    setSaving(false)
    if (ok) { showToast(`Marked ${status}`, 'success'); setSelected(null); load() }
    else showToast('Update failed', 'error')
  }

  const saveNotes = async () => {
    if (!selected) return
    setSaving(true)
    const ok = await updateNRIConsultation(selected.id, {
      admin_notes: notes || null,
      scheduled_at: scheduleDt ? new Date(scheduleDt).toISOString() : null,
    })
    setSaving(false)
    showToast(ok ? 'Saved' : 'Save failed', ok ? 'success' : 'error')
    if (ok) load()
  }

  const columns: Column<NRIConsultation>[] = [
    {
      key: 'full_name', label: 'NRI', sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{r.full_name}</p>
          <p className="text-[11px] text-gray-500 truncate">{r.email}</p>
        </div>
      ),
    },
    { key: 'country', label: 'Country', sortable: true, render: (r) => <span className="text-xs text-gray-300">{r.country || '-'}</span> },
    { key: 'preferred_route', label: 'Route', render: (r) => <span className="text-xs text-gray-300">{r.preferred_route || '-'}</span> },
    { key: 'investment_range', label: 'Range', render: (r) => <span className="text-xs text-gray-300">{r.investment_range || '-'}</span> },
    { key: 'phone', label: 'Phone', render: (r) => <span className="text-xs text-gray-400">{r.phone || '-'}</span> },
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
        <AdminKPICard title="Total Requests" value={kpis.total} icon={Zap} color="#3B82F6" delay={0} />
        <AdminKPICard title="Pending" value={kpis.pending} icon={TrendingUp} color="#F59E0B" delay={50} />
        <AdminKPICard title="Scheduled" value={kpis.scheduled} icon={Calendar} color="#8B5CF6" delay={100} />
        <AdminKPICard title="Converted" value={kpis.converted} icon={CheckCircle2} color="#10B981" delay={150} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading requests...</div>
      ) : items.length === 0 ? (
        <AdminEmptyState title="No NRI consultations yet" description="Requests from /fund/nri-invest will appear here." />
      ) : (
        <AdminDataTable data={items as any} columns={columns as any} searchable exportable title="NRI Consultation Requests" emptyMessage="No matching requests" />
      )}

      {selected && (
        <AdminModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.full_name}
          subtitle={`NRI Consultation * ${formatDate(selected.created_at)}`}
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton onClick={() => setSelected(null)}>Close</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('contacted')} disabled={saving}>Contacted</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('scheduled')} disabled={saving}>Schedule</ModalButton>
              <ModalButton variant="primary" onClick={saveNotes} disabled={saving}>Save</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('completed')} disabled={saving}>Completed</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('converted')} disabled={saving}>Converted</ModalButton>
              <ModalButton variant="danger" onClick={() => setStatus('rejected')} disabled={saving}>Reject</ModalButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <AdminBadge label={selected.status} variant={variant(selected.status)} dot />
              {selected.preferred_route && <AdminBadge label={selected.preferred_route} variant="info" />}
              {selected.investment_range && <AdminBadge label={selected.investment_range} variant="purple" />}
              {selected.lead_id && <AdminBadge label="Lead created" variant="info" />}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <a href={`mailto:${selected.email}`} className="text-xs text-gray-300 hover:text-white"><Mail className="w-3 h-3 inline mr-1" />{selected.email}</a>
              </div>
              {selected.phone && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <a href={`tel:${selected.phone}`} className="text-xs text-gray-300 hover:text-white"><Phone className="w-3 h-3 inline mr-1" />{selected.phone}</a>
                </div>
              )}
              {selected.country && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <p className="text-xs text-gray-300"><MapPin className="w-3 h-3 inline mr-1" />{selected.country}</p>
                </div>
              )}
              {selected.investment_range && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <p className="text-xs text-gray-300"><IndianRupee className="w-3 h-3 inline mr-1" />{selected.investment_range}</p>
                </div>
              )}
            </div>

            {selected.message && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-2">Message</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.message}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase text-gray-500 mb-2">Schedule At</label>
                <input type="datetime-local" value={scheduleDt} onChange={(e) => setScheduleDt(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-gray-200 rounded-lg bg-white/[0.04] border border-white/[0.06] focus:outline-none focus:border-brand-red/50" />
              </div>
              <div>
                <label className="block text-[11px] uppercase text-gray-500 mb-2">Admin Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  className="w-full px-3 py-2 text-xs text-gray-200 rounded-lg bg-white/[0.04] border border-white/[0.06] focus:outline-none focus:border-brand-red/50" />
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </AdminGlass>
  )
}
