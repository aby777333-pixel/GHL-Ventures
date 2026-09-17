// Plan-wise investment document map — single source of truth for
// investor "Investment Documents" tab and admin Sales modal.

export type PlanKind = 'debenture' | 'direct_aif'

export interface PlanDocSlot {
  type: string          // value stored in investment_documents.document_type
  label: string         // name shown to investor / admin
  aliases?: string[]    // older document_type values that mean the same doc
  signable?: boolean    // investor must upload a signed copy
  generatable?: boolean // admin can auto-generate from template
}

export const PLAN_DOCS: Record<PlanKind, PlanDocSlot[]> = {
  debenture: [
    { type: 'acknowledgement', label: 'Acknowledgment Letter', generatable: true },
    { type: 'agreement', label: 'Debenture Agreement', aliases: ['debenture_agreement'], signable: true, generatable: true },
    { type: 'allotment', label: 'Debenture Allotment Letter', aliases: ['allotment_letter'], generatable: true },
    { type: 'certificate', label: 'Debenture Certificate (Physical or Demat)', aliases: ['debenture_certificate'], generatable: true },
  ],
  direct_aif: [
    { type: 'acknowledgement', label: 'Acknowledgment Letter' },
    { type: 'ppm', label: 'PPM (Private Placement Memorandum)' },
    { type: 'contribution_agreement', label: 'Contribution Agreement', signable: true },
    { type: 'capital_call_notice', label: 'Capital Call Notice' },
    { type: 'nav_statement', label: 'NAV Statement' },
  ],
}

const DIRECT_AIF_RE = /direct\s*aif/i

/** Accepts a plan/fund name string or an investment/application object. */
const PLAN_KEYS = ['fund_vehicle', 'fund_name', 'plan_name', 'scheme_name', 'fund_type', 'route']
export function getPlanKind(src: any): PlanKind {
  if (!src) return 'debenture'
  if (typeof src === 'string') return DIRECT_AIF_RE.test(src) ? 'direct_aif' : 'debenture'
  const objs: any[] = [src, src.fund, src.plan, src.funds, src.plans]
  for (const obj of objs) {
    if (!obj || typeof obj !== 'object') continue
    for (const k of PLAN_KEYS) {
      const v = obj[k]
      if (typeof v === 'string' && DIRECT_AIF_RE.test(v)) return 'direct_aif'
    }
  }
  return 'debenture'
}

export function getPlanDocs(src: any): PlanDocSlot[] {
  return PLAN_DOCS[getPlanKind(src)]
}

export function slotMatches(slot: PlanDocSlot, docType?: string | null): boolean {
  if (!docType) return false
  return docType === slot.type || (slot.aliases || []).includes(docType)
}

export function isSignableType(docType?: string | null): boolean {
  if (!docType) return false
  return Object.values(PLAN_DOCS).flat().some(s => s.signable && slotMatches(s, docType))
}
