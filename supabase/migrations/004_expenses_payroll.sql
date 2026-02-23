-- ============================================================
-- 004 · EXPENSES & PAYROLL
-- ============================================================

-- ── Expenses ──
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    date DATE NOT NULL,
    vendor TEXT,
    invoice_number TEXT,
    receipt_url TEXT,
    status expense_status DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    department TEXT,
    budget_code TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payroll ──
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    basic_salary NUMERIC(12,2) NOT NULL,
    hra NUMERIC(12,2) DEFAULT 0,
    special_allowance NUMERIC(12,2) DEFAULT 0,
    bonus NUMERIC(12,2) DEFAULT 0,
    deductions JSONB DEFAULT '{}',
    gross_salary NUMERIC(12,2),
    net_salary NUMERIC(12,2),
    tax_deducted NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','processed','paid','cancelled')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, month)
);

-- Indexes
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_department ON expenses(department);
CREATE INDEX idx_payroll_staff ON payroll(staff_id);
CREATE INDEX idx_payroll_month ON payroll(month DESC);
CREATE INDEX idx_payroll_status ON payroll(status);
