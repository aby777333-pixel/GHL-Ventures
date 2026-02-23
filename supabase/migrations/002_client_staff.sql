-- ============================================================
-- 002 · CLIENT & STAFF TABLES
-- ============================================================

-- ── Staff Profiles ──
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE,
    department TEXT NOT NULL,
    designation TEXT,
    date_of_joining DATE,
    reporting_to UUID REFERENCES staff_profiles(id),
    skills TEXT[],
    certifications TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Clients ──
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    client_code TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    pan TEXT,
    aadhar_encrypted TEXT,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending','submitted','verified','rejected')),
    investor_type TEXT DEFAULT 'individual' CHECK (investor_type IN ('individual','huf','corporate','trust','nri')),
    risk_profile TEXT DEFAULT 'moderate' CHECK (risk_profile IN ('conservative','moderate','aggressive')),
    total_invested NUMERIC(15,2) DEFAULT 0,
    lifetime_value NUMERIC(15,2) DEFAULT 0,
    acquisition_source TEXT,
    assigned_rm UUID REFERENCES staff_profiles(id),
    tags TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Client Assignments (many-to-many) ──
CREATE TABLE client_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'relationship_manager',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, staff_id)
);

-- Indexes
CREATE INDEX idx_staff_department ON staff_profiles(department);
CREATE INDEX idx_staff_user ON staff_profiles(user_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_city ON clients(city);
CREATE INDEX idx_clients_rm ON clients(assigned_rm);
CREATE INDEX idx_clients_kyc ON clients(kyc_status);
CREATE INDEX idx_client_assignments_client ON client_assignments(client_id);
CREATE INDEX idx_client_assignments_staff ON client_assignments(staff_id);
