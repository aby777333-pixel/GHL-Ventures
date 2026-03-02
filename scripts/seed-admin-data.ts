/* ─────────────────────────────────────────────────────────────
   Seed Admin Data — Populates Supabase with demo users & data

   Run manually after setting up Supabase:
   npx ts-node --esm scripts/seed-admin-data.ts

   Requires SUPABASE_SERVICE_ROLE_KEY env var for admin access.

   Schema reference:
   - profiles: id (FK auth.users), role (user_role enum), full_name, phone, city, department, job_title
   - staff_profiles: id (UUID PK), user_id (FK auth.users), employee_id, department, designation
   - clients: id (UUID PK), user_id (FK auth.users), full_name, email, phone, city, kyc_status, risk_profile, total_invested
   - No admin_profiles table — admins use profiles.role = 'admin' or 'super_admin'
   ───────────────────────────────────────────────────────────── */

import { createClient } from '@supabase/supabase-js'

// Load from env
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Set these environment variables before running this script.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Demo Users ──────────────────────────────────────────────

const DEMO_ADMIN_USERS = [
  {
    email: 'admin@ghlindia.com',
    password: 'admin123',
    name: 'Rajesh Kumar',
    role: 'super_admin' as const,
    department: 'Management',
    jobTitle: 'Super Administrator',
  },
  {
    email: 'ceo@ghlindia.com',
    password: 'ceo123',
    name: 'Vikram Mehta',
    role: 'admin' as const,
    department: 'Executive',
    jobTitle: 'CEO',
  },
  {
    email: 'compliance@ghlindia.com',
    password: 'comp123',
    name: 'Priya Sharma',
    role: 'admin' as const,
    department: 'Compliance',
    jobTitle: 'Compliance Officer',
  },
]

const DEMO_STAFF_USERS = [
  {
    email: 'staff@ghlindia.com',
    password: 'staff123',
    name: 'Ananya Singh',
    designation: 'senior-cs-agent',
    department: 'Customer Service',
    employeeId: 'GHL-CS-001',
  },
  {
    email: 'field@ghlindia.com',
    password: 'field123',
    name: 'Rahul Patel',
    designation: 'field-sales-executive',
    department: 'Field Operations',
    employeeId: 'GHL-FO-001',
  },
]

const DEMO_CLIENT_USERS = [
  {
    email: 'client@ghlindia.com',
    password: 'client123',
    name: 'Arun Mehta',
    riskProfile: 'moderate',
    kycStatus: 'verified',
    totalInvested: 25000000,
    city: 'Mumbai',
  },
  {
    email: 'client2@ghlindia.com',
    password: 'client123',
    name: 'Sneha Kapoor',
    riskProfile: 'aggressive',
    kycStatus: 'verified',
    totalInvested: 50000000,
    city: 'Delhi',
  },
]

// ── Helper: create or get existing user ──────────────────────

async function ensureAuthUser(email: string, password: string, name: string): Promise<string | null> {
  // Try to create the user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, full_name: name },
  })

  if (data?.user) return data.user.id

  if (error?.message?.includes('already been registered') || error?.message?.includes('already exists')) {
    // User exists — look up their ID
    const { data: listData } = await supabase.auth.admin.listUsers()
    const existing = listData?.users?.find(u => u.email === email)
    if (existing) {
      console.log(`  ♻️  ${email}: exists (id: ${existing.id.substring(0, 8)}…) — updating password & profiles`)
      // Update password to ensure it matches
      await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { name, full_name: name },
      })
      return existing.id
    }
    console.error(`  ❌ ${email}: registered but could not find user ID`)
    return null
  }

  console.error(`  ❌ ${email}: ${error?.message}`)
  return null
}

// ── Seed Demo Users ─────────────────────────────────────────

