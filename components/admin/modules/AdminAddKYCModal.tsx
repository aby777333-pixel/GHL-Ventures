/* ================================================================
   ADMIN ADD KYC MODAL — open from a client profile to complete KYC
   on behalf of an existing client who was created without KYC.

   Covers the 5-step flow (Basic → Identity → Bank → Demat → Nominee)
   using the same upsertKYC* services and storage bucket as the
   Sales & CRM › Create Account wizard. All writes rely on the
   admin_insert_* and admin_update_* RLS policies that already exist
   on kyc_basic_details / kyc_identity_details / kyc_bank_details /
   kyc_demat_details / nominees.

   The component does NOT render the modal chrome itself — it is
   rendered as the body of a parent AdminModal.
   ================================================================ */

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  User, Fingerprint, Landmark, CreditCard, Users, Upload, Eye,
  CheckCircle, Loader2, AlertCircle, Trash2, Plus, ChevronRight, ChevronLeft,
  Edit3,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  upsertKYCBasicDetails, upsertKYCIdentityDetails, upsertKYCBankDetails,
  upsertKYCDematDetails, addNominee, updateNominee, deleteNominee,
  submitKYCForReview,
} from '@/lib/supabase/dashboardDataService'
import { uploadFile } from '@/lib/supabase/storageService'

type StageId = 'basic' | 'identity' | 'bank' | 'demat' | 'nominee' | 'done'

const STAGES: { id: StageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'basic', label: 'Basic Details', icon: User },
  { id: 'identity', label: 'Identity Details', icon: Fingerprint },
  { id: 'bank', label: 'Bank Details', icon: Landmark },
  { id: 'demat', label: 'Demat Account', icon: CreditCard },
  { id: 'nominee', label: 'Nominee Details', icon: Users },
]

const RELATIONSHIPS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other']
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Singapore', 'UAE', 'Canada', 'Australia', 'Other']

const inputCls = 'w-full px-3 py-2.5 rounded-lg border text-sm bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20'
const labelCls = 'block text-xs font-medium mb-1.5 text-gray-400'
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-semibold transition-colors disabled:opacity-50'
const btnOutline = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 text-sm font-semibold transition-colors disabled:opacity-50'

function isValidDOB(dateStr: string): boolean {
  if (!dateStr) return false
  const parts = dateStr.split('-')
  if (parts.length !== 3) return false
  const year = parseInt(parts[0], 10)
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) return false
  return true
}

interface Props {
  clientId: string
  userId: string
  initialName?: string
  initialEmail?: string
  initialPhone?: string
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  onComplete?: () => void
}

