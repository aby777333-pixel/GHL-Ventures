'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AlertCircle, Clock, CheckCircle2, ArrowUpRight,
  Eye, User, FileText, Calendar,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { fetchGrievances, updateGrievance, type Grievance } from '@/lib/supabase/adminDataService'
import { formatDate } from '@/lib/admin/adminHooks'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

export default function GrievancesTab({ showToast }: { showToast: ShowToast }) {
  const [items, setItems] = useState<Grievance[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Grievance | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [resolutionDraft, setResolutionDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setItems(await fetchGrievances())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    setNotesDraft(selected?.admin_notes || '')
    setResolutionDraft(selected?.resolution_summary || '')
  }, [selected])

  const kpis = useMemo(() => {
    const total = items.length
    const open = items.filter(g => !['resolved', 'rejected'].includes(g.status)).length
    const resolved = items.filter(g => g.status === 'resolved').length
    const escalated = items.filter(g => g.status === 'escalated' || g.escalation_level > 1).length
    return { total, open, resolved, escalated }
  }, [items])

  const statusVariant = (s: Grievance['status']): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' => {
    switch (s) {
      case 'resolved': return 'success'
      case 'rejected': return 'error'
      case 'escalated': return 'purple'
      case 'in_progress': return 'info'
      case 'acknowledged': return 'info'
      case 'new': return 'warning'
      default: return 'neutral'
    }
  }

  const setStatus = async (status: Grievance['status']) => {
    if (!selected) return
    setSaving(true)
    const ok = await updateGrievance(selected.id, {
      status,
      admin_notes: notesDraft || null,
      resolution_summary: resolutionDraft || null,
    })
    setSaving(false)
    if (ok) {
      showToast(`Grievance marked ${status.replace('_', ' ')}`, 'success')
      setSelected(null)
      load()
    } else {
      showToast('Update failed', 'error')
    }
  }

  const saveNotes = async () => {
    if (!selected) return
    setSaving(true)
    const ok = await updateGrievance(selected.id, {
      admin_notes: notesDraft || null,
      resolution_summary: resolutionDraft || null,
    })
    setSaving(false)
    showToast(ok ? 'Notes saved' : 'Save failed', ok ? 'success' : 'error')
    if (ok) load()
  }

  const columns: Column<Grievance>[] = [
    {
      key: 'ticket_number',
      label: 'Ticket',
      sortable: true,
      render: (r) => <span className="text-xs font-mono text-brand-red">{r.ticket_number || '-'}</span>,
    },
    {
      key: 'full_name',
      label: 'Investor',
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{r.full_name}</p>
          <p className="text-[11px] text-gray-500 truncate">{r.email}</p>
        </div>
      ),
    },
    {
      key: 'complaint_type',
      label: 'Type',
      sortable: true,
      render: (r) => <span className="text-xs text-gray-300">{r.complaint_type || '-'}</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (r) => <span className="text-xs text-gray-400">{r.phone || '-'}</span>,
    },
    {
      key: 'created_at',
      label: 'Submitted',
      sortable: true,
      render: (r) => <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>,
    },
    {
      key: 'escalation_level',
      label: 'Level',
      sortable: true,
      width: '80px',
      render: (r) => <span className="text-xs text-gray-300">L{r.escalation_level}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (r) => <AdminBadge label={r.status.replace('_', ' ')} variant={statusVariant(r.status)} dot />,
    },
    {
      key: 'actions' as any,
      label: '',
      render: (row) => (
        <button onClick={() => setSelected(row)} className="text-xs text-brand-red hover:underline font-medium inline-flex items-center gap-1">
          <Eye className="w-3 h-3" /> View
        </button>
      ),
    },
  ]

  return (
    <AdminGlass>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <AdminKPICard title="Total Grievances" value={kpis.total} icon={AlertCircle} color="#3B82F6" delay={0} />
        <AdminKPICard title="Open" value={kpis.open} icon={Clock} color="#F59E0B" delay={50} />
        <AdminKPICard title="Resolved" value={kpis.resolved} icon={CheckCircle2} color="#10B981" delay={100} />
        <AdminKPICard title="Escalated" value={kpis.escalated} icon={ArrowUpRight} color="#8B5CF6" delay={150} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading grievances...</div>
      ) : items.length === 0 ? (
        <AdminEmptyState title="No grievances lodged" description="Submissions from the public /contact/grievance form will appear here." />
      ) : (
        <AdminDataTable
          data={items as any}
          columns={columns as any}
          searchable
          exportable
          title="Lodged Grievances"
          emptyMessage="No matching grievances"
        />
      )}

      {selected && (
        <AdminModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.ticket_number || selected.full_name}
          subtitle={`${selected.complaint_type || 'Grievance'} * ${formatDate(selected.created_at)}`}
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton onClick={() => setSelected(null)}>Close</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('acknowledged')} disabled={saving}>Acknowledge</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('in_progress')} disabled={saving}>In Progress</ModalButton>
              <ModalButton variant="primary" onClick={saveNotes} disabled={saving}>Save Notes</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('resolved')} disabled={saving}>Resolve</ModalButton>
              <ModalButton variant="danger" onClick={() => setStatus('rejected')} disabled={saving}>Reject</ModalButton>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <AdminBadge label={selected.status.replace('_', ' ')} variant={statusVariant(selected.status)} dot />
              <AdminBadge label={`Level ${selected.escalation_level}`} variant="neutral" />
              {selected.contacted_before && <AdminBadge label="Previously contacted" variant="info" />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <User className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-300 truncate">{selected.full_name}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <a href={`mailto:${selected.email}`} className="text-xs text-gray-300 truncate hover:text-white">{selected.email}</a>
              </div>
              {selected.phone && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <a href={`tel:${selected.phone}`} className="text-xs text-gray-300 hover:text-white">{selected.phone}</a>
                </div>
              )}
              {selected.folio_number && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-300">Folio: {selected.folio_number}</span>
                </div>
              )}
              {selected.incident_date && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-300">Incident: {formatDate(selected.incident_date)}</span>
                </div>
              )}
              {selected.previous_reference && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <span className="text-[11px] text-gray-500">Prev ref:</span>
                  <span className="text-xs text-gray-300 truncate">{selected.previous_reference}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">Complaint</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            </div>

            {selected.desired_resolution && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">Desired Resolution</p>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selected.desired_resolution}</p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">Admin Notes</label>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={3}
                placeholder="Internal investigation notes, status updates, etc."
                className="w-full px-3 py-2 text-xs text-gray-200 rounded-lg bg-white/[0.04] border border-white/[0.06] focus:outline-none focus:border-brand-red/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">Resolution Summary</label>
              <textarea
                value={resolutionDraft}
                onChange={(e) => setResolutionDraft(e.target.value)}
                rows={3}
                placeholder="Summary of resolution provided to the investor. Shown when the grievance is marked resolved."
                className="w-full px-3 py-2 text-xs text-gray-200 rounded-lg bg-white/[0.04] border border-white/[0.06] focus:outline-none focus:border-brand-red/50"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </AdminGlass>
  )
}
