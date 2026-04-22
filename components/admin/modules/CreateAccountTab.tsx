/* ================================================================
   CREATE ACCOUNT TAB — Super-Admin › Sales & CRM › Create Account

   Allows an admin to register an investor on behalf of a client and
   step through the full KYC flow (Basic → Identity → Bank → Demat →
   Nominee) in a single wizard.

   OTP / email-verification are intentionally skipped per requirements:
   admin-created accounts are treated as verified by default. The
   underlying auth.users row is created server-side with
   email_confirm=true via /.netlify/functions/admin-create-client.
   ================================================================ */

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  User, Fingerprint, Landmark, CreditCard, Users, UserPlus, Upload, Eye,
  CheckCircle, Loader2, AlertCircle, Trash2, Plus, ChevronRight, ChevronLeft,
  KeyRound, ShieldCheck, Edit3,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import { getAuthToken, supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  upsertKYCBasicDetails, upsertKYCIdentityDetails, upsertKYCBankDetails,
  upsertKYCDematDetails, addNominee, updateNominee, deleteNominee,
  submitKYCForReview,
} from '@/lib/supabase/dashboardDataService'
import { uploadFile } from '@/lib/supabase/storageService'

// ── Netlify function host resolution (same pattern as register page) ──
const NETLIFY_FUNCTIONS_HOST = 'https://ghl-india-ventures-2025.netlify.app'
function getFunctionBase(): string {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  if (origin.includes('localhost')) return 'http://localhost:8888'
  if (origin.endsWith('.netlify.app')) return origin
  return NETLIFY_FUNCTIONS_HOST
}

interface CreateAccountTabProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

type StageId = 'register' | 'basic' | 'identity' | 'bank' | 'demat' | 'nominee' | 'done'

const STAGES: { id: StageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'register', label: 'Registration', icon: KeyRound },
  { id: 'basic', label: 'Basic Details', icon: User },
  { id: 'identity', label: 'Identity Details', icon: Fingerprint },
  { id: 'bank', label: 'Bank Details', icon: Landmark },
  { id: 'demat', label: 'Demat Account', icon: CreditCard },
  { id: 'nominee', label: 'Nominee Details', icon: Users },
]

const RELATIONSHIPS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other']
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Singapore', 'UAE', 'Canada', 'Australia', 'Other']

const cardCls = 'rounded-xl border p-6 bg-white/[0.03] border-white/[0.06]'
const inputCls = 'w-full px-3 py-2.5 rounded-lg border text-sm bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20'
const labelCls = 'block text-xs font-medium mb-1.5 text-gray-400'
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-semibold transition-colors disabled:opacity-50'
const btnOutline = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 text-sm font-semibold transition-colors disabled:opacity-50'

function isValidDOB(dateStr: string): boolean {
  if (!dateStr) return false
  const parts = dateStr.split('-')
  if (parts.length !== 3) return false
  const year = parseInt(parts[0], 10)
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) return false
  return true
}

