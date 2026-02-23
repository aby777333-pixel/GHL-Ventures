-- ═══════════════════════════════════════════════════════════════
-- GHL India Ventures — Supabase Database Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Profiles (linked to auth.users) ──────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  portal TEXT NOT NULL CHECK (portal IN ('admin', 'staff', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'super-admin','admin','compliance-officer','fund-manager','manager',
    'marketing-manager','marketing-executive','sales','operations','hr','viewer'
  )),
  department TEXT,
  permissions JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'cs-lead','senior-cs-agent','cs-agent','relationship-manager',
    'field-sales-manager','field-sales-executive','site-inspector',
    'kyc-officer','operations-executive','hr-executive','general-employee','intern'
  )),
  staff_code TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  reporting_to UUID REFERENCES public.profiles(id),
  join_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','probation','notice-period','contract'))
);

CREATE TABLE IF NOT EXISTS public.client_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pan TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending','under-review','approved','rejected','expired')),
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active','frozen','suspended','closed')),
  risk_profile TEXT CHECK (risk_profile IN ('conservative','moderate','aggressive','speculative')),
  aum NUMERIC DEFAULT 0,
  invested_amount NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  assigned_rm UUID REFERENCES public.profiles(id),
  city TEXT,
  accredited BOOLEAN DEFAULT FALSE
);

-- ── 2. CRM ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT CHECK (source IN ('website','referral','cold-outreach','event','social-media','whatsapp')),
  stage TEXT DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','proposal','negotiation','won','lost')),
  value NUMERIC DEFAULT 0,
  probability INT DEFAULT 0,
  ai_score INT DEFAULT 0,
  assigned_to UUID REFERENCES public.profiles(id),
  next_follow_up DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep UUID NOT NULL REFERENCES public.profiles(id),
  deal_id UUID REFERENCES public.leads(id),
  client_name TEXT NOT NULL,
  deal_value NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
  period TEXT NOT NULL
);

-- ── 3. Compliance ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_profiles(id),
  type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','under-review','approved','rejected','expired')),
  reviewer_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('kyc','investment','document','access','payout')),
  requested_by TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  assigned_reviewer UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','escalated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.risk_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  title TEXT NOT NULL,
  description TEXT,
  affected_entity TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','escalated')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Finance ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  client_id UUID REFERENCES public.client_profiles(id),
  client_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  gst NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue')),
  type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  submitted_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid','reimbursed')),
  receipt_url TEXT,
  linked_visit UUID
);

CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_profiles(id),
  fund_name TEXT NOT NULL,
  fund_type TEXT NOT NULL,
  invested_amount NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  return_pct NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','matured','exited')),
  milestone INT DEFAULT 0,
  invested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_profiles(id),
  date DATE NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  fund TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed','pending','info')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. HR ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_title TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','on-leave','inactive')),
  join_date DATE NOT NULL,
  reporting_to UUID REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  type TEXT NOT NULL CHECK (type IN ('casual','sick','earned','comp-off','loss-of-pay')),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days NUMERIC NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by UUID REFERENCES public.profiles(id),
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present','absent','half-day','wfh','weekend','holiday','leave')),
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC,
  late_arrival BOOLEAN DEFAULT FALSE,
  location TEXT,
  UNIQUE(employee_id, date)
);

