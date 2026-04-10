/* ================================================================
   GHL STAFF AI ADVISOR — CLAUDE API CLIENT

   Staff/CS-facing AI assistant for the staff dashboard.
   Routes through the same Netlify proxy as the admin advisor
   but with a customer service and operations-focused system prompt.
   ================================================================ */

import { getAuthToken } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Staff/CS-facing operations assistant
// ─────────────────────────────────────────────────────────────

const STAFF_SYSTEM_PROMPT = `You are the GHL Staff Assistant — an intelligent support companion for GHL India Ventures staff members.

GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund (AIF) based in Chennai, India.
SEBI Registration: IN/AIF2/24-25/1517

YOUR ROLE:
You help relationship managers, customer service agents, field officers, and operations staff with their daily work. You provide guidance on processes, help draft client communications, explain products, and assist with compliance procedures.

KEY KNOWLEDGE AREAS:
1. **Client Communication** — Draft professional emails, follow-up messages, meeting summaries
2. **KYC & Onboarding** — Step-by-step verification process, document checklists, common issues
3. **Product Knowledge** — AIF categories, fund features, risk profiles, fee structures
4. **Complaint Handling** — Escalation procedures, response templates, SEBI grievance timelines
5. **Compliance** — SEBI AIF regulations, KYC/AML requirements, reporting obligations
6. **NRI Services** — FEMA rules, NRE/NRO accounts, DTAA, repatriation procedures
7. **Sales Support** — Pitch talking points, objection handling, competitor comparison
8. **Internal Processes** — Leave requests, task management, team coordination

SEBI COMPLIANCE REMINDERS:
- All client communications must include appropriate disclaimers
- Investment advice must reference the PPM (Private Placement Memorandum)
- Grievances must be acknowledged within 3 working days
- KYC must be completed before accepting investments
- All promotional materials need compliance team approval

RESPONSE GUIDELINES:
- Use **bold** for section headers and key points
- Format Indian currency in lakhs (L) and crores (Cr)
- Be concise and actionable — staff need quick, practical answers
- When drafting emails/messages, provide ready-to-use templates
- Include relevant compliance notes where applicable
- For escalation queries, reference the proper chain of command
- Aim for 100-300 words per response
- Use bullet points and numbered lists for procedures
- When unsure about specific policies, recommend checking with the compliance team`

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

