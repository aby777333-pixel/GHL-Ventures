/* ════════════════════════════════════════════════════════════════
   NOTIFY — Client-side helper for WhatsApp + Email channels

   Pending 30-04-2026 — Items 11/12. Wraps the two Netlify functions
   so the rest of the app calls a single helper.

   Email goes through /.netlify/functions/send-email (Resend or MSG91
   fallback). WhatsApp goes through /.netlify/functions/whatsapp-send
   (WATI).

   All helpers swallow errors and return false on failure — they're
   best-effort side effects, never block the user-facing action.
   ════════════════════════════════════════════════════════════════ */

const FN_BASE = '/.netlify/functions'

export type WhatsAppPayload = {
  to: string
  text?: string
  template_name?: string
  broadcast_name?: string
  parameters?: { name: string; value: string }[]
  media_url?: string
  media_filename?: string
}

export type EmailPayload = {
  recipients: string[]
  subject: string
  body: string
  senderName?: string
}

export async function sendWhatsApp(payload: WhatsAppPayload): Promise<boolean> {
  if (!payload.to) return false
  try {
    const res = await fetch(`${FN_BASE}/whatsapp-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const t = await res.text()
      console.warn('[notify] WhatsApp send failed:', res.status, t)
      return false
    }
    return true
  } catch (e) {
    console.warn('[notify] WhatsApp error:', (e as any)?.message)
    return false
  }
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!payload.recipients || payload.recipients.length === 0) return false
  try {
    const res = await fetch(`${FN_BASE}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) {
      console.warn('[notify] Email send failed:', res.status, data)
      return false
    }
    return true
  } catch (e) {
    console.warn('[notify] Email error:', (e as any)?.message)
    return false
  }
}

// ── High-level event wrappers ─────────────────────────────────────
// These are the call-sites the spec lists in items 12.b–12.h. Each
// uses session text by default; switch to template_name once your
// WATI templates are approved.

export async function notifyKycSubmittedAdmin(opts: {
  adminPhones: string[]; investorName: string
}): Promise<void> {
  const text = `📋 New KYC Submission\n${opts.investorName} has submitted KYC for review on the GHL India Ventures admin panel.`
  await Promise.all(opts.adminPhones.map(p => sendWhatsApp({ to: p, text })))
}

export async function notifyInvestmentSubmittedAdmin(opts: {
  adminPhones: string[]; adminEmails: string[]; investorName: string;
  amount: number; fund: string
}): Promise<void> {
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n)
  const text = `💰 New Investment Submission\n${opts.investorName} submitted an investment of ₹${fmt(opts.amount)} in ${opts.fund}.`
  await Promise.all([
    ...opts.adminPhones.map(p => sendWhatsApp({ to: p, text })),
    opts.adminEmails.length > 0 ? sendEmail({
      recipients: opts.adminEmails,
      subject: `New Investment: ${opts.investorName} — ₹${fmt(opts.amount)}`,
      body: `${opts.investorName} has submitted a new investment of ₹${fmt(opts.amount)} in ${opts.fund}.\n\nReview it on the admin panel.`,
      senderName: 'GHL India Ventures',
    }) : Promise.resolve(false),
  ])
}

export async function notifyKycDecisionInvestor(opts: {
  investorPhone: string; investorName: string;
  decision: 'approved' | 'rejected'; reason?: string
}): Promise<void> {
  const text = opts.decision === 'approved'
    ? `✅ KYC Approved\nHi ${opts.investorName}, your KYC has been approved. You can now invest on GHL India Ventures.`
    : `❌ KYC Update\nHi ${opts.investorName}, your KYC could not be approved.${opts.reason ? `\nReason: ${opts.reason}` : ''}\nPlease log in to update and resubmit.`
  await sendWhatsApp({ to: opts.investorPhone, text })
}

export async function notifyInvestmentDecisionInvestor(opts: {
  investorPhone: string; investorName: string;
  decision: 'approved' | 'rejected'; fund: string; amount?: number; reason?: string
}): Promise<void> {
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n)
  const amt = opts.amount ? ` of ₹${fmt(opts.amount)}` : ''
  const text = opts.decision === 'approved'
    ? `🎉 Investment Approved\nHi ${opts.investorName}, your investment${amt} in ${opts.fund} has been approved.`
    : `Investment Update\nHi ${opts.investorName}, your investment${amt} in ${opts.fund} could not be approved.${opts.reason ? `\nReason: ${opts.reason}` : ''}`
  await sendWhatsApp({ to: opts.investorPhone, text })
}

export async function notifyPayoutStatusInvestor(opts: {
  investorPhone: string; investorName: string;
  amount: number; status: string; dueDate?: string; fundType?: string
}): Promise<void> {
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n)
  const due = opts.dueDate ? ` (due ${opts.dueDate})` : ''
  const text = `Payout Update — ${opts.status.toUpperCase()}\nHi ${opts.investorName}, your ${opts.fundType || ''} payout of ₹${fmt(opts.amount)}${due} is now ${opts.status}.`
  await sendWhatsApp({ to: opts.investorPhone, text })
}

export async function notifySoftCopyUploadedInvestor(opts: {
  investorPhone: string; investorName: string;
  documentTitle: string; fileUrl: string; fileName?: string
}): Promise<void> {
  const text = `📎 Document Available\nHi ${opts.investorName}, your ${opts.documentTitle} is ready. Tap below to download.`
  await sendWhatsApp({
    to: opts.investorPhone,
    media_url: opts.fileUrl,
    media_filename: opts.fileName || `${opts.documentTitle}.pdf`,
    text,
  })
}

export async function notifyTdsCertificateInvestor(opts: {
  investorPhone: string; investorName: string;
  fileUrl: string; fileName?: string
}): Promise<void> {
  const text = `📄 TDS Certificate Available\nHi ${opts.investorName}, your TDS certificate has been uploaded. Tap below to download.`
  await sendWhatsApp({
    to: opts.investorPhone,
    media_url: opts.fileUrl,
    media_filename: opts.fileName || 'TDS_Certificate.pdf',
    text,
  })
}

export async function notifyMaturityReminderInvestor(opts: {
  investorPhone: string; investorName: string;
  fund: string; maturityDate: string; amount?: number
}): Promise<void> {
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n)
  const amt = opts.amount ? `₹${fmt(opts.amount)}` : ''
  const text = `⏰ Maturity Reminder\nHi ${opts.investorName}, your ${opts.fund} investment ${amt} is maturing on ${opts.maturityDate} (one month from now). Please contact us to plan renewal or redemption.`
  await sendWhatsApp({ to: opts.investorPhone, text })
}
