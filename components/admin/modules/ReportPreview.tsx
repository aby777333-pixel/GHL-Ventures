/* ================================================================
   REPORT PREVIEW — Read-only render of saved Builder blocks

   Used by:
     • The Preview modal in BuilderTab
     • The Export-to-PDF flow (the same DOM is captured by html2canvas)

   The preview is intentionally rendered with a WHITE background and
   black text so it converts cleanly to a printable PDF — the dark UI
   theme would otherwise turn the PDF into a black rectangle.
   ================================================================ */

'use client'

import { forwardRef, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RePieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useReportsDataContext } from '@/lib/admin/useReportsLiveData'
import { formatINRCompact } from '@/lib/admin/reportsData'
import type { SavedBlock } from '@/lib/admin/reportBuilderService'

const PRINT_COLORS = ['#DC2626', '#D4AF37', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']

interface Props {
  title: string
  blocks: SavedBlock[]
}

/**
 * Whole-report preview rendered in a print-friendly stylesheet.
 * Forwarded ref points at the outer container — the Export handler
 * passes that ref to html2canvas to produce the PDF.
 */
const ReportPreview = forwardRef<HTMLDivElement, Props>(function ReportPreview(
  { title, blocks },
  ref,
) {
  const ctx = useReportsDataContext()

  const today = useMemo(
    () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    [],
  )

  return (
    <div
      ref={ref}
      style={{
        background: '#ffffff',
        color: '#111827',
        padding: '32px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        minWidth: '794px', // A4 @ 96dpi
        maxWidth: '794px',
      }}
    >
      {/* Header — always shows GHL logo + title + date */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #DC2626',
          paddingBottom: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brand/ghl-logo-full-dark.png"
            alt="GHL India Ventures"
            style={{ height: '48px', width: 'auto' }}
            crossOrigin="anonymous"
          />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
            Generated {today} &middot; GHL India Ventures
          </div>
        </div>
      </header>

      {/* Body — render each block */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {blocks.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
            No content yet — drag blocks onto the canvas to build the report.
          </p>
        ) : (
          blocks.map(b => <BlockRenderer key={b.id} block={b} ctx={ctx} />)
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: '32px',
          paddingTop: '12px',
          borderTop: '1px solid #E5E7EB',
          textAlign: 'center',
          fontSize: '10px',
          color: '#9CA3AF',
        }}
      >
        © {new Date().getFullYear()} GHL India Ventures &middot; SEBI-Registered Category II AIF &middot;
        Confidential — for authorised recipients only
      </footer>
    </div>
  )
})

export default ReportPreview

// ── Per-block renderers ────────────────────────────────────────

function BlockRenderer({ block, ctx }: { block: SavedBlock; ctx: ReturnType<typeof useReportsDataContext> }) {
  switch (block.type) {
    case 'kpi':
      return <KpiBlock ctx={ctx} title={block.props?.title} />
    case 'table':
      return <TableBlock ctx={ctx} dataSource={block.props?.dataSource} title={block.props?.title} />
    case 'chart':
      return <ChartBlock ctx={ctx} chartType={block.props?.chartType} dataSource={block.props?.dataSource} title={block.props?.title} />
    case 'comparison':
      return <ComparisonBlock ctx={ctx} title={block.props?.title} />
    case 'text':
      return <TextBlock title={block.props?.title} text={block.props?.text} />
    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '8px 0' }} />
    case 'logo':
      return <LogoBlock />
    case 'ai-summary':
      return <AISummaryBlock ctx={ctx} />
    case 'ai-forecast':
      return <AIForecastBlock ctx={ctx} />
    case 'ai-recs':
      return <AIRecsBlock ctx={ctx} />
    case 'attachment':
      return <AttachmentBlock block={block} />
    default:
      return null
  }
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '16px',
  background: '#FAFAFA',
  pageBreakInside: 'avoid',
}

const h2Style: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#111827',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 12px 0',
}

// ── KPI ───────────────────────────────────────────────────────

