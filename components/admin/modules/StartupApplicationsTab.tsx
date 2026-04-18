'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Target, Clock, CheckCircle2, TrendingUp, Eye, Mail, Phone, Linkedin, Globe, Building2, MapPin, IndianRupee } from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { fetchStartupApplications, updateStartupApplication, type StartupApplication } from '@/lib/supabase/adminDataService'
import { formatDate } from '@/lib/admin/adminHooks'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

export default function StartupApplicationsTab({ showToast }: { showToast: ShowToast }) {
  const [items, setItems] = useState<StartupApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<StartupApplication | null>(null)
  const [notes, setNotes] = useState('')
  const [score, setScore] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setItems(await fetchStartupApplications())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    setNotes(selected?.admin_notes || '')
    setScore(selected?.review_score ? String(selected.review_score) : '')
  }, [selected])

  const kpis = useMemo(() => {
    const total = items.length
    const reviewing = items.filter(x => ['new', 'reviewing'].includes(x.status)).length
    const shortlisted = items.filter(x => x.status === 'shortlisted' || x.status === 'meeting_scheduled' || x.status === 'in_diligence').length
    const funded = items.filter(x => x.status === 'funded').length
    return { total, reviewing, shortlisted, funded }
  }, [items])

  const variant = (s: StartupApplication['status']): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' => {
    switch (s) {
      case 'funded': return 'success'
      case 'rejected': case 'passed': return 'error'
      case 'shortlisted': case 'meeting_scheduled': case 'in_diligence': return 'purple'
      case 'reviewing': return 'info'
      case 'new': return 'warning'
      default: return 'neutral'
    }
  }

  const setStatus = async (status: StartupApplication['status']) => {
    if (!selected) return
    setSaving(true)
    const parsedScore = score ? Math.max(1, Math.min(10, parseInt(score, 10))) : null
    const ok = await updateStartupApplication(selected.id, {
      status,
      admin_notes: notes || null,
      review_score: parsedScore as any,
    })
    setSaving(false)
    if (ok) { showToast(`Marked ${status.replace('_', ' ')}`, 'success'); setSelected(null); load() }
    else showToast('Update failed', 'error')
  }

  const saveNotes = async () => {
    if (!selected) return
    setSaving(true)
    const parsedScore = score ? Math.max(1, Math.min(10, parseInt(score, 10))) : null
    const ok = await updateStartupApplication(selected.id, {
      admin_notes: notes || null,
      review_score: parsedScore as any,
    })
    setSaving(false)
    showToast(ok ? 'Saved' : 'Save failed', ok ? 'success' : 'error')
    if (ok) load()
  }

  const columns: Column<StartupApplication>[] = [
    { key: 'application_number', label: 'Ref', sortable: true, render: (r) => <span className="text-xs font-mono text-brand-red">{r.application_number || '-'}</span> },
    {
      key: 'company_name', label: 'Startup', sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{r.company_name}</p>
          <p className="text-[11px] text-gray-500 truncate">{r.founder_name} * {r.sector || 'sector n/a'}</p>
        </div>
      ),
    },
    { key: 'stage', label: 'Stage', sortable: true, render: (r) => <span className="text-xs text-gray-300">{r.stage || '-'}</span> },
    { key: 'amount_seeking', label: 'Seeking', render: (r) => <span className="text-xs text-gray-300">{r.amount_seeking || '-'}</span> },
    { key: 'city', label: 'City', render: (r) => <span className="text-xs text-gray-400">{r.city || '-'}</span> },
    { key: 'created_at', label: 'Submitted', sortable: true, render: (r) => <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span> },
    { key: 'review_score', label: 'Score', width: '70px', render: (r) => <span className="text-xs text-gray-300">{r.review_score ? `${r.review_score}/10` : '-'}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <AdminBadge label={r.status.replace('_', ' ')} variant={variant(r.status)} dot /> },
    { key: 'actions' as any, label: '', render: (r) => (
      <button onClick={() => setSelected(r)} className="text-xs text-brand-red hover:underline font-medium inline-flex items-center gap-1">
        <Eye className="w-3 h-3" /> View
      </button>
    )},
  ]

  return (
    <AdminGlass>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <AdminKPICard title="Total Pitches" value={kpis.total} icon={Target} color="#3B82F6" delay={0} />
        <AdminKPICard title="Reviewing" value={kpis.reviewing} icon={Clock} color="#F59E0B" delay={50} />
        <AdminKPICard title="Shortlisted" value={kpis.shortlisted} icon={TrendingUp} color="#8B5CF6" delay={100} />
        <AdminKPICard title="Funded" value={kpis.funded} icon={CheckCircle2} color="#10B981" delay={150} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading applications...</div>
      ) : items.length === 0 ? (
        <AdminEmptyState title="No startup applications yet" description="Submissions from /contact/startup-apply will appear here." />
      ) : (
        <AdminDataTable data={items as any} columns={columns as any} searchable exportable title="Startup Applications" emptyMessage="No matching applications" />
      )}

      {selected && (
        <AdminModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.company_name}
          subtitle={`${selected.application_number || 'Startup'} * ${formatDate(selected.created_at)}`}
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton onClick={() => setSelected(null)}>Close</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('reviewing')} disabled={saving}>Reviewing</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('shortlisted')} disabled={saving}>Shortlist</ModalButton>
              <ModalButton variant="primary" onClick={saveNotes} disabled={saving}>Save</ModalButton>
              <ModalButton variant="primary" onClick={() => setStatus('funded')} disabled={saving}>Funded</ModalButton>
              <ModalButton variant="danger" onClick={() => setStatus('rejected')} disabled={saving}>Reject</ModalButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <AdminBadge label={selected.status.replace('_', ' ')} variant={variant(selected.status)} dot />
              {selected.sector && <AdminBadge label={selected.sector} variant="info" />}
              {selected.stage && <AdminBadge label={selected.stage} variant="purple" />}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-1">Founder</p>
                <p className="text-sm text-white">{selected.founder_name}</p>
                <p className="text-xs text-gray-400"><Mail className="w-3 h-3 inline mr-1" />{selected.email}</p>
                {selected.phone && <p className="text-xs text-gray-400"><Phone className="w-3 h-3 inline mr-1" />{selected.phone}</p>}
                {selected.linkedin && <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline"><Linkedin className="w-3 h-3 inline mr-1" />LinkedIn</a>}
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-1">Company</p>
                <p className="text-sm text-white"><Building2 className="w-3 h-3 inline mr-1" />{selected.company_name}</p>
                {selected.city && <p className="text-xs text-gray-400"><MapPin className="w-3 h-3 inline mr-1" />{selected.city}</p>}
                {selected.website && <a href={selected.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline"><Globe className="w-3 h-3 inline mr-1" />{selected.website}</a>}
                {selected.founding_year && <p className="text-xs text-gray-400">Founded {selected.founding_year}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {selected.mrr && <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"><p className="text-[10px] text-gray-500">MRR</p><p className="text-xs text-gray-200">{selected.mrr}</p></div>}
              {selected.mau && <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"><p className="text-[10px] text-gray-500">MAU</p><p className="text-xs text-gray-200">{selected.mau}</p></div>}
              {selected.amount_seeking && <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"><p className="text-[10px] text-gray-500"><IndianRupee className="w-3 h-3 inline" />Seeking</p><p className="text-xs text-gray-200">{selected.amount_seeking}</p></div>}
            </div>

            {selected.metrics && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-2">Metrics</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.metrics}</p>
              </div>
            )}
            {selected.pitch && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-2">Pitch</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.pitch}</p>
              </div>
            )}
            {selected.use_of_funds && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[11px] uppercase text-gray-500 mb-2">Use of Funds</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.use_of_funds}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase text-gray-500 mb-2">Review Score (1-10)</label>
                <input type="number" min={1} max={10} value={score} onChange={(e) => setScore(e.target.value)}
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
