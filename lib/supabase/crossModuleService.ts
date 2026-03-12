/* ─────────────────────────────────────────────────────────────
   Cross-Module Service — Unified mapping between all platform modules

   Provides:
   • Module ↔ Table ↔ Bucket ↔ Folder mappings
   • Role-based dashboard access & permissions
   • Super Admin verification
   • Cross-entity document retrieval
   • Client-Staff assignment queries
   • Folder tree retrieval
   • Data integrity validation
   • Third-party integration registry

   Falls back to mock data when Supabase is not configured.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { AdminRole, AdminModule } from '../admin/adminTypes'

// ── Constants ────────────────────────────────────────────────

const SUPER_ADMIN_UUID = '19be82d3-1bb4-429a-ae31-516cf1cda2b1'

// ── Module ↔ Resource Mappings ───────────────────────────────

export interface ModuleMapping {
  module: AdminModule | string
  label: string
  tables: string[]
  storageBucket: string
  defaultFolder: string
  rootFolderId: string
  allowedRoles: AdminRole[]
  entityType: string
}

export const MODULE_MAPPINGS: ModuleMapping[] = [
  {
    module: 'clients',
    label: 'Clients & KYC',
    tables: ['client_profiles', 'profiles', 'kyc_documents'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/clients',
    rootFolderId: '00000000-0000-0000-0001-000000000003',
    allowedRoles: ['super-admin', 'admin', 'compliance-officer', 'fund-manager', 'manager', 'sales'],
    entityType: 'client',
  },
  {
    module: 'sales',
    label: 'Sales & CRM',
    tables: ['leads', 'lead_activities', 'lead_folder_mappings', 'lead_source_tracking'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/sales',
    rootFolderId: '00000000-0000-0000-0001-000000000011',
    allowedRoles: ['super-admin', 'admin', 'manager', 'sales'],
    entityType: 'lead',
  },
  {
    module: 'employees',
    label: 'Employee Records',
    tables: ['staff_profiles', 'profiles'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/employees',
    rootFolderId: '00000000-0000-0000-0001-000000000004',
    allowedRoles: ['super-admin', 'admin', 'hr', 'manager'],
    entityType: 'employee',
  },
  {
    module: 'financial',
    label: 'Financial Records',
    tables: ['revenue_streams', 'subscriptions', 'expenses', 'payroll'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/financial',
    rootFolderId: '00000000-0000-0000-0001-000000000005',
    allowedRoles: ['super-admin', 'admin', 'fund-manager', 'manager'],
    entityType: 'financial',
  },
  {
    module: 'compliance',
    label: 'Compliance & Regulatory',
    tables: ['audit_logs', 'profiles'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/compliance',
    rootFolderId: '00000000-0000-0000-0001-000000000002',
    allowedRoles: ['super-admin', 'admin', 'compliance-officer'],
    entityType: 'compliance',
  },
  {
    module: 'marketing',
    label: 'Marketing Assets',
    tables: ['campaigns', 'leads'],
    storageBucket: 'marketing-assets',
    defaultFolder: 'admin/marketing',
    rootFolderId: '00000000-0000-0000-0001-000000000006',
    allowedRoles: ['super-admin', 'admin', 'marketing-manager', 'marketing-executive'],
    entityType: 'marketing',
  },
  {
    module: 'reports',
    label: 'Reports & Analytics',
    tables: ['documents', 'folders', 'file_records'],
    storageBucket: 'ghl-exports',
    defaultFolder: 'admin/reports',
    rootFolderId: '00000000-0000-0000-0001-000000000010',
    allowedRoles: ['super-admin', 'admin', 'manager', 'fund-manager', 'compliance-officer'],
    entityType: 'report',
  },
  {
    module: 'assets',
    label: 'Assets & Documents',
    tables: ['documents', 'document_versions', 'document_audit_log'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/documents',
    rootFolderId: '00000000-0000-0000-0001-000000000001',
    allowedRoles: ['super-admin', 'admin', 'fund-manager', 'manager', 'operations'],
    entityType: 'asset',
  },
  {
    module: 'comms',
    label: 'Correspondence',
    tables: ['documents'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/correspondence',
    rootFolderId: '00000000-0000-0000-0001-000000000014',
    allowedRoles: ['super-admin', 'admin', 'manager', 'operations'],
    entityType: 'correspondence',
  },
  {
    module: 'settings',
    label: 'Internal Operations',
    tables: ['profiles', 'roles'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/internal',
    rootFolderId: '00000000-0000-0000-0001-000000000009',
    allowedRoles: ['super-admin', 'admin'],
    entityType: 'internal',
  },
  {
    module: 'realty-brokers',
    label: 'Realty Brokers',
    tables: ['leads'],
    storageBucket: 'ghl-documents',
    defaultFolder: 'admin/sales',
    rootFolderId: '00000000-0000-0000-0001-000000000011',
    allowedRoles: ['super-admin', 'admin', 'sales', 'manager'],
    entityType: 'realty',
  },
]

// ── Role → Dashboard Access ──────────────────────────────────

export const ROLE_DASHBOARD_ACCESS: Record<AdminRole, string[]> = {
  'super-admin':        ['admin', 'staff', 'dashboard', 'investor'],
  'admin':              ['admin', 'staff', 'dashboard'],
  'compliance-officer': ['admin'],
  'fund-manager':       ['admin', 'dashboard'],
  'manager':            ['admin', 'staff'],
  'marketing-manager':  ['admin'],
  'marketing-executive':['admin'],
  'sales':              ['admin', 'staff'],
  'operations':         ['admin', 'staff'],
  'hr':                 ['admin'],
  'viewer':             ['admin'],
}

// ── Role → Module Permissions ────────────────────────────────

export const ROLE_PERMISSIONS: Record<AdminRole, { modules: AdminModule[]; actions: string[] }> = {
  'super-admin':        { modules: ['overview','clients','sales','realty-brokers','employees','assets','ai-ops','compliance','financial','analytics','comms','marketing','reports','settings'], actions: ['view','create','edit','approve','delete','export','configure'] },
  'admin':              { modules: ['overview','clients','sales','realty-brokers','employees','assets','ai-ops','compliance','financial','analytics','comms','marketing','reports','settings'], actions: ['view','create','edit','approve','delete','export'] },
  'compliance-officer': { modules: ['overview','clients','compliance','reports'], actions: ['view','create','edit','approve','export'] },
  'fund-manager':       { modules: ['overview','clients','assets','financial','analytics','reports'], actions: ['view','create','edit','approve','export'] },
  'manager':            { modules: ['overview','clients','sales','employees','financial','analytics','reports'], actions: ['view','create','edit','approve','export'] },
  'marketing-manager':  { modules: ['overview','marketing','analytics','reports'], actions: ['view','create','edit','approve','export'] },
  'marketing-executive':{ modules: ['marketing'], actions: ['view','create','edit'] },
  'sales':              { modules: ['overview','clients','sales','realty-brokers'], actions: ['view','create','edit'] },
  'operations':         { modules: ['overview','assets','comms','reports'], actions: ['view','create','edit','export'] },
  'hr':                 { modules: ['overview','employees'], actions: ['view','create','edit','approve'] },
  'viewer':             { modules: ['overview','reports'], actions: ['view'] },
}

// ── Permission Helpers ───────────────────────────────────────

export function hasPermission(role: AdminRole, module: AdminModule, action: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  return perms.modules.includes(module) && perms.actions.includes(action)
}

export function getAccessibleModules(role: AdminRole): AdminModule[] {
  return ROLE_PERMISSIONS[role]?.modules || []
}

export function getAccessibleDashboards(role: AdminRole): string[] {
  return ROLE_DASHBOARD_ACCESS[role] || []
}

export function getModuleMapping(module: AdminModule | string): ModuleMapping | undefined {
  return MODULE_MAPPINGS.find(m => m.module === module)
}

export function getModuleByEntityType(entityType: string): ModuleMapping | undefined {
  return MODULE_MAPPINGS.find(m => m.entityType === entityType)
}

// ── Super Admin ──────────────────────────────────────────────

export function isSuperAdmin(userId?: string): boolean {
  return userId === SUPER_ADMIN_UUID
}

export async function verifySuperAdminPrivileges(userId: string): Promise<{
  isSuperAdmin: boolean
  role?: string
  name?: string
}> {
  if (userId === SUPER_ADMIN_UUID) {
    if (!isSupabaseConfigured()) {
      return { isSuperAdmin: false }
    }

    try {
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('name, role')
        .eq('id', userId)
        .single() as any

      if (error) throw error
      return { isSuperAdmin: true, role: data?.role || 'super-admin', name: data?.name || 'Super Admin' }
    } catch {
      return { isSuperAdmin: true, role: 'super-admin', name: 'Super Admin' }
    }
  }

  return { isSuperAdmin: false }
}

// ── User Profile ─────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  phone?: string
  department?: string
  portal: 'admin' | 'staff' | 'client' | 'investor'
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('*')
      .eq('id', userId)
      .single() as any

    if (error) return null

    return {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      role: data.role || 'viewer',
      avatar: data.avatar_url,
      phone: data.phone,
      department: data.department,
      portal: data.role === 'client' ? 'client' : data.role === 'investor' ? 'investor' : (['super-admin','admin','compliance-officer','fund-manager','marketing-manager'].includes(data.role) ? 'admin' : 'staff'),
    }
  } catch {
    return null
  }
}

// ── Cross-Entity Document Queries ────────────────────────────

export async function getEntityDocuments(
  entityType: string,
  entityId: string
): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    // Return empty mock — documents are module-specific
    return []
  }

  try {
    const { data, error } = await supabase
      .from('documents' as any)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false }) as any

    if (error) throw error
    return data || []
  } catch (err: any) {
    console.warn(`[crossModule] getEntityDocuments(${entityType}, ${entityId}):`, err.message)
    return []
  }
}

export async function getEntityFileRecords(
  entityType: string,
  entityId: string
): Promise<any[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('file_records' as any)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false }) as any

    if (error) throw error
    return data || []
  } catch (err: any) {
    console.warn(`[crossModule] getEntityFileRecords(${entityType}, ${entityId}):`, err.message)
    return []
  }
}

// ── Client-Staff Assignments ─────────────────────────────────

export async function getClientStaffAssignments(clientId: string): Promise<any[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('client_assignments' as any)
      .select('*, staff_profiles(*, profiles(*))') as any

    if (error) throw error

    return (data || [])
      .filter((a: any) => a.client_id === clientId)
      .map((a: any) => ({
        staffId: a.staff_id,
        staffName: a.staff_profiles?.profiles?.name || 'Unknown',
        role: a.role || 'Assigned Staff',
        assignedAt: a.created_at,
      }))
  } catch (err: any) {
    console.warn('[crossModule] getClientStaffAssignments error:', err.message)
    return []
  }
}

export async function getStaffClientAssignments(staffId: string): Promise<any[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('client_assignments' as any)
      .select('*, client_profiles(*, profiles(*))') as any

    if (error) throw error

    return (data || [])
      .filter((a: any) => a.staff_id === staffId)
      .map((a: any) => ({
        clientId: a.client_id,
        clientName: a.client_profiles?.profiles?.name || 'Unknown',
        aum: a.client_profiles?.aum || 0,
        kycStatus: a.client_profiles?.kyc_status || 'pending',
      }))
  } catch (err: any) {
    console.warn('[crossModule] getStaffClientAssignments error:', err.message)
    return []
  }
}

// ── Folder Tree ──────────────────────────────────────────────

export interface FolderNode {
  id: string
  name: string
  slug: string
  parentId: string | null
  path: string
  description?: string
  icon: string
  color: string
  isSystem: boolean
  children: FolderNode[]
  fileCount: number
}

export async function getFolderTree(): Promise<FolderNode[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('folders' as any)
      .select('*')
      .order('sort_order', { ascending: true }) as any

    if (error) throw error

    const folders = data || []
    const map = new Map<string, FolderNode>()
    const roots: FolderNode[] = []

    // First pass: create nodes
    for (const f of folders) {
      map.set(f.id, {
        id: f.id,
        name: f.name,
        slug: f.slug,
        parentId: f.parent_id,
        path: f.path,
        description: f.description,
        icon: f.icon || 'Folder',
        color: f.color || '#6B7280',
        isSystem: f.is_system,
        children: [],
        fileCount: 0,
      })
    }

    // Second pass: build tree
    for (const node of Array.from(map.values())) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  } catch (err: any) {
    console.warn('[crossModule] getFolderTree error:', err.message)
    return []
  }
}

// ── Create Folder ────────────────────────────────────────────

export async function createFolder(data: {
  name: string
  parentId?: string
  description?: string
  icon?: string
  color?: string
}): Promise<{ success: boolean; folderId?: string; error?: string }> {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Storage service unavailable' }
  }

  try {
    // Determine path
    let parentPath = ''
    if (data.parentId) {
      const { data: parent } = await supabase
        .from('folders' as any)
        .select('path')
        .eq('id', data.parentId)
        .single() as any
      parentPath = parent?.path || ''
    }

    const { data: folder, error } = await supabase
      .from('folders' as any)
      .insert({
        name: data.name,
        slug,
        parent_id: data.parentId || null,
        path: `${parentPath}/${slug}`,
        description: data.description,
        icon: data.icon || 'Folder',
        color: data.color || '#6B7280',
      } as any)
      .select()
      .single() as any

    if (error) throw error
    return { success: true, folderId: folder.id }
  } catch (err: any) {
    console.error('[crossModule] createFolder error:', err)
    return { success: false, error: err.message }
  }
}

// ── Data Integrity Validation ────────────────────────────────

export interface IntegrityReport {
  timestamp: string
  checks: IntegrityCheck[]
  overallStatus: 'pass' | 'warn' | 'fail'
}

export interface IntegrityCheck {
  name: string
  table: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  count?: number
}

export async function validateIntegrity(): Promise<IntegrityReport> {
  const checks: IntegrityCheck[] = []

  if (!isSupabaseConfigured()) {
    checks.push(
      { name: 'Database connection', table: 'system', status: 'fail', message: 'Supabase not configured — cannot run integrity checks', count: 0 },
    )
    return { timestamp: new Date().toISOString(), checks, overallStatus: 'fail' }
  }

  // Live Supabase checks
  const tablesToCheck = [
    { name: 'Profiles', table: 'profiles' },
    { name: 'Client profiles', table: 'client_profiles' },
    { name: 'Staff profiles', table: 'staff_profiles' },
    { name: 'Leads', table: 'leads' },
    { name: 'Lead activities', table: 'lead_activities' },
    { name: 'Folders', table: 'folders' },
    { name: 'Documents', table: 'documents' },
    { name: 'File records', table: 'file_records' },
    { name: 'Campaigns', table: 'campaigns' },
    { name: 'Audit logs', table: 'audit_logs' },
    { name: 'Roles', table: 'roles' },
  ]

  for (const t of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(t.table as any)
        .select('*', { count: 'exact', head: true }) as any

      if (error) {
        checks.push({ name: t.name, table: t.table, status: 'fail', message: `Error: ${error.message}` })
      } else {
        checks.push({
          name: t.name,
          table: t.table,
          status: (count || 0) > 0 ? 'pass' : 'warn',
          message: `${count || 0} records found`,
          count: count || 0,
        })
      }
    } catch (err: any) {
      checks.push({ name: t.name, table: t.table, status: 'fail', message: `Exception: ${err.message}` })
    }
  }

  // Check Super Admin exists
  try {
    const { data } = await supabase
      .from('profiles' as any)
      .select('id, role')
      .eq('id', SUPER_ADMIN_UUID)
      .single() as any

    checks.push({
      name: 'Super Admin',
      table: 'profiles',
      status: data ? 'pass' : 'warn',
      message: data ? `Super Admin verified (role: ${data.role})` : 'Super Admin profile not found',
      count: data ? 1 : 0,
    })
  } catch {
    checks.push({ name: 'Super Admin', table: 'profiles', status: 'warn', message: 'Could not verify Super Admin' })
  }

  const hasFailure = checks.some(c => c.status === 'fail')
  const hasWarning = checks.some(c => c.status === 'warn')

  return {
    timestamp: new Date().toISOString(),
    checks,
    overallStatus: hasFailure ? 'fail' : hasWarning ? 'warn' : 'pass',
  }
}

// ── Third-Party Integration Registry ─────────────────────────
// Defines all third-party modules the platform needs. Each has
// `integrated: false` by default — space is reserved for future wiring.

export interface ThirdPartyIntegration {
  id: string
  name: string
  category: string
  description: string
  website: string
  integrated: boolean
  priority: 'high' | 'medium' | 'low'
  estimatedCost: string
  notes: string
}

export const THIRD_PARTY_INTEGRATIONS: ThirdPartyIntegration[] = [
  // CRM
  { id: 'tp-01', name: 'Zoho CRM', category: 'crm', description: 'Indian CRM for lead/deal management, contact sync', website: 'https://www.zoho.com/crm/', integrated: false, priority: 'high', estimatedCost: '₹800–₹2,600/user/mo', notes: 'Primary CRM — sync leads, contacts, deals. REST API available.' },
  { id: 'tp-02', name: 'Freshsales (Freshworks)', category: 'crm', description: 'AI-powered CRM with built-in phone, email, chat', website: 'https://www.freshworks.com/freshsales-crm/', integrated: false, priority: 'medium', estimatedCost: '₹999–₹4,999/user/mo', notes: 'Alternative CRM option. Freddy AI for lead scoring.' },

  // Payment & Billing
  { id: 'tp-03', name: 'Razorpay', category: 'payment', description: 'Payment gateway — subscriptions, invoicing, payouts', website: 'https://razorpay.com/', integrated: false, priority: 'high', estimatedCost: '2% per txn', notes: 'Client payments, subscription billing, vendor payouts. Webhooks for real-time sync.' },
  { id: 'tp-04', name: 'Cashfree Payments', category: 'payment', description: 'Payment gateway — payouts, auto-collect, settlements', website: 'https://www.cashfree.com/', integrated: false, priority: 'medium', estimatedCost: '1.9% per txn', notes: 'Alternative to Razorpay. Strong payout API for vendor/staff payments.' },

  // Communication
  { id: 'tp-05', name: 'Twilio', category: 'communication', description: 'SMS, WhatsApp Business API, voice calls', website: 'https://www.twilio.com/', integrated: false, priority: 'high', estimatedCost: 'Pay-per-use ($0.0079/SMS)', notes: 'Lead notifications, client alerts, WhatsApp messaging. Powers the Comms module.' },
  { id: 'tp-06', name: 'MSG91', category: 'communication', description: 'India-focused SMS/WhatsApp/email API', website: 'https://msg91.com/', integrated: false, priority: 'medium', estimatedCost: '₹0.16–₹0.25/SMS', notes: 'Cheaper India-specific alternative. OTP, transactional SMS, WhatsApp.' },
  { id: 'tp-07', name: 'SendGrid (Twilio)', category: 'communication', description: 'Transactional & marketing email delivery', website: 'https://sendgrid.com/', integrated: false, priority: 'high', estimatedCost: 'Free tier, then $19.95+/mo', notes: 'All transactional emails (KYC reminders, lead follow-ups, reports). Marketing campaigns.' },
  { id: 'tp-08', name: 'Intercom', category: 'communication', description: 'Live chat, chatbot, help center for client portal', website: 'https://www.intercom.com/', integrated: false, priority: 'low', estimatedCost: '$39+/seat/mo', notes: 'Client portal live chat. Can replace built-in support ticket system.' },

  // Analytics & BI
  { id: 'tp-09', name: 'Google Analytics 4', category: 'analytics', description: 'Website and app analytics, conversion tracking', website: 'https://analytics.google.com/', integrated: false, priority: 'high', estimatedCost: 'Free', notes: 'Already partially integrated via gtag. Needs event tracking for lead forms, downloads.' },
  { id: 'tp-10', name: 'Mixpanel', category: 'analytics', description: 'Product analytics — user flows, funnels, retention', website: 'https://mixpanel.com/', integrated: false, priority: 'medium', estimatedCost: 'Free tier, then $25+/mo', notes: 'Dashboard usage analytics. Track which modules staff uses most.' },
  { id: 'tp-11', name: 'Metabase', category: 'analytics', description: 'Open-source BI dashboard connected to Supabase/Postgres', website: 'https://www.metabase.com/', integrated: false, priority: 'medium', estimatedCost: 'Free (self-host) or $85/mo', notes: 'Connect directly to Supabase Postgres for custom reports/dashboards.' },

  // Marketing
  { id: 'tp-12', name: 'Google Ads', category: 'marketing', description: 'PPC advertising — lead gen campaigns', website: 'https://ads.google.com/', integrated: false, priority: 'high', estimatedCost: 'Pay-per-click', notes: 'Campaign module integration — import spend, clicks, conversions. Google Ads API.' },
  { id: 'tp-13', name: 'Meta Business Suite', category: 'marketing', description: 'Facebook/Instagram ad management, lead forms', website: 'https://business.facebook.com/', integrated: false, priority: 'high', estimatedCost: 'Pay-per-click', notes: 'Social media campaigns. Lead form webhook → auto-create leads in Sales module.' },
  { id: 'tp-14', name: 'Mailchimp', category: 'marketing', description: 'Email marketing, drip campaigns, audience segmentation', website: 'https://mailchimp.com/', integrated: false, priority: 'medium', estimatedCost: 'Free tier, then $13+/mo', notes: 'Marketing email campaigns. Sync audience segments from Clients module.' },

  // Accounting & Finance
  { id: 'tp-15', name: 'Tally ERP', category: 'accounting', description: 'Indian accounting standard — GST, invoicing, ledgers', website: 'https://tallysolutions.com/', integrated: false, priority: 'high', estimatedCost: '₹18,000+/yr (Silver)', notes: 'Financial module sync — invoices, expenses, GST returns. TDL API for integration.' },
  { id: 'tp-16', name: 'Zoho Books', category: 'accounting', description: 'Cloud accounting — invoicing, expense tracking, GST', website: 'https://www.zoho.com/books/', integrated: false, priority: 'medium', estimatedCost: '₹749–₹2,999/org/mo', notes: 'Alternative to Tally. Better API. Auto-reconcile with Razorpay.' },

  // Compliance & KYC
  { id: 'tp-17', name: 'Digio', category: 'compliance', description: 'e-KYC, e-Sign, Aadhaar verification, video KYC', website: 'https://www.digio.in/', integrated: false, priority: 'high', estimatedCost: '₹5–₹15/verification', notes: 'Client onboarding KYC. Aadhaar e-KYC, PAN verification, e-Sign for agreements.' },
  { id: 'tp-18', name: 'Signzy', category: 'compliance', description: 'AI-powered KYC, bank account verification, CKYC', website: 'https://signzy.com/', integrated: false, priority: 'medium', estimatedCost: 'Custom pricing', notes: 'Alternative KYC provider. CKYC integration for SEBI compliance.' },
  { id: 'tp-19', name: 'NSDL e-Gov', category: 'compliance', description: 'PAN verification, TIN matching, e-filing', website: 'https://www.protean-tinpan.com/', integrated: false, priority: 'high', estimatedCost: '₹2–₹5/lookup', notes: 'PAN verification for client onboarding. TIN/TAN matching for compliance.' },

  // Document & Storage
  { id: 'tp-20', name: 'DocuSign', category: 'storage', description: 'Electronic signatures for agreements and contracts', website: 'https://www.docusign.com/', integrated: false, priority: 'medium', estimatedCost: '$10–₹25/user/mo', notes: 'Client agreement signing. Integration with File Repository for signed doc storage.' },
  { id: 'tp-21', name: 'AWS S3', category: 'storage', description: 'Scalable object storage for large file archives', website: 'https://aws.amazon.com/s3/', integrated: false, priority: 'low', estimatedCost: '$0.023/GB/mo', notes: 'Backup storage for large archives. Supabase Storage is primary; S3 for overflow/backup.' },

  // AI & Automation
  { id: 'tp-22', name: 'OpenAI API', category: 'ai', description: 'GPT models for document analysis, lead scoring, chatbot', website: 'https://platform.openai.com/', integrated: false, priority: 'high', estimatedCost: 'Pay-per-token', notes: 'Powers AI Ops module. Document summarization, lead qualification scoring, chatbot.' },
  { id: 'tp-23', name: 'Google Cloud Vision', category: 'ai', description: 'OCR for document scanning, ID verification', website: 'https://cloud.google.com/vision', integrated: false, priority: 'medium', estimatedCost: '$1.50/1K images', notes: 'KYC document OCR — extract text from PAN cards, Aadhaar, passports.' },

  // Calendar & Scheduling
  { id: 'tp-24', name: 'Google Calendar API', category: 'communication', description: 'Calendar sync for meetings, follow-ups, events', website: 'https://developers.google.com/calendar', integrated: false, priority: 'medium', estimatedCost: 'Free', notes: 'Sync lead follow-ups, client meetings, team events with Google Calendar.' },
  { id: 'tp-25', name: 'Calendly', category: 'communication', description: 'Scheduling tool for client meetings', website: 'https://calendly.com/', integrated: false, priority: 'low', estimatedCost: 'Free tier, $10+/mo', notes: 'Client-facing scheduling. Embed in client portal for booking RM meetings.' },

  // Maps & Geo
  { id: 'tp-26', name: 'Google Maps API', category: 'analytics', description: 'Geocoding, maps for field ops, client locations', website: 'https://developers.google.com/maps', integrated: false, priority: 'medium', estimatedCost: '$2/1K requests (Geocoding)', notes: 'Staff field ops module — location tracking, client visit routing, geo-analytics.' },
]

// ── Helper to get integrations by category ───────────────────

export function getIntegrationsByCategory(category?: string): ThirdPartyIntegration[] {
  if (!category) return THIRD_PARTY_INTEGRATIONS
  return THIRD_PARTY_INTEGRATIONS.filter(i => i.category === category)
}

export function getIntegrationCategories(): string[] {
  return Array.from(new Set(THIRD_PARTY_INTEGRATIONS.map(i => i.category)))
}

export function getHighPriorityIntegrations(): ThirdPartyIntegration[] {
  return THIRD_PARTY_INTEGRATIONS.filter(i => i.priority === 'high')
}
