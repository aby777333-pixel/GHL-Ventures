/* ─────────────────────────────────────────────────────────────
   Partner Dashboard Service — GHL India Ventures
   Handles partner data queries, role determination (GI, CPL, MCP),
   referral mutations, monthly goals, and PDF agreement generation.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

export type PartnerRole = 'GI' | 'CPL' | 'MCP'

export interface PartnerSummary {
  partnerId: string
  name: string
  email: string
  phone: string
  role: PartnerRole
  referralCode: string
  referralLink: string
}

export interface PartnerKPIs {
  totalInvestment: number
  totalReferrals: number
  totalConverted: number
  todayReferrals: number
  totalInvestors: number
  totalCommission: number
  paidCommission: number
  pendingCommission: number
}

export interface MonthlyGoal {
  month: string
  directTarget: number
  directAchieved: number
  directProgress: number
  referralTarget: number
  referralAchieved: number
  referralProgress: number
}

export interface MonthlyChartData {
  month: string
  monthIndex: number
  referralInvestment: number
  earnings: number
  referralCount: number
}

export interface ReferralMember {
  id: string
  refereeName: string
  refereeEmail: string
  refereePhone: string
  refereeCity: string
  memberType: 'General Investor' | 'Channel Partner'
  kycStatus: 'Verified' | 'Pending' | 'Submitted'
  date: string
  createdAt: string
  investmentAmount: number
  commissionRate: number
  commissionAmount: number
  commissionStatus: 'pending' | 'accrued' | 'paid' | 'cancelled'
  status: string
  notes?: string
}

export interface SubChannelPartner {
  id: string
  cplId: string
  agencyName: string
  contactEmail: string
  contactPhone: string
  city: string
  totalInvestors: number
  volumeGenerated: number
  overrideRate: number
  overrideEarned: number
  status: string
  createdAt: string
}

export interface CommissionSlab {
  tier: string
  volume: string
  rate: string
  note: string
}

export interface PartnerDashboardResponse {
  success: boolean
  partner: PartnerSummary
  kpis: PartnerKPIs
  monthlyGoal: MonthlyGoal
  chartData: MonthlyChartData[]
  referrals: ReferralMember[]
  subChannelPartners: SubChannelPartner[]
  slabs: CommissionSlab[]
  availableSlabs: Record<PartnerRole, CommissionSlab[]>
}

export interface CreateInvestorInput {
  partnerId: string
  referrerName: string
  referrerEmail: string
  referrerPhone?: string
  refereeName: string
  refereeEmail: string
  refereePhone?: string
  refereeCity?: string
  investableSurplus?: string
  message?: string
}

export interface CreatePartnerInput {
  partnerId: string
  referrerName: string
  referrerEmail: string
  refereeName: string
  refereeEmail: string
  refereePhone?: string
  refereeCity?: string
  investableSurplus?: string
  message?: string
}

export interface UpdateGoalInput {
  directTarget: number
  referralTarget: number
}

/**
 * Determine partner role from GHL/Partner ID
 */
export function getPartnerRole(partnerId?: string | null): PartnerRole {
  if (!partnerId) return 'GI'
  const upper = partnerId.trim().toUpperCase()
  if (upper.startsWith('MCP')) return 'MCP'
  if (upper.startsWith('CPL') || upper.startsWith('CP')) return 'CPL'
  return 'GI'
}

/**
 * Fetch complete dashboard data for the authenticated partner
 */
export async function fetchPartnerDashboard(
  token?: string,
  previewId?: string,
  year?: number,
  month?: string
): Promise<PartnerDashboardResponse> {
  const queryParams = new URLSearchParams()
  if (previewId) queryParams.set('previewId', previewId)
  if (year) queryParams.set('year', String(year))
  if (month && month !== 'all') queryParams.set('month', month)

  const url = `/api/dashboard/referral${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(url, { headers, cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Dashboard API responded with ${res.status}`)
    }
    const data = await res.json()
    return data
  } catch (err: any) {
    console.warn('[partnerDashboardService] Fetch via API failed, using client fallback:', err)
    return await getFallbackDashboardData(previewId, year, month)
  }
}

/**
 * Create a new General Investor referral
 */
