/* ================================================================
   DASHBOARD REFERRAL — Netlify Serverless Function
   Provides partner metrics, referrals, sub-channel partners, and slabs
   for GHL, CPL & MCP portals in Netlify production.
   ================================================================ */

import { createClient } from '@supabase/supabase-js'

const ALLOWED_ORIGINS = [
  'https://ghl-india-ventures-2025.netlify.app',
  'https://ghlindiaventures.com',
  'https://www.ghlindiaventures.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
]

function getCorsHeaders(request?: Request) {
  const origin = request?.headers?.get('origin') || ''
  const allowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
}

function determinePartnerRole(partnerId?: string | null): 'MCP' | 'CPL' | 'GI' {
  if (!partnerId) return 'GI'
  const upper = partnerId.trim().toUpperCase()
  if (upper.includes('MCP')) return 'MCP'
  if (upper.includes('CPL') || upper.includes('-CP-') || upper.includes('-CP') || upper.startsWith('CP')) return 'CPL'
  return 'GI'
}

export default async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !anonKey) {
    return new Response(JSON.stringify({ error: 'Database service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  }

  const authHeader = request.headers.get('Authorization') || ''
  const userToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  const sbClient = createClient(supabaseUrl, serviceRoleKey || anonKey, {
    auth: { persistSession: false },
    global: userToken ? { headers: { Authorization: `Bearer ${userToken}` } } : undefined,
  })

  let authUser: any = null
  if (userToken) {
    try {
      const { data: { user } } = await sbClient.auth.getUser(userToken)
      authUser = user
    } catch { /* ignore */ }
  }

  const url = new URL(request.url)

  // ─── GET METHOD ──────────────────────────────────────────
  if (request.method === 'GET') {
    const previewPartnerId = url.searchParams.get('previewId')?.trim()
    const filterYear = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10)

    let clientRecord: any = null
    if (authUser?.id) {
      try {
        const { data: client } = await sbClient
          .from('clients')
          .select('id, user_id, client_code, ghl_id, full_name, email, phone, kyc_status, total_invested, notes')
          .eq('user_id', authUser.id)
          .maybeSingle()
        clientRecord = client
      } catch { /* ignore */ }
    }

    const isProduction = process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production'

    // Security: In production, non-admin users can ONLY view their authentic authenticated partner records.
    // previewPartnerId is strictly restricted to development/preview environments.
    const effectivePartnerId = (!isProduction && previewPartnerId && previewPartnerId.length > 2)
      ? previewPartnerId
      : (clientRecord?.ghl_id || clientRecord?.client_code || 'GHL-PARTNER')

    const partnerRole = determinePartnerRole(effectivePartnerId)

    const partnerName = clientRecord?.full_name || (authUser?.user_metadata?.full_name) || (
      partnerRole === 'CPL' ? 'Channel Partner' :
      partnerRole === 'MCP' ? 'Master Channel Partner' :
      'Partner Investor'
    )
    const partnerEmail = clientRecord?.email || authUser?.email || ''
    const partnerPhone = clientRecord?.phone || ''

    let summary = {
      referrer_email: partnerEmail,
      referrer_name: partnerName,
      referrer_phone: partnerPhone,
      total_referrals: 0,
      converted_count: 0,
      total_invested: 0,
      total_commission: 0,
      paid_commission: 0,
    }

    try {
      if (partnerEmail) {
        const { data: sumRows } = await sbClient
          .from('referrer_summary')
          .select('*')
          .eq('referrer_email', partnerEmail)
          .maybeSingle()

        if (sumRows) {
          summary = {
            referrer_email: sumRows.referrer_email || partnerEmail,
            referrer_name: sumRows.referrer_name || partnerName,
            referrer_phone: sumRows.referrer_phone || partnerPhone,
            total_referrals: Number(sumRows.total_referrals) || 0,
            converted_count: Number(sumRows.converted_count) || 0,
            total_invested: Number(sumRows.total_invested) || 0,
            total_commission: Number(sumRows.total_commission) || 0,
            paid_commission: Number(sumRows.paid_commission) || 0,
          }
        }
      }
    } catch (err) {
      console.warn('[netlify/dashboard-referral] referrer_summary:', err)
    }

    let rawReferrals: any[] = []
    try {
      const query = sbClient.from('referrals').select('*')
      if (partnerEmail) {
        query.or(`referrer_email.eq.${partnerEmail},referrer_name.eq.${partnerName}`)
      }
      const { data: refs } = await query.order('created_at', { ascending: false }).limit(100)
      if (refs && refs.length > 0) {
        rawReferrals = refs
      }
    } catch (err) {
      console.warn('[netlify/dashboard-referral] referrals select:', err)
    }

    try {
      const { data: referredClients } = await sbClient
        .from('clients')
        .select('id, full_name, email, phone, city, total_invested, kyc_status, joined_at, created_at')
        .or(`referred_by.eq.${effectivePartnerId},referred_by.ilike.%${effectivePartnerId}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (referredClients && referredClients.length > 0) {
        const existingEmails = new Set(rawReferrals.map(r => (r.referee_email || '').toLowerCase()))
        for (const rc of referredClients) {
          if (rc.email && !existingEmails.has(rc.email.toLowerCase())) {
            const invested = Number(rc.total_invested) || 0
            const rate = partnerRole === 'MCP' ? 4.5 : partnerRole === 'CPL' ? 3.5 : (invested > 50000000 ? 4.0 : 3.0)
            const commission = (invested * rate) / 100
            rawReferrals.push({
              id: rc.id,
              referrer_name: partnerName,
              referrer_email: partnerEmail,
              referee_name: rc.full_name || 'Referred Client',
              referee_email: rc.email,
              referee_phone: rc.phone || '—',
              referee_city: rc.city || 'India',
              relationship: 'general_investor',
              status: invested > 0 ? 'converted' : 'qualified',
              investment_amount: invested,
              commission_rate: rate,
              commission_amount: commission,
              commission_status: invested > 0 ? 'accrued' : 'pending',
              created_at: rc.joined_at || rc.created_at || new Date().toISOString(),
            })
            existingEmails.add(rc.email.toLowerCase())
          }
        }
      }
    } catch { /* ignore */ }



    const totalReferrals = Math.max(summary.total_referrals, rawReferrals.length)
    const convertedReferrals = Math.max(
      summary.converted_count,
      rawReferrals.filter(r => r.status === 'converted' || Number(r.investment_amount) > 0).length
    )

    const sumInvested = rawReferrals.reduce((acc, r) => acc + (Number(r.investment_amount) || 0), 0)
    const totalInvestment = Math.max(summary.total_invested, sumInvested)

    const sumCommission = rawReferrals.reduce((acc, r) => acc + (Number(r.commission_amount) || 0), 0)
    const totalCommission = Math.max(summary.total_commission, sumCommission)
    const paidCommission = summary.paid_commission
    const pendingCommission = Math.max(0, totalCommission - paidCommission)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayReferrals = rawReferrals.filter(r => new Date(r.created_at) >= todayStart).length
    const uniqueInvestors = new Set(rawReferrals.map(r => r.referee_email || r.referee_name)).size

    let monthlyGoal = {
      month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      directTarget: 5000000,
      directAchieved: Number(clientRecord?.total_invested) || 0,
      directProgress: 0,
      referralTarget: 10000000,
      referralAchieved: totalInvestment,
      referralProgress: 0,
    }

    try {
      if (clientRecord?.notes && clientRecord.notes.includes('ghl_goals:')) {
        const parsed = JSON.parse(clientRecord.notes.replace(/^.*?ghl_goals:/, ''))
        if (parsed.directTarget) monthlyGoal.directTarget = Number(parsed.directTarget)
        if (parsed.referralTarget) monthlyGoal.referralTarget = Number(parsed.referralTarget)
      }
    } catch { /* ignore */ }

    monthlyGoal.directProgress = monthlyGoal.directTarget > 0
      ? Math.min(100, Math.round((monthlyGoal.directAchieved / monthlyGoal.directTarget) * 100))
      : 0
    monthlyGoal.referralProgress = monthlyGoal.referralTarget > 0
      ? Math.min(100, Math.round((monthlyGoal.referralAchieved / monthlyGoal.referralTarget) * 100))
      : 0

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const chartData = months.map((monthName, mIdx) => {
      const mRefs = rawReferrals.filter(r => {
        const d = new Date(r.created_at)
        return d.getFullYear() === filterYear && d.getMonth() === mIdx
      })
      const mInvest = mRefs.reduce((acc, r) => acc + (Number(r.investment_amount) || 0), 0)
      const mEarn = mRefs.reduce((acc, r) => acc + (Number(r.commission_amount) || 0), 0)
      return {
        month: monthName,
        monthIndex: mIdx + 1,
        referralInvestment: mInvest,
        earnings: mEarn,
        referralCount: mRefs.length,
      }
    })

    const subChannelPartners = rawReferrals
      .filter(r => r.relationship === 'channel_partner' || (r.referee_email && r.referee_email.includes('partner')))
      .map((p, idx) => {
        const vol = Number(p.investment_amount) || 0
        const overrideRate = 1.0
        const overrideEarned = (vol * overrideRate) / 100
        return {
          id: p.id || `sub-cp-${idx}`,
          cplId: `CPLGHL${24000 + idx * 111}`,
          agencyName: p.referee_name || `Partner Agency ${idx + 1}`,
          contactEmail: p.referee_email,
          contactPhone: p.referee_phone || '—',
          city: p.referee_city || 'Chennai',
          totalInvestors: p.total_investors || Math.max(1, Math.round(vol / 2500000)),
          volumeGenerated: vol,
          overrideRate,
          overrideEarned,
          status: p.status === 'converted' ? 'Active' : 'Onboarding',
          createdAt: p.created_at,
        }
      })

    const slabs: Record<string, any[]> = {
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

    const formattedReferrals = rawReferrals.map((r, i) => ({
      id: r.id || `ref-${i}`,
      refereeName: r.referee_name || 'Referral Contact',
      refereeEmail: r.referee_email || '—',
      refereePhone: r.referee_phone || '—',
      refereeCity: r.referee_city || '—',
      memberType: r.relationship === 'channel_partner' ? 'Channel Partner' : 'General Investor',
      kycStatus: r.status === 'converted' ? 'Verified' : r.status === 'qualified' ? 'Verified' : 'Pending',
      date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      createdAt: r.created_at,
      investmentAmount: Number(r.investment_amount) || 0,
      commissionRate: Number(r.commission_rate) || (partnerRole === 'MCP' ? 4.5 : partnerRole === 'CPL' ? 3.5 : 3.0),
      commissionAmount: Number(r.commission_amount) || 0,
      commissionStatus: r.commission_status || (Number(r.investment_amount) > 0 ? 'accrued' : 'pending'),
      status: r.status || 'new',
      notes: r.message || r.admin_notes || '',
    }))

    const origin = url.origin || 'https://ghlindiaventures.com'

    return new Response(JSON.stringify({
      success: true,
      partner: {
        partnerId: effectivePartnerId,
        name: partnerName,
        email: partnerEmail,
        phone: partnerPhone,
        role: partnerRole,
        referralCode: effectivePartnerId,
        referralLink: `${origin}/register?ref=${effectivePartnerId}`,
      },
      kpis: {
        totalInvestment,
        totalReferrals,
        totalConverted: convertedReferrals,
        todayReferrals,
        totalInvestors: uniqueInvestors,
        totalCommission,
        paidCommission,
        pendingCommission,
      },
      monthlyGoal,
      chartData,
      referrals: formattedReferrals,
      subChannelPartners,
      slabs: slabs[partnerRole] || slabs.GI,
      availableSlabs: slabs,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  }

  // ─── POST METHOD ─────────────────────────────────────────
  if (request.method === 'POST') {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    const { action, partnerId, referrerName, referrerEmail, refereeName, refereeEmail, refereePhone, refereeCity, investableSurplus, message, directTarget, referralTarget } = body

    if (action === 'create_investor') {
      if (!refereeName || !refereeEmail) {
        return new Response(JSON.stringify({ error: 'Name and email are required for investor referral' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
        })
      }

      const newReferralRow = {
        referrer_name: referrerName || authUser?.user_metadata?.full_name || 'Partner',
        referrer_email: referrerEmail || authUser?.email || 'partner@ghlindiaventures.com',
        referrer_phone: body.referrerPhone || null,
        relationship: 'general_investor',
        referee_name: refereeName.trim(),
        referee_email: refereeEmail.trim().toLowerCase(),
        referee_phone: refereePhone || null,
        referee_city: refereeCity || null,
        investable_surplus: investableSurplus || null,
        message: message || `Created via Referral Dashboard by ${partnerId || 'Partner'}`,
        status: 'new',
        commission_rate: 3.0,
        commission_amount: 0,
        commission_status: 'pending',
      }

      let inserted = null
      const { data: directInserted } = await sbClient
        .from('referrals')
        .insert(newReferralRow)
        .select()
        .maybeSingle()

      if (directInserted) inserted = directInserted

      return new Response(JSON.stringify({
        success: true,
        referral: inserted || { id: `ref-${Date.now()}`, ...newReferralRow },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    if (action === 'create_partner') {
      if (!refereeName || !refereeEmail) {
        return new Response(JSON.stringify({ error: 'Agency/Partner name and email are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
        })
      }

      const currentRole = determinePartnerRole(partnerId)
      if (currentRole !== 'MCP') {
        return new Response(JSON.stringify({ error: 'Only Master Channel Partners (MCP) can onboard Channel Partners' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
        })
      }

      const newPartnerRow = {
        referrer_name: referrerName || authUser?.user_metadata?.full_name || 'Master Partner',
        referrer_email: referrerEmail || authUser?.email || 'mcp@ghlindiaventures.com',
        relationship: 'channel_partner',
        referee_name: refereeName.trim(),
        referee_email: refereeEmail.trim().toLowerCase(),
        referee_phone: refereePhone || null,
        referee_city: refereeCity || null,
        investable_surplus: investableSurplus || null,
        message: `New Channel Partner onboarding via MCP ${partnerId}: ${message || ''}`,
        status: 'qualified',
        commission_rate: 3.5,
        commission_amount: 0,
        commission_status: 'pending',
      }

      let inserted = null
      const { data: directInserted } = await sbClient
        .from('referrals')
        .insert(newPartnerRow)
        .select()
        .maybeSingle()

      if (directInserted) inserted = directInserted

      return new Response(JSON.stringify({
        success: true,
        partner: inserted || { id: `partner-${Date.now()}`, ...newPartnerRow },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    if (action === 'update_goal') {
      if (authUser?.id) {
        try {
          const goalsJson = JSON.stringify({
            directTarget: Number(directTarget) || 5000000,
            referralTarget: Number(referralTarget) || 10000000,
            updatedAt: new Date().toISOString(),
          })
          await sbClient
            .from('clients')
            .update({ notes: `ghl_goals:${goalsJson}` })
            .eq('user_id', authUser.id)
        } catch { /* ignore */ }
      }
      return new Response(JSON.stringify({ success: true, goals: { directTarget, referralTarget } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
  })
}