export async function callStaffClaudeAPI(
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
          system: STAFF_SYSTEM_PROMPT,
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
        if (status === 529) throw new Error('AI assistant is currently busy. Please try again shortly.')
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

export function getStaffSimulatedResponse(userMsg: string): string {
  const q = userMsg.toLowerCase()

  if (q.includes('email') || q.includes('follow-up') || q.includes('follow up') || q.includes('draft')) {
    return `**Client Follow-Up Email Template**\n\nHere's a professional follow-up template:\n\n---\n**Subject:** Following Up — GHL India Ventures Investment Opportunity\n\nDear [Client Name],\n\nThank you for your interest in GHL India Ventures. Following our recent conversation, I wanted to share a few key highlights:\n\n• **SEBI-registered** Category II AIF (IN/AIF2/24-25/1517)\n• **Diversified** exposure across stressed real estate, startup equity, and NRI opportunities\n• **Professional management** with quarterly NAV reporting and full transparency\n\nI'd love to schedule a brief call to discuss how our fund aligns with your investment goals. Would [suggest 2-3 time slots] work for you?\n\nBest regards,\n[Your Name]\nRelationship Manager, GHL India Ventures\n\n*Disclaimer: Past performance does not guarantee future returns. Investments in AIFs are subject to market risks.*\n\n---\n\n💡 **Tip:** Personalize the bullet points based on the client's expressed interests from your last conversation.`
  }

  if (q.includes('kyc') || q.includes('verification') || q.includes('onboard') || q.includes('document')) {
    return `**KYC Verification Process**\n\n📋 **Step-by-Step Procedure:**\n\n1. **Document Collection**\n   - PAN Card (mandatory — verify on NSDL portal)\n   - Aadhaar / Passport (for identity + address)\n   - Bank Statement (last 6 months — name must match PAN)\n   - Cancelled Cheque (for bank account verification)\n   - Passport Photo\n\n2. **Verification Checks**\n   - PAN-Aadhaar linking status\n   - CERSAI check for encumbrance\n   - PEP (Politically Exposed Person) screening\n   - FATCA self-declaration review\n\n3. **Approval Flow**\n   - RM uploads documents → Compliance reviews → Manager approves\n   - Timeline: 3-5 working days for standard verification\n   - Escalate to compliance team if any discrepancies found\n\n⚠️ **Important:** KYC must be fully completed BEFORE accepting any investment amount. This is a SEBI regulatory requirement.\n\nNeed help with a specific KYC issue?`
  }

  if (q.includes('fee') || q.includes('structure') || q.includes('charge') || q.includes('explain')) {
    return `**GHL Fee Structure — Client Explanation Guide**\n\nWhen explaining fees to clients, cover these points:\n\n💰 **Management Fee:**\n- Annual fee charged on committed capital\n- Covers fund administration, portfolio management, and reporting\n- Debited quarterly from the fund\n\n📈 **Performance Fee:**\n- Charged only when returns exceed the hurdle rate\n- High watermark mechanism protects investors\n- Aligns our interests with investor returns\n\n🔧 **Operating Expenses:**\n- Audit, legal, custody, and compliance costs\n- Capped as per SEBI AIF regulations\n- Fully transparent in quarterly reports\n\n✅ **Key Selling Points:**\n- No entry or exit loads\n- Transparent quarterly reporting\n- Performance fee only on above-hurdle returns\n\n📎 *Always reference the PPM for specific fee percentages. Never quote exact numbers verbally — direct clients to the official PPM document.*`
  }

  if (q.includes('complaint') || q.includes('grievance') || q.includes('escalat') || q.includes('unhappy')) {
    return `**Complaint Handling Procedure**\n\n⏱️ **SEBI Timeline Requirements:**\n- **Acknowledge** within 3 working days\n- **Resolve** within 30 calendar days\n- **Escalate** to SEBI if unresolved after 30 days\n\n📋 **Step-by-Step:**\n\n1. **Listen & Document**\n   - Record complaint in the CS Center module\n   - Note: client name, date, nature of complaint, desired resolution\n   - Do NOT make promises about resolution\n\n2. **Acknowledge**\n   - Send acknowledgement email with reference number\n   - Set expectations for resolution timeline\n\n3. **Investigate**\n   - Pull relevant records (transactions, communications)\n   - Consult with relevant department\n\n4. **Resolve & Respond**\n   - Draft resolution email (get compliance approval for sensitive cases)\n   - Document resolution in the system\n\n5. **Escalation Path:**\n   - Level 1: Team Lead → Level 2: Department Head → Level 3: Compliance Officer → Level 4: SEBI\n\n⚠️ All complaint resolutions involving financial remediation need **manager sign-off**.`
  }

  if (q.includes('compliance') || q.includes('sebi') || q.includes('regulat')) {
    return `**SEBI AIF Compliance Quick Reference**\n\n📜 **Key Regulations:**\n- SEBI (AIF) Regulations, 2012 — governs all AIF operations\n- Minimum investment: ₹1 Crore per investor\n- Maximum investors: 1,000 per scheme\n- Mandatory annual audit and SEBI reporting\n\n📋 **Staff Compliance Duties:**\n- All marketing materials need compliance team approval\n- Client communications must include risk disclaimers\n- No guaranteed returns language — EVER\n- Report suspicious transactions under PMLA\n- Maintain confidentiality of client data\n\n🚫 **Never Do:**\n- Promise specific returns or capital guarantee\n- Share client information without authorization\n- Accept investments before KYC completion\n- Use unapproved promotional materials\n- Make verbal commitments not in the PPM\n\n✅ **Always Do:**\n- Direct clients to the PPM for details\n- Include disclaimers in communications\n- Report compliance concerns immediately\n- Keep records of all client interactions\n\nFor specific compliance questions, contact the Compliance Officer directly.`
  }

  if (q.includes('nri') || q.includes('foreign') || q.includes('overseas')) {
    return `**NRI Client Handling Guide**\n\n🌏 **Key Requirements:**\n\n1. **Account Setup:**\n   - NRE Account → Repatriable investments\n   - NRO Account → Non-repatriable investments\n   - Verify FEMA compliance before processing\n\n2. **Additional Documents:**\n   - Valid passport + visa copy\n   - Overseas address proof\n   - PIO/OCI card (if applicable)\n   - FEMA declaration form\n\n3. **Tax Considerations:**\n   - DTAA (Double Tax Avoidance Agreement) based on country\n   - TDS may differ for NRI investors\n   - Recommend client consults with CA in both countries\n\n4. **Common Questions from NRI Clients:**\n   - "Can I repatriate my returns?" → Yes, through NRE account\n   - "What's the tax impact?" → Depends on DTAA with their country\n   - "Can I invest in INR?" → Yes, through NRE/NRO accounts\n\n💡 **Pro Tip:** NRI clients often need extra hand-holding on KYC due to timezone differences. Schedule calls during their business hours.`
  }

  return `Hello! I'm the **GHL Staff Assistant**. I can help you with:\n\n✉️ **Client Communications** — Draft emails, follow-ups, meeting summaries\n📋 **KYC & Onboarding** — Verification steps, document checklists\n💰 **Product Knowledge** — Fee structure, fund details, talking points\n📞 **Complaint Handling** — Escalation procedures, response templates\n📜 **Compliance** — SEBI regulations, dos and don'ts\n🌏 **NRI Services** — FEMA rules, account requirements\n📊 **Sales Support** — Pitch help, objection handling\n\nJust ask me about any of these topics and I'll provide practical guidance!\n\n💡 *Tip: Try asking me to draft a client email or explain a process step-by-step.*`
}