async function seedDemoUsers() {
  console.log('\n📌 Creating/refreshing demo users…')

  // ── Admin Users ──
  for (const u of DEMO_ADMIN_USERS) {
    const userId = await ensureAuthUser(u.email, u.password, u.name)
    if (!userId) continue

    // Upsert profile (profiles table — PK is auth.users.id)
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: u.name,
      role: u.role,
      department: u.department,
      job_title: u.jobTitle,
      is_active: true,
    }, { onConflict: 'id' })
    if (pErr) console.error(`    ❌ profiles for ${u.email}:`, pErr.message)
    else console.log(`  ✅ Admin: ${u.email} (${u.role})`)
  }

  // ── Staff Users ──
  for (const u of DEMO_STAFF_USERS) {
    const userId = await ensureAuthUser(u.email, u.password, u.name)
    if (!userId) continue

    // Upsert profile
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: u.name,
      role: 'staff',
      department: u.department,
      is_active: true,
    }, { onConflict: 'id' })
    if (pErr) console.error(`    ❌ profiles for ${u.email}:`, pErr.message)

    // Upsert staff_profiles (PK is auto UUID, unique on user_id)
    // First check if a staff_profile already exists
    const { data: existingSp } = await supabase.from('staff_profiles')
      .select('id').eq('user_id', userId).maybeSingle()

    if (existingSp) {
      // Update existing
      const { error: spErr } = await supabase.from('staff_profiles').update({
        employee_id: u.employeeId,
        department: u.department,
        designation: u.designation,
        is_active: true,
      }).eq('user_id', userId)
      if (spErr) console.error(`    ❌ staff_profiles update for ${u.email}:`, spErr.message)
      else console.log(`  ✅ Staff: ${u.email} (${u.designation}) — updated`)
    } else {
      // Insert new
      const { error: spErr } = await supabase.from('staff_profiles').insert({
        user_id: userId,
        employee_id: u.employeeId,
        department: u.department,
        designation: u.designation,
        is_active: true,
      })
      if (spErr) console.error(`    ❌ staff_profiles insert for ${u.email}:`, spErr.message)
      else console.log(`  ✅ Staff: ${u.email} (${u.designation}) — created`)
    }
  }

  // ── Client Users ──
  for (const u of DEMO_CLIENT_USERS) {
    const userId = await ensureAuthUser(u.email, u.password, u.name)
    if (!userId) continue

    // Upsert profile
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: u.name,
      role: 'client',
      city: u.city,
      is_active: true,
    }, { onConflict: 'id' })
    if (pErr) console.error(`    ❌ profiles for ${u.email}:`, pErr.message)

    // Upsert clients table (PK is auto UUID, unique on user_id)
    const { data: existingClient } = await supabase.from('clients')
      .select('id').eq('user_id', userId).maybeSingle()

    if (existingClient) {
      const { error: cErr } = await supabase.from('clients').update({
        full_name: u.name,
        email: u.email,
        city: u.city,
        kyc_status: u.kycStatus,
        risk_profile: u.riskProfile,
        total_invested: u.totalInvested,
        is_active: true,
      }).eq('user_id', userId)
      if (cErr) console.error(`    ❌ clients update for ${u.email}:`, cErr.message)
      else console.log(`  ✅ Client: ${u.email} (${u.kycStatus}) — updated`)
    } else {
      const { error: cErr } = await supabase.from('clients').insert({
        user_id: userId,
        full_name: u.name,
        email: u.email,
        city: u.city,
        kyc_status: u.kycStatus,
        risk_profile: u.riskProfile,
        total_invested: u.totalInvested,
        is_active: true,
      })
      if (cErr) console.error(`    ❌ clients insert for ${u.email}:`, cErr.message)
      else console.log(`  ✅ Client: ${u.email} (${u.kycStatus}) — created`)
    }
  }
}

// ── Site Settings ───────────────────────────────────────────

async function seedSiteSettings() {
  console.log('\n📌 Seeding site settings…')

  const settings = [
    { key: 'site_name', value: 'GHL India Ventures', category: 'general', label: 'Site Name' },
    { key: 'site_tagline', value: 'Redefining Wealth. Reimagining Futures.', category: 'general', label: 'Tagline' },
    { key: 'site_description', value: "India's premier wealth management, real estate, and investment firm.", category: 'general', label: 'Description' },
    { key: 'meta_title', value: 'GHL India Ventures — Wealth Management & Investment Solutions', category: 'seo', label: 'Meta Title' },
    { key: 'meta_description', value: 'GHL India Ventures offers expert wealth management, real estate investment, and financial planning services across India.', category: 'seo', label: 'Meta Description' },
    { key: 'contact_email', value: 'info@ghlindia.com', category: 'contact', label: 'Contact Email' },
    { key: 'contact_phone', value: '+91 22 4000 1234', category: 'contact', label: 'Contact Phone' },
    { key: 'contact_address', value: 'One BKC, Bandra Kurla Complex, Mumbai 400051', category: 'contact', label: 'Address' },
    { key: 'social_linkedin', value: 'https://linkedin.com/company/ghlindia', category: 'social', label: 'LinkedIn' },
    { key: 'social_twitter', value: 'https://twitter.com/ghlindia', category: 'social', label: 'Twitter' },
    { key: 'social_instagram', value: 'https://instagram.com/ghlindia', category: 'social', label: 'Instagram' },
  ]

  const { error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'key' })
  if (error) {
    console.error('  ❌ site_settings:', error.message)
  } else {
    console.log(`  ✅ site_settings: ${settings.length} entries`)
  }
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log('🚀 GHL India Ventures — Seed Script')
  console.log('═'.repeat(50))
  console.log(`Target: ${url}`)

  await seedDemoUsers()
  await seedSiteSettings()

  console.log('\n' + '═'.repeat(50))
  console.log('✅ Seeding complete!')
  console.log('\nDemo credentials:')
  console.log('  Admin:  admin@ghlindia.com / admin123')
  console.log('  CEO:    ceo@ghlindia.com / ceo123')
  console.log('  Staff:  staff@ghlindia.com / staff123')
  console.log('  Field:  field@ghlindia.com / field123')
  console.log('  Client: client@ghlindia.com / client123')
  console.log('  Client: client2@ghlindia.com / client123')
}

main().catch(console.error)
