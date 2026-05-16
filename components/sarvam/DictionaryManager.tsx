'use client'

/* ─────────────────────────────────────────────────────────────
   Sarvam Pronunciation Dictionary Manager — CRUD UI

   Three columns / panels rolled into one component:
     - Top: dictionary list (Sarvam list merged with our registry's
       friendly name + word_count + languages).
     - Middle: viewer / editor — click a row to load contents into
       the editor; "Add new" empties the form. JSON is validated
       client-side before submit.
     - Bottom: action row — Save (create / update based on whether
       there's a dict_id), Delete (with confirm), Refresh.

   Admin gating: create / update / delete require admin / super_admin
   role. The parent passes `isAdmin` after checking the session;
   non-admins see read-only mode with a tooltip explaining why.

   `onAttachToTTS` is a hook for Module 33 to wire the picked
   dict_id back into <TTSPlayer />'s dict picker when it lands.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  sarvamDictList,
  sarvamDictGet,
  sarvamDictCreate,
  sarvamDictUpdate,
  sarvamDictDelete,
  formatSarvamError,
  type SarvamDictEntry,
} from '@/lib/sarvam/browserClient'

type EditMode = 'create' | 'update'

export interface DictionaryManagerProps {
  className?: string
  /** True when the current Supabase user has admin / super_admin
   *  role — gates the Save / Delete buttons. */
  isAdmin?: boolean
  /** Hook for the demo page to wire a chosen dictionary back into
   *  the TTSPlayer (or any other component) for testing. */
  onAttachToTTS?: (dictionary_id: string) => void
}

// Pre-canned starter JSON shown when the admin clicks "Add new".
// Matches §4.3 starter dicts so non-developers have a working
// template to edit.
const STARTER_TEMPLATE = {
  pronunciations: {
    'hi-IN': {
      NEFT: 'एन ई एफ टी',
      RTGS: 'आर टी जी एस',
      KYC: 'के वाई सी',
      EMI: 'ई एम आई',
      Sarvam: 'सारवम',
    },
    'en-IN': {
      Sarvam: 'Saar-vum',
      'GHL India Ventures': 'G H L India Ventures',
      GIO4X: 'G I O four X',
    },
  },
}

