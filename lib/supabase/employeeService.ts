/* ─────────────────────────────────────────────────────────────
   Employee Service — CRUD operations for employee management.

   - createEmployee: calls Netlify function (needs service_role)
   - getEmployeeDirectory: uses RPC to get staff+profiles join
   - getActiveRMs: fetches available RMs for assignment/transfer
   - assignRMToClient: manually assigns RM to a client
   ───────────────────────────────────────────────────────────── */

'use client'

import { supabase, isSupabaseConfigured, getAuthToken } from './client'

const db = supabase as any

// ── Types ─────────────────────────────────────────────────

export interface EmployeeRecord {
  id: string
  user_id: string
  employee_id: string
  name: string
  email: string
  phone: string
  department: string
  role: string
  join_date: string
  reporting_to: string | null
  reporting_to_name: string | null
  skills: string[]
  certifications: string[]
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface ActiveRM {
  staff_id: string
  user_id: string
  full_name: string
  designation: string
  department: string
  client_count: number
}

// ── Create Employee (via Netlify function) ────────────────

export async function createEmployee(input: {
  email: string
  password: string
  fullName: string
  phone?: string
  employeeId?: string
  department: string
  designation: string
  dateOfJoining?: string
  reportingTo?: string | null
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const token = await getAuthToken()
    if (!token) {
      return { success: false, error: 'Authentication required — please log in again' }
    }
    const response = await fetch('/.netlify/functions/create-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(input),
    })

    let data: any
    try {
      data = await response.json()
    } catch {
      return { success: false, error: `Server error (${response.status}) — could not parse response` }
    }

    if (!response.ok) {
      return { success: false, error: data.error || `Failed to create employee (${response.status})` }
    }

    return { success: true, userId: data.userId }
  } catch (err: any) {
    console.error('[employeeService] createEmployee failed:', err)
    return { success: false, error: `Network error: ${err?.message || 'could not reach server'}. Check your connection and try again.` }
  }
}

// ── Update Employee ───────────────────────────────────────

export async function updateEmployee(
  staffProfileId: string,
  userId: string,
  updates: {
    fullName?: string
    phone?: string
    department?: string
    designation?: string
    dateOfJoining?: string
    status?: string
    reportingTo?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }

  try {
    // Update profiles table (name, phone)
    const profileUpdates: Record<string, any> = {}
    if (updates.fullName) profileUpdates.full_name = updates.fullName
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileErr } = await db
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)
      if (profileErr) {
        console.error('[employeeService] updateEmployee profiles failed:', profileErr.message)
        return { success: false, error: profileErr.message }
      }
    }

    // Update staff_profiles table (department, designation, etc.)
    const staffUpdates: Record<string, any> = {}
    if (updates.department) staffUpdates.department = updates.department
    if (updates.designation) staffUpdates.designation = updates.designation
    if (updates.dateOfJoining) staffUpdates.date_of_joining = updates.dateOfJoining
    if (updates.status) staffUpdates.status = updates.status
    if (updates.status) staffUpdates.is_active = updates.status === 'active'
    if (updates.reportingTo !== undefined) staffUpdates.reporting_to = updates.reportingTo

    if (Object.keys(staffUpdates).length > 0) {
      const { error: staffErr } = await db
        .from('staff_profiles')
        .update(staffUpdates)
        .eq('id', staffProfileId)
      if (staffErr) {
        console.error('[employeeService] updateEmployee staff_profiles failed:', staffErr.message)
        return { success: false, error: staffErr.message }
      }
    }

    return { success: true }
  } catch (err) {
    console.error('[employeeService] updateEmployee failed:', err)
    return { success: false, error: 'Network error' }
  }
}

// ── Get Employee Directory ────────────────────────────────

