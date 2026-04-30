'use client'

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT TRACKING PROGRESS — Investor view

   Pending 30-04-2026 — Item 10. Mirrors the 6-stage admin tracker
   on the investor's Documents tab so they can see where their
   documents are in the courier pipeline.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardList, FileText, Inbox, Truck, Package, ExternalLink } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'

type TrackingRow = {
  id: string
  investment_app_id: string
  invested_at: string | null
  acknowledgement_at: string | null
  document_prep_at: string | null
  soft_copy_at: string | null
  courier_started_at: string | null
  courier_received_at: string | null
  courier_code: string | null
  courier_partner: string | null
  courier_tracking_url: string | null
}

const STAGES: { key: keyof TrackingRow; label: string; icon: any }[] = [
  { key: 'invested_at',          label: 'Invested',                icon: ClipboardList },
  { key: 'acknowledgement_at',   label: 'Acknowledgement Process', icon: FileText },
  { key: 'document_prep_at',     label: 'Document Preparation',    icon: FileText },
  { key: 'soft_copy_at',         label: 'Soft Copy Uploaded',      icon: Inbox },
  { key: 'courier_started_at',   label: 'Courier Process Started', icon: Truck },
  { key: 'courier_received_at',  label: 'Courier Received',        icon: Package },
]

export default function DocumentTrackingProgress({
  investmentAppId,
  theme = 'dark',
}: {
  investmentAppId: string
  theme?: 'dark' | 'light'
}) {
  const [row, setRow] = useState<TrackingRow | null>(null)
  const [loading, setLoading] = useState(true)
  const dark = theme === 'dark'

  useEffect(() => {
    let cancelled = false
    if (!investmentAppId || !isSupabaseConfigured()) { setLoading(false); return }
    ;(async () => {
      try {
        const { data } = await (supabase as any)
          .from('investment_doc_tracking')
          .select('*')
          .eq('investment_app_id', investmentAppId)
          .maybeSingle()
        if (!cancelled) setRow((data as TrackingRow) || null)
      } catch { if (!cancelled) setRow(null) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [investmentAppId])

  if (loading) return null

  // We render even with a missing row — the bar will simply show all
  // stages as pending. Many old investments may not have a row yet.
  const r = row || {} as TrackingRow

  return (
    <div className={`rounded-2xl border p-5 ${dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-gray-200/60'}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Document Tracking</h4>
        {r.courier_tracking_url ? (
          <a
            href={r.courier_tracking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-brand-red hover:underline inline-flex items-center gap-1"
          >
            Track Courier <ExternalLink className="w-3 h-3" />
          </a>
        ) : null}
      </div>

      {/* Horizontal stepper */}
      <div className="flex items-start justify-between gap-1 overflow-x-auto pb-2">
        {STAGES.map(({ key, label, icon: Icon }, i) => {
          const ts = (r as any)[key] as string | null
          const on = !!ts
          const next = STAGES[i + 1] ? !!((r as any)[STAGES[i + 1].key]) : false
          return (
            <div key={String(key)} className="flex-1 min-w-[110px] relative flex flex-col items-center text-center">
              {/* Connector line to next */}
              {i < STAGES.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 right-0 h-[2px] -translate-x-0 ${
                    on && next ? 'bg-emerald-500' : on ? 'bg-emerald-500/40' : dark ? 'bg-white/[0.08]' : 'bg-gray-200'
                  }`}
                  style={{ width: 'calc(100% - 24px)', marginLeft: '12px' }}
                />
              )}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                on ? 'bg-emerald-500 text-white' : dark ? 'bg-white/[0.04] text-gray-500 border border-white/[0.08]' : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                {on ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <p className={`text-[10px] font-medium leading-tight ${on ? 'text-emerald-400' : dark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
              {on && ts ? (
                <p className={`text-[9px] mt-0.5 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })}</p>
              ) : null}
            </div>
          )
        })}
      </div>

      {(r.courier_code || r.courier_partner) && (
        <div className={`mt-4 pt-4 border-t ${dark ? 'border-white/[0.06]' : 'border-gray-200/60'}`}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {r.courier_partner && (
              <div>
                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-500'}`}>Courier Partner</p>
                <p className={dark ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{r.courier_partner}</p>
              </div>
            )}
            {r.courier_code && (
              <div>
                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-500'}`}>Tracking Code</p>
                <p className={`font-mono ${dark ? 'text-white' : 'text-gray-900'}`}>{r.courier_code}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
