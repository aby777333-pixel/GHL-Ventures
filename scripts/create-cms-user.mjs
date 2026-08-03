#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   Provision a Content Studio (/cms) login.

   These accounts can sign in to the standalone blog console and
   NOWHERE else — the blog-only roles are not in adminAuthService's
   ADMIN_ROLES whitelist, so /admin rejects them, and the database
   grants them no policy on clients, KYC, investments or payouts.

   Usage:
     node scripts/create-cms-user.mjs <email> [name] [editor|author]

     editor (default) — full control: publish, delete, CMS settings
     author           — write and edit only; cannot delete or change settings

   Re-running for an existing email resets that account's password.
   ───────────────────────────────────────────────────────────── */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const out = { ...process.env }
  for (const f of ['.env.local', '.env']) {
    try {
      for (const line of readFileSync(resolve(ROOT, f), 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    } catch { /* optional */ }
  }
  return out
}

const env = loadEnv()
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !KEY) {
  console.error('✖ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const [emailArg, nameArg, roleArg] = process.argv.slice(2)
if (!emailArg) {
  console.error('Usage: node scripts/create-cms-user.mjs <email> [name] [editor|author]')
  process.exit(1)
}

const EMAIL = emailArg.trim().toLowerCase()
const NAME = (nameArg || 'Content Team').trim()
const ROLE = (roleArg || 'editor').toLowerCase() === 'author' ? 'blog_author' : 'blog_editor'

/** Unambiguous alphabet — no O/0, l/1/I — so passwords survive being
 *  read aloud or retyped. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
const chunk = (n) => Array.from(randomBytes(n)).map((b) => ALPHABET[b % ALPHABET.length]).join('')
const PASSWORD = `${chunk(5)}-${chunk(5)}-${chunk(5)}`

const sb = createClient(URL, KEY, { auth: { persistSession: false } })

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    const hit = data.users.find((u) => (u.email || '').toLowerCase() === email)
    if (hit) return hit
    if (data.users.length < 1000) return null
  }
  return null
}

async function main() {
  const existing = await findUserByEmail(EMAIL)
  let userId

  if (existing) {
    userId = existing.id
    const { error } = await sb.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
    })
    if (error) throw new Error(`password reset failed: ${error.message}`)
    console.log('↻ existing account — password reset')
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: NAME },
    })
    if (error) throw new Error(`create failed: ${error.message}`)
    userId = data.user.id
    console.log('+ account created')
  }

  const { error: pErr } = await sb.from('profiles').upsert(
    { id: userId, email: EMAIL, full_name: NAME, role: ROLE },
    { onConflict: 'id' },
  )
  if (pErr) throw new Error(`profile failed: ${pErr.message}`)

  console.log('\n  Console:  https://ghlindiaventures.com/cms')
  console.log(`  Email:    ${EMAIL}`)
  console.log(`  Password: ${PASSWORD}`)
  console.log(`  Role:     ${ROLE}`)
  console.log(`  User id:  ${userId}`)
  console.log('\n  Ask them to change it on first sign-in (sidebar → Change password).\n')
}

main().catch((e) => { console.error('✖', e.message); process.exit(1) })
