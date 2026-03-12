-- ================================================================
-- GHL INDIA VENTURES — FULL SUPABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- 2. CUSTOM ENUM TYPES
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN CREATE TYPE portal_type AS ENUM ('admin', 'staff', 'client', 'investor', 'agent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kyc_status AS ENUM ('pending', 'under-review', 'approved', 'rejected', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE account_status AS ENUM ('active', 'frozen', 'suspended', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE risk_profile AS ENUM ('conservative', 'moderate', 'aggressive', 'balanced'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lead_source AS ENUM ('website', 'referral', 'cold-outreach', 'event', 'social-media', 'whatsapp'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open', 'in-progress', 'awaiting-client', 'awaiting-internal', 'resolved', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'normal', 'low'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_status AS ENUM ('todo', 'in-progress', 'blocked', 'done'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_source AS ENUM ('manual', 'auto', 'escalation', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected', 'paid', 'reimbursed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE approval_type AS ENUM ('kyc', 'investment', 'document', 'access', 'payout'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'escalated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE risk_severity AS ENUM ('critical', 'high', 'medium', 'low'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE asset_category AS ENUM ('digital', 'physical', 'license', 'certificate'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE chat_status AS ENUM ('waiting', 'assigned', 'active', 'resolved', 'closed', 'queued'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sender_type AS ENUM ('visitor', 'agent', 'system', 'bot'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rm_request_type AS ENUM ('chat', 'call', 'video', 'callback'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rm_request_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'missed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'live', 'paused', 'completed', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE broker_status AS ENUM ('active', 'inactive', 'pending-verification', 'suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'in-progress', 'closed', 'converted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE announcement_type AS ENUM ('policy-update', 'process-change', 'event', 'achievement', 'general'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE investment_status AS ENUM ('active', 'matured', 'exited'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE doc_permission AS ENUM ('view', 'download', 'edit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════
-- 3. CORE TABLES
-- ═══════════════════════════════════════════════════════════════

-- ----- PROFILES (extends auth.users) -----
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'client',
  portal portal_type DEFAULT 'client',
  avatar_url TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing profiles table from Supabase defaults)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portal portal_type DEFAULT 'client';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- ADMIN PROFILES -----
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  department TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- STAFF PROFILES -----
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  staff_code TEXT,
  designation TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  date_of_joining TIMESTAMPTZ,
  reporting_to UUID REFERENCES staff_profiles(id),
  skills TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS staff_code TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS designation TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS date_of_joining TIMESTAMPTZ;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS reporting_to UUID;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- CLIENTS -----
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  occupation TEXT,
  city TEXT,
  pan TEXT,
  kyc_status kyc_status DEFAULT 'pending',
  account_status account_status DEFAULT 'active',
  risk_profile risk_profile,
  aum NUMERIC DEFAULT 0,
  total_invested NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  assigned_rm UUID REFERENCES staff_profiles(id),
  accredited BOOLEAN DEFAULT false,
  acquisition_source TEXT,
  nominee_name TEXT,
  nominee_relation TEXT,
  nominee_pan TEXT,
  nominee_share NUMERIC,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS kyc_status kyc_status DEFAULT 'pending';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'active';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS risk_profile risk_profile;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS aum NUMERIC DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_invested NUMERIC DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_rm UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS accredited BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS acquisition_source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nominee_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nominee_relation TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nominee_pan TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nominee_share NUMERIC;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- CLIENT ASSIGNMENTS -----
CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'rm',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, staff_id)
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE client_assignments ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE client_assignments ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE client_assignments ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'rm';
ALTER TABLE client_assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE client_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 4. INVESTMENTS & FINANCE
-- ═══════════════════════════════════════════════════════════════

-- ----- INVESTMENTS -----
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  fund_type TEXT,
  invested_amount NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  return_pct NUMERIC DEFAULT 0,
  status investment_status DEFAULT 'active',
  milestone NUMERIC DEFAULT 0,
  invested_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE investments ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS fund_name TEXT NOT NULL DEFAULT '';
ALTER TABLE investments ADD COLUMN IF NOT EXISTS fund_type TEXT;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS invested_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS return_pct NUMERIC DEFAULT 0;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS status investment_status DEFAULT 'active';
ALTER TABLE investments ADD COLUMN IF NOT EXISTS milestone NUMERIC DEFAULT 0;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS invested_at TIMESTAMPTZ DEFAULT now();

-- ----- NAV HISTORY -----
CREATE TABLE IF NOT EXISTS nav_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  nav_value NUMERIC NOT NULL DEFAULT 0,
  units NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE nav_history ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE nav_history ADD COLUMN IF NOT EXISTS month DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE nav_history ADD COLUMN IF NOT EXISTS nav_value NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE nav_history ADD COLUMN IF NOT EXISTS units NUMERIC DEFAULT 0;
ALTER TABLE nav_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- TRANSACTIONS -----
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  fund TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fund TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- REVENUE STREAMS -----
CREATE TABLE IF NOT EXISTS revenue_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  amount NUMERIC DEFAULT 0,
  period TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE revenue_streams ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE revenue_streams ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE revenue_streams ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE revenue_streams ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE revenue_streams ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE revenue_streams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE revenue_streams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- EXPENSES -----
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  category TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  submitted_by UUID REFERENCES profiles(id),
  staff_id UUID REFERENCES staff_profiles(id),
  date DATE DEFAULT CURRENT_DATE,
  status expense_status DEFAULT 'pending',
  receipt_url TEXT,
  linked_visit UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status expense_status DEFAULT 'pending';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS linked_visit UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- INVOICES -----
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  client_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  gst NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status invoice_status DEFAULT 'draft',
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status invoice_status DEFAULT 'draft';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- COMMISSIONS -----
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_rep TEXT NOT NULL,
  deal_id TEXT,
  client_name TEXT NOT NULL,
  deal_value NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS sales_rep TEXT NOT NULL DEFAULT '';
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS deal_id TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT '';
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- KPIS -----
CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  period_type TEXT,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS period_type TEXT;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMPTZ DEFAULT now();

-- ----- FORECASTS -----
CREATE TABLE IF NOT EXISTS forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  value NUMERIC DEFAULT 0,
  period TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS confidence NUMERIC;
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 5. SALES & LEADS
-- ═══════════════════════════════════════════════════════════════

-- ----- LEADS -----
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT,
  last_name TEXT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  source lead_source,
  stage lead_stage DEFAULT 'new',
  status TEXT DEFAULT 'new',
  estimated_value NUMERIC DEFAULT 0,
  deal_value NUMERIC DEFAULT 0,
  score NUMERIC DEFAULT 0,
  ai_score NUMERIC DEFAULT 0,
  lead_quality TEXT,
  probability NUMERIC DEFAULT 0,
  assigned_to UUID REFERENCES profiles(id),
  next_follow_up TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  preferred_contact_method TEXT,
  response_time_minutes NUMERIC,
  converted_client_id UUID REFERENCES clients(id),
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source lead_source;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage lead_stage DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_value NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_quality TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS probability NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS response_time_minutes NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_client_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- LEAD SOURCE TRACKING -----
CREATE TABLE IF NOT EXISTS lead_source_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer_url TEXT,
  landing_page_url TEXT,
  landing_page_title TEXT,
  form_id TEXT,
  form_name TEXT,
  campaign_id TEXT,
  geo_city TEXT,
  geo_state TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS referrer_url TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS landing_page_title TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS form_id TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS form_name TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS campaign_id TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS geo_city TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS geo_state TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE lead_source_tracking ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- LEAD ACTIVITIES -----
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES profiles(id),
  performed_by_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT '';
ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS performed_by UUID;
ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS performed_by_name TEXT;
ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- LEAD FOLDER MAPPINGS -----
CREATE TABLE IF NOT EXISTS lead_folder_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL,
  folder_type TEXT DEFAULT 'sales',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE lead_folder_mappings ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE lead_folder_mappings ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE lead_folder_mappings ADD COLUMN IF NOT EXISTS folder_type TEXT DEFAULT 'sales';
ALTER TABLE lead_folder_mappings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- STAFF LEAD NOTIFICATIONS -----
CREATE TABLE IF NOT EXISTS staff_lead_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE staff_lead_notifications ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE staff_lead_notifications ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE staff_lead_notifications ADD COLUMN IF NOT EXISTS notification_type TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_lead_notifications ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE staff_lead_notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE staff_lead_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE staff_lead_notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE staff_lead_notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- CONTACT SUBMISSIONS -----
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  city TEXT,
  subject TEXT,
  message TEXT,
  page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS form_type TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- CAMPAIGNS -----
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  campaign_name TEXT,
  type TEXT,
  platform TEXT,
  channels TEXT[] DEFAULT '{}',
  status campaign_status DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  leads INTEGER DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  owner TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status campaign_status DEFAULT 'draft';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS spend NUMERIC DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS leads INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS roi NUMERIC DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- NEWSLETTER SUBSCRIBERS -----
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 6. SUPPORT & COMMUNICATION
-- ═══════════════════════════════════════════════════════════════

-- ----- TICKETS -----
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE,
  client_id UUID REFERENCES clients(id),
  client_name TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id),
  channel TEXT,
  escalation_level INTEGER DEFAULT 0,
  csat_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_number TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority ticket_priority DEFAULT 'medium';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status ticket_status DEFAULT 'open';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS csat_score NUMERIC;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ----- TASKS -----
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority DEFAULT 'normal',
  status task_status DEFAULT 'todo',
  assigned_to UUID REFERENCES profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  due_date DATE,
  linked_client UUID REFERENCES clients(id),
  linked_ticket UUID REFERENCES tickets(id),
  source task_source DEFAULT 'manual',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority task_priority DEFAULT 'normal';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status task_status DEFAULT 'todo';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS linked_client UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS linked_ticket UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source task_source DEFAULT 'manual';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- MESSAGES -----
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_id UUID NOT NULL REFERENCES profiles(id),
  to_id UUID NOT NULL REFERENCES profiles(id),
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS from_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS to_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- INTERNAL MESSAGES -----
CREATE TABLE IF NOT EXISTS internal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  user_role TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE internal_messages ADD COLUMN IF NOT EXISTS channel_id TEXT NOT NULL DEFAULT '';
ALTER TABLE internal_messages ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE internal_messages ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT '';
ALTER TABLE internal_messages ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE internal_messages ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE internal_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- NOTIFICATIONS -----
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  module TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type notification_type DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- ANNOUNCEMENTS -----
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type DEFAULT 'general',
  posted_by UUID REFERENCES profiles(id),
  pinned BOOLEAN DEFAULT false,
  department TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS type announcement_type DEFAULT 'general';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS posted_by UUID;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- EMAILS -----
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  template_name TEXT,
  status TEXT DEFAULT 'queued',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE emails ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS recipient_email TEXT NOT NULL DEFAULT '';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT '';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS body_html TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS body_text TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- CALLS -----
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_id UUID REFERENCES profiles(id),
  recipient_number TEXT NOT NULL,
  recipient_name TEXT,
  direction TEXT DEFAULT 'outbound',
  call_type TEXT,
  outcome TEXT,
  duration_seconds INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS caller_id UUID;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recipient_number TEXT NOT NULL DEFAULT '';
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_type TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 7. CHAT SYSTEM
-- ═══════════════════════════════════════════════════════════════

-- ----- CHAT SESSIONS -----
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT,
  visitor_name TEXT DEFAULT 'Visitor',
  visitor_email TEXT,
  client_id UUID REFERENCES clients(id),
  assigned_rep_id UUID REFERENCES profiles(id),
  status chat_status DEFAULT 'waiting',
  channel TEXT DEFAULT 'web',
  priority INTEGER DEFAULT 0,
  page_url TEXT,
  assigned_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  csat_rating TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS visitor_name TEXT DEFAULT 'Visitor';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS visitor_email TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS assigned_rep_id UUID;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS status chat_status DEFAULT 'waiting';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'web';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS csat_rating TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- CHAT MESSAGES -----
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type sender_type DEFAULT 'visitor',
  sender_id UUID,
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_type sender_type DEFAULT 'visitor';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- RM REQUESTS -----
CREATE TABLE IF NOT EXISTS rm_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  client_name TEXT NOT NULL,
  rm_id UUID REFERENCES profiles(id),
  request_type rm_request_type DEFAULT 'chat',
  status rm_request_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  notes TEXT,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT '';
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS rm_id UUID;
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS request_type rm_request_type DEFAULT 'chat';
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS status rm_request_status DEFAULT 'pending';
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE rm_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 8. DOCUMENTS & FILES
-- ═══════════════════════════════════════════════════════════════

-- ----- FOLDERS -----
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT,
  parent_id UUID REFERENCES folders(id),
  path TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  child_count INTEGER DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE folders ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE folders ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE folders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- DOCUMENTS -----
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  name TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER DEFAULT 0,
  entity_type TEXT,
  entity_id UUID,
  folder_id UUID REFERENCES folders(id),
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  owner_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  client_id UUID REFERENCES clients(id),
  version INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  access_roles TEXT[] DEFAULT '{}',
  access_level TEXT DEFAULT 'private',
  starred BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  is_confidential BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS access_roles TEXT[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'private';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- DOCUMENT VERSIONS -----
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  file_size INTEGER DEFAULT 0,
  change_summary TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS change_summary TEXT;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS uploaded_by_name TEXT;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- DOCUMENT SHARES -----
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_with_user UUID REFERENCES profiles(id),
  shared_with_role TEXT,
  permission doc_permission DEFAULT 'view',
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE document_shares ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE document_shares ADD COLUMN IF NOT EXISTS shared_with_user UUID;
ALTER TABLE document_shares ADD COLUMN IF NOT EXISTS shared_with_role TEXT;
ALTER TABLE document_shares ADD COLUMN IF NOT EXISTS permission doc_permission DEFAULT 'view';
ALTER TABLE document_shares ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE document_shares ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE document_shares ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE document_shares ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- DOCUMENT AUDIT LOG -----
CREATE TABLE IF NOT EXISTS document_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE document_audit_log ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE document_audit_log ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT '';
ALTER TABLE document_audit_log ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE document_audit_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- FILE RECORDS -----
CREATE TABLE IF NOT EXISTS file_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  original_name TEXT,
  file_path TEXT NOT NULL,
  bucket TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT,
  folder_id UUID REFERENCES folders(id),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  entity_type TEXT,
  entity_id UUID,
  portal TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_by_name TEXT,
  access_level TEXT DEFAULT 'private',
  is_confidential BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT '';
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS original_name TEXT;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS file_path TEXT NOT NULL DEFAULT '';
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS bucket TEXT NOT NULL DEFAULT '';
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS portal TEXT;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS uploaded_by_name TEXT;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'private';
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT false;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE file_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- FILE ACTIVITY LOG -----
CREATE TABLE IF NOT EXISTS file_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES file_records(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  performed_by_name TEXT,
  portal TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE file_activity_log ADD COLUMN IF NOT EXISTS file_id UUID;
ALTER TABLE file_activity_log ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE file_activity_log ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT '';
ALTER TABLE file_activity_log ADD COLUMN IF NOT EXISTS performed_by UUID;
ALTER TABLE file_activity_log ADD COLUMN IF NOT EXISTS performed_by_name TEXT;
ALTER TABLE file_activity_log ADD COLUMN IF NOT EXISTS portal TEXT;
ALTER TABLE file_activity_log ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE file_activity_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- STORAGE QUOTAS -----
CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  quota_bytes BIGINT DEFAULT 524288000, -- 500MB
  used_bytes BIGINT DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE storage_quotas ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT '';
ALTER TABLE storage_quotas ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE storage_quotas ADD COLUMN IF NOT EXISTS quota_bytes BIGINT DEFAULT 524288000;
ALTER TABLE storage_quotas ADD COLUMN IF NOT EXISTS used_bytes BIGINT DEFAULT 0;
ALTER TABLE storage_quotas ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0;
ALTER TABLE storage_quotas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE storage_quotas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 9. KYC & COMPLIANCE
-- ═══════════════════════════════════════════════════════════════

-- ----- KYC DOCUMENTS -----
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  type TEXT,
  file_name TEXT,
  file_url TEXT,
  status kyc_status DEFAULT 'pending',
  reviewer_id UUID REFERENCES profiles(id),
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT '';
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS status kyc_status DEFAULT 'pending';
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS reviewer_id UUID;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- APPROVALS -----
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type approval_type NOT NULL,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  description TEXT NOT NULL,
  priority ticket_priority DEFAULT 'medium',
  assigned_reviewer UUID REFERENCES profiles(id),
  status approval_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS type approval_type DEFAULT 'kyc';
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS requested_by UUID;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS priority ticket_priority DEFAULT 'medium';
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS assigned_reviewer UUID;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS status approval_status DEFAULT 'pending';
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ----- RISK FLAGS -----
CREATE TABLE IF NOT EXISTS risk_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  severity risk_severity NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  affected_entity TEXT,
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE risk_flags ADD COLUMN IF NOT EXISTS severity risk_severity DEFAULT 'medium';
ALTER TABLE risk_flags ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE risk_flags ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE risk_flags ADD COLUMN IF NOT EXISTS affected_entity TEXT;
ALTER TABLE risk_flags ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE risk_flags ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE risk_flags ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE risk_flags ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;


-- ═══════════════════════════════════════════════════════════════
-- 10. CONTENT & BLOG
-- ═══════════════════════════════════════════════════════════════

-- ----- BLOG POSTS -----
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  author TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  cover_image TEXT,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  read_time INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS read_time INTEGER;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- KB ARTICLES -----
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  author TEXT,
  helpful INTEGER DEFAULT 0,
  not_helpful INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS helpful INTEGER DEFAULT 0;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS not_helpful INTEGER DEFAULT 0;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- REPORT TEMPLATES -----
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  template_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- REPORT EXPORTS -----
CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES report_templates(id),
  name TEXT NOT NULL,
  type TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE report_exports ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE report_exports ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE report_exports ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE report_exports ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE report_exports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE report_exports ADD COLUMN IF NOT EXISTS generated_by UUID;
ALTER TABLE report_exports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 11. HR & PAYROLL
-- ═══════════════════════════════════════════════════════════════

-- ----- ATTENDANCE -----
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in TIMESTAMPTZ;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out TIMESTAMPTZ;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'present';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- LEAVE REQUESTS -----
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type TEXT NOT NULL DEFAULT '';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS end_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- PAYSLIPS -----
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  basic NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_pay NUMERIC DEFAULT 0,
  file_url TEXT,
  status TEXT DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS month DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS basic NUMERIC DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS allowances NUMERIC DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS deductions NUMERIC DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS net_pay NUMERIC DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'generated';
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 12. ANALYTICS & TRACKING
-- ═══════════════════════════════════════════════════════════════

-- ----- AUDIT LOGS -----
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  module TEXT,
  details JSONB DEFAULT '{}',
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT '';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- WEBSITE ANALYTICS -----
CREATE TABLE IF NOT EXISTS website_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT,
  page_title TEXT,
  visitor_id UUID,
  session_id UUID,
  referrer TEXT,
  utm_source TEXT,
  event_type TEXT,
  device_type TEXT,
  browser TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS page_path TEXT;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS page_title TEXT;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS visitor_id UUID;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE website_analytics ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- CLIENT INTERACTIONS -----
CREATE TABLE IF NOT EXISTS client_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  staff_id UUID REFERENCES staff_profiles(id),
  type TEXT NOT NULL,
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT '';
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- FIELD CHECKINS -----
CREATE TABLE IF NOT EXISTS field_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE field_checkins ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE field_checkins ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE field_checkins ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE field_checkins ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE field_checkins ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE field_checkins ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE field_checkins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- SITE VISITS -----
CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT,
  purpose TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS visit_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 13. BROKERS
-- ═══════════════════════════════════════════════════════════════

-- ----- REALTY BROKERS -----
CREATE TABLE IF NOT EXISTS realty_brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  rera_id TEXT,
  specialization TEXT,
  city TEXT,
  status broker_status DEFAULT 'active',
  total_deals INTEGER DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  last_active TIMESTAMPTZ,
  assigned_rm UUID REFERENCES profiles(id),
  tags TEXT[] DEFAULT '{}'
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS rera_id TEXT;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS status broker_status DEFAULT 'active';
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS total_deals INTEGER DEFAULT 0;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS total_value NUMERIC DEFAULT 0;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS commission NUMERIC DEFAULT 0;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS assigned_rm UUID;
ALTER TABLE realty_brokers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ----- BROKER INQUIRIES -----
CREATE TABLE IF NOT EXISTS broker_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID REFERENCES realty_brokers(id),
  broker_name TEXT NOT NULL,
  source TEXT,
  type TEXT,
  subject TEXT NOT NULL,
  message TEXT,
  status inquiry_status DEFAULT 'new',
  priority ticket_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  property_type TEXT,
  location TEXT,
  estimated_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS broker_id UUID;
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS broker_name TEXT NOT NULL DEFAULT '';
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT '';
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS status inquiry_status DEFAULT 'new';
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS priority ticket_priority DEFAULT 'medium';
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE broker_inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 14. AI & ASSETS
-- ═══════════════════════════════════════════════════════════════

-- ----- AI RESULTS -----
CREATE TABLE IF NOT EXISTS ai_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id TEXT NOT NULL,
  tool_name TEXT,
  portal TEXT,
  user_id UUID REFERENCES profiles(id),
  input_data JSONB,
  output_data JSONB,
  status TEXT DEFAULT 'success',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS tool_id TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS tool_name TEXT;
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS portal TEXT;
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS input_data JSONB;
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS output_data JSONB;
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success';
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- AI INSIGHTS -----
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT,
  title TEXT NOT NULL,
  content TEXT,
  confidence NUMERIC,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS confidence NUMERIC;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- ASSETS -----
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category asset_category DEFAULT 'digital',
  serial_number TEXT,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  purchase_date DATE,
  expiry_date DATE,
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS category asset_category DEFAULT 'digital';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ----- SITE SETTINGS -----
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB DEFAULT '{}',
  category TEXT,
  label TEXT,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS value JSONB DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----- API TOKENS -----
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (handles pre-existing table)
ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT '';
ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS access_token TEXT NOT NULL DEFAULT '';
ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- ═══════════════════════════════════════════════════════════════
-- 15. INDEXES
-- ═══════════════════════════════════════════════════════════════

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Staff
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff_profiles(department);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff_profiles(is_active);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_rm ON clients(assigned_rm);
CREATE INDEX IF NOT EXISTS idx_clients_kyc_status ON clients(kyc_status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_rep ON chat_sessions(assigned_rep_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_records_entity ON file_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_records_folder ON file_records(folder_id);

-- Investments
CREATE INDEX IF NOT EXISTS idx_investments_client ON investments(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_nav_history_client ON nav_history(client_id);

-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Blog
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_to_id ON messages(to_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id);

-- KYC
CREATE INDEX IF NOT EXISTS idx_kyc_client ON kyc_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_documents(status);


-- ═══════════════════════════════════════════════════════════════
-- 16. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_source_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_folder_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_lead_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rm_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE realty_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- HELPER: Check if user is admin
-- ═══════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS is_admin();
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role::text IN ('admin', 'super-admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- HELPER: Check if user is staff
DROP FUNCTION IF EXISTS is_staff();
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role::text IN ('admin', 'super-admin', 'staff', 'manager', 'cs-agent', 'rm')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- PROFILES
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "Admins manage all profiles" ON profiles;
CREATE POLICY "Admins manage all profiles" ON profiles FOR ALL USING (is_admin());

-- STAFF PROFILES
DROP POLICY IF EXISTS "Staff read own" ON staff_profiles;
CREATE POLICY "Staff read own" ON staff_profiles FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage staff" ON staff_profiles;
CREATE POLICY "Admins manage staff" ON staff_profiles FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Staff read directory" ON staff_profiles;
CREATE POLICY "Staff read directory" ON staff_profiles FOR SELECT USING (is_staff());

-- CLIENTS
DROP POLICY IF EXISTS "Clients read own" ON clients;
CREATE POLICY "Clients read own" ON clients FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Staff read clients" ON clients;
CREATE POLICY "Staff read clients" ON clients FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Admins manage clients" ON clients;
CREATE POLICY "Admins manage clients" ON clients FOR ALL USING (is_admin());

-- INVESTMENTS
DROP POLICY IF EXISTS "Clients read own investments" ON investments;
CREATE POLICY "Clients read own investments" ON investments FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage investments" ON investments;
CREATE POLICY "Admins manage investments" ON investments FOR ALL USING (is_admin());

-- NAV HISTORY
DROP POLICY IF EXISTS "Clients read own nav" ON nav_history;
CREATE POLICY "Clients read own nav" ON nav_history FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage nav" ON nav_history;
CREATE POLICY "Admins manage nav" ON nav_history FOR ALL USING (is_admin());

-- TRANSACTIONS
DROP POLICY IF EXISTS "Clients read own transactions" ON transactions;
CREATE POLICY "Clients read own transactions" ON transactions FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage transactions" ON transactions;
CREATE POLICY "Admins manage transactions" ON transactions FOR ALL USING (is_admin());

-- LEADS
DROP POLICY IF EXISTS "Staff read leads" ON leads;
CREATE POLICY "Staff read leads" ON leads FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Admins manage leads" ON leads;
CREATE POLICY "Admins manage leads" ON leads FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Staff update assigned leads" ON leads;
CREATE POLICY "Staff update assigned leads" ON leads FOR UPDATE
  USING (assigned_to = auth.uid() AND is_staff());

-- CONTACT SUBMISSIONS
DROP POLICY IF EXISTS "Staff read submissions" ON contact_submissions;
CREATE POLICY "Staff read submissions" ON contact_submissions FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Anyone can insert submissions" ON contact_submissions;
CREATE POLICY "Anyone can insert submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage submissions" ON contact_submissions;
CREATE POLICY "Admins manage submissions" ON contact_submissions FOR ALL USING (is_admin());

-- TICKETS
DROP POLICY IF EXISTS "Clients read own tickets" ON tickets;
CREATE POLICY "Clients read own tickets" ON tickets FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Staff read tickets" ON tickets;
CREATE POLICY "Staff read tickets" ON tickets FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Admins manage tickets" ON tickets;
CREATE POLICY "Admins manage tickets" ON tickets FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Clients create tickets" ON tickets;
CREATE POLICY "Clients create tickets" ON tickets FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- TASKS
DROP POLICY IF EXISTS "Staff read own tasks" ON tasks;
CREATE POLICY "Staff read own tasks" ON tasks FOR SELECT USING (assigned_to = auth.uid());
DROP POLICY IF EXISTS "Admins manage tasks" ON tasks;
CREATE POLICY "Admins manage tasks" ON tasks FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Staff update own tasks" ON tasks;
CREATE POLICY "Staff update own tasks" ON tasks FOR UPDATE USING (assigned_to = auth.uid());

-- MESSAGES
DROP POLICY IF EXISTS "Users read own messages" ON messages;
CREATE POLICY "Users read own messages" ON messages FOR SELECT
  USING (from_id = auth.uid() OR to_id = auth.uid());
DROP POLICY IF EXISTS "Users send messages" ON messages;
CREATE POLICY "Users send messages" ON messages FOR INSERT
  WITH CHECK (from_id = auth.uid());
DROP POLICY IF EXISTS "Admins read all messages" ON messages;
CREATE POLICY "Admins read all messages" ON messages FOR SELECT USING (is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Staff create notifications" ON notifications;
CREATE POLICY "Staff create notifications" ON notifications FOR INSERT WITH CHECK (is_staff());
DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;
CREATE POLICY "Admins manage notifications" ON notifications FOR ALL USING (is_admin());

-- CHAT SESSIONS
DROP POLICY IF EXISTS "Staff read chat sessions" ON chat_sessions;
CREATE POLICY "Staff read chat sessions" ON chat_sessions FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Visitors read own chat" ON chat_sessions;
CREATE POLICY "Visitors read own chat" ON chat_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone create chat" ON chat_sessions;
CREATE POLICY "Anyone create chat" ON chat_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Staff update chat sessions" ON chat_sessions;
CREATE POLICY "Staff update chat sessions" ON chat_sessions FOR UPDATE USING (is_staff());

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Read session messages" ON chat_messages;
CREATE POLICY "Read session messages" ON chat_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert chat messages" ON chat_messages;
CREATE POLICY "Insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- RM REQUESTS
DROP POLICY IF EXISTS "Clients create rm requests" ON rm_requests;
CREATE POLICY "Clients create rm requests" ON rm_requests FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Staff read rm requests" ON rm_requests;
CREATE POLICY "Staff read rm requests" ON rm_requests FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Staff update rm requests" ON rm_requests;
CREATE POLICY "Staff update rm requests" ON rm_requests FOR UPDATE USING (is_staff());

-- KYC DOCUMENTS
DROP POLICY IF EXISTS "Clients read own kyc" ON kyc_documents;
CREATE POLICY "Clients read own kyc" ON kyc_documents FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Clients upload kyc" ON kyc_documents;
CREATE POLICY "Clients upload kyc" ON kyc_documents FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Staff read kyc" ON kyc_documents;
CREATE POLICY "Staff read kyc" ON kyc_documents FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Admins manage kyc" ON kyc_documents;
CREATE POLICY "Admins manage kyc" ON kyc_documents FOR ALL USING (is_admin());

-- DOCUMENTS
DROP POLICY IF EXISTS "Staff read docs" ON documents;
CREATE POLICY "Staff read docs" ON documents FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Clients read own docs" ON documents;
CREATE POLICY "Clients read own docs" ON documents FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage docs" ON documents;
CREATE POLICY "Admins manage docs" ON documents FOR ALL USING (is_admin());

-- FILE RECORDS
DROP POLICY IF EXISTS "Staff read files" ON file_records;
CREATE POLICY "Staff read files" ON file_records FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Admins manage files" ON file_records;
CREATE POLICY "Admins manage files" ON file_records FOR ALL USING (is_admin());

-- BLOG POSTS (public read for published)
DROP POLICY IF EXISTS "Anyone reads published blogs" ON blog_posts;
CREATE POLICY "Anyone reads published blogs" ON blog_posts FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admins manage blogs" ON blog_posts;
CREATE POLICY "Admins manage blogs" ON blog_posts FOR ALL USING (is_admin());

-- KB ARTICLES
DROP POLICY IF EXISTS "Staff read kb" ON kb_articles;
CREATE POLICY "Staff read kb" ON kb_articles FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Admins manage kb" ON kb_articles;
CREATE POLICY "Admins manage kb" ON kb_articles FOR ALL USING (is_admin());

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Staff read announcements" ON announcements;
CREATE POLICY "Staff read announcements" ON announcements FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;
CREATE POLICY "Admins manage announcements" ON announcements FOR ALL USING (is_admin());

-- NEWSLETTER
DROP POLICY IF EXISTS "Anyone subscribes" ON newsletter_subscribers;
CREATE POLICY "Anyone subscribes" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins manage subscribers" ON newsletter_subscribers FOR ALL USING (is_admin());

-- AUDIT LOGS
DROP POLICY IF EXISTS "Admins read audit" ON audit_logs;
CREATE POLICY "Admins read audit" ON audit_logs FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "System inserts audit" ON audit_logs;
CREATE POLICY "System inserts audit" ON audit_logs FOR INSERT WITH CHECK (true);

-- ATTENDANCE / LEAVE / PAYSLIPS
DROP POLICY IF EXISTS "Staff read own attendance" ON attendance;
CREATE POLICY "Staff read own attendance" ON attendance FOR SELECT
  USING (staff_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage attendance" ON attendance;
CREATE POLICY "Admins manage attendance" ON attendance FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Staff read own leaves" ON leave_requests;
CREATE POLICY "Staff read own leaves" ON leave_requests FOR SELECT
  USING (staff_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Staff create leaves" ON leave_requests;
CREATE POLICY "Staff create leaves" ON leave_requests FOR INSERT
  WITH CHECK (staff_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage leaves" ON leave_requests;
CREATE POLICY "Admins manage leaves" ON leave_requests FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Staff read own payslips" ON payslips;
CREATE POLICY "Staff read own payslips" ON payslips FOR SELECT
  USING (staff_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage payslips" ON payslips;
CREATE POLICY "Admins manage payslips" ON payslips FOR ALL USING (is_admin());

-- SITE SETTINGS (admin only)
DROP POLICY IF EXISTS "Admins manage settings" ON site_settings;
CREATE POLICY "Admins manage settings" ON site_settings FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Staff read settings" ON site_settings;
CREATE POLICY "Staff read settings" ON site_settings FOR SELECT USING (is_staff());

-- REMAINING TABLES: admin-only default
DROP POLICY IF EXISTS "Admins manage approvals" ON approvals;
CREATE POLICY "Admins manage approvals" ON approvals FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Staff read approvals" ON approvals;
CREATE POLICY "Staff read approvals" ON approvals FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "Admins manage risk_flags" ON risk_flags;
CREATE POLICY "Admins manage risk_flags" ON risk_flags FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage revenue" ON revenue_streams;
CREATE POLICY "Admins manage revenue" ON revenue_streams FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage invoices" ON invoices;
CREATE POLICY "Admins manage invoices" ON invoices FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage commissions" ON commissions;
CREATE POLICY "Admins manage commissions" ON commissions FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage kpis" ON kpis;
CREATE POLICY "Admins manage kpis" ON kpis FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage forecasts" ON forecasts;
CREATE POLICY "Admins manage forecasts" ON forecasts FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage campaigns" ON campaigns;
CREATE POLICY "Admins manage campaigns" ON campaigns FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage assets" ON assets;
CREATE POLICY "Admins manage assets" ON assets FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage api_tokens" ON api_tokens;
CREATE POLICY "Admins manage api_tokens" ON api_tokens FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage brokers" ON realty_brokers;
CREATE POLICY "Admins manage brokers" ON realty_brokers FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage broker_inquiries" ON broker_inquiries;
CREATE POLICY "Admins manage broker_inquiries" ON broker_inquiries FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage ai_results" ON ai_results;
CREATE POLICY "Admins manage ai_results" ON ai_results FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage ai_insights" ON ai_insights;
CREATE POLICY "Admins manage ai_insights" ON ai_insights FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage analytics" ON website_analytics;
CREATE POLICY "Admins manage analytics" ON website_analytics FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Staff read analytics" ON website_analytics;
CREATE POLICY "Staff read analytics" ON website_analytics FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "Admins manage expenses" ON expenses;
CREATE POLICY "Admins manage expenses" ON expenses FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Staff read own expenses" ON expenses;
CREATE POLICY "Staff read own expenses" ON expenses FOR SELECT
  USING (staff_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage emails" ON emails;
CREATE POLICY "Admins manage emails" ON emails FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage calls" ON calls;
CREATE POLICY "Admins manage calls" ON calls FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage report_templates" ON report_templates;
CREATE POLICY "Admins manage report_templates" ON report_templates FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins manage report_exports" ON report_exports;
CREATE POLICY "Admins manage report_exports" ON report_exports FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Staff manage folders" ON folders;
CREATE POLICY "Staff manage folders" ON folders FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage doc_versions" ON document_versions;
CREATE POLICY "Staff manage doc_versions" ON document_versions FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage doc_shares" ON document_shares;
CREATE POLICY "Staff manage doc_shares" ON document_shares FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff read doc_audit" ON document_audit_log;
CREATE POLICY "Staff read doc_audit" ON document_audit_log FOR SELECT USING (is_staff());
DROP POLICY IF EXISTS "System insert doc_audit" ON document_audit_log;
CREATE POLICY "System insert doc_audit" ON document_audit_log FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Staff manage file_activity" ON file_activity_log;
CREATE POLICY "Staff manage file_activity" ON file_activity_log FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage storage_quotas" ON storage_quotas;
CREATE POLICY "Staff manage storage_quotas" ON storage_quotas FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage client_assignments" ON client_assignments;
CREATE POLICY "Staff manage client_assignments" ON client_assignments FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage lead_source" ON lead_source_tracking;
CREATE POLICY "Staff manage lead_source" ON lead_source_tracking FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage lead_activities" ON lead_activities;
CREATE POLICY "Staff manage lead_activities" ON lead_activities FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage lead_folders" ON lead_folder_mappings;
CREATE POLICY "Staff manage lead_folders" ON lead_folder_mappings FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage lead_notifs" ON staff_lead_notifications;
CREATE POLICY "Staff manage lead_notifs" ON staff_lead_notifications FOR SELECT
  USING (staff_id = auth.uid());
DROP POLICY IF EXISTS "System insert lead_notifs" ON staff_lead_notifications;
CREATE POLICY "System insert lead_notifs" ON staff_lead_notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Staff manage internal_msgs" ON internal_messages;
CREATE POLICY "Staff manage internal_msgs" ON internal_messages FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage interactions" ON client_interactions;
CREATE POLICY "Staff manage interactions" ON client_interactions FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "Staff manage checkins" ON field_checkins;
CREATE POLICY "Staff manage checkins" ON field_checkins FOR ALL
  USING (staff_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage checkins" ON field_checkins;
CREATE POLICY "Admins manage checkins" ON field_checkins FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Staff manage site_visits" ON site_visits;
CREATE POLICY "Staff manage site_visits" ON site_visits FOR ALL
  USING (staff_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage site_visits" ON site_visits;
CREATE POLICY "Admins manage site_visits" ON site_visits FOR ALL USING (is_admin());


-- ═══════════════════════════════════════════════════════════════
-- 17. AUTO-UPDATE TRIGGER
-- ═══════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS update_updated_at();
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_staff_updated ON staff_profiles;
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_clients_updated ON clients;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_leads_updated ON leads;
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_tickets_updated ON tickets;
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_chat_sessions_updated ON chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_rm_requests_updated ON rm_requests;
CREATE TRIGGER trg_rm_requests_updated BEFORE UPDATE ON rm_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_file_records_updated ON file_records;
CREATE TRIGGER trg_file_records_updated BEFORE UPDATE ON file_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_blog_posts_updated ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_kb_articles_updated ON kb_articles;
CREATE TRIGGER trg_kb_articles_updated BEFORE UPDATE ON kb_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_kyc_updated ON kyc_documents;
CREATE TRIGGER trg_kyc_updated BEFORE UPDATE ON kyc_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_broker_inquiries_updated ON broker_inquiries;
CREATE TRIGGER trg_broker_inquiries_updated BEFORE UPDATE ON broker_inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_newsletter_updated ON newsletter_subscribers;
CREATE TRIGGER trg_newsletter_updated BEFORE UPDATE ON newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════
-- 18. AUTO-CREATE PROFILE ON SIGNUP
-- ═══════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS handle_new_user();
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Fallback: insert with only id if columns mismatch
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═══════════════════════════════════════════════════════════════
-- 19. RPC FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- ----- CREATE VISITOR CHAT SESSION -----
DROP FUNCTION IF EXISTS create_visitor_chat_session(text,text,text,uuid,text,text);
CREATE OR REPLACE FUNCTION create_visitor_chat_session(
  p_visitor_id TEXT,
  p_visitor_name TEXT,
  p_visitor_email TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_channel TEXT DEFAULT 'web'
)
RETURNS SETOF chat_sessions AS $$
BEGIN
  RETURN QUERY
  INSERT INTO chat_sessions (visitor_id, visitor_name, visitor_email, client_id, page_url, channel, status)
  VALUES (p_visitor_id, p_visitor_name, p_visitor_email, p_client_id, p_page_url, p_channel, 'waiting')
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- AUTO ASSIGN VISITOR CHAT -----
DROP FUNCTION IF EXISTS auto_assign_visitor_chat(uuid);
CREATE OR REPLACE FUNCTION auto_assign_visitor_chat(p_session_id UUID)
RETURNS UUID AS $$
DECLARE
  v_rep_id UUID;
BEGIN
  -- Find available CS agent with fewest active sessions
  SELECT p.id INTO v_rep_id
  FROM profiles p
  JOIN staff_profiles sp ON sp.user_id = p.id
  WHERE p.role::text IN ('cs-agent', 'rm', 'manager', 'admin')
    AND sp.is_active = true
  ORDER BY (
    SELECT COUNT(*) FROM chat_sessions cs
    WHERE cs.assigned_rep_id = p.id AND cs.status IN ('assigned', 'active')
  ) ASC
  LIMIT 1;

  IF v_rep_id IS NOT NULL THEN
    UPDATE chat_sessions
    SET assigned_rep_id = v_rep_id,
        status = 'assigned',
        assigned_at = now()
    WHERE id = p_session_id;
  END IF;

  RETURN v_rep_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- GET VISITOR ACTIVE SESSION -----
DROP FUNCTION IF EXISTS get_visitor_active_session(text);
CREATE OR REPLACE FUNCTION get_visitor_active_session(p_visitor_id TEXT)
RETURNS SETOF chat_sessions AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM chat_sessions
  WHERE visitor_id = p_visitor_id
    AND status NOT IN ('resolved', 'closed')
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- SEND VISITOR CHAT MESSAGE -----
DROP FUNCTION IF EXISTS send_visitor_chat_message(uuid,sender_type,text,text);
CREATE OR REPLACE FUNCTION send_visitor_chat_message(
  p_session_id UUID,
  p_sender_type sender_type,
  p_sender_name TEXT DEFAULT NULL,
  p_message TEXT DEFAULT ''
)
RETURNS SETOF chat_messages AS $$
BEGIN
  -- Update last_message_at
  UPDATE chat_sessions SET last_message_at = now() WHERE id = p_session_id;

  RETURN QUERY
  INSERT INTO chat_messages (session_id, sender_type, sender_name, message)
  VALUES (p_session_id, p_sender_type, p_sender_name, p_message)
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- MARK CHAT SESSION ACTIVE -----
DROP FUNCTION IF EXISTS mark_chat_session_active(uuid);
CREATE OR REPLACE FUNCTION mark_chat_session_active(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chat_sessions
  SET status = 'active',
      first_response_at = COALESCE(first_response_at, now())
  WHERE id = p_session_id AND status = 'assigned';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- RESOLVE VISITOR CHAT SESSION -----
DROP FUNCTION IF EXISTS resolve_visitor_chat_session(uuid,text);
CREATE OR REPLACE FUNCTION resolve_visitor_chat_session(
  p_session_id UUID,
  p_rating TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE chat_sessions
  SET status = 'resolved',
      resolved_at = now(),
      csat_rating = p_rating
  WHERE id = p_session_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- FIND AVAILABLE RM FOR TRANSFER -----
DROP FUNCTION IF EXISTS find_available_rm_for_transfer();
CREATE OR REPLACE FUNCTION find_available_rm_for_transfer()
RETURNS TABLE(user_id UUID, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name
  FROM profiles p
  JOIN staff_profiles sp ON sp.user_id = p.id
  WHERE p.role::text IN ('rm', 'manager')
    AND sp.is_active = true
  ORDER BY (
    SELECT COUNT(*) FROM chat_sessions cs
    WHERE cs.assigned_rep_id = p.id AND cs.status IN ('assigned', 'active')
  ) ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- TRANSFER CHAT TO RM -----
DROP FUNCTION IF EXISTS transfer_chat_to_rm(uuid,uuid,text,text);
CREATE OR REPLACE FUNCTION transfer_chat_to_rm(
  p_session_id UUID,
  p_rm_user_id UUID,
  p_agent_name TEXT DEFAULT '',
  p_rm_name TEXT DEFAULT ''
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE chat_sessions
  SET assigned_rep_id = p_rm_user_id,
      status = 'assigned',
      assigned_at = now()
  WHERE id = p_session_id;

  -- Insert system message about transfer
  INSERT INTO chat_messages (session_id, sender_type, sender_name, message)
  VALUES (p_session_id, 'system', 'System',
    'Chat transferred from ' || p_agent_name || ' to ' || p_rm_name);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- GET VISITOR CHAT MESSAGES -----
DROP FUNCTION IF EXISTS get_visitor_chat_messages(uuid);
CREATE OR REPLACE FUNCTION get_visitor_chat_messages(p_session_id UUID)
RETURNS SETOF chat_messages AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM chat_messages
  WHERE session_id = p_session_id
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- GET VISITOR NEW MESSAGES -----
DROP FUNCTION IF EXISTS get_visitor_new_messages(uuid,timestamptz);
CREATE OR REPLACE FUNCTION get_visitor_new_messages(p_session_id UUID, p_since TIMESTAMPTZ)
RETURNS SETOF chat_messages AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM chat_messages
  WHERE session_id = p_session_id
    AND created_at > p_since
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- GET ACTIVE CHAT SESSIONS FOR STAFF -----
DROP FUNCTION IF EXISTS get_active_chat_sessions_staff(uuid);
CREATE OR REPLACE FUNCTION get_active_chat_sessions_staff(p_rep_id UUID DEFAULT NULL)
RETURNS SETOF chat_sessions AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM chat_sessions
  WHERE status IN ('waiting', 'assigned', 'active')
    AND (p_rep_id IS NULL OR assigned_rep_id = p_rep_id)
  ORDER BY
    CASE status WHEN 'waiting' THEN 0 WHEN 'assigned' THEN 1 ELSE 2 END,
    created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- GET EMPLOYEE DIRECTORY -----
DROP FUNCTION IF EXISTS get_employee_directory();
CREATE OR REPLACE FUNCTION get_employee_directory()
RETURNS TABLE(
  id UUID, user_id UUID, employee_id TEXT,
  name TEXT, email TEXT, phone TEXT,
  department TEXT, role TEXT, designation TEXT,
  join_date TIMESTAMPTZ, reporting_to UUID, reporting_to_name TEXT,
  skills TEXT[], certifications TEXT[],
  status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id, sp.user_id, sp.employee_id,
    p.full_name AS name, p.email, p.phone,
    sp.department, p.role, sp.designation,
    sp.date_of_joining AS join_date, sp.reporting_to,
    rp.full_name AS reporting_to_name,
    sp.skills, sp.certifications,
    sp.status, sp.created_at, sp.updated_at
  FROM staff_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  LEFT JOIN staff_profiles rsp ON rsp.id = sp.reporting_to
  LEFT JOIN profiles rp ON rp.id = rsp.user_id
  WHERE sp.is_active = true
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- GET ACTIVE RMS -----
DROP FUNCTION IF EXISTS get_active_rms();
CREATE OR REPLACE FUNCTION get_active_rms()
RETURNS TABLE(
  staff_id UUID, user_id UUID, full_name TEXT,
  designation TEXT, department TEXT, client_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id AS staff_id, sp.user_id, p.full_name,
    sp.designation, sp.department,
    (SELECT COUNT(*) FROM clients c WHERE c.assigned_rm = sp.id) AS client_count
  FROM staff_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.is_active = true
    AND p.role::text IN ('rm', 'manager', 'admin')
  ORDER BY client_count ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- AUTO ASSIGN RM TO CLIENT -----
DROP FUNCTION IF EXISTS auto_assign_rm_to_client(uuid);
CREATE OR REPLACE FUNCTION auto_assign_rm_to_client(p_client_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_rm_staff_id UUID;
  v_client_id UUID;
BEGIN
  -- Get client ID
  SELECT id INTO v_client_id FROM clients WHERE user_id = p_client_user_id;
  IF v_client_id IS NULL THEN RETURN NULL; END IF;

  -- Find RM with fewest clients
  SELECT sp.id INTO v_rm_staff_id
  FROM staff_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.is_active = true AND p.role::text IN ('rm', 'manager')
  ORDER BY (SELECT COUNT(*) FROM clients c WHERE c.assigned_rm = sp.id) ASC
  LIMIT 1;

  IF v_rm_staff_id IS NOT NULL THEN
    UPDATE clients SET assigned_rm = v_rm_staff_id WHERE id = v_client_id;

    INSERT INTO client_assignments (client_id, staff_id, role)
    VALUES (v_client_id, v_rm_staff_id, 'rm')
    ON CONFLICT (client_id, staff_id) DO NOTHING;
  END IF;

  RETURN v_rm_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- ASSIGN RM TO CLIENT -----
DROP FUNCTION IF EXISTS assign_rm_to_client(uuid,uuid);
CREATE OR REPLACE FUNCTION assign_rm_to_client(p_client_id UUID, p_rm_staff_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE clients SET assigned_rm = p_rm_staff_id WHERE id = p_client_id;

  INSERT INTO client_assignments (client_id, staff_id, role)
  VALUES (p_client_id, p_rm_staff_id, 'rm')
  ON CONFLICT (client_id, staff_id) DO UPDATE SET role = 'rm';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- 20. ENABLE REALTIME
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE tickets; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE leads; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE contact_submissions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE kyc_documents; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE tasks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE rm_requests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE investments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════
-- 21. STORAGE BUCKETS
-- Run these in Supabase Dashboard > Storage or via API
-- ═══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public) VALUES ('ghl-documents', 'ghl-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ghl-templates', 'ghl-templates', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ghl-media', 'ghl-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ghl-exports', 'ghl-exports', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ghl-temp-uploads', 'ghl-temp-uploads', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ghl-backups', 'ghl-backups', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-assets', 'marketing-assets', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users upload" ON storage.objects;
CREATE POLICY "Authenticated users upload" ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users read own" ON storage.objects;
CREATE POLICY "Authenticated users read own" ON storage.objects FOR SELECT
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media" ON storage.objects FOR SELECT
  USING (bucket_id IN ('ghl-media', 'avatars'));
DROP POLICY IF EXISTS "Admins manage all storage" ON storage.objects;
CREATE POLICY "Admins manage all storage" ON storage.objects FOR ALL
  USING ((SELECT is_admin()));


-- ═══════════════════════════════════════════════════════════════
-- DONE! Migration complete.
-- ═══════════════════════════════════════════════════════════════
