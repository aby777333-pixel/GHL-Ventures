'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, UserPlus, CheckCircle2, XCircle, Eye, Mail, Phone, MapPin, IndianRupee, TrendingUp } from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import {
  fetchReferralsWithInvestment,
  setClientReferrer,
  updateReferral,
  updateReferralCommission,
  type ReferralWithInvestment,
} from '@/lib/supabase/adminDataService'
import { formatDate, formatINR } from '@/lib/admin/adminHooks'
import { supabase } from '@/lib/supabase/client'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

export default function ReferralsTab({ showToast, channelPartnerOnly }: { showToast: ShowToast; channelPartnerOnly?: boolean }) {
  const [items, setItems] = useState<ReferralWithInvestment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ReferralWithInvestment | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  // Pending 30-04-2026 #9: editable commission rate / status
  const [commRate, setCommRate] = useState('1')
  const [commStatus, setCommStatus] = useState<'pending' | 'accrued' | 'paid' | 'cancelled'>('pending')

  // 2026-06-12: admin can manually link a referral by GHL ID (the investor's
  // referral code IS their GHL ID). Each input resolves to a live client and
  // shows name/email read-only; Submit routes through setClientReferrer so
  // the clients.referred_by + referrals-row bookkeeping matches the organic
  // registration flow exactly.
  type GhlMatch = { id: string; full_name: string | null; email: string | null; ghl_id: string | null } | null
  const [addOpen, setAddOpen] = useState(false)
  const [refereeCode, setRefereeCode] = useState('')
  const [referrerCode, setReferrerCode] = useState('')
  const [refereeMatch, setRefereeMatch] = useState<GhlMatch>(null)
  const [referrerMatch, setReferrerMatch] = useState<GhlMatch>(null)
  const [savingAdd, setSavingAdd] = useState(false)

  const lookupByGhlId = async (code: string): Promise<GhlMatch> => {
    const c = code.trim()
    if (!c) return null
    try {
      const { data } = await (supabase as any)
        .from('clients')
        .select('id, full_name, email, ghl_id')
        .ilike('ghl_id', c)
        .is('deleted_at', null)
        .maybeSingle()
      return data || null
    } catch { return null }
  }

  useEffect(() => {
    const t = setTimeout(() => { lookupByGhlId(refereeCode).then(setRefereeMatch) }, 400)
    return () => clearTimeout(t)
  }, [refereeCode]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => { lookupByGhlId(referrerCode).then(setReferrerMatch) }, 400)
    return () => clearTimeout(t)
  }, [referrerCode]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true)
    setItems(await fetchReferralsWithInvestment())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAddReferral = async () => {
    if (!refereeMatch || !referrerMatch) { showToast('Enter valid GHL IDs for both investors', 'warning'); return }
    if (refereeMatch.id === referrerMatch.id) { showToast('A client cannot refer themselves', 'warning'); return }
    setSavingAdd(true)
    const res = await setClientReferrer(refereeMatch.id, (referrerMatch.ghl_id || referrerCode).trim())
    setSavingAdd(false)
    if (res.ok) {
      showToast('Referral linked', 'success')
      setAddOpen(false)
      setRefereeCode(''); setReferrerCode(''); setRefereeMatch(null); setReferrerMatch(null)
      load()
    } else {
      showToast(res.error || 'Failed to link referral', 'error')
    }
  }
  useEffect(() => {
    setNotes(selected?.admin_notes || '')
    setCommRate(String(selected?.commission_rate ?? '1'))
    setCommStatus((selected?.commission_status as any) || 'pending')
  }, [selected])

  // Pending 30-04-2026 #9: KPI strip now also rolls up converted-investment
  // amounts and total commission earned.
  const kpis = useMemo(() => {
    const total = items.length
    const pending = items.filter(r => r.status === 'new').length
    const converted = items.filter(r => r.status === 'converted' || r._investment).length
    const totalInvested = items.reduce((s, r) => s + (Number(r.investment_amount) || 0), 0)
    const totalCommission = items.reduce((s, r) => s + (Number(r.commission_amount) || 0), 0)
    return { total, pending, converted, totalInvested, totalCommission }
  }, [items])

  const variant = (s: ReferralWithInvestment['status']): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (s) {
      case 'converted': return 'success'
      case 'rejected': return 'error'
      case 'qualified': case 'contacted': return 'info'
      case 'new': return 'warning'
      default: return 'neutral'
    }
  }

  const setStatus = async (status: ReferralWithInvestment['status']) => {
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

  const saveCommission = async () => {
    if (!selected) return
    const rate = parseFloat(commRate)
    if (!Number.isFinite(rate) || rate < 0) { showToast('Invalid rate', 'warning'); return }
    setSaving(true)
    const amt = (Number(selected.investment_amount) || 0) * rate / 100
    const res = await updateReferralCommission(selected.id, {
      commission_rate: rate,
      commission_amount: amt,
      commission_status: commStatus,
    })
    setSaving(false)
    if (res.ok) { showToast('Commission updated', 'success'); load(); setSelected(null) }
    else showToast(res.error || 'Save failed', 'error')
  }

  const columns: Column<ReferralWithInvestment>[] = [
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
      key: 'referee_name', label: 'Referred Investor', sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{r.referee_name}</p>
          <p className="text-[11px] text-gray-500 truncate">{r.referee_email || r.referee_phone || '-'}</p>
        </div>
      ),
    },
    // Pending 30-04-2026 #9: investment + commission columns
    {
      key: 'investment_amount', label: 'Invested', sortable: true,
      render: (r) => (
        <span className={r.investment_amount ? 'text-emerald-400 font-semibold' : 'text-gray-600'}>
          {r.investment_amount ? formatINR(Number(r.investment_amount)) : '—'}
        </span>
      ),
    },
    {
      key: 'investment_status' as any, label: 'Inv. Status',
      render: (r) => r._investment
        ? <AdminBadge label={r._investment.status} variant={r._investment.status === 'approved' || r._investment.status === 'credited' ? 'success' : 'info'} dot size="sm" />
        : <span className="text-gray-600 text-xs">—</span>,
    },
    {
      key: 'commission_amount', label: 'Commission',
      render: (r) => (
        <div className="flex flex-col">
          <span className={r.commission_amount ? 'text-amber-400 font-semibold text-xs' : 'text-gray-600 text-xs'}>
            {r.commission_amount ? formatINR(Number(r.commission_amount)) : '—'}
          </span>
          {r.commission_status && r.commission_amount ? (
            <span className="text-[10px] text-gray-500 capitalize">{r.commission_status}</span>
          ) : null}
        </div>
      ),
    },
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
      {!channelPartnerOnly && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-brand-red hover:bg-brand-red/80 transition-colors"
            title="Manually link a referred investor to their referrer using GHL IDs"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Referral
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <AdminKPICard title="Total Referrals" value={kpis.total} icon={Users} color="#3B82F6" delay={0} />
        <AdminKPICard title="Pending" value={kpis.pending} icon={UserPlus} color="#F59E0B" delay={50} />
        <AdminKPICard title="Converted" value={kpis.converted} icon={CheckCircle2} color="#10B981" delay={100} />
        <AdminKPICard title="Total Invested" value={formatINR(kpis.totalInvested)} icon={IndianRupee} color="#8B5CF6" delay={150} />
        <AdminKPICard title="Commission" value={formatINR(kpis.totalCommission)} icon={TrendingUp} color="#EC4899" delay={200} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading referrals...</div>
      ) : (() => {
        // 2026-05-12: when the sidebar lands us on the CP Referral
        // Income History entry we narrow the list to channel-partner
        // sourced rows so the Investor and CP cohorts stay visually
        // separate. CP rows are flagged either by an explicit source
        // marker or by a `cp_*` referrer code.
        const scoped = channelPartnerOnly
          ? items.filter((r: any) => {
              const src = String(r.source || r.referral_source || '').toLowerCase()
              const code = String(r.referrer_code || '').toLowerCase()
              return src.includes('channel') || src.includes('cp') || code.startsWith('cp')
            })
          : items
        if (scoped.length === 0) {
          return <AdminEmptyState title={channelPartnerOnly ? 'No CP referrals yet' : 'No referrals yet'} description={channelPartnerOnly ? 'Referrals attributed to channel partners will appear here once recorded.' : 'Submissions from /contact/refer or admin-linked referrals will appear here.'} />
        }
        return <AdminDataTable data={scoped as any} columns={columns as any} searchable exportable title={channelPartnerOnly ? 'Channel Partner Referrals' : 'Investor Referrals'} emptyMessage="No matching referrals" />
      })()}

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

            {/* Pending 30-04-2026 #9: investment + commission summary */}
            {selected._investment && (
              <div className="p-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
                <p className="text-[11px] uppercase text-emerald-400 mb-2 font-semibold">Referred Investment</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Fund</p>
                    <p className="text-white font-medium">{selected._investment.fund_vehicle || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="text-emerald-400 font-bold">{formatINR(Number(selected._investment.final_investment_amount) || Number(selected._investment.investment_amount) || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="text-white capitalize">{selected._investment.status}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
              <p className="text-[11px] uppercase text-amber-400 mb-2 font-semibold">Commission</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Rate (%)</label>
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={commRate}
                    onChange={e => setCommRate(e.target.value)}
                    className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Amount</label>
                  <p className="mt-2 text-sm text-amber-400 font-bold">
                    {formatINR((Number(selected.investment_amount) || 0) * (parseFloat(commRate) || 0) / 100)}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Status</label>
                  <select
                    value={commStatus}
                    onChange={e => setCommStatus(e.target.value as any)}
                    className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40"
                  >
                    <option value="pending">Pending</option>
                    <option value="accrued">Accrued</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <button
                disabled={saving}
                onClick={saveCommission}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                Save Commission
              </button>
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

      {addOpen && (
        <AdminModal
          isOpen={addOpen}
          onClose={() => { if (!savingAdd) setAddOpen(false) }}
          title="Add Referral"
          subtitle="Link a referred investor to their referrer — the referral code is the referrer's GHL ID"
          maxWidth="max-w-2xl"
          footer={
            <>
              <ModalButton onClick={() => setAddOpen(false)} disabled={savingAdd}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={handleAddReferral} disabled={savingAdd || !refereeMatch || !referrerMatch}>
                {savingAdd ? 'Saving…' : 'Submit'}
              </ModalButton>
            </>
          }
        >
          <div className="space-y-5">
            {[
              { label: 'Referred Investor — GHL ID', value: refereeCode, set: setRefereeCode, match: refereeMatch, hint: 'The investor who was referred (their referred-by will be updated)' },
              { label: 'Referrer — GHL ID', value: referrerCode, set: setReferrerCode, match: referrerMatch, hint: 'The existing investor whose GHL ID is the referral code' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-2">{f.label} <span className="text-brand-red">*</span></label>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder="e.g. GHL570045"
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-brand-red/40"
                  />
                  <input
                    type="text"
                    value={f.match?.full_name || ''}
                    readOnly
                    placeholder="Name"
                    className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 outline-none cursor-default"
                  />
                  <input
                    type="text"
                    value={f.match?.email || ''}
                    readOnly
                    placeholder="Email"
                    className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 outline-none cursor-default"
                  />
                </div>
                {f.value.trim() && !f.match ? (
                  <p className="text-[11px] text-amber-400 mt-1">No active client found with this GHL ID</p>
                ) : (
                  <p className="text-[11px] text-gray-600 mt-1">{f.hint}</p>
                )}
              </div>
            ))}
          </div>
        </AdminModal>
      )}
    </AdminGlass>
  )
}
