-- ============================================================
-- 005 · MARKETING CAMPAIGNS & LEADS
-- ============================================================

-- ── Campaigns ──
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email','social','search','display','event','content','referral','other')),
    status campaign_status DEFAULT 'draft',
    budget NUMERIC(12,2) DEFAULT 0,
    spent NUMERIC(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    target_audience TEXT,
    channels TEXT[],
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    revenue_attributed NUMERIC(15,2) DEFAULT 0,
    roi NUMERIC(8,2),
    cpc NUMERIC(8,2),
    cpl NUMERIC(8,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Leads ──
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    city TEXT,
    state TEXT,
    source lead_source DEFAULT 'website',
    status lead_status DEFAULT 'new',
    campaign_id UUID REFERENCES campaigns(id),
    assigned_to UUID REFERENCES staff_profiles(id),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    investment_interest TEXT,
    estimated_value NUMERIC(15,2),
    converted_client_id UUID REFERENCES clients(id),
    converted_at TIMESTAMPTZ,
    last_contacted TIMESTAMPTZ,
    next_follow_up TIMESTAMPTZ,
    tags TEXT[],
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Lead Activities ──
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('call','email','meeting','note','status_change','score_change')),
    description TEXT,
    performed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(type);
