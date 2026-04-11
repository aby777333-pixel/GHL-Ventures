'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  User, Fingerprint, Landmark, CreditCard, Users, CheckCircle, Clock,
  AlertCircle, Upload, Eye, Trash2, Plus, ChevronRight, HelpCircle, X,
  FileText,
} from 'lucide-react'
import {
  useKYCBasicDetails, useKYCIdentityDetails, useKYCBankDetails,
  useKYCDematDetails, useNominees, useKYCOverallStatus,
} from '@/lib/supabase/dashboardDataHooks'
import {
  upsertKYCBasicDetails, upsertKYCIdentityDetails, upsertKYCBankDetails,
  upsertKYCDematDetails, addNominee, updateNominee, deleteNominee,
  submitKYCForReview,
} from '@/lib/supabase/dashboardDataService'
import { uploadFile } from '@/lib/supabase/storageService'

interface Props {
  clientId: string
  userId: string
  userName?: string
  userEmail?: string
  userPhone?: string
  theme: 'dark' | 'light'
  onToast: (msg: string, type: 'success' | 'info') => void
}

const STEPS = [
  { id: 'basic', label: 'Basic Details', icon: User },
  { id: 'identity', label: 'Identity Details', icon: Fingerprint },
  { id: 'bank', label: 'Bank Details', icon: Landmark },
  { id: 'demat', label: 'Demat Account', icon: CreditCard },
  { id: 'nominee', label: 'Nominee Details', icon: Users },
]