-- ── 6. Operations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.client_profiles(id),
  client_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in-progress','awaiting-client','awaiting-internal','resolved','closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  channel TEXT,
  escalation_level INT DEFAULT 0,
  csat_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client','agent','system')),
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal','low')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in-progress','blocked','done')),
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_by UUID REFERENCES public.profiles(id),
  due_date DATE,
  linked_client UUID REFERENCES public.client_profiles(id),
  linked_ticket UUID REFERENCES public.tickets(id),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','auto','escalation','admin')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT DEFAULT 'info' CHECK (type IN ('info','success','warning','critical')),
  title TEXT NOT NULL,
  message TEXT,
  module TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID NOT NULL REFERENCES public.profiles(id),
  to_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. Assets ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('digital','physical','license','certificate')),
  serial_number TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','maintenance','decommissioned')),
  purchase_date DATE NOT NULL,
  expiry_date DATE,
  value NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  file_url TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  size TEXT,
  version INT DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  access_roles TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. Realty Brokers ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.realty_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  rera_id TEXT,
  specialization TEXT CHECK (specialization IN ('residential','commercial','land','industrial','mixed-use')),
  city TEXT NOT NULL,
  status TEXT DEFAULT 'pending-verification' CHECK (status IN ('active','inactive','pending-verification','suspended')),
  total_deals INT DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  join_date DATE NOT NULL,
  last_active TIMESTAMPTZ,
  assigned_rm UUID REFERENCES public.profiles(id),
  tags TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.broker_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.realty_brokers(id),
  broker_name TEXT NOT NULL,
  source TEXT CHECK (source IN ('website','referral','direct','event')),
  type TEXT CHECK (type IN ('land','realty','partnership','listing')),
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','in-progress','closed','converted')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  assigned_to UUID REFERENCES public.profiles(id),
  property_type TEXT,
  location TEXT,
  estimated_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. Marketing ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  channels TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','live','paused','completed','archived')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  leads INT DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  owner UUID REFERENCES public.profiles(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 10. Content ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT,
  image_url TEXT,
  author TEXT DEFAULT 'GHL Research Team',
  read_time TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  helpful INT DEFAULT 0,
  not_helpful INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('policy-update','process-change','event','achievement','general')),
  posted_by UUID REFERENCES public.profiles(id),
  pinned BOOLEAN DEFAULT FALSE,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 11. Field Operations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.field_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_profiles(id),
  location TEXT NOT NULL,
  coordinates JSONB,
  type TEXT CHECK (type IN ('site','developer-office','client-meeting','investor-event','branch','other')),
  linked_entity TEXT,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  selfie_url TEXT,
  note TEXT,
  outcome TEXT
);

CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_profiles(id),
  site_name TEXT NOT NULL,
  address TEXT,
  coordinates JSONB,
  purpose TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','overdue')),
  duration INT,
  media_count INT DEFAULT 0,
  report_status TEXT CHECK (report_status IN ('draft','submitted','reviewed')),
  notes TEXT,
  linked_client UUID REFERENCES public.client_profiles(id),
  progress_percent INT DEFAULT 0
);

-- ── 12. AI ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  input JSONB,
  output JSONB,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realty_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- ── Helper function: Check if user is admin ─────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Helper function: Check if user is staff ─────────────────
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Profiles: Own + admin/staff read all ────────────────────
CREATE POLICY "Own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin reads all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Staff reads all profiles" ON public.profiles FOR SELECT USING (public.is_staff());
CREATE POLICY "Admin updates profiles" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- ── Admin profiles: Admin only ──────────────────────────────
CREATE POLICY "Admin reads admin profiles" ON public.admin_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin manages admin profiles" ON public.admin_profiles FOR ALL USING (public.is_admin());

-- ── Staff profiles: Staff reads own, admin reads all ────────
CREATE POLICY "Staff reads own" ON public.staff_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin reads staff profiles" ON public.staff_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Staff reads colleagues" ON public.staff_profiles FOR SELECT USING (public.is_staff());
CREATE POLICY "Admin manages staff" ON public.staff_profiles FOR ALL USING (public.is_admin());

-- ── Client profiles: Own + staff/admin ──────────────────────
CREATE POLICY "Client reads own" ON public.client_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Staff reads clients" ON public.client_profiles FOR SELECT USING (public.is_staff());
CREATE POLICY "Admin reads clients" ON public.client_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin manages clients" ON public.client_profiles FOR ALL USING (public.is_admin());

