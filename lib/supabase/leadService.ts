/* ─────────────────────────────────────────────────────────────
   Lead Service — Comprehensive lead management with auto-routing

   Handles:
   • Lead CRUD with auto-folder creation in Sales & Reports
   • Lead assignment & routing to staff (employee portal)
   • Document attachment per lead
   • Source tracking (campaigns, website, landing pages, calls)
   • Lead-to-client conversion
   • Stats & analytics

   Falls back to mock data when Supabase is not configured.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { Lead, LeadStage, LeadSource } from '../admin/adminTypes'
import { LEADS_DATA } from '../admin/adminMockData'

// ── Constants ────────────────────────────────────────────────
const SALES_FOLDER_ID  = '00000000-0000-0000-0001-000000000011'  // Sales & CRM root
const REPORTS_FOLDER_ID = '00000000-0000-0000-0001-000000000010' // Reports & Analytics root

// ── Types ────────────────────────────────────────────────────

export interface CreateLeadInput {
  name: string
  email?: string
  phone?: string
  source: LeadSource | string
  stage?: LeadStage
  value?: number
  probability?: number
  assignedTo?: string       // staff profile ID
  notes?: string
  tags?: string[]
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp' | 'in-person'
  // Source tracking
  campaignId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  referrerUrl?: string
  landingPageUrl?: string
  landingPageTitle?: string
  formId?: string
  formName?: string
  geoCity?: string
  geoState?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
}

export interface LeadFilters {
  stage?: LeadStage | LeadStage[]
  source?: LeadSource | LeadSource[]
  assignedTo?: string
  quality?: 'hot' | 'warm' | 'cold' | 'unknown'
  search?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export interface LeadActivity {
  id: string
  leadId: string
  type: string
  description: string
  performedBy?: string
  performedByName?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface LeadNotification {
  id: string
  staffId: string
  leadId: string
  notificationType: string
  title: string
  message?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface LeadStats {
  total: number
  byStatus: Record<string, number>
  bySource: Record<string, number>
  byQuality: Record<string, number>
  thisMonth: number
  lastMonth: number
  conversionRate: number
  avgResponseTime: number
  totalValue: number
}

export interface LeadFolderMapping {
  id: string
  leadId: string
  folderId: string
  folderType: 'sales' | 'reports' | 'client'
  createdAt: string
}

// ── Mock data helpers ────────────────────────────────────────

const MOCK_ACTIVITIES: LeadActivity[] = [
  { id: 'la-1', leadId: 'L-001', type: 'call', description: 'Initial discovery call — discussed PMS interest', performedBy: 'staff-1', performedByName: 'Priya Natarajan', createdAt: '2025-03-18T10:30:00Z' },
  { id: 'la-2', leadId: 'L-001', type: 'email', description: 'Sent PPM overview document', performedBy: 'staff-1', performedByName: 'Priya Natarajan', createdAt: '2025-03-16T14:00:00Z' },
  { id: 'la-3', leadId: 'L-002', type: 'meeting', description: 'In-person meeting at Mumbai office, proposal presented', performedBy: 'staff-1', performedByName: 'Priya Natarajan', createdAt: '2025-03-19T11:00:00Z' },
  { id: 'la-4', leadId: 'L-003', type: 'call', description: 'Follow-up call, client interested in AIF Cat-III', performedBy: 'staff-2', performedByName: 'Vikram Malhotra', createdAt: '2025-03-17T09:15:00Z' },
  { id: 'la-5', leadId: 'L-004', type: 'whatsapp', description: 'WhatsApp follow-up with brochure link', performedBy: 'staff-2', performedByName: 'Vikram Malhotra', createdAt: '2025-03-15T16:45:00Z' },
  { id: 'la-6', leadId: 'L-005', type: 'note', description: 'Lead went cold — no response in 2 weeks', performedBy: 'staff-3', performedByName: 'Arjun Reddy', createdAt: '2025-03-10T08:00:00Z' },
]

const MOCK_NOTIFICATIONS: LeadNotification[] = [
  { id: 'sn-1', staffId: 'staff-1', leadId: 'L-001', notificationType: 'new_assignment', title: 'New Lead Assigned: Suresh Kumar', message: 'Lead Suresh Kumar (suresh.k@corp.com) has been assigned to you. Source: website.', isRead: true, readAt: '2025-03-01T09:00:00Z', createdAt: '2025-03-01T08:30:00Z' },
  { id: 'sn-2', staffId: 'staff-1', leadId: 'L-002', notificationType: 'new_assignment', title: 'New Lead Assigned: Ramya Venkat', message: 'Lead Ramya Venkat (ramya.v@biz.com) has been assigned to you. Source: referral.', isRead: true, readAt: '2025-02-15T10:00:00Z', createdAt: '2025-02-15T09:00:00Z' },
  { id: 'sn-3', staffId: 'staff-2', leadId: 'L-003', notificationType: 'new_assignment', title: 'New Lead Assigned: Anand Iyer', message: 'Lead Anand Iyer has been assigned to you. Source: event.', isRead: false, createdAt: '2025-03-10T11:00:00Z' },
  { id: 'sn-4', staffId: 'staff-1', leadId: 'L-002', notificationType: 'status_change', title: 'Lead Status Changed: Ramya Venkat', message: 'Lead Ramya Venkat status changed from qualified to proposal.', isRead: false, createdAt: '2025-03-19T12:00:00Z' },
]

let mockLeadCounter = LEADS_DATA.length + 1

// ── Create Lead ──────────────────────────────────────────────
// Creates lead + auto-creates Sales & Reports folders + logs activity + source tracking

export async function createLead(input: CreateLeadInput): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  if (!isSupabaseConfigured()) {
    // Mock mode — simulate creation
    const newLead: Lead = {
      id: `L-${String(mockLeadCounter++).padStart(3, '0')}`,
      name: input.name,
      email: input.email || '',
      phone: input.phone || '',
      source: input.source as LeadSource,
      stage: input.stage || 'new',
      value: input.value || 0,
      probability: input.probability || 20,
      aiScore: Math.floor(Math.random() * 40) + 50,
      assignedTo: input.assignedTo || 'Unassigned',
      createdDate: new Date().toISOString().split('T')[0],
      lastTouched: new Date().toISOString().split('T')[0],
      notes: input.notes,
    }

    // Mock folder creation log
    console.debug(`[leadService] Mock: Created lead ${newLead.id} "${newLead.name}"`)
    console.debug(`[leadService] Mock: Auto-created Sales folder /sales/lead-${newLead.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
    console.debug(`[leadService] Mock: Auto-created Reports folder /reports/lead-${newLead.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)

    LEADS_DATA.push(newLead)
    return { success: true, lead: newLead }
  }

  try {
    // Insert lead — trigger fn_create_lead_folders auto-creates folders
    const { data: lead, error } = await supabase
      .from('leads' as any)
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone,
        source: input.source,
        status: input.stage || 'new',
        deal_value: input.value || 0,
        probability: input.probability || 20,
        assigned_to: input.assignedTo,
        notes: input.notes,
        tags: input.tags || [],
        preferred_contact_method: input.preferredContactMethod || 'phone',
      } as any)
      .select()
      .single() as any

    if (error) throw error

    // Log source tracking if provided
    if (input.campaignId || input.utmSource || input.landingPageUrl || input.referrerUrl) {
      await supabase
        .from('lead_source_tracking' as any)
        .insert({
          lead_id: lead.id,
          utm_source: input.utmSource,
          utm_medium: input.utmMedium,
          utm_campaign: input.utmCampaign,
          utm_term: input.utmTerm,
          utm_content: input.utmContent,
          referrer_url: input.referrerUrl,
          landing_page_url: input.landingPageUrl,
          landing_page_title: input.landingPageTitle,
          form_id: input.formId,
          form_name: input.formName,
          campaign_id: input.campaignId,
          geo_city: input.geoCity,
          geo_state: input.geoState,
          device_type: input.deviceType,
        } as any)
    }

    // Log initial activity
    await supabase
      .from('lead_activities' as any)
      .insert({
        lead_id: lead.id,
        type: 'created',
        description: `Lead created from ${input.source}${input.campaignId ? ' (campaign)' : ''}`,
      } as any)

    // Map to front-end Lead shape
    const mappedLead: Lead = {
      id: lead.id,
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source,
      stage: lead.status,
      value: lead.deal_value || 0,
      probability: lead.probability || 0,
      aiScore: lead.ai_score || 50,
      assignedTo: lead.assigned_to || 'Unassigned',
      createdDate: lead.created_at?.split('T')[0] || '',
      lastTouched: lead.updated_at?.split('T')[0] || '',
      notes: lead.notes,
    }

    return { success: true, lead: mappedLead }
  } catch (err: any) {
    console.error('[leadService] createLead error:', err)
    return { success: false, error: err.message || 'Failed to create lead' }
  }
}

// ── Update Lead Status ───────────────────────────────────────

export async function updateLeadStatus(
  leadId: string,
  stage: LeadStage,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const lead = LEADS_DATA.find(l => l.id === leadId)
    if (lead) {
      lead.stage = stage
      lead.lastTouched = new Date().toISOString().split('T')[0]
      if (notes) lead.notes = notes
    }
    return { success: true }
  }

  try {
    const { error } = await (supabase
      .from('leads' as any) as any)
      .update({
        status: stage,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (error) throw error

    // Log activity
    await supabase.from('lead_activities' as any).insert({
      lead_id: leadId,
      type: 'status_change',
      description: `Status changed to ${stage}`,
    } as any)

    return { success: true }
  } catch (err: any) {
    console.error('[leadService] updateLeadStatus error:', err)
    return { success: false, error: err.message }
  }
}

// ── Assign Lead ──────────────────────────────────────────────

export async function assignLead(
  leadId: string,
  staffId: string,
  staffName: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const lead = LEADS_DATA.find(l => l.id === leadId)
    if (lead) {
      lead.assignedTo = staffName
      lead.lastTouched = new Date().toISOString().split('T')[0]
    }
    console.debug(`[leadService] Mock: Assigned lead ${leadId} to ${staffName} (${staffId})`)
    return { success: true }
  }

  try {
    const { error } = await (supabase
      .from('leads' as any) as any)
      .update({
        assigned_to: staffId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (error) throw error

    // Trigger fn_notify_staff_on_lead fires automatically on UPDATE

    // Log activity
    await supabase.from('lead_activities' as any).insert({
      lead_id: leadId,
      type: 'assignment',
      description: `Lead assigned to ${staffName}`,
    } as any)

    return { success: true }
  } catch (err: any) {
    console.error('[leadService] assignLead error:', err)
    return { success: false, error: err.message }
  }
}

// ── Upload Document to Lead Folder ───────────────────────────

export async function uploadLeadDocument(
  leadId: string,
  file: File,
  metadata?: { description?: string; category?: string }
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    const url = URL.createObjectURL(file)
    console.debug(`[leadService] Mock: Uploaded ${file.name} to lead ${leadId} folder`)
    return { success: true, fileUrl: url }
  }

  try {
    // Get lead's sales folder
    const { data: mapping } = await supabase
      .from('lead_folder_mappings' as any)
      .select('folder_id')
      .eq('lead_id', leadId)
      .eq('folder_type', 'sales')
      .single() as any

    const folderId = mapping?.folder_id
    const filePath = `leads/${leadId}/${Date.now()}-${file.name}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('ghl-documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ghl-documents')
      .getPublicUrl(filePath)

    // Create document record
    await supabase.from('documents' as any).insert({
      title: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      entity_type: 'lead',
      entity_id: leadId,
      folder_id: folderId,
      category: metadata?.category || 'lead-document',
      description: metadata?.description,
    } as any)

    // Log activity
    await supabase.from('lead_activities' as any).insert({
      lead_id: leadId,
      type: 'document_upload',
      description: `Document uploaded: ${file.name}`,
    } as any)

    return { success: true, fileUrl: urlData.publicUrl }
  } catch (err: any) {
    console.error('[leadService] uploadLeadDocument error:', err)
    return { success: false, error: err.message }
  }
}

// ── Convert Lead to Client ───────────────────────────────────

export async function convertLeadToClient(
  leadId: string,
  clientData?: { riskProfile?: string; initialAum?: number }
): Promise<{ success: boolean; clientId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    const lead = LEADS_DATA.find(l => l.id === leadId)
    if (lead) {
      lead.stage = 'won'
      lead.lastTouched = new Date().toISOString().split('T')[0]
    }
    console.debug(`[leadService] Mock: Converted lead ${leadId} to client`)
    return { success: true, clientId: `C-${Date.now()}` }
  }

  try {
    // Get lead details
    const { data: lead, error: leadErr } = await supabase
      .from('leads' as any)
      .select('*')
      .eq('id', leadId)
      .single() as any

    if (leadErr || !lead) throw leadErr || new Error('Lead not found')

    // Create client profile
    const { data: client, error: clientErr } = await supabase
      .from('client_profiles' as any)
      .insert({
        kyc_status: 'pending',
        account_status: 'active',
        risk_profile: clientData?.riskProfile || 'moderate',
        aum: clientData?.initialAum || lead.deal_value || 0,
        assigned_rm: lead.assigned_to,
      } as any)
      .select()
      .single() as any

    if (clientErr) throw clientErr

    // Update lead as converted
    await (supabase.from('leads' as any) as any).update({
      status: 'won',
      converted_client_id: client.id,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', leadId)

    // Create client folder
    const leadSlug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    await supabase.from('folders' as any).insert({
      name: lead.name,
      slug: `client-${leadSlug}`,
      parent_id: '00000000-0000-0000-0001-000000000003', // Client Documents root
      path: `/clients/client-${leadSlug}`,
      description: `Converted from lead. Original source: ${lead.source}`,
      icon: 'UserCheck',
      color: '#3B82F6',
    } as any)

    // Log activity
    await supabase.from('lead_activities' as any).insert({
      lead_id: leadId,
      type: 'converted',
      description: `Lead converted to client (${client.id})`,
    } as any)

    return { success: true, clientId: client.id }
  } catch (err: any) {
    console.error('[leadService] convertLeadToClient error:', err)
    return { success: false, error: err.message }
  }
}

// ── Fetch Leads (with filters) ───────────────────────────────

export async function fetchLeads(filters?: LeadFilters): Promise<Lead[]> {
  if (!isSupabaseConfigured()) {
    let results = [...LEADS_DATA]

    if (filters?.stage) {
      const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage]
      results = results.filter(l => stages.includes(l.stage))
    }
    if (filters?.source) {
      const sources = Array.isArray(filters.source) ? filters.source : [filters.source]
      results = results.filter(l => sources.includes(l.source))
    }
    if (filters?.assignedTo) {
      results = results.filter(l => l.assignedTo === filters.assignedTo)
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q)
      )
    }

    return results
  }

  try {
    let query = supabase.from('leads' as any).select('*').order('created_at', { ascending: false }) as any

    if (filters?.stage) {
      const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage]
      query = query.in('status', stages)
    }
    if (filters?.source) {
      const sources = Array.isArray(filters.source) ? filters.source : [filters.source]
      query = query.in('source', sources)
    }
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1)
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      email: l.email || '',
      phone: l.phone || '',
      source: l.source,
      stage: l.status,
      value: l.deal_value || 0,
      probability: l.probability || 0,
      aiScore: l.ai_score || 50,
      assignedTo: l.assigned_to || 'Unassigned',
      createdDate: l.created_at?.split('T')[0] || '',
      lastTouched: l.updated_at?.split('T')[0] || '',
      nextFollowUp: l.next_follow_up?.split('T')[0],
      notes: l.notes,
    }))
  } catch (err: any) {
    console.warn('[leadService] fetchLeads error:', err.message)
    return LEADS_DATA
  }
}

// ── Fetch Lead Activities ────────────────────────────────────

export async function fetchLeadActivities(leadId: string): Promise<LeadActivity[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_ACTIVITIES.filter(a => a.leadId === leadId)
  }

  try {
    const { data, error } = await supabase
      .from('lead_activities' as any)
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false }) as any

    if (error) throw error

    return (data || []).map((a: any) => ({
      id: a.id,
      leadId: a.lead_id,
      type: a.type,
      description: a.description,
      performedBy: a.performed_by,
      performedByName: a.performed_by_name,
      metadata: a.metadata,
      createdAt: a.created_at,
    }))
  } catch (err: any) {
    console.warn('[leadService] fetchLeadActivities error:', err.message)
    return MOCK_ACTIVITIES.filter(a => a.leadId === leadId)
  }
}

// ── Fetch Leads for Staff (Employee Portal) ──────────────────

export async function fetchLeadsForStaff(staffId: string): Promise<Lead[]> {
  return fetchLeads({ assignedTo: staffId })
}

// ── Fetch Staff Notifications ────────────────────────────────

export async function fetchStaffLeadNotifications(
  staffId: string,
  unreadOnly = false
): Promise<LeadNotification[]> {
  if (!isSupabaseConfigured()) {
    let results = MOCK_NOTIFICATIONS.filter(n => n.staffId === staffId)
    if (unreadOnly) results = results.filter(n => !n.isRead)
    return results
  }

  try {
    let query = supabase
      .from('staff_lead_notifications' as any)
      .select('*')
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false }) as any

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((n: any) => ({
      id: n.id,
      staffId: n.staff_id,
      leadId: n.lead_id,
      notificationType: n.notification_type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      readAt: n.read_at,
      createdAt: n.created_at,
    }))
  } catch (err: any) {
    console.warn('[leadService] fetchStaffLeadNotifications error:', err.message)
    return MOCK_NOTIFICATIONS.filter(n => n.staffId === staffId)
  }
}

// ── Mark Notification Read ───────────────────────────────────

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const n = MOCK_NOTIFICATIONS.find(x => x.id === notificationId)
    if (n) { n.isRead = true; n.readAt = new Date().toISOString() }
    return
  }

  await (supabase
    .from('staff_lead_notifications' as any) as any)
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
}

// ── Get Lead Folder Mappings ─────────────────────────────────

export async function getLeadFolderMappings(leadId: string): Promise<LeadFolderMapping[]> {
  if (!isSupabaseConfigured()) {
    // Mock — simulate folder mappings
    const slug = (LEADS_DATA.find(l => l.id === leadId)?.name || 'unknown')
      .toLowerCase().replace(/[^a-z0-9]/g, '-')
    return [
      { id: `lfm-${leadId}-s`, leadId, folderId: `mock-sales-${slug}`, folderType: 'sales', createdAt: new Date().toISOString() },
      { id: `lfm-${leadId}-r`, leadId, folderId: `mock-reports-${slug}`, folderType: 'reports', createdAt: new Date().toISOString() },
    ]
  }

  try {
    const { data, error } = await supabase
      .from('lead_folder_mappings' as any)
      .select('*')
      .eq('lead_id', leadId) as any

    if (error) throw error

    return (data || []).map((m: any) => ({
      id: m.id,
      leadId: m.lead_id,
      folderId: m.folder_id,
      folderType: m.folder_type,
      createdAt: m.created_at,
    }))
  } catch (err: any) {
    console.warn('[leadService] getLeadFolderMappings error:', err.message)
    return []
  }
}

// ── Get Lead Stats ───────────────────────────────────────────

export async function getLeadStats(): Promise<LeadStats> {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

  if (!isSupabaseConfigured()) {
    const leads = LEADS_DATA
    const byStatus: Record<string, number> = {}
    const bySource: Record<string, number> = {}
    let totalValue = 0

    leads.forEach(l => {
      byStatus[l.stage] = (byStatus[l.stage] || 0) + 1
      bySource[l.source] = (bySource[l.source] || 0) + 1
      totalValue += l.value
    })

    const won = leads.filter(l => l.stage === 'won').length
    const total = leads.length

    return {
      total,
      byStatus,
      bySource,
      byQuality: { hot: 2, warm: 3, cold: 1, unknown: total - 6 },
      thisMonth: Math.ceil(total * 0.4),
      lastMonth: Math.ceil(total * 0.35),
      conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
      avgResponseTime: 45,
      totalValue,
    }
  }

  try {
    const { data: leads, error } = await supabase
      .from('leads' as any)
      .select('*') as any

    if (error) throw error

    const all = leads || []
    const byStatus: Record<string, number> = {}
    const bySource: Record<string, number> = {}
    const byQuality: Record<string, number> = {}
    let totalValue = 0

    all.forEach((l: any) => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1
      bySource[l.source] = (bySource[l.source] || 0) + 1
      byQuality[l.lead_quality || 'unknown'] = (byQuality[l.lead_quality || 'unknown'] || 0) + 1
      totalValue += l.deal_value || 0
    })

    const thisMonth = all.filter((l: any) => l.created_at >= thisMonthStart).length
    const lastMonth = all.filter((l: any) => l.created_at >= lastMonthStart && l.created_at <= lastMonthEnd).length
    const won = all.filter((l: any) => l.status === 'won').length
    const avgRT = all.reduce((sum: number, l: any) => sum + (l.response_time_minutes || 0), 0) / (all.length || 1)

    return {
      total: all.length,
      byStatus,
      bySource,
      byQuality,
      thisMonth,
      lastMonth,
      conversionRate: all.length > 0 ? Math.round((won / all.length) * 100) : 0,
      avgResponseTime: Math.round(avgRT),
      totalValue,
    }
  } catch (err: any) {
    console.warn('[leadService] getLeadStats error:', err.message)
    return { total: 0, byStatus: {}, bySource: {}, byQuality: {}, thisMonth: 0, lastMonth: 0, conversionRate: 0, avgResponseTime: 0, totalValue: 0 }
  }
}

// ── Get Lead Source Tracking ─────────────────────────────────

export async function getLeadSourceTracking(leadId: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) {
    // Mock source tracking
    return {
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'q1-pms-campaign',
      landingPageUrl: 'https://ghlindia.com/pms-offering',
      referrerUrl: 'https://www.google.com',
      geoCity: 'Mumbai',
      geoState: 'Maharashtra',
      deviceType: 'desktop',
    }
  }

  try {
    const { data, error } = await supabase
      .from('lead_source_tracking' as any)
      .select('*')
      .eq('lead_id', leadId)
      .single() as any

    if (error) return null
    return data
  } catch {
    return null
  }
}
