/* ─────────────────────────────────────────────────────────────
   Monday.com Service — GraphQL client & board operations

   Routes all API calls through /.netlify/functions/monday-proxy
   so the API key stays server-side.
   Passes Supabase auth token for server-side verification.

   Falls back gracefully when Monday.com is not configured.
   ───────────────────────────────────────────────────────────── */

import { getAuthToken } from '@/lib/supabase/client'

// ── Config ──────────────────────────────────────────────────

const PROXY_URL = '/.netlify/functions/monday-proxy'
const MONDAY_KEY_STORAGE = 'ghl_monday_api_key'

export function getMondayApiKey(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(MONDAY_KEY_STORAGE) || ''
}

export function setMondayApiKey(key: string): void {
  if (typeof window === 'undefined') return
  if (key) sessionStorage.setItem(MONDAY_KEY_STORAGE, key)
  else sessionStorage.removeItem(MONDAY_KEY_STORAGE)
}

export function isMondayConfigured(): boolean {
  return Boolean(getMondayApiKey())
}

// ── Types ───────────────────────────────────────────────────

export interface MondayBoard {
  id: string
  name: string
  description?: string
  state: string
  board_kind: string
  columns: MondayColumn[]
  groups: MondayGroup[]
  items_count: number
}

export interface MondayColumn {
  id: string
  title: string
  type: string
}

export interface MondayGroup {
  id: string
  title: string
  color: string
}

export interface MondayItem {
  id: string
  name: string
  group: { id: string; title: string }
  column_values: {
    id: string
    title: string
    text: string
    value: string | null
    type: string
  }[]
  created_at: string
  updated_at: string
}

export interface MondaySyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
  timestamp: string
}

export interface MondayBoardMapping {
  boardId: string
  boardName: string
  mappingType: 'leads' | 'tasks' | 'tickets'
  columnMappings: Record<string, string>
  groupId?: string
  lastSync?: string
  syncDirection: 'push' | 'pull' | 'bidirectional'
}

// ── GraphQL Helper ──────────────────────────────────────────

async function mondayQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data: T | null; errors?: { message: string }[] }> {
  try {
    const clientKey = getMondayApiKey()
    const authToken = await getAuthToken()
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}) },
      body: JSON.stringify({
        query,
        variables,
        // Only send client key if set — otherwise proxy uses server env var
        ...(clientKey ? { apiKey: clientKey } : {}),
      }),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(errBody?.error?.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Monday.com API error'
    console.warn('[mondayService]', message)
    return { data: null, errors: [{ message }] }
  }
}

// ── Connection Test ─────────────────────────────────────────

export async function testConnection(): Promise<{
  success: boolean
  accountName?: string
  userName?: string
  error?: string
}> {
  const { data, errors } = await mondayQuery<{ me: { name: string; account: { name: string } } }>(`
    query { me { name account { name } } }
  `)

  if (errors?.length || !data) {
    return { success: false, error: errors?.[0]?.message || 'Connection failed' }
  }

  return {
    success: true,
    accountName: data.me.account.name,
    userName: data.me.name,
  }
}

// ── Board Operations ────────────────────────────────────────

export async function fetchBoards(): Promise<MondayBoard[]> {
  const { data, errors } = await mondayQuery<{ boards: MondayBoard[] }>(`
    query {
      boards(limit: 50, order_by: created_at) {
        id name description state board_kind items_count
        columns { id title type }
        groups { id title color }
      }
    }
  `)

  if (errors?.length || !data) return []
  return data.boards.filter(b => b.state === 'active')
}

export async function fetchBoardItems(
  boardId: string,
  limit = 100,
): Promise<MondayItem[]> {
  const { data, errors } = await mondayQuery<{
    boards: { items_page: { items: MondayItem[] } }[]
  }>(`
    query ($boardId: [ID!]!, $limit: Int!) {
      boards(ids: $boardId) {
        items_page(limit: $limit) {
          items {
            id name created_at updated_at
            group { id title }
            column_values { id title text value type }
          }
        }
      }
    }
  `, { boardId: [boardId], limit })

  if (errors?.length || !data?.boards?.[0]) return []
  return data.boards[0].items_page.items
}

// ── Item CRUD ───────────────────────────────────────────────

export interface CreateItemResult {
  success: boolean
  item?: { id: string; name: string }
  error?: string
}

export async function createItem(
  boardId: string,
  groupId: string,
  itemName: string,
  columnValues: Record<string, unknown>,
): Promise<CreateItemResult> {
  const { data, errors } = await mondayQuery<{ create_item: { id: string; name: string } }>(`
    mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId
        group_id: $groupId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id name
      }
    }
  `, {
    boardId,
    groupId,
    itemName,
    columnValues: JSON.stringify(columnValues),
  })

  if (errors?.length || !data) {
    return { success: false, error: errors?.[0]?.message || 'Unknown Monday.com error' }
  }
  return { success: true, item: data.create_item }
}