-- ── Leads: Staff + Admin ────────────────────────────────────
CREATE POLICY "Staff views leads" ON public.leads FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages leads" ON public.leads FOR ALL USING (public.is_admin());
CREATE POLICY "Staff creates leads" ON public.leads FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff updates leads" ON public.leads FOR UPDATE USING (public.is_staff());

-- ── KYC Documents: Client own + staff/admin ─────────────────
CREATE POLICY "Client sees own KYC" ON public.kyc_documents FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Staff sees KYC" ON public.kyc_documents FOR SELECT USING (public.is_staff());
CREATE POLICY "Admin sees all KYC" ON public.kyc_documents FOR SELECT USING (public.is_admin());
CREATE POLICY "Client uploads KYC" ON public.kyc_documents FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Admin manages KYC" ON public.kyc_documents FOR ALL USING (public.is_admin());
CREATE POLICY "Staff updates KYC" ON public.kyc_documents FOR UPDATE USING (public.is_staff());

-- ── Tickets: Client own + staff/admin ───────────────────────
CREATE POLICY "Client sees own tickets" ON public.tickets FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Staff sees tickets" ON public.tickets FOR SELECT USING (public.is_staff());
CREATE POLICY "Admin sees all tickets" ON public.tickets FOR SELECT USING (public.is_admin());
CREATE POLICY "Client creates tickets" ON public.tickets FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Staff manages tickets" ON public.tickets FOR ALL USING (public.is_staff());
CREATE POLICY "Admin manages tickets" ON public.tickets FOR ALL USING (public.is_admin());

-- ── Notifications: Own only ─────────────────────────────────
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Own notification update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ── Audit log: Admin reads, all insert ──────────────────────
CREATE POLICY "Admin reads audit" ON public.audit_log FOR SELECT USING (public.is_admin());
CREATE POLICY "All insert audit" ON public.audit_log FOR INSERT WITH CHECK (true);

-- ── Blog posts: Public reads published, admin manages ───────
CREATE POLICY "Public reads published" ON public.blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Admin manages blogs" ON public.blog_posts FOR ALL USING (public.is_admin());

-- ── Site settings: Public reads, admin manages ──────────────
CREATE POLICY "Public reads settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin manages settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- ── General staff/admin access for operational tables ────────
-- Employees
CREATE POLICY "Staff sees employees" ON public.employees FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages employees" ON public.employees FOR ALL USING (public.is_admin());

-- Approvals
CREATE POLICY "Staff sees approvals" ON public.approvals FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages approvals" ON public.approvals FOR ALL USING (public.is_admin());

-- Risk flags
CREATE POLICY "Staff sees flags" ON public.risk_flags FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages flags" ON public.risk_flags FOR ALL USING (public.is_admin());

-- Invoices
CREATE POLICY "Staff sees invoices" ON public.invoices FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages invoices" ON public.invoices FOR ALL USING (public.is_admin());

-- Expenses
CREATE POLICY "Staff sees expenses" ON public.expenses FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Staff creates expenses" ON public.expenses FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Admin manages expenses" ON public.expenses FOR ALL USING (public.is_admin());

-- Investments (client sees own)
CREATE POLICY "Client sees own investments" ON public.investments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Staff sees investments" ON public.investments FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages investments" ON public.investments FOR ALL USING (public.is_admin());

-- Transactions (client sees own)
CREATE POLICY "Client sees own transactions" ON public.transactions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Staff sees transactions" ON public.transactions FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages transactions" ON public.transactions FOR ALL USING (public.is_admin());

-- Messages
CREATE POLICY "Own messages" ON public.messages FOR SELECT USING (from_id = auth.uid() OR to_id = auth.uid());
CREATE POLICY "Send messages" ON public.messages FOR INSERT WITH CHECK (from_id = auth.uid());
CREATE POLICY "Admin sees all messages" ON public.messages FOR SELECT USING (public.is_admin());

