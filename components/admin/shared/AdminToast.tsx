'use client'

import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

interface AdminToastProps {
  msg: string
  type: 'success' | 'error' | 'info' | 'warning'
  onDismiss: () => void
}

const TOAST_CONFIG = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-300' },
  error: { icon: AlertCircle, bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-300' },
  info: { icon: Info, bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-300' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-300' },
}

export default function AdminToast({ msg, type, onDismiss }: AdminToastProps) {
  const config = TOAST_CONFIG[type]
  const Icon = config.icon

  return (
    <div className={`fixed bottom-6 right-6 z-[10001] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl
      ${config.bg} animate-slide-up`}
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${config.text}`} />
      <span className="text-sm text-white/90 font-medium">{msg}</span>
      <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors ml-2">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
