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
  // Inline per-field validation errors. Keys are the field name ("investor_name",
  // "pan_number", …). When a key is present, the input renders with a red border
  // and a small red message below. Cleared as soon as the user edits that field.
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Helper: mark a required input as invalid via a red border/ring — appended
  // onto the existing input className so placeholder/value styling stays intact.
  const errorRing = (name: string) =>
    errors[name] ? ' !border-red-500 focus:!border-red-500 ring-1 ring-red-500/30' : ''

  // Helper: render an inline error message below a field.
  const renderError = (name: string) =>
    errors[name] ? (
      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {errors[name]}
      </p>
    ) : null

  // Helper: clear a field-level error as the user edits. Used inside onChange
  // so the red highlight disappears on the first keystroke / selection.
  const clearError = (name: string) => {
    if (errors[name]) setErrors(e => { const n = { ...e }; delete n[name]; return n })
  }

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

  // Scroll to the first field that has an error and focus it for accessibility.
  const focusFirstError = (errs: Record<string, string>) => {
    const first = Object.keys(errs)[0]
    if (!first || typeof document === 'undefined') return
    // Defer so React has flushed the red-border class before we scroll.
    setTimeout(() => {
      const el = document.querySelector(`[data-field="${first}"]`) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = el.querySelector('input, select, textarea') as HTMLElement | null
        input?.focus()
      }
    }, 40)
  }

  // Save handlers
  const saveBasic = async () => {
    const errs: Record<string, string> = {}
    if (!basic.investor_name.trim()) errs.investor_name = 'Investor name is required'
    if (!basic.phone.trim()) errs.phone = 'Phone number is required'
    if (!basic.email.trim()) errs.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(basic.email.trim())) errs.email = 'Please enter a valid email address'
    if (!basic.gender) errs.gender = 'Please select a gender'
    if (!basic.investor_type) errs.investor_type = 'Please select an investor type'
    if (!basic.resident_type) errs.resident_type = 'Please select a resident type'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      onToast('⚠ Please fill all the highlighted fields', 'info')
      focusFirstError(errs)
      return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCBasicDetails(clientId, userId, basic)
    setSaving(false)
    if (result) { onToast('Basic details saved', 'success'); refetchBasic(); refetchOverall(); setActiveStep(1) }
    else onToast('Failed to save', 'info')
  }

  const saveIdentity = async () => {
    const errs: Record<string, string> = {}
    const isIndian = basic.resident_type === 'indian' || basicData?.resident_type === 'indian'
    if (isIndian) {
      if (!identity.pan_number) errs.pan_number = 'PAN number is required'
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(identity.pan_number)) errs.pan_number = 'Invalid PAN format (expected ABCDE1234F)'
      if (!identity.aadhar_number) errs.aadhar_number = 'Aadhaar number is required'
      else if (!/^\d{12}$/.test(identity.aadhar_number.replace(/\s/g, ''))) errs.aadhar_number = 'Aadhaar must be exactly 12 digits'
      if (!panDocUrl) errs.pan_doc = 'Please upload your PAN card document'
      if (!aadharDocUrl) errs.aadhar_doc = 'Please upload your Aadhaar card document'
    } else {
      if (!identity.passport_number) errs.passport_number = 'Passport number is required'
      if (!passportDocUrl) errs.passport_doc = 'Please upload your passport document'
    }
    if (!identity.name_on_document) errs.name_on_document = 'Name on document is required'
    if (!identity.father_name) errs.father_name = 'Father name is required'
    if (!identity.dob) errs.dob = 'Date of birth is required'
    else if (!isValidDOB(identity.dob)) errs.dob = `Year must be 4 digits (1900-${new Date().getFullYear()})`
    if (!identity.address) errs.address = 'Address is required'
    if (!identity.courier_address) errs.courier_address = 'Courier (current) address is required'
    if (!identity.country) errs.country = 'Country is required'
    if (!identity.state) errs.state = 'State is required'
    if (!identity.city) errs.city = 'City is required'
    if (!identity.pincode) errs.pincode = 'Pincode is required'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      onToast('⚠ Please fill all the highlighted fields', 'info')
      focusFirstError(errs)
      return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCIdentityDetails(clientId, userId, { ...identity, aadhar_doc_url: aadharDocUrl, pan_doc_url: panDocUrl, passport_doc_url: passportDocUrl })
    setSaving(false)
    if (result) { onToast('Identity details saved', 'success'); refetchIdentity(); refetchOverall(); setActiveStep(2) }
    else onToast('Failed to save', 'info')
  }

  // Helper: validate IFSC code via Razorpay API.
  // Bug #4: If the public API is unreachable (CORS/rate-limit/offline), don't
  // block the user — fall back to format-only validation already enforced above.
  // `reachable=false` means we couldn't confirm either way; treat as valid.
  const verifyIFSC = async (ifsc: string): Promise<{ valid: boolean; reachable: boolean; bankName?: string; branchName?: string }> => {
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`)
      if (res.status === 404) return { valid: false, reachable: true }
      if (!res.ok) return { valid: true, reachable: false }
      const data = await res.json()
      return { valid: true, reachable: true, bankName: data.BANK || '', branchName: data.BRANCH || '' }
    } catch { return { valid: true, reachable: false } }
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
    const errs: Record<string, string> = {}
    const isIndianBank = basic.resident_type === 'indian' || basicData?.resident_type === 'indian'

    if (!bank.account_number) errs.account_number = 'Account number is required'
    else if (bank.account_number.length < 8) errs.account_number = 'Account number must be at least 8 digits'
    if (!bank.account_holder_name) errs.account_holder_name = 'Account holder name is required'
    else if (!/^[a-zA-Z\s.]+$/.test(bank.account_holder_name)) errs.account_holder_name = 'Account holder name should contain only letters'
    if (!bank.bank_name) errs.bank_name = 'Bank name is required'
    else if (!/^[a-zA-Z\s.]+$/.test(bank.bank_name)) errs.bank_name = 'Bank name should contain only letters'
    if (bank.branch_name && !/^[a-zA-Z\s.,-]+$/.test(bank.branch_name)) errs.branch_name = 'Branch name should contain only letters'

    if (isIndianBank) {
      if (!bank.ifsc_code) errs.ifsc_code = 'IFSC code is required for Indian residents'
      else {
        const ifscClean = bank.ifsc_code.toUpperCase().replace(/\s/g, '')
        if (ifscClean.length !== 11) errs.ifsc_code = 'IFSC code must be exactly 11 characters'
        else if (!/^[A-Z]{4}[A-Z0-9]{7}$/.test(ifscClean)) errs.ifsc_code = 'Invalid IFSC format (4 letters + 7 alphanumeric)'
      }
    } else {
      if (!bank.swift_iban_code) errs.swift_iban_code = 'SWIFT/IBAN code is required for NRI/Foreign residents'
    }

    if (!bankDocUrl) errs.bank_doc = 'Please upload bank proof (statement / cheque / passbook)'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      onToast('⚠ Please fill all the highlighted fields', 'info')
      focusFirstError(errs)
      return
    }
    setErrors({})

    // IFSC is format-valid; verify against RBI database (lenient fallback).
    let bankToSave = bank
    if (isIndianBank) {
      const ifscClean = bank.ifsc_code.toUpperCase().replace(/\s/g, '')
      setSaving(true)
      onToast('Verifying IFSC code...', 'info')
      const ifscResult = await verifyIFSC(ifscClean)
      if (ifscResult.reachable && !ifscResult.valid) {
        setSaving(false)
        setErrors({ ifsc_code: 'IFSC code not found in RBI database. Please check and re-enter.' })
        onToast('⚠ Invalid IFSC code', 'info')
        focusFirstError({ ifsc_code: 'x' })
        return
      }
      const updatedBank = { ...bank, ifsc_code: ifscClean }
      if (ifscResult.bankName) updatedBank.bank_name = lettersOnly(ifscResult.bankName!)
      if (ifscResult.branchName) updatedBank.branch_name = ifscResult.branchName!.replace(/[^a-zA-Z\s.,-]/g, '')
      setBank(updatedBank)
      bankToSave = updatedBank
      setSaving(false)
    }

    setSaving(true)
    const result = await upsertKYCBankDetails(clientId, userId, { ...bankToSave, bank_doc_url: bankDocUrl })
    setSaving(false)
    if (result) { onToast('Bank details saved', 'success'); refetchBank(); refetchOverall(); setActiveStep(3) }
    else onToast('Failed to save', 'info')
  }

  const saveDemat = async () => {
    if (demat.skipped) {
      setErrors({})
      setSaving(true)
      const result = await upsertKYCDematDetails(clientId, userId, { ...demat, demat_doc_url: dematDocUrl })
      setSaving(false)
      if (result) { onToast('Demat step skipped', 'success'); refetchDemat(); refetchOverall(); setActiveStep(4) }
      else onToast('Failed to save', 'info')
      return
    }
    const errs: Record<string, string> = {}
    if (!demat.demat_account_number) errs.demat_account_number = 'Demat account number is required (or tick "skip")'
    if (!dematDocUrl) errs.demat_doc = 'Please upload your Demat statement'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      onToast('⚠ Please fill all the highlighted fields', 'info')
      focusFirstError(errs)
      return
    }
    setErrors({})
    setSaving(true)
    const result = await upsertKYCDematDetails(clientId, userId, { ...demat, demat_doc_url: dematDocUrl })
    setSaving(false)
    if (result) { onToast('Demat details saved', 'success'); refetchDemat(); refetchOverall(); setActiveStep(4) }
    else onToast('Failed to save', 'info')
  }

  const saveNominee = async () => {
    const errs: Record<string, string> = {}
    if (!nomineeForm.name) errs.nominee_name = 'Nominee name is required'
    if (!nomineeForm.dob) errs.nominee_dob = 'Date of birth is required'
    else if (!isValidDOB(nomineeForm.dob)) errs.nominee_dob = `Year must be 4 digits (1900-${new Date().getFullYear()})`
    const phoneDigits = nomineeForm.phone.replace(/\D/g, '')
    if (!nomineeForm.phone) errs.nominee_phone = 'Phone number is required'
    else if (phoneDigits.length !== 10) errs.nominee_phone = 'Phone must be a valid 10-digit mobile number'
    if (!nomineeForm.relationship) errs.nominee_relationship = 'Please select a relationship'
    const pct = parseFloat(nomineeForm.percentage)
    if (!nomineeForm.percentage) errs.nominee_percentage = 'Percentage is required'
    else if (isNaN(pct) || pct <= 0 || pct > 100) errs.nominee_percentage = 'Percentage must be between 1 and 100'
    if (!nomineeProofUrl) errs.nominee_proof = 'Please upload nominee ID proof (PAN/Aadhaar)'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      onToast('⚠ Please fill all the highlighted fields', 'info')
      focusFirstError(errs)
      return
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
    setShowNomineeForm(false)
    setEditingNomineeId(null)
    refetchNominees()
    onToast(editingNomineeId ? 'Nominee updated' : 'Nominee added', 'success')
  }

  const handleSubmitKYC = async () => {
    // Bug #6/7: Gate submission on ALL prior steps having data saved AND the
    // bank + identity fields actually being populated. Previously a user
    // could click through the stepper without filling bank/demat/identity.
    if (!basicData?.investor_name || !basicData?.phone || !basicData?.email) {
      onToast('Please complete Basic Details before submitting', 'info'); setActiveStep(0); return
    }
    const isIndian = (basicData?.resident_type || 'indian') === 'indian'
    if (!identityData) { onToast('Please complete Identity Details before submitting', 'info'); setActiveStep(1); return }
    if (isIndian) {
      if (!identityData.pan_number || !identityData.aadhar_number || !identityData.pan_doc_url || !identityData.aadhar_doc_url) {
        onToast('PAN, Aadhaar, and their documents are required before submitting', 'info'); setActiveStep(1); return
      }
    } else {
      if (!identityData.passport_number || !identityData.passport_doc_url) {
        onToast('Passport number and document are required before submitting', 'info'); setActiveStep(1); return
      }
    }
    if (!bankData) { onToast('Please complete Bank Details before submitting', 'info'); setActiveStep(2); return }
    if (!bankData.account_number || !bankData.account_holder_name || !bankData.bank_name || !bankData.bank_doc_url) {
      onToast('Account number, holder name, bank name and bank proof are required before submitting', 'info'); setActiveStep(2); return
    }
    if (isIndian && !bankData.ifsc_code) {
      onToast('IFSC code is required for Indian residents', 'info'); setActiveStep(2); return
    } else if (!isIndian && !bankData.swift_iban_code) {
      onToast('SWIFT/IBAN code is required for NRI/Foreign residents', 'info'); setActiveStep(2); return
    }
    if (!dematData) { onToast('Please complete Demat step (or mark as skipped) before submitting', 'info'); setActiveStep(3); return }
    if (!dematData.skipped && (!dematData.demat_account_number || !dematData.demat_doc_url)) {
      onToast('Demat account number and document are required (or mark as skipped)', 'info'); setActiveStep(3); return
    }
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

  // KYC already approved — read-mode summary per Investor Dashboard
  // Corrections (2026-05): show all KYC topics (Bank Details, Proofs,
  // Nominee Details) along with verification status and approval date.
  if (overallStatus?.status === 'verified' || overallStatus?.status === 'approved') {
    const approvedAt = (overallStatus as any)?.updated_at || (basicData as any)?.updated_at
    const approvalDate = approvedAt ? new Date(approvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    const primaryNominee = (nomineesData && nomineesData[0]) as any | undefined
    const proofs: { label: string; verified: boolean; url?: string; back?: string }[] = [
      { label: 'PAN Card', verified: !!(identityData as any)?.pan_doc_url, url: (identityData as any)?.pan_doc_url },
      { label: 'Aadhar Card', verified: !!(identityData as any)?.aadhar_doc_url, url: (identityData as any)?.aadhar_doc_url, back: (identityData as any)?.aadhar_back_url },
      { label: 'Bank Proof', verified: !!(bankData as any)?.bank_doc_url, url: (bankData as any)?.bank_doc_url },
      { label: 'Nominee ID Proof', verified: !!primaryNominee?.proof_url, url: primaryNominee?.proof_url },
    ]
    const subCardCls = isDark
      ? 'rounded-xl border border-white/[0.06] bg-white/[0.03]'
      : 'rounded-xl border border-gray-200 bg-white'
    const subTabCls = (active: boolean) => active
      ? 'bg-neutral-900 text-white border-neutral-800'
      : isDark ? 'bg-white/[0.04] text-gray-400 border-white/[0.06] hover:text-white' : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900'
    return (
      <div className="space-y-5">
        {/* Header / status summary */}
        <div className={`${subCardCls} px-5 py-5 text-center`}>
          <p className={`text-[11px] uppercase tracking-wider font-semibold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            KYC Status: <span className="text-emerald-500 font-bold">Approved</span>
          </p>
          <h2 className={`text-xl font-bold mb-1 flex items-center justify-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <CheckCircle className="w-5 h-5 text-emerald-500" /> KYC Verification Complete
          </h2>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Your documents have been verified and KYC is approved.
          </p>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Approval Date: <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{approvalDate}</span>
          </p>
        </div>

        {/* Read-only sub-tabs: Bank Details · Proofs · Nominee Details */}
        <KycReadModeTabs
          isDark={isDark}
          subCardCls={subCardCls}
          subTabCls={subTabCls}
          basicData={basicData}
          identityData={identityData}
          bankData={bankData}
          dematData={dematData}
          primaryNominee={primaryNominee}
          proofs={proofs}
        />
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

  const renderFileUpload = (label: string, currentUrl: string, setter: (url: string) => void, errorKey?: string) => (
    <div data-field={errorKey}>
      <label className={labelCls}>{label} *</label>
      <div className={`flex items-center gap-3 ${inputCls}${errorKey ? errorRing(errorKey) : ''} cursor-pointer`}>
        <input type="file" accept="image/*,.pdf" className="hidden" id={`file-${label}`}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFileUpload(f, setter); if (errorKey) clearError(errorKey) } }} />
        <label htmlFor={`file-${label}`} className="flex items-center gap-2 cursor-pointer flex-1">
          <Upload className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{currentUrl ? 'File uploaded' : 'Choose File'}</span>
        </label>
        {currentUrl && <a href={currentUrl} target="_blank" rel="noopener" className="text-red-500"><Eye className="w-4 h-4" /></a>}
      </div>
      {errorKey && renderError(errorKey)}
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Stepper — flush-left alignment so step labels sit at the card
          edge instead of floating inside heavy padding. */}
      <div className="lg:w-56 shrink-0">
        <div className={`rounded-xl border p-2 lg:sticky lg:top-6 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
          {STEPS.map((step, idx) => {
            const status = getStepStatus(idx)
            const isActive = idx === activeStep
            const Icon = step.icon
            return (
              <button key={step.id} onClick={() => { setActiveStep(idx); setErrors({}) }}
                className={`w-full flex items-center justify-start gap-2.5 px-2 py-2 rounded-lg text-left transition-all mb-1 last:mb-0
                  ${isActive ? 'bg-red-600 text-white' : isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}
                  ${status === 'submitted' || status === 'approved' ? 'opacity-100' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
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
                <div data-field="investor_name"><label className={labelCls}>Investor Name *</label><input className={inputCls + errorRing('investor_name')} value={basic.investor_name} onChange={e => { setBasic({ ...basic, investor_name: e.target.value }); clearError('investor_name') }} />{renderError('investor_name')}</div>
                <div data-field="phone"><label className={labelCls}>Phone Number *</label><input className={inputCls + errorRing('phone')} value={basic.phone} onChange={e => { setBasic({ ...basic, phone: e.target.value }); clearError('phone') }} placeholder="+919876543210" />{renderError('phone')}</div>
                <div data-field="email"><label className={labelCls}>Email *</label><input className={inputCls + errorRing('email')} type="email" value={basic.email} onChange={e => { setBasic({ ...basic, email: e.target.value }); clearError('email') }} />{renderError('email')}</div>
                <div data-field="gender"><label className={labelCls}>Gender *</label>
                  <select className={inputCls + errorRing('gender')} value={basic.gender} onChange={e => { setBasic({ ...basic, gender: e.target.value }); clearError('gender') }}>
                    <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                  {renderError('gender')}
                </div>
                <div data-field="investor_type"><label className={labelCls}>Investor Type *</label>
                  <select className={inputCls + errorRing('investor_type')} value={basic.investor_type} onChange={e => { setBasic({ ...basic, investor_type: e.target.value }); clearError('investor_type') }}>
                    <option value="individual">Individual</option><option value="huf">HUF</option><option value="corporate">Corporate</option><option value="partnership">Partnership</option><option value="trust">Trust</option>
                  </select>
                  {renderError('investor_type')}
                </div>
                <div data-field="resident_type"><label className={labelCls}>Resident Type *</label>
                  <select className={inputCls + errorRing('resident_type')} value={basic.resident_type} onChange={e => { setBasic({ ...basic, resident_type: e.target.value }); clearError('resident_type') }}>
                    <option value="indian">Indian Resident</option><option value="nri">NRI/Foreign</option>
                  </select>
                  {renderError('resident_type')}
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
                    <div data-field="pan_number"><label className={labelCls}>PAN Number *</label><input className={inputCls + errorRing('pan_number')} value={identity.pan_number} onChange={e => { setIdentity({ ...identity, pan_number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }); clearError('pan_number') }} placeholder="ABCDE1234F" maxLength={10} />{renderError('pan_number')}{!errors.pan_number && identity.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(identity.pan_number) && <p className={`text-xs mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>PAN must be 10 chars: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)</p>}{!errors.pan_number && identity.pan_number && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(identity.pan_number) && <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Valid PAN format</p>}</div>
                    <div data-field="name_on_document"><label className={labelCls}>Name *</label><input className={inputCls + errorRing('name_on_document')} value={identity.name_on_document} onChange={e => { setIdentity({ ...identity, name_on_document: e.target.value }); clearError('name_on_document') }} />{renderError('name_on_document')}</div>
                    <div data-field="aadhar_number"><label className={labelCls}>Aadhaar Number *</label><input className={inputCls + errorRing('aadhar_number')} value={identity.aadhar_number} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setIdentity({ ...identity, aadhar_number: v.length <= 12 ? v.replace(/(\d{4})(?=\d)/g, '$1 ').trim() : identity.aadhar_number }); clearError('aadhar_number') }} placeholder="1234 5678 9012" maxLength={14} />{renderError('aadhar_number')}{!errors.aadhar_number && identity.aadhar_number && identity.aadhar_number.replace(/\s/g, '').length !== 12 && <p className={`text-xs mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Aadhaar must be exactly 12 digits</p>}{!errors.aadhar_number && identity.aadhar_number && identity.aadhar_number.replace(/\s/g, '').length === 12 && <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓ Valid Aadhaar format</p>}</div>
                  </>
                ) : (
                  <>
                    <div data-field="passport_number"><label className={labelCls}>Passport Number *</label><input className={inputCls + errorRing('passport_number')} value={identity.passport_number} onChange={e => { setIdentity({ ...identity, passport_number: e.target.value }); clearError('passport_number') }} />{renderError('passport_number')}</div>
                    <div data-field="name_on_document"><label className={labelCls}>Name *</label><input className={inputCls + errorRing('name_on_document')} value={identity.name_on_document} onChange={e => { setIdentity({ ...identity, name_on_document: e.target.value }); clearError('name_on_document') }} />{renderError('name_on_document')}</div>
                  </>
                )}
                <div data-field="father_name"><label className={labelCls}>Father Name *</label><input className={inputCls + errorRing('father_name')} value={identity.father_name} onChange={e => { setIdentity({ ...identity, father_name: e.target.value }); clearError('father_name') }} />{renderError('father_name')}</div>
                <div data-field="dob"><label className={labelCls}>DOB *</label><input className={inputCls + errorRing('dob')} type="date" value={identity.dob} max={new Date().toISOString().split('T')[0]} min="1900-01-01" onChange={e => { setIdentity({ ...identity, dob: e.target.value }); clearError('dob') }} />{renderError('dob')}{!errors.dob && identity.dob && !isValidDOB(identity.dob) && <p className="text-xs text-amber-500 mt-1">Year must be 4 digits (1900-{new Date().getFullYear()})</p>}</div>
                <div className="md:col-span-2" data-field="address"><label className={labelCls}>Address *</label><textarea className={inputCls + errorRing('address')} rows={2} value={identity.address} onChange={e => { setIdentity({ ...identity, address: e.target.value }); clearError('address') }} />{renderError('address')}</div>
                <div className="md:col-span-2" data-field="courier_address"><label className={labelCls}>Courier Address (Current Address) *</label><textarea className={inputCls + errorRing('courier_address')} rows={2} value={identity.courier_address} onChange={e => { setIdentity({ ...identity, courier_address: e.target.value }); clearError('courier_address') }} />{renderError('courier_address')}</div>
                <div data-field="country"><label className={labelCls}>Country *</label><input className={inputCls + errorRing('country')} value={identity.country} onChange={e => { setIdentity({ ...identity, country: e.target.value }); clearError('country') }} />{renderError('country')}</div>
                <div data-field="state"><label className={labelCls}>State *</label><input className={inputCls + errorRing('state')} value={identity.state} onChange={e => { setIdentity({ ...identity, state: e.target.value }); clearError('state') }} />{renderError('state')}</div>
                <div data-field="city"><label className={labelCls}>City *</label><input className={inputCls + errorRing('city')} value={identity.city} onChange={e => { setIdentity({ ...identity, city: e.target.value }); clearError('city') }} />{renderError('city')}</div>
                <div data-field="pincode"><label className={labelCls}>Pincode *</label><input className={inputCls + errorRing('pincode')} value={identity.pincode} onChange={e => { setIdentity({ ...identity, pincode: e.target.value }); clearError('pincode') }} />{renderError('pincode')}</div>
                {(basic.resident_type === 'indian' || basicData?.resident_type === 'indian') ? (
                  <>{renderFileUpload('Upload Aadhar', aadharDocUrl, setAadharDocUrl, 'aadhar_doc')}{renderFileUpload('Upload PAN', panDocUrl, setPanDocUrl, 'pan_doc')}</>
                ) : (
                  <>{renderFileUpload('Upload Passport', passportDocUrl, setPassportDocUrl, 'passport_doc')}</>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <button className={btnOutline} onClick={() => { setActiveStep(0); setErrors({}) }}>Back</button>
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
                <div data-field="account_type"><label className={labelCls}>Account Type *</label>
                  <select className={inputCls} value={bank.account_type} onChange={e => setBank({ ...bank, account_type: e.target.value })}>
                    <option value="savings">Savings</option><option value="current">Current</option><option value="nro">NRO</option><option value="nre">NRE</option>
                  </select>
                </div>
                <div data-field="account_number"><label className={labelCls}>Account Number *</label><input className={inputCls + errorRing('account_number')} value={bank.account_number} onChange={e => { setBank({ ...bank, account_number: e.target.value.replace(/\D/g, '') }); clearError('account_number') }} placeholder="Enter account number" maxLength={18} />{renderError('account_number')}</div>
                <div data-field="ifsc_code"><label className={labelCls}>IFSC Code {(basic.resident_type === 'indian' || basicData?.resident_type === 'indian') ? '*' : ''}</label><input className={inputCls + errorRing('ifsc_code')} value={bank.ifsc_code} onChange={e => { setBank({ ...bank, ifsc_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }); clearError('ifsc_code') }} placeholder="e.g. SBIN0001234" maxLength={11} />{renderError('ifsc_code')}{!errors.ifsc_code && bank.ifsc_code && bank.ifsc_code.length === 11 && /^[A-Z]{4}[A-Z0-9]{7}$/.test(bank.ifsc_code) && <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓ Valid IFSC format (will be verified on save)</p>}{!errors.ifsc_code && bank.ifsc_code && bank.ifsc_code.length > 0 && (bank.ifsc_code.length !== 11 || !/^[A-Z]{4}[A-Z0-9]{7}$/.test(bank.ifsc_code)) && <p className={`text-xs mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>IFSC must be 11 characters: 4 letters + 7 alphanumeric</p>}</div>
                <div data-field="swift_iban_code"><label className={labelCls}>SWIFT/IBAN Code {(basic.resident_type !== 'indian' && basicData?.resident_type !== 'indian') ? '*' : ''}</label><input className={inputCls + errorRing('swift_iban_code')} value={bank.swift_iban_code} onChange={e => { setBank({ ...bank, swift_iban_code: e.target.value.toUpperCase() }); clearError('swift_iban_code') }} placeholder={(basic.resident_type === 'indian' || basicData?.resident_type === 'indian') ? 'Optional for Indian residents' : 'Required for NRI/Foreign'} />{renderError('swift_iban_code')}</div>
                <div data-field="account_holder_name"><label className={labelCls}>Account Holder Name *</label><input className={inputCls + errorRing('account_holder_name')} value={bank.account_holder_name} onChange={e => { setBank({ ...bank, account_holder_name: lettersOnly(e.target.value) }); clearError('account_holder_name') }} />{renderError('account_holder_name')}{!errors.account_holder_name && bank.account_holder_name && !/^[a-zA-Z\s.]+$/.test(bank.account_holder_name) && <p className="text-xs text-amber-500 mt-1">Only letters allowed</p>}</div>
                <div data-field="bank_name"><label className={labelCls}>Bank Name *</label><input className={inputCls + errorRing('bank_name')} value={bank.bank_name} onChange={e => { setBank({ ...bank, bank_name: lettersOnly(e.target.value) }); clearError('bank_name') }} />{renderError('bank_name')}{!errors.bank_name && bank.bank_name && !/^[a-zA-Z\s.]+$/.test(bank.bank_name) && <p className="text-xs text-amber-500 mt-1">Only letters allowed</p>}</div>
                <div data-field="branch_name"><label className={labelCls}>Branch Name</label><input className={inputCls + errorRing('branch_name')} value={bank.branch_name} onChange={e => { setBank({ ...bank, branch_name: e.target.value.replace(/[^a-zA-Z\s.,-]/g, '') }); clearError('branch_name') }} placeholder="Branch name (auto-filled from IFSC)" />{renderError('branch_name')}</div>
                {renderFileUpload('Upload Document (Bank Statement/Cancelled Cheque/Passbook)', bankDocUrl, setBankDocUrl, 'bank_doc')}
              </div>
              <div className="flex justify-between mt-6">
                <button className={btnOutline} onClick={() => { setActiveStep(1); setErrors({}) }}>Back</button>
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
                    <div data-field="demat_account_number"><label className={labelCls}>Demat Account Number *</label><input className={inputCls + errorRing('demat_account_number')} value={demat.demat_account_number} onChange={e => { setDemat({ ...demat, demat_account_number: e.target.value }); clearError('demat_account_number') }} />{renderError('demat_account_number')}</div>
                    {renderFileUpload('Upload Demat Statement', dematDocUrl, setDematDocUrl, 'demat_doc')}
                  </>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <button className={btnOutline} onClick={() => { setActiveStep(2); setErrors({}) }}>Back</button>
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
                    <div data-field="nominee_name"><label className={labelCls}>Nominee Name *</label><input className={inputCls + errorRing('nominee_name')} value={nomineeForm.name} onChange={e => { setNomineeForm({ ...nomineeForm, name: e.target.value }); clearError('nominee_name') }} />{renderError('nominee_name')}</div>
                    <div data-field="nominee_dob"><label className={labelCls}>Nominee DOB *</label><input className={inputCls + errorRing('nominee_dob')} type="date" value={nomineeForm.dob} max={new Date().toISOString().split('T')[0]} min="1900-01-01" onChange={e => { setNomineeForm({ ...nomineeForm, dob: e.target.value }); clearError('nominee_dob') }} />{renderError('nominee_dob')}{!errors.nominee_dob && nomineeForm.dob && !isValidDOB(nomineeForm.dob) && <p className="text-xs text-amber-500 mt-1">Year must be 4 digits (1900-{new Date().getFullYear()})</p>}</div>
                    <div data-field="nominee_phone"><label className={labelCls}>Nominee Phone *</label><input className={inputCls + errorRing('nominee_phone')} value={nomineeForm.phone} onChange={e => { setNomineeForm({ ...nomineeForm, phone: e.target.value }); clearError('nominee_phone') }} placeholder="10-digit mobile number" maxLength={10} />
                      {renderError('nominee_phone')}
                      {!errors.nominee_phone && nomineeForm.phone && nomineeForm.phone.replace(/\D/g, '').length !== 10 && <p className="text-xs text-red-500 mt-1">Must be a valid 10-digit mobile number</p>}
                    </div>
                    {renderFileUpload('Upload Nominee ID Proof (PAN/Aadhaar)', nomineeProofUrl, setNomineeProofUrl, 'nominee_proof')}
                    <div data-field="nominee_relationship"><label className={labelCls}>Nominee Relationship *</label>
                      <select className={inputCls + errorRing('nominee_relationship')} value={nomineeForm.relationship} onChange={e => { setNomineeForm({ ...nomineeForm, relationship: e.target.value }); clearError('nominee_relationship') }}>
                        <option value="">Select Relationship</option><option value="spouse">Spouse</option><option value="father">Father</option><option value="mother">Mother</option><option value="son">Son</option><option value="daughter">Daughter</option><option value="brother">Brother</option><option value="sister">Sister</option><option value="other">Other</option>
                      </select>
                      {renderError('nominee_relationship')}
                    </div>
                    <div data-field="nominee_percentage"><label className={labelCls}>Percentage *</label>
                      <div className="relative"><input className={inputCls + errorRing('nominee_percentage') + ' pr-8'} type="number" min="0" max="100" value={nomineeForm.percentage} onChange={e => { setNomineeForm({ ...nomineeForm, percentage: e.target.value }); clearError('nominee_percentage') }} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span></div>
                      {renderError('nominee_percentage')}
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
                <button className={btnOutline} onClick={() => { setActiveStep(3); setErrors({}) }}>Back</button>
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

// ════════════════════════════════════════════════════════════════
// KYC Read-mode Tabs — shown after KYC is approved.
// Tabs: Bank Details · Proofs · Nominee Details
// ════════════════════════════════════════════════════════════════
function KycReadModeTabs({
  isDark, subCardCls, subTabCls, basicData, identityData, bankData, dematData, primaryNominee, proofs,
}: {
  isDark: boolean
  subCardCls: string
  subTabCls: (active: boolean) => string
  basicData: any
  identityData: any
  bankData: any
  dematData: any
  primaryNominee: any
  proofs: { label: string; verified: boolean; url?: string; back?: string }[]
}) {
  const [tab, setTab] = useState<'bank' | 'proofs' | 'nominee'>('bank')
  const labelCls = isDark ? 'text-[11px] uppercase tracking-wider text-gray-500 font-semibold' : 'text-[11px] uppercase tracking-wider text-gray-600 font-semibold'
  const valueCls = isDark ? 'text-sm text-white font-medium' : 'text-sm text-gray-900 font-medium'
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'bank' as const, label: 'Bank Details' },
          { id: 'proofs' as const, label: 'Proofs' },
          { id: 'nominee' as const, label: 'Nominee Details' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${subTabCls(tab === t.id)}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bank' && (
        <div className={`${subCardCls} p-5 space-y-3`}>
          {[
            ['Account No', bankData?.account_number || '—'],
            ['IFSC', bankData?.ifsc_code || bankData?.swift_iban_code || '—'],
            ['Holder Name', bankData?.account_holder_name || basicData?.investor_name || '—'],
            ['Branch', bankData?.branch_name || '—'],
            ['Account Type', bankData?.account_type || '—'],
            ['Bank Name', bankData?.bank_name || '—'],
            ...(dematData?.demat_account_number ? [['Demat Account', dematData.demat_account_number]] as [string, string][] : []),
          ].map(([l, v], i) => (
            <div key={i} className={`flex items-center justify-between gap-3 py-2 border-b last:border-b-0 ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
              <span className={labelCls}>{l}</span>
              <span className={valueCls}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'proofs' && (
        <div className={`${subCardCls} p-5 space-y-3`}>
          <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
            <span className={`text-[11px] uppercase tracking-wider font-semibold ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>KYC Documents</span>
          </div>
          {proofs.map((p, i) => (
            <div key={i} className={`flex items-center justify-between gap-3 py-2 ${i < proofs.length - 1 ? `border-b ${isDark ? 'border-white/[0.04]' : 'border-gray-200'}` : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
                  <FileText className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.label}</p>
                  {p.label === 'Aadhar Card' && (p.url || p.back) && (
                    <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Front{p.back ? ' + Back' : ''} page</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
                {p.label === 'Aadhar Card' && p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-brand-red/15 text-brand-red hover:bg-brand-red/25 transition-colors">
                    <Eye className="w-3 h-3" /> Front
                  </a>
                )}
                {p.label === 'Aadhar Card' && p.back && (
                  <a href={p.back} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-brand-red/15 text-brand-red hover:bg-brand-red/25 transition-colors">
                    <Eye className="w-3 h-3" /> Back
                  </a>
                )}
                {p.label !== 'Aadhar Card' && p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-brand-red/15 text-brand-red hover:bg-brand-red/25 transition-colors">
                    <Eye className="w-3 h-3" /> View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'nominee' && (
        <div className={`${subCardCls} p-5 space-y-3`}>
          {primaryNominee ? [
            ['Name', primaryNominee.name || '—'],
            ['Relationship', primaryNominee.relationship || '—'],
            ['Phone', primaryNominee.phone || '—'],
            ['DOB', primaryNominee.dob || '—'],
            ['Share', primaryNominee.percentage != null ? `${primaryNominee.percentage}%` : '—'],
          ].map(([l, v], i) => (
            <div key={i} className={`flex items-center justify-between gap-3 py-2 border-b last:border-b-0 ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
              <span className={labelCls}>{l}</span>
              <span className={valueCls}>{v}</span>
            </div>
          )) : (
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>No nominee on file.</p>
          )}
        </div>
      )}
    </div>
  )
}
