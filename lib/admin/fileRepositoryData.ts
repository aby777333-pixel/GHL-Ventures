/* ================================================================
   File Repository Mock Data — Comprehensive seed data for the
   file repository module. Used when Supabase is not configured.

   15 root folders, ~50 subfolders, ~45 files, versions, audit log.
   All data uses realistic GHL India Ventures context.
   ================================================================ */

import type {
  RepoFolder, FolderNode, RepoFile, RepoVersion, RepoAuditEntry, RepoShare, StorageStats,
} from './fileRepositoryTypes'

// ═══════════════════════════════════════════════════════════════
// FOLDERS — 15 root + ~50 children
// ═══════════════════════════════════════════════════════════════

export const MOCK_FOLDERS: RepoFolder[] = [
  // ── Root Folders ──────────────────────────────────────────────
  { id: 'FLD-001', name: 'Fund Documents', slug: 'fund', parentId: null, path: '/fund', description: 'PPMs, NAV reports, capital calls, side letters', icon: 'Briefcase', color: '#DC2626', sortOrder: 1, isSystem: true, childCount: 6, fileCount: 8, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-20T10:00:00Z' },
  { id: 'FLD-002', name: 'Compliance & Regulatory', slug: 'compliance', parentId: null, path: '/compliance', description: 'SEBI filings, AML/KYC master, RBI submissions', icon: 'Shield', color: '#F59E0B', sortOrder: 2, isSystem: true, childCount: 5, fileCount: 6, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-18T14:00:00Z' },
  { id: 'FLD-003', name: 'Client Documents', slug: 'clients', parentId: null, path: '/clients', description: 'Per-client KYC, agreements, correspondence', icon: 'Users', color: '#3B82F6', sortOrder: 3, isSystem: true, childCount: 3, fileCount: 5, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-22T09:00:00Z' },
  { id: 'FLD-004', name: 'Employee Records', slug: 'employees', parentId: null, path: '/employees', description: 'Offer letters, ID proofs, appraisals, exits', icon: 'UserCircle', color: '#10B981', sortOrder: 4, isSystem: true, childCount: 4, fileCount: 3, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-15T11:00:00Z' },
  { id: 'FLD-005', name: 'Financial Records', slug: 'financial', parentId: null, path: '/financial', description: 'Invoices, receipts, tax filings, bank statements', icon: 'IndianRupee', color: '#8B5CF6', sortOrder: 5, isSystem: true, childCount: 4, fileCount: 4, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-10T16:00:00Z' },
  { id: 'FLD-006', name: 'Marketing Assets', slug: 'marketing', parentId: null, path: '/marketing', description: 'Brochures, pitch decks, ad creatives, brand guidelines', icon: 'Megaphone', color: '#EC4899', sortOrder: 6, isSystem: true, childCount: 4, fileCount: 4, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-19T13:00:00Z' },
  { id: 'FLD-007', name: 'Legal', slug: 'legal', parentId: null, path: '/legal', description: 'Contracts, MOUs, NDAs, litigation files', icon: 'Scale', color: '#6366F1', sortOrder: 7, isSystem: true, childCount: 4, fileCount: 3, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-15T10:00:00Z' },
  { id: 'FLD-008', name: 'Board & Governance', slug: 'board', parentId: null, path: '/board', description: 'Board minutes, resolutions, committee agendas', icon: 'Building2', color: '#D4AF37', sortOrder: 8, isSystem: true, childCount: 3, fileCount: 3, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-01T15:00:00Z' },
  { id: 'FLD-009', name: 'Internal Operations', slug: 'internal', parentId: null, path: '/internal', description: 'SOPs, templates, training materials, handbooks', icon: 'Settings', color: '#06B6D4', sortOrder: 9, isSystem: true, childCount: 3, fileCount: 3, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-11-01T09:00:00Z' },
  { id: 'FLD-010', name: 'Reports & Analytics', slug: 'reports', parentId: null, path: '/reports', description: 'Generated reports, scheduled exports, custom analytics', icon: 'FileBarChart', color: '#F97316', sortOrder: 10, isSystem: true, childCount: 3, fileCount: 2, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-22T08:00:00Z' },
  { id: 'FLD-011', name: 'Sales & CRM', slug: 'sales', parentId: null, path: '/sales', description: 'Proposals, term sheets, deal memos, pitch decks', icon: 'TrendingUp', color: '#EF4444', sortOrder: 11, isSystem: true, childCount: 3, fileCount: 2, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-20T12:00:00Z' },
  { id: 'FLD-012', name: 'Technology', slug: 'technology', parentId: null, path: '/technology', description: 'Architecture docs, API specs, security audits', icon: 'Code', color: '#14B8A6', sortOrder: 12, isSystem: true, childCount: 3, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-20T17:00:00Z' },
  { id: 'FLD-013', name: 'Insurance & Risk', slug: 'insurance', parentId: null, path: '/insurance', description: 'Policies, claims, coverage documentation', icon: 'ShieldCheck', color: '#A855F7', sortOrder: 13, isSystem: true, childCount: 3, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-10T14:00:00Z' },
  { id: 'FLD-014', name: 'Correspondence', slug: 'correspondence', parentId: null, path: '/correspondence', description: 'Regulatory letters, client communications, notices', icon: 'Mail', color: '#0EA5E9', sortOrder: 14, isSystem: true, childCount: 2, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-12T11:00:00Z' },
  { id: 'FLD-015', name: 'Archives', slug: 'archives', parentId: null, path: '/archives', description: 'Closed funds, former clients, legacy records', icon: 'Archive', color: '#78716C', sortOrder: 15, isSystem: true, childCount: 3, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T10:00:00Z' },

  // ── Fund Documents Children ───────────────────────────────────
  { id: 'FLD-101', name: 'PPM & Offering', slug: 'ppm', parentId: 'FLD-001', path: '/fund/ppm', description: 'Private Placement Memoranda', icon: 'FileText', color: '#DC2626', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 2, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-15T10:00:00Z' },
  { id: 'FLD-102', name: 'NAV Reports', slug: 'nav-reports', parentId: 'FLD-001', path: '/fund/nav-reports', description: 'Net Asset Value reports', icon: 'BarChart3', color: '#DC2626', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 2, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'FLD-103', name: 'Capital Calls', slug: 'capital-calls', parentId: 'FLD-001', path: '/fund/capital-calls', description: 'Capital call notices', icon: 'PhoneCall', color: '#DC2626', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 2, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-05T10:00:00Z' },
  { id: 'FLD-104', name: 'Distribution Notices', slug: 'distributions', parentId: 'FLD-001', path: '/fund/distributions', description: 'Distribution notices & schedules', icon: 'ArrowDownRight', color: '#DC2626', sortOrder: 4, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-20T10:00:00Z' },
  { id: 'FLD-105', name: 'Side Letters', slug: 'side-letters', parentId: 'FLD-001', path: '/fund/side-letters', description: 'Investor side letters', icon: 'ScrollText', color: '#DC2626', sortOrder: 5, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-11-10T10:00:00Z' },
  { id: 'FLD-106', name: 'Subscription Docs', slug: 'subscription', parentId: 'FLD-001', path: '/fund/subscription', description: 'Subscription agreements', icon: 'FileSignature', color: '#DC2626', sortOrder: 6, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-08-01T10:00:00Z' },

  // ── Compliance Children ───────────────────────────────────────
  { id: 'FLD-201', name: 'SEBI Filings', slug: 'sebi', parentId: 'FLD-002', path: '/compliance/sebi', description: 'SEBI regulatory filings', icon: 'Shield', color: '#F59E0B', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 2, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-18T14:00:00Z' },
  { id: 'FLD-202', name: 'AML / KYC Master', slug: 'aml-kyc', parentId: 'FLD-002', path: '/compliance/aml-kyc', description: 'Anti-money laundering & KYC records', icon: 'ShieldCheck', color: '#F59E0B', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-30T10:00:00Z' },
  { id: 'FLD-203', name: 'RBI Submissions', slug: 'rbi', parentId: 'FLD-002', path: '/compliance/rbi', description: 'RBI regulatory submissions', icon: 'Building', color: '#F59E0B', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'FLD-204', name: 'Audit Reports', slug: 'audit', parentId: 'FLD-002', path: '/compliance/audit', description: 'Internal & external audit reports', icon: 'ClipboardCheck', color: '#F59E0B', sortOrder: 4, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-15T10:00:00Z' },
  { id: 'FLD-205', name: 'Policies & SOPs', slug: 'policies', parentId: 'FLD-002', path: '/compliance/policies', description: 'Compliance policies & standard operating procedures', icon: 'Book', color: '#F59E0B', sortOrder: 5, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-11-01T10:00:00Z' },

  // ── Client Documents Children ─────────────────────────────────
  { id: 'FLD-301', name: 'KYC Documents', slug: 'kyc', parentId: 'FLD-003', path: '/clients/kyc', description: 'Client KYC verification documents', icon: 'ShieldCheck', color: '#3B82F6', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 2, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-22T09:00:00Z' },
  { id: 'FLD-302', name: 'Agreements', slug: 'agreements', parentId: 'FLD-003', path: '/clients/agreements', description: 'Client investment agreements', icon: 'FileSignature', color: '#3B82F6', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 2, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-10T10:00:00Z' },
  { id: 'FLD-303', name: 'Correspondence', slug: 'client-correspondence', parentId: 'FLD-003', path: '/clients/correspondence', description: 'Client communications', icon: 'Mail', color: '#3B82F6', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-20T10:00:00Z' },

  // ── Employee Records Children ─────────────────────────────────
  { id: 'FLD-401', name: 'Offer Letters', slug: 'offers', parentId: 'FLD-004', path: '/employees/offers', description: 'Employment offer letters', icon: 'FileText', color: '#10B981', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-09-01T10:00:00Z' },
  { id: 'FLD-402', name: 'ID Proofs', slug: 'id-proofs', parentId: 'FLD-004', path: '/employees/id-proofs', description: 'Employee identity documents', icon: 'CreditCard', color: '#10B981', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-08-15T10:00:00Z' },
  { id: 'FLD-403', name: 'Appraisals', slug: 'appraisals', parentId: 'FLD-004', path: '/employees/appraisals', description: 'Performance appraisal records', icon: 'Star', color: '#10B981', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'FLD-404', name: 'Exits & Resignation', slug: 'exits', parentId: 'FLD-004', path: '/employees/exits', description: 'Resignation letters & exit documents', icon: 'LogOut', color: '#10B981', sortOrder: 4, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T10:00:00Z' },

  // ── Financial Records Children ────────────────────────────────
  { id: 'FLD-501', name: 'Invoices', slug: 'invoices', parentId: 'FLD-005', path: '/financial/invoices', description: 'Vendor & service invoices', icon: 'Receipt', color: '#8B5CF6', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-10T16:00:00Z' },
  { id: 'FLD-502', name: 'Tax Filings', slug: 'tax', parentId: 'FLD-005', path: '/financial/tax', description: 'GST, TDS, ITR filings', icon: 'Calculator', color: '#8B5CF6', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-31T10:00:00Z' },
  { id: 'FLD-503', name: 'Bank Statements', slug: 'bank', parentId: 'FLD-005', path: '/financial/bank', description: 'Monthly bank statements', icon: 'Building2', color: '#8B5CF6', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'FLD-504', name: 'Receipts', slug: 'receipts', parentId: 'FLD-005', path: '/financial/receipts', description: 'Payment receipts & acknowledgments', icon: 'FileCheck', color: '#8B5CF6', sortOrder: 4, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-05T10:00:00Z' },

  // ── Marketing Assets Children ─────────────────────────────────
  { id: 'FLD-601', name: 'Brochures', slug: 'brochures', parentId: 'FLD-006', path: '/marketing/brochures', description: 'Investment brochures & one-pagers', icon: 'BookOpen', color: '#EC4899', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-20T10:00:00Z' },
  { id: 'FLD-602', name: 'Pitch Decks', slug: 'pitches', parentId: 'FLD-006', path: '/marketing/pitches', description: 'Investor pitch presentations', icon: 'Presentation', color: '#EC4899', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-01T10:00:00Z' },
  { id: 'FLD-603', name: 'Ad Creatives', slug: 'ads', parentId: 'FLD-006', path: '/marketing/ads', description: 'Digital & print ad creatives', icon: 'Image', color: '#EC4899', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-05T10:00:00Z' },
  { id: 'FLD-604', name: 'Brand Guidelines', slug: 'brand', parentId: 'FLD-006', path: '/marketing/brand', description: 'Logo, colors, typography, usage rules', icon: 'Palette', color: '#EC4899', sortOrder: 4, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-10-01T10:00:00Z' },

  // ── Legal Children ────────────────────────────────────────────
  { id: 'FLD-701', name: 'Contracts', slug: 'contracts', parentId: 'FLD-007', path: '/legal/contracts', description: 'Service & vendor contracts', icon: 'FileSignature', color: '#6366F1', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-15T10:00:00Z' },
  { id: 'FLD-702', name: 'MOUs & NDAs', slug: 'mou-nda', parentId: 'FLD-007', path: '/legal/mou-nda', description: 'Memoranda of understanding & NDAs', icon: 'Handshake', color: '#6366F1', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T10:00:00Z' },
  { id: 'FLD-703', name: 'Litigation', slug: 'litigation', parentId: 'FLD-007', path: '/legal/litigation', description: 'Court filings & legal proceedings', icon: 'Gavel', color: '#6366F1', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-09-15T10:00:00Z' },
  { id: 'FLD-704', name: 'Regulatory Opinions', slug: 'opinions', parentId: 'FLD-007', path: '/legal/opinions', description: 'Legal opinions & advisory memos', icon: 'BookOpen', color: '#6366F1', sortOrder: 4, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-07-01T10:00:00Z' },

  // ── Board & Governance Children ───────────────────────────────
  { id: 'FLD-801', name: 'Board Minutes', slug: 'minutes', parentId: 'FLD-008', path: '/board/minutes', description: 'Board meeting minutes', icon: 'ClipboardList', color: '#D4AF37', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-01T15:00:00Z' },
  { id: 'FLD-802', name: 'Resolutions', slug: 'resolutions', parentId: 'FLD-008', path: '/board/resolutions', description: 'Board resolutions', icon: 'CheckSquare', color: '#D4AF37', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-15T10:00:00Z' },
  { id: 'FLD-803', name: 'Committee Agendas', slug: 'agendas', parentId: 'FLD-008', path: '/board/agendas', description: 'Committee meeting agendas', icon: 'Calendar', color: '#D4AF37', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-20T10:00:00Z' },

  // ── Internal Operations Children ──────────────────────────────
  { id: 'FLD-901', name: 'SOPs', slug: 'sops', parentId: 'FLD-009', path: '/internal/sops', description: 'Standard operating procedures', icon: 'ListChecks', color: '#06B6D4', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-11-01T09:00:00Z' },
  { id: 'FLD-902', name: 'Templates', slug: 'templates', parentId: 'FLD-009', path: '/internal/templates', description: 'Document templates & forms', icon: 'LayoutTemplate', color: '#06B6D4', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-09-01T10:00:00Z' },
  { id: 'FLD-903', name: 'Training Materials', slug: 'training', parentId: 'FLD-009', path: '/internal/training', description: 'Onboarding & training resources', icon: 'GraduationCap', color: '#06B6D4', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-08-15T10:00:00Z' },

  // ── Reports & Analytics Children ──────────────────────────────
  { id: 'FLD-A01', name: 'Generated Reports', slug: 'generated', parentId: 'FLD-010', path: '/reports/generated', description: 'Auto-generated system reports', icon: 'FileBarChart', color: '#F97316', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-22T08:00:00Z' },
  { id: 'FLD-A02', name: 'Scheduled Exports', slug: 'scheduled', parentId: 'FLD-010', path: '/reports/scheduled', description: 'Scheduled report exports', icon: 'Clock', color: '#F97316', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-15T10:00:00Z' },
  { id: 'FLD-A03', name: 'Custom Analytics', slug: 'custom', parentId: 'FLD-010', path: '/reports/custom', description: 'Custom analysis exports', icon: 'PieChart', color: '#F97316', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T10:00:00Z' },

  // ── Sales & CRM Children ──────────────────────────────────────
  { id: 'FLD-B01', name: 'Proposals', slug: 'proposals', parentId: 'FLD-011', path: '/sales/proposals', description: 'Investment proposals', icon: 'FileText', color: '#EF4444', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-20T12:00:00Z' },
  { id: 'FLD-B02', name: 'Term Sheets', slug: 'term-sheets', parentId: 'FLD-011', path: '/sales/term-sheets', description: 'Deal term sheets', icon: 'FileCheck', color: '#EF4444', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'FLD-B03', name: 'Deal Memos', slug: 'deal-memos', parentId: 'FLD-011', path: '/sales/deal-memos', description: 'Internal deal memos', icon: 'Clipboard', color: '#EF4444', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-11-01T10:00:00Z' },

  // ── Technology Children ───────────────────────────────────────
  { id: 'FLD-C01', name: 'Architecture Docs', slug: 'architecture', parentId: 'FLD-012', path: '/technology/architecture', description: 'System architecture documentation', icon: 'Network', color: '#14B8A6', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-20T17:00:00Z' },
  { id: 'FLD-C02', name: 'API Specs', slug: 'api-specs', parentId: 'FLD-012', path: '/technology/api-specs', description: 'API documentation & OpenAPI specs', icon: 'Code2', color: '#14B8A6', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-10-01T10:00:00Z' },
  { id: 'FLD-C03', name: 'Security Audits', slug: 'security', parentId: 'FLD-012', path: '/technology/security', description: 'Security audit & penetration test reports', icon: 'ShieldAlert', color: '#14B8A6', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-09-01T10:00:00Z' },

  // ── Insurance & Risk Children ─────────────────────────────────
  { id: 'FLD-D01', name: 'Policies', slug: 'insurance-policies', parentId: 'FLD-013', path: '/insurance/policies', description: 'Insurance policies', icon: 'FileText', color: '#A855F7', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-10T14:00:00Z' },
  { id: 'FLD-D02', name: 'Claims', slug: 'claims', parentId: 'FLD-013', path: '/insurance/claims', description: 'Insurance claims records', icon: 'AlertTriangle', color: '#A855F7', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T10:00:00Z' },
  { id: 'FLD-D03', name: 'Coverage', slug: 'coverage', parentId: 'FLD-013', path: '/insurance/coverage', description: 'Coverage analysis documents', icon: 'Shield', color: '#A855F7', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-05-01T10:00:00Z' },

  // ── Correspondence Children ───────────────────────────────────
  { id: 'FLD-E01', name: 'Regulatory Letters', slug: 'regulatory', parentId: 'FLD-014', path: '/correspondence/regulatory', description: 'Correspondence with regulators', icon: 'Mail', color: '#0EA5E9', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 1, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-02-12T11:00:00Z' },
  { id: 'FLD-E02', name: 'Client Communications', slug: 'client-comms', parentId: 'FLD-014', path: '/correspondence/client-comms', description: 'Formal client communications', icon: 'MessageSquare', color: '#0EA5E9', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-11-01T10:00:00Z' },

  // ── Archives Children ─────────────────────────────────────────
  { id: 'FLD-F01', name: 'Closed Funds', slug: 'closed-funds', parentId: 'FLD-015', path: '/archives/closed-funds', description: 'Documents from closed fund vehicles', icon: 'FolderClosed', color: '#78716C', sortOrder: 1, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T10:00:00Z' },
  { id: 'FLD-F02', name: 'Former Clients', slug: 'former-clients', parentId: 'FLD-015', path: '/archives/former-clients', description: 'Archived former client records', icon: 'UserMinus', color: '#78716C', sortOrder: 2, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T10:00:00Z' },
  { id: 'FLD-F03', name: 'Legacy Records', slug: 'legacy', parentId: 'FLD-015', path: '/archives/legacy', description: 'Pre-digital & historical records', icon: 'Archive', color: '#78716C', sortOrder: 3, isSystem: true, childCount: 0, fileCount: 0, createdBy: 'USR001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
]

// ═══════════════════════════════════════════════════════════════
// FILES — ~45 realistic documents
// ═══════════════════════════════════════════════════════════════

export const MOCK_REPO_FILES: RepoFile[] = [
  // ── Fund Documents ────────────────────────────────────────────
  { id: 'FILE-001', title: 'Private Placement Memorandum v3.2', description: 'GHL India Growth Fund I — PPM for qualified investors', fileName: 'GHL_PPM_v3.2.pdf', fileUrl: '/mock/ppm-v3.2.pdf', fileType: 'pdf', fileSize: 5033164, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-101', folderPath: '/fund/ppm', tags: ['PPM', 'fund', 'legal', 'investors'], version: 3, isTemplate: false, isConfidential: true, accessLevel: 'restricted', starred: true, downloadCount: 45, entityType: 'fund', uploadedBy: 'USR001', uploadedByName: 'Abe Thayil', approvedBy: 'USR004', approvedAt: '2024-12-20T10:00:00Z', createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-12-15T10:00:00Z' },
  { id: 'FILE-002', title: 'GHL Fund I — Information Memorandum', description: 'Detailed fund information for prospective investors', fileName: 'GHL_Info_Memo_2025.pdf', fileUrl: '/mock/info-memo.pdf', fileType: 'pdf', fileSize: 3145728, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-101', folderPath: '/fund/ppm', tags: ['info memo', 'fund', 'investors'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 22, entityType: 'fund', uploadedBy: 'USR003', uploadedByName: 'Rajesh Sundaram', createdAt: '2024-09-01T10:00:00Z', updatedAt: '2024-09-01T10:00:00Z' },
  { id: 'FILE-003', title: 'Q4 2024 NAV Report', description: 'Net Asset Value report for quarter ending December 2024', fileName: 'GHL_NAV_Q4_2024.xlsx', fileUrl: '/mock/nav-q4.xlsx', fileType: 'xlsx', fileSize: 876544, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'report', folderId: 'FLD-102', folderPath: '/fund/nav-reports', tags: ['NAV', 'quarterly', 'Q4'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: true, downloadCount: 38, entityType: 'fund', uploadedBy: 'USR003', uploadedByName: 'Rajesh Sundaram', createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'FILE-004', title: 'Q3 2024 NAV Report', description: 'Net Asset Value report for quarter ending September 2024', fileName: 'GHL_NAV_Q3_2024.xlsx', fileUrl: '/mock/nav-q3.xlsx', fileType: 'xlsx', fileSize: 845312, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'report', folderId: 'FLD-102', folderPath: '/fund/nav-reports', tags: ['NAV', 'quarterly', 'Q3'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 31, entityType: 'fund', uploadedBy: 'USR003', uploadedByName: 'Rajesh Sundaram', createdAt: '2024-10-15T10:00:00Z', updatedAt: '2024-10-15T10:00:00Z' },
  { id: 'FILE-005', title: 'Contribution Notice — Jan 2025', description: 'Capital call notice for Q1 2025 contribution', fileName: 'Capital_Call_Jan2025.pdf', fileUrl: '/mock/capital-call-jan.pdf', fileType: 'pdf', fileSize: 1258291, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-103', folderPath: '/fund/capital-calls', tags: ['capital call', 'contribution', 'Q1 2025'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 15, entityType: 'fund', uploadedBy: 'USR003', uploadedByName: 'Rajesh Sundaram', createdAt: '2025-01-05T10:00:00Z', updatedAt: '2025-01-05T10:00:00Z' },
  { id: 'FILE-006', title: 'Contribution Notice — Oct 2024', description: 'Capital call notice for Q4 2024', fileName: 'Capital_Call_Oct2024.pdf', fileUrl: '/mock/capital-call-oct.pdf', fileType: 'pdf', fileSize: 1100800, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-103', folderPath: '/fund/capital-calls', tags: ['capital call', 'contribution', 'Q4 2024'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 28, entityType: 'fund', uploadedBy: 'USR003', uploadedByName: 'Rajesh Sundaram', createdAt: '2024-10-01T10:00:00Z', updatedAt: '2024-10-01T10:00:00Z' },
  { id: 'FILE-007', title: 'H2 2024 Distribution Schedule', description: 'Distribution notice for July-December 2024', fileName: 'Distribution_H2_2024.pdf', fileUrl: '/mock/dist-h2.pdf', fileType: 'pdf', fileSize: 952320, mimeType: 'application/pdf', category: 'report', folderId: 'FLD-104', folderPath: '/fund/distributions', tags: ['distribution', 'H2 2024'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 20, entityType: 'fund', uploadedBy: 'USR003', uploadedByName: 'Rajesh Sundaram', createdAt: '2024-12-20T10:00:00Z', updatedAt: '2024-12-20T10:00:00Z' },
  { id: 'FILE-008', title: 'Side Letter — Ranjit Singh', description: 'Customized terms for Tier 5 investor', fileName: 'Side_Letter_Ranjit_Singh.pdf', fileUrl: '/mock/side-letter-ranjit.pdf', fileType: 'pdf', fileSize: 524288, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-105', folderPath: '/fund/side-letters', tags: ['side letter', 'Tier 5', 'investor'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: false, downloadCount: 3, entityType: 'client', entityId: 'CLT017', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2024-11-10T10:00:00Z', updatedAt: '2024-11-10T10:00:00Z' },

  // ── Compliance & Regulatory ───────────────────────────────────
  { id: 'FILE-009', title: 'SEBI Annual Filing FY2024', description: 'Annual regulatory filing with Securities Exchange Board of India', fileName: 'SEBI_Annual_FY2024.pdf', fileUrl: '/mock/sebi-annual.pdf', fileType: 'pdf', fileSize: 3355443, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-201', folderPath: '/compliance/sebi', tags: ['SEBI', 'annual', 'filing', 'FY2024'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: true, downloadCount: 12, entityType: 'compliance', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', approvedBy: 'USR001', approvedAt: '2024-09-30T10:00:00Z', createdAt: '2024-09-30T10:00:00Z', updatedAt: '2024-09-30T10:00:00Z' },
  { id: 'FILE-010', title: 'SEBI Quarterly Compliance — Q4 2024', description: 'Quarterly compliance report to SEBI', fileName: 'SEBI_Q4_Compliance.pdf', fileUrl: '/mock/sebi-q4.pdf', fileType: 'pdf', fileSize: 1572864, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-201', folderPath: '/compliance/sebi', tags: ['SEBI', 'quarterly', 'Q4 2024'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 8, entityType: 'compliance', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', createdAt: '2025-01-31T10:00:00Z', updatedAt: '2025-01-31T10:00:00Z' },
  { id: 'FILE-011', title: 'AML Policy Document v2.0', description: 'Anti-Money Laundering compliance policy', fileName: 'AML_Policy_v2.0.pdf', fileUrl: '/mock/aml-policy.pdf', fileType: 'pdf', fileSize: 2097152, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-202', folderPath: '/compliance/aml-kyc', tags: ['AML', 'policy', 'compliance'], version: 2, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 16, entityType: 'compliance', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', createdAt: '2024-06-01T10:00:00Z', updatedAt: '2025-01-30T10:00:00Z' },
  { id: 'FILE-012', title: 'RBI FEMA Compliance Report', description: 'Foreign exchange compliance report for NRI investments', fileName: 'RBI_FEMA_Report.pdf', fileUrl: '/mock/rbi-fema.pdf', fileType: 'pdf', fileSize: 1835008, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-203', folderPath: '/compliance/rbi', tags: ['RBI', 'FEMA', 'NRI', 'forex'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 5, entityType: 'compliance', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'FILE-013', title: 'Trustee Report Q4 2024', description: 'Quarterly trustee oversight report', fileName: 'Trustee_Q4_2024.pdf', fileUrl: '/mock/trustee-q4.pdf', fileType: 'pdf', fileSize: 2936012, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-204', folderPath: '/compliance/audit', tags: ['trustee', 'quarterly', 'audit'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 7, entityType: 'compliance', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', createdAt: '2025-01-31T10:00:00Z', updatedAt: '2025-01-31T10:00:00Z' },
  { id: 'FILE-014', title: 'Compliance Handbook v1.5', description: 'Internal compliance procedures & guidelines', fileName: 'Compliance_Handbook_v1.5.pdf', fileUrl: '/mock/compliance-handbook.pdf', fileType: 'pdf', fileSize: 1572864, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-205', folderPath: '/compliance/policies', tags: ['compliance', 'handbook', 'SOP'], version: 1, isTemplate: true, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 24, entityType: 'compliance', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', createdAt: '2024-11-01T10:00:00Z', updatedAt: '2024-11-01T10:00:00Z' },

  // ── Client Documents ──────────────────────────────────────────
  { id: 'FILE-015', title: 'KYC — Vikram Malhotra (Tier 5)', description: 'Complete KYC package: PAN, Aadhaar, address proof', fileName: 'KYC_Vikram_Malhotra.pdf', fileUrl: '/mock/kyc-vikram.pdf', fileType: 'pdf', fileSize: 4194304, mimeType: 'application/pdf', category: 'kyc', folderId: 'FLD-301', folderPath: '/clients/kyc', tags: ['KYC', 'Tier 5', 'PAN', 'Aadhaar'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: false, downloadCount: 4, entityType: 'client', entityId: 'CLT001', uploadedBy: 'USR006', uploadedByName: 'Kavitha Nair', approvedBy: 'USR004', approvedAt: '2024-06-20T10:00:00Z', createdAt: '2024-06-18T10:00:00Z', updatedAt: '2024-06-20T10:00:00Z' },
  { id: 'FILE-016', title: 'KYC — Prakash Menon NRI (Tier 5)', description: 'NRI KYC with passport, OCI, UAE residency proof', fileName: 'KYC_Prakash_Menon_NRI.pdf', fileUrl: '/mock/kyc-prakash.pdf', fileType: 'pdf', fileSize: 5242880, mimeType: 'application/pdf', category: 'kyc', folderId: 'FLD-301', folderPath: '/clients/kyc', tags: ['KYC', 'NRI', 'Tier 5', 'passport', 'OCI'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: false, downloadCount: 3, entityType: 'client', entityId: 'CLT008', uploadedBy: 'USR006', uploadedByName: 'Kavitha Nair', approvedBy: 'USR004', approvedAt: '2024-03-10T10:00:00Z', createdAt: '2024-03-05T10:00:00Z', updatedAt: '2024-03-10T10:00:00Z' },
  { id: 'FILE-017', title: 'Investment Agreement — Vikram Malhotra', description: 'Executed investment agreement for Fund I', fileName: 'Agreement_Vikram_Malhotra.pdf', fileUrl: '/mock/agreement-vikram.pdf', fileType: 'pdf', fileSize: 1048576, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-302', folderPath: '/clients/agreements', tags: ['agreement', 'Fund I', 'Tier 5'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'restricted', starred: false, downloadCount: 6, entityType: 'client', entityId: 'CLT001', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
  { id: 'FILE-018', title: 'Investment Agreement — Ranjit Singh NRI', description: 'Executed investment agreement with NRI addendum', fileName: 'Agreement_Ranjit_Singh_NRI.pdf', fileUrl: '/mock/agreement-ranjit.pdf', fileType: 'pdf', fileSize: 1310720, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-302', folderPath: '/clients/agreements', tags: ['agreement', 'Fund I', 'NRI', 'Tier 5'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'restricted', starred: false, downloadCount: 4, entityType: 'client', entityId: 'CLT017', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2024-02-14T10:00:00Z', updatedAt: '2024-02-14T10:00:00Z' },
  { id: 'FILE-019', title: 'Welcome Letter — Padma Lakshmi', description: 'New investor welcome package', fileName: 'Welcome_Padma_Lakshmi.pdf', fileUrl: '/mock/welcome-padma.pdf', fileType: 'pdf', fileSize: 524288, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-303', folderPath: '/clients/correspondence', tags: ['welcome', 'new investor', 'Tier 1'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 2, entityType: 'client', entityId: 'CLT015', uploadedBy: 'USR008', uploadedByName: 'Ananya Pillai', createdAt: '2025-01-12T10:00:00Z', updatedAt: '2025-01-12T10:00:00Z' },

  // ── Employee Records ──────────────────────────────────────────
  { id: 'FILE-020', title: 'Offer Letter — Kavitha Nair', description: 'Employment offer for Investor Relations role', fileName: 'Offer_Kavitha_Nair.pdf', fileUrl: '/mock/offer-kavitha.pdf', fileType: 'pdf', fileSize: 419430, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-401', folderPath: '/employees/offers', tags: ['offer letter', 'IR', 'employment'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: false, downloadCount: 2, entityType: 'employee', entityId: 'USR006', uploadedBy: 'USR010', uploadedByName: 'Lakshmi Ramachandran', createdAt: '2024-02-01T10:00:00Z', updatedAt: '2024-02-01T10:00:00Z' },
  { id: 'FILE-021', title: 'ID Verification — Arjun Reddy', description: 'PAN & Aadhaar verification copies', fileName: 'ID_Arjun_Reddy.pdf', fileUrl: '/mock/id-arjun.pdf', fileType: 'pdf', fileSize: 2097152, mimeType: 'application/pdf', category: 'kyc', folderId: 'FLD-402', folderPath: '/employees/id-proofs', tags: ['ID proof', 'PAN', 'Aadhaar'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: false, downloadCount: 1, entityType: 'employee', entityId: 'USR005', uploadedBy: 'USR010', uploadedByName: 'Lakshmi Ramachandran', createdAt: '2024-03-15T10:00:00Z', updatedAt: '2024-03-15T10:00:00Z' },
  { id: 'FILE-022', title: 'Appraisal FY2024 — Rajesh Sundaram', description: 'Annual performance review for Fund Management lead', fileName: 'Appraisal_Rajesh_FY2024.pdf', fileUrl: '/mock/appraisal-rajesh.pdf', fileType: 'pdf', fileSize: 314572, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-403', folderPath: '/employees/appraisals', tags: ['appraisal', 'FY2024', 'performance'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: false, downloadCount: 3, entityType: 'employee', entityId: 'USR003', uploadedBy: 'USR010', uploadedByName: 'Lakshmi Ramachandran', createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },

  // ── Financial Records ─────────────────────────────────────────
  { id: 'FILE-023', title: 'Invoice — Cloud Services Feb 2025', description: 'AWS hosting & Supabase subscription invoice', fileName: 'Invoice_Cloud_Feb2025.pdf', fileUrl: '/mock/invoice-cloud.pdf', fileType: 'pdf', fileSize: 209715, mimeType: 'application/pdf', category: 'invoice', folderId: 'FLD-501', folderPath: '/financial/invoices', tags: ['invoice', 'AWS', 'Supabase', 'hosting'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 2, entityType: 'financial', uploadedBy: 'USR002', uploadedByName: 'Priya Krishnan', createdAt: '2025-02-10T16:00:00Z', updatedAt: '2025-02-10T16:00:00Z' },
  { id: 'FILE-024', title: 'GST Filing — Jan 2025', description: 'Monthly GST return filing', fileName: 'GST_Jan2025.pdf', fileUrl: '/mock/gst-jan.pdf', fileType: 'pdf', fileSize: 524288, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-502', folderPath: '/financial/tax', tags: ['GST', 'tax', 'monthly'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 3, entityType: 'financial', uploadedBy: 'USR002', uploadedByName: 'Priya Krishnan', createdAt: '2025-01-31T10:00:00Z', updatedAt: '2025-01-31T10:00:00Z' },
  { id: 'FILE-025', title: 'Bank Statement — Jan 2025', description: 'HDFC current account statement', fileName: 'Bank_Statement_Jan2025.pdf', fileUrl: '/mock/bank-jan.pdf', fileType: 'pdf', fileSize: 419430, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-503', folderPath: '/financial/bank', tags: ['bank', 'HDFC', 'statement'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'restricted', starred: false, downloadCount: 2, entityType: 'financial', uploadedBy: 'USR002', uploadedByName: 'Priya Krishnan', createdAt: '2025-02-05T10:00:00Z', updatedAt: '2025-02-05T10:00:00Z' },
  { id: 'FILE-026', title: 'TDS Certificate — Q3 FY2025', description: 'Tax Deducted at Source certificate for investors', fileName: 'TDS_Q3_FY2025.pdf', fileUrl: '/mock/tds-q3.pdf', fileType: 'pdf', fileSize: 262144, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-504', folderPath: '/financial/receipts', tags: ['TDS', 'tax', 'certificate'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 18, entityType: 'financial', uploadedBy: 'USR002', uploadedByName: 'Priya Krishnan', createdAt: '2025-01-05T10:00:00Z', updatedAt: '2025-01-05T10:00:00Z' },

  // ── Marketing Assets ──────────────────────────────────────────
  { id: 'FILE-027', title: 'GHL Investment Brochure 2025', description: 'Premium investor brochure — print & digital versions', fileName: 'GHL_Brochure_2025.pdf', fileUrl: '/mock/brochure-2025.pdf', fileType: 'pdf', fileSize: 5872025, mimeType: 'application/pdf', category: 'marketing', folderId: 'FLD-601', folderPath: '/marketing/brochures', tags: ['brochure', 'marketing', '2025', 'print'], version: 2, isTemplate: false, isConfidential: false, accessLevel: 'public', starred: true, downloadCount: 67, entityType: 'marketing', uploadedBy: 'USR005', uploadedByName: 'Arjun Reddy', createdAt: '2024-11-20T10:00:00Z', updatedAt: '2025-01-20T10:00:00Z' },
  { id: 'FILE-028', title: 'Investor Pitch Deck Q1 2025', description: 'Investor presentation for roadshows & meetings', fileName: 'Pitch_Deck_Q1_2025.pptx', fileUrl: '/mock/pitch-q1.pptx', fileType: 'pptx', fileSize: 8388608, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'marketing', folderId: 'FLD-602', folderPath: '/marketing/pitches', tags: ['pitch deck', 'investors', 'Q1 2025'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: true, downloadCount: 34, entityType: 'marketing', uploadedBy: 'USR005', uploadedByName: 'Arjun Reddy', createdAt: '2025-02-01T10:00:00Z', updatedAt: '2025-02-01T10:00:00Z' },
  { id: 'FILE-029', title: 'LinkedIn Ad Creative — Feb 2025', description: 'LinkedIn sponsored content images for NRI campaign', fileName: 'LinkedIn_Ad_Feb2025.png', fileUrl: '/mock/linkedin-ad.png', fileType: 'png', fileSize: 1048576, mimeType: 'image/png', category: 'marketing', folderId: 'FLD-603', folderPath: '/marketing/ads', tags: ['LinkedIn', 'ad', 'NRI campaign', 'social'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'public', starred: false, downloadCount: 11, entityType: 'marketing', uploadedBy: 'USR005', uploadedByName: 'Arjun Reddy', createdAt: '2025-02-05T10:00:00Z', updatedAt: '2025-02-05T10:00:00Z' },
  { id: 'FILE-030', title: 'GHL Brand Guidelines v2.0', description: 'Logo usage, color palette, typography, brand voice', fileName: 'GHL_Brand_Guidelines.pdf', fileUrl: '/mock/brand-guide.pdf', fileType: 'pdf', fileSize: 3670016, mimeType: 'application/pdf', category: 'marketing', folderId: 'FLD-604', folderPath: '/marketing/brand', tags: ['brand', 'guidelines', 'logo', 'identity'], version: 2, isTemplate: true, isConfidential: false, accessLevel: 'internal', starred: true, downloadCount: 42, entityType: 'marketing', uploadedBy: 'USR005', uploadedByName: 'Arjun Reddy', createdAt: '2024-04-01T10:00:00Z', updatedAt: '2024-10-01T10:00:00Z' },

  // ── Legal ─────────────────────────────────────────────────────
  { id: 'FILE-031', title: 'Office Lease Agreement — Chennai HQ', description: 'Commercial lease for T. Nagar office premises', fileName: 'Lease_Chennai_HQ.pdf', fileUrl: '/mock/lease-chennai.pdf', fileType: 'pdf', fileSize: 1572864, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-701', folderPath: '/legal/contracts', tags: ['lease', 'Chennai', 'office', 'real estate'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 4, entityType: 'legal', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2024-01-15T10:00:00Z', updatedAt: '2025-02-15T10:00:00Z' },
  { id: 'FILE-032', title: 'NDA — Technology Partner', description: 'Non-disclosure agreement with development vendor', fileName: 'NDA_Tech_Partner.pdf', fileUrl: '/mock/nda-tech.pdf', fileType: 'pdf', fileSize: 419430, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-702', folderPath: '/legal/mou-nda', tags: ['NDA', 'vendor', 'technology'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 3, entityType: 'legal', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2024-12-01T10:00:00Z', updatedAt: '2024-12-01T10:00:00Z' },
  { id: 'FILE-033', title: 'Legal Opinion — NRI Tax Implications', description: 'External counsel opinion on DTAA applicability', fileName: 'Legal_Opinion_NRI_Tax.pdf', fileUrl: '/mock/opinion-nri-tax.pdf', fileType: 'pdf', fileSize: 838860, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-703', folderPath: '/legal/litigation', tags: ['legal opinion', 'NRI', 'tax', 'DTAA'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 6, entityType: 'legal', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2024-09-15T10:00:00Z', updatedAt: '2024-09-15T10:00:00Z' },

  // ── Board & Governance ────────────────────────────────────────
  { id: 'FILE-034', title: 'Board Meeting Minutes — Jan 2025', description: 'Minutes of the 8th board meeting', fileName: 'Board_Minutes_Jan2025.pdf', fileUrl: '/mock/board-jan.pdf', fileType: 'pdf', fileSize: 819200, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-801', folderPath: '/board/minutes', tags: ['board', 'minutes', 'Jan 2025'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: false, downloadCount: 5, entityType: 'governance', uploadedBy: 'USR001', uploadedByName: 'Abe Thayil', createdAt: '2025-02-01T15:00:00Z', updatedAt: '2025-02-01T15:00:00Z' },
  { id: 'FILE-035', title: 'Resolution — Fund II Launch Approval', description: 'Board resolution approving GHL India Growth Fund II', fileName: 'Resolution_Fund_II.pdf', fileUrl: '/mock/resolution-fund2.pdf', fileType: 'pdf', fileSize: 314572, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-802', folderPath: '/board/resolutions', tags: ['resolution', 'Fund II', 'approval'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: true, downloadCount: 8, entityType: 'governance', uploadedBy: 'USR001', uploadedByName: 'Abe Thayil', createdAt: '2024-12-15T10:00:00Z', updatedAt: '2024-12-15T10:00:00Z' },
  { id: 'FILE-036', title: 'Investment Committee Agenda — Feb 2025', description: 'Agenda for the monthly IC meeting', fileName: 'IC_Agenda_Feb2025.pdf', fileUrl: '/mock/ic-agenda-feb.pdf', fileType: 'pdf', fileSize: 209715, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-803', folderPath: '/board/agendas', tags: ['agenda', 'investment committee', 'Feb 2025'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 10, entityType: 'governance', uploadedBy: 'USR001', uploadedByName: 'Abe Thayil', createdAt: '2025-01-28T10:00:00Z', updatedAt: '2025-01-28T10:00:00Z' },

  // ── Internal Operations ───────────────────────────────────────
  { id: 'FILE-037', title: 'Employee Handbook v2.1', description: 'Comprehensive employee policies & procedures', fileName: 'Employee_Handbook_v2.1.pdf', fileUrl: '/mock/handbook.pdf', fileType: 'pdf', fileSize: 2202009, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-901', folderPath: '/internal/sops', tags: ['handbook', 'HR', 'policy', 'SOP'], version: 2, isTemplate: true, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 35, entityType: 'internal', uploadedBy: 'USR010', uploadedByName: 'Lakshmi Ramachandran', createdAt: '2024-08-01T10:00:00Z', updatedAt: '2024-11-01T09:00:00Z' },
  { id: 'FILE-038', title: 'Client Onboarding Checklist Template', description: 'Template checklist for new client onboarding process', fileName: 'Onboarding_Template.xlsx', fileUrl: '/mock/onboarding-template.xlsx', fileType: 'xlsx', fileSize: 157286, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'general', folderId: 'FLD-902', folderPath: '/internal/templates', tags: ['template', 'onboarding', 'checklist'], version: 1, isTemplate: true, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 28, entityType: 'internal', uploadedBy: 'USR008', uploadedByName: 'Ananya Pillai', createdAt: '2024-09-01T10:00:00Z', updatedAt: '2024-09-01T10:00:00Z' },
  { id: 'FILE-039', title: 'Compliance Training Slides', description: 'AML/KYC compliance training for new staff', fileName: 'Compliance_Training.pptx', fileUrl: '/mock/compliance-training.pptx', fileType: 'pptx', fileSize: 6291456, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'compliance', folderId: 'FLD-903', folderPath: '/internal/training', tags: ['training', 'compliance', 'AML', 'KYC'], version: 1, isTemplate: true, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 19, entityType: 'internal', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', createdAt: '2024-08-15T10:00:00Z', updatedAt: '2024-08-15T10:00:00Z' },

  // ── Reports & Analytics ───────────────────────────────────────
  { id: 'FILE-040', title: 'Monthly Performance Report — Jan 2025', description: 'Auto-generated monthly fund performance summary', fileName: 'Monthly_Report_Jan2025.pdf', fileUrl: '/mock/monthly-jan.pdf', fileType: 'pdf', fileSize: 1048576, mimeType: 'application/pdf', category: 'report', folderId: 'FLD-A01', folderPath: '/reports/generated', tags: ['report', 'monthly', 'performance', 'auto'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 15, entityType: 'report', uploadedBy: 'USR007', uploadedByName: 'Suresh Venkataraman', createdAt: '2025-02-01T08:00:00Z', updatedAt: '2025-02-01T08:00:00Z' },
  { id: 'FILE-041', title: 'Scheduled AUM Export — Weekly', description: 'Automated weekly AUM snapshot export', fileName: 'AUM_Export_W08_2025.csv', fileUrl: '/mock/aum-export.csv', fileType: 'csv', fileSize: 52428, mimeType: 'text/csv', category: 'report', folderId: 'FLD-A02', folderPath: '/reports/scheduled', tags: ['AUM', 'export', 'weekly', 'scheduled'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 5, entityType: 'report', uploadedBy: 'USR007', uploadedByName: 'Suresh Venkataraman', createdAt: '2025-02-22T08:00:00Z', updatedAt: '2025-02-22T08:00:00Z' },

  // ── Sales & CRM ───────────────────────────────────────────────
  { id: 'FILE-042', title: 'Investment Proposal — HNI Segment', description: 'Customized proposal template for HNI prospects', fileName: 'Proposal_HNI_Template.pdf', fileUrl: '/mock/proposal-hni.pdf', fileType: 'pdf', fileSize: 2097152, mimeType: 'application/pdf', category: 'marketing', folderId: 'FLD-B01', folderPath: '/sales/proposals', tags: ['proposal', 'HNI', 'template', 'sales'], version: 1, isTemplate: true, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 22, entityType: 'sales', uploadedBy: 'USR006', uploadedByName: 'Kavitha Nair', createdAt: '2024-10-01T10:00:00Z', updatedAt: '2025-02-20T12:00:00Z' },
  { id: 'FILE-043', title: 'Term Sheet — Ashwin Krishnamurthy', description: 'Investment terms for Tier 3 allocation', fileName: 'Term_Sheet_Ashwin.pdf', fileUrl: '/mock/term-ashwin.pdf', fileType: 'pdf', fileSize: 419430, mimeType: 'application/pdf', category: 'agreement', folderId: 'FLD-B02', folderPath: '/sales/term-sheets', tags: ['term sheet', 'Tier 3', 'allocation'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 3, entityType: 'sales', entityId: 'CLT006', uploadedBy: 'USR006', uploadedByName: 'Kavitha Nair', createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },

  // ── Technology ────────────────────────────────────────────────
  { id: 'FILE-044', title: 'GHL Platform Architecture v1.0', description: 'System architecture diagram & component documentation', fileName: 'Architecture_v1.0.pdf', fileUrl: '/mock/architecture.pdf', fileType: 'pdf', fileSize: 1572864, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-C01', folderPath: '/technology/architecture', tags: ['architecture', 'system design', 'documentation'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'internal', starred: false, downloadCount: 12, entityType: 'technology', uploadedBy: 'USR007', uploadedByName: 'Suresh Venkataraman', createdAt: '2025-01-20T17:00:00Z', updatedAt: '2025-01-20T17:00:00Z' },

  // ── Insurance ─────────────────────────────────────────────────
  { id: 'FILE-045', title: 'Directors & Officers Insurance Policy', description: 'D&O liability insurance coverage document', fileName: 'DO_Insurance_Policy.pdf', fileUrl: '/mock/do-insurance.pdf', fileType: 'pdf', fileSize: 1048576, mimeType: 'application/pdf', category: 'general', folderId: 'FLD-D01', folderPath: '/insurance/policies', tags: ['insurance', 'D&O', 'liability', 'coverage'], version: 1, isTemplate: false, isConfidential: false, accessLevel: 'restricted', starred: false, downloadCount: 4, entityType: 'insurance', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2025-01-10T14:00:00Z', updatedAt: '2025-01-10T14:00:00Z' },

  // ── Correspondence ────────────────────────────────────────────
  { id: 'FILE-046', title: 'SEBI Show Cause Response', description: 'Response to SEBI show cause notice dated Dec 2024', fileName: 'SEBI_SCN_Response.pdf', fileUrl: '/mock/sebi-scn.pdf', fileType: 'pdf', fileSize: 2621440, mimeType: 'application/pdf', category: 'compliance', folderId: 'FLD-E01', folderPath: '/correspondence/regulatory', tags: ['SEBI', 'show cause', 'response', 'regulatory'], version: 1, isTemplate: false, isConfidential: true, accessLevel: 'confidential', starred: true, downloadCount: 6, entityType: 'compliance', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2025-02-12T11:00:00Z', updatedAt: '2025-02-12T11:00:00Z' },
]

// ═══════════════════════════════════════════════════════════════
// VERSIONS — History for key documents
// ═══════════════════════════════════════════════════════════════

export const MOCK_VERSIONS: RepoVersion[] = [
  // PPM versions
  { id: 'VER-001', documentId: 'FILE-001', versionNumber: 1, fileUrl: '/mock/ppm-v1.0.pdf', fileSize: 3145728, changeSummary: 'Initial PPM draft', uploadedBy: 'USR001', uploadedByName: 'Abe Thayil', createdAt: '2024-06-15T10:00:00Z' },
  { id: 'VER-002', documentId: 'FILE-001', versionNumber: 2, fileUrl: '/mock/ppm-v2.0.pdf', fileSize: 4194304, changeSummary: 'Legal review edits, updated risk factors section', uploadedBy: 'USR009', uploadedByName: 'Deepak Naidu', createdAt: '2024-09-01T10:00:00Z' },
  { id: 'VER-003', documentId: 'FILE-001', versionNumber: 3, fileUrl: '/mock/ppm-v3.2.pdf', fileSize: 5033164, changeSummary: 'Final version: SEBI compliance review, fee schedule update', uploadedBy: 'USR001', uploadedByName: 'Abe Thayil', createdAt: '2024-12-15T10:00:00Z' },

  // AML Policy versions
  { id: 'VER-004', documentId: 'FILE-011', versionNumber: 1, fileUrl: '/mock/aml-v1.0.pdf', fileSize: 1572864, changeSummary: 'Initial AML policy', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', createdAt: '2024-06-01T10:00:00Z' },
  { id: 'VER-005', documentId: 'FILE-011', versionNumber: 2, fileUrl: '/mock/aml-v2.0.pdf', fileSize: 2097152, changeSummary: 'Updated with new PMLA amendment requirements', uploadedBy: 'USR004', uploadedByName: 'Meera Iyer', createdAt: '2025-01-30T10:00:00Z' },

  // Brochure versions
  { id: 'VER-006', documentId: 'FILE-027', versionNumber: 1, fileUrl: '/mock/brochure-v1.pdf', fileSize: 4718592, changeSummary: 'Initial 2025 brochure design', uploadedBy: 'USR005', uploadedByName: 'Arjun Reddy', createdAt: '2024-11-20T10:00:00Z' },
  { id: 'VER-007', documentId: 'FILE-027', versionNumber: 2, fileUrl: '/mock/brochure-2025.pdf', fileSize: 5872025, changeSummary: 'Updated performance metrics, new testimonials section', uploadedBy: 'USR005', uploadedByName: 'Arjun Reddy', createdAt: '2025-01-20T10:00:00Z' },

  // Employee Handbook versions
  { id: 'VER-008', documentId: 'FILE-037', versionNumber: 1, fileUrl: '/mock/handbook-v1.pdf', fileSize: 1572864, changeSummary: 'Initial handbook', uploadedBy: 'USR010', uploadedByName: 'Lakshmi Ramachandran', createdAt: '2024-08-01T10:00:00Z' },
  { id: 'VER-009', documentId: 'FILE-037', versionNumber: 2, fileUrl: '/mock/handbook-v2.1.pdf', fileSize: 2202009, changeSummary: 'Updated leave policy, added WFH guidelines', uploadedBy: 'USR010', uploadedByName: 'Lakshmi Ramachandran', createdAt: '2024-11-01T09:00:00Z' },

  // Brand Guidelines versions
  { id: 'VER-010', documentId: 'FILE-030', versionNumber: 1, fileUrl: '/mock/brand-v1.pdf', fileSize: 2621440, changeSummary: 'Initial brand guidelines', uploadedBy: 'USR005', uploadedByName: 'Arjun Reddy', createdAt: '2024-04-01T10:00:00Z' },
  { id: 'VER-011', documentId: 'FILE-030', versionNumber: 2, fileUrl: '/mock/brand-v2.pdf', fileSize: 3670016, changeSummary: 'Added social media guidelines, updated color palette', uploadedBy: 'USR005', uploadedByName: 'Arjun Reddy', createdAt: '2024-10-01T10:00:00Z' },
]

// ═══════════════════════════════════════════════════════════════
// AUDIT LOG — Recent activity
// ═══════════════════════════════════════════════════════════════

export const MOCK_AUDIT_LOG: RepoAuditEntry[] = [
  { id: 'AUD-001', documentId: 'FILE-001', action: 'download', performedBy: 'USR006', performedByName: 'Kavitha Nair', details: { reason: 'Investor meeting preparation' }, createdAt: '2025-02-22T14:30:00Z' },
  { id: 'AUD-002', documentId: 'FILE-003', action: 'view', performedBy: 'USR003', performedByName: 'Rajesh Sundaram', details: {}, createdAt: '2025-02-22T11:15:00Z' },
  { id: 'AUD-003', documentId: 'FILE-027', action: 'download', performedBy: 'USR005', performedByName: 'Arjun Reddy', details: { reason: 'Campaign update' }, createdAt: '2025-02-21T16:45:00Z' },
  { id: 'AUD-004', documentId: 'FILE-009', action: 'view', performedBy: 'USR004', performedByName: 'Meera Iyer', details: {}, createdAt: '2025-02-21T10:00:00Z' },
  { id: 'AUD-005', documentId: 'FILE-028', action: 'upload', performedBy: 'USR005', performedByName: 'Arjun Reddy', details: { version: 1 }, createdAt: '2025-02-01T10:00:00Z' },
  { id: 'AUD-006', documentId: 'FILE-034', action: 'upload', performedBy: 'USR001', performedByName: 'Abe Thayil', details: { version: 1 }, createdAt: '2025-02-01T15:00:00Z' },
  { id: 'AUD-007', documentId: 'FILE-001', action: 'version', performedBy: 'USR001', performedByName: 'Abe Thayil', details: { fromVersion: 2, toVersion: 3 }, createdAt: '2024-12-15T10:00:00Z' },
  { id: 'AUD-008', documentId: 'FILE-011', action: 'version', performedBy: 'USR004', performedByName: 'Meera Iyer', details: { fromVersion: 1, toVersion: 2, reason: 'PMLA amendment' }, createdAt: '2025-01-30T10:00:00Z' },
  { id: 'AUD-009', documentId: 'FILE-046', action: 'upload', performedBy: 'USR009', performedByName: 'Deepak Naidu', details: { isConfidential: true }, createdAt: '2025-02-12T11:00:00Z' },
  { id: 'AUD-010', documentId: 'FILE-035', action: 'star', performedBy: 'USR001', performedByName: 'Abe Thayil', details: {}, createdAt: '2024-12-15T10:30:00Z' },
  { id: 'AUD-011', documentId: 'FILE-015', action: 'share', performedBy: 'USR006', performedByName: 'Kavitha Nair', details: { sharedWith: 'Meera Iyer', permission: 'view' }, createdAt: '2024-06-20T10:30:00Z' },
  { id: 'AUD-012', documentId: 'FILE-037', action: 'version', performedBy: 'USR010', performedByName: 'Lakshmi Ramachandran', details: { fromVersion: 1, toVersion: 2 }, createdAt: '2024-11-01T09:00:00Z' },
  { id: 'AUD-013', documentId: 'FILE-040', action: 'upload', performedBy: 'USR007', performedByName: 'Suresh Venkataraman', details: { autoGenerated: true }, createdAt: '2025-02-01T08:00:00Z' },
  { id: 'AUD-014', documentId: 'FILE-042', action: 'download', performedBy: 'USR006', performedByName: 'Kavitha Nair', details: { reason: 'Client meeting' }, createdAt: '2025-02-20T12:00:00Z' },
  { id: 'AUD-015', documentId: 'FILE-030', action: 'version', performedBy: 'USR005', performedByName: 'Arjun Reddy', details: { fromVersion: 1, toVersion: 2 }, createdAt: '2024-10-01T10:00:00Z' },
]

// ═══════════════════════════════════════════════════════════════
// STORAGE STATS
// ═══════════════════════════════════════════════════════════════

export const MOCK_STORAGE_STATS: StorageStats = {
  usedBytes: 78_643_200, // ~75 MB
  totalBytes: 524_288_000, // 500 MB
  fileCount: 46,
  folderCount: 65,
  byCategory: [
    { category: 'Fund Documents', bytes: 18_874_368, count: 8 },
    { category: 'Compliance', bytes: 13_631_488, count: 6 },
    { category: 'Client Documents', bytes: 12_320_768, count: 5 },
    { category: 'Marketing', bytes: 18_979_225, count: 4 },
    { category: 'Financial', bytes: 1_415_577, count: 4 },
    { category: 'Legal', bytes: 2_831_155, count: 3 },
    { category: 'Internal', bytes: 8_650_752, count: 3 },
    { category: 'Other', bytes: 1_939_867, count: 13 },
  ],
  byType: [
    { type: 'pdf', bytes: 58_720_256, count: 36 },
    { type: 'xlsx', bytes: 1_879_142, count: 3 },
    { type: 'pptx', bytes: 14_680_064, count: 2 },
    { type: 'png', bytes: 1_048_576, count: 1 },
    { type: 'csv', bytes: 52_428, count: 1 },
    { type: 'docx', bytes: 2_262_734, count: 3 },
  ],
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Build folder tree from flat list
// ═══════════════════════════════════════════════════════════════

export function buildFolderTree(folders: RepoFolder[]): FolderNode[] {
  const map = new Map<string, FolderNode>()
  const roots: FolderNode[] = []

  // Create nodes
  for (const f of folders) {
    map.set(f.id, { ...f, children: [] })
  }

  // Build tree
  for (const f of folders) {
    const node = map.get(f.id)!
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children
  Array.from(map.values()).forEach(node => {
    node.children.sort((a, b) => a.sortOrder - b.sortOrder)
  })
  roots.sort((a, b) => a.sortOrder - b.sortOrder)

  return roots
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Format file size
// ═══════════════════════════════════════════════════════════════

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Get file type color
// ═══════════════════════════════════════════════════════════════

export function getFileTypeColor(type: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    pdf: { bg: 'bg-red-500/10', text: 'text-red-400' },
    xlsx: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    xls: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    csv: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    docx: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    doc: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    pptx: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    ppt: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    png: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    jpg: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    jpeg: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  }
  return colors[type.toLowerCase()] || { bg: 'bg-gray-500/10', text: 'text-gray-400' }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Get file type icon name
// ═══════════════════════════════════════════════════════════════

export function getFileTypeIconName(type: string): string {
  const icons: Record<string, string> = {
    pdf: 'FileText',
    xlsx: 'FileSpreadsheet',
    xls: 'FileSpreadsheet',
    csv: 'FileSpreadsheet',
    docx: 'FileText',
    doc: 'FileText',
    pptx: 'Presentation',
    ppt: 'Presentation',
    png: 'Image',
    jpg: 'Image',
    jpeg: 'Image',
  }
  return icons[type.toLowerCase()] || 'File'
}