export async function getEmployeeDirectory(): Promise<EmployeeRecord[]> {
  if (!isSupabaseConfigured()) return []

  try {
    // Try the RPC first (joins staff_profiles + profiles + auth.users email)
    const { data, error } = await db.rpc('get_employee_directory')

    if (!error && data && Array.isArray(data)) {
      return data.map((e: any) => ({
        id: e.id,
        user_id: e.user_id,
        employee_id: e.employee_id || '',
        name: e.name || '',
        email: e.email || '',
        phone: e.phone || '',
        department: e.department || '',
        role: e.role || '',
        join_date: e.join_date || '',
        reporting_to: e.reporting_to || null,
        reporting_to_name: e.reporting_to_name || null,
        skills: e.skills || [],
        certifications: e.certifications || [],
        status: e.status || 'active',
        created_at: e.created_at || '',
        updated_at: e.updated_at || '',
      }))
    }

    // Fallback: direct query with join
    console.warn('[employeeService] RPC failed, using direct query:', error?.message)
    const { data: staffData, error: staffErr } = await (supabase
      .from('staff_profiles')
      .select('*, profiles!inner(full_name, phone)')
      .order('created_at', { ascending: false }) as any)

    if (staffErr || !staffData) return []

    return (staffData as any[]).map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      employee_id: s.employee_id || '',
      name: s.profiles?.full_name || '',
      email: '',
      phone: s.profiles?.phone || '',
      department: s.department || '',
      role: s.designation || '',
      join_date: s.date_of_joining || s.created_at?.split('T')[0] || '',
      reporting_to: s.reporting_to || null,
      reporting_to_name: null,
      skills: s.skills || [],
      certifications: s.certifications || [],
      status: s.is_active ? 'active' : 'inactive',
      created_at: s.created_at || '',
      updated_at: s.updated_at || '',
    }))
  } catch (err) {
    console.error('[employeeService] getEmployeeDirectory failed:', err)
    return []
  }
}

// ── Get Active RMs (for assignment dropdowns) ─────────────

export async function getActiveRMs(): Promise<ActiveRM[]> {
  if (!isSupabaseConfigured()) {
    console.warn('[employeeService] getActiveRMs: Supabase not configured')
    return []
  }

  try {
    // Try RPC first
    const { data, error } = await db.rpc('get_active_rms')
    console.log('[employeeService] getActiveRMs RPC result:', { count: data?.length, error: error?.message })

    if (!error && data && Array.isArray(data) && data.length > 0) {
      return data.map((rm: any) => ({
        staff_id: rm.staff_id,
        user_id: rm.user_id,
        full_name: rm.full_name || '',
        designation: rm.designation || '',
        department: rm.department || '',
        client_count: rm.client_count || 0,
      }))
    }

    // Fallback: direct query if RPC fails or returns empty
    console.warn('[employeeService] get_active_rms RPC failed or empty, using fallback:', error?.message)
    const { data: rmData, error: fbErr } = await db
      .from('staff_profiles')
      .select('id, user_id, designation, department')
      .in('designation', ['relationship-manager', 'team-leader', 'cs-lead', 'senior-cs-agent', 'field-sales-executive', 'field-sales-manager'])
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    console.log('[employeeService] Fallback query result:', { count: rmData?.length, error: fbErr?.message })
    if (!rmData || rmData.length === 0) return []

    // Get profile names separately
    const userIds = (rmData as any[]).map((r: any) => r.user_id).filter(Boolean)
    const { data: profileData } = await db
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    const nameMap: Record<string, string> = {}
    ;(profileData || []).forEach((p: any) => { nameMap[p.id] = p.full_name || '' })

    return (rmData as any[]).map((rm: any) => ({
      staff_id: rm.id,
      user_id: rm.user_id,
      full_name: nameMap[rm.user_id] || '',
      designation: rm.designation || '',
      department: rm.department || '',
      client_count: 0,
    }))
  } catch (err) {
    console.error('[employeeService] getActiveRMs failed:', err)
    return []
  }
}

// ── Auto-assign RM to Client ──────────────────────────────

export async function autoAssignRMToClient(clientUserId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await db.rpc('auto_assign_rm_to_client', {
      p_client_user_id: clientUserId,
    })

    if (error) {
      console.warn('[employeeService] auto_assign_rm_to_client failed:', error.message)
      return null
    }

    return data || null
  } catch (err) {
    console.error('[employeeService] autoAssignRMToClient failed:', err)
    return null
  }
}

// ── Manually Assign RM to Client (Super Admin) ───────────

export async function assignRMToClient(
  clientId: string,
  rmStaffId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Service unavailable' }
  }

  try {
    const { error } = await db.rpc('assign_rm_to_client', {
      p_client_id: clientId,
      p_rm_staff_id: rmStaffId,
    })

    if (error) {
      console.error('[employeeService] assign_rm_to_client failed:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[employeeService] assignRMToClient failed:', err)
    return { success: false, error: 'Network error' }
  }
}