// ── Fetch board groups ─────────────────────────────────────

export async function fetchBoardGroups(boardId: string): Promise<MondayGroup[]> {
  const { data, errors } = await mondayQuery<{ boards: { groups: MondayGroup[] }[] }>(`
    query ($boardId: [ID!]!) {
      boards(ids: $boardId) {
        groups { id title color }
      }
    }
  `, { boardId: [boardId] })

  if (errors?.length || !data?.boards?.[0]) return []
  return data.boards[0].groups
}

// ── Fetch board columns ────────────────────────────────────

export async function fetchBoardColumns(boardId: string): Promise<MondayColumn[]> {
  const { data, errors } = await mondayQuery<{ boards: { columns: MondayColumn[] }[] }>(`
    query ($boardId: [ID!]!) {
      boards(ids: $boardId) {
        columns { id title type }
      }
    }
  `, { boardId: [boardId] })

  if (errors?.length || !data?.boards?.[0]) return []
  return data.boards[0].columns
}

export async function updateItem(
  boardId: string,
  itemId: string,
  columnValues: Record<string, unknown>,
): Promise<boolean> {
  const { data, errors } = await mondayQuery<{ change_multiple_column_values: { id: string } }>(`
    mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId
        item_id: $itemId
        column_values: $columnValues
      ) {
        id
      }
    }
  `, { boardId, itemId, columnValues: JSON.stringify(columnValues) })

  return !errors?.length && Boolean(data)
}

// ── Lead Sync ───────────────────────────────────────────────

import type { Lead, LeadStage } from './admin/adminTypes'

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export async function pushLeadsToMonday(
  leads: Lead[],
  boardId: string,
  columnMappings: Record<string, string>,
  groupId?: string,
): Promise<MondaySyncResult> {
  const result: MondaySyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  }

  // Auto-detect group if none provided — use first group on the board
  let targetGroup = groupId
  if (!targetGroup) {
    try {
      const groups = await fetchBoardGroups(boardId)
      targetGroup = groups[0]?.id || 'topics'
    } catch {
      targetGroup = 'topics'
    }
  }

  for (const lead of leads) {
    try {
      const colVals: Record<string, unknown> = {}

      if (columnMappings.email) colVals[columnMappings.email] = { email: lead.email, text: lead.email }
      if (columnMappings.phone) colVals[columnMappings.phone] = lead.phone
      if (columnMappings.source) colVals[columnMappings.source] = lead.source
      if (columnMappings.stage) colVals[columnMappings.stage] = { label: STAGE_LABELS[lead.stage] || lead.stage }
      if (columnMappings.value) colVals[columnMappings.value] = String(lead.value)
      if (columnMappings.assignedTo) colVals[columnMappings.assignedTo] = lead.assignedTo

      const created = await createItem(boardId, targetGroup, lead.name, colVals)
      if (created.success) {
        result.synced++
      } else {
        result.failed++
        result.errors.push(`${lead.name}: ${created.error}`)
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push(`${lead.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  result.success = result.failed === 0
  return result
}

export function mondayItemToLead(
  item: MondayItem,
  columnMappings: Record<string, string>,
): Partial<Lead> {
  const getCol = (field: string): string => {
    const colId = columnMappings[field]
    if (!colId) return ''
    return item.column_values.find(c => c.id === colId)?.text || ''
  }

  return {
    name: item.name,
    email: getCol('email'),
    phone: getCol('phone'),
    source: (getCol('source') || 'website') as Lead['source'],
    value: Number(getCol('value')) || 0,
    assignedTo: getCol('assignedTo') || 'Unassigned',
    createdDate: item.created_at?.split('T')[0] || '',
    lastTouched: item.updated_at?.split('T')[0] || '',
  }
}

// ── Board Mapping Persistence ───────────────────────────────

const MAPPING_KEY = 'ghl_monday_board_mappings'

export function getSavedMappings(): MondayBoardMapping[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(MAPPING_KEY) || '[]')
  } catch { return [] }
}

export function saveBoardMapping(mapping: MondayBoardMapping): void {
  const existing = getSavedMappings()
  const idx = existing.findIndex(m => m.boardId === mapping.boardId && m.mappingType === mapping.mappingType)
  if (idx >= 0) existing[idx] = mapping
  else existing.push(mapping)
  localStorage.setItem(MAPPING_KEY, JSON.stringify(existing))
}

export function removeBoardMapping(boardId: string, mappingType: string): void {
  const filtered = getSavedMappings().filter(m => !(m.boardId === boardId && m.mappingType === mappingType))
  localStorage.setItem(MAPPING_KEY, JSON.stringify(filtered))
}
