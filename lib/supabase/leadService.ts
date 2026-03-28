/* ─────────────────────────────────────────────────────────────
   Lead Service — Comprehensive lead management (production)

   Handles:
   - Lead CRUD with auto-folder creation in Sales & Reports
   - Lead assignment & routing to staff (employee portal)
   - Document attachment per lead
   - Source tracking (campaigns, website, landing pages, calls)
   - Lead-to-client conversion
   - Stats & analytics

   All data from real Supabase tables.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'
import type { Lead, LeadStage, LeadSource } from '../admin/adminTypes'

// ── Types ────────────────────────────────────────────────────

export interface CreateLeadInput {
  name: string
  email?: string
  phone?: string
  source: LeadSource | string
  stage?: LeadStage
  value?: number
  probability?: number
  assignedTo?: string
  notes?: string
  tags?: string[]
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp' | 'in-person'
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

// ── Helper: map DB row to Lead type ─────────────────────────
function mapLead(l: any): Lead {
  return {
    id: l.id,
    name: [l.first_name, l.last_name].filter(Boolean).join(' ') || l.name || '',
    email: l.email || '',
    phone: l.phone || '',
    source: l.source || 'website',
    stage: l.status || 'new',
    value: l.estimated_value || 0,
    probability: Math.min(100, Math.max(0, l.score || 0)),
    aiScore: l.score || 50,
    assignedTo: l.assigned_to || 'Unassigned',
    createdDate: l.created_at?.split('T')[0] || '',
    lastTouched: (l.last_contacted || l.updated_at)?.split('T')[0] || '',
    nextFollowUp: l.next_follow_up?.split('T')[0],
    notes: l.notes,
  }
}

// ── Create Lead ──────────────────────────────────────────────

export async function createLead(input: CreateLeadInput): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Service unavailable' }
  }

  try {
    const nameParts = input.name.split(' ')
    const { data: lead, error } = await supabase
      .from('leads' as any)
      .insert({
        first_name: nameParts[0] || input.name,
        last_name: nameParts.slice(1).join(' ') || '',
        email: input.email,
        phone: input.phone,
        source: input.source,
        status: input.stage || 'new',
        estimated_value: input.value || 0,
        score: input.probability || 20,
        assigned_to: (input.assignedTo === 'Unassigned' || !input.assignedTo) ? null : input.assignedTo,
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

    return { success: true, lead: mapLead(lead) }
  } catch (err: any) {
    console.error('[leadService] createLead error:', err)
    return { success: false, error: err.message || 'Failed to create lead' }
  }
}

// ── Update Lead (full edit) ──────────────────────────────────

export async function updateLead(
  leadId: string,
  input: Partial<CreateLeadInput>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }

  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (input.name !== undefined) {
      const parts = input.name.split(' ')
      updates.first_name = parts[0] || input.name
      updates.last_name = parts.slice(1).join(' ') || ''
    }
    if (input.email !== undefined) updates.email = input.email
    if (input.phone !== undefined) updates.phone = input.phone
    if (input.source !== undefined) updates.source = input.source
    if (input.stage !== undefined) updates.status = input.stage
    if (input.value !== undefined) updates.estimated_value = input.value
    if (input.probability !== undefined) updates.score = input.probability
    if (input.assignedTo !== undefined) updates.assigned_to = (input.assignedTo === 'Unassigned' || !input.assignedTo) ? null : input.assignedTo
    if (input.notes !== undefined) updates.notes = input.notes

    const db = supabase as any
    const { error } = await db
      .from('leads')
      .update(updates)
      .eq('id', leadId)

    if (error) throw error

    await db.from('lead_activities').insert({
      lead_id: leadId,
      type: 'updated',
      description: `Lead details updated`,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[leadService] updateLead error:', err)
    return { success: false, error: err.message || 'Failed to update lead' }
  }
}

// ── Update Lead Status ───────────────────────────────────────

export async function updateLeadStatus(
  leadId: string,
  stage: LeadStage,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }

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
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }

  try {
    const { error } = await (supabase
      .from('leads' as any) as any)
      .update({
        assigned_to: staffId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (error) throw error

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
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }

  try {
    const { data: mapping } = await supabase
      .from('lead_folder_mappings' as any)
      .select('folder_id')
      .eq('lead_id', leadId)
      .eq('folder_type', 'sales')
      .single() as any

    const folderId = mapping?.folder_id
    const filePath = `leads/${leadId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('ghl-documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('ghl-documents')
      .getPublicUrl(filePath)

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
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }

  try {
    const { data: lead, error: leadErr } = await supabase
      .from('leads' as any)
      .select('*')
      .eq('id', leadId)
      .single() as any

    if (leadErr || !lead) throw leadErr || new Error('Lead not found')

    const { data: client, error: clientErr } = await supabase
      .from('clients' as any)
      .insert({
        full_name: lead.name,
        email: lead.email,
        phone: lead.phone,
        kyc_status: 'pending',
        risk_profile: clientData?.riskProfile || 'moderate',
        total_invested: clientData?.initialAum || lead.deal_value || 0,
        assigned_rm: lead.assigned_to,
        acquisition_source: lead.source,
      } as any)
      .select()
      .single() as any

    if (clientErr) throw clientErr

    await (supabase.from('leads' as any) as any).update({
      status: 'won',
      converted_client_id: client.id,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', leadId)

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
  if (!isSupabaseConfigured()) return []

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

    return (data || []).map(mapLead)
  } catch (err: any) {
    console.warn('[leadService] fetchLeads error:', err.message)
    return []
  }
}

// ── Fetch Lead Activities ────────────────────────────────────

export async function fetchLeadActivities(leadId: string): Promise<LeadActivity[]> {
  if (!isSupabaseConfigured()) return []

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
    return []
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
  if (!isSupabaseConfigured()) return []

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
    return []
  }
}

// ── Mark Notification Read ───────────────────────────────────

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!isSupabaseConfigured()) return

  await (supabase
    .from('staff_lead_notifications' as any) as any)
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
}

// ── Get Lead Folder Mappings ─────────────────────────────────

export async function getLeadFolderMappings(leadId: string): Promise<LeadFolderMapping[]> {
  if (!isSupabaseConfigured()) return []

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
  const empty: LeadStats = { total: 0, byStatus: {}, bySource: {}, byQuality: {}, thisMonth: 0, lastMonth: 0, conversionRate: 0, avgResponseTime: 0, totalValue: 0 }
  if (!isSupabaseConfigured()) return empty

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

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
    return empty
  }
}

// ── Get Lead Source Tracking ─────────────────────────────────

export async function getLeadSourceTracking(leadId: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) return null

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

// ── Delete Lead ─────────────────────────────────────────────

export async function deleteLead(leadId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true

  try {
    const { error } = await supabase
      .from('leads' as any)
      .delete()
      .eq('id', leadId)
    return !error
  } catch {
    return false
  }
}
