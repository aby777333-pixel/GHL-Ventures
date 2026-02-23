/* ─────────────────────────────────────────────────────────────
   Seed Admin Data — Populates Supabase with existing mock data

   Run manually after setting up Supabase:
   npx ts-node --esm scripts/seed-admin-data.ts

   Requires SUPABASE_SERVICE_ROLE_KEY env var for admin access.
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

// ── Seed Functions ──────────────────────────────────────────

async function seedTable(table: string, data: any[]) {
  if (data.length === 0) {
    console.log(`  ⏭  ${table}: no data to seed`)
    return
  }

  const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' })
  if (error) {
    console.error(`  ❌ ${table}:`, error.message)
  } else {
    console.log(`  ✅ ${table}: ${data.length} rows`)
  }
}

// ── Demo Users ──────────────────────────────────────────────

const DEMO_ADMIN_USERS = [
  {
    email: 'admin@ghlindia.com',
    password: 'admin123',
    name: 'Rajesh Kumar',
    role: 'super_admin',
    department: 'Management',
  },
  {
    email: 'ceo@ghlindia.com',
    password: 'ceo123',
    name: 'Vikram Mehta',
    role: 'ceo',
    department: 'Executive',
  },
  {
    email: 'compliance@ghlindia.com',
    password: 'comp123',
    name: 'Priya Sharma',
    role: 'compliance_officer',
    department: 'Compliance',
  },
]

const DEMO_STAFF_USERS = [
  {
    email: 'staff@ghlindia.com',
    password: 'staff123',
    name: 'Ananya Singh',
    role: 'senior_cs',
    department: 'Customer Service',
    staffCode: 'GHL-CS-001',
  },
  {
    email: 'field@ghlindia.com',
    password: 'field123',
    name: 'Rahul Patel',
    role: 'field_agent',
    department: 'Field Operations',
    staffCode: 'GHL-FO-001',
  },
]

const DEMO_CLIENT_USERS = [
  {
    email: 'client@ghlindia.com',
    password: 'client123',
    name: 'Arun Mehta',
    riskProfile: 'moderate',
    kycStatus: 'verified',
    aum: 25000000,
    city: 'Mumbai',
  },
  {
    email: 'client2@ghlindia.com',
    password: 'client123',
    name: 'Sneha Kapoor',
    riskProfile: 'aggressive',
    kycStatus: 'verified',
    aum: 50000000,
    city: 'Delhi',
  },
]

async function seedDemoUsers() {
  console.log('\n📌 Creating demo users in Supabase Auth…')

  for (const user of [...DEMO_ADMIN_USERS, ...DEMO_STAFF_USERS, ...DEMO_CLIENT_USERS]) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name },
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`  ⏭  ${user.email}: already exists`)
      } else {
        console.error(`  ❌ ${user.email}:`, error.message)
      }
      continue
    }

    if (!data.user) continue
    const userId = data.user.id

    // Insert profile
    await supabase.from('profiles').upsert({
      id: userId,
      email: user.email,
      name: user.name,
      portal: DEMO_ADMIN_USERS.includes(user as any) ? 'admin'
        : DEMO_STAFF_USERS.includes(user as any) ? 'staff' : 'client',
    })

    // Insert portal-specific profile
    if (DEMO_ADMIN_USERS.includes(user as any)) {
      const u = user as typeof DEMO_ADMIN_USERS[0]
      await supabase.from('admin_profiles').upsert({
        id: userId,
        role: u.role,
        department: u.department,
      })
      console.log(`  ✅ Admin: ${u.email} (${u.role})`)
    } else if (DEMO_STAFF_USERS.includes(user as any)) {
      const u = user as typeof DEMO_STAFF_USERS[0]
      await supabase.from('staff_profiles').upsert({
        id: userId,
        role: u.role,
        department: u.department,
        staff_code: u.staffCode,
      })
      console.log(`  ✅ Staff: ${u.email} (${u.role})`)
    } else {
      const u = user as typeof DEMO_CLIENT_USERS[0]
      await supabase.from('client_profiles').upsert({
        id: userId,
        risk_profile: u.riskProfile,
        kyc_status: u.kycStatus,
        aum: u.aum,
        city: u.city,
      })
      console.log(`  ✅ Client: ${u.email} (${u.kycStatus})`)
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

  console.log('\n═'.repeat(50))
  console.log('✅ Seeding complete!')
  console.log('\nDemo credentials:')
  console.log('  Admin: admin@ghlindia.com / admin123')
  console.log('  Staff: staff@ghlindia.com / staff123')
  console.log('  Client: client@ghlindia.com / client123')
}

main().catch(console.error)