export async function createGeneralInvestor(
  input: CreateInvestorInput,
  token?: string
): Promise<{ success: boolean; referral?: any; error?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch('/api/dashboard/referral', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create_investor', ...input }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || 'Failed to submit referral')
    return { success: true, referral: data.referral }
  } catch (err: any) {
    console.error('[partnerDashboardService] createGeneralInvestor error:', err)
    // Direct client fallback
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).from('referrals').insert({
          referrer_name: input.referrerName,
          referrer_email: input.referrerEmail,
          referrer_phone: input.referrerPhone || null,
          referee_name: input.refereeName,
          referee_email: input.refereeEmail,
          referee_phone: input.refereePhone || null,
          referee_city: input.refereeCity || null,
          investable_surplus: input.investableSurplus || null,
          relationship: 'general_investor',
          message: input.message || `Partner referral from ${input.partnerId}`,
          status: 'new',
        }).select().single()
        if (!error) return { success: true, referral: data }
      } catch { /* ignore */ }
    }
    return { success: false, error: err?.message || 'Failed to create referral' }
  }
}

/**
 * Create a new Channel Partner (MCP only)
 */
export async function createChannelPartner(
  input: CreatePartnerInput,
  token?: string
): Promise<{ success: boolean; partner?: any; error?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch('/api/dashboard/referral', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create_partner', ...input }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || 'Failed to onboard Channel Partner')
    return { success: true, partner: data.partner }
  } catch (err: any) {
    console.error('[partnerDashboardService] createChannelPartner error:', err)
    return { success: false, error: err?.message || 'Failed to onboard Channel Partner' }
  }
}

/**
 * Update monthly goals
 */
export async function updateMonthlyGoals(
  input: UpdateGoalInput,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch('/api/dashboard/referral', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'update_goal', ...input }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || 'Failed to update goals')
    return { success: true }
  } catch (err: any) {
    console.error('[partnerDashboardService] updateMonthlyGoals error:', err)
    return { success: false, error: err?.message || 'Failed to update goals' }
  }
}

/**
 * Generate official PDF Agreement for Channel Partner (CPL) or Master Channel Partner (MCP)
 */
