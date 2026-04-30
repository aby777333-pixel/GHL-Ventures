'use client'

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT TRACKING MODAL (Admin)

   Pending 30-04-2026 — Item 10. Six-stage progress per investment:
     1. Invested              (auto on credit/approve)
     2. Acknowledgement       (manual)
     3. Document Preparation  (manual)
     4. Soft Copy Uploaded    (auto: all 4 doc types uploaded)
     5. Courier Process       (auto: courier_code present)
     6. Courier Received      (manual)

   Admin can update status, courier code, partner, and tracking URL.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Circle, Truck, Package, FileText, Inbox, ClipboardList } from 'lucide-react'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import {
  fetchInvestmentDocTracking,
  ensureInvestmentDocTracking,
  setInvestmentDocTrackingStage,
  setInvestmentCourierTracking,
  type InvDocTrackingRow,
  type DocTrackingStage,
} from '@/lib/supabase/adminDataService'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

type Props = {
  isOpen: boolean
  onClose: () => void
  investmentAppId: string | null
  investorName?: string
  showToast: ShowToast
}

const STAGES: { stage: DocTrackingStage; label: string; flagKey: keyof InvDocTrackingRow; icon: any; auto: boolean; hint: string }[] = [
  { stage: 'invested',                flagKey: 'invested_at',           label: 'Invested',                icon: ClipboardList, auto: true,  hint: 'Auto on credit / approval' },
  { stage: 'acknowledgement_process', flagKey: 'acknowledgement_at',    label: 'Acknowledgement Process', icon: FileText,      auto: false, hint: 'Manual' },
  { stage: 'document_preparing',      flagKey: 'document_prep_at',      label: 'Document Preparing',      icon: FileText,      auto: false, hint: 'Manual' },
  { stage: 'soft_copy_uploaded',      flagKey: 'soft_copy_at',          label: 'Soft Copy Uploaded',      icon: Inbox,         auto: true,  hint: 'Auto when all 4 docs uploaded' },
  { stage: 'courier_process_started', flagKey: 'courier_started_at',    label: 'Courier Process Started', icon: Truck,         auto: true,  hint: 'Auto when tracking code is saved' },
  { stage: 'courier_delivered',       flagKey: 'courier_received_at',   label: 'Courier Delivered',       icon: Package,       auto: false, hint: 'Manual — mark when investor receives the courier' },
]

export default function DocumentTrackingModal({ isOpen, onClose, investmentAppId, investorName, showToast }: Props) {
  const [row, setRow] = useState<InvDocTrackingRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [courierCode, setCourierCode] = useState('')
  const [courierPartner, setCourierPartner] = useState('')
  const [courierUrl, setCourierUrl] = useState('')

  const reload = useCallback(async () => {
    if (!investmentAppId) { setRow(null); return }
    setLoading(true)
    try {
      let r = await fetchInvestmentDocTracking(investmentAppId)
      if (!r) r = await ensureInvestmentDocTracking(investmentAppId)
      setRow(r)
      setCourierCode(r?.courier_code || '')
      setCourierPartner(r?.courier_partner || '')
      setCourierUrl(r?.courier_tracking_url || '')
    } finally { setLoading(false) }
  }, [investmentAppId])

  useEffect(() => { if (isOpen) reload() }, [isOpen, reload])

  const toggleStage = async (stage: DocTrackingStage, flagKey: keyof InvDocTrackingRow) => {
    if (!investmentAppId) return
    const isOn = !!row?.[flagKey]
    setSaving(true)
    try {
      const res = await setInvestmentDocTrackingStage(investmentAppId, stage, !isOn)
      if (res.ok) { showToast(isOn ? `Cleared ${stage}` : `Marked ${stage}`, 'success'); reload() }
      else showToast(res.error || 'Update failed', 'error')
    } finally { setSaving(false) }
  }

  const saveCourier = async () => {
    if (!investmentAppId) return
    setSaving(true)
    try {
      const res = await setInvestmentCourierTracking(investmentAppId, {
        code: courierCode.trim() || null,
        partner: courierPartner.trim() || null,
        trackingUrl: courierUrl.trim() || null,
      })
      if (res.ok) { showToast('Courier details saved', 'success'); reload() }
      else showToast(res.error || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Document Tracking"
      subtitle={investorName ? `Investor: ${investorName}` : undefined}
      maxWidth="max-w-2xl"
      footer={<ModalButton onClick={onClose}>Close</ModalButton>}
    >
      {loading || !investmentAppId ? (
        <div className="py-10 text-center text-xs text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-5">
          {/* Stages list */}
          <div className="space-y-2">
            {STAGES.map(({ stage, label, flagKey, icon: Icon, auto, hint }) => {
              const ts = row?.[flagKey] as string | null | undefined
              const on = !!ts
              return (
                <div key={stage} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${on ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${on ? 'bg-emerald-500 text-white' : 'bg-white/[0.04] text-gray-500'}`}>
                      {on ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${on ? 'text-emerald-300' : 'text-white'}`}>{label}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {on
                          ? `Marked ${new Date(ts as string).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : hint}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={saving}
                    onClick={() => toggleStage(stage, flagKey)}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
                      on
                        ? 'text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                        : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25'
                    } disabled:opacity-50`}
                    title={auto ? 'Stage usually auto-completes; manual override allowed.' : ''}
                  >
                    {on ? 'Clear' : 'Mark Complete'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Courier */}
          <div className="border-t border-white/[0.06] pt-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Courier Tracking</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Tracking Code</label>
                <input
                  value={courierCode}
                  onChange={e => setCourierCode(e.target.value)}
                  placeholder="e.g. DHL2024XYZ"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Courier Partner</label>
                <input
                  value={courierPartner}
                  onChange={e => setCourierPartner(e.target.value)}
                  placeholder="e.g. BlueDart, DHL, India Post"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Tracking Page URL</label>
                <input
                  value={courierUrl}
                  onChange={e => setCourierUrl(e.target.value)}
                  placeholder="https://www.bluedart.com/track?awb=…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                disabled={saving}
                onClick={saveCourier}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-brand-red hover:bg-brand-red/80 disabled:opacity-50 transition-colors"
              >
                Save Courier Details
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminModal>
  )
}
