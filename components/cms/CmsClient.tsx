'use client'

/* ─────────────────────────────────────────────────────────────
   Standalone Blog CMS console (/cms)

   Same content library and the same BlogCMSModule the admin
   portal uses — but behind its own login, with nothing else on
   screen. An SEO-team account can reach this and nothing else:
   /admin, /staff and /dashboard all reject the blog-only roles,
   and the database gives those roles no policy on clients, KYC,
   finance or other people's profiles.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, Image as ImageIcon, FolderTree, Users, MessageSquare,
  Download, Mail, BarChart3, Settings2, Trash2, LogOut, ExternalLink,
  Loader2, Menu, X, KeyRound, CheckCircle2, AlertCircle, Info, PenSquare,
} from 'lucide-react'
import BlogCMSModule from '@/components/admin/modules/BlogCMSModule'
import CmsLogin from './CmsLogin'
import {
  getCmsSession, logoutFromCms, changeOwnCmsPassword,
  ROLE_LABEL, type CmsSession,
} from '@/lib/supabase/cmsAuthService'

const SITE_URL = 'https://ghlindiaventures.com'

const NAV = [
  { id: 'posts',       label: 'Posts',            icon: FileText },
  { id: 'media',       label: 'Media library',    icon: ImageIcon },
  { id: 'categories',  label: 'Categories & tags', icon: FolderTree },
  { id: 'authors',     label: 'Authors',          icon: Users },
  { id: 'comments',    label: 'Comments',         icon: MessageSquare },
  { id: 'reports',     label: 'Reports & leads',  icon: Download },
  { id: 'subscribers', label: 'Subscribers',      icon: Mail },
  { id: 'analytics',   label: 'Analytics',        icon: BarChart3 },
  { id: 'seo',         label: 'SEO & redirects',  icon: Settings2 },
  { id: 'trash',       label: 'Trash',            icon: Trash2 },
] as const


/** Sidebar body, shared by the desktop rail and the mobile drawer.
 *  Module scope so React keeps one component identity. */