-- Assets, documents, brokers, campaigns — admin/staff access
CREATE POLICY "Staff sees assets" ON public.assets FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages assets" ON public.assets FOR ALL USING (public.is_admin());

CREATE POLICY "Role-based documents" ON public.documents FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages documents" ON public.documents FOR ALL USING (public.is_admin());

CREATE POLICY "Staff sees brokers" ON public.realty_brokers FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages brokers" ON public.realty_brokers FOR ALL USING (public.is_admin());

CREATE POLICY "Staff sees inquiries" ON public.broker_inquiries FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages inquiries" ON public.broker_inquiries FOR ALL USING (public.is_admin());

CREATE POLICY "Staff sees campaigns" ON public.marketing_campaigns FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages campaigns" ON public.marketing_campaigns FOR ALL USING (public.is_admin());

-- Tasks
CREATE POLICY "Own tasks" ON public.tasks FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Admin sees all tasks" ON public.tasks FOR SELECT USING (public.is_admin());
CREATE POLICY "Staff sees team tasks" ON public.tasks FOR SELECT USING (public.is_staff());
CREATE POLICY "Admin manages tasks" ON public.tasks FOR ALL USING (public.is_admin());
CREATE POLICY "Staff creates tasks" ON public.tasks FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff updates tasks" ON public.tasks FOR UPDATE USING (assigned_to = auth.uid());

-- Commissions
CREATE POLICY "Staff sees commissions" ON public.commissions FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages commissions" ON public.commissions FOR ALL USING (public.is_admin());

-- KB articles, announcements — all can read
CREATE POLICY "All read KB" ON public.kb_articles FOR SELECT USING (true);
CREATE POLICY "Admin manages KB" ON public.kb_articles FOR ALL USING (public.is_admin());

CREATE POLICY "All read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admin manages announcements" ON public.announcements FOR ALL USING (public.is_admin());

-- Leave requests
CREATE POLICY "Own leave" ON public.leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);
CREATE POLICY "Staff sees leave" ON public.leave_requests FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Admin manages leave" ON public.leave_requests FOR ALL USING (public.is_admin());

-- Attendance
CREATE POLICY "Own attendance" ON public.attendance FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);
CREATE POLICY "Staff sees attendance" ON public.attendance FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Staff inserts attendance" ON public.attendance FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Admin manages attendance" ON public.attendance FOR ALL USING (public.is_admin());

-- Ticket messages
CREATE POLICY "Ticket participants" ON public.ticket_messages FOR SELECT USING (
  ticket_id IN (SELECT id FROM public.tickets WHERE client_id = auth.uid() OR assigned_to = auth.uid())
);
CREATE POLICY "Admin sees all messages" ON public.ticket_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Send ticket message" ON public.ticket_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Field operations
CREATE POLICY "Own checkins" ON public.field_checkins FOR SELECT USING (staff_id = auth.uid());
CREATE POLICY "Staff sees checkins" ON public.field_checkins FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Staff creates checkins" ON public.field_checkins FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "Own visits" ON public.site_visits FOR SELECT USING (staff_id = auth.uid());
CREATE POLICY "Staff sees visits" ON public.site_visits FOR SELECT USING (public.is_staff() OR public.is_admin());
CREATE POLICY "Staff creates visits" ON public.site_visits FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Admin manages visits" ON public.site_visits FOR ALL USING (public.is_admin());

-- AI results
CREATE POLICY "Own AI results" ON public.ai_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin sees AI results" ON public.ai_results FOR SELECT USING (public.is_admin());
CREATE POLICY "Users insert AI results" ON public.ai_results FOR INSERT WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKETS (create in Supabase Dashboard > Storage)
-- ═══════════════════════════════════════════════════════════════
-- kyc-documents (private)
-- user-avatars (public)
-- company-documents (private)
-- field-media (private)
-- blog-images (public)
-- marketing-assets (private)