export default function AdminAddKYCModal({ clientId, userId, initialName, initialEmail, initialPhone, showToast, onComplete }: Props) {
  const [activeStage, setActiveStage] = useState<StageId>('basic')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Stage 1: Basic ──────────────────────────────────────────
  const [basic, setBasic] = useState({
    investor_name: initialName || '', phone: initialPhone || '', email: initialEmail || '',
    gender: '', investor_type: 'individual', resident_type: 'indian',
  })

  // ── Stage 2: Identity ───────────────────────────────────────
  const [identity, setIdentity] = useState({
    pan_number: '', aadhar_number: '', passport_number: '', name_on_document: '',
    father_name: '', dob: '', address: '', courier_address: '',
    country: 'India', state: '', city: '', pincode: '',
  })
  const [aadharDocUrl, setAadharDocUrl] = useState('')
  const [panDocUrl, setPanDocUrl] = useState('')
  const [passportDocUrl, setPassportDocUrl] = useState('')

  // ── Stage 3: Bank ───────────────────────────────────────────
  const [bank, setBank] = useState({
    account_type: 'savings', account_number: '', swift_iban_code: '', ifsc_code: '',
    branch_name: '', account_holder_name: '', bank_name: '',
  })
  const [bankDocUrl, setBankDocUrl] = useState('')

  // ── Stage 4: Demat ──────────────────────────────────────────
  const [demat, setDemat] = useState({ demat_account_number: '', skipped: false })
  const [dematDocUrl, setDematDocUrl] = useState('')

  // ── Stage 5: Nominees ───────────────────────────────────────
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

  // ── Preload any partial KYC data the client already has. Lets the
  // admin resume a partial KYC instead of starting over.
  useEffect(() => {
    if (!clientId || !isSupabaseConfigured()) return
    ;(async () => {
      const sb = supabase as any
      const [b, i, bk, dm] = await Promise.all([
        sb.from('kyc_basic_details').select('*').eq('client_id', clientId).maybeSingle(),
        sb.from('kyc_identity_details').select('*').eq('client_id', clientId).maybeSingle(),
        sb.from('kyc_bank_details').select('*').eq('client_id', clientId).maybeSingle(),
        sb.from('kyc_demat_details').select('*').eq('client_id', clientId).maybeSingle(),
      ])
      const bd = b?.data; const id = i?.data; const bkd = bk?.data; const dmd = dm?.data
      if (bd) setBasic({
        investor_name: bd.investor_name || initialName || '',
        phone: bd.phone || initialPhone || '',
        email: bd.email || initialEmail || '',
        gender: bd.gender || '',
        investor_type: bd.investor_type || 'individual',
        resident_type: bd.resident_type || 'indian',
      })
      if (id) {
        setIdentity({
          pan_number: id.pan_number || '', aadhar_number: id.aadhar_number || '',
          passport_number: id.passport_number || '', name_on_document: id.name_on_document || '',
          father_name: id.father_name || '', dob: id.dob || '',
          address: id.address || '', courier_address: id.courier_address || '',
          country: id.country || 'India', state: id.state || '',
          city: id.city || '', pincode: id.pincode || '',
        })
        setAadharDocUrl(id.aadhar_doc_url || ''); setPanDocUrl(id.pan_doc_url || ''); setPassportDocUrl(id.passport_doc_url || '')
      }
      if (bkd) {
        setBank({
          account_type: bkd.account_type || 'savings', account_number: bkd.account_number || '',
          swift_iban_code: bkd.swift_iban_code || '', ifsc_code: bkd.ifsc_code || '',
          branch_name: bkd.branch_name || '', account_holder_name: bkd.account_holder_name || '',
          bank_name: bkd.bank_name || '',
        })
        setBankDocUrl(bkd.bank_doc_url || '')
      }
      if (dmd) {
        setDemat({ demat_account_number: dmd.demat_account_number || '', skipped: !!dmd.skipped })
        setDematDocUrl(dmd.demat_doc_url || '')
      }
    })()
  }, [clientId, initialName, initialEmail, initialPhone])

  const handleFileUpload = async (file: File, setter: (url: string) => void) => {
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

  useEffect(() => { fetchNominees() }, [fetchNominees])

  // ── Stage save handlers (duplicated from CreateAccountTab with the
  // same validation rules — intentionally kept in-line to keep the
  // account-creation wizard's logic untouched)
  const saveBasic = async () => {
    const errs: Record<string, string> = {}
    if (!basic.investor_name.trim()) errs.investor_name = 'Investor name is required'
    if (!basic.phone.trim()) errs.phone = 'Phone is required'
    if (!basic.email.trim()) errs.email = 'Email is required'
    if (!basic.investor_type) errs.investor_type = 'Select investor type'
    if (!basic.resident_type) errs.resident_type = 'Select resident type'
    if (Object.keys(errs).length > 0) {
      setErrors(errs); showToast(Object.values(errs)[0]!, 'warning'); return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCBasicDetails(clientId, userId, { ...basic, email_verified: true })
    setSaving(false)
    if (result) { showToast('Basic details saved', 'success'); setActiveStage('identity') }
    else showToast('Failed to save basic details', 'error')
  }

  const saveIdentity = async () => {
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
      setErrors(errs); showToast(Object.values(errs)[0]!, 'warning'); return
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

  const saveBank = async () => {
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
      setErrors(errs); showToast(Object.values(errs)[0]!, 'warning'); return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCBankDetails(clientId, userId, {
      ...bank, ifsc_code: bank.ifsc_code.toUpperCase(), bank_doc_url: bankDocUrl,
    })
    setSaving(false)
    if (result) { showToast('Bank details saved', 'success'); setActiveStage('demat') }
    else showToast('Failed to save bank details', 'error')
  }

  const saveDemat = async (skip: boolean) => {
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
      setErrors(errs); showToast(Object.values(errs)[0]!, 'warning'); return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCDematDetails(clientId, userId, { ...demat, demat_doc_url: dematDocUrl, skipped: false })
    setSaving(false)
    if (result) { showToast('Demat details saved', 'success'); setActiveStage('nominee') }
    else showToast('Failed to save demat details', 'error')
  }

  const saveNominee = async () => {
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
      setErrors(errs); showToast(Object.values(errs)[0]!, 'warning'); return
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
    if (nominees.length === 0) { showToast('Add at least one nominee first', 'warning'); return }
    const totalPct = nominees.reduce((s, n) => s + (Number(n.percentage) || 0), 0)
    if (Math.abs(totalPct - 100) > 0.01) { showToast(`Nominee percentages must total 100% (currently ${totalPct}%)`, 'warning'); return }
    setSaving(true)
    const ok = await submitKYCForReview(clientId)
    setSaving(false)
    if (ok) {
      showToast('KYC submitted for review', 'success')
      setActiveStage('done')
      onComplete?.()
    } else {
      showToast('Failed to submit KYC', 'error')
    }
  }

  const renderFileUpload = (label: string, currentUrl: string, setter: (url: string) => void, errorKey?: string, idSuffix?: string) => (
    <div>
      <label className={labelCls}>{label} *</label>
      <div className={`flex items-center gap-3 ${inputCls}${errorKey ? errorRing(errorKey) : ''} cursor-pointer`}>
        <input type="file" accept="image/*,.pdf" className="hidden" id={`kycf-${idSuffix || label.replace(/\W/g, '')}`}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFileUpload(f, setter); if (errorKey) clearError(errorKey) } }} />
        <label htmlFor={`kycf-${idSuffix || label.replace(/\W/g, '')}`} className="flex items-center gap-2 cursor-pointer flex-1">
          <Upload className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{uploading ? 'Uploading…' : currentUrl ? 'File uploaded — click to replace' : 'Choose File'}</span>
        </label>
        {currentUrl && <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-brand-red"><Eye className="w-4 h-4" /></a>}
      </div>
      {errorKey && renderError(errorKey)}
    </div>
  )

  const stageIndex = STAGES.findIndex(s => s.id === activeStage)

  if (activeStage === 'done') {
    return (
      <div className="py-10 text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-40" />
          <div className="relative w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">KYC submitted</h3>
        <p className="text-xs text-gray-400">The client&apos;s KYC is now under review. You can close this dialog.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STAGES.map((s, idx) => {
          const Icon = s.icon
          const isActive = s.id === activeStage
          const isDone = idx < stageIndex
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStage(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap
                ${isActive ? 'bg-brand-red/20 text-white border-brand-red/40' :
                  isDone ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                  'bg-white/[0.04] text-gray-300 border-white/[0.08] hover:bg-white/[0.08]'}`}
            >
              {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Stage panels */}
      {activeStage === 'basic' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Investor Name *</label>
              <input className={inputCls + errorRing('investor_name')} value={basic.investor_name} onChange={e => { setBasic(b => ({ ...b, investor_name: e.target.value })); clearError('investor_name') }} />
              {renderError('investor_name')}
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input className={inputCls + errorRing('phone')} value={basic.phone} onChange={e => { setBasic(b => ({ ...b, phone: e.target.value })); clearError('phone') }} />
              {renderError('phone')}
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" className={inputCls + errorRing('email')} value={basic.email} onChange={e => { setBasic(b => ({ ...b, email: e.target.value })); clearError('email') }} />
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
          <div className="flex justify-end">
            <button type="button" onClick={saveBasic} disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Save &amp; Next
            </button>
          </div>
        </div>
      )}

      {activeStage === 'identity' && (
        <div className="space-y-4">
          {basic.resident_type === 'indian' ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>PAN Number *</label>
                <input className={inputCls + errorRing('pan_number')} value={identity.pan_number} onChange={e => { setIdentity(i => ({ ...i, pan_number: e.target.value.toUpperCase() })); clearError('pan_number') }} maxLength={10} placeholder="ABCDE1234F" />
                {renderError('pan_number')}
              </div>
              <div>
                <label className={labelCls}>Aadhaar Number *</label>
                <input className={inputCls + errorRing('aadhar_number')} value={identity.aadhar_number} onChange={e => { setIdentity(i => ({ ...i, aadhar_number: e.target.value })); clearError('aadhar_number') }} maxLength={14} placeholder="12-digit Aadhaar" />
                {renderError('aadhar_number')}
              </div>
              {renderFileUpload('Upload PAN Card', panDocUrl, setPanDocUrl, 'pan_doc', 'panDoc')}
              {renderFileUpload('Upload Aadhaar Card', aadharDocUrl, setAadharDocUrl, 'aadhar_doc', 'aadharDoc')}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
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
              <label className={labelCls}>Father&apos;s Name *</label>
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
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActiveStage('basic')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <button type="button" onClick={saveIdentity} disabled={saving || uploading} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Save &amp; Next
            </button>
          </div>
        </div>
      )}

      {activeStage === 'bank' && (
        <div className="space-y-4">
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
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActiveStage('identity')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <button type="button" onClick={saveBank} disabled={saving || uploading} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Save &amp; Next
            </button>
          </div>
        </div>
      )}

      {activeStage === 'demat' && (
        <div className="space-y-4">
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
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActiveStage('bank')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => saveDemat(true)} disabled={saving} className={btnOutline}>Skip this step</button>
              <button type="button" onClick={() => saveDemat(false)} disabled={saving || uploading} className={btnPrimary}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Save &amp; Next
              </button>
            </div>
          </div>
        </div>
      )}

      {activeStage === 'nominee' && (
        <div className="space-y-4">
          {nominees.length > 0 && (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/[0.03] text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">DOB</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Rel.</th>
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
                      <td className="px-3 py-2">{n.proof_url ? <a href={n.proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-red"><Eye className="w-3.5 h-3.5 inline" /></a> : '—'}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => handleEditNominee(n)} className="text-gray-400 hover:text-white mr-2"><Edit3 className="w-3.5 h-3.5 inline" /></button>
                        <button type="button" onClick={() => handleDeleteNominee(n)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-lg border border-white/10 p-4 bg-white/[0.02]">
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
              <div>{renderFileUpload('Upload ID Proof (PAN / Aadhaar)', nomineeProofUrl, setNomineeProofUrl, 'nominee_proof', 'nomineeProof')}</div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              {editingNomineeId && (
                <button type="button" onClick={() => { setEditingNomineeId(null); setNomineeForm({ name: '', dob: '', phone: '', relationship: '', percentage: '' }); setNomineeProofUrl('') }} className={btnOutline}>
                  Cancel Edit
                </button>
              )}
              <button type="button" onClick={saveNominee} disabled={saving || uploading} className={btnPrimary}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingNomineeId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingNomineeId ? 'Update Nominee' : 'Add Nominee'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActiveStage('demat')} className={btnOutline}><ChevronLeft className="w-4 h-4" /> Back</button>
            <button type="button" onClick={submitKYC} disabled={saving || nominees.length === 0} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Submit KYC
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