export default function KYCWizard({ clientId, userId, userName, userEmail, userPhone, theme, onToast }: Props) {
  const isDark = theme === 'dark'
  const [activeStep, setActiveStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Fetch existing KYC data
  const { data: basicData, refetch: refetchBasic } = useKYCBasicDetails(clientId)
  const { data: identityData, refetch: refetchIdentity } = useKYCIdentityDetails(clientId)
  const { data: bankData, refetch: refetchBank } = useKYCBankDetails(clientId)
  const { data: dematData, refetch: refetchDemat } = useKYCDematDetails(clientId)
  const { data: nomineesData, refetch: refetchNominees } = useNominees(clientId)
  const { data: overallStatus, refetch: refetchOverall } = useKYCOverallStatus(clientId)

  // Form states
  const [basic, setBasic] = useState({
    investor_name: '', phone: '', email: '', gender: '', investor_type: 'individual', resident_type: 'indian',
  })
  const [identity, setIdentity] = useState({
    pan_number: '', aadhar_number: '', passport_number: '', name_on_document: '', father_name: '',
    dob: '', address: '', courier_address: '', country: 'India', state: '', city: '', pincode: '',
  })
  const [bank, setBank] = useState({
    account_type: 'savings', account_number: '', swift_iban_code: '', ifsc_code: '', branch_name: '', account_holder_name: '', bank_name: '',
  })
  const [demat, setDemat] = useState({ demat_account_number: '', skipped: false })
  const [nomineeForm, setNomineeForm] = useState({ name: '', dob: '', phone: '', relationship: '', percentage: '' })
  const [showNomineeForm, setShowNomineeForm] = useState(false)
  const [editingNomineeId, setEditingNomineeId] = useState<string | null>(null)

  // File URLs stored after upload
  const [aadharDocUrl, setAadharDocUrl] = useState('')
  const [panDocUrl, setPanDocUrl] = useState('')
  const [passportDocUrl, setPassportDocUrl] = useState('')
  const [bankDocUrl, setBankDocUrl] = useState('')
  const [dematDocUrl, setDematDocUrl] = useState('')
  const [nomineeProofUrl, setNomineeProofUrl] = useState('')

  // Pre-fill from existing data
  useEffect(() => {
    if (basicData) {
      setBasic({ investor_name: basicData.investor_name || '', phone: basicData.phone || '', email: basicData.email || '', gender: basicData.gender || '', investor_type: basicData.investor_type || 'individual', resident_type: basicData.resident_type || 'indian' })
    } else {
      setBasic(b => ({ ...b, investor_name: userName || '', email: userEmail || '', phone: userPhone || '' }))
    }
  }, [basicData, userName, userEmail, userPhone])

  useEffect(() => {
    if (identityData) {
      setIdentity({ pan_number: identityData.pan_number || '', aadhar_number: identityData.aadhar_number || '', passport_number: identityData.passport_number || '', name_on_document: identityData.name_on_document || '', father_name: identityData.father_name || '', dob: identityData.dob || '', address: identityData.address || '', courier_address: identityData.courier_address || '', country: identityData.country || 'India', state: identityData.state || '', city: identityData.city || '', pincode: identityData.pincode || '' })
      setAadharDocUrl(identityData.aadhar_doc_url || '')
      setPanDocUrl(identityData.pan_doc_url || '')
      setPassportDocUrl(identityData.passport_doc_url || '')
    }
  }, [identityData])

  useEffect(() => {
    if (bankData) {
      setBank({ account_type: bankData.account_type || 'savings', account_number: bankData.account_number || '', swift_iban_code: bankData.swift_iban_code || '', ifsc_code: bankData.ifsc_code || '', branch_name: bankData.branch_name || '', account_holder_name: bankData.account_holder_name || '', bank_name: bankData.bank_name || '' })
      setBankDocUrl(bankData.bank_doc_url || '')
    }
  }, [bankData])

  useEffect(() => {
    if (dematData) {
      setDemat({ demat_account_number: dematData.demat_account_number || '', skipped: dematData.skipped || false })
      setDematDocUrl(dematData.demat_doc_url || '')
    }
  }, [dematData])

  // Start at the right step based on progress
  useEffect(() => {
    if (overallStatus && overallStatus.step > 0 && overallStatus.step < 5) {
      setActiveStep(overallStatus.step)
    }
  }, [overallStatus])

  // File upload helper
  const handleFileUpload = async (file: File, setter: (url: string) => void) => {
    setUploading(true)
    try {
      const result = await uploadFile(file, 'client/kyc', { entityType: 'client', entityId: clientId })
      if (result?.file?.url) { setter(result.file.url); onToast('File uploaded', 'success') }
      else onToast('Upload failed', 'info')
    } catch { onToast('Upload error', 'info') }
    setUploading(false)
  }

  // Step status helper
  const getStepStatus = (idx: number) => {
    if (!overallStatus) return 'pending'
    if (overallStatus.status === 'verified' || overallStatus.status === 'approved') return 'approved'
    if (idx < overallStatus.step) return 'submitted'
    if (idx === overallStatus.step) return 'current'
    return 'pending'
  }

  // Save handlers
  const saveBasic = async () => {
    if (!basic.investor_name || !basic.phone || !basic.email) { onToast('Please fill all required fields', 'info'); return }
    setSaving(true)
    const result = await upsertKYCBasicDetails(clientId, userId, basic)
    setSaving(false)
    if (result) { onToast('Basic details saved', 'success'); refetchBasic(); refetchOverall(); setActiveStep(1) }
    else onToast('Failed to save', 'info')
  }

  const saveIdentity = async () => {
    const isIndian = basic.resident_type === 'indian' || basicData?.resident_type === 'indian'
    if (isIndian) {
      if (!identity.pan_number) { onToast('PAN number is required for Indian residents', 'info'); return }
      // PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/
      if (!panRegex.test(identity.pan_number)) { onToast('Invalid PAN format. Expected: ABCDE1234F (5 letters, 4 digits, 1 letter)', 'info'); return }
      if (!identity.aadhar_number) { onToast('Aadhar number is required for Indian residents', 'info'); return }
      // Aadhar: 12 digits
      const aadharDigits = identity.aadhar_number.replace(/\s/g, '')
      if (!/^\d{12}$/.test(aadharDigits)) { onToast('Invalid Aadhar number. Must be exactly 12 digits.', 'info'); return }
      // Require document uploads for Indian residents
      if (!panDocUrl) { onToast('Please upload your PAN card document', 'info'); return }
      if (!aadharDocUrl) { onToast('Please upload your Aadhar card document', 'info'); return }
    } else {
      if (!identity.passport_number) { onToast('Passport number is required', 'info'); return }
      if (!passportDocUrl) { onToast('Please upload your Passport document', 'info'); return }
    }
    if (!identity.name_on_document || !identity.father_name || !identity.dob) { onToast('Please fill all required fields', 'info'); return }
    if (!isValidDOB(identity.dob)) { onToast('Please enter a valid date of birth (year must be 4 digits between 1900 and current year)', 'info'); return }
    if (!identity.address) { onToast('Address is required', 'info'); return }
    if (!identity.city || !identity.state || !identity.pincode) { onToast('City, State, and Pincode are required', 'info'); return }
    setSaving(true)
    const result = await upsertKYCIdentityDetails(clientId, userId, { ...identity, aadhar_doc_url: aadharDocUrl, pan_doc_url: panDocUrl, passport_doc_url: passportDocUrl })
    setSaving(false)
    if (result) { onToast('Identity details saved', 'success'); refetchIdentity(); refetchOverall(); setActiveStep(2) }
    else onToast('Failed to save', 'info')
  }

  // Helper: validate IFSC code via Razorpay API
  const verifyIFSC = async (ifsc: string): Promise<{ valid: boolean; bankName?: string; branchName?: string }> => {
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`)
      if (!res.ok) return { valid: false }
      const data = await res.json()
      return { valid: true, bankName: data.BANK || '', branchName: data.BRANCH || '' }
    } catch { return { valid: false } }
  }

  // Helper: validate date year is 4 digits and reasonable
  const isValidDOB = (dateStr: string): boolean => {
    if (!dateStr) return false
    const parts = dateStr.split('-')
    if (parts.length !== 3) return false
    const year = parseInt(parts[0], 10)
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) return false
    return true
  }

  // Helper: letters-only validation (allows spaces)
  const lettersOnly = (val: string) => val.replace(/[^a-zA-Z\s.]/g, '')

  const saveBank = async () => {
    if (!bank.account_number || !bank.account_holder_name || !bank.bank_name) { onToast('Please fill all required fields', 'info'); return }
    // Validate letters-only fields
    if (!/^[a-zA-Z\s.]+$/.test(bank.account_holder_name)) { onToast('Account holder name should contain only letters', 'info'); return }
    if (!/^[a-zA-Z\s.]+$/.test(bank.bank_name)) { onToast('Bank name should contain only letters', 'info'); return }
    if (bank.branch_name && !/^[a-zA-Z\s.,-]+$/.test(bank.branch_name)) { onToast('Branch name should contain only letters', 'info'); return }
    // IFSC / SWIFT validation based on resident type
    const isIndianBank = basic.resident_type === 'indian' || basicData?.resident_type === 'indian'
    if (isIndianBank) {
      if (!bank.ifsc_code || bank.ifsc_code.length !== 11) { onToast('IFSC code is required for Indian residents (11 characters)', 'info'); return }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
      if (!ifscRegex.test(bank.ifsc_code.toUpperCase())) { onToast('Invalid IFSC code format. Expected: 4 letters, 0, then 6 characters (e.g., SBIN0001234)', 'info'); return }
      // Verify IFSC code exists via Razorpay API
      onToast('Verifying IFSC code...', 'info')
      const ifscResult = await verifyIFSC(bank.ifsc_code.toUpperCase())
      if (!ifscResult.valid) { onToast('IFSC code not found. Please check and re-enter a valid IFSC code.', 'info'); return }
      // Auto-fill bank name and branch if API returned data
      if (ifscResult.bankName && !bank.bank_name) setBank(b => ({ ...b, bank_name: ifscResult.bankName! }))
      if (ifscResult.branchName && !bank.branch_name) setBank(b => ({ ...b, branch_name: ifscResult.branchName! }))
    } else {
      if (!bank.swift_iban_code) { onToast('SWIFT/IBAN code is required for NRI/Foreign residents', 'info'); return }
    }
    if (bank.account_number.length < 8) { onToast('Account number must be at least 8 digits', 'info'); return }
    // Require bank proof document
    if (!bankDocUrl) { onToast('Please upload bank proof (Bank Statement / Cancelled Cheque / Passbook)', 'info'); return }
    setSaving(true)
    const result = await upsertKYCBankDetails(clientId, userId, { ...bank, bank_doc_url: bankDocUrl })
    setSaving(false)
    if (result) { onToast('Bank details saved', 'success'); refetchBank(); refetchOverall(); setActiveStep(3) }
    else onToast('Failed to save', 'info')
  }

  const saveDemat = async () => {
    if (!demat.skipped && !demat.demat_account_number) { onToast('Enter demat number or skip', 'info'); return }
    // Require demat proof document when not skipped
    if (!demat.skipped && !dematDocUrl) { onToast('Please upload your Demat statement document', 'info'); return }
    setSaving(true)
    const result = await upsertKYCDematDetails(clientId, userId, { ...demat, demat_doc_url: dematDocUrl })
    setSaving(false)
    if (result) { onToast('Demat details saved', 'success'); refetchDemat(); refetchOverall(); setActiveStep(4) }
    else onToast('Failed to save', 'info')
  }

  const saveNominee = async () => {
    if (!nomineeForm.name || !nomineeForm.phone || !nomineeForm.relationship || !nomineeForm.percentage) { onToast('Fill all nominee fields', 'info'); return }
    if (!nomineeForm.dob) { onToast('Nominee date of birth is required', 'info'); return }
    if (!isValidDOB(nomineeForm.dob)) { onToast('Please enter a valid nominee date of birth (year must be 4 digits between 1900 and current year)', 'info'); return }
    // Validate nominee phone: must be 10 digits (Indian mobile)
    const phoneDigits = nomineeForm.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 10) { onToast('Nominee phone must be a valid 10-digit mobile number', 'info'); return }
    // Validate percentage range
    const pct = parseFloat(nomineeForm.percentage)
    if (isNaN(pct) || pct <= 0 || pct > 100) { onToast('Nominee percentage must be between 1 and 100', 'info'); return }
    // Require nominee proof document
    if (!nomineeProofUrl) { onToast('Please upload nominee ID proof (PAN/Aadhaar)', 'info'); return }
    setSaving(true)
    if (editingNomineeId) {
      await updateNominee(editingNomineeId, { ...nomineeForm, phone: phoneDigits, percentage: pct, proof_url: nomineeProofUrl })
    } else {
      await addNominee(clientId, userId, { ...nomineeForm, phone: phoneDigits, percentage: pct, proof_url: nomineeProofUrl })
    }
    setSaving(false)
    setNomineeForm({ name: '', dob: '', phone: '', relationship: '', percentage: '' })
    setNomineeProofUrl('')
    setShowNomineeForm(false)
    setEditingNomineeId(null)
    refetchNominees()
    onToast(editingNomineeId ? 'Nominee updated' : 'Nominee added', 'success')
  }

  const handleSubmitKYC = async () => {
    if (!nomineesData || nomineesData.length === 0) { onToast('Add at least one nominee', 'info'); return }
    const totalPct = nomineesData.reduce((sum: number, n: any) => sum + (Number(n.percentage) || 0), 0)
    if (Math.abs(totalPct - 100) > 0.01) { onToast(`Nominee percentages must total 100% (currently ${totalPct}%)`, 'info'); return }
    setSaving(true)
    const ok = await submitKYCForReview(clientId)
    setSaving(false)
    if (ok) { onToast('KYC submitted for review!', 'success'); refetchOverall() }
    else onToast('Submission failed', 'info')
  }

  const cardCls = `rounded-xl border p-6 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-gray-200'}`
  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400'}`
  const labelCls = `block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`
  const btnPrimary = 'px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50'
  const btnOutline = `px-6 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`

  // KYC already approved
  if (overallStatus?.status === 'verified' || overallStatus?.status === 'approved') {
    return (
      <div className={cardCls}>
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>KYC Approved</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Your KYC verification is complete. You can now invest.</p>
        </div>
      </div>
    )
  }

  // KYC submitted, waiting for review
  if (overallStatus?.status === 'submitted') {
    return (
      <div className={cardCls}>
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>KYC Under Review</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Your KYC has been submitted and is under review. We will notify you once approved.</p>
        </div>
      </div>
    )
  }

  const renderFileUpload = (label: string, currentUrl: string, setter: (url: string) => void) => (
    <div>
      <label className={labelCls}>{label} *</label>
      <div className={`flex items-center gap-3 ${inputCls} cursor-pointer`}>
        <input type="file" accept="image/*,.pdf" className="hidden" id={`file-${label}`}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, setter) }} />
        <label htmlFor={`file-${label}`} className="flex items-center gap-2 cursor-pointer flex-1">
          <Upload className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{currentUrl ? 'File uploaded' : 'Choose File'}</span>
        </label>
        {currentUrl && <a href={currentUrl} target="_blank" rel="noopener" className="text-red-500"><Eye className="w-4 h-4" /></a>}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Stepper */}
      <div className="lg:w-56 shrink-0">
        <div className={`${cardCls} lg:sticky lg:top-6`}>
          {STEPS.map((step, idx) => {
            const status = getStepStatus(idx)
            const isActive = idx === activeStep
            const Icon = step.icon
            return (
              <button key={step.id} onClick={() => setActiveStep(idx)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all mb-1 last:mb-0
                  ${isActive ? 'bg-red-600 text-white' : isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}
                  ${status === 'submitted' || status === 'approved' ? 'opacity-100' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                  ${isActive ? 'bg-white/20' : status === 'submitted' || status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {status === 'submitted' || status === 'approved' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium">{step.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 min-w-0">
        <div className={cardCls}>
          {/* Step 1: Basic Details */}
          {activeStep === 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Basic Information</h3>
                {basicData?.status && <span className={`px-3 py-1 rounded-full text-xs font-semibold ${basicData.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : basicData.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{basicData.status}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelCls}>Investor Name *</label><input className={inputCls} value={basic.investor_name} onChange={e => setBasic({ ...basic, investor_name: e.target.value })} /></div>
                <div><label className={labelCls}>Phone Number *</label><input className={inputCls} value={basic.phone} onChange={e => setBasic({ ...basic, phone: e.target.value })} placeholder="+919876543210" /></div>
                <div><label className={labelCls}>Email *</label><input className={inputCls} type="email" value={basic.email} onChange={e => setBasic({ ...basic, email: e.target.value })} /></div>
                <div><label className={labelCls}>Gender *</label>
                  <select className={inputCls} value={basic.gender} onChange={e => setBasic({ ...basic, gender: e.target.value })}>
                    <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
                <div><label className={labelCls}>Investor Type *</label>
                  <select className={inputCls} value={basic.investor_type} onChange={e => setBasic({ ...basic, investor_type: e.target.value })}>
                    <option value="individual">Individual</option><option value="huf">HUF</option><option value="corporate">Corporate</option><option value="partnership">Partnership</option><option value="trust">Trust</option>
                  </select>
                </div>
                <div><label className={labelCls}>Resident Type *</label>
                  <select className={inputCls} value={basic.resident_type} onChange={e => setBasic({ ...basic, resident_type: e.target.value })}>
                    <option value="indian">Indian Resident</option><option value="nri">NRI/Foreign</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6"><button className={btnPrimary} onClick={saveBasic} disabled={saving}>{saving ? 'Saving...' : 'Continue'}</button></div>
            </>
          )}

          {/* Step 2: Identity Details */}
          {activeStep === 1 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Identity Information</h3>
                {identityData?.status && <span className={`px-3 py-1 rounded-full text-xs font-semibold ${identityData.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : identityData.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{identityData.status}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(basic.resident_type === 'indian' || basicData?.resident_type === 'indian') ? (
                  <>
                    <div><label className={labelCls}>PAN Number *</label><input className={inputCls} value={identity.pan_number} onChange={e => setIdentity({ ...identity, pan_number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="ABCDE1234F" maxLength={10} />{identity.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(identity.pan_number) && <p className={`text-xs mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>PAN must be 10 chars: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)</p>}{identity.pan_number && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(identity.pan_number) && <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Valid PAN format</p>}</div>
                    <div><label className={labelCls}>Name *</label><input className={inputCls} value={identity.name_on_document} onChange={e => setIdentity({ ...identity, name_on_document: e.target.value })} /></div>
                    <div><label className={labelCls}>Aadhaar Number *</label><input className={inputCls} value={identity.aadhar_number} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setIdentity({ ...identity, aadhar_number: v.length <= 12 ? v.replace(/(\d{4})(?=\d)/g, '$1 ').trim() : identity.aadhar_number }) }} placeholder="1234 5678 9012" maxLength={14} />{identity.aadhar_number && identity.aadhar_number.replace(/\s/g, '').length !== 12 && <p className={`text-xs mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Aadhaar must be exactly 12 digits</p>}{identity.aadhar_number && identity.aadhar_number.replace(/\s/g, '').length === 12 && <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓ Valid Aadhaar format</p>}</div>
                  </>
                ) : (
                  <>
                    <div><label className={labelCls}>Passport Number *</label><input className={inputCls} value={identity.passport_number} onChange={e => setIdentity({ ...identity, passport_number: e.target.value })} /></div>
                    <div><label className={labelCls}>Name *</label><input className={inputCls} value={identity.name_on_document} onChange={e => setIdentity({ ...identity, name_on_document: e.target.value })} /></div>
                  </>
                )}
                <div><label className={labelCls}>Father Name *</label><input className={inputCls} value={identity.father_name} onChange={e => setIdentity({ ...identity, father_name: e.target.value })} /></div>
                <div><label className={labelCls}>DOB *</label><input className={inputCls} type="date" value={identity.dob} max={new Date().toISOString().split('T')[0]} min="1900-01-01" onChange={e => setIdentity({ ...identity, dob: e.target.value })} />{identity.dob && !isValidDOB(identity.dob) && <p className="text-xs text-amber-500 mt-1">Year must be 4 digits (1900-{new Date().getFullYear()})</p>}</div>
                <div className="md:col-span-2"><label className={labelCls}>Address *</label><textarea className={inputCls} rows={2} value={identity.address} onChange={e => setIdentity({ ...identity, address: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={labelCls}>Courier Address (Current Address) *</label><textarea className={inputCls} rows={2} value={identity.courier_address} onChange={e => setIdentity({ ...identity, courier_address: e.target.value })} /></div>
                <div><label className={labelCls}>Country *</label><input className={inputCls} value={identity.country} onChange={e => setIdentity({ ...identity, country: e.target.value })} /></div>
                <div><label className={labelCls}>State *</label><input className={inputCls} value={identity.state} onChange={e => setIdentity({ ...identity, state: e.target.value })} /></div>
                <div><label className={labelCls}>City *</label><input className={inputCls} value={identity.city} onChange={e => setIdentity({ ...identity, city: e.target.value })} /></div>
                <div><label className={labelCls}>Pincode *</label><input className={inputCls} value={identity.pincode} onChange={e => setIdentity({ ...identity, pincode: e.target.value })} /></div>
                {(basic.resident_type === 'indian' || basicData?.resident_type === 'indian') ? (
                  <>{renderFileUpload('Upload Aadhar', aadharDocUrl, setAadharDocUrl)}{renderFileUpload('Upload PAN', panDocUrl, setPanDocUrl)}</>
                ) : (
                  <>{renderFileUpload('Upload Passport', passportDocUrl, setPassportDocUrl)}</>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <button className={btnOutline} onClick={() => setActiveStep(0)}>Back</button>
                <button className={btnPrimary} onClick={saveIdentity} disabled={saving || uploading}>{saving ? 'Saving...' : 'Continue'}</button>
              </div>
            </>
          )}

          {/* Step 3: Bank Details */}
          {activeStep === 2 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bank Information</h3>
                {bankData?.status && <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bankData.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : bankData.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{bankData.status}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelCls}>Account Type *</label>
                  <select className={inputCls} value={bank.account_type} onChange={e => setBank({ ...bank, account_type: e.target.value })}>
                    <option value="savings">Savings</option><option value="current">Current</option><option value="nro">NRO</option><option value="nre">NRE</option>
                  </select>
                </div>
                <div><label className={labelCls}>Account Number *</label><input className={inputCls} value={bank.account_number} onChange={e => setBank({ ...bank, account_number: e.target.value.replace(/\D/g, '') })} placeholder="Enter account number" maxLength={18} /></div>
                <div><label className={labelCls}>IFSC Code {(basic.resident_type === 'indian' || basicData?.resident_type === 'indian') ? '*' : ''}</label><input className={inputCls} value={bank.ifsc_code} onChange={e => setBank({ ...bank, ifsc_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="e.g. SBIN0001234" maxLength={11} />{bank.ifsc_code && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc_code) && <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Valid IFSC format</p>}{bank.ifsc_code && bank.ifsc_code.length > 0 && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc_code) && <p className={`text-xs mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>IFSC: 4 letters + 0 + 6 chars (e.g. SBIN0001234)</p>}</div>
                <div><label className={labelCls}>SWIFT/IBAN Code {(basic.resident_type !== 'indian' && basicData?.resident_type !== 'indian') ? '*' : ''}</label><input className={inputCls} value={bank.swift_iban_code} onChange={e => setBank({ ...bank, swift_iban_code: e.target.value.toUpperCase() })} placeholder={(basic.resident_type === 'indian' || basicData?.resident_type === 'indian') ? 'Optional for Indian residents' : 'Required for NRI/Foreign'} /></div>
                <div><label className={labelCls}>Account Holder Name *</label><input className={inputCls} value={bank.account_holder_name} onChange={e => setBank({ ...bank, account_holder_name: lettersOnly(e.target.value) })} />{bank.account_holder_name && !/^[a-zA-Z\s.]+$/.test(bank.account_holder_name) && <p className="text-xs text-amber-500 mt-1">Only letters allowed</p>}</div>
                <div><label className={labelCls}>Bank Name *</label><input className={inputCls} value={bank.bank_name} onChange={e => setBank({ ...bank, bank_name: lettersOnly(e.target.value) })} />{bank.bank_name && !/^[a-zA-Z\s.]+$/.test(bank.bank_name) && <p className="text-xs text-amber-500 mt-1">Only letters allowed</p>}</div>
                <div><label className={labelCls}>Branch Name</label><input className={inputCls} value={bank.branch_name} onChange={e => setBank({ ...bank, branch_name: e.target.value.replace(/[^a-zA-Z\s.,-]/g, '') })} placeholder="Branch name (auto-filled from IFSC)" /></div>
                {renderFileUpload('Upload Document (Bank Statement/Cancelled Cheque/Passbook)', bankDocUrl, setBankDocUrl)}
              </div>
              <div className="flex justify-between mt-6">
                <button className={btnOutline} onClick={() => setActiveStep(1)}>Back</button>
                <button className={btnPrimary} onClick={saveBank} disabled={saving || uploading}>{saving ? 'Saving...' : 'Continue'}</button>
              </div>
            </>
          )}

          {/* Step 4: Demat Account */}
          {activeStep === 3 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Demat Information</h3>
                {dematData?.status && <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dematData.status === 'skipped' ? 'bg-gray-500/20 text-gray-400' : dematData.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{dematData.status}</span>}
              </div>
              <div className="grid grid-cols-1 gap-4">
                <label className={`flex items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <input type="checkbox" checked={demat.skipped} onChange={e => setDemat({ ...demat, skipped: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm">I don't have a Demat account (Skip this step)</span>
                </label>
                {!demat.skipped && (
                  <>
                    <div><label className={labelCls}>Demat Account Number *</label><input className={inputCls} value={demat.demat_account_number} onChange={e => setDemat({ ...demat, demat_account_number: e.target.value })} /></div>
                    {renderFileUpload('Upload Demat Statement', dematDocUrl, setDematDocUrl)}
                  </>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <button className={btnOutline} onClick={() => setActiveStep(2)}>Back</button>
                <button className={btnPrimary} onClick={saveDemat} disabled={saving || uploading}>{saving ? 'Saving...' : 'Continue'}</button>
              </div>
            </>
          )}

          {/* Step 5: Nominee Details */}
          {activeStep === 4 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nominee Details</h3>
                <button className={btnPrimary + ' !px-4 !py-2 text-xs'} onClick={() => { setShowNomineeForm(true); setEditingNomineeId(null); setNomineeForm({ name: '', dob: '', phone: '', relationship: '', percentage: '' }); setNomineeProofUrl('') }}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />Add Nominee
                </button>
              </div>

              {/* Nominees Table */}
              {nomineesData && nomineesData.length > 0 && (
                <div className="overflow-x-auto mb-6">
                  <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <thead><tr className={`text-xs uppercase ${isDark ? 'text-gray-500 border-white/10' : 'text-gray-500 border-gray-200'} border-b`}>
                      <th className="py-2 text-left">#</th><th className="py-2 text-left">Action</th><th className="py-2 text-left">Name</th><th className="py-2 text-left">DOB</th><th className="py-2 text-left">Phone</th><th className="py-2 text-left">Relationship</th><th className="py-2 text-left">Percentage</th><th className="py-2 text-left">Proof</th>
                    </tr></thead>
                    <tbody>
                      {nomineesData.map((n: any, idx: number) => (
                        <tr key={n.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className="py-2.5">{idx + 1}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingNomineeId(n.id); setNomineeForm({ name: n.name, dob: n.dob || '', phone: n.phone || '', relationship: n.relationship || '', percentage: String(n.percentage || '') }); setNomineeProofUrl(n.proof_url || ''); setShowNomineeForm(true) }} className="text-blue-400 hover:text-blue-300 p-1"><FileText className="w-3.5 h-3.5" /></button>
                              <button onClick={async () => { await deleteNominee(n.id); refetchNominees(); onToast('Nominee removed', 'success') }} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                          <td className="py-2.5">{n.name}</td>
                          <td className="py-2.5">{n.dob || '-'}</td>
                          <td className="py-2.5">{n.phone || '-'}</td>
                          <td className="py-2.5">{n.relationship || '-'}</td>
                          <td className="py-2.5">{n.percentage}%</td>
                          <td className="py-2.5">{n.proof_url ? <a href={n.proof_url} target="_blank" rel="noopener"><Eye className="w-4 h-4 text-red-500" /></a> : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add/Edit Nominee Form */}
              {showNomineeForm && (
                <div className={`${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'} border rounded-xl p-5 mb-6`}>
                  <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingNomineeId ? 'Edit Nominee' : 'Add Nominee'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelCls}>Nominee Name *</label><input className={inputCls} value={nomineeForm.name} onChange={e => setNomineeForm({ ...nomineeForm, name: e.target.value })} /></div>
                    <div><label className={labelCls}>Nominee DOB *</label><input className={inputCls} type="date" value={nomineeForm.dob} max={new Date().toISOString().split('T')[0]} min="1900-01-01" onChange={e => setNomineeForm({ ...nomineeForm, dob: e.target.value })} />{nomineeForm.dob && !isValidDOB(nomineeForm.dob) && <p className="text-xs text-amber-500 mt-1">Year must be 4 digits (1900-{new Date().getFullYear()})</p>}</div>
                    <div><label className={labelCls}>Nominee Phone *</label><input className={inputCls} value={nomineeForm.phone} onChange={e => setNomineeForm({ ...nomineeForm, phone: e.target.value })} placeholder="10-digit mobile number" maxLength={10} />
                      {nomineeForm.phone && nomineeForm.phone.replace(/\D/g, '').length !== 10 && <p className="text-xs text-red-500 mt-1">Must be a valid 10-digit mobile number</p>}
                    </div>
                    {renderFileUpload('Upload Nominee ID Proof (PAN/Aadhaar)', nomineeProofUrl, setNomineeProofUrl)}
                    <div><label className={labelCls}>Nominee Relationship *</label>
                      <select className={inputCls} value={nomineeForm.relationship} onChange={e => setNomineeForm({ ...nomineeForm, relationship: e.target.value })}>
                        <option value="">Select Relationship</option><option value="spouse">Spouse</option><option value="father">Father</option><option value="mother">Mother</option><option value="son">Son</option><option value="daughter">Daughter</option><option value="brother">Brother</option><option value="sister">Sister</option><option value="other">Other</option>
                      </select>
                    </div>
                    <div><label className={labelCls}>Percentage *</label>
                      <div className="relative"><input className={inputCls + ' pr-8'} type="number" min="0" max="100" value={nomineeForm.percentage} onChange={e => setNomineeForm({ ...nomineeForm, percentage: e.target.value })} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-5">
                    <button className={btnOutline} onClick={() => { setShowNomineeForm(false); setEditingNomineeId(null) }}>Back</button>
                    <button className={btnPrimary} onClick={saveNominee} disabled={saving || uploading}>{saving ? 'Saving...' : 'Submit'}</button>
                  </div>
                </div>
              )}

              {/* Submit KYC */}
              <div className="flex justify-between mt-4">
                <button className={btnOutline} onClick={() => setActiveStep(3)}>Back</button>
                <button className={btnPrimary} onClick={handleSubmitKYC} disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit KYC for Review'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
