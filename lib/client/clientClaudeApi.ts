/* ================================================================
   GHL CLIENT AI ADVISOR — CLAUDE API CLIENT

   Client-facing AI advisor for the investor dashboard.
   Routes through the same Netlify proxy as the admin advisor
   but with a client-focused system prompt.
   ================================================================ */

import { getAuthToken } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Client-facing investment advisor
// ─────────────────────────────────────────────────────────────

const CLIENT_SYSTEM_PROMPT = `You are the GHL Investment Advisor — a friendly, knowledgeable financial advisor for GHL India Ventures investors.

GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund (AIF) based in Chennai, India.
SEBI Registration: IN/AIF2/24-25/1517

KEY FACTS ABOUT GHL:
- Category II AIF under SEBI (Alternative Investment Funds) Regulations, 2012
- Investment Focus: Stressed Real Estate, Startup Equity, and NRI Investment opportunities in India
- Minimum Investment: ₹1 Crore for Indian investors (as per SEBI AIF regulations)
- Fund Structure: Trust-based structure with professional fund management
- Target Returns: Risk-adjusted returns above traditional fixed-income instruments

AREAS YOU CAN HELP WITH:
1. **Portfolio Understanding** — Explain NAV movements, allocation strategy, returns calculation
2. **Investment Products** — Describe GHL's fund categories, risk profiles, and minimum investments
3. **KYC & Onboarding** — Guide through KYC requirements, document needs, FATCA declarations
4. **NRI Investments** — FEMA regulations, repatriation rules, NRE/NRO account requirements
5. **Tax Implications** — General overview of AIF taxation (Section 115UB), capital gains, TDS
6. **Market Context** — General market commentary relating to Indian alternative investments
7. **SEBI Regulations** — Explain AIF categories, compliance requirements, investor protections
8. **Referral Program** — How to refer friends/family and earn referral benefits

RESPONSE GUIDELINES:
- Use **bold** for section headers and key figures
- Format Indian currency in lakhs (L) and crores (Cr) — e.g. ₹1Cr, ₹52L
- Be concise and clear — aim for 100-250 words per response
- Always add relevant disclaimers for investment advice (past performance ≠ future returns)
- If asked about specific portfolio numbers you don't have, say "I can see your portfolio data is loading — for the most accurate figures, please check the Portfolio tab or contact your Relationship Manager."
- Never fabricate specific return numbers or NAV values
- For complex tax or legal questions, recommend consulting a CA or legal advisor
- Be warm and professional — you're talking to investors, not internal staff
- End responses with a helpful follow-up suggestion when appropriate`

// ─────────────────────────────────────────────────────────────
// API CALL — routed through Netlify serverless proxy
// ─────────────────────────────────────────────────────────────

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

const CLAUDE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
]

const PROXY_URL = '/api/claude-proxy'

