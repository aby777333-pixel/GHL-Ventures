'use client'

/* ─────────────────────────────────────────────────────────────
   Document Generator Modal — Admin Documents

   Opens from the "Generate" / "Fill & Download" button on any
   document row whose category maps to one of the four supported
   document kinds (acknowledgement, agreement, allotment,
   certificate). Renders an input form scoped to that kind's
   placeholder set; on submit it produces a populated PDF via
   `jspdf` and either downloads it or opens a preview tab.

   The PDF intentionally has no GHL/Landmaxo branding — what the
   admin sees in the form is exactly what the PDF contains.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { jsPDF } from 'jspdf'
import AdminModal, { ModalButton } from './AdminModal'
import {
  DOCUMENT_TEMPLATES,
  type DocumentField,
  type DocumentKind,
  formatIndianCurrency,
  formatPdfDate,
} from '@/lib/admin/documentTemplates'

interface Props {
  isOpen: boolean
  kind: DocumentKind | null
  /** Pre-fill name shown in the header (e.g. "Debenture Certificate (Reference)"). */
  documentName?: string | null
  onClose: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// Reasonable defaults so a fresh form isn't entirely blank for fixed-value fields.
const TODAY_ISO = () => new Date().toISOString().slice(0, 10)

export default function DocumentGeneratorModal({ isOpen, kind, documentName, onClose, showToast }: Props) {
  const template = kind ? DOCUMENT_TEMPLATES[kind] : null

  // values keyed by field.key
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<'view' | 'download' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Seed defaults whenever the modal opens for a new template.
  useEffect(() => {
    if (!isOpen || !template) return
    const seed: Record<string, string> = {}
    for (const f of template.fields) {
      if (f.defaultValue !== undefined) seed[f.key] = f.defaultValue
      else if (f.type === 'date') seed[f.key] = TODAY_ISO()
      else seed[f.key] = ''
    }
    setValues(seed)
    setErrors({})
  }, [isOpen, template])

  const update = (key: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }))
    if (errors[key]) setErrors(e => { const next = { ...e }; delete next[key]; return next })
  }

  const validate = (): boolean => {
    if (!template) return false
    const next: Record<string, string> = {}
    for (const f of template.fields) {
      const v = (values[f.key] || '').trim()
      if (f.required && !v) next[f.key] = 'Required'
      else if (v && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) next[f.key] = 'Invalid email'
      else if (v && (f.type === 'currency' || f.type === 'number') && !isFinite(Number(String(v).replace(/[^0-9.-]/g, ''))))
        next[f.key] = 'Invalid number'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ── PDF rendering ─────────────────────────────────────────────
  const renderPdf = (): Blob => {
    if (!template) throw new Error('No template selected')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 56
    let y = margin

    // Headline
    doc.setFont('helvetica', 'bold').setFontSize(16)
    doc.text(template.headline, pageW / 2, y, { align: 'center' })
    y += 28

    // Field table — label : value rows
    doc.setFontSize(11)
    for (const f of template.fields) {
      const raw = values[f.key] || ''
      const value = f.type === 'currency'
        ? (raw ? '₹ ' + formatIndianCurrency(raw) : '')
        : f.type === 'date'
          ? formatPdfDate(raw)
          : raw

      doc.setFont('helvetica', 'bold')
      doc.text(`${f.label}:`, margin, y)
      doc.setFont('helvetica', 'normal')

      const valueMaxWidth = pageW - margin - (margin + 180)
      const lines = doc.splitTextToSize(value || '—', valueMaxWidth)
      doc.text(lines, margin + 180, y)
      const lineH = 14
      y += Math.max(20, lines.length * lineH)
      if (y > pageH - margin - 120) {
        doc.addPage()
        y = margin
      }
    }

    // Body paragraphs
    y += 14
    doc.setFontSize(10)
    for (const para of template.body) {
      if (para === '') { y += 8; continue }
      const lines = doc.splitTextToSize(para, pageW - margin * 2)
      for (const line of lines) {
        if (y > pageH - margin - 40) { doc.addPage(); y = margin }
        doc.text(line, margin, y)
        y += 14
      }
    }

    // Footer
    if (template.footer || true) {
      doc.setFontSize(8).setTextColor(140)
      doc.text(template.footer || '* This is a system-generated document. *', margin, pageH - 24)
      doc.setTextColor(0)
    }

    return doc.output('blob')
  }

  const safeName = useMemo(() => {
    if (!template) return 'document'
    const investor = (values.INVESTOR_NAME || '').trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '')
    return `${template.title.replace(/\s+/g, '-')}${investor ? '-' + investor : ''}.pdf`
  }, [template, values])

  const handleDownload = () => {
    if (!validate()) { showToast('Please fix the highlighted fields.', 'warning'); return }
    try {
      setBusy('download')
      const blob = renderPdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = safeName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      showToast(`Generated ${safeName}`, 'success')
    } catch (e: any) {
      showToast(`Failed to generate PDF: ${e?.message || 'unknown'}`, 'error')
    } finally {
      setBusy(null)
    }
  }

  const handlePreview = () => {
    if (!validate()) { showToast('Please fix the highlighted fields.', 'warning'); return }
    try {
      setBusy('view')
      const blob = renderPdf()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) {
      showToast(`Failed to render preview: ${e?.message || 'unknown'}`, 'error')
    } finally {
      setBusy(null)
    }
  }

  if (!template) return null

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generate ${template.title}`}
      subtitle={documentName || 'Fill the fields below — the PDF is built from your inputs only.'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <ModalButton onClick={onClose}>Cancel</ModalButton>
          <ModalButton onClick={handlePreview} disabled={!!busy}>
            {busy === 'view' ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Rendering…</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</span>
            )}
          </ModalButton>
          <ModalButton variant="primary" onClick={handleDownload} disabled={!!busy}>
            {busy === 'download' ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Download className="w-4 h-4" /> Download PDF</span>
            )}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>The generated PDF contains exactly the values entered here — no logos, no pre-filled data. Use <strong>Preview</strong> to verify before downloading.</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {template.fields.map(f => (
            <FieldInput
              key={f.key}
              field={f}
              value={values[f.key] || ''}
              error={errors[f.key]}
              onChange={(v) => update(f.key, v)}
            />
          ))}
        </div>
      </div>
    </AdminModal>
  )
}

// ── Field input ───────────────────────────────────────────────
function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: DocumentField
  value: string
  error?: string
  onChange: (v: string) => void
}) {
  const labelEl = (
    <label className="block text-[11px] font-medium text-gray-300 mb-1.5">
      {field.label}
      {field.required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )

  const inputClass = `w-full bg-white/[0.04] border ${
    error ? 'border-red-500/50' : 'border-white/[0.08]'
  } rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20`

  // Full-width for textareas
  const wrapperClass = field.type === 'textarea' ? 'sm:col-span-2' : ''

  return (
    <div className={wrapperClass}>
      {labelEl}
      {field.type === 'textarea' ? (
        <textarea
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.hint || ''}
          className={inputClass + ' resize-none'}
        />
      ) : field.type === 'currency' ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">₹</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder={field.hint || '0'}
            className={inputClass + ' pl-7'}
          />
        </div>
      ) : (
        <input
          type={
            field.type === 'date' ? 'date'
            : field.type === 'email' ? 'email'
            : field.type === 'number' ? 'number'
            : field.type === 'tel' ? 'tel'
            : 'text'
          }
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.hint || ''}
          className={inputClass}
        />
      )}
      {(error || field.hint) && (
        <div className={`mt-1 text-[10px] ${error ? 'text-red-400' : 'text-gray-500'} flex items-center gap-1`}>
          {error && <AlertTriangle className="w-3 h-3" />}
          {error || field.hint}
        </div>
      )}
    </div>
  )
}
