-- ============================================================
-- 003 · REVENUE & SUBSCRIPTIONS
-- ============================================================

-- ── Revenue Streams ──
CREATE TABLE revenue_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('management_fee','performance_fee','advisory','subscription','other')),
    client_id UUID REFERENCES clients(id),
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    frequency TEXT DEFAULT 'one_time' CHECK (frequency IN ('one_time','monthly','quarterly','annually')),
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','completed')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ──
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','quarterly','annually')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','expired')),
    start_date DATE NOT NULL,
    next_billing_date DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_revenue_type ON revenue_streams(type);
CREATE INDEX idx_revenue_client ON revenue_streams(client_id);
CREATE INDEX idx_revenue_status ON revenue_streams(status);
CREATE INDEX idx_revenue_created ON revenue_streams(created_at DESC);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_billing ON subscriptions(next_billing_date);
