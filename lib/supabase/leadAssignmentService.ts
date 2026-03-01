/* ─────────────────────────────────────────────────────────────
   Lead Auto-Assignment Service — Round-Robin Load Balancing

   After a new lead is inserted, this service:
   1. Finds active staff members
   2. Assigns to the least-loaded staff (fewest open leads)
   3. Creates a notification for the assigned staff + all admins
   4. Logs the assignment in audit_logs
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

const sb = supabase as any

/**
 * Auto-assign a lead to the least-loaded active staff member.
 * Uses round-robin: picks the staff member with the fewest non-closed leads.
 */
export async function autoAssignLead(leadId: string): Promise<{ success: boolean; assignedTo?: string }> {
  if (!isSupabaseConfigured() || !leadId) return { success: false }

  try {
    // 1. Get all active staff members
    const { data: staffProfiles, error: staffErr } = await sb
      .from('staff_profiles')
      .select('id, user_id, designation')
      .eq('is_active', true)

    if (staffErr || !staffProfiles?.length) {
      console.warn('[leadAssign] No active staff found:', staffErr?.message)
      return { success: false }
    }

    // 2. Count open leads per staff member (status not in closed_won, closed_lost)
    const staffIds = staffProfiles.map((s: any) => s.user_id)
    const { data: leadCounts, error: countErr } = await sb
      .from('leads')
      .select('assigned_to')
      .in('assigned_to', staffIds)
      .not('status', 'in', '("closed_won","closed_lost")')

    // Build count map
    const countMap: Record<string, number> = {}
    staffIds.forEach((id: string) => { countMap[id] = 0 })
    if (leadCounts) {
      leadCounts.forEach((l: any) => {
        if (l.assigned_to && countMap[l.assigned_to] !== undefined) {
          countMap[l.assigned_to]++
        }
      })
    }

    // 3. Find least-loaded staff member
    let leastLoaded = staffIds[0]
    let minCount = countMap[staffIds[0]] ?? 0
    for (const id of staffIds) {
      if ((countMap[id] ?? 0) < minCount) {
        minCount = countMap[id] ?? 0
        leastLoaded = id
      }
    }

    // 4. Assign the lead
    const now = new Date().toISOString()
    const { error: updateErr } = await sb
      .from('leads')
      .update({
        assigned_to: leastLoaded,
        assigned_at: now,
        status: 'assigned',
        updated_at: now,
      })
      .eq('id', leadId)

    if (updateErr) {
      console.warn('[leadAssign] Failed to assign lead:', updateErr.message)
      return { success: false }
    }

    // 5. Get the staff member's name for notifications
    const staff = staffProfiles.find((s: any) => s.user_id === leastLoaded)
    const { data: staffProfile } = await sb
      .from('profiles')
      .select('full_name')
      .eq('id', leastLoaded)
      .single()
    const staffName = staffProfile?.full_name || 'Staff Member'

    // 6. Create notification for assigned staff
    await sb.from('notifications').insert({
      user_id: leastLoaded,
      title: 'New Lead Assigned',
      message: `A new lead has been assigned to you. Check your lead queue.`,
      type: 'action_required',
      link: '/staff/leads',
      metadata: { lead_id: leadId },
    })

    // 7. Notify all admins
    const { data: admins } = await sb
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin'])
      .eq('is_active', true)

    if (admins?.length) {
      const adminNotifs = admins.map((a: any) => ({
        user_id: a.id,
        title: 'New Lead Received',
        message: `New lead auto-assigned to ${staffName}`,
        type: 'info',
        link: '/admin/leads',
        metadata: { lead_id: leadId, assigned_to: leastLoaded },
      }))
      await sb.from('notifications').insert(adminNotifs)
    }

    // 8. Log to audit trail
    await sb.from('audit_logs').insert({
      action: 'lead_auto_assigned',
      entity_type: 'lead',
      entity_id: leadId,
      details: {
        assigned_to: leastLoaded,
        staff_name: staffName,
        method: 'round_robin',
        open_leads_count: minCount,
      },
    })

    return { success: true, assignedTo: leastLoaded }

  } catch (err) {
    console.warn('[leadAssign] Auto-assignment exception:', err)
    return { success: false }
  }
}

/**
 * Manually reassign a lead to a different staff member.
 * Creates audit trail + notifications for both old and new assignee.
 */
export async function reassignLead(
  leadId: string,
  newAssigneeId: string,
  reassignedBy: string,
): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) return { success: false }

  try {
    // Get current assignment
    const { data: lead } = await sb
      .from('leads')
      .select('assigned_to, first_name, last_name')
      .eq('id', leadId)
      .single()

    const oldAssignee = lead?.assigned_to
    const leadName = [lead?.first_name, lead?.last_name].filter(Boolean).join(' ')
    const now = new Date().toISOString()

    // Update assignment
    const { error } = await sb
      .from('leads')
      .update({
        assigned_to: newAssigneeId,
        assigned_at: now,
        updated_at: now,
      })
      .eq('id', leadId)

    if (error) throw error

    // Get names for notifications
    const { data: newProfile } = await sb.from('profiles').select('full_name').eq('id', newAssigneeId).single()
    const { data: byProfile } = await sb.from('profiles').select('full_name').eq('id', reassignedBy).single()

    // Notify new assignee
    await sb.from('notifications').insert({
      user_id: newAssigneeId,
      title: 'Lead Reassigned to You',
      message: `Lead "${leadName}" has been reassigned to you by ${byProfile?.full_name || 'Admin'}.`,
      type: 'action_required',
      link: '/staff/leads',
      metadata: { lead_id: leadId },
    })

    // Notify old assignee (if exists)
    if (oldAssignee && oldAssignee !== newAssigneeId) {
      await sb.from('notifications').insert({
        user_id: oldAssignee,
        title: 'Lead Reassigned',
        message: `Lead "${leadName}" has been reassigned to ${newProfile?.full_name || 'another team member'}.`,
        type: 'info',
        metadata: { lead_id: leadId },
      })
    }

    // Audit log
    await sb.from('audit_logs').insert({
      actor_id: reassignedBy,
      action: 'lead_reassigned',
      entity_type: 'lead',
      entity_id: leadId,
      details: {
        old_assignee: oldAssignee,
        new_assignee: newAssigneeId,
        lead_name: leadName,
      },
    })

    return { success: true }
  } catch (err) {
    console.warn('[leadAssign] Reassignment error:', err)
    return { success: false }
  }
}