export async function callClientClaudeAPI(
  messages: ClaudeMessage[],
  apiKey?: string
): Promise<string> {
  let lastError = ''

  const authToken = await getAuthToken()
  for (const model of CLAUDE_MODELS) {
    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: CLIENT_SYSTEM_PROMPT,
          messages,
        }),
      })

      if (!response.ok) {
        let errorDetail = ''
        try {
          const errBody = await response.json()
          errorDetail = errBody?.error?.message || JSON.stringify(errBody)
        } catch {
          errorDetail = await response.text().catch(() => '')
        }

        const status = response.status
        if (status === 400 && errorDetail.toLowerCase().includes('model')) {
          lastError = `Model ${model} not available`; continue
        }
        if (status === 404) { lastError = `Model ${model} not found`; continue }
        if (status === 401) throw new Error(`Invalid API key. ${errorDetail}`)
        if (status === 429) throw new Error('Rate limit exceeded. Please wait a moment and try again.')
        if (status === 529) throw new Error('Our AI advisor is currently busy. Please try again shortly.')
        throw new Error(`API error (${status}): ${errorDetail}`)
      }

      const data = await response.json()
      if (data.content && data.content.length > 0 && data.content[0].type === 'text') {
        return data.content[0].text
      }
      throw new Error('Unexpected response format.')
    } catch (err) {
      if (err instanceof Error && (err.message.includes('not available') || err.message.includes('not found'))) {
        lastError = err.message; continue
      }
      throw err
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`)
}

// ─────────────────────────────────────────────────────────────
// SIMULATED RESPONSES (fallback when API unavailable)
// ─────────────────────────────────────────────────────────────

export function getClientSimulatedResponse(userMsg: string): string {
  const q = userMsg.toLowerCase()

  if (q.includes('portfolio') || q.includes('performing') || q.includes('return')) {
    return `**Portfolio Overview**\n\nYour portfolio performance is tracked in real-time on the **Portfolio** tab. Key things to know:\n\n- **NAV** (Net Asset Value) is updated quarterly based on the fund's audited valuations\n- Returns are calculated on an IRR (Internal Rate of Return) basis\n- AIF returns are typically measured over 3-5 year horizons for meaningful comparison\n\n**Tip:** Check your Portfolio tab for the latest NAV, allocation breakdown, and historical performance chart.\n\nWould you like to know more about how NAV is calculated, or about our investment strategy?`
  }

  if (q.includes('nav') || q.includes('valuation')) {
    return `**Understanding NAV Updates**\n\nThe NAV (Net Asset Value) of your investment reflects the per-unit value of the fund after accounting for:\n\n- **Asset valuations** — Real estate and equity holdings are valued by independent valuers\n- **Expenses** — Management fees, operational costs are deducted\n- **Accrued income** — Rental yields, dividends, and interest are included\n\nNAV is typically updated **quarterly** as per SEBI regulations for Category II AIFs.\n\n⚠️ *Past performance does not guarantee future returns. AIF investments are subject to market risks.*\n\nWould you like to understand our fee structure or investment allocation strategy?`
  }

  if (q.includes('kyc') || q.includes('document') || q.includes('onboard')) {
    return `**KYC Requirements for AIF Investment**\n\nTo complete your onboarding, you'll need:\n\n📋 **Essential Documents:**\n- PAN Card (mandatory)\n- Aadhaar Card / Passport\n- Address Proof (utility bill < 3 months old)\n- Bank Statement (last 6 months)\n- Cancelled Cheque\n- Passport-size Photograph\n\n📝 **Declarations:**\n- FATCA Self-Declaration\n- Risk Profile Assessment\n- Investment Agreement\n\n**Status:** Check your **KYC & Documents** tab to see what's pending.\n\nNeed help uploading documents? I can guide you through the process.`
  }

  if (q.includes('nri') || q.includes('foreign') || q.includes('overseas') || q.includes('repatri')) {
    return `**NRI Investment in GHL India Ventures**\n\nAs an NRI, you can invest in our AIF through:\n\n🏦 **Account Requirements:**\n- NRE Account — For repatriable investments\n- NRO Account — For non-repatriable investments\n\n📜 **Regulatory Framework:**\n- Governed by FEMA (Foreign Exchange Management Act)\n- RBI's Liberalised Remittance Scheme (LRS) limits apply\n- DTAA benefits available depending on country of residence\n\n💡 **Key Benefits for NRIs:**\n- Exposure to India's high-growth alternative asset market\n- Professional fund management with SEBI oversight\n- Quarterly NAV reporting and transparent fee structure\n\nFor country-specific tax implications, please consult a qualified CA.\n\nWant to know more about our NRI-specific investment routes?`
  }

  if (q.includes('tax') || q.includes('tds') || q.includes('115ub')) {
    return `**AIF Taxation Overview**\n\nCategory II AIFs like GHL India Ventures follow **pass-through taxation** under Section 115UB:\n\n📊 **How it works:**\n- Income (except business income) is taxed in the hands of **investors**, not the fund\n- The fund deducts **TDS at 10%** on income distributed to investors\n- Capital gains retain their character (short-term/long-term) when passed through\n\n💰 **Key Tax Considerations:**\n- LTCG on equity: 10% above ₹1L (after 12 months)\n- LTCG on debt/real estate: 20% with indexation (after 36 months)\n- TDS certificates are provided for your ITR filing\n\n⚠️ *This is general information only. Please consult a qualified Chartered Accountant for your specific tax situation.*\n\nWould you like to know about our fee structure or investment strategy?`
  }

  if (q.includes('fee') || q.includes('charge') || q.includes('cost') || q.includes('expense')) {
    return `**GHL India Ventures Fee Structure**\n\nAs a SEBI-regulated AIF, our fee structure is transparent:\n\n📋 **Standard Fees:**\n- **Management Fee:** Annual fee on committed capital (details in your Investment Agreement)\n- **Performance Fee:** Charged above a hurdle rate, aligned with investor interests\n- **Operating Expenses:** Audit, legal, custody — capped as per SEBI guidelines\n\n✅ **Investor-Friendly Features:**\n- No entry/exit load\n- Quarterly reporting with full fee transparency\n- Performance fee only above hurdle rate (high watermark applied)\n\nYour specific fee details are outlined in the Private Placement Memorandum (PPM) and Investment Agreement.\n\nWant me to explain how the performance fee calculation works?`
  }

  if (q.includes('referral') || q.includes('refer') || q.includes('invite')) {
    return `**GHL Referral Program**\n\nEarn rewards by introducing qualified investors to GHL India Ventures!\n\n🎁 **How It Works:**\n1. Share your unique referral link from the **Referrals** tab\n2. Your referral completes KYC and invests\n3. Both you and your referral receive benefits\n\n📋 **Eligibility:**\n- Referred investor must meet minimum investment criteria (₹1Cr)\n- Referral must be a new investor (not existing GHL client)\n\nCheck your **Referrals** tab for your unique link and tracking dashboard.\n\nWould you like help sharing your referral link?`
  }

  return `Thank you for your question! Here's what I can help you with:\n\n📊 **Portfolio & Returns** — NAV updates, performance tracking, allocation strategy\n📋 **KYC & Onboarding** — Document requirements, verification status\n💰 **Investment Products** — Fund categories, risk profiles, minimum investments\n🌏 **NRI Investments** — FEMA rules, account requirements, repatriation\n📈 **Tax & Compliance** — AIF taxation, TDS, SEBI regulations\n🎁 **Referrals** — How to refer and earn rewards\n\nPlease ask about any of these topics and I'll provide detailed guidance!\n\n⚠️ *For account-specific queries, your Relationship Manager is available through the Support tab.*`
}
