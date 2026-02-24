'use client'

import { useState } from 'react'
import {
  Download, FileText, FileSpreadsheet, FileJson, Printer,
  Share2, MessageCircle, Send, Mail, Copy, Link2, ExternalLink,
  Check, Loader2,
} from 'lucide-react'
import AdminModal from './AdminModal'
import {
  exportToCSV, exportToJSON, exportToPDF,
  shareViaWhatsApp, shareViaTelegram, shareViaEmail,
  copyToClipboard, exportToGoogleSheets, exportToGoogleDrive,
  generateShareLink,
} from '@/lib/admin/exportService'
import type { ExportOptions } from '@/lib/admin/exportService'

interface ExportShareModalProps {
  isOpen: boolean
  onClose: () => void
  data: Record<string, any>[]
  options: ExportOptions
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  shareTitle?: string
  shareDescription?: string
}

export default function ExportShareModal({
  isOpen,
  onClose,
  data,
  options,
  showToast,
  shareTitle,
  shareDescription,
}: ExportShareModalProps) {
  const [tab, setTab] = useState<'export' | 'share'>('export')
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const shareLink = generateShareLink(options.filename)

  const handleExport = async (format: string) => {
    setLoading(format)
    await new Promise(r => setTimeout(r, 400)) // Small delay for UX

    try {
      switch (format) {
        case 'csv':
          exportToCSV(data, options)
          showToast(`Exported ${data.length} records as CSV`, 'success')
          break
        case 'json':
          exportToJSON(data, options)
          showToast(`Exported ${data.length} records as JSON`, 'success')
          break
        case 'pdf':
          exportToPDF(data, options)
          showToast('PDF export opened in new window', 'success')
          break
        case 'google-sheets': {
          const url = exportToGoogleSheets(options.title || options.filename)
          showToast('Data exported to Google Sheets (mock)', 'info')
          break
        }
        case 'google-drive': {
          const url = exportToGoogleDrive(options.title || options.filename)
          showToast('File uploaded to Google Drive (mock)', 'info')
          break
        }
      }
    } catch {
      showToast('Export failed. Please try again.', 'error')
    }
    setLoading(null)
  }

  const handleShare = (target: string) => {
    const opts = {
      title: shareTitle || options.title || options.filename,
      description: shareDescription || `${data.length} records from GHL India Ventures`,
      url: shareLink,
    }

    switch (target) {
      case 'whatsapp':
        shareViaWhatsApp(opts)
        showToast('Opening WhatsApp...', 'info')
        break
      case 'telegram':
        shareViaTelegram(opts)
        showToast('Opening Telegram...', 'info')
        break
      case 'email':
        shareViaEmail(opts)
        showToast('Opening email client...', 'info')
        break
    }
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareLink)
    if (success) {
      setCopied(true)
      showToast('Share link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 2000)
    } else {
      showToast('Failed to copy link', 'error')
    }
  }

  const exportFormats = [
    { id: 'csv', label: 'CSV Spreadsheet', desc: 'Compatible with Excel, Google Sheets', icon: FileSpreadsheet, color: '#10B981' },
    { id: 'json', label: 'JSON Data', desc: 'Structured data for developers & APIs', icon: FileJson, color: '#3B82F6' },
    { id: 'pdf', label: 'PDF Report', desc: 'Formatted printable document', icon: Printer, color: '#DC2626' },
    { id: 'google-sheets', label: 'Google Sheets', desc: 'Export directly to a new spreadsheet', icon: FileSpreadsheet, color: '#34A853' },
    { id: 'google-drive', label: 'Google Drive', desc: 'Save to your Google Drive folder', icon: ExternalLink, color: '#4285F4' },
  ]

  const shareTargets = [
    { id: 'whatsapp', label: 'WhatsApp', desc: 'Share via WhatsApp message', icon: MessageCircle, color: '#25D366' },
    { id: 'telegram', label: 'Telegram', desc: 'Share via Telegram message', icon: Send, color: '#0088CC' },
    { id: 'email', label: 'Email', desc: 'Send as email attachment', icon: Mail, color: '#EA4335' },
  ]

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Export & Share"
      subtitle={`${data.length} records \u00b7 ${options.title || options.filename}`}
      maxWidth="max-w-lg"
    >
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-4">
        <button
          onClick={() => setTab('export')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            tab === 'export' ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <button
          onClick={() => setTab('share')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            tab === 'share' ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* Export Tab */}
      {tab === 'export' && (
        <div className="space-y-2">
          {exportFormats.map(fmt => {
            const Icon = fmt.icon
            const isLoading = loading === fmt.id
            return (
              <button
                key={fmt.id}
                onClick={() => handleExport(fmt.id)}
                disabled={!!loading}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left group disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${fmt.color}15` }}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: fmt.color }} />
                  ) : (
                    <Icon className="w-4 h-4" style={{ color: fmt.color }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium">{fmt.label}</p>
                  <p className="text-[11px] text-gray-500">{fmt.desc}</p>
                </div>
                <Download className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {/* Share Tab */}
      {tab === 'share' && (
        <div className="space-y-4">
          {/* Share link */}
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Share Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] min-w-0">
                <Link2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-400 truncate font-mono">{shareLink}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg bg-brand-red/20 border border-brand-red/30 text-white text-xs font-medium hover:bg-brand-red/30 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">Link expires in 24 hours. Recipients need an account to view.</p>
          </div>

          {/* Share targets */}
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Send Via</p>
            <div className="space-y-2">
              {shareTargets.map(target => {
                const Icon = target.icon
                return (
                  <button
                    key={target.id}
                    onClick={() => handleShare(target.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${target.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: target.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white font-medium">{target.label}</p>
                      <p className="text-[11px] text-gray-500">{target.desc}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </AdminModal>
  )
}