export default function CreateAccountTab({ showToast }: CreateAccountTabProps) {
  const [activeStage, setActiveStage] = useState<StageId>('register')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // IDs are filled after server-side account creation.
  const [userId, setUserId] = useState<string>('')
  const [clientId, setClientId] = useState<string>('')

  // ── Stage 0: Registration ────────────────────────────────────
  const [reg, setReg] = useState({
    name: '', email: '', phone: '', password: '', referral: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  // ── Stage 1: Basic Details ───────────────────────────────────
  const [basic, setBasic] = useState({
    investor_name: '', phone: '', email: '', gender: '', investor_type: 'individual', resident_type: 'indian',
  })

  // ── Stage 2: Identity ────────────────────────────────────────
  const [identity, setIdentity] = useState({
    pan_number: '', aadhar_number: '', passport_number: '', name_on_document: '',
    father_name: '', dob: '', address: '', courier_address: '',
    country: 'India', state: '', city: '', pincode: '',
  })
  const [aadharDocUrl, setAadharDocUrl] = useState('')
  const [panDocUrl, setPanDocUrl] = useState('')
  const [passportDocUrl, setPassportDocUrl] = useState('')

  // ── Stage 3: Bank ────────────────────────────────────────────
  const [bank, setBank] = useState({
    account_type: 'savings', account_number: '', swift_iban_code: '', ifsc_code: '',
    branch_name: '', account_holder_name: '', bank_name: '',
  })
  const [bankDocUrl, setBankDocUrl] = useState('')

  // ── Stage 4: Demat ───────────────────────────────────────────
  const [demat, setDemat] = useState({ demat_account_number: '', skipped: false })
  const [dematDocUrl, setDematDocUrl] = useState('')

  // ── Stage 5: Nominees ────────────────────────────────────────
  const [nominees, setNominees] = useState<any[]>([])
  const [nomineeForm, setNomineeForm] = useState({ name: '', dob: '', phone: '', relationship: '', percentage: '' })
  const [nomineeProofUrl, setNomineeProofUrl] = useState('')
  const [editingNomineeId, setEditingNomineeId] = useState<string | null>(null)

  const errorRing = (name: string) => errors[name] ? ' !border-red-500 focus:!border-red-500 ring-1 ring-red-500/30' : ''
  const renderError = (name: string) => errors[name] ? (
    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />{errors[name]}
    </p>
  ) : null
  const clearError = (name: string) => { if (errors[name]) setErrors(e => { const n = { ...e }; delete n[name]; return n }) }

  // ── File upload helper (reuses client-uploads bucket via storageService)
  const handleFileUpload = async (file: File, setter: (url: string) => void) => {
    if (!clientId) { showToast('Create the account first (Step 1) before uploading', 'warning'); return }
    setUploading(true)
    try {
      const result = await uploadFile(file, 'client/kyc', { entityType: 'client', entityId: clientId })
      if (result?.file?.url) { setter(result.file.url); showToast('File uploaded', 'success') }
      else showToast(result?.error || 'Upload failed', 'error')
    } catch (err: any) {
      showToast(err?.message || 'Upload error', 'error')
    }
    setUploading(false)
  }

  const fetchNominees = useCallback(async () => {
    if (!clientId || !isSupabaseConfigured()) return
    const { data } = await supabase.from('nominees').select('*').eq('client_id', clientId).eq('status', 'active').order('created_at')
    setNominees(data || [])
  }, [clientId])

  useEffect(() => { if (clientId) fetchNominees() }, [clientId, fetchNominees])

  // ── Stage 0 submit: create the auth account server-side ──────
  const submitRegistration = async () => {
    const errs: Record<string, string> = {}
    if (!reg.name.trim()) errs.name = 'Name is required'
    if (!reg.email.trim()) errs.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(reg.email.trim())) errs.email = 'Invalid email format'
    const phoneDigits = reg.phone.replace(/\D/g, '')
    if (!reg.phone.trim()) errs.phone = 'Phone is required'
    else if (phoneDigits.length < 10) errs.phone = 'Enter a valid phone number'
    if (!reg.password) errs.password = 'Password is required'
    else if (reg.password.length < 8) errs.password = 'Password must be at least 8 characters'
    else if (!/[a-zA-Z]/.test(reg.password)) errs.password = 'Password must include a letter'
    else if (!/[0-9]/.test(reg.password)) errs.password = 'Password must include a number'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Surface the first error as a toast so the user notices — red-border
      // alone is easy to miss when a browser autofill chip is covering the
      // field.
      const first = Object.values(errs)[0]
      showToast(first || 'Please fix the highlighted fields', 'warning')
      return
    }
    setErrors({})

    setSaving(true)
    try {
      const token = await getAuthToken()
      if (!token) { showToast('Not authenticated. Please sign in again.', 'error'); setSaving(false); return }
      const base = getFunctionBase()
      const res = await fetch(`${base}/.netlify/functions/admin-create-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          email: reg.email.trim(),
          password: reg.password,
          fullName: reg.name.trim(),
          phone: phoneDigits,
          referral: reg.referral.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(data?.error || `Account creation failed (${res.status})`, 'error')
        setSaving(false)
        return
      }
      if (!data.userId || !data.clientId) {
        showToast('Account created but IDs missing — refresh and continue KYC manually', 'warning')
        setSaving(false)
        return
      }
      setUserId(data.userId)
      setClientId(data.clientId)
      // Pre-fill Basic Details from registration payload.
      setBasic(b => ({ ...b, investor_name: reg.name.trim(), email: reg.email.trim(), phone: phoneDigits }))
      showToast('Investor account created — continue with KYC', 'success')
      setActiveStage('basic')
    } catch (err: any) {
      showToast(err?.message || 'Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Stage 1 submit: Basic Details ────────────────────────────
  const saveBasic = async () => {
    if (!clientId) return
    const errs: Record<string, string> = {}
    if (!basic.investor_name.trim()) errs.investor_name = 'Investor name is required'
    if (!basic.phone.trim()) errs.phone = 'Phone is required'
    if (!basic.email.trim()) errs.email = 'Email is required'
    if (!basic.investor_type) errs.investor_type = 'Select investor type'
    if (!basic.resident_type) errs.resident_type = 'Select resident type'
    if (Object.keys(errs).length > 0) {
      setErrors(errs); showToast(Object.values(errs)[0] || 'Please fill required fields', 'warning'); return
    }
    setErrors({})
    setSaving(true)
    // email_verified=true: admin-created accounts are treated as verified.
    const result = await upsertKYCBasicDetails(clientId, userId, { ...basic, email_verified: true })
    setSaving(false)
    if (result) { showToast('Basic details saved', 'success'); setActiveStage('identity') }
    else showToast('Failed to save basic details', 'error')
  }

  // ── Stage 2 submit: Identity ─────────────────────────────────
  const saveIdentity = async () => {
    if (!clientId) return
    const errs: Record<string, string> = {}
    const isIndian = basic.resident_type === 'indian'
    if (isIndian) {
      if (!identity.pan_number) errs.pan_number = 'PAN number is required'
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(identity.pan_number)) errs.pan_number = 'Invalid PAN (e.g. ABCDE1234F)'
      if (!identity.aadhar_number) errs.aadhar_number = 'Aadhaar number is required'
      else if (!/^\d{12}$/.test(identity.aadhar_number.replace(/\s/g, ''))) errs.aadhar_number = 'Aadhaar must be 12 digits'
      if (!panDocUrl) errs.pan_doc = 'Upload PAN card'
      if (!aadharDocUrl) errs.aadhar_doc = 'Upload Aadhaar card'
    } else {
      if (!identity.passport_number) errs.passport_number = 'Passport number is required'
      if (!passportDocUrl) errs.passport_doc = 'Upload passport'
    }
    if (!identity.name_on_document) errs.name_on_document = 'Name is required'
    if (!identity.father_name) errs.father_name = "Father's name is required"
    if (!identity.dob) errs.dob = 'Date of birth is required'
    else if (!isValidDOB(identity.dob)) errs.dob = 'Invalid date of birth'
    if (!identity.address) errs.address = 'Address is required'
    if (!identity.courier_address) errs.courier_address = 'Courier address is required'
    if (!identity.country) errs.country = 'Country is required'
    if (!identity.state) errs.state = 'State is required'
    if (!identity.city) errs.city = 'City is required'
    if (!identity.pincode) errs.pincode = 'Pincode is required'
    if (Object.keys(errs).length > 0) {
      setErrors(errs); showToast(Object.values(errs)[0] || 'Please fill required fields', 'warning'); return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCIdentityDetails(clientId, userId, {
      ...identity,
      aadhar_doc_url: aadharDocUrl, pan_doc_url: panDocUrl, passport_doc_url: passportDocUrl,
    })
    setSaving(false)
    if (result) { showToast('Identity details saved', 'success'); setActiveStage('bank') }
    else showToast('Failed to save identity details', 'error')
  }

  // ── Stage 3 submit: Bank ─────────────────────────────────────
  const saveBank = async () => {
    if (!clientId) return
    const errs: Record<string, string> = {}
    const isIndianBank = basic.resident_type === 'indian'
    if (!bank.account_number) errs.account_number = 'Account number is required'
    else if (bank.account_number.length < 8) errs.account_number = 'Account number too short'
    if (!bank.account_holder_name) errs.account_holder_name = 'Account holder name is required'
    if (!bank.bank_name) errs.bank_name = 'Bank name is required'
    if (isIndianBank) {
      if (!bank.ifsc_code) errs.ifsc_code = 'IFSC code is required'
      else if (!/^[A-Z]{4}[A-Z0-9]{7}$/.test(bank.ifsc_code.toUpperCase())) errs.ifsc_code = 'Invalid IFSC format'
    } else {
      if (!bank.swift_iban_code) errs.swift_iban_code = 'SWIFT/IBAN is required'
    }
    if (!bankDocUrl) errs.bank_doc = 'Upload bank proof'
    if (Object.keys(errs).length > 0) {
      setErrors(errs); showToast(Object.values(errs)[0] || 'Please fill required fields', 'warning'); return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCBankDetails(clientId, userId, {
      ...bank,
      ifsc_code: bank.ifsc_code.toUpperCase(),
      bank_doc_url: bankDocUrl,
    })
    setSaving(false)
    if (result) { showToast('Bank details saved', 'success'); setActiveStage('demat') }
    else showToast('Failed to save bank details', 'error')
  }

  // ── Stage 4 submit: Demat (skippable) ────────────────────────
  const saveDemat = async (skip: boolean) => {
    if (!clientId) return
    if (skip) {
      setSaving(true)
      const result = await upsertKYCDematDetails(clientId, userId, { demat_account_number: '', demat_doc_url: '', skipped: true })
      setSaving(false)
      if (result) { showToast('Demat step skipped', 'success'); setActiveStage('nominee') }
      else showToast('Failed to save demat details', 'error')
      return
    }
    const errs: Record<string, string> = {}
    if (!demat.demat_account_number) errs.demat_account_number = 'Demat account number is required (or Skip)'
    if (!dematDocUrl) errs.demat_doc = 'Upload demat statement'
    if (Object.keys(errs).length > 0) {
      setErrors(errs); showToast(Object.values(errs)[0] || 'Please fill required fields', 'warning'); return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCDematDetails(clientId, userId, { ...demat, demat_doc_url: dematDocUrl, skipped: false })
    setSaving(false)
    if (result) { showToast('Demat details saved', 'success'); setActiveStage('nominee') }
    else showToast('Failed to save demat details', 'error')
  }

  // ── Stage 5 submit: Nominee add/update ───────────────────────
  const saveNominee = async () => {
    if (!clientId) return
    const errs: Record<string, string> = {}
    if (!nomineeForm.name) errs.nominee_name = 'Name is required'
    if (!nomineeForm.dob) errs.nominee_dob = 'DOB is required'
    else if (!isValidDOB(nomineeForm.dob)) errs.nominee_dob = 'Invalid DOB'
    const phoneDigits = nomineeForm.phone.replace(/\D/g, '')
    if (!nomineeForm.phone) errs.nominee_phone = 'Phone is required'
    else if (phoneDigits.length !== 10) errs.nominee_phone = 'Invalid 10-digit phone'
    if (!nomineeForm.relationship) errs.nominee_relationship = 'Relationship is required'
    const pct = parseFloat(nomineeForm.percentage)
    if (!nomineeForm.percentage) errs.nominee_percentage = 'Percentage is required'
    else if (isNaN(pct) || pct <= 0 || pct > 100) errs.nominee_percentage = 'Must be 1-100'
    if (!nomineeProofUrl) errs.nominee_proof = 'Upload ID proof'
    if (Object.keys(errs).length > 0) {
      setErrors(errs); showToast(Object.values(errs)[0] || 'Please fill required fields', 'warning'); return
    }
    setErrors({})
    setSaving(true)
    if (editingNomineeId) {
      await updateNominee(editingNomineeId, { ...nomineeForm, phone: phoneDigits, percentage: pct, proof_url: nomineeProofUrl })
    } else {
      await addNominee(clientId, userId, { ...nomineeForm, phone: phoneDigits, percentage: pct, proof_url: nomineeProofUrl })
    }
    setSaving(false)
    setNomineeForm({ name: '', dob: '', phone: '', relationship: '', percentage: '' })
    setNomineeProofUrl('')
    setEditingNomineeId(null)
    fetchNominees()
    showToast(editingNomineeId ? 'Nominee updated' : 'Nominee added', 'success')
  }

  const handleEditNominee = (n: any) => {
    setEditingNomineeId(n.id)
    setNomineeForm({
      name: n.name || '', dob: n.dob || '', phone: n.phone || '',
      relationship: n.relationship || '', percentage: String(n.percentage ?? ''),
    })
    setNomineeProofUrl(n.proof_url || '')
  }

  const handleDeleteNominee = async (n: any) => {
    if (!confirm(`Remove nominee "${n.name}"?`)) return
    const ok = await deleteNominee(n.id)
    if (ok) { showToast('Nominee removed', 'success'); fetchNominees() }
    else showToast('Failed to remove nominee', 'error')
  }

  const submitKYC = async () => {
    if (!clientId) return
    if (nominees.length === 0) { showToast('Add at least one nominee first', 'warning'); return }
    const totalPct = nominees.reduce((s, n) => s + (Number(n.percentage) || 0), 0)
    if (Math.abs(totalPct - 100) > 0.01) { showToast(`Nominee percentages must total 100% (currently ${totalPct}%)`, 'warning'); return }
    setSaving(true)
    const ok = await submitKYCForReview(clientId)
    setSaving(false)
    if (ok) {
      showToast('KYC submitted — account is ready', 'success')
      setActiveStage('done')
    } else {
      showToast('Failed to submit KYC', 'error')
    }
  }

  const resetAll = () => {
    setActiveStage('register')
    setUserId(''); setClientId('')
    setReg({ name: '', email: '', phone: '', password: '', referral: '' })
    setBasic({ investor_name: '', phone: '', email: '', gender: '', investor_type: 'individual', resident_type: 'indian' })
    setIdentity({ pan_number: '', aadhar_number: '', passport_number: '', name_on_document: '', father_name: '', dob: '', address: '', courier_address: '', country: 'India', state: '', city: '', pincode: '' })
    setAadharDocUrl(''); setPanDocUrl(''); setPassportDocUrl('')
    setBank({ account_type: 'savings', account_number: '', swift_iban_code: '', ifsc_code: '', branch_name: '', account_holder_name: '', bank_name: '' })
    setBankDocUrl('')
    setDemat({ demat_account_number: '', skipped: false })
    setDematDocUrl('')
    setNominees([])
    setNomineeForm({ name: '', dob: '', phone: '', relationship: '', percentage: '' })
    setNomineeProofUrl('')
    setEditingNomineeId(null)
    setErrors({})
  }

  // ── File upload block (reused across identity/bank/demat/nominee) ──
  const renderFileUpload = (label: string, currentUrl: string, setter: (url: string) => void, errorKey?: string, idSuffix?: string) => (
    <div>
      <label className={labelCls}>{label} *</label>
      <div className={`flex items-center gap-3 ${inputCls}${errorKey ? errorRing(errorKey) : ''} cursor-pointer`}>
        <input type="file" accept="image/*,.pdf" className="hidden" id={`file-${idSuffix || label.replace(/\W/g, '')}`}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFileUpload(f, setter); if (errorKey) clearError(errorKey) } }} />
        <label htmlFor={`file-${idSuffix || label.replace(/\W/g, '')}`} className="flex items-center gap-2 cursor-pointer flex-1">
          <Upload className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{uploading ? 'Uploading…' : currentUrl ? 'File uploaded — click to replace' : 'Choose File'}</span>
        </label>
        {currentUrl && <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-brand-red"><Eye className="w-4 h-4" /></a>}
      </div>
      {errorKey && renderError(errorKey)}
    </div>
  )

  const stageIndex = STAGES.findIndex(s => s.id === activeStage)

  // ── DONE screen ──────────────────────────────────────────────
  if (activeStage === 'done') {
    return (
      <AdminGlass className="py-14 text-center">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-40" />
          <div className="relative w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-1">Investor account created</h2>
        <p className="text-sm text-gray-400 mb-6">
          KYC has been submitted for review. The client can log in with their email and password immediately.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={resetAll} className={btnPrimary}>
            <UserPlus className="w-4 h-4" /> Create Another Account
          </button>
        </div>
      </AdminGlass>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <AdminGlass className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-red" />
            Create Investor Account
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Register a new investor on their behalf and complete their KYC. Email / mobile OTP is skipped — accounts are verified by default.
          </p>
        </div>
        {clientId && (
          <div className="text-[11px] text-gray-500 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <div>Client ID: <span className="text-gray-300 font-mono">{clientId.slice(0, 8)}…</span></div>
            <div>User ID: <span className="text-gray-300 font-mono">{userId.slice(0, 8)}…</span></div>
          </div>
        )}
      </AdminGlass>

      {/* Stepper — before the account is created, only "Registration" is
          navigable; clicking a later step shows a hint instead of silently
          doing nothing. After creation, the admin can jump to any step that
          has already been reached. */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STAGES.map((s, idx) => {
          const Icon = s.icon
          const isActive = s.id === activeStage
          const isDone = idx < stageIndex
          const isRegister = s.id === 'register'
          const canJump = isRegister || (!!clientId && (isDone || isActive))
          const handleClick = () => {
            if (canJump) { setActiveStage(s.id); return }
            showToast('Complete Step 1 (Registration) first to unlock KYC steps', 'info')
          }
          return (
            <button
              key={s.id}
              type="button"
              onClick={handleClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap
                ${isActive ? 'bg-brand-red/20 text-white border-brand-red/40' :
                  isDone ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                  canJump ? 'bg-white/[0.04] text-gray-300 border-white/[0.08] hover:bg-white/[0.08]' :
                  'bg-white/[0.02] text-gray-600 border-white/[0.04] hover:bg-white/[0.04]'}`}
            >
              {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Stage panels */}
      {activeStage === 'register' && (
        <form
          className={cardCls}
          autoComplete="off"
          onSubmit={(e) => { e.preventDefault(); submitRegistration() }}
        >
          {/* Honeypot + hidden dummy fields defeat browser autofill that was
              hijacking Phone / Password with the admin's own credentials.
              Must be BEFORE the real inputs and styled visually hidden. */}
          <input type="text" name="prevent_autofill" autoComplete="off" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
          <input type="password" name="prevent_autofill_pw" autoComplete="new-password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Step 1 — Registration</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified by default
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="ca-name">Name *</label>
              <input
                id="ca-name"
                name="investor-name"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className={inputCls + errorRing('name')}
                value={reg.name}
                onChange={e => { setReg(r => ({ ...r, name: e.target.value })); clearError('name') }}
                placeholder="Investor full name"
              />
              {renderError('name')}
            </div>
            <div>
              <label className={labelCls} htmlFor="ca-email">Email *</label>
              <input
                id="ca-email"
                name="investor-email"
                type="email"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className={inputCls + errorRing('email')}
                value={reg.email}
                onChange={e => { setReg(r => ({ ...r, email: e.target.value })); clearError('email') }}
                placeholder="name@example.com"
              />
              {renderError('email')}
            </div>
            <div>
              <label className={labelCls} htmlFor="ca-phone">Phone Number *</label>
              <input
                id="ca-phone"
                name="investor-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className={inputCls + errorRing('phone')}
                value={reg.phone}
                onChange={e => { setReg(r => ({ ...r, phone: e.target.value })); clearError('phone') }}
                placeholder="10-digit mobile (e.g. 9876543210)"
              />
              {renderError('phone')}
            </div>
            <div>
              <label className={labelCls} htmlFor="ca-password">Password *</label>
              <div className="relative">
                <input
                  id="ca-password"
                  name="investor-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  className={inputCls + errorRing('password') + ' pr-16'}
                  value={reg.password}
                  onChange={e => { setReg(r => ({ ...r, password: e.target.value })); clearError('password') }}
                  placeholder="Min 8 characters, incl. letters & numbers"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {renderError('password')}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls} htmlFor="ca-referral">Referral Code</label>
              <input
                id="ca-referral"
                name="investor-referral"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className={inputCls}
                value={reg.referral}
                onChange={e => setReg(r => ({ ...r, referral: e.target.value }))}
                placeholder="Optional — e.g. GHL-ABCD1234"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Create Account & Continue'}
            </button>
          </div>
        </form>
      )}

      {activeStage === 'basic' && (
        <div className={cardCls}>
          <h3 className="text-base font-semibold text-white mb-5">Step 2 — Basic Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Investor Name *</label>
              <input className={inputCls + errorRing('investor_name')} value={basic.investor_name} onChange={e => { setBasic(b => ({ ...b, investor_name: e.target.value })); clearError('investor_name') }} />
              {renderError('investor_name')}
            </div>
            <div>
              <label className={labelCls}>Phone Number *</label>
              <input className={inputCls + errorRing('phone')} value={basic.phone} onChange={e => { setBasic(b => ({ ...b, phone: e.target.value })); clearError('phone') }} />
              {renderError('phone')}
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <div className="relative">
                <input type="email" className={inputCls + errorRing('email') + ' pr-24'} value={basic.email} onChange={e => { setBasic(b => ({ ...b, email: e.target.value })); clearError('email') }} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Verified</span>
              </div>
              {renderError('email')}
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select className={inputCls} value={basic.gender} onChange={e => setBasic(b => ({ ...b, gender: e.target.value }))}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Investor Type *</label>
              <select className={inputCls + errorRing('investor_type')} value={basic.investor_type} onChange={e => { setBasic(b => ({ ...b, investor_type: e.target.value })); clearError('investor_type') }}>
                <option value="individual">Individual</option>
                <option value="huf">HUF</option>
                <option value="corporate">Corporate</option>
                <option value="trust">Trust</option>
              </select>
              {renderError('investor_type')}
            </div>
            <div>
              <label className={labelCls}>Resident Type *</label>
              <select className={inputCls + errorRing('resident_type')} value={basic.resident_type} onChange={e => { setBasic(b => ({ ...b, resident_type: e.target.value })); clearError('resident_type') }}>
                <option value="indian">Indian Resident</option>
                <option value="nri">NRI / Foreign</option>
              </select>
              {renderError('resident_type')}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setActiveStage('register')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={saveBasic} disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Save & Next
            </button>
          </div>
        </div>
      )}

      {activeStage === 'identity' && (
        <div className={cardCls}>
          <h3 className="text-base font-semibold text-white mb-5">Step 3 — Identity Details</h3>
          {basic.resident_type === 'indian' ? (
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>PAN Number *</label>
                <input className={inputCls + errorRing('pan_number')} value={identity.pan_number} onChange={e => { setIdentity(i => ({ ...i, pan_number: e.target.value.toUpperCase() })); clearError('pan_number') }} placeholder="ABCDE1234F" maxLength={10} />
                {renderError('pan_number')}
              </div>
              <div>
                <label className={labelCls}>Aadhaar Number *</label>
                <input className={inputCls + errorRing('aadhar_number')} value={identity.aadhar_number} onChange={e => { setIdentity(i => ({ ...i, aadhar_number: e.target.value })); clearError('aadhar_number') }} placeholder="12-digit Aadhaar" maxLength={14} />
                {renderError('aadhar_number')}
              </div>
              {renderFileUpload('Upload PAN Card', panDocUrl, setPanDocUrl, 'pan_doc', 'panDoc')}
              {renderFileUpload('Upload Aadhaar Card', aadharDocUrl, setAadharDocUrl, 'aadhar_doc', 'aadharDoc')}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Passport Number *</label>
                <input className={inputCls + errorRing('passport_number')} value={identity.passport_number} onChange={e => { setIdentity(i => ({ ...i, passport_number: e.target.value.toUpperCase() })); clearError('passport_number') }} />
                {renderError('passport_number')}
              </div>
              {renderFileUpload('Upload Passport', passportDocUrl, setPassportDocUrl, 'passport_doc', 'passportDoc')}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input className={inputCls + errorRing('name_on_document')} value={identity.name_on_document} onChange={e => { setIdentity(i => ({ ...i, name_on_document: e.target.value })); clearError('name_on_document') }} />
              {renderError('name_on_document')}
            </div>
            <div>
              <label className={labelCls}>Father's Name *</label>
              <input className={inputCls + errorRing('father_name')} value={identity.father_name} onChange={e => { setIdentity(i => ({ ...i, father_name: e.target.value })); clearError('father_name') }} />
              {renderError('father_name')}
            </div>
            <div>
              <label className={labelCls}>Date of Birth *</label>
              <input type="date" className={inputCls + errorRing('dob')} value={identity.dob} onChange={e => { setIdentity(i => ({ ...i, dob: e.target.value })); clearError('dob') }} />
              {renderError('dob')}
            </div>
            <div>
              <label className={labelCls}>Country *</label>
              <select className={inputCls + errorRing('country')} value={identity.country} onChange={e => { setIdentity(i => ({ ...i, country: e.target.value })); clearError('country') }}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {renderError('country')}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Address *</label>
              <textarea rows={2} className={inputCls + errorRing('address')} value={identity.address} onChange={e => { setIdentity(i => ({ ...i, address: e.target.value })); clearError('address') }} />
              {renderError('address')}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Courier Address (Current Address) *</label>
              <textarea rows={2} className={inputCls + errorRing('courier_address')} value={identity.courier_address} onChange={e => { setIdentity(i => ({ ...i, courier_address: e.target.value })); clearError('courier_address') }} />
              {renderError('courier_address')}
            </div>
            <div>
              <label className={labelCls}>State *</label>
              <input className={inputCls + errorRing('state')} value={identity.state} onChange={e => { setIdentity(i => ({ ...i, state: e.target.value })); clearError('state') }} />
              {renderError('state')}
            </div>
            <div>
              <label className={labelCls}>City *</label>
              <input className={inputCls + errorRing('city')} value={identity.city} onChange={e => { setIdentity(i => ({ ...i, city: e.target.value })); clearError('city') }} />
              {renderError('city')}
            </div>
            <div>
              <label className={labelCls}>Pincode *</label>
              <input className={inputCls + errorRing('pincode')} value={identity.pincode} onChange={e => { setIdentity(i => ({ ...i, pincode: e.target.value })); clearError('pincode') }} />
              {renderError('pincode')}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setActiveStage('basic')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={saveIdentity} disabled={saving || uploading} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Save & Next
            </button>
          </div>
        </div>
      )}

      {activeStage === 'bank' && (
        <div className={cardCls}>
          <h3 className="text-base font-semibold text-white mb-5">Step 4 — Bank Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Account Type</label>
              <select className={inputCls} value={bank.account_type} onChange={e => setBank(b => ({ ...b, account_type: e.target.value }))}>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
                <option value="nre">NRE</option>
                <option value="nro">NRO</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Account Number *</label>
              <input className={inputCls + errorRing('account_number')} value={bank.account_number} onChange={e => { setBank(b => ({ ...b, account_number: e.target.value })); clearError('account_number') }} />
              {renderError('account_number')}
            </div>
            <div>
              <label className={labelCls}>Account Holder Name *</label>
              <input className={inputCls + errorRing('account_holder_name')} value={bank.account_holder_name} onChange={e => { setBank(b => ({ ...b, account_holder_name: e.target.value })); clearError('account_holder_name') }} />
              {renderError('account_holder_name')}
            </div>
            <div>
              <label className={labelCls}>Bank Name *</label>
              <input className={inputCls + errorRing('bank_name')} value={bank.bank_name} onChange={e => { setBank(b => ({ ...b, bank_name: e.target.value })); clearError('bank_name') }} />
              {renderError('bank_name')}
            </div>
            {basic.resident_type === 'indian' ? (
              <div>
                <label className={labelCls}>IFSC Code *</label>
                <input className={inputCls + errorRing('ifsc_code')} value={bank.ifsc_code} onChange={e => { setBank(b => ({ ...b, ifsc_code: e.target.value.toUpperCase() })); clearError('ifsc_code') }} maxLength={11} />
                {renderError('ifsc_code')}
              </div>
            ) : (
              <div>
                <label className={labelCls}>SWIFT / IBAN Code *</label>
                <input className={inputCls + errorRing('swift_iban_code')} value={bank.swift_iban_code} onChange={e => { setBank(b => ({ ...b, swift_iban_code: e.target.value })); clearError('swift_iban_code') }} />
                {renderError('swift_iban_code')}
              </div>
            )}
            <div>
              <label className={labelCls}>Branch Name</label>
              <input className={inputCls} value={bank.branch_name} onChange={e => setBank(b => ({ ...b, branch_name: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              {renderFileUpload('Upload Bank Proof (Statement / Cheque / Passbook)', bankDocUrl, setBankDocUrl, 'bank_doc', 'bankDoc')}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setActiveStage('identity')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={saveBank} disabled={saving || uploading} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Save & Next
            </button>
          </div>
        </div>
      )}

      {activeStage === 'demat' && (
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Step 5 — Demat Details <span className="text-xs text-gray-500 font-normal ml-1">(optional)</span></h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Demat Account Number</label>
              <input className={inputCls + errorRing('demat_account_number')} value={demat.demat_account_number} onChange={e => { setDemat(d => ({ ...d, demat_account_number: e.target.value })); clearError('demat_account_number') }} />
              {renderError('demat_account_number')}
            </div>
            <div className="md:col-span-2">
              {renderFileUpload('Upload Demat Statement', dematDocUrl, setDematDocUrl, 'demat_doc', 'dematDoc')}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setActiveStage('bank')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="flex items-center gap-2">
              <button onClick={() => saveDemat(true)} disabled={saving} className={btnOutline}>Skip this step</button>
              <button onClick={() => saveDemat(false)} disabled={saving || uploading} className={btnPrimary}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Save & Next
              </button>
            </div>
          </div>
        </div>
      )}

      {activeStage === 'nominee' && (
        <div className={cardCls}>
          <h3 className="text-base font-semibold text-white mb-5">Step 6 — Nominee Details</h3>

          {nominees.length > 0 && (
            <div className="mb-5 rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/[0.03] text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">DOB</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Relationship</th>
                    <th className="px-3 py-2">%</th>
                    <th className="px-3 py-2">Proof</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {nominees.map(n => (
                    <tr key={n.id} className="border-t border-white/[0.04]">
                      <td className="px-3 py-2">{n.name}</td>
                      <td className="px-3 py-2">{n.dob || '—'}</td>
                      <td className="px-3 py-2">{n.phone || '—'}</td>
                      <td className="px-3 py-2">{n.relationship || '—'}</td>
                      <td className="px-3 py-2">{n.percentage}</td>
                      <td className="px-3 py-2">
                        {n.proof_url ? <a href={n.proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-red"><Eye className="w-3.5 h-3.5 inline" /></a> : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => handleEditNominee(n)} className="text-gray-400 hover:text-white mr-2"><Edit3 className="w-3.5 h-3.5 inline" /></button>
                        <button onClick={() => handleDeleteNominee(n)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-lg border border-white/10 p-4 bg-white/[0.02] mb-4">
            <div className="text-sm text-white mb-3 flex items-center gap-2">
              {editingNomineeId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingNomineeId ? 'Edit nominee' : 'Add nominee'}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name *</label>
                <input className={inputCls + errorRing('nominee_name')} value={nomineeForm.name} onChange={e => { setNomineeForm(f => ({ ...f, name: e.target.value })); clearError('nominee_name') }} />
                {renderError('nominee_name')}
              </div>
              <div>
                <label className={labelCls}>Date of Birth *</label>
                <input type="date" className={inputCls + errorRing('nominee_dob')} value={nomineeForm.dob} onChange={e => { setNomineeForm(f => ({ ...f, dob: e.target.value })); clearError('nominee_dob') }} />
                {renderError('nominee_dob')}
              </div>
              <div>
                <label className={labelCls}>Phone Number *</label>
                <input className={inputCls + errorRing('nominee_phone')} value={nomineeForm.phone} onChange={e => { setNomineeForm(f => ({ ...f, phone: e.target.value })); clearError('nominee_phone') }} placeholder="10-digit mobile" />
                {renderError('nominee_phone')}
              </div>
              <div>
                <label className={labelCls}>Relationship *</label>
                <select className={inputCls + errorRing('nominee_relationship')} value={nomineeForm.relationship} onChange={e => { setNomineeForm(f => ({ ...f, relationship: e.target.value })); clearError('nominee_relationship') }}>
                  <option value="">Select…</option>
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {renderError('nominee_relationship')}
              </div>
              <div>
                <label className={labelCls}>Percentage *</label>
                <input className={inputCls + errorRing('nominee_percentage')} value={nomineeForm.percentage} onChange={e => { setNomineeForm(f => ({ ...f, percentage: e.target.value })); clearError('nominee_percentage') }} placeholder="1-100" />
                {renderError('nominee_percentage')}
              </div>
              <div className="md:col-span-1">
                {renderFileUpload('Upload ID Proof (PAN / Aadhaar)', nomineeProofUrl, setNomineeProofUrl, 'nominee_proof', 'nomineeProof')}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              {editingNomineeId && (
                <button onClick={() => { setEditingNomineeId(null); setNomineeForm({ name: '', dob: '', phone: '', relationship: '', percentage: '' }); setNomineeProofUrl('') }} className={btnOutline}>
                  Cancel Edit
                </button>
              )}
              <button onClick={saveNominee} disabled={saving || uploading} className={btnPrimary}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingNomineeId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingNomineeId ? 'Update Nominee' : 'Add Nominee'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setActiveStage('demat')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={submitKYC} disabled={saving || nominees.length === 0} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Submit KYC & Finish
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