export default function DictionaryManager({
  className = '',
  isAdmin = false,
  onAttachToTTS,
}: DictionaryManagerProps) {
  const [dicts, setDicts] = useState<SarvamDictEntry[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [selected, setSelected] = useState<SarvamDictEntry | null>(null)
  const [mode, setMode] = useState<EditMode>('create')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [jsonText, setJsonText] = useState(JSON.stringify(STARTER_TEMPLATE, null, 2))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Load list on mount.
  const refresh = useCallback(async () => {
    setLoadingList(true); setError(null)
    try {
      const r = await sarvamDictList()
      setDicts(r.dictionaries || [])
    } catch (e: unknown) {
      setError(formatSarvamError(e))
    } finally { setLoadingList(false) }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  // Validate JSON; returns parsed object or null + sets error.
  const parseJson = useCallback((): null | { pronunciations: Record<string, Record<string, string>> } => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed || typeof parsed !== 'object' || !('pronunciations' in parsed)) {
        throw new Error('JSON must contain a top-level "pronunciations" object.')
      }
      return parsed as { pronunciations: Record<string, Record<string, string>> }
    } catch (e) {
      setError((e as Error).message || 'Invalid JSON')
      return null
    }
  }, [jsonText])

  const wordCount = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText)
      let n = 0
      for (const langEntries of Object.values((parsed?.pronunciations || {}) as Record<string, Record<string, string>>)) {
        n += Object.keys(langEntries || {}).length
      }
      return n
    } catch { return 0 }
  }, [jsonText])

  const handleSelect = useCallback(async (entry: SarvamDictEntry) => {
    setSelected(entry)
    setMode('update')
    setError(null); setNotice(null)
    setName(entry.name || '')
    setDescription(entry.description || '')
    try {
      const contents = await sarvamDictGet(entry.dictionary_id)
      setJsonText(JSON.stringify(contents, null, 2))
    } catch (e: unknown) {
      setError(formatSarvamError(e))
      setJsonText(JSON.stringify({ pronunciations: {} }, null, 2))
    }
  }, [])

  const handleNew = useCallback(() => {
    setSelected(null); setMode('create')
    setError(null); setNotice(null)
    setName(''); setDescription('')
    setJsonText(JSON.stringify(STARTER_TEMPLATE, null, 2))
  }, [])

  const handleSave = useCallback(async () => {
    if (!isAdmin) { setError('Admin role required to create or update dictionaries.'); return }
    setError(null); setNotice(null)
    const parsed = parseJson()
    if (!parsed) return
    setBusy(true)
    try {
      if (mode === 'create') {
        if (!name.trim()) { setError('Name is required.'); setBusy(false); return }
        const res = await sarvamDictCreate({
          name: name.trim(),
          description: description.trim() || undefined,
          file: parsed,
        })
        setNotice(`Created "${res.name}" → ${res.dictionary_id}`)
        await refresh()
        // Auto-select the new dict for further edits.
        setSelected({
          dictionary_id: res.dictionary_id,
          name: res.name,
          description: description.trim() || null,
          word_count: res.word_count,
          languages: res.languages,
        })
        setMode('update')
      } else if (selected) {
        const res = await sarvamDictUpdate({
          dictionary_id: selected.dictionary_id,
          description: description.trim() || undefined,
          file: parsed,
        })
        setNotice(`Updated → ${res.word_count} words, ${(res.languages || []).length} langs`)
        await refresh()
      }
    } catch (e: unknown) {
      setError(formatSarvamError(e))
    } finally { setBusy(false) }
  }, [isAdmin, mode, name, description, selected, parseJson, refresh])

  const handleDelete = useCallback(async () => {
    if (!isAdmin || !selected) return
    if (!window.confirm(`Delete dictionary "${selected.name || selected.dictionary_id}"? This cannot be undone — any TTS call still pointing at this dict_id will fall back to no-dict behaviour.`)) return
    setBusy(true); setError(null); setNotice(null)
    try {
      await sarvamDictDelete(selected.dictionary_id)
      setNotice(`Deleted ${selected.dictionary_id}`)
      handleNew()
      await refresh()
    } catch (e: unknown) {
      setError(formatSarvamError(e))
    } finally { setBusy(false) }
  }, [isAdmin, selected, handleNew, refresh])

  const handleAttach = useCallback(() => {
    if (selected && onAttachToTTS) onAttachToTTS(selected.dictionary_id)
  }, [selected, onAttachToTTS])

  return (
    <section className={`rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-white">Sarvam Pronunciation Dictionaries</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            bulbul:v3 only · 10 dicts / user · 100 words / dict · attach via <code className="text-gray-300">dict_id</code> on any TTS call
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <span className="text-[10px] px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300" title="Sign in as admin to create / edit / delete">
              Read-only
            </span>
          )}
          <button
            type="button" onClick={refresh} disabled={loadingList}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          >
            {loadingList ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {/* List */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Dictionaries</span>
          {isAdmin && (
            <button
              type="button" onClick={handleNew}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >+ New</button>
          )}
        </div>
        {dicts.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">No dictionaries yet. {isAdmin ? 'Click + New to create one.' : ''}</p>
        ) : (
          <div className="space-y-1.5">
            {dicts.map((d) => {
              const isSel = selected?.dictionary_id === d.dictionary_id
              return (
                <button
                  key={d.dictionary_id}
                  type="button"
                  onClick={() => handleSelect(d)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isSel
                      ? 'bg-brand-red/15 border border-brand-red/30'
                      : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{d.name || <span className="text-gray-500 italic">Unregistered</span>}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                      <span className="font-mono">{d.dictionary_id}</span>
                      {typeof d.word_count === 'number' && <span> · {d.word_count} words</span>}
                      {Array.isArray(d.languages) && d.languages.length > 0 && (
                        <span> · {d.languages.join(', ')}</span>
                      )}
                    </p>
                  </div>
                  {onAttachToTTS && isSel && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleAttach() }}
                      className="px-2 py-1 rounded text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                      title="Attach this dictionary_id to the TTS tab"
                    >
                      → TTS
                    </button>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
            {mode === 'create' ? 'New dictionary' : `Editing · ${selected?.name || selected?.dictionary_id}`}
          </span>
          <span className="text-[10px] text-gray-600 font-mono">{wordCount} words</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. ghl-financial)"
            disabled={mode === 'update' || !isAdmin}
            className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            disabled={!isAdmin}
            className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
          />
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={12}
          spellCheck={false}
          disabled={!isAdmin && mode === 'create'}
          className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white font-mono leading-relaxed focus:outline-none focus:border-brand-red/40 disabled:opacity-50"
        />

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}
              >
                {busy ? 'Saving…' : mode === 'create' ? '+ Create' : '↑ Update'}
              </button>
              {mode === 'update' && selected && (
                <button
                  type="button" onClick={handleDelete} disabled={busy}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >Delete</button>
              )}
              {mode === 'update' && (
                <button
                  type="button" onClick={handleNew} disabled={busy}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:text-white hover:bg-white/[0.08] transition-colors"
                >+ New</button>
              )}
            </>
          )}
          {!isAdmin && (
            <p className="text-[11px] text-gray-500">Sign in as admin to create or modify dictionaries.</p>
          )}
        </div>
      </div>

      {notice && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {error}
        </div>
      )}
    </section>
  )
}