export async function generateAgreementPDF(options: {
  role: PartnerRole
  partnerId: string
  partnerName: string
  partnerEmail: string
  partnerPhone?: string
}): Promise<void> {
  const { role, partnerId, partnerName, partnerEmail, partnerPhone } = options
  const isMaster = role === 'MCP'
  const agreementTitle = isMaster
    ? 'MASTER CHANNEL PARTNER AGREEMENT'
    : role === 'CPL'
    ? 'CHANNEL PARTNER AGREEMENT'
    : 'INVESTOR REFERRAL PARTNER AGREEMENT'

  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2

    // Header styling
    doc.setFillColor(180, 10, 20) // GHL brand red
    doc.rect(0, 0, pageWidth, 18, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('GHL INDIA VENTURES  •  SEBI REG: IN/AIF2/24-25/1517', pageWidth / 2, 12, { align: 'center' })

    // Title
    doc.setTextColor(20, 20, 20)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(agreementTitle, pageWidth / 2, 34, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Ref: GHL-AGR-${partnerId}-${new Date().getFullYear()}`, pageWidth / 2, 40, { align: 'center' })

    // Divider line
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, 44, pageWidth - margin, 44)

    // Parties Box
    doc.setFillColor(248, 248, 250)
    doc.rect(margin, 48, contentWidth, 38, 'F')
    doc.setDrawColor(220, 220, 230)
    doc.rect(margin, 48, contentWidth, 38, 'S')

    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text('BETWEEN:', margin + 4, 55)
    doc.setFont('helvetica', 'normal')
    doc.text('GHL INDIA VENTURES (Manager to GHL India Growth Fund - Cat II AIF)', margin + 28, 55)
    doc.text('Registered Office: 2D, Queens Court, No. 6, Montieth Road, Egmore, Chennai 600008, TN', margin + 28, 61)

    doc.setFont('helvetica', 'bold')
    doc.text('AND:', margin + 4, 71)
    doc.setFont('helvetica', 'normal')
    doc.text(`Partner Name: ${partnerName}  |  Partner ID: ${partnerId}`, margin + 28, 71)
    doc.text(`Email: ${partnerEmail}  |  Phone: ${partnerPhone || 'On File'}  |  Type: ${isMaster ? 'Master Channel Partner (MCP)' : 'Channel Partner (CPL)'}`, margin + 28, 77)

    // Key Terms & Clauses
    let yPos = 96
    const clauses = [
      {
        num: '1. APPOINTMENT & SCOPE',
        text: `The Manager hereby appoints the Partner as an authorized ${isMaster ? 'Master Channel Partner' : 'Channel Partner'} to market, source, and introduce eligible Accredited & High Net-Worth Investors to GHL India Ventures Alternative Investment Funds pursuant to SEBI (AIF) Regulations, 2012.`
      },
      {
        num: '2. CODE OF CONDUCT & COMPLIANCE',
        text: 'The Partner covenants to strictly adhere to SEBI advertising codes, Prevention of Money Laundering Act (PMLA), and shall not make any promise, warranty, or representation beyond the officially sanctioned Private Placement Memorandum (PPM).'
      },
      {
        num: '3. COMMISSION & OVERRIDES SCHEDULE',
        text: isMaster
          ? 'Master Channel Partner Compensation:\n• Direct Referral Reward: Up to 5.50% on capital commitments successfully realized.\n• Overriding Commission: 1.00% on all aggregated investment volumes realized through Sub-Channel Partners.\n• Trail Distribution: 1.25% per annum on active under-management commitments.'
          : 'Channel Partner Compensation:\n• Base Referral Commission: 3.50% on first-tier investor capital realized.\n• High Volume Slab: 4.50% for volume exceeding ₹10 Crore, 5.00% above ₹25 Crore.\n• Trail Distribution: 1.25% per annum paid on active AUM.'
      },
      {
        num: '4. CONFIDENTIALITY & DATA PROTECTION',
        text: 'All investor data, records, financial metrics, and intellectual property exchanged under this Agreement are strictly confidential and governed by the Digital Personal Data Protection Act, 2023.'
      },
      {
        num: '5. TERM & TERMINATION',
        text: 'This agreement commences on the date of execution and remains valid for a period of 24 (twenty-four) months, renewable upon mutual consent.'
      }
    ]

    for (const cl of clauses) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(20, 20, 20)
      doc.text(cl.num, margin, yPos)
      yPos += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      const splitText = doc.splitTextToSize(cl.text, contentWidth)
      doc.text(splitText, margin, yPos)
      yPos += splitText.length * 4.5 + 4
    }

    // Signatures
    const sigY = pageHeight - 40
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, sigY, margin + 65, sigY)
    doc.line(pageWidth - margin - 65, sigY, pageWidth - margin, sigY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)
    doc.text('For GHL India Ventures', margin, sigY + 5)
    doc.text('For Authorized Partner', pageWidth - margin - 65, sigY + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Authorized Signatory & Seal', margin, sigY + 9)
    doc.text(`${partnerName} (${partnerId})`, pageWidth - margin - 65, sigY + 9)

    // Footer
    doc.setFontSize(7.5)
    doc.text(
      `Confidential Document • Generated automatically by GHL India Ventures Portal • Date: ${new Date().toLocaleDateString('en-IN')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )

    doc.save(`GHL_${isMaster ? 'MCP' : 'CP'}_Agreement_${partnerId}.pdf`)
  } catch (err) {
    console.error('[partnerDashboardService] generateAgreementPDF failed:', err)
    window.alert('Unable to generate PDF document in this browser session. Please contact support.')
  }
}

/**
 * Live direct Supabase query when API route is offline or in static export mode
 */
async function getFallbackDashboardData(previewId?: string, year?: number, _month?: string): Promise<PartnerDashboardResponse> {
  const pId = previewId || 'GHL240046'
  const role = getPartnerRole(pId)
  const filterYear = year || new Date().getFullYear()

  const slabs = {
    GI: [
      { tier: 'Tier 1', volume: 'Up to ₹5 Crore', rate: '3.0%', note: 'Direct Referral Bonus' },
      { tier: 'Tier 2', volume: '₹5.01 Crore and above', rate: '4.0%', note: 'Accelerated Referral Bonus' },
      { tier: 'Management Fee', volume: 'All AUM', rate: '1.0% PA', note: 'Annual Fee Sharing' },
    ],
    CPL: [
      { tier: 'Base Slab', volume: 'Up to ₹10 Crore', rate: '3.5%', note: 'Channel Partner Standard' },
      { tier: 'Performance Slab', volume: '₹10.01 Cr – ₹25 Cr', rate: '4.5%', note: 'Tier 1 Incentive' },
      { tier: 'Elite Slab', volume: 'Above ₹25 Crore', rate: '5.0%', note: 'High Volume Producer' },
      { tier: 'Trail Commission', volume: 'Active AUM', rate: '1.25% PA', note: 'Quarterly Trail Payout' },
    ],
    MCP: [
      { tier: 'Master Direct', volume: 'Direct Referrals', rate: '5.5%', note: 'Maximum Direct Incentive' },
      { tier: 'Master Overrides', volume: 'All Sub-CPL Network Volume', rate: '1.0%', note: 'Overriding Commission' },
      { tier: 'Quarterly Bonus Pool', volume: 'Network AUM > ₹50 Cr', rate: '0.5%', note: 'Master Partner Pool' },
    ],
  }

  let userEmail = ''
  let userName = 'Partner Investor'
  let clientInvested = 0

  if (isSupabaseConfigured()) {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        userEmail = authData.user.email || ''
        userName = authData.user.user_metadata?.full_name || userName
        const { data: c } = await (supabase as any)
          .from('clients')
          .select('full_name, email, phone, total_invested, ghl_id')
          .eq('user_id', authData.user.id)
          .maybeSingle()
        if (c) {
          userEmail = c.email || userEmail
          userName = c.full_name || userName
          clientInvested = Number(c.total_invested) || 0
        }
      }
    } catch { /* non-blocking */ }
  }

  // 1. Query referrer_summary view
  let totalReferrals = 0
  let convertedCount = 0
  let totalInvested = 0
  let totalCommission = 0
  let paidCommission = 0

  if (isSupabaseConfigured() && userEmail) {
    try {
      const { data: sumRow } = await (supabase as any)
        .from('referrer_summary')
        .select('*')
        .eq('referrer_email', userEmail)
        .maybeSingle()
      if (sumRow) {
        totalReferrals = Number(sumRow.total_referrals) || 0
        convertedCount = Number(sumRow.converted_count) || 0
        totalInvested = Number(sumRow.total_invested) || 0
        totalCommission = Number(sumRow.total_commission) || 0
        paidCommission = Number(sumRow.paid_commission) || 0
      }
    } catch { /* non-blocking */ }
  }

  // 2. Query referrals table
  let rawReferrals: any[] = []
  if (isSupabaseConfigured()) {
    try {
      const q = (supabase as any).from('referrals').select('*')
      if (userEmail) {
        q.or(`referrer_email.eq.${userEmail},referrer_name.eq.${userName}`)
      }
      const { data: rList } = await q.order('created_at', { ascending: false }).limit(50)
      if (rList && rList.length > 0) rawReferrals = rList
    } catch { /* non-blocking */ }
  }

  // 3. Supplement with clients where referred_by = pId
  if (isSupabaseConfigured()) {
    try {
      const { data: refClients } = await (supabase as any)
        .from('clients')
        .select('id, full_name, email, phone, city, total_invested, kyc_status, joined_at, created_at')
        .or(`referred_by.eq.${pId},referred_by.ilike.%${pId}%`)
        .order('created_at', { ascending: false })
      if (refClients && refClients.length > 0) {
        const seen = new Set(rawReferrals.map((r: any) => (r.referee_email || '').toLowerCase()))
        for (const rc of refClients) {
          if (rc.email && !seen.has(rc.email.toLowerCase())) {
            const inv = Number(rc.total_invested) || 0
            const rate = role === 'MCP' ? 4.5 : role === 'CPL' ? 3.5 : (inv > 50000000 ? 4.0 : 3.0)
            const comm = (inv * rate) / 100
            rawReferrals.push({
              id: rc.id,
              referrer_name: userName,
              referrer_email: userEmail,
              referee_name: rc.full_name || 'Referred Client',
              referee_email: rc.email,
              referee_phone: rc.phone || '—',
              referee_city: rc.city || 'India',
              relationship: 'general_investor',
              status: inv > 0 ? 'converted' : 'qualified',
              investment_amount: inv,
              commission_rate: rate,
              commission_amount: comm,
              commission_status: inv > 0 ? 'accrued' : 'pending',
              created_at: rc.joined_at || rc.created_at || new Date().toISOString(),
            })
            seen.add(rc.email.toLowerCase())
          }
        }
      }
    } catch { /* non-blocking */ }
  }

  // 4. Default Seed/Sample Data when no DB referrals exist for testing/auditing (Development only)
  const isProduction = process.env.NODE_ENV === 'production'
  if (rawReferrals.length === 0 && !isProduction) {
    if (role === 'CPL' || pId === 'CPLGHL24376') {
      userName = userName !== 'Partner Investor' ? userName : 'Sourin Chandra Buragohain'
      userEmail = userEmail || 'sourin.cpl@ghlindiaventures.com'
      rawReferrals = [
        {
          id: 'GHL245721',
          referrer_name: userName,
          referrer_email: userEmail,
          referee_name: 'Abhishek Choudhary',
          referee_email: 'abhishek.choudhary@example.com',
          referee_phone: '+91 98401 23456',
          referee_city: 'Chennai',
          relationship: 'general_investor',
          status: 'converted',
          investment_amount: 1000000,
          commission_rate: 3.0,
          commission_amount: 20000,
          commission_status: 'accrued',
          created_at: '2026-10-08T10:00:00.000Z',
        },
        {
          id: 'GHL245102',
          referrer_name: userName,
          referrer_email: userEmail,
          referee_name: 'Rajesh Singhania',
          referee_email: 'rajesh.singhania@example.com',
          referee_phone: '+91 98200 45678',
          referee_city: 'Mumbai',
          relationship: 'general_investor',
          status: 'converted',
          investment_amount: 1000000,
          commission_rate: 3.0,
          commission_amount: 30000,
          commission_status: 'paid',
          created_at: '2026-08-15T11:30:00.000Z',
        },
        {
          id: 'GHL244890',
          referrer_name: userName,
          referrer_email: userEmail,
          referee_name: 'Priya Mehra',
          referee_email: 'priya.mehra@example.com',
          referee_phone: '+91 98111 78901',
          referee_city: 'Delhi',
          relationship: 'general_investor',
          status: 'converted',
          investment_amount: 1000000,
          commission_rate: 3.0,
          commission_amount: 30000,
          commission_status: 'paid',
          created_at: '2026-06-20T14:00:00.000Z',
        },
        {
          id: 'GHL243210',
          referrer_name: userName,
          referrer_email: userEmail,
          referee_name: 'Vikram Malhotra',
          referee_email: 'vikram.malhotra@example.com',
          referee_phone: '+91 98300 23456',
          referee_city: 'Kolkata',
          relationship: 'general_investor',
          status: 'converted',
          investment_amount: 1000000,
          commission_rate: 3.0,
          commission_amount: 30000,
          commission_status: 'paid',
          created_at: '2026-04-12T09:45:00.000Z',
        },
        {
          id: 'GHL241050',
          referrer_name: userName,
          referrer_email: userEmail,
          referee_name: 'Ananya Sharma',
          referee_email: 'ananya.sharma@example.com',
          referee_phone: '+91 98800 67890',
          referee_city: 'Bangalore',
          relationship: 'general_investor',
          status: 'converted',
          investment_amount: 1000000,
          commission_rate: 3.0,
          commission_amount: 30000,
          commission_status: 'paid',
          created_at: '2026-02-05T16:20:00.000Z',
        },
      ]
    }
  }

  // Compute 5 KPIs
  const sumInv = rawReferrals.reduce((acc, r) => acc + (Number(r.investment_amount) || 0), 0)
  const sumComm = rawReferrals.reduce((acc, r) => acc + (Number(r.commission_amount) || 0), 0)
  const finalTotalInvested = Math.max(totalInvested, sumInv)
  const finalTotalCommission = Math.max(totalCommission, sumComm)
  const finalPaidCommission = paidCommission
  const finalPendingCommission = Math.max(0, finalTotalCommission - finalPaidCommission)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayReferrals = rawReferrals.filter(r => new Date(r.created_at) >= today).length
  const uniqueInvestors = new Set(rawReferrals.map(r => r.referee_email || r.referee_name)).size

  const kpis: PartnerKPIs = {
    totalInvestment: finalTotalInvested,
    totalReferrals: Math.max(totalReferrals, rawReferrals.length),
    totalConverted: Math.max(convertedCount, rawReferrals.filter(r => r.status === 'converted' || Number(r.investment_amount) > 0).length),
    todayReferrals,
    totalInvestors: uniqueInvestors,
    totalCommission: finalTotalCommission,
    paidCommission: finalPaidCommission,
    pendingCommission: finalPendingCommission,
  }

  // Monthly goals
  const monthlyGoal: MonthlyGoal = {
    month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    directTarget: 5000000,
    directAchieved: clientInvested,
    directProgress: clientInvested > 0 ? Math.min(100, Math.round((clientInvested / 5000000) * 100)) : 0,
    referralTarget: 10000000,
    referralAchieved: finalTotalInvested,
    referralProgress: finalTotalInvested > 0 ? Math.min(100, Math.round((finalTotalInvested / 10000000) * 100)) : 0,
  }

  // Chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const chartData: MonthlyChartData[] = months.map((m, i) => {
    const mRefs = rawReferrals.filter(r => {
      const d = new Date(r.created_at)
      return d.getFullYear() === filterYear && d.getMonth() === i
    })
    return {
      month: m,
      monthIndex: i + 1,
      referralInvestment: mRefs.reduce((acc, r) => acc + (Number(r.investment_amount) || 0), 0),
      earnings: mRefs.reduce((acc, r) => acc + (Number(r.commission_amount) || 0), 0),
      referralCount: mRefs.length,
    }
  })

  // Format members
  const referrals: ReferralMember[] = rawReferrals.map((r: any, idx: number) => ({
    id: r.id || `ref-${idx}`,
    refereeName: r.referee_name || 'Referral Contact',
    refereeEmail: r.referee_email || '—',
    refereePhone: r.referee_phone || '—',
    refereeCity: r.referee_city || '—',
    memberType: r.relationship === 'channel_partner' ? 'Channel Partner' : 'General Investor',
    kycStatus: r.status === 'converted' ? 'Verified' : r.status === 'qualified' ? 'Verified' : 'Pending',
    date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    createdAt: r.created_at || new Date().toISOString(),
    investmentAmount: Number(r.investment_amount) || 0,
    commissionRate: Number(r.commission_rate) || (role === 'MCP' ? 4.5 : role === 'CPL' ? 3.5 : 3.0),
    commissionAmount: Number(r.commission_amount) || 0,
    commissionStatus: r.commission_status || (Number(r.investment_amount) > 0 ? 'accrued' : 'pending'),
    status: r.status || 'new',
    notes: r.message || '',
  }))

  // Sub channel partners for MCP
  const subChannelPartners: SubChannelPartner[] = rawReferrals
    .filter(r => r.relationship === 'channel_partner' || (r.referee_email && r.referee_email.includes('partner')))
    .map((p, idx) => {
      const vol = Number(p.investment_amount) || 0
      const overrideRate = 1.0
      return {
        id: p.id || `sub-${idx}`,
        cplId: `CPLGHL${24100 + idx * 50}`,
        agencyName: p.referee_name || `Partner Agency ${idx + 1}`,
        contactEmail: p.referee_email,
        contactPhone: p.referee_phone || '—',
        city: p.referee_city || 'Chennai',
        totalInvestors: Math.max(1, Math.round(vol / 2500000)),
        volumeGenerated: vol,
        overrideRate,
        overrideEarned: (vol * overrideRate) / 100,
        status: p.status === 'converted' ? 'Active' : 'Onboarding',
        createdAt: p.created_at || new Date().toISOString(),
      }
    })

  return {
    success: true,
    partner: {
      partnerId: pId,
      name: userName,
      email: userEmail || 'partner@ghlindiaventures.com',
      phone: '+91 44 2843 1043',
      role,
      referralCode: pId,
      referralLink: typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${pId}` : `https://ghlindiaventures.com/register?ref=${pId}`,
    },
    kpis,
    monthlyGoal,
    chartData,
    referrals,
    subChannelPartners,
    slabs: slabs[role] || slabs.GI,
    availableSlabs: slabs,
  }
}