function SidebarContent({
  active, session, onNavigate, onChangePassword, onSignOut,
}: {
  active: string
  session: CmsSession
  onNavigate: (module: string, tab?: string) => void
  onChangePassword: () => void
  onSignOut: () => void
}) {
  return (
    <>
      <div className="p-5 border-b border-white/10 flex items-center gap-2.5 min-w-0">
        <span className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center flex-shrink-0">
          <PenSquare className="w-4 h-4 text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight truncate text-white">Content Studio</p>
          <p className="text-[10px] text-white/35 truncate">GHL India Ventures</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map((n) => {
          const Icon = n.icon
          const on = active === n.id
          return (
            <button
              key={n.id}
              onClick={() => onNavigate('blog', n.id === 'posts' ? undefined : n.id)}
              /* `justify-start` is required, not decorative: globals.css
                 centres any full-width rounded button that does not opt out. */
              className={`w-full flex justify-start items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                on ? 'bg-brand-red text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{n.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-0.5">
        <a
          href={`${SITE_URL}/blog/`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex justify-start items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">View live blog</span>
        </a>
        <button
          onClick={onChangePassword}
          className="w-full flex justify-start items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <KeyRound className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Change password</span>
        </button>
        <button
          onClick={onSignOut}
          className="w-full flex justify-start items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Sign out</span>
        </button>

        <div className="mt-2 px-3 py-2.5 rounded-lg bg-white/5">
          <p className="text-xs font-semibold truncate text-white">{session.user.name}</p>
          <p className="text-[10px] text-white/35 truncate">{session.user.email}</p>
          <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded bg-brand-red/15 text-brand-red text-[9px] font-bold uppercase tracking-wider">
            {ROLE_LABEL[session.user.role]}
          </span>
        </div>
      </div>
    </>
  )
}

type Toast = { id: number; msg: string; type: 'success' | 'error' | 'info' }

export default function CmsClient({ subTab }: { subTab?: string | null }) {
  const router = useRouter()
  const [session, setSession] = useState<CmsSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pwOpen, setPwOpen] = useState(false)

  const active = NAV.some((n) => n.id === subTab) ? (subTab as string) : 'posts'

  useEffect(() => {
    let alive = true
    getCmsSession().then((s) => { if (alive) { setSession(s); setChecking(false) } })
    return () => { alive = false }
  }, [])

  /* NOTE: this console deliberately does NOT set the `admin-active` body
     class. globals.css contains
       body.admin-active .fixed:not(.admin-portal) { visibility: hidden !important }
     which hid the sidebar and every modal (including the media picker) while
     they still occupied layout. The marketing chrome is already excluded from
     /cms by MainSiteOnly, and the editor's text colour no longer depends on
     that class, so it buys nothing here. Any fixed overlay below carries
     `admin-portal`, which is the sanctioned exemption when this module is
     rendered inside the admin portal, where AdminShell DOES set the class. */

  const showToast = useCallback((msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  /** BlogCMSModule calls navigate(module, subTab); in this console the
   *  module argument is irrelevant — everything lives under /cms. */
  const navigate = useCallback((_module: string, tab?: string) => {
    router.push(tab ? `/cms/${tab}` : '/cms')
    setNavOpen(false)
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0B090A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <CmsLogin onSuccess={(s) => setSession(s)} />
  }

  return (
    <div className="min-h-screen bg-[#0B090A] text-white flex">
      {/* ── sidebar ───────────────────────────────────────
          Desktop and mobile are rendered as SEPARATE elements on
          purpose. The previous single element toggled between
          `-translate-x-full` and `lg:translate-x-0`, and when those two
          utilities raced the sidebar ended up translated off-screen
          while still occupying its 16rem of layout — the column looked
          empty. Desktop now never carries a transform at all. */}
      <aside className="hidden lg:flex lg:sticky top-0 left-0 h-screen w-64 flex-shrink-0 bg-[#111315] border-r border-white/10 flex-col z-40">
        <SidebarContent
          active={active}
          session={session}
          onNavigate={navigate}
          onChangePassword={() => setPwOpen(true)}
          onSignOut={async () => { await logoutFromCms(); setSession(null) }}
        />
      </aside>

      {/* mobile drawer */}
      <aside
        className={`admin-portal fixed inset-y-0 left-0 z-50 w-64 bg-[#111315] border-r border-white/10 flex flex-col lg:hidden transition-transform duration-200 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-end p-3 border-b border-white/10">
          <button onClick={() => setNavOpen(false)} className="p-1.5 text-white/50 hover:text-white" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent
          active={active}
          session={session}
          onNavigate={navigate}
          onChangePassword={() => { setPwOpen(true); setNavOpen(false) }}
          onSignOut={async () => { await logoutFromCms(); setSession(null) }}
        />
      </aside>

      {navOpen && (
        <div className="admin-portal fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setNavOpen(false)} aria-hidden="true" />
      )}

      {/* ── main ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 max-w-full overflow-x-clip">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#0B090A]/95 backdrop-blur border-b border-white/10">
          <button onClick={() => setNavOpen(true)} className="p-1.5 text-white/60 hover:text-white" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold">Content Studio</span>
        </header>

        <main className="px-4 sm:px-6 py-6 min-w-0 max-w-full">
          <BlogCMSModule
            subTab={active === 'posts' ? null : active}
            navigate={navigate}
            showToast={showToast}
            canEdit={session.canEdit}
            canDelete={session.canDelete}
            hideTabs
          />
        </main>
      </div>

      {/* ── toasts ──────────────────────────────────────── */}
      <div className="admin-portal fixed bottom-4 right-4 z-[200] space-y-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info
          const tone = t.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            : t.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : 'border-white/15 bg-white/10 text-white/80'
          return (
            <div key={t.id} className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border backdrop-blur text-sm ${tone}`}>
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{t.msg}</span>
            </div>
          )
        })}
      </div>

      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} showToast={showToast} />}
    </div>
  )
}

function ChangePassword({ onClose, showToast }: { onClose: () => void; showToast: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw !== pw2) { showToast('The two passwords do not match.', 'error'); return }
    setBusy(true)
    const res = await changeOwnCmsPassword(pw)
    setBusy(false)
    showToast(res.message, res.ok ? 'success' : 'error')
    if (res.ok) onClose()
  }

  return (
    <div className="admin-portal fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="bg-[#161A1D] border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Change your password</h2>
          <button type="button" onClick={onClose} className="p-1 text-white/40 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="New password (min 10 characters)" autoComplete="new-password"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-red"
        />
        <input
          type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)}
          placeholder="Repeat new password" autoComplete="new-password"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-red"
        />
        <button
          type="submit" disabled={busy}
          className="w-full px-4 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red-deep disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Update password
        </button>
      </form>
    </div>
  )
}