function KpiBlock({ ctx, title }: { ctx: ReturnType<typeof useReportsDataContext>; title?: string }) {
  const k = ctx.REPORT_KPIS
  const cards: { label: string; value: string; sub: string }[] = [
    { label: 'Total AUM', value: formatINRCompact(k.totalAUM || 0), sub: `${k.totalAUMChange ?? 0}% YoY` },
    { label: 'Monthly Revenue', value: formatINRCompact(k.monthlyRevenue || 0), sub: `${k.revenueChange ?? 0}% MoM` },
    { label: 'Active Clients', value: String(k.activeClients ?? 0), sub: `${k.newClientsMonth ?? 0} new this month` },
    { label: 'Net Profit', value: formatINRCompact(k.netProfit || 0), sub: `${k.profitMargin ?? 0}% margin` },
  ]
  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>{title || 'Key Performance Indicators'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: '4px' }}>{c.value}</div>
            <div style={{ fontSize: '10px', color: '#10B981', marginTop: '2px' }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Table ─────────────────────────────────────────────────────

function TableBlock({ ctx, dataSource, title }: { ctx: ReturnType<typeof useReportsDataContext>; dataSource?: string; title?: string }) {
  const ds = (dataSource || 'Revenue Data').toLowerCase()
  let rows: { col1: string; col2: string; col3: string }[] = []
  let headers = ['Item', 'Value', 'Change']

  if (ds.includes('client')) {
    headers = ['Client', 'Tier', 'AUM']
    rows = (ctx.REPORT_CLIENTS || []).slice(0, 8).map((c: any) => ({
      col1: c.name || c.clientName || 'Client',
      col2: c.tier || '—',
      col3: formatINRCompact(c.aum || c.totalInvested || 0),
    }))
  } else if (ds.includes('campaign')) {
    headers = ['Campaign', 'Spend', 'Revenue']
    rows = (ctx.CAMPAIGN_METRICS || []).slice(0, 8).map((c: any) => ({
      col1: c.name || 'Campaign',
      col2: formatINRCompact(c.spend || 0),
      col3: formatINRCompact(c.revenueGenerated || 0),
    }))
  } else if (ds.includes('staff')) {
    headers = ['Staff', 'Action', 'Entity']
    rows = (ctx.STAFF_ACTIVITY || []).slice(0, 8).map((s: any) => ({
      col1: s.staffName || 'Staff',
      col2: s.action || '—',
      col3: s.entity || '—',
    }))
  } else {
    rows = (ctx.REVENUE_BY_TYPE || []).slice(0, 8).map(r => ({
      col1: r.type,
      col2: formatINRCompact(r.amount),
      col3: `${r.percentage}%`,
    }))
  }

  if (rows.length === 0) {
    rows = [{ col1: 'No data available', col2: '—', col3: '—' }]
  }

  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>{title || `${dataSource || 'Data'} Table`}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#F3F4F6' }}>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: '#374151' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid #E5E7EB' }}>
              <td style={{ padding: '6px 10px', color: '#111827' }}>{r.col1}</td>
              <td style={{ padding: '6px 10px', color: '#111827' }}>{r.col2}</td>
              <td style={{ padding: '6px 10px', color: '#10B981' }}>{r.col3}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

// ── Chart ─────────────────────────────────────────────────────

function ChartBlock({ ctx, chartType, dataSource, title }: {
  ctx: ReturnType<typeof useReportsDataContext>
  chartType?: string
  dataSource?: string
  title?: string
}) {
  const ds = (dataSource || 'Revenue Data').toLowerCase()
  const data = ds.includes('campaign')
    ? (ctx.CAMPAIGN_METRICS || []).slice(0, 6).map((c: any) => ({
        name: (c.name || '').slice(0, 14),
        value: c.revenueGenerated || c.spend || 0,
      }))
    : (ctx.MONTHLY_REVENUE || []).slice(-6).map((m: any) => ({
        name: m.month,
        value: m.revenue,
      }))

  const ct = (chartType || 'Area Chart').toLowerCase()

  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>{title || `${dataSource || 'Revenue'} — ${chartType || 'Chart'}`}</h2>
      <div style={{ width: '100%', height: 220, background: '#fff', padding: '8px', borderRadius: '6px' }}>
        <ResponsiveContainer>
          {ct.includes('pie') || ct.includes('donut') ? (
            <RePieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={ct.includes('donut') ? 80 : 90}
                innerRadius={ct.includes('donut') ? 45 : 0}
                label={(e: any) => e.name}
              >
                {data.map((_: unknown, i: number) => <Cell key={i} fill={PRINT_COLORS[i % PRINT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </RePieChart>
          ) : ct.includes('bar') ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
              <Bar dataKey="value" fill="#DC2626" />
            </BarChart>
          ) : ct.includes('line') ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
              <Line type="monotone" dataKey="value" stroke="#DC2626" strokeWidth={2} />
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="pdfArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DC2626" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
              <Area type="monotone" dataKey="value" stroke="#DC2626" fill="url(#pdfArea)" strokeWidth={2} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  )
}

// ── Comparison ────────────────────────────────────────────────

function ComparisonBlock({ ctx, title }: { ctx: ReturnType<typeof useReportsDataContext>; title?: string }) {
  const k = ctx.REPORT_KPIS
  const items = [
    { label: 'Revenue', a: formatINRCompact(k.monthlyRevenue || 0), b: `${k.revenueChange ?? 0}% MoM`, positive: (k.revenueChange ?? 0) >= 0 },
    { label: 'Expenses', a: formatINRCompact(k.monthlyExpenses || 0), b: `${k.expenseChange ?? 0}% MoM`, positive: (k.expenseChange ?? 0) <= 0 },
    { label: 'Retention', a: `${k.retentionRate ?? 0}%`, b: 'vs. 88% industry avg', positive: (k.retentionRate ?? 0) >= 88 },
    { label: 'LTV : CAC', a: `${k.ltvCacRatio ?? 0}x`, b: 'target ≥ 3x', positive: (k.ltvCacRatio ?? 0) >= 3 },
  ]
  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>{title || 'Period-over-Period Comparison'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {items.map(it => (
          <div key={it.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>{it.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{it.a}</span>
              <span style={{ fontSize: '11px', color: it.positive ? '#10B981' : '#DC2626' }}>{it.b}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Text / Heading ────────────────────────────────────────────

function TextBlock({ title, text }: { title?: string; text?: string }) {
  return (
    <section style={{ ...sectionStyle, background: '#fff' }}>
      {title && <h2 style={h2Style}>{title}</h2>}
      <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
        {text || 'Click the block on the canvas to edit this text in the Properties panel.'}
      </p>
    </section>
  )
}

// ── Logo ──────────────────────────────────────────────────────

function LogoBlock() {
  return (
    <section style={{ textAlign: 'center', padding: '12px 0' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand/ghl-logo-full-red.png"
        alt="GHL India Ventures"
        style={{ height: '64px', width: 'auto', display: 'inline-block' }}
        crossOrigin="anonymous"
      />
    </section>
  )
}

// ── AI blocks ─────────────────────────────────────────────────

function AISummaryBlock({ ctx }: { ctx: ReturnType<typeof useReportsDataContext> }) {
  const insights = (ctx.AI_INSIGHTS || []).slice(0, 3)
  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>AI Executive Summary</h2>
      {insights.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#6B7280' }}>No AI insights generated yet.</p>
      ) : (
        <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>
          {insights.map((ins: any) => (
            <li key={ins.id} style={{ marginBottom: '6px' }}>
              <strong style={{ color: '#DC2626', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
                {ins.type}
              </strong>{' '}
              {ins.summary}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AIForecastBlock({ ctx }: { ctx: ReturnType<typeof useReportsDataContext> }) {
  const data = (ctx.REVENUE_FORECAST || []).slice(0, 6)
  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>AI Revenue Forecast</h2>
      {data.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#6B7280' }}>Forecast data not available.</p>
      ) : (
        <div style={{ width: '100%', height: 200, background: '#fff', padding: '8px', borderRadius: '6px' }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: number | undefined) => formatINRCompact(v ?? 0)} />
              <Line type="monotone" dataKey="forecast" stroke="#3B82F6" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="actual" stroke="#DC2626" />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function AIRecsBlock({ ctx }: { ctx: ReturnType<typeof useReportsDataContext> }) {
  const recs = (ctx.AI_INSIGHTS || []).filter((i: any) => i.type === 'recommendation' || i.type === 'opportunity').slice(0, 4)
  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>AI Recommendations</h2>
      {recs.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#6B7280' }}>No active recommendations.</p>
      ) : (
        <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>
          {recs.map((r: any) => (
            <li key={r.id} style={{ marginBottom: '6px' }}>
              <strong>{r.summary?.slice(0, 80) || 'Recommendation'}</strong>
              {r.impact && <span style={{ color: '#10B981', marginLeft: 6 }}>→ {r.impact}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// ── Attachment ────────────────────────────────────────────────

function AttachmentBlock({ block }: { block: SavedBlock }) {
  if (!block.fileRef) return null
  return (
    <section style={{ ...sectionStyle, background: '#FEF2F2', borderColor: '#FECACA' }}>
      <h2 style={h2Style}>Attached Document</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#374151' }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: '6px', background: '#DC2626',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
          }}
        >
          {block.fileRef.fileType.slice(0, 3)}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{block.fileRef.title}</div>
          <div style={{ fontSize: '10px', color: '#6B7280' }}>{block.fileRef.fileType.toUpperCase()} &middot; {(block.fileRef.fileSize / 1024).toFixed(1)} KB</div>
        </div>
      </div>
    </section>
  )
}
